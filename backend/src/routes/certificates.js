const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, created, notFound, badRequest, error } = require('../utils/response');

router.get('/', authenticate, async (req, res) => {
  try {
    const certs = await prisma.certificate.findMany({ where: { userId: req.user.id }, orderBy: { issueDate: 'desc' } });
    return success(res, certs);
  } catch (err) { return error(res, 'Failed to fetch certificates'); }
});

router.post('/', authenticate, [
  body('name').trim().isLength({ min: 3 }),
  body('issuer').trim().isLength({ min: 2 }),
  body('issueDate').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  try {
    const cert = await prisma.certificate.create({ data: { ...req.body, userId: req.user.id } });
    return created(res, cert, 'Certificate added');
  } catch (err) { return error(res, 'Failed to add certificate'); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const cert = await prisma.certificate.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!cert) return notFound(res, 'Certificate not found');
    await prisma.certificate.delete({ where: { id: req.params.id } });
    return success(res, null, 'Certificate deleted');
  } catch (err) { return error(res, 'Failed to delete certificate'); }
});

module.exports = router;
