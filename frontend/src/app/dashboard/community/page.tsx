'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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

const POST_TYPES = [
  { value: '',           label: 'All',        icon: 'fa-globe',         color: '#6b6b8a' },
  { value: 'discussion', label: 'Discussion', icon: 'fa-comments',      color: '#5b4cf5' },
  { value: 'project',    label: 'Project',    icon: 'fa-code',          color: '#10b981' },
  { value: 'resource',   label: 'Resource',   icon: 'fa-link',          color: '#3b82f6' },
  { value: 'question',   label: 'Question',   icon: 'fa-question-circle', color: '#f59e0b' },
  { value: 'showcase',   label: 'Showcase',   icon: 'fa-star',          color: '#ef4444' },
];

const TYPE_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  discussion: { bg: '#f4f2ff', color: '#5b4cf5', icon: 'fa-comments' },
  project:    { bg: '#f0fdf4', color: '#10b981', icon: 'fa-code' },
  resource:   { bg: '#eff6ff', color: '#3b82f6', icon: 'fa-link' },
  question:   { bg: '#fffbeb', color: '#d97706', icon: 'fa-question-circle' },
  showcase:   { bg: '#fef2f2', color: '#ef4444', icon: 'fa-star' },
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Avatar({ user, size = 9 }: { user: any; size?: number }) {
  const name     = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const initials = name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors   = ['#5b4cf5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];
  const color    = colors[(initials.charCodeAt(0) || 0) % colors.length];
  if (user?.avatar) {
    return <img src={user.avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`w-${size} h-${size} rounded-full flex-shrink-0 grid place-items-center font-bold text-white text-xs`} style={{ background: color }}>
      {initials}
    </div>
  );
}

/* ── Post Card ─────────────────────────────────────────────────────────── */
function PostCard({ post, onLike }: { post: any; onLike: (id: string) => void }) {
  const tc = TYPE_COLORS[post.type] || TYPE_COLORS.discussion;
  return (
    <div className="bg-white border border-[#e8e8f0] rounded-2xl p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar user={post.author} size={9} />
          <div>
            <div className="font-semibold text-[13px] text-[#0a0a0f]">
              {post.author.firstName} {post.author.lastName}
            </div>
            {post.author.title && (
              <div className="text-[11px] text-[#9898b8]">{post.author.title}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full" style={{ background: tc.bg, color: tc.color }}>
            <i className={`fas ${tc.icon} mr-1`} />
            {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </span>
          {post.isPinned && (
            <span className="text-[10px] font-bold text-[#d97706] bg-[#fffbeb] px-2 py-0.5 rounded-full">
              <i className="fas fa-thumbtack mr-1" />Pinned
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <Link href={`/dashboard/community/post/${post.id}`} className="block no-underline group">
        <h3 className="font-syne font-bold text-[15px] text-[#0a0a0f] mb-1.5 group-hover:text-[#5b4cf5] transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="text-[13px] text-[#6b6b8a] leading-relaxed line-clamp-2">{post.body}</p>
      </Link>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.map((tag: string) => (
            <span key={tag} className="text-[11px] text-[#5b4cf5] bg-[#f4f2ff] px-2 py-0.5 rounded-md font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Project URL */}
      {post.projectUrl && (
        <a href={post.projectUrl} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 mt-2.5 text-[12px] text-[#3b82f6] hover:text-[#2563eb] font-medium no-underline">
          <i className="fas fa-external-link-alt text-[10px]" />
          {post.projectUrl.replace(/^https?:\/\//, '').slice(0, 40)}
        </a>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-[#f0f0f8]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 text-[12px] font-medium border-0 bg-transparent cursor-pointer transition-all px-0 ${post.likedByMe ? 'text-[#ef4444]' : 'text-[#9898b8] hover:text-[#ef4444]'}`}>
            <i className={`${post.likedByMe ? 'fas' : 'far'} fa-heart`} />
            {post.likes}
          </button>
          <Link href={`/dashboard/community/post/${post.id}`}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#9898b8] hover:text-[#5b4cf5] no-underline transition-all">
            <i className="far fa-comment" />
            {post._count?.comments ?? 0}
          </Link>
          <span className="flex items-center gap-1.5 text-[12px] text-[#c8c8d8]">
            <i className="far fa-eye" />
            {post.views}
          </span>
        </div>
        <span className="text-[11px] text-[#c8c8d8]">{timeAgo(post.createdAt)}</span>
      </div>
    </div>
  );
}

/* ── New Post Modal ────────────────────────────────────────────────────── */
function NewPostModal({ onClose, onCreated }: { onClose: () => void; onCreated: (post: any) => void }) {
  const [form, setForm]   = useState({ title: '', body: '', type: 'discussion', tags: '', projectUrl: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState('');

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) { setErr('Title and body are required.'); return; }
    setSaving(true); setErr('');
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5);
      const res  = await apiFetch('/community', {
        method: 'POST',
        body: JSON.stringify({ ...form, tags, projectUrl: form.projectUrl || undefined }),
      });
      if (res.success) { onCreated(res.data); onClose(); }
      else setErr(res.message || 'Failed to create post');
    } catch (e: any) {
      setErr(e.message || 'Error creating post');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne font-bold text-[17px]">New Post</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] grid place-items-center hover:bg-[#f0f0f8] transition-all">
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {err && <div className="bg-[#fef2f2] text-[#ef4444] text-[13px] rounded-xl px-4 py-2.5 mb-4">{err}</div>}

        {/* Type selector */}
        <div className="mb-4">
          <label className="block text-[12px] font-semibold text-[#6b6b8a] mb-2 uppercase tracking-wide">Post Type</label>
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.filter(t => t.value).map(t => (
              <button key={t.value}
                onClick={() => setForm(f => ({ ...f, type: t.value }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer ${form.type === t.value ? 'border-[#5b4cf5] bg-[#f4f2ff] text-[#5b4cf5]' : 'border-[#e8e8f0] bg-white text-[#6b6b8a] hover:border-[#d8d8f0]'}`}>
                <i className={`fas ${t.icon} text-[11px]`} style={{ color: form.type === t.value ? t.color : undefined }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3.5">
          <label className="block text-[12px] font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wide">Title</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What's on your mind?"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e8f0] text-[13.5px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all bg-[#fafaff]"
          />
        </div>

        <div className="mb-3.5">
          <label className="block text-[12px] font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wide">Content</label>
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={5}
            placeholder="Share your ideas, project details, or question..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e8f0] text-[13.5px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all resize-none bg-[#fafaff]"
          />
        </div>

        <div className="mb-3.5">
          <label className="block text-[12px] font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wide">Tags <span className="text-[#c8c8d8] font-normal normal-case">(comma-separated, max 5)</span></label>
          <input
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="react, javascript, web-dev"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e8f0] text-[13.5px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all bg-[#fafaff]"
          />
        </div>

        {(form.type === 'project' || form.type === 'showcase') && (
          <div className="mb-3.5">
            <label className="block text-[12px] font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wide">Project URL</label>
            <input
              value={form.projectUrl}
              onChange={e => setForm(f => ({ ...f, projectUrl: e.target.value }))}
              placeholder="https://github.com/you/project"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e8f0] text-[13.5px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all bg-[#fafaff]"
            />
          </div>
        )}

        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#e8e8f0] text-[13px] font-semibold text-[#6b6b8a] bg-white cursor-pointer hover:bg-[#f5f5fb] transition-all">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#5b4cf5] text-white text-[13px] font-semibold border-0 cursor-pointer hover:bg-[#4a3de0] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
            {saving ? <><i className="fas fa-spinner fa-spin mr-1.5" />Publishing…</> : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Stats Bar ─────────────────────────────────────────────────────────── */
function StatsBar({ stats }: { stats: any }) {
  if (!stats) return null;
  const items = [
    { icon: 'fa-file-alt',  color: '#5b4cf5', bg: '#f4f2ff', label: 'Posts',   value: stats.totalPosts },
    { icon: 'fa-comments',  color: '#10b981', bg: '#f0fdf4', label: 'Replies',  value: stats.totalComments },
    { icon: 'fa-users',     color: '#3b82f6', bg: '#eff6ff', label: 'Members',  value: stats.totalMembers },
    { icon: 'fa-fire',      color: '#ef4444', bg: '#fef2f2', label: 'Active (7d)', value: stats.recentActive },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 mb-6 max-md:grid-cols-2">
      {items.map(it => (
        <div key={it.label} className="bg-white rounded-2xl p-4 border border-[#e8e8f0] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center text-[15px]" style={{ background: it.bg, color: it.color }}>
            <i className={`fas ${it.icon}`} />
          </div>
          <div>
            <div className="font-syne font-bold text-[18px]">{(it.value ?? 0).toLocaleString()}</div>
            <div className="text-[11px] text-[#9898b8]">{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
export default function CommunityPage() {
  const user = getCachedUser();
  const [posts,    setPosts]    = useState<any[]>([]);
  const [stats,    setStats]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [type,     setType]     = useState('');
  const [sort,     setSort]     = useState('latest');
  const [search,   setSearch]   = useState('');
  const [showNew,  setShowNew]  = useState(false);

  const fetchPosts = useCallback(async (p = 1, t = type, s = sort, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), sort: s });
      if (t) params.set('type', t);
      if (q) params.set('search', q);
      const res = await apiFetch(`/community?${params}`);
      if (res.success) {
        setPosts(res.data.posts);
        setPages(res.data.pages);
        setPage(p);
      }
    } catch {}
    finally { setLoading(false); }
  }, [type, sort, search]);

  useEffect(() => {
    fetchPosts(1, type, sort, search);
    apiFetch('/community/stats/overview').then(r => { if (r.success) setStats(r.data); }).catch(() => {});
  }, [type, sort]);

  function handleLike(postId: string) {
    apiFetch(`/community/${postId}/like`, { method: 'POST' })
      .then(r => {
        if (r.success) {
          setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, likedByMe: r.data.liked, likes: p.likes + (r.data.liked ? 1 : -1) } : p
          ));
        }
      }).catch(() => {});
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchPosts(1, type, sort, search);
  }

  return (
    <SidebarLayout navItems={navItems} pageTitle="Community">
      {showNew && (
        <NewPostModal
          onClose={() => setShowNew(false)}
          onCreated={post => { setPosts(prev => [post, ...prev]); }}
        />
      )}

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#5b4cf5] via-[#6d5ef7] to-[#8b7bf9] p-6 mb-6 flex items-center justify-between gap-4 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative z-10">
          <h1 className="font-syne font-extrabold text-white text-[22px] mb-1">Community Hub</h1>
          <p className="text-white/70 text-[13.5px]">Share ideas, projects & grow together with fellow learners</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="relative z-10 flex items-center gap-2 px-5 py-2.5 bg-white text-[#5b4cf5] font-semibold text-[13.5px] rounded-xl border-0 cursor-pointer hover:bg-white/90 transition-all shadow-lg flex-shrink-0">
          <i className="fas fa-plus" />
          New Post
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#9898b8] text-[12px]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-3 py-2.5 border border-[#e8e8f0] rounded-xl text-[13px] font-[inherit] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.08)] transition-all"
          />
        </form>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-3 py-2.5 border border-[#e8e8f0] rounded-xl text-[13px] font-[inherit] bg-white outline-none cursor-pointer focus:border-[#5b4cf5] transition-all">
          <option value="latest">Latest</option>
          <option value="popular">Most Liked</option>
          <option value="trending">Trending</option>
        </select>
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {POST_TYPES.map(t => (
          <button key={t.value}
            onClick={() => setType(t.value)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold border transition-all cursor-pointer ${type === t.value ? 'bg-[#5b4cf5] text-white border-[#5b4cf5]' : 'bg-white text-[#6b6b8a] border-[#e8e8f0] hover:border-[#5b4cf5] hover:text-[#5b4cf5]'}`}>
            <i className={`fas ${t.icon} text-[11px]`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {loading ? (
        <div className="grid gap-3.5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#f0f0f8] animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 bg-[#f0f0f8] animate-pulse rounded w-1/3 mb-1.5" />
                  <div className="h-2.5 bg-[#f0f0f8] animate-pulse rounded w-1/5" />
                </div>
              </div>
              <div className="h-4 bg-[#f0f0f8] animate-pulse rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#f0f0f8] animate-pulse rounded w-full mb-1.5" />
              <div className="h-3 bg-[#f0f0f8] animate-pulse rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f4f2ff] grid place-items-center text-[#5b4cf5] text-2xl mb-4">
            <i className="fas fa-users" />
          </div>
          <h3 className="font-syne font-bold text-[16px] mb-1.5">No posts yet</h3>
          <p className="text-[13px] text-[#9898b8] mb-5">Be the first to start a conversation!</p>
          <button onClick={() => setShowNew(true)}
            className="px-5 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-[13px] font-semibold border-0 cursor-pointer hover:bg-[#4a3de0] transition-all">
            Create First Post
          </button>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => fetchPosts(page - 1)}
            disabled={page === 1}
            className="w-9 h-9 rounded-xl border border-[#e8e8f0] bg-white text-[#6b6b8a] text-sm grid place-items-center cursor-pointer hover:bg-[#f5f5fb] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <i className="fas fa-chevron-left" />
          </button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
            <button key={p}
              onClick={() => fetchPosts(p)}
              className={`w-9 h-9 rounded-xl text-[13px] font-semibold border cursor-pointer transition-all ${p === page ? 'bg-[#5b4cf5] text-white border-[#5b4cf5]' : 'bg-white border-[#e8e8f0] text-[#6b6b8a] hover:bg-[#f5f5fb]'}`}>
              {p}
            </button>
          ))}
          <button
            onClick={() => fetchPosts(page + 1)}
            disabled={page === pages}
            className="w-9 h-9 rounded-xl border border-[#e8e8f0] bg-white text-[#6b6b8a] text-sm grid place-items-center cursor-pointer hover:bg-[#f5f5fb] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <i className="fas fa-chevron-right" />
          </button>
        </div>
      )}
    </SidebarLayout>
  );
}