/**
 * Community Platform Routes
 * POST /api/v1/community
 */
const express  = require('express');
const router   = express.Router();
const prisma   = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, created, badRequest, notFound, error } = require('../utils/response');

const PAGE_SIZE = 15;

// ── Helpers ────────────────────────────────────────────────────────────────
const postSelect = {
  id: true, title: true, body: true, type: true, tags: true,
  imageUrl: true, projectUrl: true, likes: true, views: true,
  isPinned: true, createdAt: true, updatedAt: true,
  author: { select: { id: true, firstName: true, lastName: true, avatar: true, title: true } },
  _count: { select: { comments: true } },
};

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

    // Attach liked-by-me flag
    const likedPostIds = new Set(
      (await prisma.communityLike.findMany({
        where: { userId: req.user.id, postId: { not: null }, commentId: null },
        select: { postId: true },
      })).map(l => l.postId)
    );

      const data = posts.map(p => ({ ...p, likedByMe: likedPostIds.has(p.id) }));

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

    return created(res, post, 'Post created successfully');
  } catch (e) {
    console.error(e);
    return error(res, 'Failed to create post');
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
    const [postLike, commentLikes] = await prisma.$transaction([
      prisma.communityLike.findFirst({ where: { userId: req.user.id, postId: post.id } }),
      prisma.communityLike.findMany({
        where: { userId: req.user.id, commentId: { not: null } },
        select: { commentId: true },
      }),
    ]);

    const likedCommentIds = new Set(commentLikes.map(l => l.commentId));

    return success(res, {
      ...post,
      likedByMe: !!postLike,
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
    return error(res, 'Failed to delete post');
  }
});

// ── POST /:id/like  — toggle like ─────────────────────────────────────────
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const existing = await prisma.communityLike.findFirst({
      where: { userId: req.user.id, postId: req.params.id, commentId: null },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.communityLike.delete({ where: { id: existing.id } }),
        prisma.communityPost.update({ where: { id: req.params.id }, data: { likes: { decrement: 1 } } }),
      ]);
      return success(res, { liked: false });
    } else {
      await prisma.$transaction([
        prisma.communityLike.create({ data: { userId: req.user.id, postId: req.params.id } }),
        prisma.communityPost.update({ where: { id: req.params.id }, data: { likes: { increment: 1 } } }),
      ]);
      return success(res, { liked: true });
    }
  } catch (e) {
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
    return error(res, 'Failed to delete comment');
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
    return error(res, 'Failed to toggle comment like');
  }
});

// ── GET /stats/overview  — community stats ────────────────────────────────
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
    return error(res, 'Failed to fetch stats');
  }
});

module.exports = router;