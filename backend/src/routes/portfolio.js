const router = require('express').Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadImage } = require('../utils/cloudinary');
const { success, created, notFound, badRequest, error } = require('../utils/response');

// ── Multer — memory storage for project thumbnails ─────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
  },
});

// POST /portfolio/projects/upload-image — upload project thumbnail to Cloudinary
router.post('/projects/upload-image', authenticate, upload.single('image'), async (req, res) => {
  if (!req.file) return badRequest(res, 'No image uploaded');
  try {
    const publicId = `project-${req.user.id}-${Date.now()}`;
    const url = await uploadImage(req.file.buffer, 'skillhub/projects', publicId);
    return success(res, { url });
  } catch (e) {
    console.error('Project image upload error:', e);
    return error(res, 'Failed to upload image');
  }
});

// Multer error handler (must be before other routes but after multer usage)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return badRequest(res, 'Image too large. Maximum 8MB.');
    return badRequest(res, err.message);
  }
  if (err) return badRequest(res, err.message);
  next();
});

// GET /portfolio
router.get('/', authenticate, async (req, res) => {
  try {
    const [projects, certificates] = await Promise.all([
      prisma.project.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }),
      prisma.certificate.findMany({ where: { userId: req.user.id, status: 'verified' } }),
    ]);
    return success(res, {
      user: {
        id:              req.user.id,
        name:            `${req.user.firstName} ${req.user.lastName}`,
        title:           req.user.title,
        bio:             req.user.bio,
        location:        req.user.location,
        avatar:          req.user.avatar,
        skills:          req.user.skills || [],
        portfolioPublic: req.user.portfolioPublic ?? true,
      },
      projects,
      certificates,
      stats: {
        projectCount: projects.length,
        avgScore:     projects.length ? (projects.reduce((s, p) => s + p.score, 0) / projects.length).toFixed(1) : 0,
        totalViews:   projects.reduce((s, p) => s + p.views, 0),
        certCount:    certificates.length,
      },
    });
  } catch (err) { return error(res, 'Failed to load portfolio'); }
});

// GET /portfolio/projects
router.get('/projects', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    return success(res, projects);
  } catch (err) { return error(res, 'Failed to fetch projects'); }
});

// POST /portfolio/projects
router.post('/projects', authenticate, [
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('description').isLength({ min: 10, max: 1000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  try {
    const { title, description, technologies, liveUrl, githubUrl, thumbnail } = req.body;
    const techs = Array.isArray(technologies) ? technologies : (technologies || '').split(',').map((t) => t.trim()).filter(Boolean);
    const project = await prisma.project.create({
      data: {
        userId:       req.user.id,
        title,
        description,
        technologies: techs,
        techStack:    techs,
        liveUrl:      liveUrl   || null,
        githubUrl:    githubUrl || null,
        score:        parseFloat((Math.random() * 2 + 7.5).toFixed(1)),
        visibility:   'public',
        // Use uploaded thumbnail if provided, otherwise a branded placeholder
        thumbnail:    thumbnail || `https://placehold.co/400x250/4f46e5/white?text=${encodeURIComponent(title.substring(0, 15))}`,
      },
    });
    await prisma.user.update({ where: { id: req.user.id }, data: { meritCoins: { increment: 25 } } });
    return created(res, project, 'Project added! +25 Merit Coins');
  } catch (err) { console.error(err); return error(res, 'Failed to add project'); }
});

// PUT /portfolio/projects/:id
router.put('/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!project) return notFound(res, 'Project not found');
    const { title, description, technologies, liveUrl, githubUrl, thumbnail } = req.body;
    const techs = technologies ? (Array.isArray(technologies) ? technologies : technologies.split(',').map((t) => t.trim()).filter(Boolean)) : project.technologies;
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        title, description,
        technologies: techs, techStack: techs,
        liveUrl, githubUrl,
        // Only update thumbnail if a new one was explicitly provided
        ...(thumbnail !== undefined && { thumbnail }),
      },
    });
    return success(res, updated, 'Project updated');
  } catch (err) { return error(res, 'Failed to update project'); }
});

// DELETE /portfolio/projects/:id
router.delete('/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!project) return notFound(res, 'Project not found');
    await prisma.project.delete({ where: { id: req.params.id } });
    return success(res, null, 'Project deleted');
  } catch (err) { return error(res, 'Failed to delete project'); }
});

// PUT /portfolio/visibility
router.put('/visibility', authenticate, async (req, res) => {
  const { portfolioPublic } = req.body;
  if (typeof portfolioPublic !== 'boolean') return badRequest(res, 'portfolioPublic must be a boolean');
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { portfolioPublic } });
    return success(res, { portfolioPublic }, portfolioPublic ? 'Portfolio is now visible in the community feed' : 'Portfolio hidden from community feed');
  } catch (err) { return error(res, 'Failed to update visibility'); }
});

// PUT /portfolio/projects/:id/community
router.put('/projects/:id/community', authenticate, async (req, res) => {
  const { showInCommunity } = req.body;
  if (typeof showInCommunity !== 'boolean') return badRequest(res, 'showInCommunity must be a boolean');
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!project) return notFound(res, 'Project not found');
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { visibility: showInCommunity ? 'community' : 'public' },
    });
    return success(res, updated, showInCommunity ? 'Project shared to community feed' : 'Project removed from community feed');
  } catch (err) { return error(res, 'Failed to update project visibility'); }
});

// PUT /portfolio/skills
router.put('/skills', authenticate, async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills)) return badRequest(res, 'Skills must be an array');
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { skills } });
    return success(res, { skills }, 'Skills updated');
  } catch (err) { return error(res, 'Failed to update skills'); }
});

module.exports = router;