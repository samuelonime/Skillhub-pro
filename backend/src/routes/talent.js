// routes/talent.js — Talent Pool / Candidate Search for Employers
const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { success, error, notFound } = require('../utils/response');

// ── GET /api/v1/talent — search candidates ────────────────────────────────────
router.get('/', authenticate, requireRole('employer', 'admin'), async (req, res) => {
  const {
    skills, level, location, certified, available,
    minCoins, page = 1, limit = 20,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Build filter
    const where = {
      role: 'student',
      isActive: true,
      portfolioPublic: true,
    };

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (minCoins) {
      where.meritCoins = { gte: parseInt(minCoins) };
    }

    // Skills filter — match against userSkills relation
    const skillsFilter = skills
      ? skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...where,
          ...(skillsFilter.length ? {
            skills: {
              some: {
                name: { in: skillsFilter, mode: 'insensitive' },
              },
            },
          } : {}),
          ...(certified === 'true' ? {
            certificates: { some: { status: 'verified' } },
          } : {}),
        },
        select: {
          id:              true,
          firstName:       true,
          lastName:        true,
          avatar:          true,
          bio:             true,
          location:        true,
          profileStrength: true,
          meritCoins:      true,
          createdAt:       true,
          skills: {
            select: { id: true, name: true, level: true, verified: true },
            orderBy: { verified: 'desc' },
            take: 8,
          },
          certificates: {
            where:   { status: 'verified' },
            select:  { id: true, title: true, provider: true, issuedAt: true },
            orderBy: { issuedAt: 'desc' },
            take: 4,
          },
          projects: {
            where:  { visibility: 'public' },
            select: { id: true, title: true, description: true, techStack: true, liveUrl: true, githubUrl: true },
            take: 3,
          },
          resume: {
            select: { fileUrl: true, updatedAt: true },
          },
          _count: {
            select: { certificates: true, projects: true, skills: true },
          },
        },
        orderBy: [
          { profileStrength: 'desc' },
          { meritCoins:      'desc' },
        ],
        skip,
        take: parseInt(limit),
      }),

      prisma.user.count({
        where: {
          ...where,
          ...(skillsFilter.length ? {
            skills: { some: { name: { in: skillsFilter, mode: 'insensitive' } } },
          } : {}),
          ...(certified === 'true' ? {
            certificates: { some: { status: 'verified' } },
          } : {}),
        },
      }),
    ]);

    // Compute match score for each candidate
    const results = users.map(u => {
      let matchScore = 0;

      // Skill match
      if (skillsFilter.length) {
        const candidateSkills = u.skills.map(s => s.name.toLowerCase());
        const matched = skillsFilter.filter(s => candidateSkills.includes(s.toLowerCase()));
        matchScore += Math.round((matched.length / skillsFilter.length) * 60);
      } else {
        matchScore += 40; // base score when no skill filter
      }

      // Profile strength bonus
      matchScore += Math.round((u.profileStrength || 0) * 0.2);

      // Verified certs bonus
      matchScore += Math.min(u.certificates.length * 5, 20);

      matchScore = Math.min(matchScore, 100);

      return {
        ...u,
        fullName:    `${u.firstName} ${u.lastName}`,
        matchScore,
        certCount:   u._count.certificates,
        projectCount:u._count.projects,
        skillCount:  u._count.skills,
        _count:      undefined,
      };
    });

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);

    return success(res, {
      candidates: results,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to search talent pool');
  }
});

// ── GET /api/v1/talent/:id — full candidate profile ───────────────────────────
router.get('/:id', authenticate, requireRole('employer', 'admin'), async (req, res) => {
  try {
    const candidate = await prisma.user.findUnique({
      where: { id: req.params.id, role: 'student', portfolioPublic: true },
      select: {
        id:              true,
        firstName:       true,
        lastName:        true,
        avatar:          true,
        bio:             true,
        location:        true,
        profileStrength: true,
        meritCoins:      true,
        createdAt:       true,
        skills: {
          select:  { id: true, name: true, level: true, verified: true },
          orderBy: { verified: 'desc' },
        },
        certificates: {
          where:   { status: 'verified' },
          select:  { id: true, title: true, provider: true, issuedAt: true, credentialUrl: true },
          orderBy: { issuedAt: 'desc' },
        },
        projects: {
          where:  { visibility: 'public' },
          select: { id: true, title: true, description: true, techStack: true, liveUrl: true, githubUrl: true, thumbnail: true },
        },
        enrolledPaths: {
          where:  { completedAt: { not: null } },
          select: { path: { select: { title: true, category: true } }, completedAt: true },
        },
        resume: { select: { fileUrl: true, fileName: true, updatedAt: true } },
        _count: {
          select: { certificates: true, projects: true, skills: true },
        },
      },
    });

    if (!candidate) return notFound(res, 'Candidate not found');

    return success(res, {
      ...candidate,
      fullName: `${candidate.firstName} ${candidate.lastName}`,
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to load candidate profile');
  }
});

// ── POST /api/v1/talent/:id/shortlist — save a candidate ─────────────────────
router.post('/:id/shortlist', authenticate, requireRole('employer', 'admin'), async (req, res) => {
  try {
    const { jobId, note } = req.body;

    const existing = await prisma.shortlistedCandidate.findUnique({
      where: {
        employerId_candidateId_jobId: {
          employerId:  req.user.id,
          candidateId: req.params.id,
          jobId:       jobId || '',
        },
      },
    });

    if (existing) {
      // Toggle off
      await prisma.shortlistedCandidate.delete({ where: { id: existing.id } });
      return success(res, { shortlisted: false }, 'Removed from shortlist');
    }

    await prisma.shortlistedCandidate.create({
      data: {
        employerId:  req.user.id,
        candidateId: req.params.id,
        jobId:       jobId || null,
        note:        note  || null,
      },
    });

    return success(res, { shortlisted: true }, 'Added to shortlist');
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to update shortlist');
  }
});

// ── GET /api/v1/talent/shortlisted — employer's shortlisted candidates ────────
router.get('/my/shortlisted', authenticate, requireRole('employer', 'admin'), async (req, res) => {
  try {
    const list = await prisma.shortlistedCandidate.findMany({
      where: { employerId: req.user.id },
      include: {
        candidate: {
          select: {
            id: true, firstName: true, lastName: true, avatar: true,
            bio: true, location: true, profileStrength: true,
            skills: { select: { name: true, level: true, verified: true }, take: 5 },
            certificates: { where: { status: 'verified' }, select: { title: true }, take: 3 },
            resume: { select: { fileUrl: true } },
          },
        },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, list.map(s => ({
      shortlistId:  s.id,
      note:         s.note,
      shortlistedAt:s.createdAt,
      job:          s.job,
      ...s.candidate,
      fullName: `${s.candidate.firstName} ${s.candidate.lastName}`,
    })));
  } catch (err) {
    return error(res, 'Failed to load shortlist');
  }
});

module.exports = router;