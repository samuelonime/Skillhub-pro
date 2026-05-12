const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../config/database');
const { unauthorized, forbidden } = require('../utils/response');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return unauthorized(res, 'Access token required');

  const token = header.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user    = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return unauthorized(res, 'User not found');
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
