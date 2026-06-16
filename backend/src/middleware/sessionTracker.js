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

// Uses req.ip which honours Express's `trust proxy` setting (set in server.js).
// This correctly handles Render, Railway, and other reverse-proxy deployments.
function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || null;
}

const WRITE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function trackSession(req, res, next) {
  // Only run if authentication succeeded
  if (!req.user?.id) return next();

  const userId = req.user.id;
  const now = Date.now();

  // Fire-and-forget — never block the request
  setImmediate(async () => {
    try {
      const ip = getClientIp(req);
      const ua = req.headers['user-agent'] || '';
      const { browser, os, device } = parseUserAgent(ua);

      // Expire old sessions after 30 days of inactivity
      const expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000);
      const throttleCutoff = new Date(now - WRITE_INTERVAL_MS);

      // Find the most-recent active session for this user+device combo.
      // The lastSeenAt check acts as the throttle — if we've already written
      // within WRITE_INTERVAL_MS, skip. This replaces the in-memory Map so
      // the throttle survives server restarts without thundering-herd bursts.
      const existing = await prisma.userSession.findFirst({
        where: { userId, browser, os, device, isActive: true },
        orderBy: { lastSeenAt: 'desc' },
      });

      if (existing) {
        // If updated recently enough, don't write again
        if (existing.lastSeenAt > throttleCutoff) return;

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