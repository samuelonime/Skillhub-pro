const router = require('express').Router();
const bcrypt  = require('bcryptjs');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, badRequest, error } = require('../utils/response');

// ── Avatar upload setup ────────────────────────────────────────────────────────
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename:    (req, _file, cb) => cb(null, `avatar-${req.user.id}-${Date.now()}.jpg`),
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits:  { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG and WebP images are allowed'));
  },
});

// ── POST /users/avatar — upload profile picture ────────────────────────────────
router.post('/avatar', authenticate, avatarUpload.single('avatar'), async (req, res) => {
  if (!req.file) return badRequest(res, 'No image uploaded');
  try {
    // Delete old avatar file if it exists
    const existing = await prisma.user.findUnique({ where: { id: req.user.id }, select: { avatar: true } });
    if (existing?.avatar) {
      const oldPath = path.join(avatarDir, path.basename(existing.avatar));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await prisma.user.update({ where: { id: req.user.id }, data: { avatar: avatarUrl } });
    return success(res, { avatarUrl }, 'Profile picture updated');
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error(err);
    return error(res, 'Failed to update profile picture');
  }
});

// ── DELETE /users/avatar — remove profile picture ──────────────────────────────
router.delete('/avatar', authenticate, async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.user.id }, select: { avatar: true } });
    if (existing?.avatar) {
      const oldPath = path.join(avatarDir, path.basename(existing.avatar));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    await prisma.user.update({ where: { id: req.user.id }, data: { avatar: null } });
    return success(res, null, 'Profile picture removed');
  } catch (err) {
    return error(res, 'Failed to remove profile picture');
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, title: true, bio: true, location: true, company: true, skills: { select: { id: true, name: true, level: true, verified: true } }, meritCoins: true, profileStrength: true, verified: true, createdAt: true } });
    return success(res, user);
  } catch (err) { return error(res, 'Failed to fetch profile'); }
});

router.put('/profile', authenticate, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  const { password, email, role, ...safe } = req.body;
  try {
    const user = await prisma.user.update({ where: { id: req.user.id }, data: safe });
    const { password: _, ...safeUser } = user;
    return success(res, safeUser, 'Profile updated');
  } catch (err) { return error(res, 'Failed to update profile'); }
});

router.put('/password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[A-Z])(?=.*[0-9])/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const match = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!match) return badRequest(res, 'Current password is incorrect');
    const hashed = await bcrypt.hash(req.body.newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });
    return success(res, null, 'Password updated. Please log in again.');
  } catch (err) { return error(res, 'Failed to update password'); }
});

// ── Multer error handler ───────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return badRequest(res, err.message || 'File upload error');
  }
  next(err);
});

module.exports = router;