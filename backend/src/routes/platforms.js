const router = require('express').Router();
const crypto = require('crypto');
const prisma  = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { success, created, badRequest, error, notFound, forbidden } = require('../utils/response');

// ── Affiliate config ─────────────────────────────────────────────────────────
// Replace tag values with your real affiliate IDs from each network's dashboard.
// Networks:
//   Udemy     → Rakuten Advertising  (rakuten.com/publishers)
//   Coursera  → Impact               (app.impact.com)
//   edX       → Impact               (app.impact.com)
//   LinkedIn  → Direct / Impact
//   Others    → ShareASale, CJ, or direct partner programs
const PLATFORM_CONFIG = {
  udemy: {
    label: 'Udemy',
    network: 'rakuten',
    affiliateTag: process.env.UDEMY_AFFILIATE_TAG || 'skillhub-21',
    webhookSecret: process.env.UDEMY_WEBHOOK_SECRET || '',
    baseUrl: 'https://www.udemy.com',
    affiliateUrl: (tag) => `https://www.udemy.com/?referralCode=${tag}`,
    commissionRate: 0.15, // 15% — update from your Rakuten dashboard
    color: '#a435f0',
  },
  coursera: {
    label: 'Coursera',
    network: 'impact',
    affiliateTag: process.env.COURSERA_AFFILIATE_TAG || 'skillhub',
    webhookSecret: process.env.COURSERA_WEBHOOK_SECRET || '',
    baseUrl: 'https://www.coursera.org',
    affiliateUrl: (tag) => `https://www.coursera.org/?utm_source=${tag}&utm_medium=referral`,
    commissionRate: 0.45,
    color: '#0056d2',
  },
  edx: {
    label: 'edX',
    network: 'impact',
    affiliateTag: process.env.EDX_AFFILIATE_TAG || 'skillhub',
    webhookSecret: process.env.EDX_WEBHOOK_SECRET || '',
    baseUrl: 'https://www.edx.org',
    affiliateUrl: (tag) => `https://www.edx.org/?utm_source=${tag}&utm_medium=referral`,
    commissionRate: 0.25,
    color: '#02262b',
  },
  linkedin: {
    label: 'LinkedIn Learning',
    network: 'impact',
    affiliateTag: process.env.LINKEDIN_AFFILIATE_TAG || 'skillhub',
    webhookSecret: process.env.LINKEDIN_WEBHOOK_SECRET || '',
    baseUrl: 'https://www.linkedin.com/learning',
    affiliateUrl: (tag) => `https://www.linkedin.com/learning/?trk=${tag}`,
    commissionRate: 0.35,
    color: '#0077b5',
  },
  pluralsight: {
    label: 'Pluralsight',
    network: 'impact',
    affiliateTag: process.env.PLURALSIGHT_AFFILIATE_TAG || 'skillhub',
    webhookSecret: process.env.PLURALSIGHT_WEBHOOK_SECRET || '',
    baseUrl: 'https://www.pluralsight.com',
    affiliateUrl: (tag) => `https://www.pluralsight.com/?utm_source=${tag}&utm_medium=referral`,
    commissionRate: 0.25,
    color: '#f15b2a',
  },
  skillshare: {
    label: 'Skillshare',
    network: 'impact',
    affiliateTag: process.env.SKILLSHARE_AFFILIATE_TAG || 'skillhub',
    webhookSecret: process.env.SKILLSHARE_WEBHOOK_SECRET || '',
    baseUrl: 'https://www.skillshare.com',
    affiliateUrl: (tag) => `https://www.skillshare.com/r/${tag}`,
    commissionRate: 0.40,
    color: '#00e676',
  },
  alison: {
    label: 'Alison',
    network: 'shareasale',
    affiliateTag: process.env.ALISON_AFFILIATE_TAG || 'skillhub',
    webhookSecret: process.env.ALISON_WEBHOOK_SECRET || '',
    baseUrl: 'https://alison.com',
    affiliateUrl: (tag) => `https://alison.com/?utm_source=${tag}&utm_medium=referral`,
    commissionRate: 0.20,
    color: '#7eb63e',
  },
  futurelearn: {
    label: 'FutureLearn',
    network: 'rakuten',
    affiliateTag: process.env.FUTURELEARN_AFFILIATE_TAG || 'skillhub',
    webhookSecret: process.env.FUTURELEARN_WEBHOOK_SECRET || '',
    baseUrl: 'https://www.futurelearn.com',
    affiliateUrl: (tag) => `https://www.futurelearn.com/?utm_source=${tag}&utm_medium=referral`,
    commissionRate: 0.20,
    color: '#d60303',
  },
};

// ── Signature verification helpers ──────────────────────────────────────────
// Each affiliate network uses a different signing method.
// These are called inside the webhook handler to validate the request.

function verifyImpactSignature(req, secret) {
  // Impact sends: X-Impact-Signature: sha256=<hmac>
  const sig = req.headers['x-impact-signature'] || '';
  if (!sig || !secret) return false;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || JSON.stringify(req.body))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function verifyRakutenSignature(req, secret) {
  // Rakuten sends: Authorization: Bearer <token>
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!token || !secret) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

function verifyShareASaleSignature(req, secret) {
  // ShareASale sends: X-Shareasale-Security: <hmac>
  const sig = req.headers['x-shareasale-security'] || '';
  if (!sig || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || JSON.stringify(req.body))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function verifyWebhookSignature(req, network, secret) {
  if (!secret) return true; // dev fallback — remove in production
  switch (network) {
    case 'impact':    return verifyImpactSignature(req, secret);
    case 'rakuten':   return verifyRakutenSignature(req, secret);
    case 'shareasale': return verifyShareASaleSignature(req, secret);
    default:          return true;
  }
}

// ── Normalise network payloads into a common shape ───────────────────────────
// Each network sends a different JSON structure. We normalise them here so
// the rest of the handler doesn't care about the source.
function normalisePayload(network, body) {
  switch (network) {
    case 'impact': {
      // Impact sends an array of events
      const ev = Array.isArray(body) ? body[0] : body;
      return {
        orderId: ev.OrderId || ev.order_id,
        orderAmount: parseFloat(ev.SaleAmount || ev.sale_amount || 0),
        commissionAmount: parseFloat(ev.PubCommissionAmount || ev.commission || 0),
        currency: ev.Currency || ev.currency || 'USD',
        referralTag: ev.SubId1 || ev.sub_id1 || ev.MediaId || '',
        status: ev.State === 'Reversed' ? 'reversed' : 'confirmed',
        convertedAt: ev.EventDate ? new Date(ev.EventDate) : new Date(),
      };
    }
    case 'rakuten': {
      const ev = Array.isArray(body) ? body[0] : body;
      return {
        orderId: ev.order_id,
        orderAmount: parseFloat(ev.sale_amount || 0),
        commissionAmount: parseFloat(ev.commission || 0),
        currency: ev.currency || 'USD',
        referralTag: ev.u1 || ev.publisher_id || '',
        status: ev.process_date ? 'confirmed' : 'pending',
        convertedAt: ev.transaction_date ? new Date(ev.transaction_date) : new Date(),
      };
    }
    case 'shareasale': {
      return {
        orderId: body.transactionid,
        orderAmount: parseFloat(body.saleamount || 0),
        commissionAmount: parseFloat(body.commission || 0),
        currency: 'USD',
        referralTag: body.afftrack || '',
        status: 'confirmed',
        convertedAt: new Date(),
      };
    }
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK ENDPOINTS — called by affiliate networks when a sale is confirmed
// These endpoints must be whitelisted in each network's dashboard settings.
//
// URL format: POST /api/v1/platforms/webhook/:network/:platform
// e.g.        POST /api/v1/platforms/webhook/impact/coursera
//             POST /api/v1/platforms/webhook/rakuten/udemy
// ═══════════════════════════════════════════════════════════════════════════

router.post('/webhook/:network/:platform', async (req, res) => {
  const { network, platform } = req.params;
  const config = PLATFORM_CONFIG[platform];

  if (!config) {
    console.warn(`[Affiliate Webhook] Unknown platform: ${platform}`);
    return res.status(200).json({ received: true }); // always 200 to networks
  }

  // Verify the request is genuinely from the network
  if (!verifyWebhookSignature(req, network, config.webhookSecret)) {
    console.warn(`[Affiliate Webhook] Invalid signature for ${network}/${platform}`);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const normalised = normalisePayload(network, req.body);
  if (!normalised) {
    console.warn(`[Affiliate Webhook] Could not normalise payload for ${network}`);
    return res.status(200).json({ received: true });
  }

  try {
    // Idempotency: don't double-record the same order
    if (normalised.orderId) {
      const exists = await prisma.affiliateEarning.findFirst({
        where: { orderId: normalised.orderId, platform },
      });
      if (exists) {
        // Handle reversals — update status if this is a reversal event
        if (normalised.status === 'reversed') {
          await prisma.affiliateEarning.update({
            where: { id: exists.id },
            data: { status: 'reversed', updatedAt: new Date() },
          });
        }
        return res.status(200).json({ received: true, duplicate: true });
      }
    }

    // Try to link to the referral click record if tag matches
    const referral = normalised.referralTag
      ? await prisma.affiliateReferral.findFirst({
          where: { platform, referralTag: normalised.referralTag, converted: false },
          orderBy: { clickedAt: 'desc' },
        })
      : null;

    // Create the earnings record
    const earning = await prisma.affiliateEarning.create({
      data: {
        platform,
        network,
        referralTag: normalised.referralTag || config.affiliateTag,
        orderId: normalised.orderId || null,
        orderAmount: normalised.orderAmount,
        commissionAmount: normalised.commissionAmount,
        currency: normalised.currency,
        status: normalised.status,
        convertedAt: normalised.convertedAt,
        rawPayload: req.body,
        referralId: referral?.id || null,
      },
    });

    // Mark the referral click as converted
    if (referral) {
      await prisma.affiliateReferral.update({
        where: { id: referral.id },
        data: {
          converted: true,
          convertedAt: normalised.convertedAt,
          commission: normalised.commissionAmount,
        },
      });
    }

    console.log(`[Affiliate Webhook] ✅ ${platform} | order ${normalised.orderId} | commission $${normalised.commissionAmount}`);
    return res.status(200).json({ received: true, earningId: earning.id });
  } catch (err) {
    console.error('[Affiliate Webhook] DB error:', err);
    // Still return 200 so the network doesn't keep retrying
    return res.status(200).json({ received: true, error: 'internal' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MANUAL CONVERSION — Admin can manually record a confirmed commission
// (useful when pulling reports from network dashboards without webhooks)
// POST /api/v1/platforms/earnings/manual
// ═══════════════════════════════════════════════════════════════════════════

router.post('/earnings/manual', authenticate, requireRole('admin'), async (req, res) => {
  const { platform, orderId, orderAmount, commissionAmount, currency = 'USD', convertedAt, network = 'manual' } = req.body;

  if (!platform || !orderAmount || !commissionAmount) {
    return badRequest(res, 'platform, orderAmount, and commissionAmount are required');
  }
  if (!PLATFORM_CONFIG[platform]) {
    return badRequest(res, 'Unsupported platform');
  }

  try {
    const earning = await prisma.affiliateEarning.create({
      data: {
        platform,
        network,
        referralTag: PLATFORM_CONFIG[platform].affiliateTag,
        orderId: orderId || null,
        orderAmount: parseFloat(orderAmount),
        commissionAmount: parseFloat(commissionAmount),
        currency,
        status: 'confirmed',
        convertedAt: convertedAt ? new Date(convertedAt) : new Date(),
      },
    });
    return created(res, earning, 'Earning recorded');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to record earning');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — Affiliate earnings overview
// GET /api/v1/platforms/earnings/admin
// ═══════════════════════════════════════════════════════════════════════════

router.get('/earnings/admin', authenticate, requireRole('admin'), async (req, res) => {
  const { platform, status, from, to, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(platform ? { platform } : {}),
    ...(status   ? { status }   : {}),
    ...(from || to ? {
      convertedAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to)   } : {}),
      },
    } : {}),
  };

  try {
    const [earnings, total, aggregates] = await Promise.all([
      prisma.affiliateEarning.findMany({
        where,
        orderBy: { convertedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.affiliateEarning.count({ where }),
      prisma.affiliateEarning.groupBy({
        by: ['platform', 'status'],
        _sum: { commissionAmount: true, orderAmount: true },
        _count: true,
      }),
    ]);

    // Build per-platform summary
    const platformSummary = {};
    for (const row of aggregates) {
      if (!platformSummary[row.platform]) {
        platformSummary[row.platform] = {
          platform: row.platform,
          label: PLATFORM_CONFIG[row.platform]?.label || row.platform,
          totalOrders: 0,
          totalOrderAmount: 0,
          totalCommission: 0,
          confirmedCommission: 0,
          lockedCommission: 0,
          paidCommission: 0,
          reversals: 0,
        };
      }
      const p = platformSummary[row.platform];
      p.totalOrders        += row._count;
      p.totalOrderAmount   += row._sum.orderAmount || 0;
      p.totalCommission    += row._sum.commissionAmount || 0;
      if (row.status === 'confirmed') p.confirmedCommission += row._sum.commissionAmount || 0;
      if (row.status === 'locked')    p.lockedCommission    += row._sum.commissionAmount || 0;
      if (row.status === 'paid')      p.paidCommission      += row._sum.commissionAmount || 0;
      if (row.status === 'reversed')  p.reversals           += row._count;
    }

    // Total clicks vs conversions
    const [totalClicks, totalConverted] = await Promise.all([
      prisma.affiliateReferral.count(),
      prisma.affiliateReferral.count({ where: { converted: true } }),
    ]);

    return success(res, {
      earnings,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
      platformSummary: Object.values(platformSummary),
      overview: {
        totalClicks,
        totalConverted,
        conversionRate: totalClicks ? ((totalConverted / totalClicks) * 100).toFixed(1) : 0,
        totalCommission: Object.values(platformSummary).reduce((s, p) => s + p.totalCommission, 0),
        paidCommission: Object.values(platformSummary).reduce((s, p) => s + p.paidCommission, 0),
        pendingCommission: Object.values(platformSummary).reduce((s, p) => s + p.confirmedCommission + p.lockedCommission, 0),
      },
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch earnings');
  }
});

// Update earning status (e.g. mark as paid after bank transfer)
// PATCH /api/v1/platforms/earnings/:id/status
router.patch('/earnings/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'locked', 'paid', 'reversed'];
  if (!valid.includes(status)) return badRequest(res, `Status must be one of: ${valid.join(', ')}`);

  try {
    const earning = await prisma.affiliateEarning.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(status === 'locked' ? { lockedAt: new Date() } : {}),
        ...(status === 'paid'   ? { paidAt:   new Date() } : {}),
      },
    });
    return success(res, earning, `Earning marked as ${status}`);
  } catch (err) {
    console.error(err);
    return notFound(res, 'Earning not found');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// USER-FACING ROUTES (existing + referral stats)
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/v1/platforms — list user's connected platforms
router.get('/', authenticate, async (req, res) => {
  try {
    const platforms = await prisma.connectedPlatform.findMany({
      where: { userId: req.user.id },
      include: { certificates: true },
    });
    const result = platforms.map(p => ({
      ...p,
      courseCount: p.certificates.length,
      config: PLATFORM_CONFIG[p.platform] || null,
    }));
    return success(res, result);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch platforms');
  }
});

// POST /api/v1/platforms/:platform/connect — record connection + return affiliate URL
router.post('/:platform/connect', authenticate, async (req, res) => {
  const { platform } = req.params;
  const config = PLATFORM_CONFIG[platform];
  if (!config) return badRequest(res, 'Unsupported platform');

  try {
    const existingBefore = await prisma.connectedPlatform.findUnique({
      where: { userId_platform: { userId: req.user.id, platform } },
    });

    const conn = await prisma.connectedPlatform.upsert({
      where: { userId_platform: { userId: req.user.id, platform } },
      update: { connectedAt: new Date() },
      create: { userId: req.user.id, platform, referralCode: config.affiliateTag },
    });

    // Record referral click
    await prisma.affiliateReferral.create({
      data: {
        userId: req.user.id,
        platformId: conn.id,
        platform,
        referralTag: config.affiliateTag,
      },
    });

    // Merit coins for new connection
    if (!existingBefore) {
      const totalConns = await prisma.connectedPlatform.count({ where: { userId: req.user.id } });
      const coins = totalConns === 1 ? 50 : 10;
      const title = totalConns === 1 ? 'First Platform Connected! 🎉' : 'Platform Connected';
      const message = totalConns === 1
        ? `You connected your first learning platform (${config.label}). +${coins} Merit Coins earned!`
        : `You connected ${config.label}. +${coins} Merit Coins earned!`;

      await prisma.user.update({ where: { id: req.user.id }, data: { meritCoins: { increment: coins } } });
      await prisma.notification.create({
        data: { userId: req.user.id, type: totalConns === 1 ? 'success' : 'info', icon: 'link', title, message },
      });
    }

    const affiliateUrl = config.affiliateUrl(config.affiliateTag);
    return success(res, { connection: conn, affiliateUrl, isNewConnection: !existingBefore },
      existingBefore ? `Reconnected to ${config.label}` : `Connected to ${config.label}`);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to connect platform');
  }
});

// DELETE /api/v1/platforms/:platform/disconnect
router.delete('/:platform/disconnect', authenticate, async (req, res) => {
  const { platform } = req.params;
  try {
    await prisma.connectedPlatform.deleteMany({ where: { userId: req.user.id, platform } });
    return success(res, null, 'Platform disconnected');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to disconnect platform');
  }
});

// POST /api/v1/platforms/:platform/certificates — manually import a certificate
router.post('/:platform/certificates', authenticate, async (req, res) => {
  const { platform } = req.params;
  const { title, issuer, completedAt, credentialUrl, skills } = req.body;
  if (!title || !completedAt) return badRequest(res, 'Title and completion date are required');

  try {
    const conn = await prisma.connectedPlatform.findUnique({
      where: { userId_platform: { userId: req.user.id, platform } },
    });
    if (!conn) return badRequest(res, 'Platform not connected. Connect it first.');

    const cert = await prisma.externalCertificate.create({
      data: {
        userId: req.user.id,
        platformId: conn.id,
        platform,
        title,
        issuer: issuer || PLATFORM_CONFIG[platform]?.label || platform,
        completedAt: new Date(completedAt),
        credentialUrl: credentialUrl || null,
        skills: skills || [],
      },
    });

    await prisma.user.update({ where: { id: req.user.id }, data: { meritCoins: { increment: 75 } } });
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'success',
        icon: 'certificate',
        title: 'Course Certificate Imported!',
        message: `"${title}" imported from ${platform}. +75 Merit Coins earned!`,
      },
    });

    return created(res, { ...cert, coinsEarned: 75 }, 'Certificate imported! +75 Merit Coins earned');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to import certificate');
  }
});

// GET /api/v1/platforms/certificates — all external certificates for the user
router.get('/certificates', authenticate, async (req, res) => {
  try {
    const certs = await prisma.externalCertificate.findMany({
      where: { userId: req.user.id },
      orderBy: { completedAt: 'desc' },
    });
    return success(res, certs);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch certificates');
  }
});

// GET /api/v1/platforms/summary — aggregated study progress across all platforms
router.get('/summary', authenticate, async (req, res) => {
  try {
    const [platforms, certs] = await Promise.all([
      prisma.connectedPlatform.findMany({ where: { userId: req.user.id }, include: { certificates: true } }),
      prisma.externalCertificate.findMany({ where: { userId: req.user.id } }),
    ]);
    const summary = {
      totalPlatforms: platforms.length,
      totalExternalCerts: certs.length,
      totalExternalCoursesCompleted: certs.length,
      coinsEarnedFromPlatforms: certs.length * 75,
      platformBreakdown: platforms.map(p => ({
        platform: p.platform,
        label: PLATFORM_CONFIG[p.platform]?.label || p.platform,
        certificatesImported: p.certificates.length,
        connectedAt: p.connectedAt,
      })),
    };
    return success(res, summary);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch platform summary');
  }
});

// DELETE /api/v1/platforms/certificates/:id — remove an imported certificate
router.delete('/certificates/:id', authenticate, async (req, res) => {
  try {
    const cert = await prisma.externalCertificate.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!cert) return notFound(res, 'Certificate not found');
    await prisma.externalCertificate.delete({ where: { id: req.params.id } });
    return success(res, null, 'Certificate removed');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to remove certificate');
  }
});

// GET /api/v1/platforms/referrals — user view of their own referral clicks
router.get('/referrals', authenticate, async (req, res) => {
  try {
    const referrals = await prisma.affiliateReferral.findMany({
      where: { userId: req.user.id },
      orderBy: { clickedAt: 'desc' },
    });
    const totalCommission = referrals.reduce((sum, r) => sum + (r.commission || 0), 0);
    const conversions = referrals.filter(r => r.converted).length;
    return success(res, {
      referrals,
      totalClicks: referrals.length,
      totalConversions: conversions,
      conversionRate: referrals.length ? ((conversions / referrals.length) * 100).toFixed(1) : 0,
      totalCommission,
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch referrals');
  }
});

module.exports = router;