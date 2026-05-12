require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const crypto      = require('crypto');
const path        = require('path');
const prisma      = require('./config/database');

// ENV validation
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
const missing = REQUIRED_ENV.filter(k => !process.env[k] || process.env[k].startsWith('CHANGE_ME'));
if (missing.length) {
  console.error(`\n❌ Missing env variables: ${missing.join(', ')}`);
  console.error('   Copy .env.example → .env and fill in real values.\n');
  process.exit(1);
}

if (!process.env.PAYSTACK_SECRET_KEY) {
  console.warn('⚠️  PAYSTACK_SECRET_KEY not set — payment routes will not work');
}

const IS_PROD = process.env.NODE_ENV === 'production';
const PORT    = parseInt(process.env.PORT, 10) || 5000;
const app     = express();

app.use((req, _res, next) => { req.id = crypto.randomUUID(); next(); });
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: IS_PROD ? undefined : false }));
app.use(compression());
app.use(morgan(IS_PROD ? 'combined' : 'dev'));

const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);
if (!IS_PROD && !allowedOrigins.length) allowedOrigins.push('http://localhost:3000');

app.use(cors({
  origin: IS_PROD ? (o, cb) => (!o || allowedOrigins.includes(o) ? cb(null, true) : cb(new Error(`CORS: ${o} not allowed`))) : true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// Webhook MUST receive raw body for signature verification
app.use('/api/v1/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const apiLimiter  = rateLimit({ windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, max: parseInt(process.env.RATE_LIMIT_MAX) || 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/v1/auth', authLimiter);
app.use('/api', apiLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth',         require('./routes/auth'));
app.use('/api/v1/dashboard',    require('./routes/dashboard'));
app.use('/api/v1/courses',      require('./routes/courses'));
app.use('/api/v1/jobs',         require('./routes/jobs'));
app.use('/api/v1/portfolio',    require('./routes/portfolio'));
app.use('/api/v1/certificates', require('./routes/certificates'));
app.use('/api/v1/users',        require('./routes/users'));
app.use('/api/v1/rewards',      require('./routes/rewards'));
app.use('/api/v1/settings',     require('./routes/settings'));
app.use('/api/v1/admin',        require('./routes/admin'));
app.use('/api/v1/payment',      require('./routes/payment'));

app.get('/health', async (_req, res) => {
  let db = 'ok';
  try { await prisma.$queryRaw`SELECT 1`; } catch { db = 'error'; }
  res.json({ status: db === 'ok' ? 'healthy' : 'degraded', db, version: '2.0.0', timestamp: new Date().toISOString(), uptime: Math.floor(process.uptime()) });
});

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  console.error(`[${req.id}] ${status}:`, err.message);
  if (!IS_PROD) console.error(err.stack);
  res.status(status).json({ success: false, message: IS_PROD && status === 500 ? 'Internal server error' : err.message, requestId: req.id });
});

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 SkillHub API v2.0 running on http://localhost:${PORT}`);
    console.log(`📚 API index: http://localhost:${PORT}/api/v1`);
    console.log(`❤️  Health:   http://localhost:${PORT}/health`);
    console.log(`💳 Paystack: ${process.env.PAYSTACK_SECRET_KEY ? 'configured ✅' : 'not configured ⚠️'}`);
    if (!IS_PROD) console.log('⚠️  Development mode\n');
  });

  const shutdown = (sig) => {
    console.log(`\n${sig} — shutting down…`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Database disconnected. Bye!');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start();
module.exports = app;
