// routes/employer.js — All employer dashboard data from the database
const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { success, error, notFound, badRequest } = require('../utils/response');

const guard = [authenticate, requireRole('employer', 'admin')];

// ── GET /api/v1/employer/dashboard ───────────────────────────────────────────
// Overview stats: active jobs, total applicants, shortlisted, hired this month
router.get('/dashboard', ...guard, async (req, res) => {
  try {
    const employerId = req.user.id;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      activeJobs,
      totalApplicants,
      shortlisted,
      hiredThisMonth,
      recentApplicants,
      pipeline,
    ] = await Promise.all([
      // Active job count
      prisma.job.count({ where: { employerId, status: 'active' } }),

      // Total applicants across all employer's jobs
      prisma.application.count({
        where: { job: { employerId } },
      }),

      // Shortlisted count
      prisma.application.count({
        where: { job: { employerId }, status: 'shortlisted' },
      }),

      // Hired this month
      prisma.application.count({
        where: {
          job: { employerId },
          status: 'hired',
          updatedAt: { gte: monthStart },
        },
      }),

      // 5 most recent applicants with full profile
      prisma.application.findMany({
        where: { job: { employerId } },
        orderBy: { appliedAt: 'desc' },
        take: 5,
        include: {
          job: { select: { id: true, title: true } },
          user: {
            select: {
              id: true, firstName: true, lastName: true, avatar: true,
              meritCoins: true, skills: { select: { name: true }, take: 5 },
              certificates: { where: { status: 'verified' }, select: { id: true } },
              projects:     { where: { visibility: 'public' }, select: { id: true } },
            },
          },
        },
      }),

      // Pipeline counts per stage
      prisma.application.groupBy({
        by: ['status'],
        where: { job: { employerId } },
        _count: { status: true },
      }),
    ]);

    // Build pipeline array in a fixed order
    const stageOrder = ['applied', 'reviewing', 'shortlisted', 'interviewing', 'hired'];
    const pipelineMap = Object.fromEntries(pipeline.map(p => [p.status, p._count.status]));
    const pipelineStages = stageOrder.map(stage => ({
      stage,
      count: pipelineMap[stage] || 0,
      pct: totalApplicants > 0 ? Math.round(((pipelineMap[stage] || 0) / totalApplicants) * 100) : 0,
    }));

    // Merit coin breakdown of all applicants
    const applicantUsers = await prisma.user.findMany({
      where: {
        applications: { some: { job: { employerId } } },
      },
      select: { meritCoins: true },
    });
    const tierBreakdown = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    applicantUsers.forEach(u => {
      const c = u.meritCoins || 0;
      if (c >= 5000) tierBreakdown.platinum++;
      else if (c >= 2000) tierBreakdown.gold++;
      else if (c >= 500)  tierBreakdown.silver++;
      else                tierBreakdown.bronze++;
    });

    return success(res, {
      stats: { activeJobs, totalApplicants, shortlisted, hiredThisMonth },
      pipeline: pipelineStages,
      tierBreakdown,
      recentApplicants: recentApplicants.map(a => ({
        applicationId: a.id,
        status: a.status,
        appliedAt: a.appliedAt,
        job: a.job,
        id: a.user.id,
        name: `${a.user.firstName} ${a.user.lastName}`,
        avatar: a.user.avatar,
        meritCoins: a.user.meritCoins || 0,
        skills: a.user.skills.map(s => s.name),
        certCount: a.user.certificates.length,
        projectCount: a.user.projects.length,
      })),
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to load employer dashboard');
  }
});

// ── GET /api/v1/employer/jobs ────────────────────────────────────────────────
// All jobs posted by this employer
router.get('/jobs', ...guard, async (req, res) => {
  const { status, tier } = req.query;
  try {
    const jobs = await prisma.job.findMany({
      where: {
        employerId: req.user.id,
        ...(status ? { status } : {}),
        ...(tier   ? { minTier: tier } : {}),
      },
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, jobs.map(j => ({
      ...j,
      applicantCount: j._count.applications,
      _count: undefined,
    })));
  } catch (err) {
    return error(res, 'Failed to fetch jobs');
  }
});

// ── GET /api/v1/employer/applicants ─────────────────────────────────────────
// All applicants across all employer jobs, with full profile + merit info
router.get('/applicants', ...guard, async (req, res) => {
  const { jobId, status, tier, sort = 'coins' } = req.query;
  try {
    const applications = await prisma.application.findMany({
      where: {
        job: { employerId: req.user.id },
        ...(jobId  ? { jobId }  : {}),
        ...(status ? { status } : {}),
      },
      include: {
        job: { select: { id: true, title: true } },
        user: {
          select: {
            id: true, firstName: true, lastName: true, avatar: true,
            meritCoins: true, profileStrength: true, location: true, title: true,
            skills: {
              select: { name: true, level: true, verified: true },
              take: 8,
            },
            certificates: {
              where: { status: 'verified' },
              select: { id: true, title: true, provider: true },
            },
            projects: {
              where: { visibility: 'public' },
              select: { id: true, title: true, techStack: true },
              take: 5,
            },
            connectedPlatforms: {
              select: { platform: true },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    let result = applications.map(a => {
      const coins = a.user.meritCoins || 0;
      const tierKey = coins >= 5000 ? 'platinum' : coins >= 2000 ? 'gold' : coins >= 500 ? 'silver' : 'bronze';
      return {
        applicationId: a.id,
        status:        a.status,
        appliedAt:     a.appliedAt,
        job:           a.job,
        id:            a.user.id,
        name:          `${a.user.firstName} ${a.user.lastName}`,
        avatar:        a.user.avatar,
        location:      a.user.location,
        title:         a.user.title,
        meritCoins:    coins,
        tier:          tierKey,
        profileStrength: a.user.profileStrength || 0,
        skills:        a.user.skills,
        certCount:     a.user.certificates.length,
        certificates:  a.user.certificates,
        projectCount:  a.user.projects.length,
        projects:      a.user.projects,
        platforms:     (a.user.connectedPlatforms || []).map(p => p.platform),
      };
    });

    // Filter by tier if requested
    if (tier && tier !== 'all') result = result.filter(r => r.tier === tier);

    // Sort
    if (sort === 'coins')   result.sort((a, b) => b.meritCoins - a.meritCoins);
    if (sort === 'match')   result.sort((a, b) => b.profileStrength - a.profileStrength);
    if (sort === 'recent')  result.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

    return success(res, result);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch applicants');
  }
});

// ── PATCH /api/v1/employer/applicants/:applicationId/status ─────────────────
router.patch('/applicants/:applicationId/status', ...guard, async (req, res) => {
  const { status } = req.body;
  const allowed = ['reviewing', 'shortlisted', 'interviewing', 'hired', 'rejected'];
  if (!allowed.includes(status)) return badRequest(res, 'Invalid status');
  try {
    const app = await prisma.application.findFirst({
      where: { id: req.params.applicationId, job: { employerId: req.user.id } },
    });
    if (!app) return notFound(res, 'Application not found');

    const updated = await prisma.application.update({
      where: { id: req.params.applicationId },
      data: { status },
    });

    // Notify the candidate
    await prisma.notification.create({
      data: {
        userId:  app.userId,
        type:    'application_update',
        message: `Your application status has been updated to: ${status}`,
        icon:    'paper-plane',
      },
    });

    return success(res, updated, `Application marked as ${status}`);
  } catch (err) {
    return error(res, 'Failed to update status');
  }
});

// ── GET /api/v1/employer/talent ──────────────────────────────────────────────
// All public student profiles ranked by merit coins — no mock data
router.get('/talent', ...guard, async (req, res) => {
  const { tier, skills, search, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

  const coinFilter: Record<string, any> = {};
  if (tier === 'platinum') coinFilter.gte = 5000;
  else if (tier === 'gold')   coinFilter.gte = 2000;
  else if (tier === 'silver') { coinFilter.gte = 500; coinFilter.lt = 2000; }
  else if (tier === 'bronze') coinFilter.lt = 500;

  const skillList = skills ? String(skills).split(',').map(s => s.trim()).filter(Boolean) : [];

  try {
    const where: any = {
      role: 'student',
      isActive: true,
      portfolioPublic: true,
      ...(Object.keys(coinFilter).length ? { meritCoins: coinFilter } : {}),
      ...(search ? {
        OR: [
          { firstName: { contains: String(search), mode: 'insensitive' } },
          { lastName:  { contains: String(search), mode: 'insensitive' } },
          { title:     { contains: String(search), mode: 'insensitive' } },
        ],
      } : {}),
      ...(skillList.length ? {
        skills: { some: { name: { in: skillList, mode: 'insensitive' } } },
      } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(String(limit)),
        orderBy: { meritCoins: 'desc' },
        select: {
          id: true, firstName: true, lastName: true, avatar: true,
          title: true, location: true, meritCoins: true, profileStrength: true,
          skills:    { select: { name: true, level: true, verified: true }, take: 6 },
          certificates: { where: { status: 'verified' }, select: { id: true, title: true, provider: true }, take: 4 },
          projects:  { where: { visibility: 'public' }, select: { id: true, title: true, techStack: true }, take: 3 },
          connectedPlatforms: { select: { platform: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const result = users.map(u => {
      const coins = u.meritCoins || 0;
      return {
        ...u,
        name: `${u.firstName} ${u.lastName}`,
        meritCoins: coins,
        tier: coins >= 5000 ? 'platinum' : coins >= 2000 ? 'gold' : coins >= 500 ? 'silver' : 'bronze',
        certCount:    u.certificates.length,
        projectCount: u.projects.length,
        platforms:    (u.connectedPlatforms || []).map(p => p.platform),
      };
    });

    return success(res, { users: result, total, page: parseInt(String(page)), pages: Math.ceil(total / parseInt(String(limit))) });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch talent');
  }
});

// ── GET /api/v1/employer/talent/:userId ─────────────────────────────────────
router.get('/talent/:userId', ...guard, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.userId, role: 'student', portfolioPublic: true },
      select: {
        id: true, firstName: true, lastName: true, avatar: true,
        title: true, bio: true, location: true, meritCoins: true, profileStrength: true,
        skills: { select: { name: true, level: true, verified: true } },
        certificates: {
          where: { status: 'verified' },
          select: { id: true, title: true, provider: true, issuedAt: true, credentialUrl: true },
        },
        projects: {
          where: { visibility: 'public' },
          select: { id: true, title: true, description: true, techStack: true, liveUrl: true, githubUrl: true },
        },
        connectedPlatforms: { select: { platform: true } },
        externalCertificates: { select: { title: true, platform: true, completedAt: true } },
        resume: { select: { fileUrl: true, updatedAt: true } },
      },
    });
    if (!user) return notFound(res, 'Candidate not found');

    const coins = user.meritCoins || 0;
    return success(res, {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      tier: coins >= 5000 ? 'platinum' : coins >= 2000 ? 'gold' : coins >= 500 ? 'silver' : 'bronze',
      platforms: (user.connectedPlatforms || []).map(p => p.platform),
    });
  } catch (err) {
    return error(res, 'Failed to fetch candidate profile');
  }
});

module.exports = router;