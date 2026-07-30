const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, badRequest, error, notFound } = require('../utils/response');
const { getQuestionSet } = require('../data/interviewQuestions');
const { scoreAnswer, buildFinalReport } = require('../services/interviewScoring');

// ── POST /mock-interview/start — begin a new session ─────────────────────
// role is optional; falls back to the user's interestNiche/title.
router.post('/start', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { interestNiche: true, title: true },
    });
    const role = req.body?.role || user?.interestNiche || user?.title || 'Technical Professional';
    const questions = getQuestionSet(role);

    const session = await prisma.mockInterview.create({
      data: { userId: req.user.id, role, questions, answers: [] },
    });

    return success(res, {
      sessionId: session.id,
      role: session.role,
      totalQuestions: questions.length,
      currentQuestionIndex: 0,
      question: questions[0],
    }, 'Mock interview started');
  } catch (err) {
    console.error('Mock interview start error:', err);
    return error(res, 'Failed to start mock interview');
  }
});

// ── POST /mock-interview/:id/answer — submit an answer, get scored + next question ──
router.post('/:id/answer', authenticate, async (req, res) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) return badRequest(res, 'Answer text is required');

  try {
    const session = await prisma.mockInterview.findUnique({ where: { id: req.params.id } });
    if (!session || session.userId !== req.user.id) return notFound(res, 'Session not found');
    if (session.status === 'completed') return badRequest(res, 'This interview session is already completed');

    const questions = session.questions;
    const idx = session.currentQuestionIndex;
    if (idx >= questions.length) return badRequest(res, 'No more questions in this session');

    const currentQuestion = questions[idx];
    const result = scoreAnswer(currentQuestion, text);

    const answers = [...session.answers, {
      questionId: currentQuestion.id,
      text,
      score: result.score,
      feedback: result.feedback,
      breakdown: result.breakdown,
    }];

    const nextIndex = idx + 1;
    const isLastQuestion = nextIndex >= questions.length;

    let updateData = { answers, currentQuestionIndex: nextIndex };
    let finalReport = null;

    if (isLastQuestion) {
      finalReport = buildFinalReport(answers);
      updateData = {
        ...updateData,
        status: 'completed',
        overallScore: finalReport.overallScore,
        verdict: finalReport.verdict,
        completedAt: new Date(),
      };
    }

    await prisma.mockInterview.update({ where: { id: session.id }, data: updateData });

    if (isLastQuestion) {
      return success(res, {
        completed: true,
        answerResult: result,
        report: finalReport,
        answers,
      }, 'Mock interview completed');
    }

    return success(res, {
      completed: false,
      answerResult: result,
      currentQuestionIndex: nextIndex,
      question: questions[nextIndex],
    }, 'Answer scored');
  } catch (err) {
    console.error('Mock interview answer error:', err);
    return error(res, 'Failed to submit answer');
  }
});

// ── GET /mock-interview/:id — fetch full session state (resume in progress or view report) ──
router.get('/:id', authenticate, async (req, res) => {
  try {
    const session = await prisma.mockInterview.findUnique({ where: { id: req.params.id } });
    if (!session || session.userId !== req.user.id) return notFound(res, 'Session not found');
    return success(res, session);
  } catch (err) {
    return error(res, 'Failed to fetch session');
  }
});

// ── GET /mock-interview — list past sessions for the current user ────────
router.get('/', authenticate, async (req, res) => {
  try {
    const sessions = await prisma.mockInterview.findMany({
      where: { userId: req.user.id },
      orderBy: { startedAt: 'desc' },
      select: { id: true, role: true, status: true, overallScore: true, verdict: true, startedAt: true, completedAt: true },
    });
    return success(res, sessions);
  } catch (err) {
    return error(res, 'Failed to fetch sessions');
  }
});

module.exports = router;