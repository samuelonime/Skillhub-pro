const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../config/database');
const { unauthorized, forbidden, error } = require('../utils/response');

const authenticate = async (req, res, next) => {
  // Read from HttpOnly cookie first, fall back to Authorization header
  let token = req.cookies?.sh_access;

  if (!token) {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    }
  }

  if (!token) return unauthorized(res, 'Access token required');

  try {
    const decoded = verifyAccessToken(token);
    const user    = await prisma.user.findUnique({
      where:   { id: decoded.id },
      include: {
        skills:       { select: { id: true, name: true, level: true, verified: true } },
        resume:       { select: { fileUrl: true, fileName: true, updatedAt: true } },
        enrolledPaths: {
          select: { pathId: true, progress: true, completedAt: true,
                    path: { select: { title: true, category: true, tags: true } } },
        },
      },
    });
    if (!user)          return unauthorized(res, 'User not found');
    if (!user.isActive) return unauthorized(res, 'Account is deactivated');
    req.user = user;
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired token');
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return forbidden(res, 'Insufficient permissions');
  next();
};

/**
 * requireEmployerAccess
 * ---------------------
 * Checks that the authenticated employer either:
 *   (a) billing is disabled globally (admin toggle), OR
 *   (b) is still within their 7-day free trial, OR
 *   (c) has an active subscription that has not expired.
 *
 * Attaches `req.employerAccess` with details about current access state
 * so routes / the frontend can show contextual messaging.
 *
 * Must be used AFTER `authenticate` and `requireRole('employer', 'admin')`.
 * Admin users bypass the check entirely.
 */
const requireEmployerAccess = async (req, res, next) => {
  try {
    // Admins always have access
    if (req.user.role === 'admin') {
      req.employerAccess = { type: 'admin', active: true };
      return next();
    }

    // ── 0. Check global billing toggle ────────────────────────────────────
    const billingSetting = await prisma.systemSetting.findUnique({
      where: { key: 'employer_billing_enabled' },
    });
    const billingEnabled = billingSetting?.value === 'true';

    if (!billingEnabled) {
      req.employerAccess = { type: 'free', active: true };
      return next();
    }

    const now = new Date();

    // ── 1. Check free trial ────────────────────────────────────────────────
    const trialEndsAt = req.user.trialEndsAt ? new Date(req.user.trialEndsAt) : null;
    if (trialEndsAt && trialEndsAt > now) {
      const msLeft       = trialEndsAt.getTime() - now.getTime();
      const daysLeft     = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      req.employerAccess = { type: 'trial', active: true, trialEndsAt, daysLeft };
      return next();
    }

    // ── 2. Check active subscription ──────────────────────────────────────
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: 'active',
        plan:   { in: ['employer_monthly', 'employer_annual'] },
        endDate: { gt: now },
      },
      orderBy: { endDate: 'desc' },
    });

    if (subscription) {
      req.employerAccess = { type: 'subscription', active: true, subscription };
      return next();
    }

    // ── 3. No valid access — determine why ────────────────────────────────
    const trialExpired = trialEndsAt && trialEndsAt <= now;
    return res.status(402).json({
      success:      false,
      code:         'SUBSCRIPTION_REQUIRED',
      trialExpired: !!trialExpired,
      trialEndsAt:  trialEndsAt ?? null,
      message:      trialExpired
        ? 'Your 7-day free trial has expired. Please subscribe to continue using employer features.'
        : 'An active employer subscription is required to access this feature.',
    });
  } catch (err) {
    console.error('requireEmployerAccess error:', err);
    return error(res, 'Failed to verify employer access');
  }
};

module.exports = { authenticate, requireRole, requireEmployerAccess, optionalAuthenticate };

// optionalAuthenticate — sets req.user if a valid token is present, but never blocks the request
async function optionalAuthenticate(req, _res, next) {
  try {
    let token = req.cookies?.sh_access;
    if (!token) {
      const header = req.headers.authorization;
      if (header?.startsWith('Bearer ')) token = header.split(' ')[1];
    }
    if (!token) return next();
    const { verifyAccessToken } = require('../utils/jwt');
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, role: true, isActive: true } });
    if (user?.isActive) req.user = user;
  } catch { /* ignore */ }
  next();
}