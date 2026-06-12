// routes/ghostRecruiter.js — Ghost recruiter: AI application co-pilot
// Generates a tailored application packet for a specific job by:
//   1. Reordering user skills to match what the job description weights
//   2. Surfacing the most relevant portfolio projects
//   3. Writing a personalised cover letter using real user metrics
// All derived from existing data: resume, portfolio, skills, job description.
const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, error, notFound } = require('../utils/response');

// ── Helpers ───────────────────────────────────────────────────────────────────

// Score a skill against a job's required skills and description
function skillRelevanceScore(skillName: string, jobSkills: string[], jobDescription: string): number {
  const name = skillName.toLowerCase();
  const desc = (jobDescription || '').toLowerCase();
  const required = jobSkills.map(s => s.toLowerCase());

  let score = 0;
  if (required.includes(name))              score += 50; // exact match in skills list
  if (desc.includes(name))                  score += 30; // mentioned in description
  // Partial matches: e.g. "postgres" matches "postgresql"
  required.forEach(r => {
    if (r.includes(name) || name.includes(r)) score += 15;
  });
  return score;
}

// Score a portfolio project against a job
function projectRelevanceScore(project: any, jobSkills: string[], jobDescription: string): number {
  let score = 0;
  const desc = (jobDescription || '').toLowerCase();
  const required = jobSkills.map(s => s.toLowerCase());
  const projectText = `${project.title} ${project.description || ''}`.toLowerCase();

  required.forEach(skill => {
    if (projectText.includes(skill)) score += 20;
  });
  if (desc && projectText.split(' ').some((w: string) => desc.includes(w) && w.length > 5)) {
    score += 10;
  }
  return score;
}

// Generate cover letter paragraphs from structured data
function generateCoverLetter(params: {
  userName:         string;
  userTitle:        string;
  jobTitle:         string;
  company:          string;
  topSkills:        string[];
  topProject:       any | null;
  matchPercentage:  number;
}): string {
  const { userName, userTitle, jobTitle, company, topSkills, topProject, matchPercentage } = params;
  const firstName = userName.split(' ')[0];

  const opening = `${company}'s work in this space aligns closely with the problems I've been solving as a ${userTitle}. ` +
    `With a skill match of ${matchPercentage}% against your requirements, I'm confident I can contribute from day one.`;

  const skillPara = topSkills.length
    ? `My strongest relevant skills for this ${jobTitle} role are ${topSkills.slice(0, 3).join(', ')}. ` +
      `Each is backed by verified credentials and active project work on my SkillHub portfolio.`
    : '';

  const projectPara = topProject
    ? `Most recently, I built "${topProject.title}"${topProject.liveUrl ? ` (${topProject.liveUrl})` : ''} — ` +
      `${topProject.description ? topProject.description.slice(0, 120) + '…' : 'a project that directly demonstrates my capabilities for this role.'}`
    : '';

  const closing = `I'd welcome the opportunity to discuss how my background fits ${company}'s goals. ` +
    `My full portfolio and verified skill records are available on my SkillHub profile.\n\n— ${firstName}`;

  return [opening, skillPara, projectPara, closing].filter(Boolean).join('\n\n');
}

// ── GET /api/v1/ghost-recruiter/:jobId — generate application packet ──────────
router.get('/:jobId', authenticate, async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where:  { id: req.params.jobId },
      select: { id: true, title: true, company: true, skills: true, description: true },
    });
    if (!job) return notFound(res, 'Job not found');

    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        firstName: true,
        lastName:  true,
        title:     true,
        bio:       true,
        skills:    { select: { name: true, level: true, verified: true } },
        projects:  {
          select: { id: true, title: true, description: true, liveUrl: true, techStack: true, imageUrl: true },
          orderBy: { createdAt: 'desc' },
          take:    20,
        },
        certificates: {
          where:  { status: 'verified' },
          select: { title: true, provider: true },
        },
      },
    });
    if (!user) return notFound(res, 'User not found');

    const jobSkills = (job.skills || []);

    // 1. Reorder skills by relevance to this job
    const rankedSkills = user.skills
      .map(s => ({
        ...s,
        relevance: skillRelevanceScore(s.name, jobSkills, job.description || ''),
      }))
      .sort((a, b) => b.relevance - a.relevance);

    // 2. Rank portfolio projects
    const rankedProjects = user.projects
      .map(p => ({
        ...p,
        relevance: projectRelevanceScore(p, jobSkills, job.description || ''),
      }))
      .sort((a, b) => b.relevance - a.relevance);

    // 3. Compute match percentage
    const userSkillNames   = user.skills.map(s => s.name.toLowerCase());
    const matched          = jobSkills.filter(s => userSkillNames.includes(s.toLowerCase())).length;
    const matchPercentage  = jobSkills.length > 0
      ? Math.round((matched / jobSkills.length) * 100)
      : 0;

    // 4. Generate cover letter
    const coverLetter = generateCoverLetter({
      userName:        `${user.firstName} ${user.lastName}`,
      userTitle:       user.title || 'Professional',
      jobTitle:        job.title,
      company:         job.company,
      topSkills:       rankedSkills.filter(s => s.relevance > 0).slice(0, 3).map(s => s.name),
      topProject:      rankedProjects[0] || null,
      matchPercentage,
    });

    // 5. Skills reorder diff — what changed from default order
    const defaultOrder  = user.skills.map(s => s.name);
    const reorderedNames = rankedSkills.map(s => s.name);
    const reorderChanges = reorderedNames
      .slice(0, 6)
      .map((name, newIdx) => {
        const oldIdx = defaultOrder.indexOf(name);
        return { name, oldRank: oldIdx + 1, newRank: newIdx + 1, moved: oldIdx - newIdx };
      });

    return success(res, {
      job: { id: job.id, title: job.title, company: job.company },
      matchPercentage,
      coverLetter,
      skills: {
        reordered:      rankedSkills.slice(0, 10),
        reorderChanges: reorderChanges.filter(c => c.moved !== 0),
      },
      projects: {
        recommended: rankedProjects.slice(0, 3),
      },
      certificates: user.certificates.filter(cert =>
        jobSkills.some(s => cert.title.toLowerCase().includes(s.toLowerCase()))
      ).slice(0, 3),
    });
  } catch (err) {
    console.error('[ghost-recruiter]', err);
    return error(res, 'Failed to generate application packet');
  }
});

// ── POST /api/v1/ghost-recruiter/:jobId/apply — one-click apply with packet ───
router.post('/:jobId/apply', authenticate, async (req, res) => {
  try {
    const { coverLetter } = req.body;

    // Check for existing application
    const existing = await prisma.application.findUnique({
      where: { userId_jobId: { userId: req.user.id, jobId: req.params.jobId } },
    });
    if (existing) return error(res, 'Already applied to this job', 409);

    const application = await prisma.application.create({
      data: {
        userId:      req.user.id,
        jobId:       req.params.jobId,
        coverLetter: coverLetter || '',
        status:      'applied',
      },
    });

    // Award merit coins for applying
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { meritCoins: { increment: 10 } },
    });

    await prisma.notification.create({
      data: {
        userId:  req.user.id,
        type:    'success',
        icon:    'paper-plane',
        title:   'Application submitted',
        message: 'Your AI-optimised application was submitted. You earned 10 Merit Coins.',
        read:    false,
      },
    }).catch(() => {});

    return success(res, { applicationId: application.id, status: 'applied' }, 201);
  } catch (err) {
    console.error('[ghost-recruiter/apply]', err);
    return error(res, 'Failed to submit application');
  }
});

module.exports = router;
