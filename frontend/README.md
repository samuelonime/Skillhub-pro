# SkillHub Pro — Next.js + Tailwind CSS

A complete conversion of the original HTML/CSS frontend to **Next.js 15 (App Router)** with **Tailwind CSS v4**.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign In / Register / Forgot Password |
| `/dashboard` | Student dashboard overview |
| `/dashboard/courses` | Course browser with enrolment |
| `/dashboard/jobs` | Job matching with detail panel |
| `/dashboard/certificates` | Certificates with sharing options |
| `/dashboard/rewards` | Merit Coins + redeem rewards |
| `/dashboard/settings` | Profile, security, notifications, privacy |
| `/employer` | Employer dashboard (overview / jobs / applicants tabs) |

## Setup

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Tech Stack

- **Next.js 15** — App Router, server/client components
- **Tailwind CSS v4** — utility-first, no config file needed
- **Lucide React** — icon library
- **Font Awesome 6** — loaded via CDN in layout
- **Google Fonts** — Syne + DM Sans

## Design Tokens

All original CSS variables are preserved as Tailwind arbitrary values and in `globals.css`:

```
--brand:   #5b4cf5  (primary purple)
--brand-2: #7c6ff7
--brand-3: #a78bfa
--green:   #10b981
--amber:   #f59e0b
--ink:     #08080f  (dark background)
```

## API

The auth pages connect to `https://skillhub-u918.onrender.com/api/v1`.
Replace `API` in `src/app/login/page.tsx` to point to your backend.
