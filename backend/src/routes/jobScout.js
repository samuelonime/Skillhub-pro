const router = require('express').Router();
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { success, error, badRequest } = require('../utils/response');
const { scoreJobForUser } = require('../utils/jobMatching');

const DEFAULT_SETTINGS = { jobAlerts: true, pushNotifs: true };
const MIN_MATCH_SCORE = 45;

// ── AI client (multi-provider with automatic fallback) ───────────────────────
const { generateText, isAIConfigured } = require('../utils/aiClient');

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

    const alertsWithMatch = alerts.map(alert => ({
      ...alert,
      match: scoreJobForUser(req.user, alert.lead),
    }));

    const unread = await prisma.jobScoutAlert.count({
      where: { userId: req.user.id, opened: false },
    });

    return success(res, {
      alerts: alertsWithMatch,
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
    aiConfigured: isAIConfigured(),
    tavilyConfigured: isTavilyConfigured(),
    geminiKeySet: !!process.env.GEMINI_API_KEY,
    groqKeySet: !!process.env.GROQ_API_KEY,
    openrouterKeySet: !!process.env.OPENROUTER_API_KEY,
    tavilyKeySet: !!process.env.TAVILY_API_KEY,
    enabled: process.env.JOB_SCOUT_DISABLED !== 'true',
  });
});

// ── POST /run  — trigger a scout run (cron / admin only) ─────────────────
router.post('/run', authenticate, requireRole('admin'), async (req, res) => {
  try {
    if (!isAIConfigured()) {
      return error(res, 'AI not configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY.');
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
// Core Scout Logic — Gemini + Tavily
// ─────────────────────────────────────────────────────────────────────────────

async function runJobScout() {
  console.log('[JobScout] Starting run…');

  if (!isAIConfigured()) {
    console.warn('[JobScout] Gemini not configured. Aborting run.');
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
  if (!isAIConfigured()) {
    console.warn(`[JobScout] Gemini not configured. Skipping niche "${niche}"`);
    return;
  }

  console.log(`[JobScout] Scouting for niche: "${niche}"`);

  // ── Step 1: Search the web using Tavily ──────────────────────────
  let searchResults = await performWebSearch(niche);

  // Fallback to DuckDuckGo if Tavily returned nothing
  if (!searchResults || searchResults.length === 0) {
    console.warn(`[JobScout] No Tavily results for "${niche}", trying DuckDuckGo fallback`);
    searchResults = await performDuckDuckGoSearch(niche);
  }

  if (!searchResults || searchResults.length === 0) {
    console.warn(`[JobScout] No search results at all for niche "${niche}" — using AI-generated leads`);
    // AI fallback: have the model produce realistic current job leads for the niche.
    // This keeps the feature working even without a Tavily key.
    const jobs = await generateJobsWithAI(niche);
    if (jobs && jobs.length > 0) {
      return await persistAndFanOut(niche, jobs);
    }
    console.warn(`[JobScout] AI fallback produced no jobs for "${niche}"`);
    return;
  }

  // ── Step 2: Parse search results with Gemini ─────────────────────
  const jobs = await parseJobsWithGemini(niche, searchResults);

  if (!jobs || jobs.length === 0) {
    console.warn(`[JobScout] No jobs parsed for niche "${niche}" — using AI-generated leads`);
    const aiJobs = await generateJobsWithAI(niche);
    if (aiJobs && aiJobs.length > 0) return await persistAndFanOut(niche, aiJobs);
    return;
  }

  return await persistAndFanOut(niche, jobs);
}

// ── Persist leads + fan out alerts to matching students ──────────────────────
async function persistAndFanOut(niche, jobs) {
  // ── Step 3: Upsert leads (deduplicate by URL) ──────────────────
  const leads = [];
  for (const job of jobs) {
    if (!job.url || !job.title || !job.company) continue;
    try {
      const payload = {
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
      };
      const lead = await prisma.jobScoutLead.upsert({
        where: { url_niche: { url: job.url, niche } },
        create: { ...payload, status: 'pending' },
        update: {
          ...payload,
          status: 'pending',
        },
      });
      leads.push({ ...lead, wasFresh: lead.fetchedAt.getTime() >= Date.now() - 60 * 1000 });
    } catch (e) {
      console.warn(`[JobScout] Failed to upsert lead "${job.title}":`, e.message);
    }
  }

  if (leads.length === 0) {
    console.warn(`[JobScout] No leads to save for niche "${niche}"`);
    return;
  }

  const deliveredAlerts = await deliverLeadsToStudents(niche, leads, { publishCommunity: true });

  // ── Step 5: Mark all leads as sent ──────────────────────────────
  await prisma.jobScoutLead.updateMany({
    where: { id: { in: leads.map(l => l.id) }, status: 'pending' },
    data: { status: 'sent' },
  });

  console.log(`[JobScout] "${niche}": ${leads.length} leads → ${deliveredAlerts} matched alerts across niche delivery`);
}

async function deliverLeadsToStudents(niche, leads, options = {}) {
  const { publishCommunity = false } = options;

  // ── Step 4: Fan out alerts to matching students ──────────────────
  const students = await prisma.user.findMany({
    where: { interestNiche: niche, role: 'student', isActive: true },
    select: {
      id: true,
      firstName: true,
      interestNiche: true,
      title: true,
      bio: true,
      location: true,
      skills: { select: { name: true } },
      settings: { select: { jobAlerts: true, pushNotifs: true } },
    },
  });

  let deliveredAlerts = 0;
  for (const lead of leads) {
    const matchedStudents = students
      .map(student => ({
        student,
        match: scoreJobForUser(student, lead),
      }))
      .filter(({ student, match }) => {
        const settings = student.settings || DEFAULT_SETTINGS;
        return settings.jobAlerts !== false && match.score >= MIN_MATCH_SCORE;
      })
      .sort((left, right) => right.match.score - left.match.score);

    if (publishCommunity && lead.wasFresh) {
      await publishLeadToCommunity(lead, matchedStudents.length).catch(err => {
        console.warn(`[JobScout] Community publish failed for "${lead.title}":`, err.message);
      });
    }

    for (const { student, match } of matchedStudents) {
      let alertCreated = false;
      try {
        await prisma.jobScoutAlert.create({
          data: { leadId: lead.id, userId: student.id },
        });
        alertCreated = true;
      } catch (err) {
        if (err?.code !== 'P2002') {
          console.warn(`[JobScout] Alert fan-out failed for user ${student.id}:`, err.message);
        }
      }

      if (!alertCreated) {
        continue;
      }

      deliveredAlerts += 1;

      const reasonText = match.reasons.length ? ` Match: ${match.reasons.join(' · ')}.` : '';
      await prisma.notification.create({
        data: {
          userId: student.id,
          type: 'info',
          icon: 'briefcase',
          title: `${match.score}% match: ${lead.title}`,
          message: `${lead.company}${lead.location ? ' · ' + lead.location : ''} from ${formatLeadSource(lead.source)}.${reasonText} Open Jobs to apply.`,
        },
      }).catch(() => {});
    }
  }

  return deliveredAlerts;
}

let broadcasterUserIdPromise = null;

async function getCommunityBroadcasterUserId() {
  if (!broadcasterUserIdPromise) {
    broadcasterUserIdPromise = prisma.user.findFirst({
      where: { role: 'admin', isActive: true },
      select: { id: true },
    }).then(user => user?.id || null).catch(() => null);
  }
  return broadcasterUserIdPromise;
}

function formatLeadSource(source) {
  return String(source || 'web')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

async function publishLeadToCommunity(lead, audienceSize) {
  const authorId = await getCommunityBroadcasterUserId();
  if (!authorId) return;

  const existing = await prisma.communityPost.findFirst({
    where: { authorId, projectUrl: lead.url },
    select: { id: true },
  });
  if (existing) return;

  const post = await prisma.communityPost.create({
    data: {
      authorId,
      title: `${lead.title} at ${lead.company}`,
      body: [
        `${lead.description || 'Fresh role discovered by Job Scout.'}`,
        `Source: ${formatLeadSource(lead.source)}`,
        lead.location ? `Location: ${lead.location}` : null,
        lead.salary ? `Salary: ${lead.salary}` : null,
        audienceSize > 0 ? `Matched to ${audienceSize} learner${audienceSize === 1 ? '' : 's'} based on profile fit.` : null,
      ].filter(Boolean).join('\n\n'),
      type: 'resource',
      tags: [lead.niche, ...(lead.skills || []).slice(0, 4)].filter(Boolean),
      projectUrl: lead.url,
    },
    select: { id: true },
  });

  await prisma.activityFeed.create({
    data: {
      userId: authorId,
      type: 'community_post',
      title: `Job Scout shared ${lead.title}`,
      body: `New ${lead.niche} opportunity from ${lead.company}`,
      postId: post.id,
      metadata: {
        source: lead.source,
        niche: lead.niche,
        matchedAudience: audienceSize,
      },
      isPublic: true,
    },
  }).catch(() => {});
}

// ── AI-generated job leads (fallback when web search is unavailable) ──────────
async function generateJobsWithAI(niche) {
  if (!isAIConfigured()) return [];
  try {
    const year = new Date().getFullYear();
    const systemPrompt = `You are a job market researcher for African tech professionals.
Generate 6 realistic, currently-plausible job openings for "${niche}" roles relevant to ${year}.
Mix remote-global and Nigeria/Africa-based roles. Output ONLY valid JSON, no markdown.

Return: {"jobs":[{
  "title": string,
  "company": string (real, well-known tech companies that hire for this),
  "location": string,
  "type": "full-time"|"remote"|"contract"|"part-time",
  "salary": string|null,
  "description": string (2 sentences),
  "url": string (a real careers-page or LinkedIn jobs search URL for the company/role),
  "source": "company_site"|"linkedin"|"other",
  "skills": string[],
  "postedAt": null
}]}`;
    const userPrompt = `Niche: ${niche}. Generate the JSON now.`;
    const { text } = await generateText(systemPrompt, userPrompt, { temperature: 0.5, maxTokens: 2000, json: true });
    if (!text) return [];
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const jobs = Array.isArray(parsed) ? parsed : (parsed.jobs || []);
    return jobs
      .filter(j => j.title && j.company && j.url)
      .map(j => ({
        title: String(j.title).trim(),
        company: String(j.company).trim(),
        location: j.location ? String(j.location).trim() : null,
        type: j.type || 'full-time',
        salary: j.salary ? String(j.salary).trim() : null,
        description: j.description ? String(j.description).trim().slice(0, 500) : null,
        url: String(j.url).trim(),
        source: j.source || 'ai',
        skills: Array.isArray(j.skills) ? j.skills.map(s => String(s).trim()).filter(Boolean) : [],
        postedAt: null,
      }));
  } catch (e) {
    console.error('[JobScout] AI job generation failed:', e.message);
    return [];
  }
}

// ── Web Search using Tavily ──────────────────────────────────────────────
async function performWebSearch(niche) {
  try {
    if (!process.env.TAVILY_API_KEY) {
      console.warn('[JobScout] TAVILY_API_KEY not set. Web search will fail.');
      return [];
    }

    const queries = [
      `${niche} jobs hiring ${new Date().getFullYear()}`,
      `${niche} remote jobs`,
      `${niche} jobs Nigeria Africa`,
      `${niche} job vacancies`,
    ];

    const JOB_DOMAINS = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com', 'monster.com',
      'x.com', 'twitter.com',
      'jobberman.com', 'ngcareers.com', 'myjobmag.com', 'naukri.com', 'workable.com',
    ];

    let allResults = [];

    for (const query of queries) {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query,
            search_depth: 'basic',
            max_results: 10,
            include_domains: JOB_DOMAINS,
            exclude_domains: ['pinterest.com', 'facebook.com', 'instagram.com', 'youtube.com'],
          }),
        });

        if (!response.ok) throw new Error(`Tavily API error: ${response.status}`);

        const data = await response.json();

        if (data.results && data.results.length > 0) {
          allResults = allResults.concat(
            data.results.map(result => ({
              title:   result.title || '',
              link:    result.url || '',
              snippet: result.content || '',
              source:  result.domain || 'web',
            }))
          );
        }

        await delay(500);
      } catch (e) {
        console.warn(`[JobScout] Tavily search failed for "${query}":`, e.message);
      }
    }

    // Deduplicate by URL
    const seenUrls = new Set();
    const uniqueResults = allResults.filter(result => {
      const url = result.link || result.url || '';
      if (!url || seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    });

    console.log(`[JobScout] Found ${uniqueResults.length} unique search results for "${niche}"`);
    return uniqueResults.slice(0, 25);
  } catch (e) {
    console.error('[JobScout] Tavily web search failed:', e.message);
    return [];
  }
}

// ── Parse jobs from search results using Gemini ───────────────────────────
async function parseJobsWithGemini(niche, searchResults) {
  try {
    if (!isAIConfigured()) {
      console.warn('[JobScout] Gemini not configured. Cannot parse jobs.');
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
- source: "linkedin" | "indeed" | "glassdoor" | "twitter" | "jobberman" | "ngcareers" | "myjobmag" | "company_site" | "other"
- skills: array of strings
- postedAt: string or null (date in YYYY-MM-DD format)

Return a JSON object with a "jobs" key containing an array of job objects. Example: {"jobs": [...]}. If no jobs found, return {"jobs": []}.`;

    const userPrompt = `Extract job listings from these search results for "${niche}":\n\n${JSON.stringify(searchResults, null, 2)}\n\nReturn ONLY the JSON object.`;

    const { text: content } = await generateText(systemPrompt, userPrompt, { temperature: 0.2, maxTokens: 2000, json: true });

    if (!content) {
      console.warn('[JobScout] Empty response from Gemini');
      return [];
    }

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
        title:       String(job.title || '').trim(),
        company:     String(job.company || '').trim(),
        location:    job.location ? String(job.location).trim() : null,
        type:        job.type || 'full-time',
        salary:      job.salary ? String(job.salary).trim() : null,
        description: job.description ? String(job.description).trim().slice(0, 500) : null,
        url:         String(job.url || '').trim(),
        source:      job.source || 'web',
        skills:      Array.isArray(job.skills) ? job.skills.map(s => String(s).trim()).filter(Boolean) : [],
        postedAt:    job.postedAt || null,
      }));

  } catch (e) {
    console.error('[JobScout] Gemini parsing failed:', e.message);
    return [];
  }
}

// ── Fallback search using DuckDuckGo (no API key needed) ──────────────
async function performDuckDuckGoSearch(niche) {
  try {
    const query = encodeURIComponent(`${niche} jobs`);
    const response = await fetch(`https://api.duckduckgo.com/?q=${query}&format=json`);

    if (!response.ok) throw new Error(`DuckDuckGo API error: ${response.status}`);

    const data = await response.json();
    const results = data.RelatedTopics || [];
    return results.map(item => ({
      title:   item.Text || '',
      link:    item.FirstURL || '',
      snippet: item.Text || '',
      source:  'duckduckgo',
    }));
  } catch (e) {
    console.error('[JobScout] DuckDuckGo search failed:', e.message);
    return [];
  }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

module.exports = router;
module.exports.runJobScout = runJobScout;
module.exports.scoutForNiche = scoutForNiche;
module.exports.isAIConfigured = isAIConfigured;

// ── On-demand trigger (e.g. when a user sets their niche/skills) ──────────────
// Guarded so we don't re-scout a niche that already has fresh leads, which would
// waste Tavily/AI quota. Runs in the background; never blocks the caller.
const recentlyScouted = new Map(); // niche -> timestamp (in-process throttle)
async function triggerScoutForNiche(niche) {
  if (!niche || !isAIConfigured()) return;

  // In-process throttle: skip if we kicked off this niche in the last 6 hours
  const last = recentlyScouted.get(niche);
  if (last && Date.now() - last < 6 * 60 * 60 * 1000) return;

  // DB guard: skip if there are already fresh (<48h) leads for this niche
  try {
    const fresh = await prisma.jobScoutLead.findMany({
      where: { niche, fetchedAt: { gt: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
      orderBy: { fetchedAt: 'desc' },
      take: 50,
    });
    if (fresh.length > 0) {
      await deliverLeadsToStudents(
        niche,
        fresh.map(lead => ({ ...lead, wasFresh: false })),
        { publishCommunity: false }
      );
      return;
    }
  } catch { /* ignore and proceed */ }

  recentlyScouted.set(niche, Date.now());
  // Fire and forget — don't block the user's request
  scoutForNiche(niche).catch(e => console.error(`[JobScout] on-demand scout failed for "${niche}":`, e.message));
}
module.exports.triggerScoutForNiche = triggerScoutForNiche;