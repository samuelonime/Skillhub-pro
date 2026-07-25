// utils/skillDecayAnalyzer.js — SkillHub's own skill-decay reasoning engine.
//
// This is NOT a wrapper around an external LLM (Gemini/Groq/OpenAI/etc).
// It is a self-contained rule + scoring system that classifies intent,
// ranks skills by urgency, and composes an answer from templates built
// from the user's real decay data. Zero external API calls, zero API
// keys, zero per-request cost, fully deterministic and auditable.

// ── Intent classification ────────────────────────────────────────────────────
// Lightweight keyword scoring — no ML model needed for a domain this narrow.
const INTENTS = [
  {
    name: 'refresh_plan',
    keywords: ['plan', 'refresh', 'roadmap', 'schedule', '30-day', '30 day', 'week', 'this week', 'start'],
  },
  {
    name: 'at_risk',
    keywords: ['at risk', 'at-risk', 'risk', 'worst', 'weak', 'weakest', 'losing', 'cold', 'critical', 'urgent'],
  },
  {
    name: 'explain_one',
    keywords: ['explain', 'why', 'what happened', 'understand', 'decay on'],
  },
  {
    name: 'strengths',
    keywords: ['strong', 'strength', 'good', 'fresh', 'best', 'doing well'],
  },
  {
    name: 'demand',
    keywords: ['demand', 'market', 'job', 'jobs', 'hire', 'employer', 'worth'],
  },
  {
    name: 'overview',
    keywords: ['overview', 'summary', 'how am i doing', 'status', 'overall'],
  },
];

function classifyIntent(question) {
  const q = question.toLowerCase();
  let best = { name: 'overview', score: 0 };
  for (const intent of INTENTS) {
    const score = intent.keywords.reduce((acc, kw) => acc + (q.includes(kw) ? 1 : 0), 0);
    if (score > best.score) best = { name: intent.name, score };
  }
  return best.name;
}

// Try to find a specific skill the user named in their question, so
// "explain the decay on X" and "is Y still worth it" work naturally.
function findMentionedSkill(question, skills) {
  const q = question.toLowerCase();
  return skills.find(s => q.includes(s.skill.toLowerCase())) || null;
}

// ── Ranking helpers ──────────────────────────────────────────────────────────
function urgencyScore(s) {
  // High demand + low freshness = most urgent to refresh.
  return (100 - s.freshness) * 0.6 + s.demandScore * 0.4;
}

function topAtRisk(skills, n = 3) {
  return [...skills]
    .filter(s => s.freshness < 60)
    .sort((a, b) => urgencyScore(b) - urgencyScore(a))
    .slice(0, n);
}

function topStrengths(skills, n = 3) {
  return [...skills]
    .filter(s => s.freshness >= 70)
    .sort((a, b) => b.freshness - a.freshness)
    .slice(0, n);
}

function topDemand(skills, n = 3) {
  return [...skills].sort((a, b) => b.demandCount - a.demandCount).slice(0, n);
}

// ── Answer composers (one per intent) ───────────────────────────────────────

function composeOverview(skills, summary) {
  const total = summary.total ?? skills.length;
  if (!total) return "You don't have any tracked skills yet — add some from your profile and I'll start monitoring their freshness.";

  const risky = (summary.atRisk ?? 0) + (summary.cold ?? 0);
  const healthy = (summary.fresh ?? 0) + (summary.good ?? 0);

  let lead;
  if (risky === 0) {
    lead = `You're in solid shape — all ${total} tracked skills are fresh or holding steady.`;
  } else if (risky <= 2) {
    lead = `Overall you're doing well: ${healthy} of ${total} skills are fresh or good, with just ${risky} slipping.`;
  } else {
    lead = `${risky} of your ${total} tracked skills are fading or cold — worth a look this week.`;
  }

  const worst = topAtRisk(skills, 1)[0];
  const tail = worst
    ? ` ${worst.skill} is the one to watch first — ${worst.freshness}% freshness after ${worst.daysSinceUse} days, and it shows up in ${worst.demandCount} active job listings.`
    : '';

  return lead + tail;
}

function composeAtRisk(skills) {
  const risky = topAtRisk(skills, 3);
  if (!risky.length) return "Nothing is actually at risk right now — your tracked skills are all holding at 60%+ freshness. Good place to be.";

  const lines = risky.map(s =>
    `${s.skill}: ${s.freshness}% freshness, unused for ${s.daysSinceUse} days` +
    (s.demandCount > 0 ? `, and it's in demand — ${s.demandCount} active job listings need it.` : '.')
  );

  return `Here's what's most urgent, ranked by how much it'll cost you to keep ignoring it:\n- ${lines.join('\n- ')}`;
}

function composeStrengths(skills) {
  const strong = topStrengths(skills, 3);
  if (!strong.length) return "Nothing has crossed the 'fresh' threshold yet — that's normal early on. Keep using your top skills regularly and they'll climb.";

  const lines = strong.map(s => `${s.skill} (${s.freshness}% freshness, ${s.verified ? 'verified' : 'unverified'})`);
  return `Your strongest skills right now: ${lines.join(', ')}. These are holding up well — no action needed, just keep them in rotation.`;
}

function composeDemand(skills) {
  const demanded = topDemand(skills, 3).filter(s => s.demandCount > 0);
  if (!demanded.length) return "None of your tracked skills are matching active job listings right now — that could mean the market's shifted, or it's worth tracking a few in-demand skills you don't have yet.";

  const lines = demanded.map(s => `${s.skill} — ${s.demandCount} active listings, currently at ${s.freshness}% freshness`);
  const needsWork = demanded.find(s => s.freshness < 60);
  const tail = needsWork
    ? ` ${needsWork.skill} is your biggest opportunity: high demand, but it's fading — refreshing it would pay off fastest.`
    : ' Good news: your most in-demand skills are also your freshest ones.';

  return `Highest job-market demand among your skills:\n- ${lines.join('\n- ')}\n${tail}`;
}

function composeExplainOne(skill) {
  if (!skill) return "Tell me which skill you'd like explained and I'll break down its decay curve.";

  const demandLine = skill.demandCount > 0
    ? `It appears in ${skill.demandCount} active job listings (demand score ${skill.demandScore}%), which is slowing its decay slightly but not stopping it.`
    : `It's not currently appearing in active job listings, which means its decay is running at the standard rate.`;

  return `${skill.skill} is at ${skill.freshness}% freshness (${skill.label}), last actively used ${skill.daysSinceUse} days ago. ${demandLine} ${
    skill.freshness < 40
      ? `At this level it's worth a real refresher, not just a quick review.`
      : skill.freshness < 70
      ? `It's fading but not urgent — a short refresher would top it back up.`
      : `It's holding up fine — no action needed yet.`
  }`;
}

function composeRefreshPlan(skills) {
  const risky = topAtRisk(skills, 4);
  if (!risky.length) {
    return "You don't need a refresher plan right now — nothing's below 60% freshness. Check back in a few weeks.";
  }

  const week1 = risky.slice(0, 2);
  const week2 = risky.slice(2, 4);

  const fmt = (arr) => arr.map(s => `${s.skill} (${s.freshness}% → aim to re-verify)`).join(', ');

  let plan = `A focused 30-day refresher, ordered by urgency:\n`;
  plan += `Week 1–2: ${fmt(week1)}.`;
  if (week2.length) plan += ` Week 3–4: ${fmt(week2)}.`;
  plan += ` For each one: redo a project or exercise that uses it, then hit "refresh" on the skill once you've actually used it — that resets the decay timer.`;

  return plan;
}

// ── Public entry point ──────────────────────────────────────────────────────
/**
 * Analyze a question against the user's real decay data, entirely in-process.
 * @param {string} question
 * @param {Array}  skills   — the decay report array (same shape as GET /skill-decay)
 * @param {Object} summary  — the decay summary object
 * @returns {{ answer: string, intent: string }}
 */
function analyze(question, skills = [], summary = {}) {
  const intent = classifyIntent(question || '');
  const mentioned = findMentionedSkill(question || '', skills);

  let answer;
  if (mentioned && (intent === 'explain_one' || intent === 'overview')) {
    answer = composeExplainOne(mentioned);
  } else {
    switch (intent) {
      case 'at_risk':      answer = composeAtRisk(skills); break;
      case 'strengths':    answer = composeStrengths(skills); break;
      case 'demand':       answer = composeDemand(skills); break;
      case 'explain_one':  answer = composeExplainOne(mentioned); break;
      case 'refresh_plan': answer = composeRefreshPlan(skills); break;
      default:             answer = composeOverview(skills, summary);
    }
  }

  return { answer, intent };
}

module.exports = { analyze, classifyIntent };