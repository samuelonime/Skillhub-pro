const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, created, notFound, badRequest, error } = require('../utils/response');

router.get('/', authenticate, async (req, res) => {
  try {
    const [projects, certificates] = await Promise.all([
      prisma.project.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }),
      prisma.certificate.findMany({ where: { userId: req.user.id } }),
    ]);
    return success(res, {
      user: { id: req.user.id, name: `${req.user.firstName} ${req.user.lastName}`, title: req.user.title, bio: req.user.bio, location: req.user.location, avatar: req.user.avatar, skills: req.user.skills },
      projects, certificates,
      stats: {
        projectCount: projects.length,
        avgScore: projects.length ? (projects.reduce((s, p) => s + p.score, 0) / projects.length).toFixed(1) : 0,
        totalViews: projects.reduce((s, p) => s + p.views, 0),
        certCount: certificates.length,
      },
    });
  } catch (err) { return error(res, 'Failed to load portfolio'); }
});

router.get('/projects', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    return success(res, projects);
  } catch (err) { return error(res, 'Failed to fetch projects'); }
});

router.post('/projects', authenticate, [
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('description').isLength({ min: 10, max: 1000 }),
  body('technologies').isArray({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  try {
    const project = await prisma.project.create({
      data: {
        ...req.body,
        userId:    req.user.id,
        score:     parseFloat((Math.random() * 2 + 7.5).toFixed(1)),
        thumbnail: `https://placehold.co/400x250/4f46e5/white?text=${encodeURIComponent(req.body.title.substring(0, 15))}`,
      },
    });
    await prisma.user.update({ where: { id: req.user.id }, data: { meritCoins: { increment: 25 } } });
    return created(res, project, 'Project added! +25 Merit Coins');
  } catch (err) { return error(res, 'Failed to add project'); }
});

router.put('/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!project) return notFound(res, 'Project not found');
    const updated = await prisma.project.update({ where: { id: req.params.id }, data: req.body });
    return success(res, updated, 'Project updated');
  } catch (err) { return error(res, 'Failed to update project'); }
});

router.delete('/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!project) return notFound(res, 'Project not found');
    await prisma.project.delete({ where: { id: req.params.id } });
    return success(res, null, 'Project deleted');
  } catch (err) { return error(res, 'Failed to delete project'); }
});

router.put('/skills', authenticate, async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills)) return badRequest(res, 'Skills must be an array');
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { skills } });
    return success(res, { skills }, 'Skills updated');
  } catch (err) { return error(res, 'Failed to update skills'); }
});

module.exports = router;
