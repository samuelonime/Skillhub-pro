// SkillHub — Digital Skills (Meritlives) live course client.
//
// This is the ONLY place SkillHub talks to Digital Skills for course data.
// Nothing here ever gets written into SkillHub's own database — course rows
// are fetched live on every relevant request and held in a short in-memory
// cache purely to absorb traffic spikes (e.g. a dashboard re-rendering
// twice in quick succession), not to act as a second source of truth.
//
// If MERITLIVES_BASE_URL or MERITLIVES_API_KEY are not configured, every
// function here resolves to an empty/null result instead of throwing, so
// the rest of the app degrades gracefully rather than crashing.

const BASE_URL = (process.env.MERITLIVES_BASE_URL || '').replace(/\/+$/, '');
const API_KEY  = process.env.MERITLIVES_API_KEY || '';
const CACHE_TTL_MS = parseInt(process.env.MERITLIVES_CACHE_TTL_MS || '60000', 10); // 60s default

const cache = new Map(); // key -> { data, expiresAt }

function isConfigured() {
  return Boolean(BASE_URL && API_KEY);
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Drop the cache for a specific key, or everything if no key is given. */
function invalidate(key) {
  if (key) cache.delete(key);
  else cache.clear();
}

async function request(path) {
  const url = `${BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      headers: { 'X-API-Key': API_KEY, Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Meritlives API responded ${res.status} for ${path}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Normalizes a Meritlives course payload into the shape SkillHub's
 * frontend already expects from its own `courses` route, so callers don't
 * need to special-case the source.
 */
function normalize(course) {
  return {
    id: course.id,
    source: 'meritlives',
    slug: course.slug,
    title: course.title,
    provider: 'Meritlives',
    category: course.category,
    level: course.level,
    duration: course.durationMinutes ? `${Math.round(course.durationMinutes / 60)}h` : null,
    rating: course.rating ?? 0,
    enrollCount: course.enrollCount ?? 0,
    price: course.price ?? 0,
    thumbnail: course.thumbnail,
    description: course.description,
    isPremium: (course.price ?? 0) > 0,
    instructor: course.instructor,
    lessonCount: course.lessonCount,
    url: course.url,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

/**
 * Fetch all published Meritlives courses (optionally filtered), normalized
 * to SkillHub's course shape. Returns [] if not configured or on error —
 * callers should treat Meritlives as an optional enrichment, not a
 * hard dependency for pages that also show local courses.
 */
async function listCourses({ category, level, search, perPage = 50 } = {}) {
  if (!isConfigured()) return [];

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (level) params.set('level', level);
  if (search) params.set('search', search);
  if (perPage) params.set('per_page', String(perPage));

  const cacheKey = `list:${params.toString()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const json = await request(`/api/v1/courses?${params.toString()}`);
    const courses = (json?.data ?? []).map(normalize);
    setCached(cacheKey, courses);
    return courses;
  } catch (err) {
    console.error('[meritlives] listCourses failed:', err.message);
    return getCached(cacheKey) ?? [];
  }
}

/**
 * Fetch a single Meritlives course by its Digital Skills id.
 * Returns null if not found, not configured, or on error.
 */
async function getCourse(id) {
  if (!isConfigured() || !id) return null;

  const cacheKey = `course:${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const json = await request(`/api/v1/courses/${encodeURIComponent(id)}`);
    const course = json?.data ? normalize(json.data) : null;
    if (course) setCached(cacheKey, course);
    return course;
  } catch (err) {
    console.error('[meritlives] getCourse failed:', err.message);
    return getCached(cacheKey) ?? null;
  }
}

module.exports = { isConfigured, listCourses, getCourse, invalidate };