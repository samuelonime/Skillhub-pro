// SkillHub — Paystack Payment Routes
// Handles: initiate payment, verify webhook, subscriptions, merit coin purchases
const router = require('express').Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, created, badRequest, error } = require('../utils/response');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE   = 'https://api.paystack.co';

// ─── Plan catalogue ───────────────────────────────────────────────────────────
const PLANS = {
  pro_monthly:      { label: 'Pro Monthly',      amount: 500000,  coins: 0,    period: 30  },  // ₦5,000
  pro_annual:       { label: 'Pro Annual',        amount: 4500000, coins: 0,    period: 365 },  // ₦45,000
  employer_monthly: { label: 'Employer Monthly',  amount: 1500000, coins: 0,    period: 30  },  // ₦15,000
  employer_annual:  { label: 'Employer Annual',   amount: 13500000,coins: 0,    period: 365 },  // ₦135,000
};

const COIN_BUNDLES = {
  coins_500:  { label: '500 Merit Coins',  amount: 100000, coins: 500  },  // ₦1,000
  coins_1500: { label: '1500 Merit Coins', amount: 250000, coins: 1500 },  // ₦2,500
  coins_5000: { label: '5000 Merit Coins', amount: 700000, coins: 5000 },  // ₦7,000
};

// ─── Helper: call Paystack API ────────────────────────────────────────────────
async function paystackRequest(method, path, body = null) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

// ─── GET /payment/plans ───────────────────────────────────────────────────────
// Returns subscription plans and coin bundles with prices
router.get('/plans', authenticate, (_req, res) => {
  return success(res, { plans: PLANS, coinBundles: COIN_BUNDLES });
});

// ─── GET /payment/subscription ───────────────────────────────────────────────
// Returns current user's active subscription
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId: req.user.id, status: 'active' },
      include: { payment: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, sub || null);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to fetch subscription');
  }
});

// ─── POST /payment/initiate ───────────────────────────────────────────────────
// Kicks off a Paystack payment — returns an authorization_url to redirect to
router.post('/initiate', authenticate, [
  body('purpose').isIn(['subscription', 'merit_coins', 'course', 'featured_profile']),
  body('planOrBundle').notEmpty(),
  body('callbackUrl').isURL(),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return badRequest(res, 'Validation failed', errs.array());

  const { purpose, planOrBundle, callbackUrl } = req.body;
  const user = req.user;

  let amount, description, metadata;

  if (purpose === 'subscription') {
    const plan = PLANS[planOrBundle];
    if (!plan) return badRequest(res, 'Invalid subscription plan');
    amount      = plan.amount;
    description = plan.label;
    metadata    = { plan: planOrBundle, period: plan.period };
  } else if (purpose === 'merit_coins') {
    const bundle = COIN_BUNDLES[planOrBundle];
    if (!bundle) return badRequest(res, 'Invalid coin bundle');
    amount      = bundle.amount;
    description = bundle.label;
    metadata    = { bundle: planOrBundle, coins: bundle.coins };
  } else {
    return badRequest(res, 'Purpose not yet supported via this endpoint');
  }

  // Generate a unique reference
  const reference = `SH-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  try {
    // Store pending payment in DB first (so webhook can match it)
    await prisma.payment.create({
      data: {
        userId:      user.id,
        amount,
        currency:    'NGN',
        status:      'pending',
        paystackRef: reference,
        purpose,
        metadata,
      },
    });

    // Call Paystack to create the transaction
    const psRes = await paystackRequest('POST', '/transaction/initialize', {
      email:     user.email,
      amount,                      // in kobo
      reference,
      callback_url: callbackUrl,
      metadata: {
        userId:      user.id,
        purpose,
        ...metadata,
        cancel_action: callbackUrl,
      },
    });

    if (!psRes.status) {
      await prisma.payment.update({ where: { paystackRef: reference }, data: { status: 'failed' } });
      return error(res, psRes.message || 'Paystack initialization failed');
    }

    return created(res, {
      authorizationUrl: psRes.data.authorization_url,
      reference,
      amount,
      description,
    }, 'Payment initiated');
  } catch (err) {
    console.error('Payment initiation error:', err);
    return error(res, 'Failed to initiate payment');
  }
});

// ─── POST /payment/verify/:reference ─────────────────────────────────────────
// Called by the frontend after redirect back from Paystack
router.post('/verify/:reference', authenticate, async (req, res) => {
  const { reference } = req.params;

  try {
    // Verify with Paystack
    const psRes = await paystackRequest('GET', `/transaction/verify/${reference}`);

    if (!psRes.status || psRes.data.status !== 'success') {
      await prisma.payment.updateMany({
        where: { paystackRef: reference },
        data:  { status: 'failed' },
      });
      return badRequest(res, 'Payment was not successful');
    }

    const payment = await prisma.payment.findUnique({ where: { paystackRef: reference } });
    if (!payment) return badRequest(res, 'Payment record not found');
    if (payment.userId !== req.user.id) return badRequest(res, 'Payment does not belong to this user');
    if (payment.status === 'success') return success(res, payment, 'Payment already processed');

    // Mark payment successful
    const updatedPayment = await prisma.payment.update({
      where: { paystackRef: reference },
      data: {
        status:        'success',
        paystackTrxRef: String(psRes.data.id),
        paidAt:        new Date(),
      },
    });

    // Fulfil based on purpose
    if (payment.purpose === 'subscription') {
      const meta   = payment.metadata;
      const plan   = PLANS[meta.plan];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.period);

      await prisma.subscription.create({
        data: {
          userId:    payment.userId,
          paymentId: updatedPayment.id,
          plan:      meta.plan,
          status:    'active',
          endDate,
        },
      });
      await notify(payment.userId, 'success', 'star', 'Subscription Activated!', `Your ${plan.label} plan is now active.`);
    }

    if (payment.purpose === 'merit_coins') {
      const coins = payment.metadata?.coins ?? 0;
      // Use an atomic increment to avoid a race condition where two concurrent
      // requests both read the old balance and only one batch of coins is credited.
      const updatedUser = await prisma.user.update({
        where: { id: payment.userId },
        data:  { meritCoins: { increment: coins } },
        select: { meritCoins: true },
      });
      await prisma.transaction.create({
        data: {
          userId:      payment.userId,
          type:        'purchase',
          amount:      coins,
          description: `Purchased ${coins} Merit Coins`,
          balanceAfter: updatedUser.meritCoins,
        },
      });
      await notify(payment.userId, 'success', 'coins', 'Merit Coins Added!', `+${coins} Merit Coins added to your wallet.`);
    }

    return success(res, updatedPayment, 'Payment verified and processed successfully');
  } catch (err) {
    console.error('Payment verification error:', err);
    return error(res, 'Verification failed');
  }
});

// ─── POST /payment/webhook ────────────────────────────────────────────────────
// Paystack sends events here — MUST be publicly accessible, no auth middleware
// Set this URL in your Paystack dashboard: https://yourdomain.com/api/v1/payment/webhook
router.post('/webhook', async (req, res) => {
  // Validate signature — req.body is a raw Buffer (see server.js express.raw config).
  // We must hash the raw bytes, NOT JSON.stringify(Buffer), which would produce the
  // wrong string and cause every webhook to fail with 401.
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(req.body)           // raw Buffer — matches what Paystack signed
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // Parse the raw Buffer into a JS object for event handling
  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  console.log(`[Paystack Webhook] ${event.event}`);

  try {
    if (event.event === 'charge.success') {
      const data      = event.data;
      const reference = data.reference;

      const payment = await prisma.payment.findUnique({ where: { paystackRef: reference } });
      if (!payment || payment.status === 'success') {
        return res.sendStatus(200); // already handled or unknown
      }

      await prisma.payment.update({
        where: { paystackRef: reference },
        data:  { status: 'success', paystackTrxRef: String(data.id), paidAt: new Date() },
      });

      if (payment.purpose === 'merit_coins') {
        const coins = payment.metadata?.coins ?? 0;
        const updatedUser = await prisma.user.update({
          where: { id: payment.userId },
          data:  { meritCoins: { increment: coins } },
          select: { meritCoins: true },
        });
        await prisma.transaction.create({
          data: { userId: payment.userId, type: 'purchase', amount: coins, description: `Purchased ${coins} Merit Coins`, balanceAfter: updatedUser.meritCoins },
        });
        await notify(payment.userId, 'success', 'coins', 'Merit Coins Added!', `+${coins} Merit Coins added to your wallet.`);
      }

      if (payment.purpose === 'subscription') {
        const meta    = payment.metadata;
        const plan    = PLANS[meta?.plan];
        if (plan) {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + plan.period);
          const exists = await prisma.subscription.findUnique({ where: { paymentId: payment.id } });
          if (!exists) {
            await prisma.subscription.create({
              data: { userId: payment.userId, paymentId: payment.id, plan: meta.plan, status: 'active', endDate },
            });
            await notify(payment.userId, 'success', 'star', 'Subscription Activated!', `Your ${plan.label} plan is now active.`);
          }
        }
      }
    }

    if (event.event === 'subscription.disable') {
      // Cancel only the specific user's active subscription, scoped by their email.
      // Previously this had no WHERE clause and cancelled every active subscription
      // in the database whenever a single Paystack event fired.
      const customerEmail = event.data?.customer?.email;
      if (customerEmail) {
        const user = await prisma.user.findUnique({
          where:  { email: customerEmail },
          select: { id: true },
        });
        if (user) {
          await prisma.subscription.updateMany({
            where: { userId: user.id, status: 'active' },
            data:  { status: 'cancelled' },
          });
          await notify(user.id, 'info', 'bell', 'Subscription Cancelled', 'Your subscription has been cancelled.');
        }
      }
    }
  } catch (err) {
    console.error('[Webhook error]', err);
  }

  res.sendStatus(200);
});

// ─── GET /payment/history ─────────────────────────────────────────────────────
router.get('/history', authenticate, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return success(res, payments);
  } catch (err) {
    return error(res, 'Failed to fetch payment history');
  }
});

// ─── Internal helper ─────────────────────────────────────────────────────────
async function notify(userId, type, icon, title, message) {
  return prisma.notification.create({ data: { userId, type, icon, title, message } });
}

module.exports = router;
