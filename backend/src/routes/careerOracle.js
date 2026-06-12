// routes/careerOracle.js — Career Oracle: predictive trajectory engine
// New feature: simulates where a user will be in 6, 12, 24 months based on
// current skills, learning velocity, and live job demand data.
const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');

// ── Helpers ──────────────────────────────────────────────────────────────────

// Role progression ladder per category (extendable via SystemSetting)
const ROLE_LADDERS = {
  engineering: [
    { level: 0, label: 'Junior Developer',    minCoins: 0    },
    { level: 1, label: 'Mid-level Developer', minCoins: 300  },
    { level: 2, label: 'Senior Developer',    minCoins: 800  },
    { level: 3, label: 'Lead Engineer',       minCoins: 1500 },
    { level: 4, label: 'Engineering Manager', minCoins: 3000 },
    { level: 5, label: 'CTO / VP Eng',        minCoins: 5000 },
  ],
  design: [
    { level: 0, label: 'Junior Designer',   minCoins: 0    },
    { level: 1, label: 'Designer',          minCoins: 300  },
    { level: 2, label: 'Senior Designer',   minCoins: 800  },
    { level: 3, label: 'Lead Designer',     minCoins: 1500 },
    { level: 4, label: 'Design Director',   minCoins: 3000 },
  ],
  data: [
    { level: 0, label: 'Data Analyst',        minCoins: 0    },
    { level: 1, label: 'Data Scientist',      minCoins: 400  },
    { level: 2, label: 'Senior Data Scientist',minCoins: 900  },
    { level: 3, label: 'ML Engineer',         minCoins: 1600 },
    { level: 4, label: 'Head of Data',        minCoins: 3200 },
  ],
};

// Estimate learning velocity: completed enrollments in last 90 days / 90 * 30
function learningVelocityCoinsPerMonth(recentCompletions) {
  const COINS_PER_CERT = 50;
  return Math.round((recentCompletions * COINS_PER_CERT * 30) / 90);
}

function getCurrentLadder(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('data') || t.includes('analyst') || t.includes('ml') || t.includes('scientist'))
    return 'data';
  if (t.includes('design') || t.includes('ui') || t.includes('ux'))
    return 'design';
  return 'engineering';
}

function getLevelInLadder(ladder, coins) {
  const sorted = [...ladder].sort((a, b) => b.minCoins - a.minCoins);
  return sorted.find(r => coins >= r.minCoins) || ladder[0];
}

// Salary lookup by tier (NGN, approximate market data)
const SALARY_BY_LEVEL = {
  0: 600_000,
  1: 1_200_000,
  2: 2_400_000,
  3: 4_200_000,
  4: 7_200_000,
  5: 14_400_000,
};

// ── GET /api/v1/career-oracle — full trajectory simulation ───────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const ninety = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        meritCoins: true,
        title:      true,
        skills:     { select: { name: true, level: true, verified: true } },
        enrollments: {
          where:   { completedAt: { not: null, gte: ninety } },
          select:  { completedAt: true },
        },
        certificates: {
          where:  { status: 'verified' },
          select: { title: true, provider: true },
        },
        enrolledPaths: {
          where:  { completedAt: { not: null } },
          select: { completedAt: true },
        },
      },
    });

    if (!user) return error(res, 'User not found', 404);

    const coins        = user.meritCoins;
    const recentDone   = user.enrollments.length;
    const velocityPerMonth = learningVelocityCoinsPerMonth(recentDone);
    const ladder       = ROLE_LADDERS[getCurrentLadder(user.title)];

    // Build snapshots at 0, 6, 12, 24 months
    const snapshots = [0, 6, 12, 24].map(months => {
      const projectedCoins = coins + velocityPerMonth * months;
      const role           = getLevelInLadder(ladder, projectedCoins);
      const salaryAnnual   = SALARY_BY_LEVEL[role.level] ?? SALARY_BY_LEVEL[0];
      return {
        months,
        coins:   Math.round(projectedCoins),
        role:    role.label,
        level:   role.level,
        salary:  salaryAnnual,
      };
    });

    // Blocking skills: required skills for the next role that user doesn't have
    const nextRole      = ladder.find(r => r.level === (snapshots[0].level + 1));
    const requiredForNext = nextRole
      ? await prisma.job.findMany({
          where:  { status: 'active' },
          select: { skills: true },
          take:   50,
        }).then(jobs => {
          const freq: Record<string, number> = {};
          jobs.forEach(j => j.skills.forEach(s => { freq[s] = (freq[s] || 0) + 1; }));
          return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([skill]) => skill);
        })
      : [];

    const userSkillNames = user.skills.map(s => s.name.toLowerCase());
    const blockingSkills = requiredForNext
      .filter(s => !userSkillNames.includes(s.toLowerCase()))
      .slice(0, 3);

    // Current job match percentage (reuse skill-gap logic at a high level)
    const totalRequired  = requiredForNext.length;
    const matched        = requiredForNext.filter(s => userSkillNames.includes(s.toLowerCase())).length;
    const jobMatchScore  = totalRequired > 0 ? Math.round((matched / totalRequired) * 100) : 0;

    const salaryUplift = snapshots[3].salary - snapshots[0].salary;

    return success(res, {
      current: snapshots[0],
      trajectory: snapshots.slice(1),
      velocityPerMonth,
      jobMatchScore,
      blockingSkills,
      salaryUplift,
      ladder: ladder.map(r => ({ ...r, salary: SALARY_BY_LEVEL[r.level] })),
    });
  } catch (err) {
    console.error('[career-oracle]', err);
    return error(res, 'Failed to compute trajectory');
  }
});

// ── GET /api/v1/career-oracle/what-if?skills=docker,kubernetes ───────────────
// Recalculates trajectory after hypothetically adding skills
router.get('/what-if', authenticate, async (req, res) => {
  try {
    const hypotheticalSkills = ((req.query.skills as string) || '')
      .split(',')
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);

    if (!hypotheticalSkills.length) {
      return error(res, 'Provide ?skills=skill1,skill2', 400);
    }

    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { meritCoins: true, title: true, skills: { select: { name: true } } },
    });
    if (!user) return error(res, 'User not found', 404);

    // Each hypothetical skill adds ~150 coins (one medium course)
    const bonusCoins   = hypotheticalSkills.length * 150;
    const projectedCoins = user.meritCoins + bonusCoins;
    const ladder       = ROLE_LADDERS[getCurrentLadder(user.title)];
    const currentRole  = getLevelInLadder(ladder, user.meritCoins);
    const newRole      = getLevelInLadder(ladder, projectedCoins);
    const levelChange  = newRole.level - currentRole.level;

    return success(res, {
      before: {
        coins: user.meritCoins,
        role:  currentRole.label,
        level: currentRole.level,
        salary: SALARY_BY_LEVEL[currentRole.level],
      },
      after: {
        coins: projectedCoins,
        role:  newRole.label,
        level: newRole.level,
        salary: SALARY_BY_LEVEL[newRole.level],
      },
      levelChange,
      salaryUplift: SALARY_BY_LEVEL[newRole.level] - SALARY_BY_LEVEL[currentRole.level],
      hypotheticalSkills,
    });
  } catch (err) {
    console.error('[career-oracle/what-if]', err);
    return error(res, 'Failed to run what-if simulation');
  }
});

module.exports = router;
