// routes/resume.js — Resume upload + Portfolio visibility toggle
const router  = require('express').Router();
const multer  = require('multer');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadRaw, deleteFile } = require('../utils/cloudinary');
const { success, created, error, badRequest } = require('../utils/response');

// ── Multer config — memory storage, buffer goes straight to Cloudinary ─────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword',
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOC and DOCX files are allowed'));
  },
});

// ── POST /api/v1/resume — upload resume ───────────────────────────────────────
router.post('/', authenticate, upload.single('resume'), async (req, res) => {
  if (!req.file) return badRequest(res, 'No file uploaded');

  try {
    const fileUrl = await uploadRaw(req.file.buffer, 'skillhub/resumes', `resume-${req.user.id}`);

    const existing = await prisma.resumeUpload.findUnique({ where: { userId: req.user.id } });

    await prisma.resumeUpload.upsert({
      where:  { userId: req.user.id },
      create: { userId: req.user.id, fileUrl, fileName: req.file.originalname },
      update: { fileUrl, fileName: req.file.originalname, updatedAt: new Date() },
    });

    // Boost profile strength — capped at 100
    await prisma.$executeRaw`
      UPDATE users
      SET    "profileStrength" = LEAST("profileStrength" + 10, 100)
      WHERE  id = ${req.user.id}
    `;

    // Award merit coins (first time only)
    if (!existing) {
      await prisma.user.update({
        where: { id: req.user.id },
        data:  { meritCoins: { increment: 1 } },
      });
      await prisma.notification.create({
        data: {
          userId:  req.user.id,
          type:    'success',
          icon:    'file-pdf',
          title:   'Resume Uploaded!',
          message: 'Your resume is now visible to employers. +1 MeritCoin earned!',
        },
      });
    }

    return created(res, { fileUrl, fileName: req.file.originalname }, 'Resume uploaded successfully');
  } catch (err) {
    console.error('Resume upload error:', err);
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

    await deleteFile(`skillhub/resumes/resume-${req.user.id}`, 'raw');
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
    await prisma.user.update({ where: { id: req.user.id }, data: { portfolioPublic } });
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