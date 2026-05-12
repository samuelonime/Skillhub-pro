const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, notFound, badRequest, error } = require('../utils/response');

router.get('/', authenticate, async (req, res) => {
  const { category, level, search } = req.query;
  try {
    const courses = await prisma.course.findMany({
      where: {
        ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
        ...(level    ? { level:    { equals: level,    mode: 'insensitive' } } : {}),
        ...(search   ? { title:    { contains: search, mode: 'insensitive' } } : {}),
      },
      include: { enrollments: { where: { userId: req.user.id }, select: { progress: true } } },
    });
    const result = courses.map(c => ({
      ...c,
      enrolled: c.enrollments.length > 0,
      progress: c.enrollments[0]?.progress ?? 0,
      enrollments: undefined,
    }));
    return success(res, result);
  } catch (err) { console.error(err); return error(res, 'Failed to fetch courses'); }
});

router.get('/enrolled', authenticate, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user.id },
      include: { course: true },
    });
    return success(res, enrollments.map(e => ({ ...e.course, enrolled: true, progress: e.progress })));
  } catch (err) { return error(res, 'Failed to fetch enrollments'); }
});

router.get('/recommended', authenticate, async (req, res) => {
  try {
    const enrolled = await prisma.enrollment.findMany({ where: { userId: req.user.id }, select: { courseId: true } });
    const enrolledIds = enrolled.map(e => e.courseId);
    const courses = await prisma.course.findMany({
      where: { id: { notIn: enrolledIds } },
      take: 4,
      orderBy: { rating: 'desc' },
    });
    return success(res, courses.map(c => ({ ...c, enrolled: false, progress: 0 })));
  } catch (err) { return error(res, 'Failed to fetch recommendations'); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { enrollments: { where: { userId: req.user.id } } },
    });
    if (!course) return notFound(res, 'Course not found');
    return success(res, { ...course, enrolled: course.enrollments.length > 0, progress: course.enrollments[0]?.progress ?? 0 });
  } catch (err) { return error(res, 'Failed to fetch course'); }
});

router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!course) return notFound(res, 'Course not found');

    const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId: course.id } } });
    if (existing) return badRequest(res, 'Already enrolled');

    await prisma.enrollment.create({ data: { userId: req.user.id, courseId: course.id } });
    await prisma.course.update({ where: { id: course.id }, data: { enrollCount: { increment: 1 } } });
    await prisma.user.update({ where: { id: req.user.id }, data: { meritCoins: { increment: 10 } } });
    await prisma.notification.create({ data: { userId: req.user.id, type: 'info', icon: 'book', title: 'Course Enrolled', message: `You enrolled in ${course.title}` } });

    return success(res, { enrolled: true }, `Enrolled in ${course.title}!`);
  } catch (err) { console.error(err); return error(res, 'Enrollment failed'); }
});

router.put('/:id/progress', authenticate, async (req, res) => {
  const { progress } = req.body;
  if (progress < 0 || progress > 100) return badRequest(res, 'Progress must be 0–100');
  try {
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.user.id, courseId: req.params.id } } });
    if (!enrollment) return notFound(res, 'Not enrolled in this course');

    await prisma.enrollment.update({
      where: { userId_courseId: { userId: req.user.id, courseId: req.params.id } },
      data: { progress, ...(progress === 100 ? { completedAt: new Date() } : {}) },
    });

    if (progress === 100) {
      const course = await prisma.course.findUnique({ where: { id: req.params.id } });
      await prisma.user.update({ where: { id: req.user.id }, data: { meritCoins: { increment: 100 } } });
      await prisma.notification.create({ data: { userId: req.user.id, type: 'success', icon: 'certificate', title: 'Course Completed!', message: `You completed ${course.title}. +100 Merit Coins!` } });
    }

    return success(res, { progress }, 'Progress updated');
  } catch (err) { return error(res, 'Failed to update progress'); }
});

module.exports = router;
