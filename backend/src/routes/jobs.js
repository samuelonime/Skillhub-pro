const router  = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { success, created, notFound, badRequest, error } = require('../utils/response');

router.get('/', authenticate, async (req, res) => {
  const { type, location, search } = req.query;
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'active',
        ...(type     ? { type:     { equals: type,     mode: 'insensitive' } } : {}),
        ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
        ...(search   ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { company: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      include: {
        applications: { where: { userId: req.user.id }, select: { id: true } },
        savedBy:      { where: { userId: req.user.id }, select: { id: true } },
        _count:       { select: { applications: true } },
      },
    });
    const userSkills = req.user.skills || [];
    const result = jobs.map(j => ({
      ...j,
      applied: j.applications.length > 0,
      saved:   j.savedBy.length > 0,
      applicationCount: j._count.applications,
      match: Math.min(100, 40 + userSkills.filter(s => j.skills.some(js => js.toLowerCase().includes(s.toLowerCase()))).length * 20),
      applications: undefined, savedBy: undefined, _count: undefined,
    }));
    return success(res, result);
  } catch (err) { console.error(err); return error(res, 'Failed to fetch jobs'); }
});

router.get('/matches', authenticate, async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'active' },
      include: {
        applications: { where: { userId: req.user.id }, select: { id: true } },
        savedBy:      { where: { userId: req.user.id }, select: { id: true } },
      },
    });
    const userSkills = req.user.skills || [];
    const result = jobs.map(j => ({
      ...j, applied: j.applications.length > 0, saved: j.savedBy.length > 0,
      match: Math.min(100, 40 + userSkills.filter(s => j.skills.some(js => js.toLowerCase().includes(s.toLowerCase()))).length * 20),
      applications: undefined, savedBy: undefined,
    })).filter(j => j.match >= 40).sort((a, b) => b.match - a.match);
    return success(res, result);
  } catch (err) { return error(res, 'Failed to fetch matches'); }
});

router.get('/saved', authenticate, async (req, res) => {
  try {
    const saved = await prisma.savedJob.findMany({ where: { userId: req.user.id }, include: { job: true } });
    return success(res, saved.map(s => ({ ...s.job, saved: true, applied: false })));
  } catch (err) { return error(res, 'Failed to fetch saved jobs'); }
});

router.get('/applications', authenticate, async (req, res) => {
  try {
    const apps = await prisma.application.findMany({ where: { userId: req.user.id }, include: { job: true }, orderBy: { appliedAt: 'desc' } });
    return success(res, apps);
  } catch (err) { return error(res, 'Failed to fetch applications'); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: { applications: { where: { userId: req.user.id } }, savedBy: { where: { userId: req.user.id } } },
    });
    if (!job) return notFound(res, 'Job not found');
    return success(res, { ...job, applied: job.applications.length > 0, saved: job.savedBy.length > 0, applications: undefined, savedBy: undefined });
  } catch (err) { return error(res, 'Failed to fetch job'); }
});

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

    const app = await prisma.application.create({ data: { userId: req.user.id, jobId: job.id, coverLetter: req.body.coverLetter || '' } });
    await prisma.notification.create({ data: { userId: req.user.id, type: 'success', icon: 'briefcase', title: 'Application Submitted', message: `Applied to ${job.title} at ${job.company}` } });

    return created(res, app, 'Application submitted successfully!');
  } catch (err) { console.error(err); return error(res, 'Application failed'); }
});

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

router.post('/', authenticate, requireRole('employer', 'admin'), [
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('description').isLength({ min: 20 }),
  body('skills').isArray({ min: 1 }),
  body('type').isIn(['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  try {
    const job = await prisma.job.create({
      data: { ...req.body, company: req.user.company || `${req.user.firstName}'s Company` },
    });
    return created(res, job, 'Job posted successfully!');
  } catch (err) { return error(res, 'Failed to post job'); }
});

module.exports = router;

// GET /jobs/featured — jobs unlocked based on user's merit coin tier
// Students with higher coins see bigger/better jobs
router.get('/featured', authenticate, async (req, res) => {
  const userCoins = req.user.meritCoins || 0;

  // Determine tier thresholds
  const minSalaryBoost = userCoins >= 5000 ? 0    // platinum: all jobs
                       : userCoins >= 2000 ? 50000  // gold: senior jobs (higher salary band)
                       : userCoins >= 500  ? 20000  // silver: mid-level
                       : 0;                         // bronze: entry-level

  const tierLabel = userCoins >= 5000 ? 'platinum' : userCoins >= 2000 ? 'gold' : userCoins >= 500 ? 'silver' : 'bronze';

  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'active' },
      include: {
        applications: { where: { userId: req.user.id }, select: { id: true } },
        savedBy:      { where: { userId: req.user.id }, select: { id: true } },
        _count:       { select: { applications: true } },
      },
      orderBy: [
        { salary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const userSkills = req.user.skills || [];

    // Filter and score jobs based on tier
    const result = jobs
      .map(j => ({
        ...j,
        applied: j.applications.length > 0,
        saved: j.savedBy.length > 0,
        applicationCount: j._count.applications,
        match: Math.min(100, 40 + userSkills.filter(s =>
          j.skills.some(js => js.toLowerCase().includes(s.toLowerCase()))
        ).length * 20),
        featured: userCoins >= 2000, // gold+ see featured badge
        tierUnlocked: tierLabel,
        applications: undefined, savedBy: undefined, _count: undefined,
      }))
      .filter(j => {
        // Platinum sees all; lower tiers see progressively fewer premium jobs
        if (userCoins >= 5000) return true;
        if (userCoins >= 2000) return !j.isPremium || j.tier !== 'platinum';
        if (userCoins >= 500)  return j.tier === 'bronze' || j.tier === 'silver' || !j.tier;
        return !j.tier || j.tier === 'bronze';
      })
      .sort((a, b) => b.match - a.match);

    return success(res, { jobs: result, userTier: tierLabel, userCoins });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch featured jobs');
  }
});
