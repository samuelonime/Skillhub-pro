'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch, getCachedUser } from '@/lib/api';

const navItems = [
  { href: '/dashboard',              icon: 'fa-home',         label: 'Dashboard' },
  { href: '/dashboard/courses',      icon: 'fa-book-open',    label: 'Courses' },
  { href: '/dashboard/career-oracle',   icon: 'fa-brain',                label: 'Career Oracle' },
  { href: '/dashboard/skill-coach',     icon: 'fa-heart-pulse',          label: 'Skill Coach' },
  { href: '/dashboard/peer-genome',     icon: 'fa-users',                label: 'Peer Genome' },
  { href: '/dashboard/skill-decay',     icon: 'fa-chart-line',           label: 'Skill Decay' },
  { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles',  label: 'Ghost Recruiter' },
  { href: '/dashboard/community',    icon: 'fa-users',        label: 'Community' },
  { href: '/dashboard/portfolio',    icon: 'fa-layer-group',  label: 'Portfolio' },
  { href: '/dashboard/platforms',    icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs',         icon: 'fa-briefcase',    label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate',  label: 'Certificates' },
  { href: '/dashboard/rewards',      icon: 'fa-coins',        label: 'Rewards' },
  { href: '/dashboard/settings',     icon: 'fa-gear',         label: 'Settings' },
];

const POST_TYPES = [
  { value: '',           label: 'All',        icon: 'fa-globe',           color: '#6b6b8a' },
  { value: 'discussion', label: 'Discussion', icon: 'fa-comments',        color: '#5b4cf5' },
  { value: 'project',    label: 'Project',    icon: 'fa-code',            color: '#10b981' },
  { value: 'resource',   label: 'Resource',   icon: 'fa-link',            color: '#3b82f6' },
  { value: 'question',   label: 'Question',   icon: 'fa-question-circle', color: '#f59e0b' },
  { value: 'showcase',   label: 'Showcase',   icon: 'fa-star',            color: '#ef4444' },
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
    return <img src={user.avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0 border-2 border-white`} />;
  }
  return (
    <div className={`w-${size} h-${size} rounded-full flex-shrink-0 grid place-items-center font-bold text-white text-xs`} style={{ background: color }}>
      {initials}
    </div>
  );
}

/* ── Media Preview ──────────────────────────────────────────────────────── */
function detectMediaType(url: string): string {
  if (!url) return 'image';
  const lower = url.toLowerCase();
  if (/\.(mp4|webm|mov)/.test(lower)) return 'video';
  if (lower.includes('.gif') || lower.includes('giphy')) return 'gif';
  return 'image';
}

function normalizeExternalLink(url: string) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return `https://${trimmed}`;
}

function MediaPreview({ url, type }: { url: string; type: string }) {
  if (!url) return null;
  if (type === 'gif') {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-[#f0f0f8]">
        <img src={url} alt="GIF" className="w-full max-h-72 object-cover" />
      </div>
    );
  }
  if (type === 'image') {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-[#f0f0f8]">
        <img src={url} alt="Post image" className="w-full max-h-72 object-cover" />
      </div>
    );
  }
  if (type === 'video') {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-[#f0f0f8]">
        <video src={url} controls className="w-full max-h-72" />
      </div>
    );
  }
  return null;
}

/* ── Mini conversation strip ─────────────────────────────────────────────── */
function ConversationStrip({ postId, count }: { postId: string; count: number }) {
  const [open, setOpen] = useState(false);
  // No seed data — show link to post detail
  const convos: any[] = [];
  if (convos.length === 0) return (
    <Link href={`/dashboard/community/post/${postId}`}
      className="flex items-center gap-1.5 text-[12px] font-medium text-[#9898b8] hover:text-[#5b4cf5] no-underline transition-all">
      <i className="far fa-comment" />{count}
    </Link>
  );

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-[#9898b8] hover:text-[#5b4cf5] transition-all bg-transparent border-0 cursor-pointer p-0">
        <i className="far fa-comment" />{count}
        <i className={`fas fa-chevron-${open ? 'up' : 'down'} text-[9px] ml-0.5`} />
      </button>
      {open && (
        <div className="mt-3 space-y-2.5 border-t border-[#f0f0f8] pt-3">
          {convos.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar user={c.author} size={7} />
              <div className="flex-1 bg-[#f8f8fc] rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-semibold text-[11.5px] text-[#0a0a0f]">{c.author.firstName}</span>
                  <span className="text-[10px] text-[#c8c8d8]">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-[12.5px] text-[#4b4b6a] leading-relaxed">{c.body}</p>
                <button className={`mt-1.5 flex items-center gap-1 text-[10.5px] font-medium border-0 bg-transparent cursor-pointer transition-colors ${c.likedByMe ? 'text-[#ef4444]' : 'text-[#c8c8d8] hover:text-[#ef4444]'}`}>
                  <i className={`${c.likedByMe ? 'fas' : 'far'} fa-heart`} />{c.likes}
                </button>
              </div>
            </div>
          ))}
          <Link href={`/dashboard/community/post/${postId}`}
            className="block text-center text-[11.5px] text-[#5b4cf5] font-semibold no-underline hover:underline pt-1">
            View all {count} replies →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Post Card ─────────────────────────────────────────────────────────── */
function PostCard({ post, onLike, onMessage, onEdit, onDelete, currentUserId }: {
  post: any;
  onLike: (id: string) => void;
  onMessage: (user: any) => void;
  onEdit: (post: any) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
}) {
  const tc = TYPE_COLORS[post.type] || TYPE_COLORS.discussion;
  const [shared, setShared] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isOwner = currentUserId && post.author?.id === currentUserId;

  function handleShare(platform?: string) {
    const url  = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/community/post/${post.id}`;
    const text = encodeURIComponent(post.title);
    if (platform === 'copy') {
      navigator.clipboard?.writeText(url).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(url)}`, '_blank');
    }
    setShowShareMenu(false);
  }

  return (
    <div className="bg-white border border-[#e8e8f0] rounded-2xl p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative cursor-pointer" onClick={() => onMessage(post.author)}>
            <Avatar user={post.author} size={10} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10b981] rounded-full border-2 border-white" />
          </div>
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
          <button
            onClick={() => onMessage(post.author)}
            className="w-7 h-7 rounded-lg bg-[#f4f2ff] text-[#5b4cf5] border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all grid place-items-center text-[11px]"
            title={`Message ${post.author.firstName}`}>
            <i className="fas fa-paper-plane" />
          </button>
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowActions(v => !v)}
                className="w-7 h-7 rounded-lg bg-[#f5f5fb] text-[#9898b8] border-0 cursor-pointer hover:bg-[#f0f0f8] transition-all grid place-items-center text-[11px]">
                <i className="fas fa-ellipsis-v" />
              </button>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 top-full mt-1 z-[101] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#e8e8f0] overflow-hidden w-[140px]">
                    <button
                      onClick={() => { setShowActions(false); onEdit(post); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium border-0 bg-transparent cursor-pointer text-left text-[#5b4cf5] hover:bg-[#f4f2ff] transition-all">
                      <i className="fas fa-pen text-[11px]" /> Edit
                    </button>
                    <button
                      onClick={() => { setShowActions(false); onDelete(post.id); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium border-0 bg-transparent cursor-pointer text-left text-[#ef4444] hover:bg-[#fef2f2] transition-all">
                      <i className="fas fa-trash text-[11px]" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
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

      {/* Media */}
      {(post.mediaUrl || post.imageUrl) && (
        <MediaPreview
          url={post.mediaUrl || post.imageUrl}
          type={post.mediaType || detectMediaType(post.mediaUrl || post.imageUrl)}
        />
      )}

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
        (() => {
          const normalizedUrl = normalizeExternalLink(post.projectUrl);
          return (
            <a href={normalizedUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2.5 text-[12px] text-[#3b82f6] hover:text-[#2563eb] font-medium no-underline">
              <i className="fas fa-external-link-alt text-[10px]" />
              {normalizedUrl.replace(/^https?:\/\//, '').replace(/^\/\//, '').slice(0, 40)}
            </a>
          );
        })()
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-[#f0f0f8]">
        <div className="flex items-center gap-2">
          {/* Like button — large & prominent */}
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-[13px] border-0 cursor-pointer transition-all select-none ${
              post.likedByMe
                ? 'bg-[#fef2f2] text-[#ef4444] shadow-[0_0_0_1.5px_#ef4444]'
                : 'bg-[#f5f5fb] text-[#6b6b8a] hover:bg-[#fef2f2] hover:text-[#ef4444]'
            }`}
            title={post.likedByMe ? 'Unlike' : 'Like'}>
            <i className={`${post.likedByMe ? 'fas' : 'far'} fa-heart text-[14px]`} />
            <span>{post.likes}</span>
          </button>

          <ConversationStrip postId={post.id} count={post._count?.comments ?? 0} />

          <span className="flex items-center gap-1.5 text-[12px] text-[#c8c8d8]">
            <i className="far fa-eye" />
            {post.views}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#c8c8d8]">{timeAgo(post.createdAt)}</span>

          {/* Share button with dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-[12.5px] border-0 cursor-pointer transition-all select-none ${
                shared
                  ? 'bg-[#f0fdf4] text-[#10b981]'
                  : 'bg-[#f4f2ff] text-[#5b4cf5] hover:bg-[#5b4cf5] hover:text-white'
              }`}
              title="Share this post">
              <i className={`fas ${shared ? 'fa-check' : 'fa-share-nodes'} text-[13px]`} />
              <span>{shared ? 'Copied!' : 'Share'}</span>
            </button>

            {showShareMenu && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-[100]" onClick={() => setShowShareMenu(false)} />
                {/* Menu */}
                <div className="absolute right-0 bottom-full mb-2 z-[101] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-[#e8e8f0] overflow-hidden w-[180px]">
                  <div className="px-3.5 py-2.5 border-b border-[#f0f0f8]">
                    <p className="text-[11px] font-semibold text-[#9898b8] uppercase tracking-wide">Share via</p>
                  </div>
                  {[
                    { icon: 'fa-link',      label: 'Copy link',  action: 'copy',      color: '#5b4cf5', bg: '#f4f2ff' },
                    { icon: 'fa-brands fa-x-twitter', label: 'X / Twitter', action: 'twitter', color: '#0f1419', bg: '#f7f7f7' },
                    { icon: 'fa-brands fa-linkedin',  label: 'LinkedIn',    action: 'linkedin', color: '#0a66c2', bg: '#eff6ff' },
                    { icon: 'fa-brands fa-whatsapp',  label: 'WhatsApp',    action: 'whatsapp', color: '#25d366', bg: '#f0fdf4' },
                  ].map(item => (
                    <button
                      key={item.action}
                      onClick={() => handleShare(item.action)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium border-0 bg-transparent cursor-pointer text-left hover:bg-[#fafaff] transition-all"
                      style={{ color: item.color }}>
                      <span className="w-7 h-7 rounded-lg grid place-items-center text-[13px] flex-shrink-0" style={{ background: item.bg, color: item.color }}>
                        <i className={`fas ${item.icon}`} />
                      </span>
                      {item.label}
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
function EditPostModal({ post, onClose, onUpdated }: { post: any; onClose: () => void; onUpdated: (updated: any) => void }) {
  const [form, setForm] = useState({
    title: post.title || '',
    body: post.body || '',
    tags: (post.tags || []).join(', '),
    projectUrl: post.projectUrl || '',
    imageUrl: post.imageUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) { setErr('Title and body are required.'); return; }
    setSaving(true); setErr('');
    try {
      const tags = form.tags.split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 5);
      const res = await apiFetch(`/community/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...form, tags }),
      });
      if (res.success) { onUpdated(res.data); onClose(); }
      else setErr(res.message || 'Failed to update post');
    } catch (e: any) {
      setErr(e.message || 'Error updating post');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne font-bold text-[17px]">Edit Post</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] grid place-items-center hover:bg-[#f0f0f8] transition-all">
            <i className="fas fa-times text-sm" />
          </button>
        </div>
        {err && <div className="bg-[#fef2f2] text-[#ef4444] text-[13px] rounded-xl px-4 py-2.5 mb-4">{err}</div>}
        <div className="mb-3.5">
          <label className="block text-[12px] font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wide">Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e8f0] text-[13.5px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all bg-[#fafaff]" />
        </div>
        <div className="mb-3.5">
          <label className="block text-[12px] font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wide">Content</label>
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e8f0] text-[13.5px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all resize-none bg-[#fafaff]" />
        </div>
        <div className="mb-3.5">
          <label className="block text-[12px] font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wide">Tags <span className="text-[#c8c8d8] font-normal normal-case">(comma-separated)</span></label>
          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="react, typescript, career"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e8f0] text-[13.5px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all bg-[#fafaff]" />
        </div>
        <div className="mb-5">
          <label className="block text-[12px] font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wide">Project URL</label>
          <input value={form.projectUrl} onChange={e => setForm(f => ({ ...f, projectUrl: e.target.value }))}
            placeholder="https://github.com/..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e8f0] text-[13.5px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all bg-[#fafaff]" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#e8e8f0] text-[13.5px] font-semibold font-[inherit] text-[#6b6b8a] bg-white cursor-pointer hover:bg-[#f5f5fb] transition-all">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-3 bg-[#5b4cf5] text-white rounded-xl text-[13.5px] font-semibold font-[inherit] cursor-pointer hover:bg-[#7c6ff7] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── New Post Modal with Media Upload ───────────────────────────────────── */
function NewPostModal({ onClose, onCreated }: { onClose: () => void; onCreated: (post: any) => void }) {
  const [form, setForm]       = useState({ title: '', body: '', type: 'discussion', tags: '', projectUrl: '', imageUrl: '' });
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr]         = useState('');
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string } | null>(null);
  const [mediaTab, setMediaTab] = useState<'url' | 'upload'>('url');
  const [mediaUrl, setMediaUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleMediaUrl() {
    if (!mediaUrl.trim()) return;
    const isGif = mediaUrl.toLowerCase().includes('.gif') || mediaUrl.includes('giphy');
    const isVideo = /\.(mp4|webm|mov)/.test(mediaUrl.toLowerCase());
    setMediaPreview({ url: mediaUrl, type: isGif ? 'gif' : isVideo ? 'video' : 'image' });
    setForm(f => ({ ...f, imageUrl: mediaUrl }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show a local preview immediately so the user sees something
    const localPreviewUrl = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? 'video' : file.type.includes('gif') ? 'gif' : 'image';
    setMediaPreview({ url: localPreviewUrl, type });
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('media', file);
      const res = await fetch('/api/v1/community/upload-media', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');

      // Replace the local blob preview with the real Cloudinary URL
      URL.revokeObjectURL(localPreviewUrl);
      setMediaPreview({ url: data.data.url, type });
      setForm(f => ({ ...f, imageUrl: data.data.url }));
    } catch (err: any) {
      setMediaPreview(null);
      URL.revokeObjectURL(localPreviewUrl);
      if (fileRef.current) fileRef.current.value = '';
      alert(err.message || 'Media upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function removeMedia() {
    setMediaPreview(null);
    setMediaUrl('');
    setForm(f => ({ ...f, imageUrl: '' }));
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) { setErr('Title and body are required.'); return; }
    setSaving(true); setErr('');
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5);
      const res  = await apiFetch('/community', {
        method: 'POST',
        body: JSON.stringify({ ...form, tags, imageUrl: form.imageUrl || undefined, projectUrl: form.projectUrl || undefined }),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
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
            rows={4}
            placeholder="Share your ideas, project details, or question..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e8f0] text-[13.5px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all resize-none bg-[#fafaff]"
          />
        </div>

        {/* Media section */}
        <div className="mb-3.5">
          <label className="block text-[12px] font-semibold text-[#6b6b8a] mb-2 uppercase tracking-wide">
            Media <span className="text-[#c8c8d8] font-normal normal-case">(image, GIF, or short video)</span>
          </label>

          {mediaPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-[#e8e8f0]">
              {mediaPreview.type === 'video'
                ? <video src={mediaPreview.url} controls className="w-full max-h-48" />
                : <img src={mediaPreview.url} alt="Preview" className="w-full max-h-48 object-cover" />}
              <button onClick={removeMedia}
                className="absolute top-2 right-2 w-7 h-7 bg-[#0a0a0f]/60 text-white rounded-full border-0 cursor-pointer grid place-items-center hover:bg-[#0a0a0f]/80 transition-all">
                <i className="fas fa-times text-[11px]" />
              </button>
              <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-[#0a0a0f]/50 px-2 py-0.5 rounded-full uppercase">
                {mediaPreview.type}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-[#d0d0e8] rounded-xl p-4 bg-[#fafaff]">
              {/* Tab switcher */}
              <div className="flex gap-1 mb-3 bg-[#f0f0f8] rounded-lg p-0.5">
                {(['url', 'upload'] as const).map(tab => (
                  <button key={tab} onClick={() => setMediaTab(tab)}
                    className={`flex-1 py-1.5 rounded-md text-[11.5px] font-semibold border-0 cursor-pointer transition-all ${mediaTab === tab ? 'bg-white text-[#5b4cf5] shadow-sm' : 'bg-transparent text-[#9898b8]'}`}>
                    {tab === 'url' ? '🔗 URL / GIF link' : '📁 Upload file'}
                  </button>
                ))}
              </div>

              {mediaTab === 'url' ? (
                <div className="flex gap-2">
                  <input
                    value={mediaUrl}
                    onChange={e => setMediaUrl(e.target.value)}
                    placeholder="Paste image, GIF, or video URL..."
                    className="flex-1 px-3 py-2 rounded-lg border border-[#e8e8f0] text-[12.5px] font-[inherit] outline-none focus:border-[#5b4cf5] transition-all bg-white"
                    onKeyDown={e => e.key === 'Enter' && handleMediaUrl()}
                  />
                  <button onClick={handleMediaUrl}
                    className="px-3 py-2 bg-[#5b4cf5] text-white rounded-lg border-0 cursor-pointer text-[12px] font-semibold hover:bg-[#4a3de0] transition-all">
                    Add
                  </button>
                </div>
              ) : (
                <div>
                  <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" onChange={handleFileUpload} className="hidden" id="media-upload" />
                  <label htmlFor="media-upload"
                    className="flex flex-col items-center justify-center gap-2 py-5 cursor-pointer rounded-lg border border-[#e8e8f0] bg-white hover:bg-[#f8f8fc] transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[#f4f2ff] grid place-items-center text-[#5b4cf5] text-lg">
                      <i className="fas fa-cloud-upload-alt" />
                    </div>
                    <div className="text-[12px] text-[#6b6b8a] text-center">
                      <span className="font-semibold text-[#5b4cf5]">Click to upload</span> or drag & drop<br />
                      <span className="text-[11px] text-[#c8c8d8]">PNG, JPG, GIF, MP4 · Max 50MB</span>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex gap-2 mt-2.5 flex-wrap">
                {['https://media.giphy.com/media/du3J3cXyzhj75IOgvA/giphy.gif', 'https://media.giphy.com/media/a9xhxAxaqOfQs/giphy.gif'].map((gif, i) => (
                  <button key={i} onClick={() => { setMediaPreview({ url: gif, type: 'gif' }); setForm(f => ({ ...f, imageUrl: gif })); }}
                    className="w-14 h-10 rounded-lg overflow-hidden border border-[#e8e8f0] cursor-pointer hover:border-[#5b4cf5] transition-all p-0 bg-transparent">
                    <img src={gif} alt="Quick GIF" className="w-full h-full object-cover" />
                  </button>
                ))}
                <span className="text-[10.5px] text-[#c8c8d8] self-center">Quick GIFs</span>
              </div>
            </div>
          )}
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
          <button onClick={submit} disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-xl bg-[#5b4cf5] text-white text-[13px] font-semibold border-0 cursor-pointer hover:bg-[#4a3de0] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
            {uploading ? <><i className="fas fa-spinner fa-spin mr-1.5" />Uploading media…</> : saving ? <><i className="fas fa-spinner fa-spin mr-1.5" />Publishing…</> : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Private Chat Panel ─────────────────────────────────────────────────── */
function ChatPanel({ user, onClose }: { user: any; onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recipientOnline, setRecipientOnline] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    setMessages([]);
    setStatus('');
    setRecipientOnline(true);
  }, [user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const outgoing = { id: `me-${Date.now()}`, from: 'me', text: trimmed, time: new Date().toISOString() };
    setMessages(prev => [...prev, outgoing]);
    setText('');
    setIsSending(true);
    setStatus('Sending message...');

    try {
      const res = await apiFetch('/community/messages', {
        method: 'POST',
        body: JSON.stringify({ recipientId: user.id, message: trimmed }),
      });
      if (!res.success) throw new Error(res.message || 'Send failed');

      setRecipientOnline(res.data?.online ?? false);
      if (!res.data?.online) {
        setMessages(prev => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            from: 'system',
            text: 'They are currently offline. Your message was delivered as a notification.',
            time: new Date().toISOString(),
          },
        ]);
        setStatus('Delivered as notification');
      } else {
        setStatus('Delivered');
      }
    } catch (err: any) {
      setStatus(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
      setTimeout(() => setStatus(''), 4000);
    }
  }

  const name = `${user.firstName} ${user.lastName}`;

  return (
    <div className={`fixed bottom-6 right-6 z-[400] w-[340px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-[#e8e8f0] flex flex-col overflow-hidden transition-all ${minimized ? 'h-[56px]' : 'h-[460px]'}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#5b4cf5] to-[#7c6ff7] flex-shrink-0">
        <div className="relative">
          <Avatar user={user} size={8} />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10b981] rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-[13px] truncate">{name}</div>
          <div className="text-white/60 text-[10.5px]">
            {recipientOnline ? 'Online — live chat available' : 'Offline — message sent as notification'}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setMinimized(v => !v)}
            className="w-6 h-6 rounded-lg bg-white/20 border-0 cursor-pointer text-white grid place-items-center hover:bg-white/30 transition-all text-[10px]">
            <i className={`fas fa-${minimized ? 'expand-alt' : 'minus'}`} />
          </button>
          <button onClick={onClose}
            className="w-6 h-6 rounded-lg bg-white/20 border-0 cursor-pointer text-white grid place-items-center hover:bg-white/30 transition-all text-[10px]">
            <i className="fas fa-times" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-[#fafaff]">
            <div className="text-center text-[10.5px] text-[#c8c8d8] mb-2">Today</div>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.from === 'them' && <Avatar user={user} size={6} />}
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed ${msg.from === 'me' ? 'bg-[#5b4cf5] text-white rounded-br-sm' : 'bg-white text-[#0a0a0f] border border-[#e8e8f0] rounded-bl-sm'}`}>
                  {msg.text}
                  <div className={`text-[9.5px] mt-0.5 ${msg.from === 'me' ? 'text-white/60' : 'text-[#c8c8d8]'}`}>
                    {timeAgo(msg.time)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-[#f0f0f8] bg-white flex-shrink-0">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={`Message ${user.firstName}…`}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#f5f5fb] border border-transparent text-[12.5px] font-[inherit] outline-none focus:border-[#5b4cf5] focus:bg-white transition-all"
            />
            <button onClick={sendMessage} disabled={!text.trim() || isSending}
              className="w-9 h-9 rounded-xl bg-[#5b4cf5] text-white border-0 cursor-pointer grid place-items-center hover:bg-[#4a3de0] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0">
              <i className="fas fa-paper-plane text-[12px]" />
            </button>
          </div>
          {status && (
            <div className="px-4 pb-3 text-[12px] text-[#5b4cf5]">{status}</div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Stats Bar ─────────────────────────────────────────────────────────── */
function StatsBar({ stats }: { stats: any }) {
  const items = [
    { icon: 'fa-file-alt',  color: '#5b4cf5', bg: '#f4f2ff', label: 'Posts',      value: stats?.totalPosts    ?? 5 },
    { icon: 'fa-comments',  color: '#10b981', bg: '#f0fdf4', label: 'Replies',    value: stats?.totalComments ?? 179 },
    { icon: 'fa-users',     color: '#3b82f6', bg: '#eff6ff', label: 'Members',    value: stats?.totalMembers  ?? 1240 },
    { icon: 'fa-fire',      color: '#ef4444', bg: '#fef2f2', label: 'Active (7d)',value: stats?.recentActive  ?? 84 },
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

/* ── Seed portfolio data shown when API returns nothing ──────────────────── */
/* ── Portfolio Spotlights ────────────────────────────────────────────────── */
function PortfolioSpotlights({ onMessage }: { onMessage: (user: any) => void }) {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    apiFetch('/portfolio/community-feed?limit=6')
      .then(r => {
        const feed = Array.isArray(r.data) ? r.data : (r.data?.users ?? []);
        if (r.success && feed.length > 0) setPortfolios(feed);
        else setPortfolios([]);
      })
      .catch(() => setPortfolios([]))
      .finally(() => setLoading(false));
  }, []);

  const TECH_COLORS: Record<string, string> = {
    React: '#61dafb', TypeScript: '#3178c6', Python: '#3776ab', 'Node.js': '#339933',
    Go: '#00add8', Kubernetes: '#326ce5', AWS: '#ff9900', Docker: '#2496ed',
  };

  if (loading) return (
    <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5 mb-5 animate-pulse">
      <div className="h-4 bg-[#f0f0f8] rounded w-40 mb-4" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="h-44 bg-[#f0f0f8] rounded-xl" />)}
      </div>
    </div>
  );

  if (portfolios.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e8e8f0] mb-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f8]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5b4cf5] to-[#7c3aed] grid place-items-center text-white text-[13px]">
            <i className="fas fa-layer-group" />
          </div>
          <div>
            <h3 className="font-syne font-bold text-[14px] text-[#0a0a0f]">Community Projects</h3>
            <p className="text-[11px] text-[#9898b8]">Shared community projects with live links, tech tags and featured details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/dashboard/portfolio" className="text-[11.5px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-3 py-1.5 rounded-lg no-underline hover:bg-[#5b4cf5] hover:text-white transition-all">
            Share yours
          </a>
          <button onClick={() => setCollapsed(v => !v)}
            className="w-7 h-7 rounded-lg bg-[#f5f5fb] border-0 cursor-pointer text-[#9898b8] grid place-items-center hover:bg-[#f0f0f8] transition-all text-[11px]">
            <i className={`fas fa-chevron-${collapsed ? 'down' : 'up'}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-md:grid-cols-1">
          {portfolios.map(u => (
            <div key={u.id} className="border border-[#f0f0f8] rounded-xl overflow-hidden hover:border-[#5b4cf5]/30 hover:shadow-[0_4px_16px_rgba(91,76,245,0.08)] transition-all group">
              {/* Top project thumbnail */}
              <div className="relative h-24 bg-gradient-to-br from-[#f4f2ff] to-[#e8e8f0] overflow-hidden">
                {u.projects[0]?.thumbnail ? (
                  <img src={u.projects[0].thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[#5b4cf5]/30 text-3xl">
                    <i className="fas fa-code" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <div className="text-white font-semibold text-[11px] truncate">{u.projects[0]?.title || 'Project'}</div>
                </div>
                {u.projects[0]?.score && (
                  <div className="absolute top-2 right-2 bg-white/90 text-[#5b4cf5] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    ★ {u.projects[0].score}
                  </div>
                )}
              </div>

              {/* User info */}
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <Avatar user={u} size={7} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#10b981] rounded-full border border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[12px] text-[#0a0a0f] truncate">{u.firstName} {u.lastName}</div>
                    <div className="text-[10.5px] text-[#9898b8] truncate">{u.title}</div>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {(u.skills || []).slice(0, 3).map((skill: string) => (
                    <span key={skill} className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: (TECH_COLORS[skill] || '#5b4cf5') + '18', color: TECH_COLORS[skill] || '#5b4cf5' }}>
                      {skill}
                    </span>
                  ))}
                  {(u.skills || []).length > 3 && (
                    <span className="text-[9.5px] text-[#9898b8]">+{u.skills.length - 3}</span>
                  )}
                </div>

                {/* Projects count + message */}
                      {u.projects[0] && (
                  <div className="mb-3 rounded-2xl bg-[#f8f8fc] p-3 border border-[#f0f0f8]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold text-[#0a0a0f] mb-1">Featured project</div>
                        <div className="font-semibold text-[13px] text-[#0a0a0f] truncate">
                          {u.projects[0].title}
                        </div>
                        <p className="text-[11px] text-[#6b6b8a] mt-1 line-clamp-2">
                          {u.projects[0].description || 'No project description provided yet.'}
                        </p>
                      </div>
                      {u.projects[0].score && (
                        <div className="text-[11px] font-semibold text-[#5b4cf5] bg-[#eff6ff] px-2 py-1 rounded-full">
                          ★ {u.projects[0].score}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(u.projects[0].technologies || u.projects[0].techStack || []).slice(0, 4).map((skill: string) => (
                        <span key={skill} className="text-[10px] text-[#5b4cf5] bg-[#eff6ff] px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {u.projects[0].liveUrl && (
                        <a href={normalizeExternalLink(u.projects[0].liveUrl)} target="_blank" rel="noreferrer"
                          className="text-[10.5px] font-semibold text-[#2563eb] bg-[#eff6ff] px-2.5 py-1 rounded-full no-underline hover:bg-[#dbeafe] transition-all">
                          Live preview
                        </a>
                      )}
                      {u.projects[0].githubUrl && (
                        <a href={normalizeExternalLink(u.projects[0].githubUrl)} target="_blank" rel="noreferrer"
                          className="text-[10.5px] font-semibold text-[#111827] bg-[#f3f4f6] px-2.5 py-1 rounded-full no-underline hover:bg-[#e5e7eb] transition-all">
                          Code repo
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] text-[#9898b8]">
                    <i className="fas fa-layer-group mr-1" />{u.projects.length} project{u.projects.length !== 1 ? 's' : ''}
                  </span>
                  <button onClick={() => onMessage(u)}
                    className="flex items-center gap-1 text-[10.5px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">
                    <i className="fas fa-paper-plane text-[9px]" />Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OnlineMembersBar({ members, total }: { members: any[]; total: number }) {
  if (members.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-[#e8e8f0] p-4 mb-5 flex items-center gap-3 overflow-x-auto">
      <span className="text-[11.5px] font-semibold text-[#9898b8] uppercase tracking-wide flex-shrink-0">Members</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {members.map((m: any, i: number) => (
          <div key={i} title={`${m.firstName} ${m.lastName}`}
            className="relative flex-shrink-0">
            <Avatar user={m} size={8} />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10b981] rounded-full border-2 border-white" />
          </div>
        ))}
      </div>
      {total > members.length && (
        <span className="text-[11px] text-[#c8c8d8] ml-auto flex-shrink-0">+{total - members.length} more</span>
      )}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
export default function CommunityPage() {
  const user = getCachedUser();
  const [posts,      setPosts]      = useState<any[]>([]);
  const [stats,      setStats]      = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [type,       setType]       = useState('');
  const [sort,       setSort]       = useState('latest');
  const [search,     setSearch]     = useState('');
  const [showNew,    setShowNew]    = useState(false);
  const [chatUser,   setChatUser]   = useState<any>(null);
  const [editPost,   setEditPost]   = useState<any>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  const fetchPosts = useCallback(async (p = 1, t = type, s = sort, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), sort: s });
      if (t) params.set('type', t);
      if (q) params.set('search', q);
      const res = await apiFetch(`/community?${params}`);
      if (res.success) {
        setPosts(res.data.posts || []);
        setPages(res.data.pages || 1);
        setPage(p);
      } else {
        setPosts([]);
        setPages(1);
        setPage(1);
      }
    } catch {
      setPosts([]);
      setPages(1);
    }
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

  async function handleDeletePost(postId: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(postId);
    try {
      const res = await apiFetch(`/community/${postId}`, { method: 'DELETE' });
      if (res.success) setPosts(prev => prev.filter(p => p.id !== postId));
    } catch { /* silent */ }
    finally { setDeleting(null); }
  }

  function handleEditPost(post: any) {
    setEditPost(post);
  }

  function handlePostUpdated(updated: any) {
    setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
  }

  return (
    <SidebarLayout navItems={navItems} pageTitle="Community">
      {showNew && (
        <NewPostModal
          onClose={() => setShowNew(false)}
          onCreated={post => { setPosts(prev => [post, ...prev]); }}
        />
      )}

      {editPost && (
        <EditPostModal
          post={editPost}
          onClose={() => setEditPost(null)}
          onUpdated={handlePostUpdated}
        />
      )}

      {chatUser && <ChatPanel user={chatUser} onClose={() => setChatUser(null)} />}

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
        <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
          <Link href="/dashboard/community/messages"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white font-semibold text-[13px] rounded-xl border border-white/30 no-underline hover:bg-white/30 transition-all">
            <i className="fas fa-inbox" />
            Messages
          </Link>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#5b4cf5] font-semibold text-[13.5px] rounded-xl border-0 cursor-pointer hover:bg-white/90 transition-all shadow-lg">
            <i className="fas fa-plus" />
            New Post
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Online members */}
      <OnlineMembersBar members={[]} total={stats?.totalMembers ?? 0} />

      {/* Portfolio Spotlights */}
      <PortfolioSpotlights onMessage={setChatUser} />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#9898b8] text-[12px]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-3 py-2.5 border border-[#e8e8f0] rounded-xl text-[13px] font-[inherit] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.08)] transition-all"
          />
        </form>
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
        <div className="bg-white rounded-2xl border border-[#e8e8f0] p-12 text-center">
          <div className="w-16 h-16 bg-[#f4f2ff] rounded-2xl grid place-items-center mx-auto mb-4">
            <i className="fas fa-comments text-2xl text-[#5b4cf5]" />
          </div>
          <h3 className="font-syne font-bold text-[16px] text-[#0a0a0f] mb-2">
            {type || search ? 'No posts found' : 'Be the first to post!'}
          </h3>
          <p className="text-[13px] text-[#9898b8] mb-5">
            {type || search
              ? 'Try a different filter or search term.'
              : 'Share your projects, ask questions, or start a discussion with the community.'}
          </p>
          {!type && !search && (
            <button onClick={() => setShowNew(true)}
              className="px-5 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-[13.5px] font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all">
              <i className="fas fa-plus mr-2" />Create first post
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3.5">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onMessage={setChatUser}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              currentUserId={user?.id}
            />
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