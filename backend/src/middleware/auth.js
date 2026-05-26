const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../config/database');
const { unauthorized, forbidden } = require('../utils/response');

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

module.exports = { authenticate, requireRole };