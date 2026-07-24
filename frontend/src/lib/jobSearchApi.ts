// lib/jobSearchApi.ts
// ── SkillHub Pro — Web Job Search API helper ──────────────────────────────
// Talks to the FastAPI scraper deployed on Render.
// Match scoring runs client-side so no second auth token is needed.

const JOB_SEARCH_API =
  process.env.NEXT_PUBLIC_JOB_SEARCH_API_URL ||
  'https://skillhub-job-api.onrender.com';

export interface ScrapedJob {
  id?: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  skills?: string[];
  salary_min?: number;
  salary_max?: number;
  source: string;
  source_url: string;
  match?: number; // added client-side by scoreJobsAgainstSkills()
}

export interface SearchResponse {
  jobs: ScrapedJob[];
  results: number;
}

/**
 * POST /api/v1/jobs/search  →  array of ScrapedJob
 * Requires NEXT_PUBLIC_JOB_SEARCH_API_URL in env (or falls back to Render URL).
 */
export async function searchWebJobs(
  query: string,
  opts?: { location?: string; remoteOnly?: boolean; maxResults?: number }
): Promise<ScrapedJob[]> {
  const res = await fetch(`${JOB_SEARCH_API}/api/v1/jobs/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      location:    opts?.location,
      remote_only: opts?.remoteOnly ?? false,
      max_results: opts?.maxResults ?? 20,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Search failed: ${res.status} ${res.statusText}. ` +
      'The Render free-tier service may be waking up — try again in ~30 s.'
    );
  }

  const data = (await res.json()) as SearchResponse;
  return data.jobs;
}

// ── Client-side skill matching ──────────────────────────────────────────────
// Mirrors the FastAPI matcher's fuzzy-string logic.
// Runs locally so we never need a second auth token.

function similarity(a: string, b: string): number {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;
  // Simple bigram overlap for partial matches (e.g. "react" vs "reactjs")
  const bigramsA = new Set(Array.from({ length: a.length - 1 }, (_, i) => a.slice(i, i + 2)));
  const bigramsB = new Set(Array.from({ length: b.length - 1 }, (_, i) => b.slice(i, i + 2)));
  const intersection = [...bigramsA].filter(bg => bigramsB.has(bg)).length;
  const union = bigramsA.size + bigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Score and sort jobs against the user's verified skill list.
 * Jobs with no listed skills get a neutral 50% score.
 * Returns a new array sorted best-match first.
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

      const scores = jobSkills.map(js =>
        Math.max(...userSkills.map(us => similarity(js, us))) * 100
      );
      const match = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length
      );
      return { ...job, match };
    })
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));
}
