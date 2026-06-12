// routes/peerGenome.js — Peer Genome: contextual cohort matching
// Finds anonymised users who matched your exact profile 6–18 months ago
// and surfaces what they did — both the paths that led to progression
// and the traps that caused stagnation.
const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');

// ── Helpers ───────────────────────────────────────────────────────────────────

function salaryBand(coins) {
  if (coins >= 5000) return 'platinum';
  if (coins >= 2000) return 'gold';
  if (coins >= 500)  return 'silver';
  return 'bronze';
}

// Anonymise a user record — never expose id, email, name
function anonymise(user, index) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return {
    alias:    `Peer ${letters[index % 26]}`,
    location: user.location || 'Nigeria',
    title:    user.title    || 'Developer',
    coins:    user.meritCoins,
    tier:     salaryBand(user.meritCoins),
  };
}

// Compute a simple similarity score between requester and a candidate
function similarity(requester, candidate) {
  let score = 0;
  // Same country/city
  if (requester.location && candidate.location &&
      candidate.location.toLowerCase().includes(requester.location.split(',')[0].toLowerCase())) {
    score += 30;
  }
  // Similar role type (keyword overlap in title)
  const reqWords = (requester.title || '').toLowerCase().split(/\s+/);
  const candWords = (candidate.title || '').toLowerCase().split(/\s+/);
  const overlap   = reqWords.filter((w) => candWords.includes(w)).length;
  score += overlap * 15;
  // Similar starting coin tier
  if (salaryBand(requester.meritCoins) === salaryBand(candidate.pastCoins || 0)) score += 25;
  return score;
}

// ── GET /api/v1/peer-genome — find cohort peers ───────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const sixMonthsAgo      = new Date(Date.now() - 6  * 30 * 24 * 60 * 60 * 1000);
    const eighteenMonthsAgo = new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000);

    const requester = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        meritCoins: true,
        title:      true,
        location:   true,
        skills:     { select: { name: true } },
      },
    });
    if (!requester) return error(res, 'User not found', 404);

    // Find users who joined between 6–18 months ago (they were "where you are")
    // and have since progressed (coins increased meaningfully)
    const candidates = await prisma.user.findMany({
      where: {
        id:        { not: req.user.id },
        role:      'student',
        isActive:  true,
        createdAt: { gte: eighteenMonthsAgo, lte: sixMonthsAgo },
      },
      select: {
        meritCoins: true,
        title:      true,
        location:   true,
        createdAt:  true,
        skills:         { select: { name: true, verified: true } },
        certificates:   { where: { status: 'verified' }, select: { title: true, provider: true } },
        enrolledPaths:  {
          where:  { completedAt: { not: null } },
          select: { path: { select: { title: true, category: true } }, completedAt: true },
        },
        transactions: {
          orderBy: { createdAt: 'asc' },
          take:    1,
          select:  { amount: true, createdAt: true },
        },
      },
      take: 100,
    });

    if (!candidates.length) {
      return success(res, { peers: [], message: 'Not enough cohort data yet — check back soon.' });
    }

    // Score and rank
    const scored = candidates
      .map((c, i) => ({ ...c, _score: similarity(requester, c), _index: i }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 5);

    const peers = scored.map((c, i) => {
      const profile = anonymise(c, i);

      // Determine what they did
      const verifiedSkillsAdded = c.skills.filter((s) => s.verified).map((s) => s.name);
      const certsEarned         = c.certificates.map((cert) => cert.title).slice(0, 3);
      const pathsCompleted      = c.enrolledPaths.map((e) => e.path.title).slice(0, 2);

      // Outcome assessment
      const progressed = c.meritCoins >= 500;
      const outcome    = progressed
        ? `Reached ${salaryBand(c.meritCoins)} tier in ~${
            Math.round((Date.now() - c.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000))
          } months`
        : 'Still at starting level after 12+ months';

      const keyMoves = [];
      if (verifiedSkillsAdded.length) keyMoves.push(`Verified skills: ${verifiedSkillsAdded.slice(0, 3).join(', ')}`);
      if (certsEarned.length)         keyMoves.push(`Earned cert: ${certsEarned[0]}`);
      if (pathsCompleted.length)      keyMoves.push(`Completed path: ${pathsCompleted[0]}`);
      if (!progressed && !certsEarned.length && !pathsCompleted.length)
        keyMoves.push('Added certs but no portfolio projects — limited employer visibility');

      return {
        ...profile,
        progressed,
        outcome,
        keyMoves,
        skills:   verifiedSkillsAdded.slice(0, 4),
        matchScore: Math.min(c._score, 100),
      };
    });

    return success(res, { peers, requesterTier: salaryBand(requester.meritCoins) });
  } catch (err) {
    console.error('[peer-genome]', err);
    return error(res, 'Failed to load peer genome');
  }
});

module.exports = router;