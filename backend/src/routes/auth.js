const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, sanitizeUser } = require('../utils/jwt');
const { success, created, badRequest, unauthorized, error } = require('../utils/response');
const { authenticate } = require('../middleware/auth');

const IS_PROD      = process.env.NODE_ENV === 'production';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ── Cookie helpers ────────────────────────────────────────────────────────── */
const ACCESS_COOKIE_OPTS = {
  httpOnly:  true,
  secure:    IS_PROD,           // HTTPS only in prod
  sameSite:  IS_PROD ? 'strict' : 'lax',
  maxAge:    15 * 60 * 1000,   // 15 minutes
  path:      '/',
};
const REFRESH_COOKIE_OPTS = {
  httpOnly:  true,
  secure:    IS_PROD,
  sameSite:  IS_PROD ? 'strict' : 'lax',
  maxAge:    30 * 24 * 60 * 60 * 1000, // 30 days
  path:      '/',
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('sh_access', accessToken,  ACCESS_COOKIE_OPTS);
  res.cookie('sh_refresh', refreshToken, REFRESH_COOKIE_OPTS);
}

function clearAuthCookies(res) {
  res.clearCookie('sh_access',  { path: '/' });
  res.clearCookie('sh_refresh', { path: '/' });
}

/* ── Email helper ──────────────────────────────────────────────────────────── */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not set — email not sent to', to);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body:    JSON.stringify({ from: process.env.EMAIL_FROM || 'SkillHub <noreply@skillhub.pro>', to, subject, html }),
  });
  if (!res.ok) console.error('Resend error:', await res.text());
};

/* ── Shared token creation ─────────────────────────────────────────────────── */
async function issueTokens(res, user) {
  const accessToken  = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });
  const expiresAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
  setAuthCookies(res, accessToken, refreshToken);
  return { accessToken, refreshToken };
}

/* ── GOOGLE OAUTH ──────────────────────────────────────────────────────────── */
router.post('/google', async (req, res) => {
  const { credential, role: requestedRole } = req.body;
  if (!credential) return badRequest(res, 'Google credential required');

  try {
    const ticket  = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, sub: googleId } = payload;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      if (!requestedRole) {
        return unauthorized(res, 'Google account not registered');
      }

      const role = ['student','employer'].includes(requestedRole) ? requestedRole : 'student';
      user = await prisma.user.create({
        data: {
          email,
          password:  await bcrypt.hash(googleId + process.env.JWT_SECRET, 12),
          firstName: given_name || email.split('@')[0],
          lastName:  family_name || '',
          role,
          avatar:    picture || `https://ui-avatars.com/api/?name=${given_name}+${family_name}&background=4f46e5&color=fff&bold=true`,
          title:     role === 'employer' ? 'Employer' : 'Learner',
          verified:  true,
        },
      });
      await prisma.notification.create({ data: { userId: user.id, type: 'success', icon: 'star', message: 'Welcome to SkillHub! Start exploring courses and opportunities.' } });
    }

    await issueTokens(res, user);
    return success(res, { user: sanitizeUser(user) }, 'Google sign-in successful');
  } catch (err) {
    console.error('Google auth error:', err.message);
    return unauthorized(res, 'Invalid Google credential');
  }
});

/* ── REGISTER ──────────────────────────────────────────────────────────────── */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Z])(?=.*[0-9])/),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('role').isIn(['student','employer']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());

  const { email, password, firstName, lastName, role, company } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return badRequest(res, 'Email already registered');

    const hashed = await bcrypt.hash(password, 12);
    const user   = await prisma.user.create({
      data: {
        email, password: hashed, firstName, lastName, role,
        company: company || null,
        avatar:  `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=4f46e5&color=fff&bold=true`,
        title:   role === 'employer' ? 'Employer' : 'student',
      },
    });

    await prisma.notification.create({ data: { userId: user.id, type: 'success', icon: 'star', message: 'Welcome to SkillHub! Start exploring courses and opportunities.' } });
    await issueTokens(res, user);
    return created(res, { user: sanitizeUser(user) }, 'Account created successfully');
  } catch (err) {
    console.error(err);
    return error(res, 'Registration failed');
  }
});

/* ── LOGIN ─────────────────────────────────────────────────────────────────── */
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

    await issueTokens(res, user);
    return success(res, { user: sanitizeUser(user) }, 'Login successful');
  } catch (err) {
    console.error(err);
    return error(res, 'Login failed');
  }
});

/* ── REFRESH TOKEN ─────────────────────────────────────────────────────────── */
router.post('/refresh', async (req, res) => {
  // Read from cookie first, fall back to body (for backward compat)
  const token = req.cookies?.sh_refresh || req.body?.refreshToken;
  if (!token) return unauthorized(res, 'Refresh token required');

  try {
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      clearAuthCookies(res);
      return unauthorized(res, 'Invalid or expired refresh token');
    }

    const decoded = verifyRefreshToken(token);
    const user    = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return unauthorized(res, 'User not found');

    await prisma.refreshToken.delete({ where: { token } });
    await issueTokens(res, user);

    return success(res, { user: sanitizeUser(user) }, 'Token refreshed');
  } catch {
    clearAuthCookies(res);
    return unauthorized(res, 'Invalid refresh token');
  }
});

/* ── LOGOUT ────────────────────────────────────────────────────────────────── */
router.post('/logout', async (req, res) => {
  const token = req.cookies?.sh_refresh || req.body?.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {});
  }
  clearAuthCookies(res);
  return success(res, null, 'Logged out successfully');
});

/* ── ME ────────────────────────────────────────────────────────────────────── */
router.get('/me', authenticate, (req, res) => success(res, sanitizeUser(req.user)));

/* ── FORGOT PASSWORD ───────────────────────────────────────────────────────── */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return badRequest(res, 'Email is required');
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return success(res, null, 'If that email exists, a reset link has been sent.');

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data:  { expiresAt: new Date() },
    });

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail({
      to:      user.email,
      subject: 'Reset your SkillHub password',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f5f5fb;border-radius:16px">
        <h2 style="color:#0a0a0f">Reset your password</h2>
        <p style="color:#6b6b8a">Hi ${user.firstName}, click below to reset your password. Expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background:#5b4cf5;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">Reset Password</a>
        <p style="color:#9898b8;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
      </div>`,
    });

    return success(res, null, 'If that email exists, a reset link has been sent.');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to process request');
  }
});

/* ── RESET PASSWORD ────────────────────────────────────────────────────────── */
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return badRequest(res, 'Token and new password required');
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return badRequest(res, 'Password must be 8+ chars with 1 uppercase and 1 number');
  }
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return badRequest(res, 'Reset link is invalid or expired');
    }
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } });
    await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } });
    await prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } });
    clearAuthCookies(res);
    return success(res, null, 'Password reset successfully. Please log in.');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to reset password');
  }
});

module.exports = router;