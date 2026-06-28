'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',             icon: 'fa-home',          label: 'Dashboard' },
  { href: '/dashboard/courses',     icon: 'fa-book-open',     label: 'Courses' },
  {
    icon: 'fa-sparkles',
    label: 'Next Gen',
    children: [
      { href: '/dashboard/career-oracle',   icon: 'fa-brain',               label: 'Career Oracle' },
      { href: '/dashboard/skill-coach',     icon: 'fa-heart-pulse',         label: 'Skill Coach' },
      { href: '/dashboard/skill-decay',     icon: 'fa-chart-line',          label: 'Skill Decay' },
      { href: '/dashboard/peer-genome',     icon: 'fa-users',               label: 'Peer Genome' },
      { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles', label: 'Ghost Recruiter' },
    ],
  },
  { href: '/dashboard/community',   icon: 'fa-users',         label: 'Community' },
  { href: '/dashboard/portfolio',   icon: 'fa-layer-group',   label: 'Portfolio' },
  { href: '/dashboard/resume',        icon: 'fa-file-lines',           label: 'Resume' },
  { href: '/dashboard/platforms',   icon: 'fa-graduation-cap',label: 'Learning Platforms' },
  { href: '/dashboard/jobs',        icon: 'fa-briefcase',     label: 'Jobs' },
  { href: '/dashboard/certificates',icon: 'fa-certificate',   label: 'Certificates' },
  { href: '/dashboard/rewards',     icon: 'fa-coins',         label: 'Rewards' },
  { href: '/dashboard/settings',    icon: 'fa-gear',          label: 'Settings' },
];

/* ── Design tokens (matches all other dashboard pages) ─────────────────── */
const D = {
  bg:      '#080E19',
  card:    '#0F1521',
  card2:   '#0D1525',
  border:  'rgba(255,255,255,0.07)',
  accent:  '#4F8EF7',
  green:   '#00E5A0',
  amber:   '#F59E0B',
  red:     '#F87171',
  purple:  '#A78BFA',
  text:    'rgba(255,255,255,0.85)',
  subtext: 'rgba(255,255,255,0.45)',
  muted:   'rgba(255,255,255,0.25)',
  input:   'rgba(255,255,255,0.06)',
};

const TYPE_COLORS: Record<string, string> = {
  discussion: '#4F8EF7',
  project:    '#00E5A0',
  resource:   '#38BDF8',
  question:   '#F59E0B',
  showcase:   '#F87171',
};

function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60)    return 'Just now';
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function Avatar({ user, size = 36 }: { user: any; size?: number }) {
  const name     = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const initials = name.split(' ').filter(Boolean).map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || '?';
  const palette  = [D.accent, D.green, D.amber, '#38BDF8', D.red, D.purple];
  const color    = palette[(initials.charCodeAt(0) || 0) % palette.length];
  const style    = { width: size, height: size, borderRadius: '50%', flexShrink: 0 };

  if (user?.avatar) {
    return <img src={user.avatar} alt={name} style={{ ...style, objectFit: 'cover', border: `2px solid ${D.border}` }} />;
  }
  return (
    <div style={{ ...style, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function Skeleton({ w = '100%', h = 16 }: { w?: string; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 8, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />;
}

export default function CommunityPostPage() {
  const params  = useParams();
  const router  = useRouter();
  const postId  = params?.id as string;

  const [post,              setPost]              = useState<any | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [err,               setErr]               = useState('');
  const [commentBody,       setCommentBody]       = useState('');
  const [savingComment,     setSavingComment]     = useState(false);
  const [editCommentId,     setEditCommentId]     = useState<string | null>(null);
  const [editCommentBody,   setEditCommentBody]   = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    apiFetch('/auth/me').then(r => { if (r.success && r.data) setCurrentUser(r.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!postId) return;
    setLoading(true); setErr('');
    apiFetch(`/community/${postId}`)
      .then(res => { if (res.success) setPost(res.data); else setErr(res.message || 'Unable to load post.'); })
      .catch(e  => setErr(e.message || 'Unable to load post.'))
      .finally(() => setLoading(false));
  }, [postId]);

  async function toggleLike() {
    if (!postId || !post) return;
    const res = await apiFetch(`/community/${postId}/like`, { method: 'POST' }).catch(() => null);
    if (res?.success) setPost((p: any) => p ? { ...p, likedByMe: res.data.liked, likes: p.likes + (res.data.liked ? 1 : -1) } : p);
  }

  async function toggleCommentLike(commentId: string) {
    const res = await apiFetch(`/community/${postId}/comments/${commentId}/like`, { method: 'POST' }).catch(() => null);
    if (res?.success) {
      setPost((p: any) => p ? { ...p, comments: p.comments.map((c: any) => c.id === commentId ? { ...c, likedByMe: res.data.liked, likes: c.likes + (res.data.liked ? 1 : -1) } : c) } : p);
    }
  }

  async function submitComment() {
    if (!postId || !commentBody.trim()) return;
    setSavingComment(true);
    try {
      const res = await apiFetch(`/community/${postId}/comments`, { method: 'POST', body: JSON.stringify({ body: commentBody.trim() }) });
      if (res.success) { setPost((p: any) => p ? { ...p, comments: [...p.comments, res.data] } : p); setCommentBody(''); }
      else setErr(res.message || 'Failed to submit comment.');
    } catch (e: any) { setErr(e.message || 'Failed to submit comment.'); }
    finally { setSavingComment(false); }
  }

  async function deleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return;
    setDeletingCommentId(commentId);
    const res = await apiFetch(`/community/${postId}/comments/${commentId}`, { method: 'DELETE' }).catch(() => null);
    if (res?.success) setPost((p: any) => p ? { ...p, comments: p.comments.filter((c: any) => c.id !== commentId) } : p);
    setDeletingCommentId(null);
  }

  async function saveEditComment(commentId: string) {
    if (!editCommentBody.trim()) return;
    const res = await apiFetch(`/community/${postId}/comments/${commentId}`, { method: 'PUT', body: JSON.stringify({ body: editCommentBody.trim() }) }).catch(() => null);
    if (res?.success) {
      setPost((p: any) => p ? { ...p, comments: p.comments.map((c: any) => c.id === commentId ? { ...c, body: res.data.body } : c) } : p);
      setEditCommentId(null); setEditCommentBody('');
    }
  }

  const typeColor = post ? (TYPE_COLORS[post.type] || D.accent) : D.accent;

  return (
    <SidebarLayout navItems={navItems} pageTitle="Community">
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: D.text }}>

        {/* ── Header bar ──────────────────────────────────────────────── */}
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontWeight: 800, fontSize: 22, margin: 0, color: '#fff' }}>Community Post</h1>
            <p style={{ fontSize: 13, color: D.subtext, margin: '4px 0 0' }}>View the discussion, like the post, and join the conversation.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.back()}
              style={{ padding: '8px 18px', borderRadius: 12, border: `1px solid ${D.border}`, background: D.input, color: D.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ← Go back
            </button>
            <Link href="/dashboard/community"
              style={{ padding: '8px 18px', borderRadius: 12, background: D.accent, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              All posts
            </Link>
          </div>
        </div>

        {/* ── Loading skeleton ─────────────────────────────────────────── */}
        {loading && (
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Skeleton w="44px" h={44} /><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton w="35%" /><Skeleton w="20%" h={10} /></div>
            </div>
            <Skeleton w="70%" h={22} /><Skeleton /><Skeleton w="85%" /><Skeleton w="60%" />
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────────────── */}
        {err && !loading && (
          <div style={{ background: `${D.red}15`, border: `1px solid ${D.red}40`, borderRadius: 16, padding: '14px 20px', color: D.red, fontSize: 14 }}>
            ⚠️ {err}
          </div>
        )}

        {/* ── Post body ────────────────────────────────────────────────── */}
        {!loading && post && (
          <>
            <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: 28 }}>

              {/* Author row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar user={post.author} size={46} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{post.author.firstName} {post.author.lastName}</div>
                    {post.author.title && <div style={{ fontSize: 12, color: D.subtext, marginTop: 2 }}>{post.author.title}</div>}
                  </div>
                </div>

                {/* Meta badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}30`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {post.type}
                  </span>
                  {post.tags?.map((tag: string) => (
                    <span key={tag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: `${D.accent}12`, color: D.accent }}>#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {[
                  { icon: 'fa-eye',      val: `${post.views} views`               },
                  { icon: 'fa-comments', val: `${post.comments?.length ?? 0} replies` },
                  { icon: 'fa-heart',    val: `${post.likes} likes`               },
                ].map(s => (
                  <span key={s.icon} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 14px', borderRadius: 20, background: D.input, color: D.subtext }}>
                    <i className={`fas ${s.icon}`} style={{ fontSize: 11 }} /> {s.val}
                  </span>
                ))}
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, color: D.muted, marginLeft: 'auto' }}>
                  Updated {timeAgo(post.updatedAt || post.createdAt)}
                </span>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: D.border, marginBottom: 20 }} />

              {/* Title + body */}
              <h2 style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontWeight: 800, fontSize: 22, color: '#fff', margin: '0 0 12px' }}>{post.title}</h2>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: D.text, whiteSpace: 'pre-line', margin: 0 }}>{post.body}</p>

              {post.projectUrl && (
                <a href={post.projectUrl} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, color: '#38BDF8', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  <i className="fas fa-external-link-alt" style={{ fontSize: 11 }} />
                  {post.projectUrl.replace(/^https?:\/\//, '')}
                </a>
              )}

              {/* Like button */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${D.border}` }}>
                <button onClick={toggleLike}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '9px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                    background: post.likedByMe ? `${D.red}20` : D.input,
                    color:      post.likedByMe ? D.red       : D.subtext,
                    boxShadow:  post.likedByMe ? `0 0 0 1.5px ${D.red}` : 'none',
                  }}>
                  <i className={`${post.likedByMe ? 'fas' : 'far'} fa-heart`} />
                  {post.likedByMe ? 'Unlike' : 'Like'} · {post.likes}
                </button>
              </div>
            </div>

            {/* ── Comments section ──────────────────────────────────────── */}
            <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: 28 }}>

              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-jakarta, sans-serif)', fontWeight: 800, fontSize: 17, margin: 0, color: '#fff' }}>Discussion</h3>
                  <p style={{ fontSize: 13, color: D.subtext, margin: '4px 0 0' }}>Replies from the community on this post.</p>
                </div>
                <span style={{ fontSize: 12, color: D.muted, background: D.input, padding: '4px 12px', borderRadius: 20 }}>
                  {post.comments?.length ?? 0} comments
                </span>
              </div>

              {/* Comment list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {post.comments?.length > 0 ? post.comments.map((comment: any) => (
                  <div key={comment.id} style={{ background: D.card2, border: `1px solid ${D.border}`, borderRadius: 16, padding: '16px 18px' }}>

                    {/* Comment author row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <Avatar user={comment.author} size={34} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{comment.author.firstName} {comment.author.lastName}</span>
                          {comment.author.title && <span style={{ fontSize: 11, color: D.muted }}>{comment.author.title}</span>}
                          <span style={{ fontSize: 11, color: D.muted, marginLeft: 'auto' }}>{timeAgo(comment.createdAt)}</span>
                        </div>
                      </div>

                      {/* Edit / delete (own comments) */}
                      {currentUser?.id === comment.author?.id && (
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => { setEditCommentId(comment.id); setEditCommentBody(comment.body); }}
                            title="Edit comment"
                            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: `${D.accent}18`, color: D.accent, display: 'grid', placeItems: 'center', fontSize: 11 }}>
                            <i className="fas fa-pen" />
                          </button>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            disabled={deletingCommentId === comment.id}
                            title="Delete comment"
                            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: `${D.red}18`, color: D.red, display: 'grid', placeItems: 'center', fontSize: 11, opacity: deletingCommentId === comment.id ? 0.4 : 1 }}>
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Edit mode */}
                    {editCommentId === comment.id ? (
                      <div>
                        <textarea
                          value={editCommentBody}
                          onChange={e => setEditCommentBody(e.target.value)}
                          rows={3}
                          style={{ width: '100%', background: D.input, border: `1px solid ${D.border}`, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: D.text, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button onClick={() => saveEditComment(comment.id)}
                            style={{ padding: '7px 18px', borderRadius: 10, border: 'none', background: D.accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Save
                          </button>
                          <button onClick={() => { setEditCommentId(null); setEditCommentBody(''); }}
                            style={{ padding: '7px 18px', borderRadius: 10, border: `1px solid ${D.border}`, background: D.input, color: D.subtext, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: 14, color: D.text, lineHeight: 1.65, margin: 0 }}>{comment.body}</p>
                    )}

                    {/* Comment like */}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${D.border}` }}>
                      <button onClick={() => toggleCommentLike(comment.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          background: comment.likedByMe ? `${D.red}18` : D.input,
                          color:      comment.likedByMe ? D.red       : D.muted,
                        }}>
                        <i className={`${comment.likedByMe ? 'fas' : 'far'} fa-heart`} style={{ fontSize: 11 }} />
                        {comment.likes}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div style={{ border: `1px dashed ${D.border}`, borderRadius: 16, padding: '32px 20px', textAlign: 'center', color: D.muted, fontSize: 14 }}>
                    No comments yet. Be the first to join the discussion.
                  </div>
                )}
              </div>

              {/* Add comment box */}
              <div style={{ marginTop: 24, background: D.card2, border: `1px solid ${D.border}`, borderRadius: 16, padding: '20px 22px' }}>
                <h4 style={{ fontWeight: 700, fontSize: 15, color: '#fff', margin: '0 0 14px' }}>Add a comment</h4>
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  rows={4}
                  placeholder="Write your reply…"
                  style={{ width: '100%', background: D.input, border: `1px solid ${D.border}`, borderRadius: 14, padding: '12px 16px', fontSize: 14, color: D.text, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
                />
                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
                  <button
                    onClick={submitComment}
                    disabled={savingComment || !commentBody.trim()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 24px', borderRadius: 12, border: 'none',
                      background: D.accent, color: '#fff', fontSize: 14, fontWeight: 700,
                      cursor: savingComment || !commentBody.trim() ? 'not-allowed' : 'pointer',
                      opacity: savingComment || !commentBody.trim() ? 0.55 : 1,
                    }}>
                    {savingComment ? <><i className="fas fa-spinner fa-spin" /> Posting…</> : 'Post comment'}
                  </button>
                  <span style={{ fontSize: 12, color: D.muted }}>Comments are visible to the community.</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}