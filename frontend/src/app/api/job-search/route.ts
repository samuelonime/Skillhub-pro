// frontend/src/app/api/job-search/route.ts
// ── Next.js Route Handler — proxies job search to Render FastAPI ──────────
//
// WHY THIS EXISTS:
// Calling the Render job API directly from the browser causes two problems:
//   1. CORS — the browser blocks cross-origin requests unless the FastAPI
//      server explicitly allows skillhub.meritlives.com (fragile on Render).
//   2. Timeouts — the free-tier Render service sleeps after inactivity;
//      the 30-60 s cold-start exceeds browser fetch defaults.
//
// By routing through this Next.js handler:
//   • The browser makes a same-origin POST to /api/job-search (no CORS).
//   • Next.js calls Render server-side (no browser timeout, no CORS rules).
//   • BACKEND_JOB_API_URL is a server-only env var (not NEXT_PUBLIC_),
//     so it never leaks to the client bundle.

import { NextRequest, NextResponse } from 'next/server';

const JOB_API =
  process.env.BACKEND_JOB_API_URL ||        // server-side env var (preferred)
  process.env.NEXT_PUBLIC_JOB_SEARCH_API_URL || // legacy fallback
  'https://skillhub-job-api.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate — must have a query string
    if (!body?.query?.trim() && !body?.keywords?.length) {
      return NextResponse.json(
        { error: 'query or keywords is required' },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${JOB_API}/api/v1/jobs/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // 55-second server-side timeout — covers Render cold-start (30-60 s)
      // without the browser's stricter default killing the request first.
      signal: AbortSignal.timeout(55_000),
    });

    if (!upstream.ok) {
      let detail = `${upstream.status} ${upstream.statusText}`;
      try {
        const err = await upstream.json();
        if (err?.detail) detail = err.detail;
      } catch {}
      return NextResponse.json({ error: detail }, { status: upstream.status });
    }

    const data = await upstream.json();
    return NextResponse.json(data);

  } catch (err: any) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return NextResponse.json(
      {
        error: isTimeout
          ? 'The job search service is waking up (cold start). Please try again in 30 seconds.'
          : err?.message || 'Job search failed',
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
