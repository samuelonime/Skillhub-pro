const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { success, error, notFound, badRequest } = require('../utils/response');

const guard = [authenticate, requireRole('employer', 'admin')];

function tierOf(coins) {
  if (coins >= 5000) return 'platinum';
  if (coins >= 2000) return 'gold';
  if (coins >= 500)  return 'silver';
  return 'bronze';
}

// ── GET /employer/dashboard ──────────────────────────────────────────────────
router.get('/dashboard', ...guard, async (req, res) => {
  try {
    const employerId = req.user.id;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [activeJobs, totalApplicants, shortlisted, hiredThisMonth, recentApps, pipelineRaw] = await Promise.all([
      prisma.job.count({ where: { employerId, status: 'active' } }),

      prisma.application.count({ where: { job: { employerId } } }),

      prisma.application.count({ where: { job: { employerId }, status: 'shortlisted' } }),

      prisma.application.count({ where: { job: { employerId }, status: 'hired', updatedAt: { gte: monthStart } } }),

      prisma.application.findMany({
        where: { job: { employerId } },
        orderBy: { appliedAt: 'desc' },
        take: 5,
        include: {
          job: { select: { id: true, title: true } },
          user: {
            select: {
              id: true, firstName: true, lastName: true, avatar: true,
              meritCoins: true, skills: true,
              certificates: { where: { status: 'verified' }, select: { id: true } },
              projects:     { where: { visibility: 'public' }, select: { id: true } },
            },
          },
        },
      }),

      prisma.application.groupBy({
        by: ['status'],
        where: { job: { employerId } },
        _count: { status: true },
      }),
    ]);

    const stageOrder = ['applied','reviewing','shortlisted','interviewing','hired'];
    const pipelineMap = Object.fromEntries(pipelineRaw.map(p => [p.status, p._count.status]));
    const pipeline = stageOrder.map(stage => ({
      stage,
      count: pipelineMap[stage] || 0,
      pct: totalApplicants > 0 ? Math.round(((pipelineMap[stage] || 0) / totalApplicants) * 100) : 0,
    }));

    // Merit tier breakdown
    const allApplicantUsers = await prisma.user.findMany({
      where: { applications: { some: { job: { employerId } } } },
      select: { meritCoins: true },
    });
    const tierBreakdown = { platinum:0, gold:0, silver:0, bronze:0 };
    allApplicantUsers.forEach(u => {
      tierBreakdown[tierOf(u.meritCoins || 0)]++;
    });

    return success(res, {
      stats: { activeJobs, totalApplicants, shortlisted, hiredThisMonth },
      pipeline,
      tierBreakdown,
      recentApplicants: recentApps.map(a => ({
        applicationId: a.id,
        status:        a.status,
        appliedAt:     a.appliedAt,
        job:           a.job,
        id:            a.user.id,
        name:          `${a.user.firstName} ${a.user.lastName}`,
        avatar:        a.user.avatar,
        meritCoins:    a.user.meritCoins || 0,
        skills:        a.user.skills || [],
        certCount:     a.user.certificates.length,
        projectCount:  a.user.projects.length,
      })),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return error(res, 'Failed to load employer dashboard');
  }
});

// ── GET /employer/profile ────────────────────────────────────────────────────
router.get('/profile', ...guard, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id:true, firstName:true, lastName:true, email:true,
        avatar:true, phone:true, company:true, companyWebsite:true,
        companySize:true, industry:true, location:true, bio:true,
        role:true, createdAt:true,
      },
    });
    return success(res, user);
  } catch (err) { return error(res, 'Failed to fetch profile'); }
});

// ── PUT /employer/profile ────────────────────────────────────────────────────
router.put('/profile', ...guard, async (req, res) => {
  const { firstName, lastName, phone, company, companyWebsite, companySize, industry, location, bio } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phone, company, companyWebsite, companySize, industry, location, bio },
      select: {
        id:true, firstName:true, lastName:true, email:true, company:true,
        avatar:true, phone:true, companyWebsite:true, companySize:true,
        industry:true, location:true, bio:true,
      },
    });
    return success(res, user, 'Profile updated');
  } catch (err) { return error(res, 'Failed to update profile'); }
});

// ── PUT /employer/account/password ───────────────────────────────────────────
router.put('/account/password', ...guard, async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8)
    return badRequest(res, 'Valid current and new password (8+ chars) required');
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return badRequest(res, 'Current password is incorrect');
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    return success(res, null, 'Password updated');
  } catch (err) { return error(res, 'Failed to update password'); }
});

// ── GET /employer/jobs ───────────────────────────────────────────────────────
router.get('/jobs', ...guard, async (req, res) => {
  const { status } = req.query;
  try {
    const jobs = await prisma.job.findMany({
      where: {
        employerId: req.user.id,
        ...(status ? { status } : {}),
      },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, jobs.map(j => ({
      ...j,
      applicantCount: j._count.applications,
      _count: undefined,
    })));
  } catch (err) { return error(res, 'Failed to fetch jobs'); }
});

// ── GET /employer/applicants ─────────────────────────────────────────────────
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
            skills: true,
            certificates: { where: { status: 'verified' }, select: { id:true, title:true, provider:true } },
            projects:     { where: { visibility: 'public' }, select: { id:true, title:true, techStack:true } },
            connectedPlatforms: { select: { platform: true } },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    let result = applications.map(a => {
      const coins = a.user.meritCoins || 0;
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
        tier:          tierOf(coins),
        profileStrength: a.user.profileStrength || 0,
        skills: (a.user.skills || []).map((s) => ({ name: s, verified: false })),
        certCount:     a.user.certificates.length,
        certificates:  a.user.certificates,
        projectCount:  a.user.projects.length,
        projects:      a.user.projects,
        platforms:     (a.user.connectedPlatforms || []).map((p: any) => p.platform),
      };
    });

    if (tier && tier !== 'all') result = result.filter((r: any) => r.tier === tier);
    if (sort === 'coins')  result.sort((a: any, b: any) => b.meritCoins - a.meritCoins);
    if (sort === 'match')  result.sort((a: any, b: any) => b.profileStrength - a.profileStrength);
    if (sort === 'recent') result.sort((a: any, b: any) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

    return success(res, result);
  } catch (err) {
    console.error('Applicants error:', err);
    return error(res, 'Failed to fetch applicants');
  }
});

// ── PATCH /employer/applicants/:id/status ───────────────────────────────────
router.patch('/applicants/:applicationId/status', ...guard, async (req, res) => {
  const { status } = req.body;
  const allowed = ['reviewing','shortlisted','interviewing','hired','rejected'];
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
    await prisma.notification.create({
      data: {
        userId:  app.userId,
        type:    'application_update',
        icon:    'paper-plane',
        message: `Your application status has been updated to: ${status}`,
      },
    });
    return success(res, updated, `Marked as ${status}`);
  } catch (err) { return error(res, 'Failed to update status'); }
});

// ── GET /employer/talent ─────────────────────────────────────────────────────
router.get('/talent', ...guard, async (req, res) => {
  const { tier, search, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

  const coinFilter= {};
  if (tier === 'platinum') coinFilter.gte = 5000;
  else if (tier === 'gold')   { coinFilter.gte = 2000; coinFilter.lt = 5000; }
  else if (tier === 'silver') { coinFilter.gte = 500;  coinFilter.lt = 2000; }
  else if (tier === 'bronze') coinFilter.lt = 500;

  try {
    const where= {
      role: 'student',
      isActive: true,
      ...(Object.keys(coinFilter).length ? { meritCoins: coinFilter } : {}),
      ...(search ? {
        OR: [
          { firstName: { contains: String(search), mode: 'insensitive' } },
          { lastName:  { contains: String(search), mode: 'insensitive' } },
          { title:     { contains: String(search), mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(String(limit)),
        orderBy: { meritCoins: 'desc' },
        select: {
          id:true, firstName:true, lastName:true, avatar:true,
          title:true, location:true, meritCoins:true, profileStrength:true, skills:true,
          certificates: { where: { status: 'verified' }, select: { id:true, title:true, provider:true }, take: 4 },
          projects:     { where: { visibility: 'public' }, select: { id:true, title:true, techStack:true }, take: 3 },
          connectedPlatforms: { select: { platform: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const result = users.map(u => {
      const coins = u.meritCoins || 0;
      return {
        id:         u.id,
        name:       `${u.firstName} ${u.lastName}`,
        avatar:     u.avatar,
        title:      u.title,
        location:   u.location,
        meritCoins: coins,
        tier:       tierOf(coins),
        profileStrength: u.profileStrength,
        skills:     (u.skills || []).map((s: string) => ({ name: s, verified: false })),
        certCount:  u.certificates.length,
        projectCount: u.projects.length,
        platforms:  (u.connectedPlatforms || []).map((p: any) => p.platform),
      };
    });

    return success(res, { users: result, total, page: parseInt(String(page)), pages: Math.ceil(total / parseInt(String(limit))) });
  } catch (err) {
    console.error('Talent error:', err);
    return error(res, 'Failed to fetch talent');
  }
});

// ── GET /employer/talent/:userId ─────────────────────────────────────────────
router.get('/talent/:userId', ...guard, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.userId, role: 'student' },
      select: {
        id:true, firstName:true, lastName:true, avatar:true,
        title:true, bio:true, location:true, meritCoins:true, profileStrength:true, skills:true,
        certificates: { where: { status: 'verified' }, select: { id:true, title:true, provider:true, issuedAt:true, credentialUrl:true } },
        projects:     { where: { visibility: 'public' }, select: { id:true, title:true, description:true, techStack:true, liveUrl:true, githubUrl:true } },
        connectedPlatforms: { select: { platform: true } },
        externalCertificates: { select: { title:true, platform:true, completedAt:true } },
      },
    });
    if (!user) return notFound(res, 'Candidate not found');

    const coins = user.meritCoins || 0;
    return success(res, {
      id:         user.id,
      name:       `${user.firstName} ${user.lastName}`,
      avatar:     user.avatar,
      title:      user.title,
      bio:        user.bio,
      location:   user.location,
      meritCoins: coins,
      tier:       tierOf(coins),
      profileStrength: user.profileStrength,
      skills:     (user.skills || []).map((s: string) => ({ name: s, verified: false })),
      certificates: user.certificates,
      projects:     user.projects,
      platforms:    (user.connectedPlatforms || []).map((p: any) => p.platform),
    });
  } catch (err) { return error(res, 'Failed to fetch candidate'); }
});

// ── GET /employer/analytics ──────────────────────────────────────────────────
router.get('/analytics', ...guard, async (req, res) => {
  try {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        label: d.toLocaleString('default', { month: 'short' }),
        start: d,
        end:   new Date(d.getFullYear(), d.getMonth() + 1, 1),
      };
    });

    const [jobsPerMonth, applicantsPerMonth, topJobs] = await Promise.all([
      Promise.all(months.map(m => prisma.job.count({ where: { employerId: req.user.id, createdAt: { gte: m.start, lt: m.end } } }))),
      Promise.all(months.map(m => prisma.application.count({ where: { job: { employerId: req.user.id }, appliedAt: { gte: m.start, lt: m.end } } }))),
      prisma.job.findMany({
        where: { employerId: req.user.id, status: 'active' },
        include: { _count: { select: { applications: true } } },
        orderBy: { applications: { _count: 'desc' } },
        take: 5,
      }),
    ]);

    return success(res, {
      months:  months.map((m, i) => ({ label: m.label, jobs: jobsPerMonth[i], applicants: applicantsPerMonth[i] })),
      topJobs: topJobs.map(j => ({ id: j.id, title: j.title, applicants: j._count.applications })),
    });
  } catch (err) { return error(res, 'Failed to fetch analytics'); }
});

module.exports = router;