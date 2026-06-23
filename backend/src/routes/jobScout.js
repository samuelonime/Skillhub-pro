const router = require('express').Router();
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { success, error, badRequest } = require('../utils/response');

// ── DeepSeek Configuration ──────────────────────────────────────────────────
const OpenAI = require('openai');

// Check if API key exists
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
  console.warn('[JobScout] ⚠️ DEEPSEEK_API_KEY is not set. Job Scout will be disabled.');
}

const deepseek = new OpenAI({
  apiKey: DEEPSEEK_API_KEY || 'missing-api-key',
  baseURL: 'https://api.deepseek.com/v1',
});

function isDeepSeekConfigured() {
  return !!DEEPSEEK_API_KEY;
}

function isTavilyConfigured() {
  return !!process.env.TAVILY_API_KEY;
}

// ── GET /my-alerts  — student's personalised job alerts ───────────────────
router.get('/my-alerts', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await prisma.$transaction([
      prisma.jobScoutAlert.findMany({
        where: { userId: req.user.id },
        orderBy: { sentAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          lead: {
            select: {
              id: true, title: true, company: true, location: true,
              type: true, salary: true, description: true, url: true,
              source: true, niche: true, skills: true, postedAt: true, fetchedAt: true,
            },
          },
        },
      }),
      prisma.jobScoutAlert.count({ where: { userId: req.user.id } }),
    ]);

    const unread = await prisma.jobScoutAlert.count({
      where: { userId: req.user.id, opened: false },
    });

    return success(res, {
      alerts,
      total,
      unread,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to fetch job alerts');
  }
});

// ── POST /alerts/:id/open ─────────────────────────────────────────────────
router.post('/alerts/:id/open', authenticate, async (req, res) => {
  try {
    await prisma.jobScoutAlert.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { opened: true },
    });
    return success(res, null, 'Marked as opened');
  } catch (e) {
    return error(res, 'Failed to update alert');
  }
});

// ── POST /alerts/:id/applied ──────────────────────────────────────────────
router.post('/alerts/:id/applied', authenticate, async (req, res) => {
  try {
    await prisma.jobScoutAlert.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { applied: true, opened: true },
    });
    return success(res, null, 'Marked as applied');
  } catch (e) {
    return error(res, 'Failed to update alert');
  }
});

// ── GET /niches  — list all registered niches (admin) ────────────────────
router.get('/niches', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const niches = await prisma.user.groupBy({
      by: ['interestNiche'],
      where: { interestNiche: { not: null }, role: 'student' },
      _count: { interestNiche: true },
      orderBy: { _count: { interestNiche: 'desc' } },
    });
    return success(res, niches.map(n => ({ niche: n.interestNiche, students: n._count.interestNiche })));
  } catch (e) {
    return error(res, 'Failed to fetch niches');
  }
});

// ── GET /status ────────────────────────────────────────────────────────────
router.get('/status', authenticate, requireRole('admin'), async (req, res) => {
  return success(res, {
    deepseekConfigured: isDeepSeekConfigured(),
    tavilyConfigured: isTavilyConfigured(),
    deepseekKeySet: !!process.env.DEEPSEEK_API_KEY,
    tavilyKeySet: !!process.env.TAVILY_API_KEY,
    enabled: process.env.JOB_SCOUT_DISABLED !== 'true',
  });
});

// ── POST /run  — trigger a scout run (cron / admin only) ─────────────────
router.post('/run', authenticate, requireRole('admin'), async (req, res) => {
  try {
    // Check if configured
    if (!isDeepSeekConfigured()) {
      return error(res, 'DeepSeek API key not configured. Please set DEEPSEEK_API_KEY.');
    }
    if (!isTavilyConfigured()) {
      return error(res, 'Tavily API key not configured. Please set TAVILY_API_KEY.');
    }

    // Start async; respond immediately so cron doesn't time out
    res.json({ success: true, message: 'Job Scout run started' });
    runJobScout().catch(e => console.error('[JobScout] Fatal error:', e));
  } catch (e) {
    return error(res, 'Failed to start scout run');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Core Scout Logic — DeepSeek + Tavily
// ─────────────────────────────────────────────────────────────────────────────

async function runJobScout() {
  console.log('[JobScout] Starting run…');

  // Check if configured
  if (!isDeepSeekConfigured()) {
    console.warn('[JobScout] DeepSeek not configured. Aborting run.');
    return;
  }
  if (!isTavilyConfigured()) {
    console.warn('[JobScout] Tavily not configured. Aborting run.');
    return;
  }

  // 1. Get all distinct niches with at least one active student
  const nicheRows = await prisma.user.groupBy({
    by: ['interestNiche'],
    where: { interestNiche: { not: null }, role: 'student', isActive: true },
  });

  const niches = nicheRows.map(r => r.interestNiche).filter(Boolean);
  console.log(`[JobScout] Scanning ${niches.length} niches:`, niches);

  for (const niche of niches) {
    try {
      await scoutForNiche(niche);
      await delay(3000); // Avoid hammering the API
    } catch (e) {
      console.error(`[JobScout] Error for niche "${niche}":`, e.message);
    }
  }

  // 2. Expire leads older than 7 days
  await prisma.jobScoutLead.updateMany({
    where: { fetchedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, status: 'sent' },
    data: { status: 'expired' },
  });

  console.log('[JobScout] Run complete.');
}

async function scoutForNiche(niche) {
  if (!isDeepSeekConfigured()) {
    console.warn(`[JobScout] DeepSeek not configured. Skipping niche "${niche}"`);
    return;
  }

  console.log(`[JobScout] Scouting for niche: "${niche}"`);

  // ── Step 1: Search the web using Tavily ──────────────────────────
  const searchResults = await performWebSearch(niche);

  if (!searchResults || searchResults.length === 0) {
    console.warn(`[JobScout] No search results for niche "${niche}"`);
    return;
  }

  // ── Step 2: Parse search results with DeepSeek ──────────────────
  const jobs = await parseJobsWithDeepSeek(niche, searchResults);

  if (!jobs || jobs.length === 0) {
    console.warn(`[JobScout] No jobs parsed for niche "${niche}"`);
    return;
  }

  // ── Step 3: Upsert leads (deduplicate by URL) ──────────────────
  const leads = [];
  for (const job of jobs) {
    if (!job.url || !job.title || !job.company) continue;
    try {
      const lead = await prisma.jobScoutLead.upsert({
        where: { url_niche: { url: job.url, niche } },
        create: {
          title: job.title,
          company: job.company,
          location: job.location || null,
          type: job.type || null,
          salary: job.salary || null,
          description: job.description || null,
          url: job.url,
          source: job.source || 'web',
          niche,
          skills: Array.isArray(job.skills) ? job.skills : [],
          postedAt: job.postedAt ? new Date(job.postedAt) : null,
          status: 'pending',
        },
        update: {
          status: 'pending',
        },
      });
      leads.push(lead);
    } catch (e) {
      console.warn(`[JobScout] Failed to upsert lead "${job.title}":`, e.message);
    }
  }

  if (leads.length === 0) {
    console.warn(`[JobScout] No leads to save for niche "${niche}"`);
    return;
  }

  // ── Step 4: Fan out alerts to matching students ──────────────────
  const students = await prisma.user.findMany({
    where: { interestNiche: niche, role: 'student', isActive: true },
    select: { id: true },
  });

  for (const lead of leads) {
    for (const student of students) {
      try {
        await prisma.jobScoutAlert.upsert({
          where: { leadId_userId: { leadId: lead.id, userId: student.id } },
          create: { leadId: lead.id, userId: student.id },
          update: {},
        });

        // In-app notification
        await prisma.notification.create({
          data: {
            userId: student.id,
            type: 'info',
            icon: 'briefcase',
            title: `New ${niche} Job Alert 🔍`,
            message: `${lead.title} at ${lead.company}${lead.location ? ' · ' + lead.location : ''} — check your Job Scout feed!`,
          },
        }).catch(() => { });
      } catch (e) {
        // Likely duplicate — ignore
      }
    }
  }

  // ── Step 5: Mark all leads as sent ──────────────────────────────
  await prisma.jobScoutLead.updateMany({
    where: { id: { in: leads.map(l => l.id) }, status: 'pending' },
    data: { status: 'sent' },
  });

  console.log(`[JobScout] "${niche}": ${leads.length} leads → ${students.length} students`);
}

// ── Web Search using Tavily ──────────────────────────────────────────────
async function performWebSearch(niche) {
  try {
    // Check if Tavily API key exists
    if (!process.env.TAVILY_API_KEY) {
      console.warn('[JobScout] TAVILY_API_KEY not set. Web search will fail.');
      return [];
    }

    // Try multiple search queries for better coverage
    const queries = [
      `${niche} jobs hiring`,
      `${niche} career opportunities`,
      `remote ${niche} jobs`,
      `${niche} job listings`,
      `${niche} employment`,
    ];

    let allResults = [];

    for (const query of queries) {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: query,
            search_depth: 'basic', // or 'advanced' for more results
            max_results: 10,
            include_domains: ['linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com', 'monster.com'],
            exclude_domains: ['pinterest.com', 'facebook.com', 'instagram.com', 'youtube.com'],
          }),
        });

        if (!response.ok) {
          throw new Error(`Tavily API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
          allResults = allResults.concat(
            data.results.map((result) => ({
              title: result.title || '',
              link: result.url || '',
              snippet: result.content || '',
              source: result.domain || 'web',
            }))
          );
        }

        // Small delay between queries
        await delay(500);
      } catch (e) {
        console.warn(`[JobScout] Tavily search failed for "${query}":`, e.message);
      }
    }

    // Deduplicate results by URL
    const seenUrls = new Set();
    const uniqueResults = allResults.filter(result => {
      const url = result.link || result.url || '';
      if (!url || seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    });

    console.log(`[JobScout] Found ${uniqueResults.length} unique search results for "${niche}"`);
    return uniqueResults.slice(0, 25); // Limit to 25 results
  } catch (e) {
    console.error('[JobScout] Tavily web search failed:', e.message);
    return [];
  }
}

// ── Parse jobs from search results using DeepSeek ──────────────────────
async function parseJobsWithDeepSeek(niche, searchResults) {
  try {
    if (!isDeepSeekConfigured()) {
      console.warn('[JobScout] DeepSeek not configured. Cannot parse jobs.');
      return [];
    }

    const systemPrompt = `You are a job extraction AI. Extract job listings from search results for "${niche}" positions.
You must output ONLY valid JSON. No markdown, no explanation, no preamble.

Each job must have these fields:
- title: string (job title)
- company: string (company name)
- location: string or null (city/country or "Remote")
- type: "full-time" | "part-time" | "remote" | "contract" | "internship"
- salary: string or null (if visible)
- description: string (2-3 sentence summary)
- url: string (direct application link)
- source: "linkedin" | "indeed" | "glassdoor" | "twitter" | "company_site" | "other"
- skills: array of strings
- postedAt: string or null (date in YYYY-MM-DD format)

Return a JSON array of job objects. If you can't find jobs, return an empty array.`;

    const userPrompt = `Extract job listings from these search results for "${niche}":

${JSON.stringify(searchResults, null, 2)}

Return ONLY the JSON array.`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;

    if (!content) {
      console.warn('[JobScout] Empty response from DeepSeek');
      return [];
    }

    // Clean and parse JSON
    const clean = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Handle both array and object responses
    let jobs = [];
    if (Array.isArray(parsed)) {
      jobs = parsed;
    } else if (parsed.jobs && Array.isArray(parsed.jobs)) {
      jobs = parsed.jobs;
    } else if (parsed.results && Array.isArray(parsed.results)) {
      jobs = parsed.results;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      jobs = parsed.data;
    } else {
      // Try to extract any array from the parsed object
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
          jobs = parsed[key];
          break;
        }
      }
    }

    // Validate and clean each job
    return jobs
      .filter(job => job.title && job.company && job.url)
      .map(job => ({
        title: String(job.title || '').trim(),
        company: String(job.company || '').trim(),
        location: job.location ? String(job.location).trim() : null,
        type: job.type || 'full-time',
        salary: job.salary ? String(job.salary).trim() : null,
        description: job.description ? String(job.description).trim().slice(0, 500) : null,
        url: String(job.url || '').trim(),
        source: job.source || 'web',
        skills: Array.isArray(job.skills) ? job.skills.map(s => String(s).trim()).filter(Boolean) : [],
        postedAt: job.postedAt || null,
      }));

  } catch (e) {
    console.error('[JobScout] DeepSeek parsing failed:', e.message);
    return [];
  }
}

// ── Fallback search using DuckDuckGo (no API key needed) ──────────────
async function performDuckDuckGoSearch(niche) {
  try {
    const query = encodeURIComponent(`${niche} jobs`);
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${query}&format=json`
    );

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data = await response.json();
    // DuckDuckGo returns related topics
    const results = data.RelatedTopics || [];
    return results.map(item => ({
      title: item.Text || '',
      link: item.FirstURL || '',
      snippet: item.Text || '',
      source: 'duckduckgo',
    }));
  } catch (e) {
    console.error('[JobScout] DuckDuckGo search failed:', e.message);
    return [];
  }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

module.exports = router;
module.exports.runJobScout = runJobScout;
module.exports.isDeepSeekConfigured = isDeepSeekConfigured;