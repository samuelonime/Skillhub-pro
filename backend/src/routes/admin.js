const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { success, notFound, error, badRequest } = require('../utils/response');

router.use(authenticate, requireRole('admin'));

router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, students, employers, instructors, totalCourses, totalJobs, activeJobs, totalApps, totalCerts, verifiedCerts, pendingCerts, totalPayments, successPayments] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'employer' } }),
      prisma.user.count({ where: { role: 'instructor' } }),
      prisma.course.count(),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'active' } }),
      prisma.application.count(),
      prisma.certificate.count(),
      prisma.certificate.count({ where: { status: 'verified' } }),
      prisma.certificate.count({ where: { status: 'pending' } }),
      prisma.payment.count(),
      prisma.payment.findMany({ where: { status: 'success' }, select: { amount: true } }),
    ]);

    const revenue = successPayments.reduce((s, p) => s + p.amount, 0);

    return success(res, {
      users: { total: totalUsers, students, employers, instructors },
      courses: { total: totalCourses },
      jobs: { total: totalJobs, active: activeJobs, totalApplications: totalApps },
      certificates: { total: totalCerts, verified: verifiedCerts, pending: pendingCerts },
      revenue: { totalPayments, totalRevenue: revenue / 100, currency: 'NGN' },
    });
  } catch (err) { 
    console.error(err); 
    return error(res, 'Failed to fetch stats'); 
  }
});

router.get('/users', async (req, res) => {
  const { role, search, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const where = {
      ...(role ? { role } : {}),
      ...(search ? { OR: [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {}),
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select:  { id: true, email: true, firstName: true, lastName: true, role: true, verified: true, meritCoins: true, createdAt: true, company: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);
    return success(res, { users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to fetch users'); 
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.params.id }, 
      select: { id: true, email: true, firstName: true, lastName: true, role: true, verified: true, meritCoins: true, createdAt: true, title: true, bio: true, skills: { select: { id: true, name: true, level: true, verified: true } } } 
    });
    if (!user) return notFound(res, 'User not found');
    return success(res, user);
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to fetch user'); 
  }
});

router.put('/users/:id', async (req, res) => {
  const ALLOWED = ['role', 'verified', 'meritCoins', 'title'];
  const data = {};
  ALLOWED.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  if (!Object.keys(data).length) return badRequest(res, 'No updatable fields provided');
  try {
    const user = await prisma.user.update({ 
      where: { id: req.params.id }, 
      data, 
      select: { id: true, email: true, firstName: true, lastName: true, role: true, verified: true, meritCoins: true } 
    });
    return success(res, user, 'User updated');
  } catch (err) { 
    console.error(err);
    return notFound(res, 'User not found'); 
  }
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id)
    return badRequest(res, 'You cannot delete your own admin account');
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    return success(res, null, 'User deleted');
  } catch (err) { 
    console.error(err);
    return notFound(res, 'User not found'); 
  }
});

router.get('/certificates', async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const [certs, total] = await Promise.all([
      prisma.certificate.findMany({
        include:  { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy:  { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.certificate.count(),
    ]);
    return success(res, { certs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to fetch certificates'); 
  }
});

router.put('/certificates/:id/verify', async (req, res) => {
  try {
    const cert = await prisma.certificate.update({
      where: { id: req.params.id },
      data: { status: 'verified', verifiedAt: new Date(), verifiedBy: req.user.id },
    });
    await prisma.user.update({ 
      where: { id: cert.userId }, 
      data: { meritCoins: { increment: 1 } } 
    });
    await prisma.notification.create({ 
      data: { 
        userId: cert.userId, 
        type: 'success', 
        icon: 'certificate', 
        title: 'Certificate Verified!', 
        message: `${cert.title} has been verified. +1 Merit Coin!` 
      } 
    });
    return success(res, cert, 'Certificate verified');
  } catch (err) { 
    console.error(err);
    return notFound(res, 'Certificate not found'); 
  }
});

router.get('/jobs', async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        include:  { _count: { select: { applications: true } } },
        orderBy:  { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.job.count(),
    ]);
    return success(res, { jobs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to fetch jobs'); 
  }
});

router.put('/jobs/:id', async (req, res) => {
  const ALLOWED = ['title', 'company', 'location', 'type', 'salary', 'skills', 'description', 'status', 'minTier', 'isPremium'];
  const data = {};
  ALLOWED.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  if (!Object.keys(data).length) return badRequest(res, 'No updatable fields provided');
  try {
    const job = await prisma.job.update({ where: { id: req.params.id }, data });
    return success(res, job, 'Job updated');
  } catch (err) { 
    console.error(err);
    return notFound(res, 'Job not found'); 
  }
});

router.get('/payments', async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.payment.count(),
    ]);
    return success(res, { payments, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to fetch payments'); 
  }
});

// ── GET /admin/settings/billing ───────────────────────────────────────────────
// Returns current billing toggle state.
router.get('/settings/billing', async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'employer_billing_enabled' },
    });
    return success(res, {
      employer_billing_enabled: setting?.value === 'true',
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch billing settings');
  }
});

// ── PUT /admin/settings/billing ───────────────────────────────────────────────
// Toggles employer billing on or off.
// Body: { enabled: boolean }
router.put('/settings/billing', async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return badRequest(res, '`enabled` must be a boolean');
  }
  try {
    const setting = await prisma.systemSetting.upsert({
      where:  { key: 'employer_billing_enabled' },
      update: { value: String(enabled), updatedBy: req.user.id },
      create: { key: 'employer_billing_enabled', value: String(enabled), updatedBy: req.user.id },
    });
    return success(res, {
      employer_billing_enabled: setting.value === 'true',
    }, `Employer billing ${enabled ? 'enabled' : 'disabled'} successfully`);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to update billing settings');
  }
});

module.exports = router;