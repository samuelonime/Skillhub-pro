const router = require('express').Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadProjectImage } = require('../utils/cloudinary');
const { success, created, notFound, badRequest, error } = require('../utils/response');
const POST_REACTIONS = ['👍', '🔥', '🚀', '💯'];

const projectCommunityPostSelect = {
  id: true,
  title: true,
  projectUrl: true,
  likes: true,
  views: true,
  _count: { select: { comments: true } },
};

function buildProjectCommunityPostData(project, userId) {
  const stack = [...new Set([...(project.techStack || []), ...(project.technologies || [])])];
  const links = [];
  if (project.liveUrl) links.push(`🔗 Live demo: ${project.liveUrl}`);
  if (project.githubUrl) links.push(`💻 Source code: ${project.githubUrl}`);

  const bodyParts = [
    project.description || `Check out my latest community project: ${project.title}`,
  ];
  if (stack.length) bodyParts.push(`\n\n🛠 Built with: ${stack.join(', ')}`);
  if (links.length) bodyParts.push(`\n\n${links.join('\n')}`);

  return {
    authorId: userId,
    title: `Shared project: ${project.title}`,
    body: bodyParts.join(''),
    type: 'project',
    tags: [...new Set(['project', ...stack.map((skill) => skill.toLowerCase())])].slice(0, 5),
    imageUrl: project.thumbnail,
    projectUrl: project.liveUrl || project.githubUrl || null,
  };
}

function normalizeReactionType(value) {
  return POST_REACTIONS.includes(value) ? value : '👍';
}

function buildReactionSummary(likes = []) {
  return likes.reduce((summary, like) => {
    const reaction = normalizeReactionType(like.reactionType);
    summary[reaction] = (summary[reaction] || 0) + 1;
    return summary;
  }, {});
}

async function ensureCommunityProjectPost(project, userId) {
  const matchers = [
    { title: `Shared project: ${project.title}` },
  ];

  if (project.liveUrl) matchers.push({ projectUrl: project.liveUrl });
  if (project.githubUrl) matchers.push({ projectUrl: project.githubUrl });

  const existing = await prisma.communityPost.findFirst({
    where: {
      authorId: userId,
      type: 'project',
      OR: matchers,
    },
    select: projectCommunityPostSelect,
  });

  if (existing) return existing;

  return prisma.communityPost.create({
    data: buildProjectCommunityPostData(project, userId),
    select: projectCommunityPostSelect,
  });
}

// ── Multer — memory storage for project thumbnails ─────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
  },
});

// POST /portfolio/projects/upload-image
router.post('/projects/upload-image', authenticate, upload.single('image'), async (req, res) => {
  if (!req.file) return badRequest(res, 'No image uploaded');
  try {
    const publicId = `project-${req.user.id}-${Date.now()}`;
    const url = await uploadProjectImage(req.file.buffer, 'skillhub/projects', publicId);
    return success(res, { url });
  } catch (e) {
    console.error('Project image upload error:', e);
    return error(res, 'Failed to upload image');
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return badRequest(res, 'Image too large. Maximum 8MB.');
    return badRequest(res, err.message);
  }
  if (err) return badRequest(res, err.message);
  next();
});

// GET /portfolio
router.get('/', authenticate, async (req, res) => {
  try {
    const [projects, certificates] = await Promise.all([
      prisma.project.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }),
      prisma.certificate.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }),
    ]);

    // req.user.skills is UserSkill[] — map to plain name strings for the frontend
    const skillNames = (req.user.skills || []).map(s => (typeof s === 'string' ? s : s.name));

    return success(res, {
      user: {
        id:              req.user.id,
        name:            `${req.user.firstName} ${req.user.lastName}`,
        title:           req.user.title,
        bio:             req.user.bio,
        location:        req.user.location,
        avatar:          req.user.avatar,
        skills:          skillNames,
        portfolioPublic: req.user.portfolioPublic ?? true,
      },
      projects,
      certificates,
      stats: {
        projectCount: projects.length,
        avgScore:     projects.length ? (projects.reduce((s, p) => s + p.score, 0) / projects.length).toFixed(1) : 0,
        totalViews:   projects.reduce((s, p) => s + p.views, 0),
        certCount:    certificates.length,
      },
    });
  } catch (err) { return error(res, 'Failed to load portfolio'); }
});

// GET /portfolio/community-feed — public portfolios shown in the community sidebar
router.get('/community-feed', authenticate, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);

    // Find users who have portfolioPublic=true and at least one community-visible project
    const users = await prisma.user.findMany({
      where: {
        portfolioPublic: true,
        projects: { some: { visibility: 'community' } },
      },
      select: {
        id:        true,
        firstName: true,
        lastName:  true,
        avatar:    true,
        title:     true,
        skills:    { select: { name: true }, take: 5 },
        projects:  {
          where:   { visibility: 'community' },
          orderBy: { score: 'desc' },
          select:  {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            score: true,
            views: true,
            liveUrl: true,
            githubUrl: true,
            technologies: true,
            techStack: true,
          },
        },
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    const usersWithCommunityPosts = await Promise.all(
      users.map(async (user) => ({
        ...user,
        projects: await Promise.all(
          user.projects.map(async (project) => {
            const communityPost = await ensureCommunityProjectPost(project, user.id);
            return { project, communityPost };
          })
        ),
      }))
    );

    const postIds = usersWithCommunityPosts.flatMap((user) =>
      user.projects.map(({ communityPost }) => communityPost.id)
    );

    const postLikes = postIds.length > 0
      ? await prisma.communityLike.findMany({
          where: { postId: { in: postIds }, commentId: null },
          select: { postId: true, reactionType: true, userId: true },
        })
      : [];
    const postLikesById = postLikes.reduce((map, like) => {
      if (!like.postId) return map;
      if (!map.has(like.postId)) map.set(like.postId, []);
      map.get(like.postId).push(like);
      return map;
    }, new Map());

    const feed = usersWithCommunityPosts.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      title: user.title,
      skills: user.skills.map((skill) => skill.name),
      projects: user.projects.map(({ project, communityPost }) => {
        const likes = postLikesById.get(communityPost.id) || [];
        const myReaction = likes.find((like) => like.userId === req.user.id);

        return {
          ...project,
          community: {
            postId: communityPost.id,
            title: communityPost.title,
            likes: communityPost.likes,
            views: communityPost.views,
            commentsCount: communityPost._count.comments,
            likedByMe: !!myReaction,
            reactionType: myReaction ? normalizeReactionType(myReaction.reactionType) : null,
            reactions: buildReactionSummary(likes),
          },
        };
      }),
    }));

    return success(res, feed);
  } catch (err) {
    console.error('Community feed error:', err);
    return error(res, 'Failed to load community feed');
  }
});

// GET /portfolio/projects
router.get('/projects', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    return success(res, projects);
  } catch (err) { return error(res, 'Failed to fetch projects'); }
});

// GET /portfolio/projects/:id/public
router.get('/projects/:id/public', async (req, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        visibility: { in: ['public', 'community'] },
        user: { portfolioPublic: true, isActive: true },
      },
      select: {
        id: true,
        title: true,
        description: true,
        technologies: true,
        techStack: true,
        thumbnail: true,
        liveUrl: true,
        githubUrl: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            avatar: true,
          },
        },
      },
    });

    if (!project) return notFound(res, 'Project not found');

    const skills = [...new Set([...(project.technologies || []), ...(project.techStack || [])])];
    const { user, ...projectData } = project;
    return success(res, {
      ...projectData,
      creator: user,
      skills,
    });
  } catch (err) {
    return error(res, 'Failed to fetch public project');
  }
});

// POST /portfolio/projects
router.post('/projects', authenticate, [
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('description').isLength({ min: 10, max: 1000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return badRequest(res, 'Validation failed', errors.array());
  try {
    const { title, description, technologies, liveUrl, githubUrl, thumbnail } = req.body;
    const techs = Array.isArray(technologies) ? technologies : (technologies || '').split(',').map((t) => t.trim()).filter(Boolean);
    const project = await prisma.project.create({
      data: {
        userId:       req.user.id,
        title,
        description,
        technologies: techs,
        techStack:    techs,
        liveUrl:      liveUrl   || null,
        githubUrl:    githubUrl || null,
        score:        parseFloat((Math.random() * 2 + 7.5).toFixed(1)),
        visibility:   'public',
        thumbnail:    thumbnail || `https://placehold.co/400x250/4f46e5/white?text=${encodeURIComponent(title.substring(0, 15))}`,
      },
    });
    await prisma.user.update({ where: { id: req.user.id }, data: { meritCoins: { increment: 1 } } });
    return created(res, project, 'Project added! +1 Merit Coin');
  } catch (err) { console.error(err); return error(res, 'Failed to add project'); }
});

// PUT /portfolio/projects/:id
router.put('/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!project) return notFound(res, 'Project not found');
    const { title, description, technologies, liveUrl, githubUrl, thumbnail } = req.body;
    const techs = technologies
      ? (Array.isArray(technologies) ? technologies : technologies.split(',').map((t) => t.trim()).filter(Boolean))
      : project.technologies;
    const updated = await prisma.project.update({
      where: { id: req.params.id, userId: req.user.id }, 
      data: {
        title, description,
        technologies: techs, techStack: techs,
        liveUrl, githubUrl,
        ...(thumbnail !== undefined && { thumbnail }),
      },
    });
    return success(res, updated, 'Project updated');
  } catch (err) { return error(res, 'Failed to update project'); }
});

// DELETE /portfolio/projects/:id
router.delete('/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!project) return notFound(res, 'Project not found');
    await prisma.project.delete({ where: { id: req.params.id } });
    return success(res, null, 'Project deleted');
  } catch (err) { return error(res, 'Failed to delete project'); }
});

// PUT /portfolio/visibility
router.put('/visibility', authenticate, async (req, res) => {
  const { portfolioPublic } = req.body;
  if (typeof portfolioPublic !== 'boolean') return badRequest(res, 'portfolioPublic must be a boolean');
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { portfolioPublic } });
    return success(res, { portfolioPublic }, portfolioPublic ? 'Portfolio is now visible in the community feed' : 'Portfolio hidden from community feed');
  } catch (err) { return error(res, 'Failed to update visibility'); }
});

// PUT /portfolio/projects/:id/community
router.put('/projects/:id/community', authenticate, async (req, res) => {
  const { showInCommunity } = req.body;
  if (typeof showInCommunity !== 'boolean') return badRequest(res, 'showInCommunity must be a boolean');
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!project) return notFound(res, 'Project not found');

    const updated = await prisma.project.update({
      where: { id: req.params.id, userId: req.user.id }, 
      data: { visibility: showInCommunity ? 'community' : 'public' },
    });

    if (showInCommunity) await ensureCommunityProjectPost(project, req.user.id);

    return success(res, updated, showInCommunity ? 'Project shared to community feed' : 'Project removed from community feed');
  } catch (err) { return error(res, 'Failed to update project visibility'); }
});

// PUT /portfolio/skills — replaces all skills using the UserSkill relation
router.put('/skills', authenticate, async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills)) return badRequest(res, 'Skills must be an array');

  // Normalise: accept either plain strings or { name } objects
  const names = [...new Set(
    skills.map(s => (typeof s === 'string' ? s : s?.name)).filter(Boolean).map(s => s.trim())
  )];

  try {
    // Delete existing and recreate — cleanest approach for a full replace
    await prisma.$transaction([
      prisma.userSkill.deleteMany({ where: { userId: req.user.id } }),
      prisma.userSkill.createMany({
        data: names.map(name => ({ userId: req.user.id, name })),
        skipDuplicates: true,
      }),
    ]);
    return success(res, { skills: names }, 'Skills updated');
  } catch (err) {
    console.error('Skills update error:', err);
    return error(res, 'Failed to update skills');
  }
});

// POST /portfolio/projects/:id/share — share project to profile
router.post('/projects/:id/share', authenticate, async (req, res) => {
  try {
    const { note } = req.body;
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!project) return notFound(res, 'Project not found');

    const existing = await prisma.projectShare.findFirst({
      where: { userId: req.user.id, projectId: req.params.id },
    });

    if (existing) {
      await prisma.projectShare.delete({ where: { id: existing.id } });
      return success(res, { shared: false }, 'Project unshared');
    }

    const share = await prisma.projectShare.create({
      data: {
        userId: req.user.id,
        projectId: req.params.id,
        note: note?.trim() || null,
      },
    });

    return created(res, { shared: true, shareId: share.id }, 'Project shared successfully');
  } catch (err) {
    console.error('Project share error:', err);
    return error(res, 'Failed to share project');
  }
});

// GET /portfolio/shares — get user's shared projects
router.get('/shares', authenticate, async (req, res) => {
  try {
    const { userId = req.user.id, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * 15;

    const [shares, total] = await prisma.$transaction([
      prisma.projectShare.findMany({
        where: { userId },
        orderBy: { sharedAt: 'desc' },
        skip,
        take: 15,
        select: {
          id: true,
          note: true,
          sharedAt: true,
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              technologies: true,
              liveUrl: true,
              githubUrl: true,
              thumbnail: true,
              score: true,
            },
          },
        },
      }),
      prisma.projectShare.count({ where: { userId } }),
    ]);

    return success(res, {
      shares,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / 15),
    });
  } catch (err) {
    console.error('Shared projects fetch error:', err);
    return error(res, 'Failed to fetch shared projects');
  }
});

module.exports = router;