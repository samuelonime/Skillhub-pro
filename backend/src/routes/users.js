const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const multer  = require('multer');
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../utils/cloudinary');
const { success, badRequest, error, notFound } = require('../utils/response');

// ── Avatar upload — memory storage (buffer goes straight to Cloudinary) ────────
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG and WebP images are allowed'));
  },
});

// ── POST /users/avatar — upload / replace profile picture ─────────────────────
router.post('/avatar', authenticate, avatarUpload.single('avatar'), async (req, res) => {
  if (!req.file) return badRequest(res, 'No image uploaded');
  try {
    // Each user gets a stable public_id so re-uploading overwrites the old image
    // automatically on Cloudinary — no manual delete needed for replacements.
    const publicId  = `skillhub/avatars/user-${req.user.id}`;
    const avatarUrl = await uploadImage(req.file.buffer, 'skillhub/avatars', `user-${req.user.id}`);

    await prisma.user.update({ where: { id: req.user.id }, data: { avatar: avatarUrl } });
    return success(res, { avatarUrl }, 'Profile picture updated');
  } catch (err) {
    console.error('Avatar upload error:', err);
    return error(res, 'Failed to upload profile picture');
  }
});

// ── DELETE /users/avatar — remove profile picture ─────────────────────────────
router.delete('/avatar', authenticate, async (req, res) => {
  try {
    await deleteImage(`skillhub/avatars/user-${req.user.id}`);
    await prisma.user.update({ where: { id: req.user.id }, data: { avatar: null } });
    return success(res, null, 'Profile picture removed');
  } catch (err) {
    console.error('Avatar delete error:', err);
    return error(res, 'Failed to remove profile picture');
  }
});

// ── GET /users/profile ────────────────────────────────────────────────────────
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true,
                avatar: true, title: true, bio: true, location: true, company: true,
                skills: { select: { id: true, name: true, level: true, verified: true } },
                meritCoins: true, profileStrength: true, verified: true, createdAt: true },
    });
    return success(res, user);
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to fetch profile'); 
  }
});

// ── PUT /users/profile ────────────────────────────────────────────────────────
router.put('/profile', authenticate, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('title').optional().trim().isLength({ max: 100 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('location').optional().trim().isLength({ max: 100 }),
  body('company').optional().trim().isLength({ max: 100 }),
  body('companyWebsite').optional().trim().isURL(),
  body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '500+']),
  body('industry').optional().trim().isLength({ max: 50 }),
  body('phone').optional().trim().matches(/^[+]?[\d\s-]{8,20}$/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());

  // Explicitly define which fields can be updated (prevents mass assignment attacks)
  const ALLOWED = ['firstName', 'lastName', 'title', 'bio', 'location',
                   'company', 'companyWebsite', 'companySize', 'industry', 'phone'];
  const data = {};
  ALLOWED.forEach(k => { 
    if (req.body[k] !== undefined) data[k] = req.body[k]; 
  });

  try {
    const user = await prisma.user.update({ 
      where: { id: req.user.id }, 
      data 
    });
    const { password: _, ...safeUser } = user;
    return success(res, safeUser, 'Profile updated');
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to update profile'); 
  }
});

// ── PUT /users/password ───────────────────────────────────────────────────────
router.put('/password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[A-Z])(?=.*[0-9])/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  try {
    const user  = await prisma.user.findUnique({ where: { id: req.user.id } });
    const match = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!match) return badRequest(res, 'Current password is incorrect');
    const hashed = await bcrypt.hash(req.body.newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });
    return success(res, null, 'Password updated. Please log in again.');
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to update password'); 
  }
});

// ── GET /users/sessions — list active sessions for current user ───────────────
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { userId: req.user.id, isActive: true },
      orderBy: { lastSeenAt: 'desc' },
      select: { id: true, ipAddress: true, browser: true, os: true, device: true, lastSeenAt: true, createdAt: true },
    });
    return success(res, sessions);
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to fetch sessions'); 
  }
});

// ── DELETE /users/sessions/:id — revoke a session ────────────────────────────
router.delete('/sessions/:id', authenticate, async (req, res) => {
  try {
    const session = await prisma.userSession.findFirst({ 
      where: { id: req.params.id, userId: req.user.id } 
    });
    if (!session) return notFound(res, 'Session not found');
    await prisma.userSession.update({ 
      where: { id: req.params.id }, 
      data: { isActive: false } 
    });
    return success(res, null, 'Session revoked');
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to revoke session'); 
  }
});

// ── DELETE /users/sessions — revoke all other sessions ───────────────────────
router.delete('/sessions', authenticate, async (req, res) => {
  try {
    await prisma.userSession.updateMany({ 
      where: { userId: req.user.id }, 
      data: { isActive: false } 
    });
    return success(res, null, 'All sessions revoked');
  } catch (err) { 
    console.error(err);
    return error(res, 'Failed to revoke sessions'); 
  }
});

// ── Multer error handler ──────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return badRequest(res, err.message || 'File upload error');
  }
  next(err);
});

module.exports = router;