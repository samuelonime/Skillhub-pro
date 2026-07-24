// lib/jobSearchApi.ts
// ── SkillHub Pro — Web Job Search API helper ──────────────────────────────
//
// Talks to the skillhub-job-api FastAPI backend deployed on Render.
// Endpoint:  POST /api/v1/jobs/search
// Response shape (from backend/app/api/endpoints/search.py):
//   { query, results, jobs: JobPost[], source_status, response_time }
//
// JobPost fields (from backend/app/models/job.py):
//   id, title, company, location, description, skills, salary_min,
//   salary_max, salary_currency, source (enum), source_url, is_remote,
//   job_type (enum), experience_level, posted_date, created_at
//
// Match scoring runs entirely client-side using the same SequenceMatcher
// logic as the backend's JobMatcherService (job_matcher.py), so no extra
// auth token or API call is needed for scoring.

const JOB_SEARCH_API =
  process.env.NEXT_PUBLIC_JOB_SEARCH_API_URL ||
  'https://skillhub-job-api.onrender.com';

// ── Types matching the FastAPI models exactly ────────────────────────────────

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

/** Mirrors POST /api/v1/jobs/search response */
export interface SearchApiResponse {
  query:         string;
  results:       number;
  jobs:          ScrapedJob[];
  source_status: SourceStatus[];
  response_time: number;
}

export interface SearchOptions {
  location?:   string;
  remoteOnly?: boolean;
  maxResults?: number;
  jobType?:    JobType;
  sources?:    JobSource[];
}

// ── API call ─────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/jobs/search
 *
 * The backend uses JobSpy to scrape LinkedIn, Indeed, and Glassdoor in
 * parallel and returns real-time results cached in Redis for 5 minutes.
 * The Render free-tier service sleeps after inactivity — first call after
 * sleep can take ~30 s to respond; subsequent calls are fast.
 *
 * No auth token required (uses optional_auth middleware).
 */
export async function searchWebJobs(
  query: string,
  opts: SearchOptions = {}
): Promise<ScrapedJob[]> {
  const body: Record<string, any> = {
    query,
    remote_only: opts.remoteOnly ?? false,
    max_results: opts.maxResults ?? 20,
  };

  if (opts.location)  body.location  = opts.location;
  if (opts.jobType)   body.job_type  = opts.jobType;
  if (opts.sources)   body.sources   = opts.sources;

  const res = await fetch(`${JOB_SEARCH_API}/api/v1/jobs/search`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    // Surface the FastAPI error detail when available
    let detail = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err?.detail) detail = err.detail;
    } catch {}
    throw new Error(
      `Job search failed: ${detail}. ` +
      'The Render free-tier service may be waking up — try again in ~30 s.'
    );
  }

  const data = (await res.json()) as SearchApiResponse;

  // Normalise source_url: FastAPI validates it as HttpUrl which sometimes
  // serialises to an object rather than a plain string — make it safe.
  return (data.jobs || []).map(job => ({
    ...job,
    source_url: String(job.source_url ?? ''),
    company_url: job.company_url ? String(job.company_url) : undefined,
  }));
}

// ── Client-side skill scoring ─────────────────────────────────────────────────
//
// Mirrors the SequenceMatcher logic in backend/app/services/job_matcher.py
// → JobMatcherService._calculate_skill_match()
// Running it client-side avoids the authenticated POST /api/v1/match endpoint.

function sequenceSimilarity(a: string, b: string): number {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (!a || !b) return 0;
  if (a === b)  return 1;

  // Fast path — substring containment (covers "react" ↔ "reactjs" etc.)
  if (a.includes(b) || b.includes(a)) return 0.8;

  // Bigram overlap (approximates SequenceMatcher.ratio())
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
 * Score each ScrapedJob against the user's verified skill list and sort
 * best-match first. Jobs with no listed skills receive a neutral 50%
 * (same behaviour as the backend matcher).
 *
 * @param jobs       Raw results from searchWebJobs()
 * @param userSkills The logged-in user's skill list.
 *                   In SkillHub Pro this comes from the /jobs/featured
 *                   response (featured.userSkills) or /auth/me (user.skills).
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
      if (jobSkills.length === 0) return { ...job, match: 50 };

      const scores  = jobSkills.map(js => calculateSkillMatch(js, userSkills));
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      return { ...job, match: Math.round(average) };
    })
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));
}

// ── Salary formatter ──────────────────────────────────────────────────────────
// Converts the backend's salary_min/salary_max/salary_currency fields into a
// human-readable string ready to display in the jobs page.

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
