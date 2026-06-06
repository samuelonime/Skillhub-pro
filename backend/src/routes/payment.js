// SkillHub — Paystack Payment Routes
// Handles: initiate payment, verify webhook, subscriptions, merit coin purchases
// Dual-currency: NGN (Paystack/kobo) + USD live rate fetched from ExchangeRate-API (free tier)
const router = require('express').Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, created, badRequest, error } = require('../utils/response');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE   = 'https://api.paystack.co';

// ─── Live exchange rate (USD/NGN) ─────────────────────────────────────────────
// We cache the rate for 1 hour to avoid hammering the free-tier API.
// Source: open.er-api.com (no key required, 1,500 req/month free)
// If the fetch fails we fall back to a hardcoded fallback rate.
const FALLBACK_RATE   = 1600;    // NGN per 1 USD — updated fallback
let   cachedRate      = FALLBACK_RATE;
let   rateLastFetched = 0;
const RATE_TTL_MS     = 60 * 60 * 1000; // 1 hour

async function getLiveRate() {
  const now = Date.now();
  if (now - rateLastFetched < RATE_TTL_MS) return cachedRate;
  try {
    const r    = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await r.json();
    if (data?.result === 'success' && data.rates?.NGN) {
      cachedRate      = Math.round(data.rates.NGN);
      rateLastFetched = now;
      console.log(`[Exchange rate] 1 USD = ₦${cachedRate} (live)`);
    }
  } catch (err) {
    console.warn('[Exchange rate] Fetch failed, using fallback ₦' + FALLBACK_RATE, err.message);
  }
  return cachedRate;
}

async function nairaToUsd(naira) {
  const rate = await getLiveRate();
  return (naira / rate).toFixed(2);
}
async function koboToUsd(kobo) {
  return nairaToUsd(kobo / 100);
}

// ─── Plan catalogue ───────────────────────────────────────────────────────────
// amount is in kobo (₦1 = 100 kobo) — required by Paystack
// Employer monthly: ₦10,000 | Employer annual: ₦90,000
const PLANS = {
  pro_monthly:      { label: 'Pro Monthly',     amount: 500000,   period: 30  },  // ₦5,000
  pro_annual:       { label: 'Pro Annual',       amount: 4500000,  period: 365 },  // ₦45,000
  employer_monthly: { label: 'Employer Monthly', amount: 1000000,  period: 30  },  // ₦10,000
  employer_annual:  { label: 'Employer Annual',  amount: 9000000,  period: 365 },  // ₦90,000
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
// Returns subscription plans and coin bundles with NGN + live USD display prices
router.get('/plans', authenticate, async (_req, res) => {
  const rate = await getLiveRate();

  const plansWithDisplay = Object.fromEntries(
    await Promise.all(
      Object.entries(PLANS).map(async ([key, plan]) => {
        const naira   = plan.amount / 100;
        const usd     = (naira / rate).toFixed(2);
        return [key, {
          ...plan,
          naira,
          nairaDisplay: `₦${naira.toLocaleString('en-NG')}`,
          usd:          parseFloat(usd),
          usdDisplay:   `$${usd}`,
          exchangeRate: rate,
        }];
      })
    )
  );

  const bundlesWithDisplay = Object.fromEntries(
    await Promise.all(
      Object.entries(COIN_BUNDLES).map(async ([key, bundle]) => {
        const naira = bundle.amount / 100;
        const usd   = (naira / rate).toFixed(2);
        return [key, {
          ...bundle,
          naira,
          nairaDisplay: `₦${naira.toLocaleString('en-NG')}`,
          usd:          parseFloat(usd),
          usdDisplay:   `$${usd}`,
          exchangeRate: rate,
        }];
      })
    )
  );

  return success(res, {
    plans:      plansWithDisplay,
    coinBundles: bundlesWithDisplay,
    exchangeRate: rate,
    exchangeRateNote: `USD prices are live at ₦${rate}/USD. Payments are processed in NGN via Paystack.`,
  });
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
  const rate = await getLiveRate();

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

  const naira      = amount / 100;
  const usdDisplay = (naira / rate).toFixed(2);
  const reference  = `SH-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  try {
    await prisma.payment.create({
      data: {
        userId:      user.id,
        amount,
        currency:    'NGN',
        status:      'pending',
        paystackRef: reference,
        purpose,
        metadata: {
          ...metadata,
          usdEquivalent:    usdDisplay,
          exchangeRateUsed: rate,
        },
      },
    });

    const psRes = await paystackRequest('POST', '/transaction/initialize', {
      email:     user.email,
      amount,
      reference,
      callback_url: callbackUrl,
      metadata: { userId: user.id, purpose, ...metadata, cancel_action: callbackUrl },
    });

    if (!psRes.status) {
      await prisma.payment.update({ where: { paystackRef: reference }, data: { status: 'failed' } });
      return error(res, psRes.message || 'Paystack initialization failed');
    }

    return created(res, {
      authorizationUrl: psRes.data.authorization_url,
      reference,
      amount,
      amountNaira:  naira,
      amountUsd:    usdDisplay,
      exchangeRate: rate,
      description,
    }, 'Payment initiated');
  } catch (err) {
    console.error('Payment initiation error:', err);
    return error(res, 'Failed to initiate payment');
  }
});

// ─── POST /payment/verify/:reference ─────────────────────────────────────────
router.post('/verify/:reference', authenticate, async (req, res) => {
  const { reference } = req.params;
  try {
    const psRes = await paystackRequest('GET', `/transaction/verify/${reference}`);
    if (!psRes.status || psRes.data.status !== 'success') {
      await prisma.payment.updateMany({ where: { paystackRef: reference }, data: { status: 'failed' } });
      return badRequest(res, 'Payment was not successful');
    }

    const payment = await prisma.payment.findUnique({ where: { paystackRef: reference } });
    if (!payment)                         return badRequest(res, 'Payment record not found');
    if (payment.userId !== req.user.id)   return badRequest(res, 'Payment does not belong to this user');
    if (payment.status === 'success')     return success(res, payment, 'Payment already processed');

    const updatedPayment = await prisma.payment.update({
      where: { paystackRef: reference },
      data:  { status: 'success', paystackTrxRef: String(psRes.data.id), paidAt: new Date() },
    });

    if (payment.purpose === 'subscription') {
      const meta    = payment.metadata;
      const plan    = PLANS[meta.plan];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.period);
      await prisma.subscription.create({
        data: { userId: payment.userId, paymentId: updatedPayment.id, plan: meta.plan, status: 'active', endDate },
      });
      await notify(payment.userId, 'success', 'star', 'Subscription Activated!', `Your ${plan.label} plan is now active.`);
    }

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

    return success(res, updatedPayment, 'Payment verified and processed successfully');
  } catch (err) {
    console.error('Payment verification error:', err);
    return error(res, 'Verification failed');
  }
});

// ─── POST /payment/webhook ────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(req.body)
    .digest('hex');
  if (hash !== req.headers['x-paystack-signature']) return res.status(401).json({ message: 'Invalid signature' });

  let event;
  try { event = JSON.parse(req.body.toString('utf8')); }
  catch { return res.status(400).json({ message: 'Invalid JSON payload' }); }
  console.log(`[Paystack Webhook] ${event.event}`);

  try {
    if (event.event === 'charge.success') {
      const data      = event.data;
      const reference = data.reference;
      const payment   = await prisma.payment.findUnique({ where: { paystackRef: reference } });
      if (!payment || payment.status === 'success') return res.sendStatus(200);

      await prisma.payment.update({
        where: { paystackRef: reference },
        data:  { status: 'success', paystackTrxRef: String(data.id), paidAt: new Date() },
      });

      if (payment.purpose === 'merit_coins') {
        const coins = payment.metadata?.coins ?? 0;
        const updatedUser = await prisma.user.update({
          where: { id: payment.userId }, data: { meritCoins: { increment: coins } }, select: { meritCoins: true },
        });
        await prisma.transaction.create({ data: { userId: payment.userId, type: 'purchase', amount: coins, description: `Purchased ${coins} Merit Coins`, balanceAfter: updatedUser.meritCoins } });
        await notify(payment.userId, 'success', 'coins', 'Merit Coins Added!', `+${coins} Merit Coins added to your wallet.`);
      }

      if (payment.purpose === 'subscription') {
        const meta  = payment.metadata;
        const plan  = PLANS[meta?.plan];
        if (plan) {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + plan.period);
          const exists = await prisma.subscription.findUnique({ where: { paymentId: payment.id } });
          if (!exists) {
            await prisma.subscription.create({ data: { userId: payment.userId, paymentId: payment.id, plan: meta.plan, status: 'active', endDate } });
            await notify(payment.userId, 'success', 'star', 'Subscription Activated!', `Your ${plan.label} plan is now active.`);
          }
        }
      }
    }

    if (event.event === 'subscription.disable') {
      const customerEmail = event.data?.customer?.email;
      if (customerEmail) {
        const user = await prisma.user.findUnique({ where: { email: customerEmail }, select: { id: true } });
        if (user) {
          await prisma.subscription.updateMany({ where: { userId: user.id, status: 'active' }, data: { status: 'cancelled' } });
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
    const rate     = await getLiveRate();
    const payments = await prisma.payment.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
    const withUsd = payments.map(p => ({
      ...p,
      amountNaira:  p.amount / 100,
      amountUsd:    `$${(p.amount / 100 / rate).toFixed(2)}`,
      exchangeRate: rate,
    }));
    return success(res, withUsd);
  } catch (err) {
    return error(res, 'Failed to fetch payment history');
  }
});

// ─── GET /payment/exchange-rate ───────────────────────────────────────────────
// Returns the current live NGN/USD exchange rate for frontend display
router.get('/exchange-rate', authenticate, async (_req, res) => {
  const rate = await getLiveRate();
  return success(res, {
    rate,
    display:   `₦${rate.toLocaleString('en-NG')} = $1.00`,
    updatedAt: new Date(rateLastFetched || Date.now()).toISOString(),
    source:    'open.er-api.com',
  });
});

// ─── Internal helper ─────────────────────────────────────────────────────────
async function notify(userId, type, icon, title, message) {
  return prisma.notification.create({ data: { userId, type, icon, title, message } });
}

module.exports = router;