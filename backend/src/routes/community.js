const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const prisma   = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadMedia } = require('../utils/cloudinary');
const { logActivity } = require('../utils/activityLogger');
const { success, created, badRequest, notFound, error } = require('../utils/response');

const PAGE_SIZE      = 15;
const FEED_PAGE_SIZE = 20;
const POST_REACTIONS = ['👍', '🔥', '🚀', '💯'];

// ── Multer — memory storage, buffer goes straight to Cloudinary ────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif',
                     'video/mp4', 'video/webm', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images, GIFs, and short videos are allowed'));
  },
});

// ── POST /upload-media — upload image/gif/video, returns Cloudinary URL ───
router.post('/upload-media', authenticate, upload.single('media'), async (req, res) => {
  if (!req.file) return badRequest(res, 'No file uploaded');
  try {
    const resourceType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    const url = await uploadMedia(req.file.buffer, resourceType);
    return success(res, { url });
  } catch (e) {
    console.error('Community media upload error:', e);
    return error(res, 'Failed to upload media');
  }
});

// ── Multer error handler ──────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return badRequest(res, 'File too large. Maximum size is 50MB.');
    return badRequest(res, err.message);
  }
  if (err) return badRequest(res, err.message);
  next();
});

// ── Helpers ────────────────────────────────────────────────────────────────
const postSelect = {
  id: true, title: true, body: true, type: true, tags: true,
  imageUrl: true, projectUrl: true, likes: true, views: true,
  isPinned: true, createdAt: true, updatedAt: true,
  author: { select: { id: true, firstName: true, lastName: true, avatar: true, title: true } },
  _count: { select: { comments: true } },
};

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

function decoratePostsWithReactions(posts, likes, currentUserId) {
  const likesByPostId = likes.reduce((map, like) => {
    if (!like.postId) return map;
    if (!map.has(like.postId)) map.set(like.postId, []);
    map.get(like.postId).push(like);
    return map;
  }, new Map());

  return posts.map((post) => {
    const postLikes = likesByPostId.get(post.id) || [];
    const myReaction = postLikes.find((like) => like.userId === currentUserId);

    return {
      ...post,
      likedByMe: !!myReaction,
      reactionType: myReaction ? normalizeReactionType(myReaction.reactionType) : null,
      reactions: buildReactionSummary(postLikes),
    };
  });
}

// ── Activity type display metadata ─────────────────────────────────────────
const ACTIVITY_META = {
  course_enrolled:          { icon: '📚', color: '#4F8EF7', label: 'Enrolled in a course' },
  course_completed:         { icon: '🎓', color: '#00E5A0', label: 'Completed a course' },
  course_progress:          { icon: '⚡', color: '#F59E0B', label: 'Course milestone reached' },
  digital_skills_enrolled:  { icon: '🌐', color: '#A78BFA', label: 'Joined Digital Skills course' },
  digital_skills_completed: { icon: '🏅', color: '#00E5A0', label: 'Completed Digital Skills course' },
  badge_earned:             { icon: '🏆', color: '#F59E0B', label: 'Earned a badge' },
  certificate_added:        { icon: '📜', color: '#38BDF8', label: 'Added a certificate' },
  project_added:            { icon: '🚀', color: '#F472B6', label: 'Published a project' },
  job_applied:              { icon: '💼', color: '#00E5A0', label: 'Applied to a job' },
  job_saved:                { icon: '🔖', color: '#94a3b8', label: 'Saved a job' },
  skill_added:              { icon: '✨', color: '#A78BFA', label: 'Added a new skill' },
  community_post:           { icon: '💬', color: '#F59E0B', label: 'Shared in Community' },
  resume_generated:         { icon: '📄', color: '#38BDF8', label: 'Generated AI resume' },
  profile_completed:        { icon: '👤', color: '#4F8EF7', label: 'Completed profile' },
  member_joined:            { icon: '🎉', color: '#00E5A0', label: 'Joined SkillHub' },
  streak_milestone:         { icon: '🔥', color: '#F87171', label: 'Learning streak' },
};

// ─────────────────────────────────────────────────────────────────────────────
// NEW: GET /activity-feed — community-wide activity stream
// Returns recent public activities from ALL users, enriched with display meta.
// Supports ?page, ?type filter, ?userId (filter to a specific user).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/activity-feed', authenticate, async (req, res) => {
  try {
    const { page = 1, type, userId: filterUserId } = req.query;
    const skip = (parseInt(page) - 1) * FEED_PAGE_SIZE;

    const where = {
      isPublic: true,
      ...(type         && { type }),
      ...(filterUserId && { userId: filterUserId }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.activityFeed.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: FEED_PAGE_SIZE,
        select: {
          id: true, type: true, title: true, body: true,
          metadata: true, courseId: true, jobId: true, postId: true,
          createdAt: true,
          user: {
            select: {
              id: true, firstName: true, lastName: true,
              avatar: true, title: true, interestNiche: true,
            },
          },
        },
      }),
      prisma.activityFeed.count({ where }),
    ]);

    const enriched = items.map(item => ({
      ...item,
      ...(ACTIVITY_META[item.type] || { icon: '📌', color: '#64748b', label: item.type }),
    }));

    // For community_post activities (discussions, shared projects, showcases),
    // attach the full post so the feed can render a rich card with all details.
    const postIds = enriched.filter(i => i.type === 'community_post' && i.postId).map(i => i.postId);
    if (postIds.length > 0) {
      const [posts, postLikes] = await Promise.all([
        prisma.communityPost.findMany({ where: { id: { in: postIds } }, select: postSelect }),
        prisma.communityLike.findMany({
          where: { postId: { in: postIds }, commentId: null },
          select: { postId: true, reactionType: true, userId: true },
        }),
      ]);
      const postMap = new Map(decoratePostsWithReactions(posts, postLikes, req.user.id).map((post) => [post.id, post]));
      enriched.forEach(item => {
        if (item.type === 'community_post' && item.postId && postMap.has(item.postId)) {
          item.post = postMap.get(item.postId);
        }
      });
    }

    return success(res, {
      activities: enriched,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / FEED_PAGE_SIZE),
    });
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to fetch activity feed');
  }
});

// ── GET /  — list posts (paginated, filterable) ────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, type, tag, search, sort = 'latest' } = req.query;
    const skip = (parseInt(page) - 1) * PAGE_SIZE;

    const where = {
      ...(type   && { type }),
      ...(tag    && { tags: { has: tag } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { body:  { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy = sort === 'popular'
      ? [{ likes: 'desc' }, { createdAt: 'desc' }]
      : sort === 'trending'
        ? [{ views: 'desc' }, { createdAt: 'desc' }]
        : [{ isPinned: 'desc' }, { createdAt: 'desc' }];

    const [posts, total] = await prisma.$transaction([
      prisma.communityPost.findMany({ where, orderBy, skip, take: PAGE_SIZE, select: postSelect }),
      prisma.communityPost.count({ where }),
    ]);

    const postIds = posts.map((post) => post.id);
    const postLikes = postIds.length > 0
      ? await prisma.communityLike.findMany({
          where: { postId: { in: postIds }, commentId: null },
          select: { postId: true, reactionType: true, userId: true },
        })
      : [];

    const data = decoratePostsWithReactions(posts, postLikes, req.user.id);

    return success(res, { posts: data, total, page: parseInt(page), pages: Math.ceil(total / PAGE_SIZE) });
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to fetch posts');
  }
});

// ── POST /  — create post ─────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, body, type = 'discussion', tags = [], imageUrl, projectUrl } = req.body;
    if (!title?.trim()) return badRequest(res, 'Title is required');
    if (!body?.trim())  return badRequest(res, 'Body is required');

    const post = await prisma.communityPost.create({
      data: {
        authorId: req.user.id,
        title: title.trim(),
        body: body.trim(),
        type,
        tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
        imageUrl: imageUrl || null,
        projectUrl: projectUrl || null,
      },
      select: postSelect,
    });

    // NEW: log to activity feed
    await logActivity({
      userId:   req.user.id,
      type:     'community_post',
      title:    `Shared a ${type} post: "${title.trim().slice(0, 60)}"`,
      body:     body.trim().slice(0, 120),
      postId:   post.id,
      metadata: { postType: type },
    });

    return created(res, post, 'Post created successfully');
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to create post');
  }
});

// ── POST /messages — send a private message (persisted, expires after 24h) ───
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId) return badRequest(res, 'Recipient is required');
    if (!message?.trim()) return badRequest(res, 'Message is required');
    if (recipientId === req.user.id) return badRequest(res, 'You cannot message yourself');

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!recipient) return notFound(res, 'Recipient not found');

    // Persist the message
    const saved = await prisma.directMessage.create({
      data: {
        senderId: req.user.id,
        recipientId,
        body: message.trim().slice(0, 2000),
      },
    });

    // Also drop a notification so the recipient is alerted
    const senderName = `${req.user.firstName} ${req.user.lastName}`.trim();
    await prisma.notification.create({
      data: {
        userId: recipient.id,
        type: 'message',
        icon: 'comments',
        title: `${senderName} sent you a message`,
        message: `${senderName}: ${message.trim().slice(0, 200)}`,
      },
    }).catch(() => {});

    const latestSession = await prisma.userSession.findFirst({
      where: { userId: recipient.id, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
    });
    const online = !!latestSession && new Date(latestSession.lastSeenAt).getTime() > Date.now() - 5 * 60 * 1000;

    return success(res, {
      message: {
        id: saved.id,
        body: saved.body,
        senderId: saved.senderId,
        recipientId: saved.recipientId,
        createdAt: saved.createdAt,
        mine: true,
      },
      online,
    }, 'Message sent');
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to send message');
  }
});

// ── GET /messages/:userId — conversation history with one user (last 24h) ────
router.get('/messages/:userId', authenticate, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const msgs = await prisma.directMessage.findMany({
      where: {
        createdAt: { gt: cutoff },
        OR: [
          { senderId: req.user.id, recipientId: otherId },
          { senderId: otherId, recipientId: req.user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    // Mark messages from the other person as read
    await prisma.directMessage.updateMany({
      where: { senderId: otherId, recipientId: req.user.id, read: false },
      data: { read: true },
    }).catch(() => {});

    const shaped = msgs.map(m => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      recipientId: m.recipientId,
      createdAt: m.createdAt,
      mine: m.senderId === req.user.id,
    }));

    return success(res, shaped);
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to load conversation');
  }
});

// ── GET /contacts — recent conversations + community members for messaging ───
router.get('/contacts', authenticate, async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. People the user has recently exchanged messages with (within 24h)
    const recentMsgs = await prisma.directMessage.findMany({
      where: {
        createdAt: { gt: cutoff },
        OR: [{ senderId: req.user.id }, { recipientId: req.user.id }],
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Build a map of last message + unread count per other-user
    const convoMap = new Map();
    for (const m of recentMsgs) {
      const otherId = m.senderId === req.user.id ? m.recipientId : m.senderId;
      if (!convoMap.has(otherId)) {
        convoMap.set(otherId, { lastMessage: m.body, lastTime: m.createdAt, unread: 0 });
      }
      if (m.recipientId === req.user.id && !m.read) {
        convoMap.get(otherId).unread += 1;
      }
    }

    // 2. Also surface recent community authors as potential new contacts
    const recentAuthors = await prisma.communityPost.findMany({
      where: { authorId: { not: req.user.id } },
      distinct: ['authorId'],
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { author: { select: { id: true, firstName: true, lastName: true, avatar: true, title: true } } },
    });

    const allIds = new Set([...convoMap.keys(), ...recentAuthors.map(r => r.author.id)]);
    const users = await prisma.user.findMany({
      where: { id: { in: [...allIds] } },
      select: { id: true, firstName: true, lastName: true, avatar: true, title: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Online status
    const sessions = await prisma.userSession.findMany({
      where: { userId: { in: [...allIds] }, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
    });
    const now = Date.now();
    const onlineMap = new Map();
    sessions.forEach(s => {
      if (new Date(s.lastSeenAt).getTime() > now - 5 * 60 * 1000) onlineMap.set(s.userId, true);
    });

    const contacts = [...allIds].map(id => {
      const u = userMap.get(id);
      if (!u) return null;
      const convo = convoMap.get(id);
      return {
        ...u,
        online: onlineMap.get(id) || false,
        lastMessage: convo?.lastMessage || 'Tap to start a new message',
        lastTime: convo?.lastTime || null,
        unread: convo?.unread || 0,
      };
    }).filter(Boolean)
      // Conversations with real messages first, most recent on top
      .sort((a, b) => {
        if (a.lastTime && b.lastTime) return new Date(b.lastTime) - new Date(a.lastTime);
        if (a.lastTime) return -1;
        if (b.lastTime) return 1;
        return 0;
      });

    return success(res, contacts);
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to load contacts');
  }
});

// ── GET /stats/overview  — community stats ────────────────────────────────
// IMPORTANT: MUST be placed BEFORE /:id route to avoid conflict
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const [totalPosts, totalComments, totalMembers, recentActive] = await prisma.$transaction([
      prisma.communityPost.count(),
      prisma.communityComment.count(),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.communityPost.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return success(res, { totalPosts, totalComments, totalMembers, recentActive });
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to fetch stats');
  }
});

// ── GET /curated-jobs — curated opportunities mixed into community feed ─────
router.get('/curated-jobs', authenticate, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 8, 1), 20);
    const jobs = await prisma.jobScoutLead.findMany({
      where: { status: { in: ['pending', 'sent'] } },
      orderBy: [{ postedAt: 'desc' }, { fetchedAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        type: true,
        source: true,
        url: true,
        postedAt: true,
        fetchedAt: true,
        skills: true,
      },
    });

    return success(res, {
      jobs: jobs.map((job) => ({
        ...job,
        label: 'Curated Job',
      })),
    });
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to fetch curated jobs');
  }
});

// ── GET /:id  — single post with comments ─────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const post = await prisma.communityPost.findUnique({
      where: { id: req.params.id },
      select: {
        ...postSelect,
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, body: true, likes: true, createdAt: true,
            author: { select: { id: true, firstName: true, lastName: true, avatar: true, title: true } },
          },
        },
      },
    });

    if (!post) return notFound(res, 'Post not found');

    // Increment views
    await prisma.communityPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {});

    // Like flags
    const [postLikes, commentLikes] = await prisma.$transaction([
      prisma.communityLike.findMany({
        where: { postId: post.id, commentId: null },
        select: { postId: true, reactionType: true, userId: true },
      }),
      prisma.communityLike.findMany({
        where: { userId: req.user.id, commentId: { not: null } },
        select: { commentId: true },
      }),
    ]);

    const likedCommentIds = new Set(commentLikes.map(l => l.commentId));

    const decoratedPost = decoratePostsWithReactions([post], postLikes, req.user.id)[0];

    return success(res, {
      ...decoratedPost,
      comments: post.comments.map(c => ({ ...c, likedByMe: likedCommentIds.has(c.id) })),
    });
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to fetch post');
  }
});

// ── PUT /:id  — update post ───────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post) return notFound(res, 'Post not found');
    if (post.authorId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const { title, body, tags, imageUrl, projectUrl } = req.body;
    const updated = await prisma.communityPost.update({
      where: { id: req.params.id },
      data: {
        ...(title      && { title: title.trim() }),
        ...(body       && { body: body.trim() }),
        ...(tags       && { tags }),
        ...(imageUrl   !== undefined && { imageUrl }),
        ...(projectUrl !== undefined && { projectUrl }),
      },
      select: postSelect,
    });

    return success(res, updated, 'Post updated');
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to update post');
  }
});

// ── DELETE /:id  — delete post ────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post) return notFound(res, 'Post not found');
    if (post.authorId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.communityPost.delete({ where: { id: req.params.id } });
    return success(res, null, 'Post deleted');
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to delete post');
  }
});

// ── POST /:id/like  — toggle like ─────────────────────────────────────────
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const reactionType = normalizeReactionType(req.body?.reactionType);
    const existing = await prisma.communityLike.findFirst({
      where: { userId: req.user.id, postId: req.params.id, commentId: null },
    });

    if (existing) {
      const existingReaction = normalizeReactionType(existing.reactionType);

      if (existingReaction === reactionType) {
        await prisma.$transaction([
          prisma.communityLike.delete({ where: { id: existing.id } }),
          prisma.communityPost.update({ where: { id: req.params.id }, data: { likes: { decrement: 1 } } }),
        ]);

        const postLikes = await prisma.communityLike.findMany({
          where: { postId: req.params.id, commentId: null },
          select: { reactionType: true },
        });

        return success(res, { liked: false, reactionType: null, reactions: buildReactionSummary(postLikes) });
      }

      await prisma.communityLike.update({
        where: { id: existing.id },
        data: { reactionType },
      });

      const postLikes = await prisma.communityLike.findMany({
        where: { postId: req.params.id, commentId: null },
        select: { reactionType: true },
      });

      return success(res, { liked: true, reactionType, reactions: buildReactionSummary(postLikes) });
    } else {
      await prisma.$transaction([
        prisma.communityLike.create({ data: { userId: req.user.id, postId: req.params.id, reactionType } }),
        prisma.communityPost.update({ where: { id: req.params.id }, data: { likes: { increment: 1 } } }),
      ]);

      const postLikes = await prisma.communityLike.findMany({
        where: { postId: req.params.id, commentId: null },
        select: { reactionType: true },
      });

      return success(res, { liked: true, reactionType, reactions: buildReactionSummary(postLikes) });
    }
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to toggle like');
  }
});

// ── POST /:id/comments  — add comment ────────────────────────────────────
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return badRequest(res, 'Comment body is required');

    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post) return notFound(res, 'Post not found');

    const comment = await prisma.communityComment.create({
      data: { postId: req.params.id, authorId: req.user.id, body: body.trim() },
      select: {
        id: true, body: true, likes: true, createdAt: true,
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, title: true } },
      },
    });

    return created(res, { ...comment, likedByMe: false }, 'Comment added');
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to add comment');
  }
});

// ── DELETE /:id/comments/:cid  — delete comment ───────────────────────────
router.delete('/:id/comments/:cid', authenticate, async (req, res) => {
  try {
    const comment = await prisma.communityComment.findUnique({ where: { id: req.params.cid } });
    if (!comment) return notFound(res, 'Comment not found');
    if (comment.authorId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await prisma.communityComment.delete({ where: { id: req.params.cid } });
    return success(res, null, 'Comment deleted');
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to delete comment');
  }
});

// ── PUT /:id/comments/:cid  — update comment ────────────────────────────
router.put('/:id/comments/:cid', authenticate, async (req, res) => {
  try {
    const comment = await prisma.communityComment.findUnique({ where: { id: req.params.cid } });
    if (!comment) return notFound(res, 'Comment not found');
    if (comment.authorId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const { body } = req.body;
    if (!body?.trim()) return badRequest(res, 'Comment body is required');

    const updated = await prisma.communityComment.update({
      where: { id: req.params.cid },
      data: { body: body.trim() },
      select: {
        id: true, body: true, likes: true, createdAt: true, updatedAt: true,
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, title: true } },
      },
    });
    return success(res, updated, 'Comment updated');
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to update comment');
  }
});

// ── POST /:id/comments/:cid/like  — toggle comment like ──────────────────
router.post('/:id/comments/:cid/like', authenticate, async (req, res) => {
  try {
    const existing = await prisma.communityLike.findFirst({
      where: { userId: req.user.id, commentId: req.params.cid, postId: null },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.communityLike.delete({ where: { id: existing.id } }),
        prisma.communityComment.update({ where: { id: req.params.cid }, data: { likes: { decrement: 1 } } }),
      ]);
      return success(res, { liked: false });
    } else {
      await prisma.$transaction([
        prisma.communityLike.create({ data: { userId: req.user.id, commentId: req.params.cid } }),
        prisma.communityComment.update({ where: { id: req.params.cid }, data: { likes: { increment: 1 } } }),
      ]);
      return success(res, { liked: true });
    }
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to toggle comment like');
  }
});

// ── POST /:id/share  — share post to profile ──────────────────────────────
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const { note } = req.body;
    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post) return notFound(res, 'Post not found');

    const existing = await prisma.postShare.findFirst({
      where: { userId: req.user.id, postId: req.params.id },
    });

    if (existing) {
      await prisma.postShare.delete({ where: { id: existing.id } });
      return success(res, { shared: false }, 'Post unshared');
    }

    const share = await prisma.postShare.create({
      data: {
        userId: req.user.id,
        postId: req.params.id,
        note: note?.trim() || null,
      },
    });

    await logActivity({
      userId: req.user.id,
      type: 'community_post',
      title: `Shared a post: "${post.title.slice(0, 60)}"`,
      postId: post.id,
    });

    return created(res, { shared: true, shareId: share.id }, 'Post shared successfully');
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to share post');
  }
});

// ── GET /shared — get user's shared posts ──────────────────────────────────
router.get('/user/:userId/shared', authenticate, async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * PAGE_SIZE;

    const [shares, total] = await prisma.$transaction([
      prisma.postShare.findMany({
        where: { userId: req.params.userId },
        orderBy: { sharedAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          note: true,
          sharedAt: true,
          post: { select: postSelect },
        },
      }),
      prisma.postShare.count({ where: { userId: req.params.userId } }),
    ]);

    const postIds = shares.map(s => s.post.id);
    const postLikes = postIds.length > 0
      ? await prisma.communityLike.findMany({
          where: { postId: { in: postIds }, commentId: null },
          select: { postId: true, reactionType: true, userId: true },
        })
      : [];

    const data = shares.map(share => ({
      ...share,
      post: decoratePostsWithReactions([share.post], postLikes, req.user.id)[0],
    }));

    return success(res, {
      shares: data,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to fetch shared posts');
  }
});

module.exports = router;