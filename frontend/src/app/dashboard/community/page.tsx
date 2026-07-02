'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',             icon: 'fa-home',          label: 'Dashboard' },
  { href: '/dashboard/courses',     icon: 'fa-book-open',     label: 'Courses' },
  {
    icon: 'fa-sparkles',
    label: 'Next Generation',
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
  { href: '/dashboard/resume',        icon: 'fa-file-lines',  label: 'Resume' },
  { href: '/dashboard/platforms',   icon: 'fa-graduation-cap',label: 'Learning Platforms' },
  { href: '/dashboard/jobs',        icon: 'fa-briefcase',     label: 'Jobs' },
  { href: '/dashboard/certificates',icon: 'fa-certificate',   label: 'Certificates' },
  { href: '/dashboard/rewards',     icon: 'fa-coins',         label: 'Rewards' },
  { href: '/dashboard/settings',    icon: 'fa-gear',          label: 'Settings' },
];

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const D = {
  card:    'var(--card-bg)',
  border:  'var(--card-border)',
  accent:  '#4F8EF7',
  green:   '#00E5A0',
  amber:   '#F59E0B',
  purple:  '#A78BFA',
  red:     '#F87171',
  muted:   'var(--text-ghost)',
  text:    'var(--text-body)',
  subtext: 'var(--text-faint)',
  input:   'var(--input-bg)',
  hover:   'var(--surface-soft)',
};

const POST_TYPES = [
  { value: '',           label: 'All',        icon: 'fa-globe'           },
  { value: 'discussion', label: 'Discussion', icon: 'fa-comments'        },
  { value: 'project',    label: 'Project',    icon: 'fa-code'            },
  { value: 'resource',   label: 'Resource',   icon: 'fa-link'            },
  { value: 'question',   label: 'Question',   icon: 'fa-question-circle' },
  { value: 'showcase',   label: 'Showcase',   icon: 'fa-star'            },
];

const TYPE_META: Record<string, { color: string; icon: string }> = {
  discussion: { color: D.accent,  icon: 'fa-comments'        },
  project:    { color: D.green,   icon: 'fa-code'            },
  resource:   { color: '#38BDF8', icon: 'fa-link'            },
  question:   { color: D.amber,   icon: 'fa-question-circle' },
  showcase:   { color: D.red,     icon: 'fa-star'            },
};

// ── Activity type display metadata ─────────────────────────────────────────
const ACTIVITY_META: Record<string, { icon: string; color: string; label: string }> = {
  course_enrolled:          { icon: '📚', color: D.accent,  label: 'Enrolled in a course' },
  course_completed:         { icon: '🎓', color: D.green,   label: 'Completed a course' },
  course_progress:          { icon: '⚡', color: D.amber,   label: 'Course milestone' },
  digital_skills_enrolled:  { icon: '🌐', color: D.purple,  label: 'Joined Digital Skills' },
  digital_skills_completed: { icon: '🏅', color: D.green,   label: 'Completed Digital Skills' },
  badge_earned:             { icon: '🏆', color: D.amber,   label: 'Earned a badge' },
  certificate_added:        { icon: '📜', color: '#38BDF8', label: 'Added a certificate' },
  project_added:            { icon: '🚀', color: '#F472B6', label: 'Published a project' },
  job_applied:              { icon: '💼', color: D.green,   label: 'Applied to a job' },
  job_saved:                { icon: '🔖', color: D.muted,   label: 'Saved a job' },
  skill_added:              { icon: '✨', color: D.purple,  label: 'Added a new skill' },
  community_post:           { icon: '💬', color: D.amber,   label: 'Shared in Community' },
  resume_generated:         { icon: '📄', color: '#38BDF8', label: 'Generated AI resume' },
  profile_completed:        { icon: '👤', color: D.accent,  label: 'Completed profile' },
  streak_milestone:         { icon: '🔥', color: D.red,     label: 'Learning streak' },
};

function timeAgo(d: string) {
  if (!d) return '';
  const t = new Date(d).getTime();
  if (isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Avatar({ user, size = 9 }: { user: any; size?: number }) {
  const [failed, setFailed] = useState(false);
  const name     = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const initials = name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors   = [D.accent, D.green, D.amber, '#38BDF8', D.red, D.purple];
  const color    = colors[(initials.charCodeAt(0) || 0) % colors.length];
  const avatarUrl = typeof user?.avatar === 'string' && isAllowedCommunityImage(user.avatar) && !failed ? user.avatar : '';

  if (avatarUrl) {
    return (
      <div className={`relative w-${size} h-${size} shrink-0 overflow-hidden rounded-full`} style={{ border: `2px solid ${D.border}` }}>
        <Image
          src={avatarUrl}
          alt={name || 'Community member'}
          fill
          sizes="64px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`w-${size} h-${size} rounded-full shrink-0 grid place-items-center font-bold text-white text-xs`} style={{ background: color }}>
      {initials}
    </div>
  );
}

function Skeleton({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-xl animate-pulse`} style={{ background: 'var(--surface-soft)' }} />;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: D.card, border: `1px solid ${D.border}` }}>
      {children}
    </div>
  );
}

/* ── Media helpers ───────────────────────────────────────────────────────── */
function detectMediaType(url: string) {
  if (!url) return 'image';
  const lower = url.toLowerCase();
  if (/\.(mp4|webm|mov)/.test(lower)) return 'video';
  if (lower.includes('.gif') || lower.includes('giphy')) return 'gif';
  return 'image';
}
function normalizeExternalLink(url: string) {
  if (!url) return '';
  const t = url.trim();
  if (/^https?:\/\//i.test(t) || t.startsWith('/')) return t;
  return `https://${t}`;
}

const ALLOWED_COMMUNITY_IMAGE_HOSTS = new Set([
  'res.cloudinary.com',
  'ui-avatars.com',
  'randomuser.me',
  'placehold.co',
  'images.unsplash.com',
  'upload.wikimedia.org',
  'meritlives.com',
  'skillhub.meritlives.com',
]);

function isAllowedCommunityImage(url: string) {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    return ALLOWED_COMMUNITY_IMAGE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function communityCoverFor(type?: string) {
  if (type === 'project') return '/community-covers/project.svg';
  if (type === 'showcase') return '/community-covers/showcase.svg';
  if (type === 'discussion' || type === 'question' || type === 'resource') return '/community-covers/discussion.svg';
  return '/community-covers/default.svg';
}

function SafeImageMedia({ src, alt, className, fallbackType, sizes, maxHeightClass }: {
  src?: string;
  alt: string;
  className?: string;
  fallbackType?: string;
  sizes?: string;
  maxHeightClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  const allowed = src ? isAllowedCommunityImage(src) : false;
  const showFallback = !src || failed || !allowed;

  return (
    <div className={`relative w-full overflow-hidden ${maxHeightClass || ''}`}>
      {showFallback ? (
        <Image
          src={communityCoverFor(fallbackType)}
          alt=""
          fill
          sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
          className="object-cover"
          unoptimized
        />
      ) : (
        <Image
          src={src!}
          alt={alt}
          fill
          sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
          className={className || 'object-cover'}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function MediaPreview({ url, type }: { url: string; type: string }) {
  if (!url) return null;
  const cls = 'mt-3 rounded-xl overflow-hidden';
  const borderStyle = { border: `1px solid ${D.border}` };
  if (type === 'video') return <div className={cls} style={borderStyle}><video src={url} controls className="w-full max-h-72" /></div>;
  return (
    <div className={cls} style={borderStyle}>
      <div className="relative max-h-72 min-h-54 w-full">
        <SafeImageMedia src={url} alt="Post media" fallbackType={type} maxHeightClass="max-h-72 min-h-54" />
      </div>
    </div>
  );
}

/* ── Stats bar ───────────────────────────────────────────────────────────── */
function StatsBar({ stats }: { stats: any }) {
  const items = [
    { icon: 'fa-file-alt',  color: D.accent,  label: 'Posts',       value: stats?.totalPosts    ?? 5    },
    { icon: 'fa-comments',  color: D.green,   label: 'Replies',     value: stats?.totalComments ?? 179  },
    { icon: 'fa-users',     color: '#38BDF8', label: 'Members',     value: stats?.totalMembers  ?? 1240 },
    { icon: 'fa-fire',      color: D.red,     label: 'Active (7d)', value: stats?.recentActive  ?? 84   },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 mb-5 max-md:grid-cols-2">
      {items.map(it => (
        <div key={it.label} className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-200"
          style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
            style={{ background: `radial-gradient(circle at 20% 20%, ${it.color}12 0%, transparent 60%)` }} />
          <div className="w-10 h-10 rounded-xl grid place-items-center text-[15px] shrink-0" style={{ background: it.color + '18', color: it.color }}>
            <i className={`fas ${it.icon}`} />
          </div>
          <div>
            <div className="font-jakarta font-bold text-[18px] text-white">{(it.value ?? 0).toLocaleString()}</div>
            <div className="text-[11px]" style={{ color: D.muted }}>{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NEW: Activity Feed Component
   ═══════════════════════════════════════════════════════════════════════════ */

function ActivityFeed({ currentUserId, onMessage, onEdit, refreshKey }: {
  currentUserId?: string;
  onMessage: (user: any) => void;
  onEdit: (post: any) => void;
  refreshKey?: number;
}) {
  const [items, setItems]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const filter = '';
  const loaderRef             = useRef<HTMLDivElement>(null);

  // Like a post directly from the feed
  function feedLike(postId: string) {
    apiFetch(`/community/${postId}/like`, { method: 'POST' })
      .then(r => {
        if (r.success) setItems(prev => prev.map(it =>
          it.post?.id === postId
            ? { ...it, post: { ...it.post, likedByMe: r.data.liked, likes: it.post.likes + (r.data.liked ? 1 : -1) } }
            : it));
      })
      .catch(() => {});
  }

  // Delete a post from the feed
  async function feedDelete(postId: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      const res = await apiFetch(`/community/${postId}`, { method: 'DELETE' });
      if (res.success) setItems(prev => prev.filter(it => it.post?.id !== postId));
    } catch { /* ignore */ }
  }

  const fetchFeed = useCallback(async (p: number, f: string) => {
    try {
      const params = new URLSearchParams({ page: String(p), ...(f && { type: f }) });
      const res = await apiFetch(`/community/activity-feed?${params}`);
      if (res.success) {
        setItems(prev => p === 1 ? res.data.activities : [...prev, ...res.data.activities]);
        setHasMore(p < res.data.pages);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { setPage(1); setItems([]); setLoading(true); fetchFeed(1, filter); }, [filter, fetchFeed, refreshKey]);
  useEffect(() => { if (page > 1) fetchFeed(page, filter); }, [page, fetchFeed, filter]);

  // Live updates: every 15s, check page 1 and prepend any brand-new activities.
  // This keeps the feed fresh without disturbing scroll position or pagination.
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const params = new URLSearchParams({ page: '1' });
        if (filter) params.set('type', filter);
        const res = await apiFetch(`/community/activity-feed?${params}`);
        if (!res.success) return;
        const fresh: any[] = res.data.activities || [];
        setItems(prev => {
          if (prev.length === 0) return fresh;
          const existingIds = new Set(prev.map((i: any) => i.id));
          const newOnes = fresh.filter((i: any) => !existingIds.has(i.id));
          return newOnes.length ? [...newOnes, ...prev] : prev;
        });
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(poll);
  }, [filter]);

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) setPage(p => p + 1);
    }, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading]);

  return (
    <div>
      {loading && items.length === 0 && (
        <div className="grid gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-full rounded-2xl p-4 flex flex-col aspect-[4/5]" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <div className="flex items-center gap-3 mb-3">
                <Skeleton h="h-10" w="w-10" /><div className="flex-1"><Skeleton h="h-3" w="w-1/3" /><div className="mt-1.5"><Skeleton h="h-2.5" w="w-1/5" /></div></div>
              </div>
              <Skeleton h="h-4" w="w-3/4" />
              <div className="flex-1" />
              <div className="mt-auto pt-3" style={{ borderTop: `1px solid ${D.border}` }}>
                <Skeleton h="h-3" w="w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl p-14 text-center" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <div className="text-5xl mb-4">🌱</div>
          <h3 className="font-jakarta font-bold text-[16px] text-white mb-2">No activity yet</h3>
          <p className="text-[13px]" style={{ color: D.subtext }}>
            Start learning to see your progress appear here for the whole community!
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {items.map(item => {
          const meta = ACTIVITY_META[item.type] || { icon: '📌', color: D.muted, label: item.type };
          // Posts (discussions, projects, showcases) render as full cards with details
          if (item.type === 'community_post' && item.post) {
            return (
              <PostCard key={item.id} post={item.post} onLike={feedLike}
                onMessage={onMessage} onEdit={onEdit} onDelete={feedDelete}
                currentUserId={currentUserId} />
            );
          }
          return (
            <div key={item.id}
              className="w-full rounded-2xl p-4 aspect-[4/5] flex flex-col hover:-translate-y-0.5 transition-all duration-200"
              style={{ background: D.card, border: `1px solid ${D.border}` }}>

              {/* Main content — grows to fill available space */}
              <div className="flex gap-3 items-start flex-1">
                {/* Activity icon bubble */}
                <div className="w-10 h-10 rounded-xl shrink-0 grid place-items-center text-lg"
                  style={{ background: meta.color + '18', border: `1px solid ${meta.color}30` }}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  {/* User row */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Avatar user={item.user} size={6} />
                    <span className="font-semibold text-[13px] text-white">
                      {item.user.firstName} {item.user.lastName}
                    </span>
                    {item.user.interestNiche && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: D.accent + '18', color: D.accent }}>
                        {item.user.interestNiche}
                      </span>
                    )}
                    <span className="ml-auto text-[11px]" style={{ color: D.muted }}>{timeAgo(item.createdAt)}</span>
                  </div>
                  {/* Title */}
                  <p className="text-[13.5px] font-semibold mb-1" style={{ color: D.text }}>{item.title}</p>
                  {/* Body excerpt */}
                  {item.body && (
                    <p className="text-[12px] mb-1.5" style={{ color: D.subtext }}>
                      {item.body.slice(0, 120)}{item.body.length > 120 ? '…' : ''}
                    </p>
                  )}
                  {/* Type badge */}
                  <span className="inline-block text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: meta.color + '15', color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
              </div>

              {/* Footer — pinned to bottom via mt-auto */}
              <div className="mt-auto pt-3 flex items-center justify-between"
                style={{ borderTop: `1px solid ${D.border}` }}>
                <span className="text-[11px]" style={{ color: D.muted }}>
                  {timeAgo(item.createdAt)}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold"
                  style={{ color: meta.color }}>
                  {meta.icon} {meta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={loaderRef} className="h-10 flex items-center justify-center">
        {!hasMore && items.length > 0 && (
          <span className="text-[12px]" style={{ color: D.muted }}>You're all caught up 🎉</span>
        )}
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ── Post card ───────────────────────────────────────────────────────────── */
function PostCard({ post, onLike, onMessage, onEdit, onDelete, currentUserId }: {
  post: any; onLike: (id: string) => void; onMessage: (user: any) => void;
  onEdit: (post: any) => void; onDelete: (id: string) => void; currentUserId?: string;
}) {
  const tm = TYPE_META[post.type] || TYPE_META.discussion;
  const [shared, setShared] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isOwner = currentUserId && post.author?.id === currentUserId;

  function handleShare(platform?: string) {
    const url  = `${typeof window !== 'undefined' ? window.location.origin : ''}/community/${post.id}`;
    const text = encodeURIComponent(post.title);
    if (platform === 'copy') { navigator.clipboard?.writeText(url).catch(() => {}); setShared(true); setTimeout(() => setShared(false), 2000); }
    else if (platform === 'twitter')  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'whatsapp') window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(url)}`, '_blank');
    setShowShareMenu(false);
  }

  return (
    <div className="rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-200 group"
      style={{ background: D.card, border: `1px solid ${D.border}` }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative cursor-pointer" onClick={() => onMessage(post.author)}>
            <Avatar user={post.author} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: D.green, borderColor: D.card }} />
          </div>
          <div>
            <div className="font-semibold text-[13px] text-white/90">{post.author.firstName} {post.author.lastName}</div>
            {post.author.title && <div className="text-[11px]" style={{ color: D.muted }}>{post.author.title}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full" style={{ background: tm.color + '18', color: tm.color, border: `1px solid ${tm.color}30` }}>
            <i className={`fas ${tm.icon} mr-1`} />{post.type ? post.type.charAt(0).toUpperCase() + post.type.slice(1) : 'Post'}
          </span>
          {post.isPinned && <span className="text-base">📌</span>}
          {isOwner && (
            <div className="relative">
              <button onClick={() => setShowActions(v => !v)}
                className="w-7 h-7 rounded-lg border-0 cursor-pointer grid place-items-center transition-all hover:opacity-80"
                style={{ background: D.input, color: D.muted }}>
                <i className="fas fa-ellipsis-h text-[11px]" />
              </button>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-100" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-101 rounded-2xl overflow-hidden w-37.5 shadow-2xl"
                    style={{ background: 'var(--card-bg)', border: `1px solid ${D.border}` }}>
                    <button onClick={() => { setShowActions(false); onEdit(post); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium border-0 bg-transparent cursor-pointer text-left transition-all hover:opacity-80"
                      style={{ color: D.accent }}><i className="fas fa-pen text-[11px]" /> Edit</button>
                    <button onClick={() => { setShowActions(false); onDelete(post.id); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium border-0 bg-transparent cursor-pointer text-left transition-all hover:opacity-80"
                      style={{ color: D.red }}><i className="fas fa-trash text-[11px]" /> Delete</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <Link href={`/dashboard/community/post/${post.id}`} className="block no-underline group">
        <h3 className="font-jakarta font-bold text-[15px] mb-1.5 leading-snug transition-colors" style={{ color: 'rgba(255,255,255,0.9)' }}
          onMouseEnter={e => (e.currentTarget.style.color = D.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}>
          {post.title}
        </h3>
        <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: D.subtext }}>{post.body}</p>
      </Link>

      {(post.mediaUrl || post.imageUrl) && (
        <MediaPreview url={post.mediaUrl || post.imageUrl} type={post.mediaType || detectMediaType(post.mediaUrl || post.imageUrl)} />
      )}

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.map((tag: string) => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: D.accent + '18', color: D.accent }}>#{tag}</span>
          ))}
        </div>
      )}

      {post.projectUrl && (() => {
        const url = normalizeExternalLink(post.projectUrl);
        return (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2.5 text-[12px] font-medium no-underline transition-colors"
            style={{ color: '#38BDF8' }}>
            <i className="fas fa-external-link-alt text-[10px]" />
            {url.replace(/^https?:\/\//, '').replace(/^\/\//, '').slice(0, 40)}
          </a>
        );
      })()}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3.5 pt-3.5" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="flex items-center gap-2">
          <button onClick={() => onLike(post.id)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-[13px] border-0 cursor-pointer transition-all select-none"
            style={{
              background: post.likedByMe ? D.red + '20' : D.input,
              color: post.likedByMe ? D.red : D.muted,
              boxShadow: post.likedByMe ? `0 0 0 1.5px ${D.red}` : 'none',
            }}>
            <i className={`${post.likedByMe ? 'fas' : 'far'} fa-heart text-[14px]`} />
            <span>{post.likes}</span>
          </button>

          <Link href={`/dashboard/community/post/${post.id}`}
            className="flex items-center gap-1.5 text-[12px] font-medium no-underline transition-colors"
            style={{ color: D.muted }}
            onMouseEnter={e => (e.currentTarget.style.color = D.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = D.muted)}>
            <i className="far fa-comment" />{post._count?.comments ?? 0}
          </Link>

          <span className="flex items-center gap-1.5 text-[12px]" style={{ color: D.muted }}>
            <i className="far fa-eye" />{post.views}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: D.muted }}>{timeAgo(post.createdAt)}</span>
          <div className="relative">
            <button onClick={() => setShowShareMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-[12.5px] border-0 cursor-pointer transition-all"
              style={{ background: shared ? D.green + '20' : D.accent + '18', color: shared ? D.green : D.accent }}>
              <i className={`fas ${shared ? 'fa-check' : 'fa-share-nodes'} text-[13px]`} />
              <span>{shared ? 'Copied!' : 'Share'}</span>
            </button>
            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-100" onClick={() => setShowShareMenu(false)} />
                <div className="absolute right-0 bottom-full mb-2 z-101 rounded-2xl overflow-hidden w-45 shadow-2xl"
                  style={{ background: 'var(--card-bg)', border: `1px solid ${D.border}` }}>
                  <div className="px-3.5 py-2.5" style={{ borderBottom: `1px solid ${D.border}` }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>Share via</p>
                  </div>
                  {[
                    { icon: 'fa-link',               label: 'Copy link',   action: 'copy',      color: D.accent  },
                    { icon: 'fa-brands fa-x-twitter', label: 'X / Twitter', action: 'twitter',   color: '#E2E8F0' },
                    { icon: 'fa-brands fa-linkedin',  label: 'LinkedIn',    action: 'linkedin',  color: '#38BDF8' },
                    { icon: 'fa-brands fa-whatsapp',  label: 'WhatsApp',    action: 'whatsapp',  color: D.green   },
                  ].map(item => (
                    <button key={item.action} onClick={() => handleShare(item.action)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium border-0 bg-transparent cursor-pointer text-left transition-all hover:opacity-80"
                      style={{ color: item.color }}>
                      <i className={`fas ${item.icon}`} />{item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Post Modal ─────────────────────────────────────────────────────── */
function EditPostModal({ post, onClose, onUpdated }: { post: any; onClose: () => void; onUpdated: (u: any) => void }) {
  const [form, setForm] = useState({ title: post.title || '', body: post.body || '', tags: (post.tags || []).join(', '), projectUrl: post.projectUrl || '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) { setErr('Title and body are required.'); return; }
    setSaving(true); setErr('');
    try {
      const tags = form.tags.split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 5);
      const res = await apiFetch(`/community/${post.id}`, { method: 'PUT', body: JSON.stringify({ ...form, tags }) });
      if (res.success) { onUpdated(res.data); onClose(); } else setErr(res.message || 'Failed');
    } catch (e: any) { setErr(e.message || 'Error'); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        style={{ background: 'var(--card-bg)', border: `1px solid ${D.border}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-jakarta font-bold text-[17px] text-white">Edit Post</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border-0 cursor-pointer grid place-items-center"
            style={{ background: D.input, color: D.muted }}><i className="fas fa-times text-sm" /></button>
        </div>
        {err && <div className="rounded-xl px-4 py-2.5 mb-4 text-[13px]" style={{ background: D.red + '20', color: D.red }}>{err}</div>}
        {[
          { label: 'Title', key: 'title', type: 'input' },
          { label: 'Content', key: 'body', type: 'textarea' },
          { label: 'Tags (comma-separated)', key: 'tags', type: 'input' },
          { label: 'Project URL', key: 'projectUrl', type: 'input' },
        ].map(({ label, key, type }) => (
          <div key={key} className="mb-3.5">
            <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: D.muted }}>{label}</label>
            {type === 'textarea'
              ? <textarea value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} rows={5}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] font-[inherit] outline-none transition-all resize-none"
                  style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }} />
              : <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] font-[inherit] outline-none transition-all"
                  style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }} />}
          </div>
        ))}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-[13.5px] font-semibold font-[inherit] cursor-pointer"
            style={{ border: `1px solid ${D.border}`, color: D.muted, background: 'transparent' }}>Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-[13.5px] font-semibold font-[inherit] cursor-pointer disabled:opacity-60 text-white"
            style={{ background: D.accent }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── New Post Modal ──────────────────────────────────────────────────────── */
function NewPostModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: any) => void }) {
  const [form, setForm] = useState({ title: '', body: '', type: 'discussion', tags: '', projectUrl: '', imageUrl: '' });
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr]             = useState('');
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string } | null>(null);
  const [mediaTab, setMediaTab]   = useState<'url' | 'upload'>('url');
  const [mediaUrl, setMediaUrl]   = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleMediaUrl() {
    if (!mediaUrl.trim()) return;
    const isGif  = mediaUrl.toLowerCase().includes('.gif') || mediaUrl.includes('giphy');
    const isVideo = /\.(mp4|webm|mov)/.test(mediaUrl.toLowerCase());
    setMediaPreview({ url: mediaUrl, type: isGif ? 'gif' : isVideo ? 'video' : 'image' });
    setForm(f => ({ ...f, imageUrl: mediaUrl }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const localUrl = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? 'video' : file.type.includes('gif') ? 'gif' : 'image';
    setMediaPreview({ url: localUrl, type });
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('media', file);
      const res = await fetch('/api/v1/community/upload-media', { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');
      URL.revokeObjectURL(localUrl);
      setMediaPreview({ url: data.data.url, type });
      setForm(f => ({ ...f, imageUrl: data.data.url }));
    } catch (err: any) {
      setMediaPreview(null); URL.revokeObjectURL(localUrl);
      if (fileRef.current) fileRef.current.value = '';
      alert(err.message || 'Media upload failed.');
    } finally { setUploading(false); }
  }

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) { setErr('Title and body are required.'); return; }
    setSaving(true); setErr('');
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5);
      const res  = await apiFetch('/community', { method: 'POST', body: JSON.stringify({ ...form, tags, imageUrl: form.imageUrl || undefined, projectUrl: form.projectUrl || undefined }) });
      if (res.success) { onCreated(res.data); onClose(); } else setErr(res.message || 'Failed');
    } catch (e: any) { setErr(e.message || 'Error'); } finally { setSaving(false); }
  }

  const fieldStyle = { background: D.input, border: `1px solid ${D.border}`, color: D.text };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        style={{ background: 'var(--card-bg)', border: `1px solid ${D.border}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-jakarta font-bold text-[17px] text-white">New Post</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border-0 cursor-pointer grid place-items-center"
            style={{ background: D.input, color: D.muted }}><i className="fas fa-times text-sm" /></button>
        </div>
        {err && <div className="rounded-xl px-4 py-2.5 mb-4 text-[13px]" style={{ background: D.red + '20', color: D.red }}>{err}</div>}

        <div className="mb-4">
          <label className="block text-[12px] font-semibold mb-2 uppercase tracking-wide" style={{ color: D.muted }}>Post Type</label>
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.filter(t => t.value).map(t => {
              const tm = TYPE_META[t.value];
              return (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                  style={{
                    background: form.type === t.value ? (tm?.color || D.accent) + '20' : D.input,
                    color: form.type === t.value ? (tm?.color || D.accent) : D.muted,
                    border: `1px solid ${form.type === t.value ? (tm?.color || D.accent) + '50' : D.border}`,
                  }}>
                  <i className={`fas ${t.icon} text-[11px]`} />{t.label}
                </button>
              );
            })}
          </div>
        </div>

        {[
          { label: 'Title',                    key: 'title', type: 'input',    placeholder: "What's on your mind?" },
          { label: 'Content',                  key: 'body',  type: 'textarea', placeholder: 'Share your ideas, projects, or questions...' },
          { label: 'Tags (comma-separated)',    key: 'tags',  type: 'input',    placeholder: 'react, typescript, career' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key} className="mb-3.5">
            <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: D.muted }}>{label}</label>
            {type === 'textarea'
              ? <textarea value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} rows={4} placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] font-[inherit] outline-none transition-all resize-none"
                  style={fieldStyle} />
              : <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] font-[inherit] outline-none transition-all"
                  style={fieldStyle} />}
          </div>
        ))}

        {(form.type === 'project' || form.type === 'showcase') && (
          <div className="mb-3.5">
            <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: D.muted }}>Project URL</label>
            <input value={form.projectUrl} onChange={e => setForm(f => ({ ...f, projectUrl: e.target.value }))} placeholder="https://github.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] font-[inherit] outline-none transition-all" style={fieldStyle} />
          </div>
        )}

        <div className="mb-3.5">
          <label className="block text-[12px] font-semibold mb-2 uppercase tracking-wide" style={{ color: D.muted }}>
            Media <span className="font-normal normal-case" style={{ color: D.muted }}>(image, GIF, or video)</span>
          </label>
          {mediaPreview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${D.border}` }}>
              {mediaPreview.type === 'video'
                ? <video src={mediaPreview.url} controls className="w-full max-h-48" />
                : <img src={mediaPreview.url} alt="" className="w-full max-h-48 object-cover" />}
              <button onClick={() => { setMediaPreview(null); setMediaUrl(''); setForm(f => ({ ...f, imageUrl: '' })); if (fileRef.current) fileRef.current.value = ''; }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full border-0 cursor-pointer grid place-items-center"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                <i className="fas fa-times text-[11px]" />
              </button>
            </div>
          ) : (
            <div className="rounded-xl p-4" style={{ border: `1px dashed ${D.border}`, background: D.input }}>
              <div className="flex gap-1 mb-3 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {(['url', 'upload'] as const).map(tab => (
                  <button key={tab} onClick={() => setMediaTab(tab)}
                    className="flex-1 py-1.5 rounded-md text-[11.5px] font-semibold border-0 cursor-pointer transition-all"
                    style={{ background: mediaTab === tab ? D.card : 'transparent', color: mediaTab === tab ? D.accent : D.muted }}>
                    {tab === 'url' ? '🔗 URL / GIF link' : '📁 Upload file'}
                  </button>
                ))}
              </div>
              {mediaTab === 'url' ? (
                <div className="flex gap-2">
                  <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="Paste image or GIF URL..."
                    onKeyDown={e => e.key === 'Enter' && handleMediaUrl()}
                    className="flex-1 px-3 py-2 rounded-lg text-[12.5px] font-[inherit] outline-none" style={fieldStyle} />
                  <button onClick={handleMediaUrl} className="px-3 py-2 rounded-lg border-0 cursor-pointer text-[12px] font-semibold text-white"
                    style={{ background: D.accent }}>Add</button>
                </div>
              ) : (
                <div>
                  <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" onChange={handleFileUpload} className="hidden" id="media-upload" />
                  <label htmlFor="media-upload" className="flex flex-col items-center justify-center gap-2 py-5 cursor-pointer rounded-lg"
                    style={{ border: `1px solid ${D.border}`, background: D.card }}>
                    <div className="w-10 h-10 rounded-xl grid place-items-center text-lg" style={{ background: D.accent + '18', color: D.accent }}>
                      <i className="fas fa-cloud-upload-alt" />
                    </div>
                    <div className="text-[12px] text-center" style={{ color: D.subtext }}>
                      <span className="font-semibold" style={{ color: D.accent }}>Click to upload</span> or drag & drop<br />
                      <span className="text-[11px]" style={{ color: D.muted }}>PNG, JPG, GIF, MP4 · Max 50MB</span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold font-[inherit] cursor-pointer"
            style={{ border: `1px solid ${D.border}`, color: D.muted, background: 'transparent' }}>Cancel</button>
          <button onClick={submit} disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-0 cursor-pointer disabled:opacity-60 text-white"
            style={{ background: D.accent }}>
            {uploading ? <><i className="fas fa-spinner fa-spin mr-1.5" />Uploading…</> : saving ? <><i className="fas fa-spinner fa-spin mr-1.5" />Publishing…</> : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Chat Panel ──────────────────────────────────────────────────────────── */
function ChatPanel({ user, onClose }: { user: any; onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText]         = useState('');
  const [status, setStatus]     = useState('');
  const [isSending, setIsSending] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendMessage() {
    const trimmed = text.trim(); if (!trimmed) return;
    setMessages(prev => [...prev, { id: `me-${Date.now()}`, from: 'me', text: trimmed, time: new Date().toISOString() }]);
    setText(''); setIsSending(true); setStatus('Sending…');
    try {
      const res = await apiFetch('/community/messages', { method: 'POST', body: JSON.stringify({ recipientId: user.id, message: trimmed }) });
      if (!res.success) throw new Error(res.message || 'Send failed');
      setStatus(res.data?.online ? 'Delivered' : 'Delivered as notification');
      if (!res.data?.online) setMessages(prev => [...prev, { id: `sys-${Date.now()}`, from: 'system', text: 'They are currently offline. Message delivered as notification.', time: new Date().toISOString() }]);
    } catch (err: any) { setStatus(err.message || 'Failed'); } finally { setIsSending(false); setTimeout(() => setStatus(''), 4000); }
  }

  const name = `${user.firstName} ${user.lastName}`;
  return (
    <div className={`fixed bottom-6 right-6 z-400 w-85 rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all ${minimized ? 'h-14' : 'h-115'}`}
      style={{ background: 'var(--card-bg)', border: `1px solid ${D.border}` }}>
      <div className="flex items-center gap-2.5 px-4 py-3 shrink-0" style={{ background: `linear-gradient(135deg, ${D.accent}, #38BDF8)` }}>
        <Avatar user={user} size={8} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-[13px] truncate">{name}</div>
          <div className="text-white/60 text-[10.5px]">Online</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setMinimized(v => !v)} className="w-6 h-6 rounded-lg border-0 cursor-pointer grid place-items-center text-[10px]"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}><i className={`fas fa-${minimized ? 'expand-alt' : 'minus'}`} /></button>
          <button onClick={onClose} className="w-6 h-6 rounded-lg border-0 cursor-pointer grid place-items-center text-[10px]"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}><i className="fas fa-times" /></button>
        </div>
      </div>
      {!minimized && (
        <>
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5" style={{ background: D.card }}>
            <div className="text-center text-[10.5px] mb-2" style={{ color: D.muted }}>Today</div>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'} gap-2`}>
                <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed"
                  style={{
                    background: msg.from === 'me' ? D.accent : 'rgba(255,255,255,0.07)',
                    color: msg.from === 'me' ? 'white' : D.text,
                    borderRadius: msg.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  }}>
                  {msg.text}
                  <div className="text-[9.5px] mt-0.5 opacity-60">{timeAgo(msg.time)}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center gap-2 p-3 shrink-0" style={{ borderTop: `1px solid ${D.border}`, background: D.card }}>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={`Message ${user.firstName}…`}
              className="flex-1 px-3.5 py-2.5 rounded-xl text-[12.5px] font-[inherit] outline-none transition-all"
              style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }} />
            <button onClick={sendMessage} disabled={!text.trim() || isSending}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-0 cursor-pointer disabled:opacity-50"
              style={{ background: D.accent }}><i className="fas fa-paper-plane text-[12px] text-white" /></button>
          </div>
          {status && <div className="px-4 pb-3 text-[12px]" style={{ color: D.accent }}>{status}</div>}
        </>
      )}
    </div>
  );
}

/* ── Portfolio Spotlights ────────────────────────────────────────────────── */
function PortfolioSpotlights({ onMessage }: { onMessage: (u: any) => void }) {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [collapsed, setCollapsed]   = useState(false);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const [shareMenuPostId, setShareMenuPostId] = useState<string | null>(null);

  const reactionOptions = ['👍', '🔥', '🚀', '💯'];

  useEffect(() => {
    apiFetch('/portfolio/community-feed?limit=6')
      .then(r => {
        const feed = Array.isArray(r.data) ? r.data : (r.data?.users ?? []);
        setPortfolios(r.success && feed.length > 0 ? feed : []);
      })
      .catch(() => setPortfolios([]))
      .finally(() => setLoading(false));
  }, []);

  function updateProjectCommunity(postId: string, updater: (community: any) => any) {
    setPortfolios((prev) => prev.map((portfolio) => ({
      ...portfolio,
      projects: portfolio.projects?.map((project: any) =>
        project.community?.postId === postId
          ? { ...project, community: updater(project.community) }
          : project
      ),
    })));
  }

  async function toggleProjectReaction(postId: string, currentLiked: boolean, emoji: string) {
    const res = await apiFetch(`/community/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ reactionType: emoji }),
    }).catch(() => null);
    if (!res?.success) return;

    updateProjectCommunity(postId, (community) => ({
      ...community,
      likedByMe: res.data.liked,
      likes: community.likes + (
        community.likedByMe
          ? (res.data.liked ? 0 : -1)
          : (res.data.liked ? 1 : 0)
      ),
      reactionType: res.data.reactionType,
      reactions: res.data.reactions || {},
    }));
  }

  function handleProjectShare(postId: string, platform?: string) {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/community/${postId}`;
    const text = encodeURIComponent('Check out this SkillHub community project');

    if (platform === 'copy') {
      navigator.clipboard?.writeText(url).catch(() => {});
      setSharedPostId(postId);
      setTimeout(() => setSharedPostId((current) => (current === postId ? null : current)), 2000);
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(url)}`, '_blank');
    }

    setShareMenuPostId(null);
  }

  if (loading) return (
    <div className="rounded-2xl p-5 mb-5 animate-pulse" style={{ background: D.card, border: `1px solid ${D.border}` }}>
      <div className="h-4 rounded w-40 mb-4" style={{ background: 'var(--surface-soft)' }} />
      <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="h-44 rounded-xl" style={{ background: 'var(--surface-soft)' }} />)}</div>
    </div>
  );
  if (portfolios.length === 0) return null;

  return (
    <div className="rounded-2xl mb-5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
      <div className="flex items-center justify-between px-5 py-4 rounded-t-2xl" style={{ borderBottom: `1px solid ${D.border}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grid place-items-center text-[13px] text-white"
            style={{ background: `linear-gradient(135deg, ${D.accent}, ${D.purple})` }}>
            <i className="fas fa-layer-group" />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-[14px] text-white">Community Projects</h3>
            <p className="text-[11px]" style={{ color: D.muted }}>Shared projects with live links and tech tags</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/dashboard/portfolio" className="text-[11.5px] font-semibold no-underline px-3 py-1.5 rounded-lg"
            style={{ background: D.accent + '18', color: D.accent, border: `1px solid ${D.accent}20` }}>Share yours</a>
          <button onClick={() => setCollapsed(v => !v)} className="w-7 h-7 rounded-lg border-0 cursor-pointer grid place-items-center text-[11px]"
            style={{ background: D.input, color: D.muted }}><i className={`fas fa-chevron-${collapsed ? 'down' : 'up'}`} /></button>
        </div>
      </div>
      {!collapsed && (
        <div className="p-4 rounded-b-2xl grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-md:grid-cols-1">
          {portfolios.map(u => {
            const project = u.projects?.[0];
            const community = project?.community;
            const postId = community?.postId;
            const selectedReaction = community?.reactionType || '';
            const shared = sharedPostId === postId;

            return (
            <div key={u.id} className="rounded-xl group transition-all hover:-translate-y-0.5"
              style={{ border: `1px solid ${D.border}` }}>
              <div className="relative h-24 overflow-hidden rounded-t-xl" style={{ background: `linear-gradient(135deg, ${D.accent}20, ${D.purple}20)` }}>
                <SafeImageMedia
                  src={project?.thumbnail}
                  alt={project?.title || 'Project cover'}
                  fallbackType="project"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  maxHeightClass="h-full"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,21,33,0.7), transparent)' }} />
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <div className="text-white font-semibold text-[11px] truncate">{project?.title || 'Project'}</div>
                </div>
              </div>
              {/* No overflow-hidden here (unlike the image wrapper above) — the
                  Share dropdown below needs to render outside this box; overflow-hidden
                  on this container was clipping it, causing it to show cut off. */}
              <div className="p-3 rounded-b-xl" style={{ background: D.card }}>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar user={u} size={7} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[12px] text-white truncate">{u.firstName} {u.lastName}</div>
                    <div className="text-[10.5px] truncate" style={{ color: D.muted }}>{u.title}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {(u.skills || []).slice(0, 3).map((skill: string) => (
                    <span key={skill} className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: D.accent + '18', color: D.accent }}>{skill}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px]" style={{ color: D.muted }}>
                    <i className="fas fa-layer-group mr-1" />{u.projects.length} project{u.projects.length !== 1 ? 's' : ''}
                  </span>
                  <button onClick={() => onMessage(u)}
                    className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer"
                    style={{ background: D.accent + '18', color: D.accent }}>
                    <i className="fas fa-paper-plane text-[9px]" />Message
                  </button>
                </div>

                {postId && (
                  <>
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${D.border}` }}>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        {reactionOptions.map((emoji) => {
                          const isActive = selectedReaction === emoji;
                          return (
                            <button
                              key={emoji}
                              onClick={() => toggleProjectReaction(postId, !!community?.likedByMe, emoji)}
                              className="px-2 py-1 rounded-lg text-[13px] border-0 cursor-pointer transition-all"
                              style={{
                                background: isActive ? `${D.accent}22` : D.input,
                                boxShadow: isActive ? `0 0 0 1px ${D.accent}` : 'none',
                              }}
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => toggleProjectReaction(postId, !!community?.likedByMe, selectedReaction || '👍')}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold border-0 cursor-pointer transition-all"
                            style={{
                              background: community?.likedByMe ? `${D.red}18` : D.input,
                              color: community?.likedByMe ? D.red : D.muted,
                            }}
                          >
                            <span>{selectedReaction || '👍'}</span>
                            <span>{community?.likes ?? 0}</span>
                          </button>

                          <span className="flex items-center gap-1.5 text-[10px]" style={{ color: D.muted }}>
                            {reactionOptions.map((emoji) => (
                              <span key={emoji} className="inline-flex items-center gap-1">
                                <span>{emoji}</span>
                                <span>{community?.reactions?.[emoji] ?? 0}</span>
                              </span>
                            ))}
                          </span>

                          <Link
                            href={`/dashboard/community/post/${postId}`}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold no-underline transition-all"
                            style={{ background: D.input, color: D.muted }}
                          >
                            <i className="far fa-comment" />
                            <span>{community?.commentsCount ?? 0}</span>
                          </Link>

                          <div className="relative">
                            <button
                              onClick={() => setShareMenuPostId((current) => (current === postId ? null : postId))}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold border-0 cursor-pointer transition-all"
                              style={{ background: shared ? `${D.green}18` : `${D.accent}18`, color: shared ? D.green : D.accent }}
                            >
                              <i className={`fas ${shared ? 'fa-check' : 'fa-share-nodes'}`} />
                              <span>{shared ? 'Copied' : 'Share'}</span>
                            </button>
                            {shareMenuPostId === postId && (
                              <>
                                <div className="fixed inset-0 z-100" onClick={() => setShareMenuPostId(null)} />
                                <div className="absolute right-0 bottom-full mb-2 z-101 rounded-2xl overflow-hidden w-45 shadow-2xl"
                                  style={{ background: 'var(--card-bg)', border: `1px solid ${D.border}` }}>
                                  <div className="px-3.5 py-2.5" style={{ borderBottom: `1px solid ${D.border}` }}>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>Share project</p>
                                  </div>
                                  {[
                                    { icon: 'fa-link', label: 'Copy link', action: 'copy', color: D.accent },
                                    { icon: 'fa-brands fa-x-twitter', label: 'X / Twitter', action: 'twitter', color: '#E2E8F0' },
                                    { icon: 'fa-brands fa-linkedin', label: 'LinkedIn', action: 'linkedin', color: '#38BDF8' },
                                    { icon: 'fa-brands fa-whatsapp', label: 'WhatsApp', action: 'whatsapp', color: D.green },
                                  ].map((item) => (
                                    <button
                                      key={item.action}
                                      onClick={() => handleProjectShare(postId, item.action)}
                                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium border-0 bg-transparent cursor-pointer text-left transition-all hover:opacity-80"
                                      style={{ color: item.color }}
                                    >
                                      <i className={`fas ${item.icon}`} />{item.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px]" style={{ color: D.muted }}>
                          <i className="far fa-eye mr-1" />{community?.views ?? 0}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function CommunityPage() {
  const [user, setUser] = useState<any>(null);
  const [posts,    setPosts]    = useState<any[]>([]);
  const [stats,    setStats]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [type,     setType]     = useState('');
  const [sort,     setSort]     = useState('latest');
  const [search,   setSearch]   = useState('');
  const [showNew,  setShowNew]  = useState(false);
  const [chatUser, setChatUser] = useState<any>(null);
  const [editPost, setEditPost] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [feedRefresh, setFeedRefresh] = useState(0);

  useEffect(() => {
    apiFetch('/auth/me').then(r => { if (r.success && r.data) setUser(r.data); }).catch(() => {});
  }, []);

  const fetchPosts = useCallback(async (p = 1, t = type, s = sort, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), sort: s });
      if (t) params.set('type', t);
      if (q) params.set('search', q);
      const res = await apiFetch(`/community?${params}`);
      if (res.success) { setPosts(res.data.posts || []); setPages(res.data.pages || 1); setPage(p); }
      else { setPosts([]); setPages(1); setPage(1); }
    } catch { setPosts([]); setPages(1); } finally { setLoading(false); }
  }, [type, sort, search]);

  useEffect(() => {
    fetchPosts(1, type, sort, search);
    apiFetch('/community/stats/overview').then(r => { if (r.success) setStats(r.data); }).catch(() => {});
  }, [type, sort]);

  function handleLike(postId: string) {
    apiFetch(`/community/${postId}/like`, { method: 'POST' })
      .then(r => { if (r.success) setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: r.data.liked, likes: p.likes + (r.data.liked ? 1 : -1) } : p)); })
      .catch(() => {});
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(postId);
    try { const res = await apiFetch(`/community/${postId}`, { method: 'DELETE' }); if (res.success) setPosts(prev => prev.filter(p => p.id !== postId)); }
    catch { } finally { setDeleting(null); }
  }

  return (
    <SidebarLayout navItems={navItems} pageTitle="Community">
      <div style={{ color: D.text }}>
        {showNew && <NewPostModal onClose={() => setShowNew(false)} onCreated={post => { setPosts(prev => [post, ...prev]); setFeedRefresh(k => k + 1); }} />}
        {editPost && <EditPostModal post={editPost} onClose={() => setEditPost(null)} onUpdated={updated => { setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p)); setFeedRefresh(k => k + 1); }} />}
        {chatUser && <ChatPanel user={chatUser} onClose={() => setChatUser(null)} />}

        {/* Hero banner */}
        <div className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #0A1628 100%)', border: `1px solid ${D.accent}25` }}>
          <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 320, height: 320, background: `radial-gradient(circle, ${D.accent}18 0%, transparent 65%)`, borderRadius: '50%' }} />
          <div className="absolute pointer-events-none" style={{ bottom: -60, right: 80, width: 220, height: 220, background: `radial-gradient(circle, ${D.purple}12 0%, transparent 65%)`, borderRadius: '50%' }} />
          <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: D.accent + 'cc' }}>Community Hub</div>
              <h1 className="font-jakarta font-bold text-[2rem] text-white leading-tight mb-1">Connect & Grow</h1>
              <p className="text-[13px]" style={{ color: D.subtext }}>Share ideas, projects & grow together with fellow learners</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/dashboard/community/messages"
                className="flex items-center gap-2 px-4 py-2.5 font-semibold text-[13px] rounded-xl no-underline"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: `1px solid ${D.border}` }}>
                <i className="fas fa-inbox" />Messages
              </Link>
              <button onClick={() => { setShowNew(true); }}
                className="flex items-center gap-2 px-5 py-2.5 font-semibold text-[13.5px] rounded-xl border-0 cursor-pointer text-white"
                style={{ background: `linear-gradient(135deg, ${D.accent}, #38BDF8)` }}>
                <i className="fas fa-plus" />New Post
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Portfolio spotlights */}
        <PortfolioSpotlights onMessage={setChatUser} />

        {/* Unified Activity Feed — discussions, enrolments, new members & more */}
        <ActivityFeed currentUserId={user?.id} onMessage={setChatUser} onEdit={setEditPost} refreshKey={feedRefresh} />

      </div>
    </SidebarLayout>
  );
}