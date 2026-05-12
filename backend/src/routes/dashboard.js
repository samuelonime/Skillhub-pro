const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const [enrollments, certificates, applications, notifications] = await Promise.all([
      prisma.enrollment.findMany({ where: { userId } }),
      prisma.certificate.findMany({ where: { userId } }),
      prisma.application.findMany({ where: { userId } }),
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    const completedCourses = enrollments.filter(e => e.progress === 100);
    const activeCourses    = enrollments.filter(e => e.progress > 0 && e.progress < 100);

    return success(res, {
      user: { id: req.user.id, name: `${req.user.firstName} ${req.user.lastName}`, avatar: req.user.avatar, role: req.user.role, title: req.user.title, meritCoins: req.user.meritCoins, profileStrength: req.user.profileStrength },
      stats: {
        coursesEnrolled: enrollments.length,
        coursesCompleted: completedCourses.length,
        activeCourses: activeCourses.length,
        certificates: certificates.length,
        jobApplications: applications.length,
        meritCoins: req.user.meritCoins,
        profileStrength: req.user.profileStrength,
      },
      unreadNotifications: notifications.filter(n => !n.read).length,
      recentNotifications: notifications.slice(0, 5),
    });
  } catch (err) { console.error(err); return error(res, 'Failed to load dashboard'); }
});

router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const [enrolled, certs, apps] = await Promise.all([
      prisma.enrollment.count({ where: { userId } }),
      prisma.certificate.count({ where: { userId } }),
      prisma.application.count({ where: { userId } }),
    ]);
    return success(res, { coursesEnrolled: enrolled, certificates: certs, jobApplications: apps, meritCoins: req.user.meritCoins, profileStrength: req.user.profileStrength });
  } catch (err) { return error(res, 'Failed to fetch stats'); }
});

router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifs = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 30 });
    return success(res, notifs);
  } catch (err) { return error(res, 'Failed to fetch notifications'); }
});

router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { read: true } });
    return success(res, null, 'Marked as read');
  } catch (err) { return error(res, 'Failed to mark notification'); }
});

router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id }, data: { read: true } });
    return success(res, null, 'All marked as read');
  } catch (err) { return error(res, 'Failed to mark notifications'); }
});

module.exports = router;
