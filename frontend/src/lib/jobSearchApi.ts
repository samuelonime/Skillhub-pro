// lib/jobSearchApi.ts
// ── SkillHub Pro — Web Job Search API helper ─────────────────────────────
//
// IMPORTANT CHANGE: All requests now go to /api/job-search (same-origin
// Next.js route handler) instead of directly to the Render FastAPI server.
// This eliminates both the CORS problem and the browser cold-start timeout.
// See: frontend/src/app/api/job-search/route.ts

// ── Types matching backend/app/models/job.py exactly ─────────────────────

export type JobSource =
  | 'linkedin' | 'indeed' | 'glassdoor'
  | 'remoteok' | 'angel' | 'twitter' | 'company' | 'other';

export type JobType =
  | 'full-time' | 'part-time' | 'contract'
  | 'freelance' | 'internship' | 'remote';

export type ExperienceLevel =
  | 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';

/** Mirrors backend/app/models/job.py → JobPost */
export interface ScrapedJob {
  id?:               string;
  title:             string;
  company:           string;
  company_url?:      string;
  location?:         string;
  description?:      string;
  skills?:           string[];
  salary_min?:       number;
  salary_max?:       number;
  salary_currency?:  string;
  job_type?:         JobType;
  experience_level?: ExperienceLevel;
  source:            JobSource | string;
  source_url:        string;
  is_remote?:        boolean;
  posted_date?:      string;
  created_at?:       string;
  // Added client-side by scoreJobsAgainstSkills()
  match?: number;
}

export interface SourceStatus {
  source:  string;
  status:  'ok' | 'no_results' | 'error';
  results: number;
  detail?: string;
}

export interface SearchApiResponse {
  query:          string;
  results:        number;
  jobs:           ScrapedJob[];
  source_status:  SourceStatus[];
  response_time:  number;
}

export interface SearchOptions {
  location?:   string;
  remoteOnly?: boolean;
  maxResults?: number;
  jobType?:    JobType;
  sources?:    JobSource[];
}

// ── API call (via same-origin Next.js proxy) ──────────────────────────────

/**
 * Searches live jobs by calling the Next.js route handler at /api/job-search,
 * which proxies the request to the Render FastAPI backend server-side.
 *
 * This avoids browser CORS restrictions and Render cold-start timeouts.
 * The route handler has a 55-second server-side timeout to cover cold starts.
 */
export async function searchWebJobs(
  query: string,
  opts: SearchOptions = {}
): Promise<ScrapedJob[]> {
  const body: Record<string, any> = {
    query:       query.trim(),
    remote_only: opts.remoteOnly ?? false,
    max_results: opts.maxResults ?? 20,
  };

  if (opts.location) body.location = opts.location;
  if (opts.jobType)  body.job_type  = opts.jobType;
  if (opts.sources)  body.sources   = opts.sources;

  const res = await fetch('/api/job-search', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err?.error) detail = err.error;
    } catch {}

    // Give a user-friendly message for the Render cold-start scenario
    if (res.status === 504 || detail.toLowerCase().includes('waking')) {
      throw new Error(
        'The job search service is starting up — this takes ~30 seconds on first use. ' +
        'Please try again shortly.'
      );
    }

    throw new Error(`Job search failed: ${detail}`);
  }

  const data = (await res.json()) as SearchApiResponse;

  // Normalise source_url — FastAPI's HttpUrl can serialise as an object
  return (data.jobs || []).map(job => ({
    ...job,
    source_url:  String(job.source_url  ?? ''),
    company_url: job.company_url ? String(job.company_url) : undefined,
  }));
}

// ── Client-side skill scoring ──────────────────────────────────────────────
// Mirrors SequenceMatcher logic from backend/app/services/job_matcher.py

function sequenceSimilarity(a: string, b: string): number {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (!a || !b) return 0;
  if (a === b)  return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;

  const bigrams = (s: string) =>
    new Set(Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2)));
  const bA = bigrams(a);
  const bB = bigrams(b);
  const inter = [...bA].filter(bg => bB.has(bg)).length;
  const union = bA.size + bB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function calculateSkillMatch(jobSkill: string, userSkills: string[]): number {
  if (!userSkills.length) return 0;
  return Math.max(...userSkills.map(us => sequenceSimilarity(jobSkill, us))) * 100;
}

/**
 * Score and sort jobs against the user's skill list.
 *
 * userSkills source in SkillHub Pro:
 *   The /jobs/featured endpoint returns { jobs, userTier, userCoins } —
 *   it does NOT include userSkills. Fetch skills from /auth/me instead:
 *     const me = await apiFetch('/auth/me');
 *     const userSkills = me.data?.skills ?? [];
 */
export function scoreJobsAgainstSkills(
  jobs: ScrapedJob[],
  userSkills: string[]
): ScrapedJob[] {
  if (!userSkills?.length) {
    return jobs.map(j => ({ ...j, match: undefined }));
  }

  return jobs
    .map(job => {
      const jobSkills = job.skills ?? [];
      if (!jobSkills.length) return { ...job, match: 50 };

      const scores  = jobSkills.map(js => calculateSkillMatch(js, userSkills));
      const average = scores.reduce((s, n) => s + n, 0) / scores.length;
      return { ...job, match: Math.round(average) };
    })
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));
}

// ── Salary formatter ───────────────────────────────────────────────────────

export function formatSalary(job: ScrapedJob): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const currency = job.salary_currency || 'USD';
  const symbol   = currency === 'NGN' ? '₦' : currency === 'GBP' ? '£' : '$';
  const fmt      = (n: number) =>
    n >= 1000 ? `${symbol}${(n / 1000).toFixed(0)}k` : `${symbol}${n}`;
  if (job.salary_min && job.salary_max)
    return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  if (job.salary_min) return `From ${fmt(job.salary_min)}`;
  if (job.salary_max) return `Up to ${fmt(job.salary_max)}`;
  return null;
}
