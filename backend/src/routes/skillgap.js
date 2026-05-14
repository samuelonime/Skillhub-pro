// routes/skillgap.js — Skill Gap Analysis after job application
const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, error, notFound } = require('../utils/response');

// ── GET /api/v1/skill-gap/:jobId — analyse gap for a specific job ─────────────
router.get('/:jobId', authenticate, async (req, res) => {
  try {
    // Get the job with required skills
    const job = await prisma.job.findUnique({
      where:  { id: req.params.jobId },
      select: { id: true, title: true, company: true, skillsRequired: true, experienceLevel: true, description: true },
    });
    if (!job) return notFound(res, 'Job not found');

    // Get user's current skills and certificates
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        skills: {
          select: { name: true, level: true, verified: true },
        },
        certificates: {
          where:  { status: 'verified' },
          select: { title: true, provider: true },
        },
        enrolledPaths: {
          where:  { completedAt: { not: null } },
          select: { path: { select: { title: true, category: true, tags: true } } },
        },
      },
    });

    if (!user) return notFound(res, 'User not found');

    // Parse required skills from job (stored as comma-separated string)
    const requiredSkills = (job.skillsRequired || '')
      .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    const userSkillNames = user.skills.map(s => s.name.toLowerCase());
    const certTitles     = user.certificates.map(c => c.title.toLowerCase());
    const pathTags       = user.enrolledPaths.flatMap(e => e.path.tags.map(t => t.toLowerCase()));

    // Analyse each required skill
    const analysis = requiredSkills.map(skill => {
      const hasSkill    = userSkillNames.includes(skill);
      const hasCert     = certTitles.some(c => c.includes(skill));
      const hasPath     = pathTags.some(t => t.includes(skill));
      const userSkill   = user.skills.find(s => s.name.toLowerCase() === skill);

      let status, proficiency;
      if (hasSkill && userSkill?.verified) { status = 'verified';   proficiency = userSkill.level; }
      else if (hasSkill)                   { status = 'has';         proficiency = userSkill?.level || 'beginner'; }
      else if (hasCert || hasPath)         { status = 'partial';     proficiency = 'beginner'; }
      else                                 { status = 'missing';     proficiency = null; }

      return { skill, status, proficiency };
    });

    // Compute score
    const scoreMap = { verified: 3, has: 2, partial: 1, missing: 0 };
    const maxScore  = requiredSkills.length * 3;
    const earned    = analysis.reduce((sum, a) => sum + (scoreMap[a.status] || 0), 0);
    const matchPct  = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;

    const verified = analysis.filter(a => a.status === 'verified');
    const has      = analysis.filter(a => a.status === 'has');
    const partial  = analysis.filter(a => a.status === 'partial');
    const missing  = analysis.filter(a => a.status === 'missing');

    // Generate learning recommendations for missing/partial skills
    const recommendations = [...missing, ...partial].slice(0, 5).map(a => ({
      skill: a.skill,
      suggestions: getCourseSuggestions(a.skill),
    }));

    return success(res, {
      job:    { id: job.id, title: job.title, company: job.company },
      matchPct,
      summary: {
        total:    requiredSkills.length,
        verified: verified.length,
        has:      has.length,
        partial:  partial.length,
        missing:  missing.length,
      },
      skills: {
        verified: verified.map(a => a.skill),
        has:      has.map(a => ({ skill: a.skill, proficiency: a.proficiency })),
        partial:  partial.map(a => a.skill),
        missing:  missing.map(a => a.skill),
      },
      recommendations,
      verdict: matchPct >= 70
        ? 'Strong match! You meet most requirements for this role.'
        : matchPct >= 40
        ? 'Partial match. Building the missing skills will improve your chances.'
        : 'Skill gap detected. Focus on the recommended courses to qualify for this role.',
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to generate skill gap report');
  }
});

// ── GET /api/v1/skill-gap/overview — general skill gap vs market ─────────────
router.get('/overview/market', authenticate, async (req, res) => {
  try {
    // Get top skills demanded in active jobs
    const activeJobs = await prisma.job.findMany({
      where:  { status: 'active' },
      select: { skillsRequired: true },
      take:   100,
    });

    // Count skill frequency
    const skillFreq = {};
    activeJobs.forEach(job => {
      (job.skillsRequired || '').split(',').forEach(s => {
        const skill = s.trim().toLowerCase();
        if (skill) skillFreq[skill] = (skillFreq[skill] || 0) + 1;
      });
    });

    const topMarketSkills = Object.entries(skillFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, jobCount: count }));

    // Get user's skills
    const userSkills = await prisma.userSkill.findMany({
      where:  { userId: req.user.id },
      select: { name: true, level: true, verified: true },
    });
    const userSkillNames = userSkills.map(s => s.name.toLowerCase());

    // Gap analysis
    const gaps = topMarketSkills.map(m => ({
      ...m,
      userHas:  userSkillNames.includes(m.skill),
      userSkill: userSkills.find(s => s.name.toLowerCase() === m.skill) || null,
    }));

    const hasSkills    = gaps.filter(g => g.userHas);
    const missingSkills = gaps.filter(g => !g.userHas);

    return success(res, {
      topMarketSkills: gaps,
      summary: {
        marketSkillsTracked: topMarketSkills.length,
        youHave:   hasSkills.length,
        gapCount:  missingSkills.length,
      },
      topMissing: missingSkills.slice(0, 5).map(g => ({
        skill:      g.skill,
        jobCount:   g.jobCount,
        suggestions: getCourseSuggestions(g.skill),
      })),
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to generate market gap report');
  }
});

// ── Helper: course suggestions ────────────────────────────────────────────────
function getCourseSuggestions(skill) {
  const map = {
    'react':        [{ platform: 'Udemy',    title: 'React - The Complete Guide', url: 'https://udemy.com/course/react-the-complete-guide-incl-redux/' }],
    'node':         [{ platform: 'Udemy',    title: 'The Complete Node.js Developer Course', url: 'https://udemy.com/course/the-complete-nodejs-developer-course-2/' }],
    'nodejs':       [{ platform: 'Udemy',    title: 'The Complete Node.js Developer Course', url: 'https://udemy.com/course/the-complete-nodejs-developer-course-2/' }],
    'python':       [{ platform: 'Coursera', title: 'Python for Everybody',   url: 'https://coursera.org/specializations/python' }],
    'sql':          [{ platform: 'Coursera', title: 'SQL for Data Science',   url: 'https://coursera.org/learn/sql-for-data-science' }],
    'postgresql':   [{ platform: 'Udemy',    title: 'The Complete SQL Bootcamp', url: 'https://udemy.com/course/the-complete-sql-bootcamp/' }],
    'javascript':   [{ platform: 'freeCodeCamp', title: 'JavaScript Algorithms and Data Structures', url: 'https://freecodecamp.org/learn/javascript-algorithms-and-data-structures/' }],
    'typescript':   [{ platform: 'Udemy',    title: 'Understanding TypeScript', url: 'https://udemy.com/course/understanding-typescript/' }],
    'aws':          [{ platform: 'Coursera', title: 'AWS Cloud Practitioner Essentials', url: 'https://coursera.org/learn/aws-cloud-practitioner-essentials' }],
    'docker':       [{ platform: 'Udemy',    title: 'Docker & Kubernetes: The Practical Guide', url: 'https://udemy.com/course/docker-kubernetes-the-practical-guide/' }],
    'figma':        [{ platform: 'YouTube',  title: 'Figma UI Design Tutorial', url: 'https://youtube.com/watch?v=FTFaQWZBqQ8' }],
    'data analysis':[{ platform: 'Coursera', title: 'Google Data Analytics',   url: 'https://coursera.org/professional-certificates/google-data-analytics' }],
    'machine learning':[{ platform: 'Coursera', title: 'Machine Learning Specialization', url: 'https://coursera.org/specializations/machine-learning-introduction' }],
    'flutter':      [{ platform: 'Udemy',    title: 'Flutter & Dart - The Complete Guide', url: 'https://udemy.com/course/learn-flutter-dart-to-build-ios-android-apps/' }],
    'django':       [{ platform: 'Udemy',    title: 'Python and Django Full Stack Web Developer', url: 'https://udemy.com/course/python-and-django-full-stack-web-developer-bootcamp/' }],
  };

  const key = skill.toLowerCase();
  return map[key] || [
    { platform: 'Coursera',    title: `Learn ${skill}`, url: `https://coursera.org/search?query=${encodeURIComponent(skill)}` },
    { platform: 'Udemy',       title: `${skill} Course`, url: `https://udemy.com/courses/search/?q=${encodeURIComponent(skill)}` },
  ];
}

module.exports = router;