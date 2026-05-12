const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const DEFAULT = { emailNotifs: true, pushNotifs: true, jobAlerts: true, courseUpdates: true, weeklyDigest: false, profileVisible: true, showEmail: false, showLocation: true, theme: 'light', language: 'en', timezone: 'Africa/Lagos' };

const getOrCreate = async (userId) => {
  let s = await prisma.userSettings.findUnique({ where: { userId } });
  if (!s) s = await prisma.userSettings.create({ data: { userId, ...DEFAULT } });
  return s;
};

router.get('/', authenticate, async (req, res) => {
  try { return success(res, await getOrCreate(req.user.id)); } catch (err) { return error(res, 'Failed to fetch settings'); }
});
router.put('/', authenticate, async (req, res) => {
  try {
    await getOrCreate(req.user.id);
    const s = await prisma.userSettings.update({ where: { userId: req.user.id }, data: req.body });
    return success(res, s, 'Settings saved');
  } catch (err) { return error(res, 'Failed to save settings'); }
});

module.exports = router;
