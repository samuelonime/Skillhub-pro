/**
 * sessionTracker.js
 * Upserts a UserSession record on every authenticated request.
 * Must be mounted AFTER authenticate() so req.user is available.
 */

const prisma = require('../config/database');

// Minimal UA parser — no extra dep needed
function parseUserAgent(ua = '') {
  const browser =
    /Edg\//.test(ua)    ? 'Edge' :
    /Chrome\//.test(ua) ? 'Chrome' :
    /Firefox\//.test(ua)? 'Firefox' :
    /Safari\//.test(ua) ? 'Safari' :
    /MSIE|Trident/.test(ua) ? 'IE' : 'Other';

  const os =
    /Windows/.test(ua)    ? 'Windows' :
    /Macintosh/.test(ua)  ? 'macOS' :
    /iPhone|iPad/.test(ua)? 'iOS' :
    /Android/.test(ua)    ? 'Android' :
    /Linux/.test(ua)      ? 'Linux' : 'Other';

  const device =
    /Mobi|Android|iPhone|iPad/.test(ua) ? 'Mobile' : 'Desktop';

  return { browser, os, device };
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}

// We throttle DB writes to once per 5 minutes per user to avoid hammering on
// every single API call. We keep an in-memory map of userId → lastWriteMs.
const lastWrite = new Map();
const WRITE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function trackSession(req, res, next) {
  // Only run if authentication succeeded
  if (!req.user?.id) return next();

  const userId = req.user.id;
  const now = Date.now();

  // Throttle
  if (lastWrite.has(userId) && now - lastWrite.get(userId) < WRITE_INTERVAL_MS) {
    return next();
  }

  lastWrite.set(userId, now);

  // Fire-and-forget — never block the request
  setImmediate(async () => {
    try {
      const ip = getClientIp(req);
      const ua = req.headers['user-agent'] || '';
      const { browser, os, device } = parseUserAgent(ua);

      // Expire old sessions after 30 days of inactivity
      const expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000);

      // Find the most-recent active session for this user+device combo
      const existing = await prisma.userSession.findFirst({
        where: { userId, browser, os, device, isActive: true },
        orderBy: { lastSeenAt: 'desc' },
      });

      if (existing) {
        await prisma.userSession.update({
          where: { id: existing.id },
          data: { lastSeenAt: new Date(), ipAddress: ip, expiresAt },
        });
      } else {
        await prisma.userSession.create({
          data: {
            userId,
            ipAddress: ip,
            userAgent: ua.slice(0, 500),
            browser,
            os,
            device,
            expiresAt,
          },
        });
      }

      // Clean up expired sessions for this user (housekeeping)
      await prisma.userSession.deleteMany({
        where: { userId, expiresAt: { lt: new Date() } },
      });
    } catch (err) {
      // Silent — session tracking must never crash the app
      console.warn('[sessionTracker] error:', err.message);
    }
  });

  next();
}

module.exports = { trackSession };