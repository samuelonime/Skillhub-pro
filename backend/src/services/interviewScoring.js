// Rule-based rubric scorer. No external API — purely deterministic analysis
// of the text the candidate typed: length, keyword coverage, STAR structure
// (for behavioral questions), and filler-word density.

const STAR_MARKERS = {
  situation: /\b(situation|context|when i|at my|while working|during)\b/i,
  task:      /\b(task|goal|needed to|responsible for|had to)\b/i,
  action:    /\b(i did|i built|i implemented|i created|i decided|i approached|i led|i took)\b/i,
  result:    /\b(result|outcome|as a result|this led to|ended up|improved|reduced|increased)\b/i,
};

const FILLER_WORDS = /\b(um|uh|like|actually|basically|literally|you know|kind of|sort of)\b/gi;

function countKeywordMatches(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase())).length;
}

function detectStarStructure(text) {
  const found = Object.entries(STAR_MARKERS).filter(([, re]) => re.test(text)).map(([k]) => k);
  return { found, count: found.length, total: 4 };
}

function scoreLength(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 15) return { score: 20, note: 'Answer is quite short — aim for more detail and a concrete example.' };
  if (words < 40) return { score: 60, note: 'Reasonable length, but a bit more depth would strengthen this answer.' };
  if (words <= 180) return { score: 100, note: 'Good level of detail.' };
  return { score: 75, note: 'Answer is a little long — practice being concise while keeping the key details.' };
}

function scoreFillerWords(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length || 1;
  const fillerCount = (text.match(FILLER_WORDS) || []).length;
  const density = fillerCount / words;
  if (density === 0) return { score: 100, note: 'No filler words detected — clear and confident phrasing.' };
  if (density < 0.03) return { score: 85, note: 'Minimal filler words.' };
  if (density < 0.07) return { score: 60, note: 'Some filler words present — try to reduce "um", "like", "actually".' };
  return { score: 35, note: 'Frequent filler words detected — practice pausing instead of using filler words.' };
}

function scoreKeywordRelevance(text, expectedKeywords) {
  const matches = countKeywordMatches(text, expectedKeywords);
  const pct = matches / Math.max(expectedKeywords.length, 1);
  return {
    score: Math.round(pct * 100),
    matched: matches,
    total: expectedKeywords.length,
    note: pct >= 0.6
      ? 'Answer covers most of the key concepts expected for this question.'
      : pct >= 0.3
      ? 'Answer touches on some relevant concepts, but misses several key points.'
      : 'Answer misses most of the key concepts this question is looking for — review the fundamentals.',
  };
}

// Main entry point: scores one answer against one question.
function scoreAnswer(question, answerText) {
  const text = (answerText || '').trim();
  if (!text) {
    return { score: 0, feedback: ['No answer was provided.'], breakdown: {} };
  }

  const lengthResult   = scoreLength(text);
  const fillerResult   = scoreFillerWords(text);
  const keywordResult  = scoreKeywordRelevance(text, question.expectedKeywords || []);

  let starResult = null;
  let weights = { length: 0.25, filler: 0.15, keyword: 0.60 };

  if (question.category === 'behavioral') {
    starResult = detectStarStructure(text);
    weights = { length: 0.15, filler: 0.10, keyword: 0.35, star: 0.40 };
  }

  const starScore = starResult ? (starResult.count / starResult.total) * 100 : 0;

  const overall = Math.round(
    lengthResult.score * weights.length +
    fillerResult.score * weights.filler +
    keywordResult.score * weights.keyword +
    (weights.star ? starScore * weights.star : 0)
  );

  const feedback = [lengthResult.note, fillerResult.note, keywordResult.note];
  if (starResult) {
    const missing = ['situation', 'task', 'action', 'result'].filter((k) => !starResult.found.includes(k));
    feedback.push(
      missing.length === 0
        ? 'Answer follows a clear Situation-Task-Action-Result structure.'
        : `Consider adding the following to strengthen the STAR structure: ${missing.join(', ')}.`
    );
  }

  return {
    score: Math.max(0, Math.min(100, overall)),
    feedback,
    breakdown: {
      length: lengthResult.score,
      fillerWords: fillerResult.score,
      keywordCoverage: keywordResult.score,
      ...(starResult ? { starStructure: Math.round(starScore) } : {}),
    },
  };
}

// Aggregates all answer scores into a final session report.
function buildFinalReport(scoredAnswers) {
  const overallScore = Math.round(
    scoredAnswers.reduce((sum, a) => sum + a.score, 0) / Math.max(scoredAnswers.length, 1)
  );

  const strengths = [];
  const improvements = [];

  scoredAnswers.forEach((a, i) => {
    if (a.score >= 75) strengths.push(`Question ${i + 1}: strong answer (${a.score}/100).`);
    if (a.score < 50) improvements.push(`Question ${i + 1}: needs work (${a.score}/100) — ${a.feedback[0]}`);
  });

  let verdict;
  if (overallScore >= 80) verdict = 'Strong performance — you are well-prepared for real interviews at this level.';
  else if (overallScore >= 60) verdict = 'Solid foundation with room to sharpen specific answers before a real interview.';
  else verdict = 'Focus on practicing structured answers (especially STAR format) and reviewing core concepts before your next attempt.';

  return { overallScore, verdict, strengths, improvements };
}

module.exports = { scoreAnswer, buildFinalReport };