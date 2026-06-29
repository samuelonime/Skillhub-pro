# SkillHub Pro

SkillHub Pro is a full-stack platform with an Express/Prisma backend and a Next.js frontend.

## Structure

- `backend/`: Express API, Prisma schema, migrations, and seed data.
- `frontend/`: Next.js application for student, employer, and admin experiences.

## Development

### Backend

```bash
cd backend
npm install
npm run dev
```

Required environment variables include `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For a production build:

```bash
cd frontend
npm run build
npm start
```

## Notes

- The backend serves API routes under `/api/v1`.
- The frontend uses same-origin API requests and relies on HttpOnly auth cookies.
- Employer billing, certificates, community features, and admin tools are all part of the current application surface.
