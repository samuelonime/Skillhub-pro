const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, sanitizeUser } = require('../utils/jwt');
const { success, created, badRequest, unauthorized, error } = require('../utils/response');
const { authenticate } = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Resend email helper — only initialised if RESEND_API_KEY is set
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not set — email not sent to', to);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'SkillHub <noreply@skillhub.pro>', to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
  }
};

// GOOGLE OAUTH
router.post('/google', async (req, res) => {
  const { credential, role: requestedRole } = req.body;
  if (!credential) return badRequest(res, 'Google credential required');

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, sub: googleId } = payload;

    // Find existing user or create new one
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const role = ['student', 'employer', 'instructor'].includes(requestedRole) ? requestedRole : 'student';
      user = await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(googleId + process.env.JWT_SECRET, 12), // unusable password
          firstName: given_name || email.split('@')[0],
          lastName: family_name || '',
          role,
          avatar: picture || `https://ui-avatars.com/api/?name=${given_name}+${family_name}&background=4f46e5&color=fff&bold=true`,
          title: role === 'employer' ? 'Employer' : 'Learner',
          verified: true, // Google already verified the email
        },
      });
      await prisma.notification.create({
        data: {
          userId: user.id, type: 'success', icon: 'star',
          title: 'Welcome to SkillHub!',
          message: 'Your account has been created via Google. Start exploring courses and opportunities.',
        },
      });
    }

    const accessToken  = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });
    const expiresAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    return success(res, { user: sanitizeUser(user), accessToken, refreshToken }, 'Google sign-in successful');
  } catch (err) {
    console.error('Google auth error:', err.message);
    return unauthorized(res, 'Invalid Google credential');
  }
});

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

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return badRequest(res, 'Email is required');

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    // Always return success to avoid email enumeration
    if (!user) return success(res, null, 'If that email exists, a reset link has been sent.');

    // Expire any existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

    const resetUrl = `${process.env.FRONTEND_URL}/login.html?reset=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your SkillHub password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f5f5fb;border-radius:16px">
          <h2 style="color:#0a0a0f;margin-bottom:8px">Reset your password</h2>
          <p style="color:#6b6b8a;margin-bottom:24px">Hi ${user.firstName}, click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background:#5b4cf5;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">Reset Password</a>
          <p style="color:#9898b8;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
        </div>`,
    });

    return success(res, null, 'If that email exists, a reset link has been sent.');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to process request');
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return badRequest(res, 'Token and new password are required');
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return badRequest(res, 'Password must be at least 8 characters with 1 uppercase and 1 number');
  }

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return badRequest(res, 'Reset link is invalid or has expired');
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } });
    await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } });

    return success(res, null, 'Password reset successfully. Please log in.');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to reset password');
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