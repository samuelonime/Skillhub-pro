// routes/skillpaths.js  — full Skill Paths API
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { success, created, notFound, badRequest, error } = require('../utils/response');

// ── GET all skill paths (with enrolment status) ───────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { category, level, search } = req.query;
  try {
    const paths = await prisma.skillPath.findMany({
      where: {
        published: true,
        ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
        ...(level    ? { level:    { equals: level,    mode: 'insensitive' } } : {}),
        ...(search   ? { OR: [
          { title:       { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]} : {}),
      },
      include: {
        courses:  { orderBy: { order: 'asc' } },
        _count:   { select: { enrollments: true } },
        enrollments: { where: { userId: req.user.id }, select: { id: true, progress: true, completedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = paths.map(p => ({
      ...p,
      totalCourses:   p.courses.length,
      enrollCount:    p._count.enrollments,
      enrolled:       p.enrollments.length > 0,
      userProgress:   p.enrollments[0]?.progress ?? 0,
      completedAt:    p.enrollments[0]?.completedAt ?? null,
      enrollments:    undefined,
      _count:         undefined,
    }));

    return success(res, result);
  } catch (err) { console.error(err); return error(res, 'Failed to fetch skill paths'); }
});

// ── GET my enrolled paths ─────────────────────────────────────────────────────
// IMPORTANT: This MUST be placed BEFORE the /:id route to avoid conflict
router.get('/my/enrolled', authenticate, async (req, res) => {
  try {
    const enrollments = await prisma.skillPathEnrollment.findMany({
      where: { userId: req.user.id },
      include: {
        path: {
          include: {
            courses: { orderBy: { order: 'asc' } },
            _count:  { select: { enrollments: true } },
          },
        },
        completedCourses: { select: { courseId: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const result = enrollments.map(e => ({
      enrollmentId:     e.id,
      progress:         e.progress,
      enrolledAt:       e.enrolledAt,
      completedAt:      e.completedAt,
      completedCourses: e.completedCourses.map(c => c.courseId),
      ...e.path,
      enrollCount:      e.path._count.enrollments,
      _count:           undefined,
    }));

    return success(res, result);
  } catch (err) { console.error(err); return error(res, 'Failed to fetch enrolled paths'); }
});

// ── GET single skill path ─────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const path = await prisma.skillPath.findUnique({
      where: { id: req.params.id },
      include: {
        courses: { orderBy: { order: 'asc' } },
        enrollments: {
          where: { userId: req.user.id },
          include: { completedCourses: { select: { courseId: true } } },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!path) return notFound(res, 'Skill path not found');

    const enrollment     = path.enrollments[0] ?? null;
    const completedIds   = enrollment?.completedCourses.map(c => c.courseId) ?? [];

    return success(res, {
      ...path,
      enrolled:         !!enrollment,
      userProgress:     enrollment?.progress ?? 0,
      completedCourses: completedIds,
      enrollCount:      path._count.enrollments,
      enrollments:      undefined,
      _count:           undefined,
    });
  } catch (err) { console.error(err); return error(res, 'Failed to fetch skill path'); }
});

// ── ENROLL in a skill path ────────────────────────────────────────────────────
router.post('/:id/enroll', authenticate, requireRole('student'), async (req, res) => {
  try {
    const path = await prisma.skillPath.findUnique({ where: { id: req.params.id } });
    if (!path) return notFound(res, 'Skill path not found');

    const existing = await prisma.skillPathEnrollment.findUnique({
      where: { userId_pathId: { userId: req.user.id, pathId: req.params.id } },
    });
    if (existing) return badRequest(res, 'Already enrolled in this skill path');

    const enrollment = await prisma.skillPathEnrollment.create({
      data: { userId: req.user.id, pathId: req.params.id },
    });

    // Award merit coins for enrolling
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { meritCoins: { increment: 1 } },
    });

    await prisma.transaction.create({
      data: {
        userId:      req.user.id,
        type:        'earned',
        amount:      1,
        description: `Enrolled in skill path: ${path.title}`,
        balanceAfter: req.user.meritCoins + 1,
      },
    });

    await prisma.notification.create({
      data: {
        userId:  req.user.id,
        type:    'success',
        icon:    'road',
        title:   'Skill Path Started!',
        message: `You enrolled in "${path.title}". +1 MeritCoin earned!`,
      },
    });

    return created(res, enrollment, 'Enrolled successfully');
  } catch (err) { console.error(err); return error(res, 'Failed to enroll'); }
});

// ── MARK a course inside a path as complete ───────────────────────────────────
router.post('/:id/complete-course', authenticate, requireRole('student'), [
  body('courseId').notEmpty().withMessage('courseId required'),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return badRequest(res, 'Validation failed', errs.array());

  const { courseId } = req.body;
  try {
    const enrollment = await prisma.skillPathEnrollment.findUnique({
      where: { userId_pathId: { userId: req.user.id, pathId: req.params.id } },
      include: {
        completedCourses: true,
        path: { include: { courses: true } },
      },
    });
    if (!enrollment) return badRequest(res, 'Not enrolled in this skill path');

    // Check already completed
    const alreadyDone = enrollment.completedCourses.some(c => c.courseId === courseId);
    let createdEvent = false;
    let eventTitle = '';
    let eventBody = '';
    const completedCourse = enrollment.path.courses.find(c => c.id === courseId);
    const courseLabel = completedCourse?.title || 'course';

    if (!alreadyDone) {
      await prisma.skillPathCourseCompletion.create({
        data: { enrollmentId: enrollment.id, courseId },
      });
      createdEvent = true;
      eventTitle = `Completed course: ${courseLabel}`;
      eventBody = `I just completed "${courseLabel}" on SkillHub!`;
    }

    // Recalculate progress
    const totalCourses   = enrollment.path.courses.length;
    const completedCount = enrollment.completedCourses.length + (alreadyDone ? 0 : 1);
    const progress       = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;
    const isComplete     = progress === 100;

    await prisma.skillPathEnrollment.update({
      where: { id: enrollment.id },
      data:  {
        progress,
        completedAt: isComplete ? new Date() : null,
      },
    });

    if (createdEvent) {
      if (isComplete) {
        eventTitle = `Finished skill path: ${enrollment.path.title}`;
        eventBody = `I completed all ${totalCourses} courses in "${enrollment.path.title}"!`;
      }
      await prisma.communityPost.create({
        data: {
          authorId:  req.user.id,
          title:     eventTitle,
          body:      eventBody,
          type:      'showcase',
          tags:      ['course', 'achievement'],
        },
      });
    }

    // Update overall profile strength
    await prisma.$executeRaw`
      UPDATE users
      SET    "profileStrength" = LEAST("profileStrength" + ${isComplete ? 5 : 1}, 100)
      WHERE  id = ${req.user.id}
    `;

    if (isComplete) {
      await prisma.user.update({
        where: { id: req.user.id },
        data:  { meritCoins: { increment: 1 } },
      });
      await prisma.notification.create({
        data: {
          userId:  req.user.id,
          type:    'success',
          icon:    'trophy',
          title:   '🏆 Skill Path Complete!',
          message: `You completed "${enrollment.path.title}"! +1 MeritCoin earned.`,
        },
      });
    }

    return success(res, { progress, completed: isComplete }, isComplete ? 'Skill path completed!' : 'Course marked complete');
  } catch (err) { console.error(err); return error(res, 'Failed to update progress'); }
});

// ── CREATE skill path (instructor / admin only) ───────────────────────────────
router.post('/', authenticate, requireRole('instructor', 'admin'), [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title required (3–100 chars)'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description required'),
  body('category').notEmpty().withMessage('Category required'),
  body('level').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
  body('courses').isArray({ min: 1 }).withMessage('At least one course required'),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return badRequest(res, 'Validation failed', errs.array());

  const { title, description, category, level, thumbnail, courses, tags } = req.body;
  try {
    const path = await prisma.skillPath.create({
      data: {
        title, description, category, level,
        thumbnail: thumbnail || null,
        tags:      tags || [],
        createdBy: req.user.id,
        published: req.user.role === 'admin',
        courses: {
          create: courses.map((c, i) => ({
            title:       c.title,
            provider:    c.provider,
            url:         c.url,
            duration:    c.duration || null,
            isRequired:  c.isRequired !== false,
            order:       i + 1,
            description: c.description || null,
          })),
        },
      },
      include: { courses: true },
    });

    return created(res, path, 'Skill path created');
  } catch (err) { console.error(err); return error(res, 'Failed to create skill path'); }
});

// ── UPDATE skill path ─────────────────────────────────────────────────────────
router.put('/:id', authenticate, requireRole('instructor', 'admin'), async (req, res) => {
  const { title, description, category, level, thumbnail, published, tags } = req.body;
  try {
    const path = await prisma.skillPath.update({
      where: { id: req.params.id },
      data: {
        ...(title       ? { title }       : {}),
        ...(description ? { description } : {}),
        ...(category    ? { category }    : {}),
        ...(level       ? { level }       : {}),
        ...(thumbnail   ? { thumbnail }   : {}),
        ...(tags        ? { tags }        : {}),
        ...(published !== undefined ? { published } : {}),
      },
    });
    return success(res, path, 'Skill path updated');
  } catch (err) { return error(res, 'Failed to update skill path'); }
});

// ── DELETE skill path (admin only) ───────────────────────────────────────────
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await prisma.skillPath.delete({ where: { id: req.params.id } });
    return success(res, null, 'Skill path deleted');
  } catch (err) { return error(res, 'Failed to delete skill path'); }
});

module.exports = router;