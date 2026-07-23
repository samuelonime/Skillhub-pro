require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const crypto      = require('crypto');
const path        = require('path');
const prisma      = require('./config/database');
const { trackSession } = require('./middleware/sessionTracker');
const { startJobScoutCron } = require('./cron/jobScoutCron');
const { startMessageCleanupCron } = require('./cron/messageCleanupCron');

// ENV validation
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
const BAD_PREFIXES  = ['CHANGE_ME', 'REPLACE_ME', 'YOUR_', 'sk_live_REPLACE'];
const missing = REQUIRED_ENV.filter(k =>
  !process.env[k] || BAD_PREFIXES.some(p => (process.env[k] || '').startsWith(p))
);
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

// Trust the first proxy (Render, Railway, etc.) so req.ip is the real client IP
// rather than the load balancer address.
app.set('trust proxy', 1);

app.use((req, _res, next) => { req.id = crypto.randomUUID(); next(); });

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: IS_PROD ? {
    directives: {
      defaultSrc:              ["'self'"],
      imgSrc:                  ["'self'", 'https://res.cloudinary.com', 'https://ui-avatars.com', 'https://randomuser.me', 'https://placehold.co', 'data:'],
      scriptSrc:               ["'self'"],
      styleSrc:                ["'self'", "'unsafe-inline'"],
      connectSrc:              ["'self'"],
      frameSrc:                ["'none'"],
      objectSrc:               ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false,
}));

app.use(compression());
app.use(morgan(IS_PROD ? 'combined' : 'dev'));

const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);
if (!IS_PROD && !allowedOrigins.length) allowedOrigins.push('http://localhost:3000');

app.use(cors({
  origin: IS_PROD
    ? (o, cb) => (!o || allowedOrigins.includes(o) ? cb(null, true) : cb(new Error(`CORS: ${o} not allowed`)))
    : true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true, // required for cookies to be sent cross-origin
}));

// ── cookie-parser must come BEFORE routes ──────────────────────────────────
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET));

// Webhook MUST receive raw body for signature verification
app.use('/api/v1/payment/webhook', express.raw({ type: 'application/json' }));
app.use('/api/v1/payment/paypal/webhook', express.raw({ type: 'application/json' }));
app.use('/api/v1/platforms/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const refreshLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
// Contact form: unauthenticated endpoint — tighter limit to prevent spam/flooding
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many contact submissions. Please try again later.' } });
const apiLimiter  = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true, legacyHeaders: false,
});
app.use('/api/v1/auth/refresh', refreshLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/contact', contactLimiter);
app.use('/api', apiLimiter);

// Resume files contain PII — serve them through an authenticated route that
// verifies ownership. Other upload types (avatars, thumbnails) remain public.
app.use('/uploads/resumes', require('./middleware/auth').authenticate, async (req, res, next) => {
  const filename   = path.basename(req.path);
  const ownerId    = filename.split('_')[1]; // filename: resume_<userId>_<timestamp>.ext
  const isAdmin    = req.user.role === 'admin';
  const isOwner    = req.user.id === ownerId;
  const isEmployer = req.user.role === 'employer'; // employers can view resumes

  if (!isOwner && !isAdmin && !isEmployer) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
}, express.static(path.join(__dirname, '../uploads/resumes')));

// Non-sensitive uploads (avatars, thumbnails) remain publicly accessible
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ─────────────────────────────────────────────────────────────────
// Session tracker fires on every authenticated API request (throttled to 1 write/5min per user)
app.use('/api/v1', require('./middleware/auth').optionalAuthenticate, trackSession);

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
app.use('/api/v1/skill-paths',  require('./routes/skillpaths'));
app.use('/api/v1/talent',       require('./routes/talent'));
app.use('/api/v1/employer',     require('./routes/employer'));
app.use('/api/v1/resume',       require('./routes/resume'));
app.use('/api/v1/skill-gap',    require('./routes/skillgap'));
app.use('/api/v1/platforms',    require('./routes/platforms'));
app.use('/api/v1/community',    require('./routes/community'));
app.use('/api/v1/sso',          require('./routes/sso'));
// ── AI Feature Routes (new) ────────────────────────────────────────────────
app.use('/api/v1/career-oracle',    require('./routes/careerOracle'));
app.use('/api/v1/skill-coach',      require('./routes/skillCoach'));
app.use('/api/v1/peer-genome',      require('./routes/peerGenome'));
app.use('/api/v1/skill-decay',      require('./routes/skillDecay'));
app.use('/api/v1/ghost-recruiter',  require('./routes/ghostRecruiter'));
app.use('/api/v1/contact',          require('./routes/contact'));
app.use('/api/v1/job-scout', require('./routes/jobScout'));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'SkillHub API', health: '/health' });
});

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
    console.log(`❤️  Health:   http://localhost:${PORT}/health`);
    console.log(`🍪 Cookies:  HttpOnly mode ${IS_PROD ? '(secure)' : '(dev — http allowed)'}`);
    console.log(`💳 Paystack: ${process.env.PAYSTACK_SECRET_KEY ? 'configured ✅' : 'not configured ⚠️'}`);
    if (!IS_PROD) console.log('⚠️  Running in development mode\n');
  });

  startJobScoutCron();
  startMessageCleanupCron();

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