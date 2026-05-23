const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, created, notFound, badRequest, error } = require('../utils/response');

// GET /certificates
router.get('/', authenticate, async (req, res) => {
  try {
    const certs = await prisma.certificate.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, certs);
  } catch (err) { return error(res, 'Failed to fetch certificates'); }
});

// POST /certificates
router.post('/', authenticate, [
  body('title').trim().isLength({ min: 3 }),
  body('provider').trim().isLength({ min: 2 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  try {
    const { title, provider, issueDate, expiryDate, credentialId, credentialUrl, fileUrl } = req.body;
    const cert = await prisma.certificate.create({
      data: {
        userId: req.user.id,
        title,
        provider,
        issueDate:    issueDate    ? new Date(issueDate)    : null,
        expiryDate:   expiryDate   ? new Date(expiryDate)   : null,
        issuedAt:     issueDate    ? new Date(issueDate)    : null,
        credentialId: credentialId || null,
        credentialUrl: credentialUrl || null,
        fileUrl:      fileUrl      || null,
        status:       'pending',
      },
    });
    return created(res, cert, 'Certificate added');
  } catch (err) { return error(res, 'Failed to add certificate'); }
});

// DELETE /certificates/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const cert = await prisma.certificate.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!cert) return notFound(res, 'Certificate not found');
    await prisma.certificate.delete({ where: { id: req.params.id } });
    return success(res, null, 'Certificate deleted');
  } catch (err) { return error(res, 'Failed to delete certificate'); }
});

module.exports = router;