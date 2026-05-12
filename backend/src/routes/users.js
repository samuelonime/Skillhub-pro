const router = require('express').Router();
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, badRequest, error } = require('../utils/response');

router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, title: true, bio: true, location: true, company: true, skills: true, meritCoins: true, profileStrength: true, verified: true, createdAt: true } });
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

module.exports = router;
