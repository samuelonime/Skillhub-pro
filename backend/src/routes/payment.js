// SkillHub — Payment Routes
// Providers:
//   Paystack → NGN card / bank transfer (Nigerian users)
//   PayPal   → USD card / PayPal wallet  (international users)
//
// Flow:
//   POST /initiate        → returns { provider, authorizationUrl|approvalUrl, reference }
//   POST /verify/:ref     → Paystack only (client calls after redirect back)
//   POST /paypal/capture  → PayPal only  (client calls after PayPal approval)
//   POST /webhook         → Paystack webhook  (server-to-server)
//   POST /paypal/webhook  → PayPal webhook    (server-to-server)

const router = require('express').Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, created, badRequest, error } = require('../utils/response');

// ─── ENV ──────────────────────────────────────────────────────────────────────
const PAYSTACK_SECRET  = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE    = 'https://api.paystack.co';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET    = process.env.PAYPAL_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID; // from PayPal dashboard
const IS_PROD          = process.env.NODE_ENV === 'production';
const PAYPAL_BASE      = IS_PROD
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.warn('⚠️  PAYPAL_CLIENT_ID / PAYPAL_SECRET not set — PayPal payments will not work');
}

// ─── Live exchange rate (USD/NGN) ─────────────────────────────────────────────
const FALLBACK_RATE   = 1600;
let   cachedRate      = FALLBACK_RATE;
let   rateLastFetched = 0;
const RATE_TTL_MS     = 60 * 60 * 1000;

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

// ─── Plan catalogue ───────────────────────────────────────────────────────────
// NGN amounts in kobo (for Paystack). USD amounts in cents (for PayPal).
const PLANS = {
  pro_monthly:      { label: 'Pro Monthly',     amountKobo: 500000,   amountUsdCents: 300,  period: 30  },
  pro_annual:       { label: 'Pro Annual',       amountKobo: 4500000,  amountUsdCents: 2500, period: 365 },
  employer_monthly: { label: 'Employer Monthly', amountKobo: 1000000,  amountUsdCents: 600,  period: 30  },
  employer_annual:  { label: 'Employer Annual',  amountKobo: 9000000,  amountUsdCents: 5500, period: 365 },
};

const COIN_BUNDLES = {
  coins_500:  { label: '500 Merit Coins',  amountKobo: 100000, amountUsdCents: 65,  coins: 500  },
  coins_1500: { label: '1500 Merit Coins', amountKobo: 250000, amountUsdCents: 160, coins: 1500 },
  coins_5000: { label: '5000 Merit Coins', amountKobo: 700000, amountUsdCents: 440, coins: 5000 },
};

// ─── Paystack helpers ─────────────────────────────────────────────────────────
async function paystackRequest(method, path, body = null) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

// ─── PayPal helpers ───────────────────────────────────────────────────────────
let paypalTokenCache = null;
let paypalTokenExpiry = 0;

async function getPayPalToken() {
  if (paypalTokenCache && Date.now() < paypalTokenExpiry) return paypalTokenCache;

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal access token');

  paypalTokenCache  = data.access_token;
  paypalTokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // refresh 1 min early
  return paypalTokenCache;
}

async function paypalRequest(method, path, body = null) {
  const token = await getPayPalToken();
  const res = await fetch(`${PAYPAL_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: { message: text } }; }
}

// ─── GET /payment/plans ───────────────────────────────────────────────────────
router.get('/plans', authenticate, async (_req, res) => {
  const rate = await getLiveRate();

  const plansWithDisplay = Object.fromEntries(
    Object.entries(PLANS).map(([key, plan]) => {
      const naira = plan.amountKobo / 100;
      const usd   = (plan.amountUsdCents / 100).toFixed(2);
      return [key, {
        ...plan,
        naira,
        nairaDisplay: `₦${naira.toLocaleString('en-NG')}`,
        usd:          parseFloat(usd),
        usdDisplay:   `$${usd}`,
        exchangeRate: rate,
      }];
    })
  );

  const bundlesWithDisplay = Object.fromEntries(
    Object.entries(COIN_BUNDLES).map(([key, bundle]) => {
      const naira = bundle.amountKobo / 100;
      const usd   = (bundle.amountUsdCents / 100).toFixed(2);
      return [key, {
        ...bundle,
        naira,
        nairaDisplay: `₦${naira.toLocaleString('en-NG')}`,
        usd:          parseFloat(usd),
        usdDisplay:   `$${usd}`,
        exchangeRate: rate,
      }];
    })
  );

  return success(res, {
    plans:       plansWithDisplay,
    coinBundles: bundlesWithDisplay,
    exchangeRate: rate,
    exchangeRateNote: `NGN prices processed via Paystack. USD prices processed via PayPal.`,
  });
});

// ─── GET /payment/subscription ───────────────────────────────────────────────
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where:   { userId: req.user.id, status: 'active' },
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
// paymentMode:
//   'ngn_card'     → Paystack, NGN, card
//   'ngn_transfer' → Paystack, NGN, bank transfer
//   'usd_paypal'   → PayPal, USD (replaces old usd_card via Paystack)
router.post('/initiate', authenticate, [
  body('purpose').isIn(['subscription', 'merit_coins', 'course', 'featured_profile']),
  body('planOrBundle').notEmpty(),
  body('callbackUrl').isURL(),
  body('paymentMode').optional().isIn(['ngn_card', 'ngn_transfer', 'usd_paypal']),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return badRequest(res, 'Validation failed', errs.array());

  const { purpose, planOrBundle, callbackUrl, paymentMode = 'ngn_card' } = req.body;
  const user = req.user;

  let amountKobo, amountUsdCents, description, metadata;
  const rate = await getLiveRate();

  if (purpose === 'subscription') {
    const plan = PLANS[planOrBundle];
    if (!plan) return badRequest(res, 'Invalid subscription plan');
    amountKobo    = plan.amountKobo;
    amountUsdCents = plan.amountUsdCents;
    description   = plan.label;
    metadata      = { plan: planOrBundle, period: plan.period };
  } else if (purpose === 'merit_coins') {
    const bundle = COIN_BUNDLES[planOrBundle];
    if (!bundle) return badRequest(res, 'Invalid coin bundle');
    amountKobo    = bundle.amountKobo;
    amountUsdCents = bundle.amountUsdCents;
    description   = bundle.label;
    metadata      = { bundle: planOrBundle, coins: bundle.coins };
  } else {
    return badRequest(res, 'Purpose not yet supported via this endpoint');
  }

  // ── PayPal path ──────────────────────────────────────────────────────────
  if (paymentMode === 'usd_paypal') {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return error(res, 'PayPal is not configured on this server');
    }

    const usdAmount    = (amountUsdCents / 100).toFixed(2);
    const paypalRef    = `SH-PP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    try {
      // Create PayPal order
      const { status, data: orderData } = await paypalRequest('POST', '/v2/checkout/orders', {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: paypalRef,
          description,
          amount: {
            currency_code: 'USD',
            value: usdAmount,
          },
          custom_id: JSON.stringify({ userId: user.id, purpose, ...metadata, ref: paypalRef }),
        }],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brand_name:                'SkillHub Pro',
              locale:                    'en-US',
              landing_page:             'LOGIN',
              user_action:              'PAY_NOW',
              return_url:               callbackUrl,
              cancel_url:               callbackUrl + (callbackUrl.includes('?') ? '&' : '?') + 'cancelled=1',
            },
          },
        },
      });

      if (status !== 200 && status !== 201) {
        console.error('[PayPal] Order creation failed:', orderData);
        return error(res, orderData?.message || 'PayPal order creation failed');
      }

      const orderId    = orderData.id;
      const approveLink = orderData.links?.find(l => l.rel === 'payer-action')?.href;

      // Store payment record before redirecting — amount stored as USD cents
      await prisma.payment.create({
        data: {
          userId:       user.id,
          amount:       amountUsdCents, // USD cents — flag via currency field
          currency:     'USD',
          provider:     'paypal',
          status:       'pending',
          paypalOrderId: orderId,
          purpose,
          metadata: {
            ...metadata,
            paypalRef,
            paymentMode: 'usd_paypal',
            usdAmount,
            exchangeRateUsed: rate,
          },
        },
      });

      return created(res, {
        provider:    'paypal',
        approvalUrl: approveLink,
        orderId,
        reference:   paypalRef,
        amount:      amountUsdCents,
        amountUsd:   usdAmount,
        description,
      }, 'PayPal order created — redirect user to approvalUrl');
    } catch (err) {
      console.error('[PayPal] initiate error:', err);
      return error(res, 'Failed to create PayPal order');
    }
  }

  // ── Paystack path ────────────────────────────────────────────────────────
  const naira     = amountKobo / 100;
  const usdDisplay = (naira / rate).toFixed(2);
  const reference  = `SH-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const modeConfig = {
    ngn_card:     { currency: 'NGN', channels: ['card'],          paystackAmount: amountKobo },
    ngn_transfer: { currency: 'NGN', channels: ['bank_transfer'], paystackAmount: amountKobo },
  };
  const { currency, channels, paystackAmount } = modeConfig[paymentMode];

  try {
    await prisma.payment.create({
      data: {
        userId:      user.id,
        amount:      amountKobo,
        currency:    'NGN',
        provider:    'paystack',
        status:      'pending',
        paystackRef: reference,
        purpose,
        metadata: {
          ...metadata,
          usdEquivalent:    usdDisplay,
          exchangeRateUsed: rate,
          paymentMode,
        },
      },
    });

    const psRes = await paystackRequest('POST', '/transaction/initialize', {
      email:        user.email,
      amount:       paystackAmount,
      currency,
      channels,
      reference,
      callback_url: callbackUrl,
      metadata: { userId: user.id, purpose, ...metadata, cancel_action: callbackUrl },
    });

    if (!psRes.status) {
      await prisma.payment.update({ where: { paystackRef: reference }, data: { status: 'failed' } });
      return error(res, psRes.message || 'Paystack initialization failed');
    }

    return created(res, {
      provider:         'paystack',
      authorizationUrl: psRes.data.authorization_url,
      reference,
      amount:      amountKobo,
      amountNaira: naira,
      amountUsd:   usdDisplay,
      exchangeRate: rate,
      description,
    }, 'Payment initiated');
  } catch (err) {
    console.error('Payment initiation error:', err);
    return error(res, 'Failed to initiate payment');
  }
});

// ─── POST /payment/paypal/capture ─────────────────────────────────────────────
// Called by the frontend after PayPal redirects back with ?token=ORDER_ID
// The frontend extracts the token from the URL query and posts it here.
router.post('/paypal/capture', authenticate, [
  body('orderId').notEmpty(),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return badRequest(res, 'orderId is required');

  const { orderId } = req.body;

  try {
    // Fetch the payment record to verify ownership before capturing
    const payment = await prisma.payment.findUnique({
      where: { paypalOrderId: orderId },
    });
    if (!payment)                        return badRequest(res, 'Payment record not found');
    if (payment.userId !== req.user.id)  return badRequest(res, 'Payment does not belong to this user');
    if (payment.status === 'success')    return success(res, payment, 'Payment already captured');
    if (payment.provider !== 'paypal')   return badRequest(res, 'Order is not a PayPal payment');

    // Capture the approved order
    const { status: httpStatus, data: captureData } = await paypalRequest(
      'POST',
      `/v2/checkout/orders/${orderId}/capture`,
    );

    if (httpStatus !== 200 && httpStatus !== 201) {
      console.error('[PayPal] Capture failed:', captureData);
      await prisma.payment.update({ where: { paypalOrderId: orderId }, data: { status: 'failed' } });
      return badRequest(res, captureData?.details?.[0]?.description || 'PayPal capture failed');
    }

    const capture       = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId     = capture?.id;
    const captureStatus = capture?.status; // COMPLETED | PENDING | DECLINED

    if (captureStatus !== 'COMPLETED') {
      return badRequest(res, `PayPal capture status: ${captureStatus}. Payment not completed.`);
    }

    // Mark payment as success
    const updatedPayment = await prisma.payment.update({
      where: { paypalOrderId: orderId },
      data:  { status: 'success', paypalCaptureId: captureId, paidAt: new Date() },
    });

    await fulfillPayment(updatedPayment);

    return success(res, updatedPayment, 'PayPal payment captured and processed successfully');
  } catch (err) {
    console.error('[PayPal] capture error:', err);
    return error(res, 'Failed to capture PayPal payment');
  }
});

// ─── POST /payment/verify/:reference ─────────────────────────────────────────
// Paystack-only: called by frontend after Paystack redirects back
router.post('/verify/:reference', authenticate, async (req, res) => {
  const { reference } = req.params;
  try {
    const psRes = await paystackRequest('GET', `/transaction/verify/${reference}`);
    if (!psRes.status || psRes.data.status !== 'success') {
      await prisma.payment.updateMany({ where: { paystackRef: reference }, data: { status: 'failed' } });
      return badRequest(res, 'Payment was not successful');
    }

    const payment = await prisma.payment.findUnique({ where: { paystackRef: reference } });
    if (!payment)                       return badRequest(res, 'Payment record not found');
    if (payment.userId !== req.user.id) return badRequest(res, 'Payment does not belong to this user');
    if (payment.status === 'success')   return success(res, payment, 'Payment already processed');

    const updatedPayment = await prisma.payment.update({
      where: { paystackRef: reference },
      data:  { status: 'success', paystackTrxRef: String(psRes.data.id), paidAt: new Date() },
    });

    await fulfillPayment(updatedPayment);

    return success(res, updatedPayment, 'Payment verified and processed successfully');
  } catch (err) {
    console.error('Payment verification error:', err);
    return error(res, 'Verification failed');
  }
});

// ─── POST /payment/webhook ────────────────────────────────────────────────────
// Paystack webhook — must receive raw body (set in server.js)
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
      const reference = event.data.reference;
      const payment   = await prisma.payment.findUnique({ where: { paystackRef: reference } });
      if (!payment || payment.status === 'success') return res.sendStatus(200);

      const updated = await prisma.payment.update({
        where: { paystackRef: reference },
        data:  { status: 'success', paystackTrxRef: String(event.data.id), paidAt: new Date() },
      });
      await fulfillPayment(updated);
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
    console.error('[Paystack Webhook error]', err);
  }

  res.sendStatus(200);
});

// ─── POST /payment/paypal/webhook ─────────────────────────────────────────────
// PayPal webhook — must receive raw body (add to server.js)
// Verifies the event via PayPal's verification API before processing.
router.post('/paypal/webhook', async (req, res) => {
  try {
    // ── Verify PayPal webhook signature ──────────────────────────────────
    const headers = req.headers;
    const token   = await getPayPalToken();

    const verifyRes = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo:         headers['paypal-auth-algo'],
        cert_url:          headers['paypal-cert-url'],
        transmission_id:   headers['paypal-transmission-id'],
        transmission_sig:  headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id:        PAYPAL_WEBHOOK_ID,
        webhook_event:     JSON.parse(req.body.toString('utf8')),
      }),
    });

    const verifyData = await verifyRes.json();
    if (verifyData.verification_status !== 'SUCCESS') {
      console.warn('[PayPal Webhook] Signature verification failed:', verifyData);
      return res.status(401).json({ message: 'Invalid PayPal webhook signature' });
    }

    const event = JSON.parse(req.body.toString('utf8'));
    console.log(`[PayPal Webhook] ${event.event_type}`);

    // ── PAYMENT.CAPTURE.COMPLETED ─────────────────────────────────────────
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureId = event.resource?.id;
      const orderId   = event.resource?.supplementary_data?.related_ids?.order_id;

      if (!orderId) {
        console.warn('[PayPal Webhook] No orderId in capture event');
        return res.sendStatus(200);
      }

      const payment = await prisma.payment.findUnique({ where: { paypalOrderId: orderId } });
      if (!payment || payment.status === 'success') return res.sendStatus(200);

      const updated = await prisma.payment.update({
        where: { paypalOrderId: orderId },
        data:  { status: 'success', paypalCaptureId: captureId, paidAt: new Date() },
      });
      await fulfillPayment(updated);
    }

    // ── PAYMENT.CAPTURE.DENIED / REVERSED ─────────────────────────────────
    if (['PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.REVERSED'].includes(event.event_type)) {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        await prisma.payment.updateMany({
          where: { paypalOrderId: orderId, status: { not: 'success' } },
          data:  { status: 'failed' },
        });
      }
    }
  } catch (err) {
    console.error('[PayPal Webhook error]', err);
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
    const withDisplay = payments.map(p => {
      if (p.currency === 'USD') {
        const usd = (p.amount / 100).toFixed(2);
        return { ...p, amountUsd: `$${usd}`, amountNaira: `₦${Math.round(p.amount / 100 * rate).toLocaleString('en-NG')}`, provider: p.provider };
      }
      return {
        ...p,
        amountNaira:  p.amount / 100,
        amountUsd:    `$${(p.amount / 100 / rate).toFixed(2)}`,
        exchangeRate: rate,
        provider:     p.provider,
      };
    });
    return success(res, withDisplay);
  } catch (err) {
    return error(res, 'Failed to fetch payment history');
  }
});

// ─── GET /payment/exchange-rate ───────────────────────────────────────────────
router.get('/exchange-rate', authenticate, async (_req, res) => {
  const rate = await getLiveRate();
  return success(res, {
    rate,
    display:   `₦${rate.toLocaleString('en-NG')} = $1.00`,
    updatedAt: new Date(rateLastFetched || Date.now()).toISOString(),
    source:    'open.er-api.com',
  });
});

// ─── Shared fulfillment logic ─────────────────────────────────────────────────
// Called after both Paystack and PayPal confirm a successful payment.
async function fulfillPayment(payment) {
  if (payment.purpose === 'subscription') {
    const meta  = payment.metadata;
    const plan  = PLANS[meta?.plan];
    if (!plan) return;
    const endDate = new Date(Date.now() + plan.period * 24 * 60 * 60 * 1000);
    const exists  = await prisma.subscription.findUnique({ where: { paymentId: payment.id } });
    if (!exists) {
      await prisma.subscription.create({
        data: { userId: payment.userId, paymentId: payment.id, plan: meta.plan, status: 'active', endDate },
      });
      await notify(payment.userId, 'success', 'star', 'Subscription Activated!', `Your ${plan.label} plan is now active.`);
    }
  }

  if (payment.purpose === 'merit_coins') {
    const coins = payment.metadata?.coins ?? 0;
    const updatedUser = await prisma.user.update({
      where:  { id: payment.userId },
      data:   { meritCoins: { increment: coins } },
      select: { meritCoins: true },
    });
    await prisma.transaction.create({
      data: { userId: payment.userId, type: 'purchase', amount: coins, description: `Purchased ${coins} Merit Coins`, balanceAfter: updatedUser.meritCoins },
    });
    await notify(payment.userId, 'success', 'coins', 'Merit Coins Added!', `+${coins} Merit Coins added to your wallet.`);
  }
}

async function notify(userId, type, icon, title, message) {
  return prisma.notification.create({ data: { userId, type, icon, title, message } });
}

module.exports = router;