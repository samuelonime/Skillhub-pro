const router  = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate, requireRole, requireEmployerAccess } = require('../middleware/auth');
const { success, created, notFound, badRequest, error } = require('../utils/response');
const { scoreJobForUser } = require('../utils/jobMatching');

function matchScore(user, job) {
  return scoreJobForUser(user, {
    title: job.title,
    description: job.description,
    location: job.location,
    skills: job.skills || [],
    salary: job.salary,
  }, { includeNiche: false }).score;
}

function tierOf(coins) {
  if (coins >= 5000) return 'platinum';
  if (coins >= 2000) return 'gold';
  if (coins >= 500)  return 'silver';
  return 'bronze';
}

const tierRank = { bronze: 0, silver: 1, gold: 2, platinum: 3 };

function meetsMinTier(userTier, jobMinTier) {
  return (tierRank[userTier] || 0) >= (tierRank[jobMinTier || 'bronze'] || 0);
}

// ── GET /jobs/featured — tier-gated opportunity ads ──────────────────────────
router.get('/featured', authenticate, async (req, res) => {
  const coins  = req.user.meritCoins || 0;
  const tier   = tierOf(coins);
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'active', employerId: { not: null } },
      include: {
        applications: { where: { userId: req.user.id }, select: { id: true } },
        savedBy:      { where: { userId: req.user.id }, select: { id: true } },
        employer: { select: { firstName: true, lastName: true, company: true, avatar: true } },
      },
      orderBy: [{ isPremium: 'desc' }, { createdAt: 'desc' }],
    });

    const result = jobs
      .filter(j => meetsMinTier(tier, j.minTier))
      .map(j => ({
        id:          j.id,
        title:       j.title,
        company:     j.company,
        companyName: j.company,
        location:    j.location,
        type:        j.type,
        salary:      j.salary,
        skills:      j.skills,
        description: j.description,
        status:      j.status,
        minTier:     j.minTier,
        isPremium:   j.isPremium,
        createdAt:   j.createdAt,
        applied:     j.applications.length > 0,
        saved:       j.savedBy.length > 0,
        match:       matchScore(req.user, j),
        adTier:      j.isPremium ? (j.minTier || 'gold') : 'standard',
      }))
      .sort((a, b) => {
        if (b.isPremium !== a.isPremium) return b.isPremium ? 1 : -1;
        return b.match - a.match;
      });

    return success(res, { jobs: result, userTier: tier, userCoins: coins });
  } catch (err) {
    console.error('Featured jobs error:', err);
    return error(res, 'Failed to fetch featured jobs');
  }
});

// ── GET /jobs/matches ────────────────────────────────────────────────────────
router.get('/matches', authenticate, async (req, res) => {
  const coins  = req.user.meritCoins || 0;
  const tier   = tierOf(coins);
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'active', employerId: { not: null } },
      include: {
        applications: { where: { userId: req.user.id }, select: { id: true } },
        savedBy:      { where: { userId: req.user.id }, select: { id: true } },
      },
    });

    const result = jobs
      .filter(j => meetsMinTier(tier, j.minTier))
      .map(j => ({
        ...j,
        applied: j.applications.length > 0,
        saved:   j.savedBy.length > 0,
        match:   matchScore(req.user, j),
        applications: undefined, savedBy: undefined,
      }))
      .filter(j => j.match >= 40)
      .sort((a, b) => b.match - a.match)
      .slice(0, 5);

    return success(res, result);
  } catch (err) { return error(res, 'Failed to fetch matches'); }
});

// ── GET /jobs/saved ──────────────────────────────────────────────────────────
router.get('/saved', authenticate, async (req, res) => {
  try {
    const saved = await prisma.savedJob.findMany({ where: { userId: req.user.id }, include: { job: true } });
    return success(res, saved
      .filter(s => s.job?.employerId !== null)
      .map(s => ({ ...s.job, saved: true, applied: false })));
  } catch (err) { return error(res, 'Failed to fetch saved jobs'); }
});

// ── GET /jobs/applications ───────────────────────────────────────────────────
router.get('/applications', authenticate, async (req, res) => {
  try {
    const apps = await prisma.application.findMany({
      where: { userId: req.user.id },
      include: { job: { select: { id: true, title: true, company: true, location: true } } },
      orderBy: { appliedAt: 'desc' },
    });
    return success(res, apps);
  } catch (err) { return error(res, 'Failed to fetch applications'); }
});

// ── GET /jobs ────────────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { type, location, search } = req.query;
  const coins  = req.user.meritCoins || 0;
  const tier   = tierOf(coins);
  const niche  = req.user.interestNiche || null;

  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'active',
        employerId: { not: null },
        ...(type     ? { type: { equals: type, mode: 'insensitive' } } : {}),
        ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
        ...(search   ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { company: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      include: {
        applications: { where: { userId: req.user.id }, select: { id: true } },
        savedBy:      { where: { userId: req.user.id }, select: { id: true } },
        _count:       { select: { applications: true } },
      },
      orderBy: [{ isPremium: 'desc' }, { createdAt: 'desc' }],
    });

    const employerResult = jobs
      .filter(j => meetsMinTier(tier, j.minTier))
      .map(j => ({
        ...j,
        kind:             'employer',
        applied:          j.applications.length > 0,
        saved:            j.savedBy.length > 0,
        applicationCount: j._count.applications,
        match:            matchScore(req.user, j),
        applications: undefined, savedBy: undefined, _count: undefined,
      }));

    // ── Merge in AI-scouted leads matching the student's niche ─────────────
    let scoutedResult = [];
    if (niche) {
      const leads = await prisma.jobScoutLead.findMany({
        where: {
          niche,
          status: { in: ['pending', 'sent'] },
          ...(type     ? { type: { equals: type, mode: 'insensitive' } } : {}),
          ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
          ...(search   ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { company: { contains: search, mode: 'insensitive' } }] } : {}),
        },
        orderBy: [{ fetchedAt: 'desc' }],
        take: 50,
      });

      scoutedResult = leads.map(lead => ({
        id:               lead.id,
        kind:             'scouted',
        title:            lead.title,
        company:          lead.company,
        location:         lead.location,
        type:             lead.type,
        salary:           lead.salary,
        description:      lead.description,
        skills:           lead.skills,
        applyUrl:         lead.url,
        source:           lead.source,
        createdAt:        lead.postedAt || lead.fetchedAt,
        isPremium:        false,
        minTier:          null,
        applied:          false,
        saved:            false,
        applicationCount: 0,
        match:            scoreJobForUser(req.user, lead).score,
      }));
    }

    const result = [...employerResult, ...scoutedResult]
      .sort((a, b) => {
        if (b.isPremium !== a.isPremium) return b.isPremium ? 1 : -1;
        if (b.match !== a.match) return b.match - a.match;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return success(res, result);
  } catch (err) { console.error(err); return error(res, 'Failed to fetch jobs'); }
});

// ── GET /jobs/:id ────────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, employerId: { not: null } },
      include: {
        applications: { where: { userId: req.user.id } },
        savedBy:      { where: { userId: req.user.id } },
      },
    });
    if (!job) return notFound(res, 'Job not found');
    return success(res, { ...job, applied: job.applications.length > 0, saved: job.savedBy.length > 0, applications: undefined, savedBy: undefined });
  } catch (err) { return error(res, 'Failed to fetch job'); }
});

// ── POST /jobs/:id/apply ─────────────────────────────────────────────────────
router.post('/:id/apply', authenticate, requireRole('student'), [
  body('coverLetter').optional().isString().isLength({ max: 2000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) return notFound(res, 'Job not found');
    const existing = await prisma.application.findUnique({ where: { userId_jobId: { userId: req.user.id, jobId: job.id } } });
    if (existing) return badRequest(res, 'Already applied to this job');
    const app = await prisma.application.create({
      data: { userId: req.user.id, jobId: job.id, coverLetter: req.body.coverLetter || '', status: 'applied' },
    });
    await prisma.notification.create({
      data: { userId: req.user.id, type: 'success', icon: 'briefcase', message: `Applied to ${job.title} at ${job.company}` },
    });
    return created(res, app, 'Application submitted!');
  } catch (err) { console.error(err); return error(res, 'Application failed'); }
});

// ── POST /jobs/:id/save ──────────────────────────────────────────────────────
router.post('/:id/save', authenticate, async (req, res) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) return notFound(res, 'Job not found');
    const existing = await prisma.savedJob.findUnique({ where: { userId_jobId: { userId: req.user.id, jobId: job.id } } });
    if (existing) {
      await prisma.savedJob.delete({ where: { id: existing.id } });
      return success(res, { saved: false }, 'Job removed from saved');
    }
    await prisma.savedJob.create({ data: { userId: req.user.id, jobId: job.id } });
    return success(res, { saved: true }, 'Job saved');
  } catch (err) { return error(res, 'Failed to save job'); }
});

// ── POST /jobs — employer post ───────────────────────────────────────────────
router.post('/', authenticate, requireRole('employer', 'admin'), requireEmployerAccess,[
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('description').isLength({ min: 20 }),
  body('type').isIn(['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  try {
    const { skills, minTier, isPremium, location, salary, type, title, description } = req.body;
    const skillArr = Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean);
    const job = await prisma.job.create({
      data: {
        title,
        description,
        type,
        location: location || 'Remote',
        salary:   salary   || null,
        skills:   skillArr,
        minTier:  minTier  || null,
        isPremium: isPremium || false,
        employerId: req.user.id,
        company:    req.user.company || null,
        status:     'active',
      },
    });
    return created(res, job, 'Job posted successfully!');
  } catch (err) { console.error(err); return error(res, 'Failed to post job'); }
});

module.exports = router;