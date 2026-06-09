'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch, getCachedUser } from '@/lib/api';

const navItems = [
  { href: '/dashboard',              icon: 'fa-home',         label: 'Dashboard' },
  { href: '/dashboard/courses',      icon: 'fa-book-open',    label: 'Courses' },
  { href: '/dashboard/community',    icon: 'fa-users',        label: 'Community' },
  { href: '/dashboard/portfolio',    icon: 'fa-layer-group',  label: 'Portfolio' },
  { href: '/dashboard/platforms',    icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs',         icon: 'fa-briefcase',    label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate',  label: 'Certificates' },
  { href: '/dashboard/rewards',      icon: 'fa-coins',        label: 'Rewards' },
  { href: '/dashboard/settings',     icon: 'fa-gear',         label: 'Settings' },
];

function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function Avatar({ user, size = 10 }: { user: any; size?: number }) {
  const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const initials = name.split(' ').filter(Boolean).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors = ['#5b4cf5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];
  const color = colors[(initials.charCodeAt(0) || 0) % colors.length];

  if (user?.avatar) {
    return <img src={user.avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover`} />;
  }

  return (
    <div className={`w-${size} h-${size} rounded-full grid place-items-center text-white font-bold`} style={{ background: color }}>
      {initials}
    </div>
  );
}

export default function CommunityPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id;
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentBody, setEditCommentBody] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const currentUser = getCachedUser();

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    setError('');

    apiFetch(`/community/${postId}`)
      .then(res => {
        if (res.success) {
          setPost(res.data);
        } else {
          setError(res.message || 'Unable to load post.');
        }
      })
      .catch(err => setError(err.message || 'Unable to load post.'))
      .finally(() => setLoading(false));
  }, [postId]);

  async function toggleLike() {
    if (!postId || !post) return;
    try {
      const res = await apiFetch(`/community/${postId}/like`, { method: 'POST' });
      if (res.success) {
        setPost((current: any) => current ? {
          ...current,
          likedByMe: res.data.liked,
          likes: current.likes + (res.data.liked ? 1 : -1),
        } : current);
      }
    } catch {
      // ignore
    }
  }

  async function toggleCommentLike(commentId: string) {
    if (!postId || !post) return;
    try {
      const res = await apiFetch(`/community/${postId}/comments/${commentId}/like`, { method: 'POST' });
      if (res.success) {
        setPost((current: any) => current ? {
          ...current,
          comments: current.comments.map((comment: any) => comment.id === commentId ? {
            ...comment,
            likedByMe: res.data.liked,
            likes: comment.likes + (res.data.liked ? 1 : -1),
          } : comment),
        } : current);
      }
    } catch {
      // ignore
    }
  }

  async function submitComment() {
    if (!postId || !commentBody.trim()) return;
    setSavingComment(true);
    try {
      const res = await apiFetch(`/community/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      if (res.success) {
        setPost((current: any) => current ? {
          ...current,
          comments: [...current.comments, res.data],
        } : current);
        setCommentBody('');
      } else {
        setError(res.message || 'Failed to submit comment.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit comment.');
    } finally {
      setSavingComment(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return;
    setDeletingCommentId(commentId);
    try {
      const res = await apiFetch(`/community/${postId}/comments/${commentId}`, { method: 'DELETE' });
      if (res.success) {
        setPost((current: any) => current ? {
          ...current,
          comments: current.comments.filter((c: any) => c.id !== commentId),
        } : current);
      }
    } catch { /* ignore */ }
    finally { setDeletingCommentId(null); }
  }

  async function saveEditComment(commentId: string) {
    if (!editCommentBody.trim()) return;
    try {
      const res = await apiFetch(`/community/${postId}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ body: editCommentBody.trim() }),
      });
      if (res.success) {
        setPost((current: any) => current ? {
          ...current,
          comments: current.comments.map((c: any) =>
            c.id === commentId ? { ...c, body: res.data.body } : c
          ),
        } : current);
        setEditCommentId(null);
        setEditCommentBody('');
      }
    } catch { /* ignore */ }
  }


  return (
    <SidebarLayout navItems={navItems} pageTitle="Community">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <div>
            <h1 className="font-syne font-bold text-[22px]">Community Post</h1>
            <p className="text-[13px] text-[#6b6b8a] mt-1">View the discussion, like the post, and join the conversation.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="px-4 py-2 rounded-xl border border-[#e8e8f0] text-sm text-[#0a0a0f] hover:bg-[#f5f5fb] transition-all">
              Go back
            </button>
            <Link href="/dashboard/community" className="px-4 py-2 rounded-xl bg-[#5b4cf5] text-white text-sm hover:bg-[#4a3de0] transition-all">
              All posts
            </Link>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white border border-[#e8e8f0] p-10 text-center text-[#6b6b8a]">Loading post...</div>
        )}

        {error && !loading && (
          <div className="rounded-2xl bg-[#fef2f2] border border-[#fecaca] p-4 text-[#b91c1c]">{error}</div>
        )}

        {!loading && post && (
          <>
            <div className="rounded-2xl bg-white border border-[#e8e8f0] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar user={post.author} size={12} />
                    <div>
                      <div className="font-semibold text-[#0a0a0f]">{post.author.firstName} {post.author.lastName}</div>
                      {post.author.title && <div className="text-[12px] text-[#6b6b8a]">{post.author.title}</div>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5b4cf5] bg-[#eef2ff] px-3 py-1 rounded-full">{post.type}</span>
                    {post.tags?.length > 0 && post.tags.map((tag: string) => (
                      <span key={tag} className="text-[11px] text-[#3b82f6] bg-[#eff6ff] px-2.5 py-1 rounded-full">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center text-[#6b6b8a]">
                  <span className="inline-flex items-center gap-2 text-[12px] px-3 py-2 rounded-2xl bg-[#f5f5fb]">
                    <i className="far fa-eye" /> {post.views} views
                  </span>
                  <span className="inline-flex items-center gap-2 text-[12px] px-3 py-2 rounded-2xl bg-[#f5f5fb]">
                    <i className="fas fa-comments" /> {post.comments?.length ?? 0} replies
                  </span>
                  <span className="inline-flex items-center gap-2 text-[12px] px-3 py-2 rounded-2xl bg-[#f5f5fb]">
                    <i className="fas fa-heart" /> {post.likes}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="font-syne font-bold text-[18px] text-[#0a0a0f] mb-3">{post.title}</h2>
                <p className="text-[14px] leading-relaxed text-[#4d5563] whitespace-pre-line">{post.body}</p>
                {post.projectUrl && (
                  <a href={post.projectUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-[#3b82f6] hover:text-[#2563eb] text-sm font-semibold no-underline">
                    <i className="fas fa-external-link-alt text-[11px]" />
                    {post.projectUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button onClick={toggleLike} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${post.likedByMe ? 'bg-[#ef4444] text-white' : 'bg-[#f5f5fb] text-[#0a0a0f] hover:bg-[#e5e7eb]'}`}>
                  <i className={`${post.likedByMe ? 'fas' : 'far'} fa-heart`} />
                  {post.likedByMe ? 'Unlike' : 'Like'}
                </button>
                <span className="text-sm text-[#6b7280]">Updated {timeAgo(post.updatedAt || post.createdAt)}</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-[#e8e8f0] p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-syne font-bold text-[17px]">Discussion</h3>
                  <p className="text-[13px] text-[#6b6b8a]">Replies from the community on this post.</p>
                </div>
                <span className="text-[12px] text-[#6b7280]">{post.comments?.length ?? 0} comments</span>
              </div>

              <div className="space-y-4">
                {post.comments?.length > 0 ? post.comments.map((comment: any) => (
                  <div key={comment.id} className="rounded-2xl bg-[#f8fafc] p-4 border border-[#e5e7eb]">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar user={comment.author} size={10} />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-[#0f172a] text-[13px]">{comment.author.firstName} {comment.author.lastName}</span>
                          {comment.author.title && <span className="text-[11px] text-[#6b7280]">{comment.author.title}</span>}
                        </div>
                        <div className="text-[12px] text-[#6b7280]">{timeAgo(comment.createdAt)}</div>
                      </div>
                      {currentUser?.id === comment.author?.id && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => { setEditCommentId(comment.id); setEditCommentBody(comment.body); }}
                            className="w-7 h-7 rounded-lg bg-[#f4f2ff] text-[#5b4cf5] border-0 cursor-pointer grid place-items-center text-[11px] hover:bg-[#5b4cf5] hover:text-white transition-all"
                            title="Edit comment">
                            <i className="fas fa-pen" />
                          </button>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            className="w-7 h-7 rounded-lg bg-[#fef2f2] text-[#ef4444] border-0 cursor-pointer grid place-items-center text-[11px] hover:bg-[#ef4444] hover:text-white transition-all disabled:opacity-40"
                            title="Delete comment">
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editCommentId === comment.id ? (
                      <div className="mt-1">
                        <textarea
                          value={editCommentBody}
                          onChange={e => setEditCommentBody(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-[#d1d5db] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all resize-none"
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => saveEditComment(comment.id)}
                            className="px-4 py-1.5 bg-[#5b4cf5] text-white rounded-lg text-[12px] font-semibold border-0 cursor-pointer hover:bg-[#4a3de0] transition-all">
                            Save
                          </button>
                          <button onClick={() => { setEditCommentId(null); setEditCommentBody(''); }}
                            className="px-4 py-1.5 bg-white text-[#6b7280] rounded-lg text-[12px] font-semibold border border-[#e5e7eb] cursor-pointer hover:bg-[#f8fafc] transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[14px] text-[#334155] leading-relaxed">{comment.body}</p>
                    )}
                    <div className="mt-4 flex items-center gap-3 text-[12px] text-[#6b7280]">
                      <button onClick={() => toggleCommentLike(comment.id)} className={`inline-flex items-center gap-2 border border-transparent rounded-full px-3 py-1.5 transition-all ${comment.likedByMe ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-white hover:bg-[#f8fafc]'}`}>
                        <i className={`${comment.likedByMe ? 'fas' : 'far'} fa-heart`} />
                        {comment.likes}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-[#e5e7eb] p-6 text-center text-[#6b7280]">
                    No comments yet. Be the first to join the discussion.
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-[#f8fafc] p-5 border border-[#e5e7eb]">
                <h4 className="font-semibold text-[15px] mb-3">Add a comment</h4>
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  rows={4}
                  placeholder="Write your reply..."
                  className="w-full rounded-2xl border border-[#d1d5db] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.12)] transition-all resize-none"
                />
                <div className="mt-4 flex flex-wrap gap-3 items-center">
                  <button
                    onClick={submitComment}
                    disabled={savingComment || !commentBody.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5b4cf5] text-white text-sm font-semibold hover:bg-[#4a3de0] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingComment ? 'Posting…' : 'Post comment'}
                  </button>
                  <span className="text-[12px] text-[#6b7280]">Comments are visible to the community.</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}