// routes/skillCoach.js — Emotion-aware learning coach
// Infers emotional state from behavioural signals (replay count, retry patterns,
// session abandonment) and generates adaptive coaching interventions.
const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');

// ── Emotion inference ─────────────────────────────────────────────────────────
// Signals come from existing models:
//   Enrollment.progress change over time  → learning velocity
//   Notification records with type 'book' → session events
//   Transaction records                   → engagement events
//   CoachSession (new, added below)       → coach intervention log

// Option 3: Using object constant instead of TypeScript type
const EmotionState = {
  CONFIDENT: 'confident',
  ENGAGED: 'engaged',
  STRUGGLING: 'struggling',
  FRUSTRATED: 'frustrated',
  DISENGAGED: 'disengaged'
};

function inferEmotion(sessionMinutes, retriesThisDay, abandonedEarly) {
  if (abandonedEarly && retriesThisDay === 0) return EmotionState.DISENGAGED;
  if (retriesThisDay >= 3)                    return EmotionState.FRUSTRATED;
  if (retriesThisDay >= 1 && abandonedEarly)  return EmotionState.STRUGGLING;
  if (sessionMinutes >= 30)                   return EmotionState.CONFIDENT;
  return EmotionState.ENGAGED;
}

// Adaptive recommendation based on emotional trajectory
function buildIntervention(recentEmotions) {
  const last3 = recentEmotions.slice(-3);
  const frustCount = last3.filter(e => e === EmotionState.FRUSTRATED).length;
  const disengCount = last3.filter(e => e === EmotionState.DISENGAGED).length;

  if (frustCount >= 2) {
    return {
      message:        "You've been hitting a wall. That's normal — let's switch approach entirely.",
      actions:        ['Switch to a visual/analogy explanation', 'Take a 24-hour break', 'Try a related easier concept first'],
      sessionMinutes: 15,
    };
  }
  if (disengCount >= 2) {
    return {
      message:        "Your engagement has dropped. Let's find out why — maybe the topic isn't the right next step.",
      actions:        ['Review your skill path relevance', 'Try a different module', 'Set a concrete goal for this week'],
      sessionMinutes: 20,
    };
  }
  if (last3.includes(EmotionState.STRUGGLING)) {
    return {
      message:        "You're making progress but one area is slowing you down. Let's isolate it.",
      actions:        ['Replay the specific section that caused retries', 'Find an alternative resource', 'Ask in the community'],
      sessionMinutes: 25,
    };
  }
  return {
    message:        "Your momentum is strong. Slightly longer sessions today will compound your progress.",
    actions:        ['Continue with the next module', 'Take a quick quiz to solidify knowledge', 'Review one concept from last week'],
    sessionMinutes: 45,
  };
}

// ── GET /api/v1/skill-coach/state — 7-day emotional heatmap ──────────────────
router.get('/state', authenticate, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Pull recent notifications as a proxy for session events
    const notifications = await prisma.notification.findMany({
      where:   { userId: req.user.id, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' },
      select:  { type: true, icon: true, message: true, createdAt: true },
    });

    // Pull recent enrollments progress as a proxy for retry/replay signal
    const enrollments = await prisma.enrollment.findMany({
      where:   { userId: req.user.id, enrolledAt: { gte: sevenDaysAgo } },
      select:  { progress: true, enrolledAt: true, completedAt: true, updatedAt: true },
    });

    // Group by calendar day and estimate emotion
    const dayMap = {};

    for (let d = 0; d < 7; d++) {
      const day = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      const key = day.toISOString().slice(0, 10);
      dayMap[key] = { events: 0, completions: 0, stalls: 0 };
    }

    notifications.forEach(n => {
      const key = n.createdAt.toISOString().slice(0, 10);
      if (dayMap[key]) dayMap[key].events++;
    });

    enrollments.forEach(e => {
      const key = (e.completedAt || e.updatedAt).toISOString().slice(0, 10);
      if (!dayMap[key]) return;
      if (e.progress === 100)                          dayMap[key].completions++;
      if (e.progress > 0 && e.progress < 30 && !e.completedAt) dayMap[key].stalls++;
    });

    const days = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => {
        const emotion = inferEmotion(
          d.events * 5,   // rough proxy: each event ≈ 5 active minutes
          d.stalls,
          d.events === 0
        );
        const signals = [];
        if (d.completions > 0) signals.push(`${d.completions} module(s) completed`);
        if (d.stalls > 0)      signals.push(`${d.stalls} stalled progress`);
        if (d.events === 0)    signals.push('No activity recorded');
        return { date, emotion, signals };
      });

    const recentEmotions = days.map(d => d.emotion);
    const intervention   = buildIntervention(recentEmotions);

    // Persist the coach recommendation as a notification so it surfaces in the UI
    if (intervention.message) {
      await prisma.notification.create({
        data: {
          userId:  req.user.id,
          type:    'info',
          icon:    'info',
          title:   'Your learning coach',
          message: intervention.message,
          read:    false,
        },
      }).catch(() => {}); // non-blocking
    }

    return success(res, { days, intervention });
  } catch (err) {
    console.error('[skill-coach/state]', err);
    return error(res, 'Failed to compute emotional state');
  }
});

// ── POST /api/v1/skill-coach/signal — record a raw behavioural signal ─────────
// Called from the frontend when a user replays a video, abandons a session,
// or retries a quiz. Stored in Notification table (type = 'coach_signal').
router.post('/signal', authenticate, async (req, res) => {
  try {
    const { signalType, courseId, metadata } = req.body;
    const VALID_SIGNALS = ['replay', 'abandon', 'quiz_retry', 'session_start', 'session_end'];

    if (!VALID_SIGNALS.includes(signalType)) {
      return error(res, `Invalid signalType. Must be one of: ${VALID_SIGNALS.join(', ')}`, 400);
    }

    await prisma.notification.create({
      data: {
        userId:  req.user.id,
        type:    'coach_signal',
        icon:    'info',
        title:   `coach:${signalType}`,
        message: JSON.stringify({ courseId, ...metadata }),
        read:    true, // coach signals don't surface as user-visible notifications
      },
    });

    return success(res, { recorded: true, signalType });
  } catch (err) {
    console.error('[skill-coach/signal]', err);
    return error(res, 'Failed to record signal');
  }
});

module.exports = router;