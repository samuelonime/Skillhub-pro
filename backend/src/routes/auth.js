const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, sanitizeUser } = require('../utils/jwt');
const { success, created, badRequest, unauthorized, error } = require('../utils/response');
const { authenticate } = require('../middleware/auth');

// REGISTER
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Z])(?=.*[0-9])/),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('role').isIn(['student', 'employer', 'instructor']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());

  const { email, password, firstName, lastName, role, company } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return badRequest(res, 'Email already registered');

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email, password: hashed, firstName, lastName, role,
        company: company || null,
        avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=4f46e5&color=fff&bold=true`,
        title: role === 'employer' ? 'Employer' : 'Learner',
      },
    });

    const accessToken  = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });
    const expiresAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
    await prisma.notification.create({ data: { userId: user.id, type: 'success', icon: 'star', title: 'Welcome to SkillHub!', message: 'Your account has been created. Start exploring courses and opportunities.' } });

    return created(res, { user: sanitizeUser(user), accessToken, refreshToken }, 'Account created successfully');
  } catch (err) {
    console.error(err);
    return error(res, 'Registration failed');
  }
});

// LOGIN
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());

  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return unauthorized(res, 'Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return unauthorized(res, 'Invalid credentials');

    const accessToken  = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });
    const expiresAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    return success(res, { user: sanitizeUser(user), accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    console.error(err);
    return error(res, 'Login failed');
  }
});

// REFRESH TOKEN
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return unauthorized(res, 'Refresh token required');

  try {
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) return unauthorized(res, 'Invalid or expired refresh token');

    const decoded = verifyRefreshToken(refreshToken);
    const user    = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return unauthorized(res, 'User not found');

    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const newAccessToken  = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });
    const expiresAt       = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: user.id, expiresAt } });

    return success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch {
    return unauthorized(res, 'Invalid refresh token');
  }
});

// LOGOUT
router.post('/logout', authenticate, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
  return success(res, null, 'Logged out successfully');
});

// ME
router.get('/me', authenticate, (req, res) => success(res, sanitizeUser(req.user)));

module.exports = router;
