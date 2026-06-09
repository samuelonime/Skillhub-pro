const router = require('express').Router();
const crypto = require('crypto');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, created, badRequest, error, notFound } = require('../utils/response');

// Affiliate config — replace tag values with your real affiliate IDs
const PLATFORM_CONFIG = {
  udemy: {
    label: 'Udemy',
    affiliateTag: process.env.UDEMY_AFFILIATE_TAG || 'skillhub-21',
    baseUrl: 'https://www.udemy.com',
    affiliateUrl: (tag) => `https://www.udemy.com/?referralCode=${tag}`,
    color: '#a435f0',
  },
  coursera: {
    label: 'Coursera',
    affiliateTag: process.env.COURSERA_AFFILIATE_TAG || 'skillhub',
    baseUrl: 'https://www.coursera.org',
    affiliateUrl: (tag) => `https://www.coursera.org/?utm_source=${tag}&utm_medium=referral`,
    color: '#0056d2',
  },
  edx: {
    label: 'edX',
    affiliateTag: process.env.EDX_AFFILIATE_TAG || 'skillhub',
    baseUrl: 'https://www.edx.org',
    affiliateUrl: (tag) => `https://www.edx.org/?utm_source=${tag}&utm_medium=referral`,
    color: '#02262b',
  },
  linkedin: {
    label: 'LinkedIn Learning',
    affiliateTag: process.env.LINKEDIN_AFFILIATE_TAG || 'skillhub',
    baseUrl: 'https://www.linkedin.com/learning',
    affiliateUrl: (tag) => `https://www.linkedin.com/learning/?trk=${tag}`,
    color: '#0077b5',
  },
  pluralsight: {
    label: 'Pluralsight',
    affiliateTag: process.env.PLURALSIGHT_AFFILIATE_TAG || 'skillhub',
    baseUrl: 'https://www.pluralsight.com',
    affiliateUrl: (tag) => `https://www.pluralsight.com/?utm_source=${tag}&utm_medium=referral`,
    color: '#f15b2a',
  },
  skillshare: {
    label: 'Skillshare',
    affiliateTag: process.env.SKILLSHARE_AFFILIATE_TAG || 'skillhub',
    baseUrl: 'https://www.skillshare.com',
    affiliateUrl: (tag) => `https://www.skillshare.com/r/${tag}`,
    color: '#00e676',
  },
  alison: {
    label: 'Alison',
    affiliateTag: process.env.ALISON_AFFILIATE_TAG || 'skillhub',
    baseUrl: 'https://alison.com',
    affiliateUrl: (tag) => `https://alison.com/?utm_source=${tag}&utm_medium=referral`,
    color: '#7eb63e',
  },
  futurelearn: {
    label: 'FutureLearn',
    affiliateTag: process.env.FUTURELEARN_AFFILIATE_TAG || 'skillhub',
    baseUrl: 'https://www.futurelearn.com',
    affiliateUrl: (tag) => `https://www.futurelearn.com/?utm_source=${tag}&utm_medium=referral`,
    color: '#d60303',
  },
};

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
    // Check if the connection already exists BEFORE upsert
    const existingBefore = await prisma.connectedPlatform.findUnique({
      where: { userId_platform: { userId: req.user.id, platform } },
    });

    // Upsert the connection
    const conn = await prisma.connectedPlatform.upsert({
      where: { userId_platform: { userId: req.user.id, platform } },
      update: { connectedAt: new Date() },
      create: { userId: req.user.id, platform, referralCode: config.affiliateTag },
    });

    // Record the referral click
    await prisma.affiliateReferral.create({
      data: {
        userId: req.user.id,
        platformId: conn.id,
        platform,
        referralTag: config.affiliateTag,
      },
    });

    // Award merit coins for connecting a new platform (first time only)
    // Using existingBefore check to detect truly first-time connection vs re-connection
    if (!existingBefore) {
      // Truly first time connecting this platform
      const totalConns = await prisma.connectedPlatform.count({ 
        where: { userId: req.user.id } 
      });
      
      // Bonus for first ever platform connection
      if (totalConns === 1) {
        await prisma.user.update({ 
          where: { id: req.user.id }, 
          data: { meritCoins: { increment: 50 } } 
        });
        
        await prisma.notification.create({
          data: {
            userId: req.user.id,
            type: 'success',
            icon: 'link',
            title: 'First Platform Connected! 🎉',
            message: `You connected your first learning platform (${config.label}). +50 Merit Coins earned!`,
          },
        });
      } else {
        // Optional: smaller bonus for connecting additional platforms
        await prisma.user.update({ 
          where: { id: req.user.id }, 
          data: { meritCoins: { increment: 10 } } 
        });
        
        await prisma.notification.create({
          data: {
            userId: req.user.id,
            type: 'info',
            icon: 'link',
            title: 'Platform Connected',
            message: `You connected ${config.label}. +10 Merit Coins earned!`,
          },
        });
      }
    }

    const affiliateUrl = config.affiliateUrl(config.affiliateTag);

    return success(
      res, 
      { 
        connection: conn, 
        affiliateUrl, 
        isNewConnection: !existingBefore 
      }, 
      existingBefore 
        ? `Reconnected to ${config.label}` 
        : `Connected to ${config.label}`
    );
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to connect platform');
  }
});

// DELETE /api/v1/platforms/:platform/disconnect
router.delete('/:platform/disconnect', authenticate, async (req, res) => {
  const { platform } = req.params;
  try {
    await prisma.connectedPlatform.deleteMany({
      where: { userId: req.user.id, platform },
    });
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

    // Award merit coins for completing an external course
    await prisma.user.update({ 
      where: { id: req.user.id }, 
      data: { meritCoins: { increment: 75 } } 
    });
    
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
      prisma.connectedPlatform.findMany({ 
        where: { userId: req.user.id }, 
        include: { certificates: true } 
      }),
      prisma.externalCertificate.findMany({ 
        where: { userId: req.user.id } 
      }),
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

// GET /api/v1/platforms/referrals — admin/user view of referral stats
router.get('/referrals', authenticate, async (req, res) => {
  try {
    const referrals = await prisma.affiliateReferral.findMany({
      where: { userId: req.user.id },
      orderBy: { clickedAt: 'desc' },
    });
    const totalCommission = referrals.reduce((sum, r) => sum + (r.commission || 0), 0);
    return success(res, { referrals, totalCommission });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch referrals');
  }
});

module.exports = router;