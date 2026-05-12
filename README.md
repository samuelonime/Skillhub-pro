# SkillHub Professional — Full-Stack Platform

A professional skills-matching platform with a complete **Node.js/Express backend** and a vanilla JS frontend.

---

## 🚀 Quick Start (Development)

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env — fill in real JWT secrets and ADMIN_SECRET_CODE
```

Generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Install & run

```bash
cd backend
npm install
npm run dev       # nodemon; or `npm start` for plain node
```

API runs at **http://localhost:5000**

### 3. Open the frontend

```bash
cd frontend
npx serve .       # visit http://localhost:3000
```

---

## 🔐 Demo Accounts (development seed data only)

| Role     | Email                | Password     |
|----------|----------------------|--------------|
| Student  | student@skillhub.com | Password123! |
| Employer | employer@skillhub.com| Password123! |
| Admin    | admin@skillhub.com   | Admin123!    |

---

## 🛡️ Security Changes (production-readiness pass)

| # | Issue | Fix |
|---|-------|-----|
| 1 | `.env` with real secrets committed to repo | Replaced with safe placeholders; `.gitignore` excludes `.env` |
| 2 | Test credentials exposed via `GET /api/v1` | Endpoint no longer returns credentials |
| 3 | `API_BASE` hardcoded to `localhost` in frontend | Reads from `<meta name="api-base">` or auto-detects origin |
| 4 | `morgan('dev')` in production (verbose, leaks info) | Production uses concise format without sensitive headers |
| 5 | CORS fallback to `'*'` | Production enforces strict origin allowlist |
| 6 | Admin registration unprotected | Requires `ADMIN_SECRET_CODE` env var |
| 7 | JWT fallback secrets baked into source | Removed; server exits on missing/placeholder secrets |
| 8 | JWT access token expiry 7 days (too long) | Default 15m; configurable via `JWT_EXPIRES_IN` |
| 9 | No `_tryRefresh` — 401 immediately logged out | Silent token refresh before redirecting to login |
| 10 | Admin user-update allowed any field (mass assignment) | Restricted to explicit allow-list + role validation |
| 11 | No graceful shutdown | SIGTERM/SIGINT drain connections, 10s force-kill fallback |
| 12 | No request IDs | Every request gets a UUID for log correlation |
| 13 | No `engines` field in package.json | Added `node >=18.0.0` |
| 14 | `nodemon` missing from devDependencies | Added |
| 15 | No XSS escape utility in frontend | `esc()` helper exported as `window.esc` in api.js |
| 16 | Network errors swallowed silently | Catch block shows toast + rethrows |
| 17 | `.gitignore` missing entirely | Added |

---

## 📁 Structure

```
skillhub-pro/
├── backend/
│   ├── src/
│   │   ├── server.js          # Entry: env validation, CORS, request IDs, graceful shutdown
│   │   ├── config/database.js # In-memory DB (swap → PostgreSQL/MongoDB for production)
│   │   ├── middleware/auth.js  # JWT + RBAC
│   │   ├── routes/            # auth, dashboard, courses, jobs, portfolio,
│   │   │                      # certificates, users, rewards, settings, admin
│   │   └── utils/             # jwt.js, response.js
│   ├── uploads/.gitkeep
│   ├── .env.example           # Template — copy to .env, never commit .env
│   └── package.json
├── frontend/
│   ├── scripts/api.js         # API client: configurable base, refresh, esc()
│   ├── scripts/layout.js      # Sidebar/topbar
│   └── styles/
├── .gitignore
└── README.md
```

---

## 🌱 Moving to Production

1. **Database** — Replace in-memory store with PostgreSQL (Prisma) or MongoDB (Mongoose)
2. **File uploads** — Move to Cloudinary or S3
3. **Email** — Add SendGrid/Resend for verification & password reset
4. **Frontend API base** — Add `<meta name="api-base" content="https://api.yoursite.com/api/v1">` in each HTML page, or configure a reverse proxy
5. **Deploy backend** — Railway, Render, Fly.io, or AWS
6. **Deploy frontend** — Vercel, Netlify, or Nginx
