const prisma = require('../config/database');

/**
 * Log a user activity to the community feed.
 *
 * @param {object} opts
 * @param {string}  opts.userId
 * @param {string}  opts.type        — ActivityType enum value
 * @param {string}  opts.title       — Short headline, e.g. "Enrolled in React Basics"
 * @param {string}  [opts.body]      — Optional longer description
 * @param {object}  [opts.metadata]  — Any extra JSON (courseName, badge, etc.)
 * @param {string}  [opts.courseId]
 * @param {string}  [opts.jobId]
 * @param {string}  [opts.postId]
 * @param {boolean} [opts.isPublic]  — Default true
 */
async function logActivity(opts) {
  try {
    const {
      userId, type, title, body = null,
      metadata = null, courseId = null, jobId = null,
      postId = null, isPublic = true,
    } = opts;

    if (!userId || !type || !title) return;

    await prisma.activityFeed.create({
      data: { userId, type, title, body, metadata, courseId, jobId, postId, isPublic },
    });
  } catch (err) {
    // Fire-and-forget — never crash the caller
    console.warn('[activityLogger] Non-fatal error:', err.message);
  }
}

module.exports = { logActivity };
