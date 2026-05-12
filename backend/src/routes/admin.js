const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { success, notFound, error } = require('../utils/response');

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
  } catch (err) { console.error(err); return error(res, 'Failed to fetch stats'); }
});

router.get('/users', async (req, res) => {
  const { role, search } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(search ? { OR: [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, verified: true, meritCoins: true, createdAt: true, company: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, { users, total: users.length });
  } catch (err) { return error(res, 'Failed to fetch users'); }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, email: true, firstName: true, lastName: true, role: true, verified: true, meritCoins: true, createdAt: true, title: true, bio: true, skills: true } });
    if (!user) return notFound(res, 'User not found');
    return success(res, user);
  } catch (err) { return error(res, 'Failed to fetch user'); }
});

router.put('/users/:id', async (req, res) => {
  const ALLOWED = ['role', 'verified', 'meritCoins', 'title'];
  const data = {};
  ALLOWED.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  if (!Object.keys(data).length) return notFound(res, 'No updatable fields provided');
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: { id: true, email: true, firstName: true, lastName: true, role: true, verified: true, meritCoins: true } });
    return success(res, user, 'User updated');
  } catch (err) { return notFound(res, 'User not found'); }
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) return success(res, null, 'Cannot delete your own account');
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    return success(res, null, 'User deleted');
  } catch (err) { return notFound(res, 'User not found'); }
});

router.get('/certificates', async (req, res) => {
  try {
    const certs = await prisma.certificate.findMany({ include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: 'desc' } });
    return success(res, certs);
  } catch (err) { return error(res, 'Failed to fetch certificates'); }
});

router.put('/certificates/:id/verify', async (req, res) => {
  try {
    const cert = await prisma.certificate.update({
      where: { id: req.params.id },
      data: { status: 'verified', verifiedAt: new Date(), verifiedBy: req.user.id },
    });
    await prisma.user.update({ where: { id: cert.userId }, data: { meritCoins: { increment: 50 } } });
    await prisma.notification.create({ data: { userId: cert.userId, type: 'success', icon: 'certificate', title: 'Certificate Verified!', message: `${cert.name} has been verified. +50 Merit Coins!` } });
    return success(res, cert, 'Certificate verified');
  } catch (err) { return notFound(res, 'Certificate not found'); }
});

router.get('/jobs', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({ include: { _count: { select: { applications: true } } }, orderBy: { postedAt: 'desc' } });
    return success(res, jobs);
  } catch (err) { return error(res, 'Failed to fetch jobs'); }
});

router.put('/jobs/:id', async (req, res) => {
  try {
    const job = await prisma.job.update({ where: { id: req.params.id }, data: req.body });
    return success(res, job, 'Job updated');
  } catch (err) { return notFound(res, 'Job not found'); }
});

router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return success(res, payments);
  } catch (err) { return error(res, 'Failed to fetch payments'); }
});

module.exports = router;
