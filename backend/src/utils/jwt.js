const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Warn loudly in development if secrets are weak/missing
if (process.env.NODE_ENV !== 'test') {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET is missing or too short. Set a strong 64-char secret in .env');
  }
  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
    console.warn('⚠️  JWT_REFRESH_SECRET is missing or too short. Set a strong 64-char secret in .env');
  }
}

const generateAccessToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET);

const sanitizeUser = (user) => {
  // Never expose password or internal token data
  const { password, ...safe } = user;
  return safe;
};

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, sanitizeUser };
