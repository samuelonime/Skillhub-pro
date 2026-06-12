// routes/skillDecay.js — Live skill decay monitor
// Calculates a freshness score (0–100) for each user skill by crossing:
//   (a) Days since the skill was last actively used / practiced
//   (b) Current job market demand velocity for that skill
// Emits alerts when a high-demand skill drops below a configurable threshold.
const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');

// ── Constants ─────────────────────────────────────────────────────────────────
const HALF_LIFE_DAYS    = 120; // skill loses ~50% freshness after 120 inactive days
const ALERT_THRESHOLD   = 40;  // below 40% freshness → alert
const CRITICAL_THRESHOLD = 20; // below 20% → critical

// ── Freshness model ───────────────────────────────────────────────────────────
// Exponential decay: freshness = 100 * (0.5 ^ (daysSinceUse / HALF_LIFE_DAYS))
// Boosted by: market demand (high demand = slower perceived decay)
function computeFreshness(daysSinceUse, demandScore) {
  // demand score 0–1 slows decay by up to 30%
  const effectiveHalfLife = HALF_LIFE_DAYS * (1 + demandScore * 0.3);
  const freshness = 100 * Math.pow(0.5, daysSinceUse / effectiveHalfLife);
  return Math.round(Math.max(0, Math.min(100, freshness)));
}

function freshnessLabel(score) {
  if (score >= 80) return 'fresh';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fading';
  if (score >= 20) return 'at-risk';
  return 'cold';
}

// ── GET /api/v1/skill-decay — full skill decay report ────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        skills: {
          select: { name: true, level: true, verified: true, updatedAt: true, createdAt: true },
          orderBy: { updatedAt: 'desc' },
        },
        enrollments: {
          where:  { completedAt: { not: null } },
          select: { completedAt: true, course: { select: { category: true } } },
          orderBy: { completedAt: 'desc' },
          take:   50,
        },
        certificates: {
          select: { skills: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
    if (!user) return error(res, 'User not found', 404);

    // Compute job demand per skill (count active jobs requiring it)
    const activeJobs = await prisma.job.findMany({
      where:  { status: 'active' },
      select: { skills: true, id: true },
    });

    const skillDemand = {};
    activeJobs.forEach(j => {
      j.skills.forEach(s => {
        const k = s.toLowerCase();
        skillDemand[k] = (skillDemand[k] || 0) + 1;
      });
    });
    const maxDemand = Math.max(...Object.values(skillDemand), 1);

    const now = Date.now();

    const decayReport = user.skills.map(skill => {
      const skillKey      = skill.name.toLowerCase();
      const demandCount   = skillDemand[skillKey] || 0;
      const demandScore   = demandCount / maxDemand; // 0–1

      // Last active: skill updatedAt OR most recent cert referencing this skill
      const certWithSkill = user.certificates.find(c =>
        c.skills.map(s => s.toLowerCase()).includes(skillKey)
      );
      const lastActive = new Date(Math.max(
        skill.updatedAt.getTime(),
        certWithSkill ? certWithSkill.updatedAt.getTime() : 0
      ));
      const daysSinceUse = Math.floor((now - lastActive.getTime()) / (24 * 60 * 60 * 1000));

      const freshness    = computeFreshness(daysSinceUse, demandScore);
      const label        = freshnessLabel(freshness);
      const isAlert      = freshness < ALERT_THRESHOLD;
      const isCritical   = freshness < CRITICAL_THRESHOLD;

      return {
        skill:       skill.name,
        level:       skill.level,
        verified:    skill.verified,
        freshness,
        label,
        daysSinceUse,
        demandCount,
        demandScore: Math.round(demandScore * 100),
        isAlert,
        isCritical,
        lastActive:  lastActive.toISOString(),
      };
    }).sort((a, b) => a.freshness - b.freshness); // coldest first

    // Top alerts: high-demand skills that are cold/at-risk
    const alerts = decayReport
      .filter(s => s.isAlert && s.demandCount > 0)
      .slice(0, 3)
      .map(s => ({
        skill:      s.skill,
        freshness:  s.freshness,
        demandCount: s.demandCount,
        message:    `${s.skill} appears in ${s.demandCount} active jobs but hasn't been used in ${s.daysSinceUse} days. A short refresher would re-qualify you.`,
      }));

    // Summary counts
    const summary = {
      total:   decayReport.length,
      fresh:   decayReport.filter(s => s.freshness >= 80).length,
      good:    decayReport.filter(s => s.freshness >= 60 && s.freshness < 80).length,
      fading:  decayReport.filter(s => s.freshness >= 40 && s.freshness < 60).length,
      atRisk:  decayReport.filter(s => s.freshness >= 20 && s.freshness < 40).length,
      cold:    decayReport.filter(s => s.freshness < 20).length,
    };

    return success(res, { skills: decayReport, alerts, summary });
  } catch (err) {
    console.error('[skill-decay]', err);
    return error(res, 'Failed to compute skill decay');
  }
});

// ── POST /api/v1/skill-decay/refresh/:skillName — reset decay timer ───────────
// Called when a user completes a course, quiz, or project touching this skill
router.post('/refresh/:skillName', authenticate, async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.skillName);

    const updated = await prisma.userSkill.updateMany({
      where: { userId: req.user.id, name: { equals: name, mode: 'insensitive' } },
      data:  { updatedAt: new Date() },
    });

    if (updated.count === 0) return error(res, 'Skill not found on your profile', 404);

    return success(res, { refreshed: true, skill: name, freshness: 100 });
  } catch (err) {
    console.error('[skill-decay/refresh]', err);
    return error(res, 'Failed to refresh skill');
  }
});

module.exports = router;