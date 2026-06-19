const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const { badRequest, error } = require('../utils/response');

const SSO_SECRET    = process.env.SSO_SHARED_SECRET || '';
const DS_BASE_URL   = (process.env.MERITLIVES_BASE_URL || '').replace(/\/+$/, '');

/**
 * POST /api/v1/sso/meritlives
 * Body: { courseSlug: string }
 *
 * Generates a short-lived signed token embedding the SkillHub student's
 * identity, then returns the full Digital Skills entry URL the frontend
 * should redirect to.  The student lands on Digital Skills already
 * identified — no second registration, no password form.
 *
 * Token is a plain HS256 JWT (5-minute TTL) signed with a secret shared
 * between SkillHub and Digital Skills (.env SSO_SHARED_SECRET on both).
 */
router.post('/meritlives', authenticate, async (req, res) => {
  const { courseSlug } = req.body;

  if (!courseSlug) return badRequest(res, 'courseSlug is required');

  if (!SSO_SECRET) {
    return error(res, 'SSO not configured — set SSO_SHARED_SECRET in env');
  }

  if (!DS_BASE_URL) {
    return error(res, 'MERITLIVES_BASE_URL not configured');
  }

  try {
    const user = req.user;

    const token = jwt.sign(
      {
        sub:       user.id,           // SkillHub user id (for reference only)
        email:     user.email,
        firstName: user.firstName,
        lastName:  user.lastName,
        avatar:    user.avatar || null,
        iss:       'skillhub',
        aud:       'meritlives',
      },
      SSO_SECRET,
      { expiresIn: '5m', algorithm: 'HS256' }
    );

    const entryUrl = `${DS_BASE_URL}/sso/entry?token=${encodeURIComponent(token)}&course=${encodeURIComponent(courseSlug)}`;

    return res.json({ success: true, url: entryUrl });
  } catch (err) {
    console.error('[SSO] token generation failed:', err.message);
    return error(res, 'Failed to generate SSO token');
  }
});

module.exports = router;