// routes/resume.js — Resume upload + Portfolio visibility toggle + Career AI
const router  = require('express').Router();
const multer  = require('multer');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadRaw, deleteFile } = require('../utils/cloudinary');
const { logActivity } = require('../utils/activityLogger');
const { success, created, error, badRequest } = require('../utils/response');
const { callCareerAi } = require('../services/careerAiClient');

// ── AI client (multi-provider with automatic fallback) ───────────────────────
const { generateText, isAIConfigured } = require('../utils/aiClient');

// ── Multer config — memory storage, buffer goes straight to Cloudinary ─────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword',
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOC and DOCX files are allowed'));
  },
});

// ── Helper to get or create API key ──────────────────────────────────────────
// Requests a REAL key from the career-ai service — never fabricates one locally,
// since a locally-fabricated string will never match anything in that service's
// ApiKey table and will always fail auth there.
async function getOrCreateApiKey(userId) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { careerAiKey: true }
  });

  if (user?.careerAiKey) return user.careerAiKey;

  const res = await fetch(`${process.env.CAREER_AI_URL}/v1/keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.CAREER_AI_INTERNAL_SECRET,
    },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to generate career-ai key: ${res.status} ${text.slice(0, 200)}`);
  }

  const body = await res.json();
  const newApiKey = body.data.apiKey;

  await prisma.user.update({
    where: { id: userId },
    data: { careerAiKey: newApiKey }
  });

  return newApiKey;
}

// ── POST /api/v1/resume — upload resume ───────────────────────────────────────
router.post('/', authenticate, upload.single('resume'), async (req, res) => {
  if (!req.file) return badRequest(res, 'No file uploaded');

  try {
    const fileUrl = await uploadRaw(req.file.buffer, 'skillhub/resumes', `resume-${req.user.id}`);

    const existing = await prisma.resumeUpload.findUnique({ where: { userId: req.user.id } });

    await prisma.resumeUpload.upsert({
      where:  { userId: req.user.id },
      create: { userId: req.user.id, fileUrl, fileName: req.file.originalname },
      update: { fileUrl, fileName: req.file.originalname, updatedAt: new Date() },
    });

    // Boost profile strength — capped at 100
    await prisma.$executeRaw`
      UPDATE users
      SET    "profileStrength" = LEAST("profileStrength" + 10, 100)
      WHERE  id = ${req.user.id}
    `;

    // Award merit coins (first time only)
    if (!existing) {
      await prisma.user.update({
        where: { id: req.user.id },
        data:  { meritCoins: { increment: 1 } },
      });
      await prisma.notification.create({
        data: {
          userId:  req.user.id,
          type:    'success',
          icon:    'file-pdf',
          title:   'Resume Uploaded!',
          message: 'Your resume is now visible to employers. +1 MeritCoin earned!',
        },
      });
    }

    return created(res, { fileUrl, fileName: req.file.originalname }, 'Resume uploaded successfully');
  } catch (err) {
    console.error('Resume upload error:', err);
    return error(res, 'Failed to save resume');
  }
});

// ── GET /api/v1/resume — get current resume ───────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const resume = await prisma.resumeUpload.findUnique({ where: { userId: req.user.id } });
    return success(res, resume || null);
  } catch (err) {
    return error(res, 'Failed to fetch resume');
  }
});

// ── DELETE /api/v1/resume — delete resume ─────────────────────────────────────
router.delete('/', authenticate, async (req, res) => {
  try {
    const resume = await prisma.resumeUpload.findUnique({ where: { userId: req.user.id } });
    if (!resume) return badRequest(res, 'No resume found');

    await deleteFile(`skillhub/resumes/resume-${req.user.id}`, 'raw');
    await prisma.resumeUpload.delete({ where: { userId: req.user.id } });
    return success(res, null, 'Resume deleted');
  } catch (err) {
    return error(res, 'Failed to delete resume');
  }
});

// ── PUT /api/v1/resume/visibility — toggle portfolio public/private ───────────
router.put('/visibility', authenticate, async (req, res) => {
  const { portfolioPublic } = req.body;
  if (typeof portfolioPublic !== 'boolean') {
    return badRequest(res, 'portfolioPublic must be a boolean');
  }
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { portfolioPublic } });
    return success(res, { portfolioPublic }, `Portfolio is now ${portfolioPublic ? 'public' : 'private'}`);
  } catch (err) {
    return error(res, 'Failed to update visibility');
  }
});

// ── GET /api/v1/resume/visibility — get current visibility ───────────────────
router.get('/visibility', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { portfolioPublic: true },
    });
    return success(res, { portfolioPublic: user?.portfolioPublic ?? false });
  } catch (err) {
    return error(res, 'Failed to get visibility');
  }
});

// ── GET /api/v1/resume/ai — fetch last AI-generated resume ───────────────────
router.get('/ai', authenticate, async (req, res) => {
  try {
    const aiResume = await prisma.aiResume.findUnique({ where: { userId: req.user.id } });
    return success(res, aiResume || null);
  } catch (err) {
    return error(res, 'Failed to fetch AI resume');
  }
});

// ── PUT /api/v1/resume/ai — update saved AI resume content ──────────────────
router.put('/ai', authenticate, async (req, res) => {
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

  if (!content) {
    return badRequest(res, 'Resume content is required');
  }

  try {
    const existing = await prisma.aiResume.findUnique({ where: { userId: req.user.id } });
    if (!existing) return badRequest(res, 'No AI resume found to update');

    const updated = await prisma.aiResume.update({
      where: { userId: req.user.id },
      data: {
        content,
        updatedAt: new Date(),
      },
    });

    return success(res, updated, 'AI resume updated successfully');
  } catch (err) {
    console.error('AI resume update error:', err);
    return error(res, 'Failed to update AI resume');
  }
});

// ── POST /api/v1/resume/generate — Career AI primary, multi-provider fallback ──
router.post('/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Gather all available data for this student in parallel
    const [user, enrollments, certificates, projects, skills, externalCerts, applications] =
      await Promise.all([
        prisma.user.findUnique({
          where:  { id: userId },
          select: {
            firstName: true, lastName: true, email: true, title: true,
            bio: true, location: true, phone: true, interestNiche: true,
            profileStrength: true,
          },
        }),
        prisma.enrollment.findMany({
          where:   { userId },
          select:  { title: true, category: true, progress: true, completedAt: true, source: true },
          orderBy: { enrolledAt: 'desc' },
        }),
        prisma.certificate.findMany({
          where:   { userId },
          select:  { title: true, provider: true, issueDate: true, credentialUrl: true },
          orderBy: { issueDate: 'desc' },
        }),
        prisma.project.findMany({
          where:   { userId },
          select:  { title: true, description: true, technologies: true, liveUrl: true, githubUrl: true, score: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.userSkill.findMany({
          where:   { userId },
          select:  { name: true, level: true, verified: true },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.externalCertificate.findMany({
          where:   { userId },
          select:  { title: true, platform: true, issuer: true, completedAt: true, credentialUrl: true, skills: true },
          orderBy: { completedAt: 'desc' },
        }),
        prisma.application.findMany({
          where:  { userId, status: { in: ['hired', 'interviewing'] } },
          select: { status: true, job: { select: { title: true, company: true } } },
          take: 5,
        }),
      ]);

    const completedCourses  = enrollments.filter(e => e.completedAt || e.progress === 100);
    const inProgressCourses = enrollments.filter(e => !e.completedAt && e.progress < 100 && e.progress > 0);

    const dataPayload = {
      profile: user,
      completedCourses: completedCourses.map(e => ({
        title:    e.title || 'Untitled Course',
        category: e.category,
        source:   e.source === 'meritlives' ? 'Digital Skills (MeritLives)' : 'SkillHub',
      })),
      inProgressCourses: inProgressCourses.map(e => ({
        title:    e.title || 'Untitled Course',
        progress: e.progress,
      })),
      certificates: [
        ...certificates,
        ...externalCerts.map(c => ({
          title:         c.title,
          provider:      `${c.issuer} (${c.platform})`,
          issueDate:     c.completedAt,
          credentialUrl: c.credentialUrl,
        })),
      ],
      projects,
      skills,
      notableJobs: applications.map(a => ({
        status:  a.status,
        title:   a.job?.title,
        company: a.job?.company,
      })),
    };

    let resumeMarkdown;
    let provider;

    // ── Primary: Career AI microservice ─────────────────────────────────────
    try {
      const careerResult = await callCareerAi(userId, '/resume/generate', { role: req.body?.role });
      const payload = careerResult?.data;

      if (!payload?.summary) {
        throw new Error('Career AI returned no resume content');
      }

      resumeMarkdown = [
        `# ${user.firstName} ${user.lastName}`,
        `${[user.email, user.location].filter(Boolean).join(' | ')}`,
        '',
        '## Summary', payload.summary, '',
        payload.skills?.length ? `## Skills\n${payload.skills.join(', ')}\n` : '',
        payload.projects?.length ? `## Projects\n${payload.projects.map(p => `**${p.title}** — ${p.description || ''}`).join('\n\n')}\n` : '',
        payload.certifications?.length ? `## Certifications\n${payload.certifications.map(c => `- ${c.name} (${c.issuer || ''})`).join('\n')}\n` : '',
        payload.achievements?.length ? `## Achievements\n${payload.achievements.map(a => `- ${a}`).join('\n')}\n` : '',
      ].filter(Boolean).join('\n');

      provider = 'career-ai';

      const systemPrompt = `You are a professional resume writer specialising in tech and digital skills candidates.
Given structured data about a student's progress on SkillHub Pro, produce a complete, polished, ATS-friendly resume in Markdown format.

Rules:
- Use clean Markdown with clear sections: Contact, Summary, Skills, Education & Courses, Projects, Certifications, (Experience if data available).
- Write a compelling 2–3 sentence professional summary that reflects their niche (${user.interestNiche || 'technology'}) and trajectory.
- For completed courses, list the top 6 most relevant. Skip in-progress ones in the Courses section — mention them lightly in summary only.
- Skills: group by category (Languages, Frameworks, Tools, Soft Skills). Only include verified skills or those with level intermediate+.
- Projects: include up to 4, highlighting tech stack and live/GitHub links.
- Certifications: list all verified ones with issuer and date.
- Keep it concise — 1–2 pages equivalent. No filler, no clichés like "results-driven".
- Format dates as "Month YYYY". Omit sections with no data.
- Return ONLY the Markdown resume — no preamble, no explanation.`;

      const userPrompt = `Here is the student's SkillHub Pro data:\n\n${JSON.stringify(dataPayload, null, 2)}`;

      const fallbackResult = await generateText(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 4000 });
      resumeMarkdown = fallbackResult.text;
      provider = fallbackResult.provider;
    }

    console.log(`[Resume] Generated via provider: ${provider}`);

    if (!resumeMarkdown) {
      return error(res, 'AI failed to generate resume. Please try again.');
    }

    const dataSummary = {
      completedCourses: completedCourses.length,
      skills:           skills.length,
      projects:         projects.length,
      certificates:     certificates.length + externalCerts.length,
    };

    // Check if this is a first-time generation before upsert
    const existing = await prisma.aiResume.findUnique({ where: { userId } });

    // Persist the generated resume
    await prisma.aiResume.upsert({
      where:  { userId },
      create: { userId, content: resumeMarkdown, dataSummary, generatedAt: new Date() },
      update: { content: resumeMarkdown, dataSummary, generatedAt: new Date(), updatedAt: new Date() },
    });

    // Award merit coins on very first generation
    if (!existing) {
      await prisma.user.update({
        where: { id: userId },
        data:  { meritCoins: { increment: 2 } },
      });
    }

    // Log to activity feed
    await logActivity({
      userId,
      type:     'resume_generated',
      title:    'Generated an AI-powered resume',
      metadata: { ...dataSummary, provider },
    });

    return success(res, {
      resume: resumeMarkdown,
      provider,
      generatedAt: new Date(),
      dataSummary,
    }, 'Resume generated successfully ✨');
  } catch (err) {
    console.error('AI resume generation error:', err);
    return error(res, 'Failed to generate resume. Please try again.');
  }
});

// ── POST /api/v1/resume/export — Export resume as PDF ────────────────────
router.post('/export', authenticate, async (req, res) => {
  try {
    const apiKey = await getOrCreateApiKey(req.user.id);

    const pdfRes = await fetch(`${process.env.CAREER_AI_URL}/v1/resume/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        userId: req.user.id,
        format: 'pdf'
      }),
    });

    if (!pdfRes.ok) {
      throw new Error(`Export failed with status: ${pdfRes.status}`);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');

    // Stream the PDF straight through
    pdfRes.body.pipe(res);
  } catch (err) {
    console.error('Resume export error:', err);
    return error(res, 'Failed to export resume');
  }
});

// ── GET /api/v1/resume/career/status — Check career AI status ────────────
router.get('/career/status', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { careerAiKey: true }
    });

    return success(res, {
      hasApiKey: !!user?.careerAiKey,
      apiKey: user?.careerAiKey || null
    });
  } catch (err) {
    return error(res, 'Failed to get career AI status');
  }
});

// ── POST /api/v1/resume/career/key — Generate new career AI API key ──────
// Requests a REAL key from the career-ai service — never fabricates one locally.
router.post('/career/key', authenticate, async (req, res) => {
  try {
    const apiRes = await fetch(`${process.env.CAREER_AI_URL}/v1/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.CAREER_AI_INTERNAL_SECRET,
      },
      body: JSON.stringify({ userId: req.user.id }),
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error('career-ai key generation failed:', apiRes.status, text.slice(0, 200));
      return error(res, 'Failed to generate API key');
    }

    const body = await apiRes.json();
    const newApiKey = body.data.apiKey;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { careerAiKey: newApiKey }
    });

    return success(res, { apiKey: newApiKey }, 'New API key generated successfully');
  } catch (err) {
    console.error('career/key route error:', err);
    return error(res, 'Failed to generate API key');
  }
});

// ── Multer error handler ──────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return badRequest(res, 'File too large. Maximum size is 5MB.');
    return badRequest(res, err.message);
  }
  if (err) return badRequest(res, err.message);
  next();
});

module.exports = router;