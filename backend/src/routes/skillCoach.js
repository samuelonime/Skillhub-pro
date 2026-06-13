// routes/skillCoach.js — Emotion-aware learning coach (FIXED)
const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const EmotionState = {
  CONFIDENT: 'confident',
  ENGAGED: 'engaged',
  STRUGGLING: 'struggling',
  FRUSTRATED: 'frustrated',
  DISENGAGED: 'disengaged'
};

function inferEmotion(sessionMinutes, retriesThisDay, abandonedEarly) {
  if (abandonedEarly && retriesThisDay === 0) return EmotionState.DISENGAGED;
  if (retriesThisDay >= 3) return EmotionState.FRUSTRATED;
  if (retriesThisDay >= 1 && abandonedEarly) return EmotionState.STRUGGLING;
  if (sessionMinutes >= 30) return EmotionState.CONFIDENT;
  return EmotionState.ENGAGED;
}

function buildIntervention(recentEmotions) {
  const last3 = recentEmotions.slice(-3);
  const frustCount = last3.filter(e => e === EmotionState.FRUSTRATED).length;
  const disengCount = last3.filter(e => e === EmotionState.DISENGAGED).length;

  if (frustCount >= 2) {
    return {
      message: "You've been hitting a wall. That's normal — let's switch approach entirely.",
      actions: ['Switch to a visual/analogy explanation', 'Take a 24-hour break', 'Try a related easier concept first'],
      sessionMinutes: 15,
    };
  }
  if (disengCount >= 2) {
    return {
      message: "Your engagement has dropped. Let's find out why — maybe the topic isn't the right next step.",
      actions: ['Review your skill path relevance', 'Try a different module', 'Set a concrete goal for this week'],
      sessionMinutes: 20,
    };
  }
  if (last3.includes(EmotionState.STRUGGLING)) {
    return {
      message: "You're making progress but one area is slowing you down. Let's isolate it.",
      actions: ['Replay the specific section that caused retries', 'Find an alternative resource', 'Ask in the community'],
      sessionMinutes: 25,
    };
  }
  return {
    message: "Your momentum is strong. Slightly longer sessions today will compound your progress.",
    actions: ['Continue with the next module', 'Take a quick quiz to solidify knowledge', 'Review one concept from last week'],
    sessionMinutes: 45,
  };
}

// ── GET /api/v1/skill-coach/state — 7-day emotional heatmap (FIXED) ──────────────────
router.get('/state', authenticate, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch notifications with error handling
    let notifications = [];
    let enrollments = [];
    
    try {
      notifications = await prisma.notification.findMany({
        where: { userId: req.user.id, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'asc' },
        select: { type: true, icon: true, message: true, createdAt: true },
      });
    } catch (err) {
      console.warn('[skill-coach] Could not fetch notifications:', err.message);
      notifications = [];
    }

    try {
      enrollments = await prisma.enrollment.findMany({
        where: { userId: req.user.id },
        select: { 
          progress: true, 
          enrolledAt: true, 
          completedAt: true, 
          updatedAt: true 
        },
      });
    } catch (err) {
      console.warn('[skill-coach] Could not fetch enrollments:', err.message);
      enrollments = [];
    }

    // Initialize last 7 days
    const dayMap = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      dayMap[key] = { 
        events: 0, 
        completions: 0, 
        stalls: 0,
        date: key 
      };
    }

    // Process notifications
    notifications.forEach(n => {
      if (n && n.createdAt) {
        const key = n.createdAt.toISOString().split('T')[0];
        if (dayMap[key]) {
          dayMap[key].events++;
        }
      }
    });

    // Process enrollments - FIXED: handle null dates properly
    enrollments.forEach(e => {
      // Find the most recent date among possible fields
      let targetDate = null;
      if (e.completedAt) targetDate = e.completedAt;
      else if (e.updatedAt) targetDate = e.updatedAt;
      else if (e.enrolledAt) targetDate = e.enrolledAt;
      
      if (targetDate) {
        const key = targetDate.toISOString().split('T')[0];
        if (dayMap[key]) {
          if (e.progress === 100) {
            dayMap[key].completions++;
          }
          if (e.progress > 0 && e.progress < 30 && !e.completedAt) {
            dayMap[key].stalls++;
          }
        }
      }
    });

    // Build days array with emotions
    const days = Object.values(dayMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => {
        const emotion = inferEmotion(
          day.events * 5,
          day.stalls,
          day.events === 0
        );
        
        const signals = [];
        if (day.completions > 0) signals.push(`${day.completions} module(s) completed`);
        if (day.stalls > 0) signals.push(`${day.stalls} stalled progress`);
        if (day.events === 0) signals.push('No activity recorded');
        
        return { 
          date: day.date, 
          emotion, 
          signals 
        };
      });

    const recentEmotions = days.map(d => d.emotion);
    const intervention = buildIntervention(recentEmotions);

    // Create notification only for non-default interventions
    const isDefaultIntervention = intervention.message === "Your momentum is strong. Slightly longer sessions today will compound your progress.";
    
    if (intervention && intervention.message && !isDefaultIntervention) {
      try {
        await prisma.notification.create({
          data: {
            userId: req.user.id,
            type: 'info',
            icon: 'info',
            title: 'Your learning coach',
            message: intervention.message,
            read: false,
          },
        });
      } catch (err) {
        console.warn('[skill-coach] Could not create notification:', err.message);
        // Non-blocking - continue even if notification fails
      }
    }

    // Return success with data
    return success(res, { 
      days, 
      intervention,
      _meta: {
        hasData: days.length > 0,
        notificationsCount: notifications.length,
        enrollmentsCount: enrollments.length
      }
    });
    
  } catch (err) {
    console.error('[skill-coach/state] Critical error:', err);
    console.error('[skill-coach/state] Error stack:', err.stack);
    
    // Return graceful error with empty data to prevent frontend crash
    return success(res, { 
      days: [], 
      intervention: null,
      _error: 'Unable to compute emotional state',
      _message: err.message
    });
  }
});

// ── POST /api/v1/skill-coach/signal — record a raw behavioural signal ─────────
router.post('/signal', authenticate, async (req, res) => {
  try {
    const { signalType, courseId, metadata } = req.body;
    const VALID_SIGNALS = ['replay', 'abandon', 'quiz_retry', 'session_start', 'session_end'];

    if (!VALID_SIGNALS.includes(signalType)) {
      return error(res, `Invalid signalType. Must be one of: ${VALID_SIGNALS.join(', ')}`, 400);
    }

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'coach_signal',
        icon: 'info',
        title: `coach:${signalType}`,
        message: JSON.stringify({ courseId, ...(metadata || {}) }),
        read: true,
      },
    });

    return success(res, { recorded: true, signalType });
  } catch (err) {
    console.error('[skill-coach/signal]', err);
    return error(res, 'Failed to record signal');
  }
});

module.exports = router;