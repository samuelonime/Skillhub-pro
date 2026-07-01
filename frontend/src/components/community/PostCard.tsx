'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const D = {
  card: '#0F1521',
  border: 'rgba(255,255,255,0.07)',
  accent: '#4F8EF7',
  green: '#00E5A0',
  amber: '#F59E0B',
  red: '#F87171',
  muted: 'rgba(255,255,255,0.35)',
  text: 'rgba(255,255,255,0.85)',
  subtext: 'rgba(255,255,255,0.45)',
  input: 'rgba(255,255,255,0.06)',
  hover: 'rgba(255,255,255,0.04)',
};

const REACTIONS = ['👍', '🔥', '🚀', '💯'];

export function PostCard({ post, onRefresh, isLoggedIn }: {
  post: any;
  onRefresh?: () => void;
  isLoggedIn?: boolean;
}) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [reactionType, setReactionType] = useState(post.reactionType);
  const [reactions, setReactions] = useState(post.reactions || {});
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const reactionRef = useRef<HTMLDivElement>(null);

  async function handleLike(reaction = '👍') {
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    try {
      const res = await apiFetch(`/community/${post.id}/like`, {
        method: 'POST',
        body: JSON.stringify({ reactionType: reaction }),
      });
      if (res.success) {
        setLiked(res.data.liked);
        setReactionType(res.data.reactionType);
        setReactions(res.data.reactions || {});
        setShowReactions(false);
      }
    } catch (e) {
      console.error('Like failed:', e);
    }
  }

  async function loadComments() {
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    if (showComments) {
      setShowComments(false);
      return;
    }
    try {
      const res = await apiFetch(`/community/${post.id}`);
      if (res.success) {
        setComments(res.data.comments || []);
      }
    } catch (e) {
      console.error('Failed to load comments:', e);
    }
    setShowComments(true);
  }

  async function addComment() {
    if (!newComment.trim()) return;
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch(`/community/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: newComment }),
      });
      if (res.success) {
        setComments([...comments, res.data]);
        setNewComment('');
        onRefresh?.();
      }
    } catch (e) {
      console.error('Comment failed:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch(`/community/${post.id}/share`, {
        method: 'POST',
        body: JSON.stringify({ note: shareNote }),
      });
      if (res.success) {
        setShared(res.data.shared);
        setShowShareModal(false);
        setShareNote('');
      }
    } catch (e) {
      console.error('Share failed:', e);
    } finally {
      setLoading(false);
    }
  }

  const totalLikes = (Object.values(reactions).reduce((a: any, b: any) => a + b, 0) as number);

  return (
    <div style={{ background: D.card, border: `1px solid ${D.border}` }} className="rounded-2xl p-5 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={{ background: D.input }}>
            {post.author?.avatar ? (
              <Image
                src={post.author.avatar}
                alt={post.author.firstName}
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              {post.author?.firstName} {post.author?.lastName}
            </div>
            <div className="text-xs" style={{ color: D.subtext }}>
              {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: D.input, color: D.amber }}>
          {post.type}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-base font-bold text-white mb-2">{post.title}</h3>
      <p className="text-sm mb-3" style={{ color: D.text }}>{post.body}</p>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {post.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="text-xs px-2 py-1 rounded-full" style={{ background: D.input, color: D.accent }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Interaction Bar */}
      <div className="flex gap-4 text-sm" style={{ borderTop: `1px solid ${D.border}`, paddingTop: '12px' }}>
        {/* Likes */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="flex items-center gap-2 transition-colors"
            style={{ color: liked ? D.green : D.subtext }}
          >
            <i className="fas fa-heart" />
            <span>{totalLikes}</span>
          </button>
          {showReactions && (
            <div
              ref={reactionRef}
              className="absolute bottom-8 left-0 flex gap-2 p-2 rounded-lg z-50"
              style={{ background: D.card, border: `1px solid ${D.border}` }}
            >
              {REACTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleLike(r)}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <button
          onClick={loadComments}
          className="flex items-center gap-2 transition-colors"
          style={{ color: D.subtext }}
        >
          <i className="fas fa-comment" />
          <span>{post._count?.comments || 0}</span>
        </button>

        {/* Share */}
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 transition-colors"
          style={{ color: shared ? D.green : D.subtext }}
        >
          <i className="fas fa-share" />
          <span>{shared ? 'Shared' : 'Share'}</span>
        </button>

        {/* Views */}
        <div className="flex items-center gap-2 ml-auto" style={{ color: D.muted }}>
          <i className="fas fa-eye" />
          <span>{post.views}</span>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{ borderTop: `1px solid ${D.border}`, marginTop: '12px', paddingTop: '12px' }}>
          {/* Add Comment */}
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none text-white"
              style={{ background: D.input, border: `1px solid ${D.border}` }}
              onKeyPress={(e) => e.key === 'Enter' && addComment()}
            />
            <button
              onClick={addComment}
              disabled={loading || !newComment.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: D.accent }}
            >
              {loading ? '...' : 'Post'}
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2" style={{ paddingLeft: '8px' }}>
                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: D.input }}>
                  {comment.author?.avatar ? (
                    <Image
                      src={comment.author.avatar}
                      alt={comment.author.firstName}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                      {comment.author?.firstName?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">
                      {comment.author?.firstName} {comment.author?.lastName}
                    </span>
                    <span className="text-xs" style={{ color: D.muted }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: D.text }}>
                    {comment.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: D.card, border: `1px solid ${D.border}` }}>
            <h3 className="text-lg font-bold text-white mb-4">Share this post</h3>
            <textarea
              value={shareNote}
              onChange={(e) => setShareNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white mb-4 resize-none"
              style={{ background: D.input, border: `1px solid ${D.border}` }}
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                style={{ background: D.input, color: D.text }}
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: D.green }}
              >
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
