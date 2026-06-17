const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, notFound, badRequest, error } = require('../utils/response');
const meritlives = require('../services/meritlivesClient');

/**
 * Merges local (Prisma) courses with live Meritlives courses into one
 * unified list, attaching the current user's enrollment/progress to each.
 * Meritlives course data is never stored — it's fetched fresh from
 * meritlivesClient (which holds only a short-lived in-memory cache).
 */
async function buildUnifiedCourseList(userId, filters = {}) {
  const { category, level, search } = filters;

  const [localCourses, meritlivesCourses, enrollments] = await Promise.all([
    prisma.course.findMany({
      where: {
        ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
        ...(level    ? { level:    { equals: level,    mode: 'insensitive' } } : {}),
        ...(search   ? { title:    { contains: search, mode: 'insensitive' } } : {}),
      },
    }),
    meritlives.listCourses({ category, level, search }),
    prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true, source: true, progress: true },
    }),
  ]);

  const enrollmentMap = new Map(
    enrollments.map(e => [`${e.source}:${e.courseId}`, e.progress])
  );

  const attach = (course, source) => {
    const key = `${source}:${course.id}`;
    const progress = enrollmentMap.get(key);
    return {
      ...course,
      source,
      enrolled: progress !== undefined,
      progress: progress ?? 0,
    };
  };

  return [
    ...localCourses.map(c => attach(c, 'local')),
    ...meritlivesCourses.map(c => attach(c, 'meritlives')),
  ];
}

/** Looks up a course by id regardless of which system it lives in. */
async function findCourseAnySource(id) {
  const local = await prisma.course.findUnique({ where: { id } });
  if (local) return { course: local, source: 'local' };

  const remote = await meritlives.getCourse(id);
  if (remote) return { course: remote, source: 'meritlives' };

  return { course: null, source: null };
}

router.get('/', authenticate, async (req, res) => {
  const { category, level, search } = req.query;
  try {
    const result = await buildUnifiedCourseList(req.user.id, { category, level, search });
    return success(res, result);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch courses');
  }
});

router.get('/enrolled', authenticate, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({ where: { userId: req.user.id } });

    const localIds     = enrollments.filter(e => e.source === 'local').map(e => e.courseId);
    const meritliveIds = enrollments.filter(e => e.source === 'meritlives').map(e => e.courseId);

    const [localCourses, meritliveCourses] = await Promise.all([
      localIds.length
        ? prisma.course.findMany({ where: { id: { in: localIds } } })
        : Promise.resolve([]),
      Promise.all(meritliveIds.map(id => meritlives.getCourse(id))),
    ]);

    const byKey = new Map();
    localCourses.forEach(c => byKey.set(`local:${c.id}`, { ...c, source: 'local' }));
    meritliveCourses.filter(Boolean).forEach(c => byKey.set(`meritlives:${c.id}`, c));

    const result = enrollments
      .map(e => {
        const course = byKey.get(`${e.source}:${e.courseId}`);
        if (!course) return null; // course was deleted/unpublished on its source system
        return { ...course, enrolled: true, progress: e.progress };
      })
      .filter(Boolean);

    return success(res, result);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch enrollments');
  }
});

router.get('/recommended', authenticate, async (req, res) => {
  try {
    const enrolled = await prisma.enrollment.findMany({
      where: { userId: req.user.id },
      select: { courseId: true, source: true },
    });
    const enrolledLocalIds     = enrolled.filter(e => e.source === 'local').map(e => e.courseId);
    const enrolledMeritliveIds = new Set(enrolled.filter(e => e.source === 'meritlives').map(e => e.courseId));

    const [localCourses, meritliveCourses] = await Promise.all([
      prisma.course.findMany({
        where: { id: { notIn: enrolledLocalIds } },
        take: 4,
        orderBy: { rating: 'desc' },
      }),
      meritlives.listCourses({ perPage: 10 }),
    ]);

    const recommended = [
      ...localCourses.map(c => ({ ...c, source: 'local', enrolled: false, progress: 0 })),
      ...meritliveCourses
        .filter(c => !enrolledMeritliveIds.has(c.id))
        .map(c => ({ ...c, enrolled: false, progress: 0 })),
    ]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 4);

    return success(res, recommended);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch recommendations');
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { course, source } = await findCourseAnySource(req.params.id);
    if (!course) return notFound(res, 'Course not found');

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId_source: { userId: req.user.id, courseId: req.params.id, source } },
    });

    return success(res, {
      ...course,
      source,
      enrolled: Boolean(enrollment),
      progress: enrollment?.progress ?? 0,
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch course');
  }
});

router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const { course, source } = await findCourseAnySource(req.params.id);
    if (!course) return notFound(res, 'Course not found');

    // ── Premium gate: check if course requires premium and user isn't premium ──
    if (course.isPremium && !req.user.isPremium) {
      return res.status(402).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        message: 'This course requires a Pro subscription.',
      });
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId_source: { userId: req.user.id, courseId: course.id, source } },
    });
    if (existing) return badRequest(res, 'Already enrolled');

    await prisma.enrollment.create({
      data: {
        userId: req.user.id,
        courseId: course.id,
        source,
        category: course.category,
        title: course.title,
      },
    });

    if (source === 'local') {
      await prisma.course.update({
        where: { id: course.id },
        data: { enrollCount: { increment: 1 } },
      });
    }
    // Meritlives enrollCount lives in Digital Skills' own database and is
    // already incremented there when a student enrolls through that flow;
    // SkillHub doesn't write to it to avoid two systems racing to update
    // the same counter.

    await prisma.user.update({
      where: { id: req.user.id },
      data: { meritCoins: { increment: 1 } },
    });
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'info',
        icon: 'book',
        title: 'Course Enrolled',
        message: `You enrolled in ${course.title}`,
      },
    });

    return success(res, { enrolled: true }, `Enrolled in ${course.title}!`);
  } catch (err) {
    console.error(err);
    return error(res, 'Enrollment failed');
  }
});

router.put('/:id/progress', authenticate, async (req, res) => {
  const progress = parseInt(req.body.progress, 10);
  if (isNaN(progress) || progress < 0 || progress > 100) {
    return badRequest(res, 'Progress must be a number between 0 and 100');
  }
  try {
    const source = req.body.source === 'meritlives' ? 'meritlives' : 'local';

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId_source: { userId: req.user.id, courseId: req.params.id, source } },
    });
    if (!enrollment) return notFound(res, 'Not enrolled in this course');

    await prisma.enrollment.update({
      where: { userId_courseId_source: { userId: req.user.id, courseId: req.params.id, source } },
      data: {
        progress,
        ...(progress === 100 ? { completedAt: new Date() } : {}),
      },
    });

    if (progress === 100) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { meritCoins: { increment: 1 } },
      });
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          type: 'success',
          icon: 'certificate',
          title: 'Course Completed!',
          message: `You completed ${enrollment.title ?? 'your course'}. +1 Merit Coin!`,
        },
      });
    }

    return success(res, { progress }, 'Progress updated');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to update progress');
  }
});

module.exports = router;