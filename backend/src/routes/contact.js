// routes/contact.js — Contact Us
const router  = require('express').Router();
const prisma  = require('../config/database');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { success, created, badRequest, error } = require('../utils/response');

// ── Validation helpers ────────────────────────────────────────────────────────
const VALID_TOPICS = [
  'billing',
  'technical',
  'account',
  'courses',
  'jobs',
  'ai_features',
  'partnership',
  'other',
];

function validateBody(body) {
  const { name, email, topic, subject, message } = body;
  const errs = [];
  if (!name    || name.trim().length < 2)              errs.push('Name must be at least 2 characters.');
  if (!email   || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('A valid email is required.');
  if (!topic   || !VALID_TOPICS.includes(topic))       errs.push(`Topic must be one of: ${VALID_TOPICS.join(', ')}.`);
  if (!subject || subject.trim().length < 5)           errs.push('Subject must be at least 5 characters.');
  if (!message || message.trim().length < 20)          errs.push('Message must be at least 20 characters.');
  if (message  && message.trim().length > 2000)        errs.push('Message must be under 2,000 characters.');
  return errs;
}

// ── POST /api/v1/contact — submit a contact message ──────────────────────────
router.post('/', optionalAuthenticate, async (req, res) => {
  try {
    const { name, email, topic, subject, message, priority } = req.body;

    const errs = validateBody(req.body);
    if (errs.length) return badRequest(res, errs[0], errs);

    const contact = await prisma.contactMessage.create({
      data: {
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        topic,
        subject:  subject.trim(),
        message:  message.trim(),
        priority: priority === 'high' ? 'high' : 'normal',
        status:   'open',
        userId:   req.user?.id ?? null,
      },
    });

    const admins = await prisma.user.findMany({
      where:  { role: 'admin' },
      select: { id: true },
    });

    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId:  admin.id,
          type:    'info',
          icon:    'info',
          title:   `New contact message: ${topic}`,
          message: `${name} (${email}) — "${subject.slice(0, 60)}"`,
          read:    false,
        })),
      });
    }

    return created(res, {
      id:        contact.id,
      reference: contact.id.slice(0, 8).toUpperCase(),
    }, 'Message received. We\'ll be in touch within 24 hours.');
  } catch (err) {
    console.error('[contact/submit]', err);
    return error(res, 'Failed to send message. Please try again.');
  }
});

// ── GET /api/v1/contact/topics — return valid topics for the frontend ─────────
router.get('/topics', (req, res) => {
  const labels = {
    billing:     'Billing & Subscription',
    technical:   'Technical Issue',
    account:     'Account Help',
    courses:     'Courses & Learning',
    jobs:        'Jobs & Applications',
    ai_features: 'AI Features',
    partnership: 'Partnership Enquiry',
    other:       'Something Else',
  };
  return success(res, VALID_TOPICS.map(t => ({ value: t, label: labels[t] })));
});

// ── GET /api/v1/contact — admin: list all messages ───────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only.' });
    }
    const { status, topic, page = 1 } = req.query;
    const PAGE = 20;
    const where = {};
    if (status) where.status = status;
    if (topic)  where.topic  = topic;

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (parseInt(page) - 1) * PAGE,
        take:    PAGE,
      }),
      prisma.contactMessage.count({ where }),
    ]);

    return success(res, { messages, total, page: parseInt(page), pages: Math.ceil(total / PAGE) });
  } catch (err) {
    console.error('[contact/list]', err);
    return error(res, 'Failed to fetch messages.');
  }
});

// ── PATCH /api/v1/contact/:id/status — admin: update message status ───────────
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only.' });
    }
    const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) return badRequest(res, 'Invalid status.');

    const updated = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data:  { status, resolvedAt: status === 'resolved' ? new Date() : undefined },
    });
    return success(res, updated);
  } catch (err) {
    console.error('[contact/status]', err);
    return error(res, 'Failed to update status.');
  }
});

module.exports = router;