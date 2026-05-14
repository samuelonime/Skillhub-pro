// routes/resume.js — Resume upload + Portfolio visibility toggle
const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, created, error, badRequest } = require('../utils/response');

// ── Multer config ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `resume_${req.user.id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only PDF, DOC, DOCX files are allowed'));
  },
});

// ── POST /api/v1/resume — upload resume ───────────────────────────────────────
router.post('/', authenticate, upload.single('resume'), async (req, res) => {
  if (!req.file) return badRequest(res, 'No file uploaded');

  try {
    // Delete old resume file if exists
    const existing = await prisma.resumeUpload.findUnique({ where: { userId: req.user.id } });
    if (existing) {
      const oldPath = path.join(uploadDir, path.basename(existing.fileUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const fileUrl = `/uploads/resumes/${req.file.filename}`;

    const resume = await prisma.resumeUpload.upsert({
      where:  { userId: req.user.id },
      create: { userId: req.user.id, fileUrl, fileName: req.file.originalname },
      update: { fileUrl, fileName: req.file.originalname, updatedAt: new Date() },
    });

    // Boost profile strength for having a resume
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { profileStrength: { increment: 10 } },
    });

    // Award merit coins (first time only)
    if (!existing) {
      await prisma.user.update({
        where: { id: req.user.id },
        data:  { meritCoins: { increment: 20 } },
      });
      await prisma.notification.create({
        data: {
          userId:  req.user.id,
          type:    'success',
          icon:    'file-pdf',
          title:   'Resume Uploaded!',
          message: 'Your resume is now visible to employers. +20 MeritCoins earned!',
        },
      });
    }

    return created(res, { fileUrl, fileName: req.file.originalname }, 'Resume uploaded successfully');
  } catch (err) {
    console.error(err);
    // Clean up uploaded file on error
    if (req.file) fs.unlinkSync(req.file.path);
    return error(res, 'Failed to save resume');
  }
});

// ── GET /api/v1/resume — get current resume ───────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const resume = await prisma.resumeUpload.findUnique({ where: { userId: req.user.id } });
    return success(res, resume || null);
  } catch (err) {
    return error(res, 'Failed to fetch resume');
  }
});

// ── DELETE /api/v1/resume — delete resume ─────────────────────────────────────
router.delete('/', authenticate, async (req, res) => {
  try {
    const resume = await prisma.resumeUpload.findUnique({ where: { userId: req.user.id } });
    if (!resume) return badRequest(res, 'No resume found');

    // Delete file
    const filePath = path.join(__dirname, '../../', resume.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.resumeUpload.delete({ where: { userId: req.user.id } });

    return success(res, null, 'Resume deleted');
  } catch (err) {
    return error(res, 'Failed to delete resume');
  }
});

// ── PUT /api/v1/resume/visibility — toggle portfolio public/private ───────────
router.put('/visibility', authenticate, async (req, res) => {
  const { portfolioPublic } = req.body;
  if (typeof portfolioPublic !== 'boolean') {
    return badRequest(res, 'portfolioPublic must be a boolean');
  }

  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { portfolioPublic },
    });

    return success(res, { portfolioPublic }, `Portfolio is now ${portfolioPublic ? 'public' : 'private'}`);
  } catch (err) {
    return error(res, 'Failed to update visibility');
  }
});

// ── GET /api/v1/resume/visibility — get current visibility ───────────────────
router.get('/visibility', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { portfolioPublic: true },
    });
    return success(res, { portfolioPublic: user?.portfolioPublic ?? false });
  } catch (err) {
    return error(res, 'Failed to get visibility');
  }
});

// ── Multer error handler ──────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return badRequest(res, 'File too large. Maximum size is 5MB.');
    return badRequest(res, err.message);
  }
  if (err) return badRequest(res, err.message);
  next();
});

module.exports = router;