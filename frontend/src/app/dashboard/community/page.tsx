'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch, getCachedUser } from '@/lib/api';

const navItems = [
  { href: '/dashboard',              icon: 'fa-home',                 label: 'Dashboard' },
  { href: '/dashboard/courses',      icon: 'fa-book-open',            label: 'Courses' },
  { href: '/dashboard/career-oracle',   icon: 'fa-brain',             label: 'Career Oracle' },
  { href: '/dashboard/skill-coach',     icon: 'fa-heart-pulse',       label: 'Skill Coach' },
  { href: '/dashboard/peer-genome',     icon: 'fa-users',             label: 'Peer Genome' },
  { href: '/dashboard/skill-decay',     icon: 'fa-chart-line',        label: 'Skill Decay' },
  { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles', label: 'Ghost Recruiter' },
  { href: '/dashboard/community',    icon: 'fa-users',                label: 'Community' },
  { href: '/dashboard/portfolio',    icon: 'fa-layer-group',          label: 'Portfolio' },
  { href: '/dashboard/resume',        icon: 'fa-file-lines',           label: 'Resume' },
  { href: '/dashboard/platforms',    icon: 'fa-graduation-cap',       label: 'Learning Platforms' },
  { href: '/dashboard/jobs',         icon: 'fa-briefcase',            label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate',          label: 'Certificates' },
  { href: '/dashboard/rewards',      icon: 'fa-coins',                label: 'Rewards' },
  { href: '/dashboard/settings',     icon: 'fa-gear',                 label: 'Settings' },
];

/* ── Design tokens (match dashboard) ─────────────────────────────────────── */
const D = {
  card:    '#0F1521',
  border:  'rgba(255,255,255,0.07)',
  accent:  '#4F8EF7',
  green:   '#00E5A0',
  amber:   '#F59E0B',
  purple:  '#A78BFA',
  red:     '#F87171',
  muted:   'rgba(255,255,255,0.35)',
  text:    'rgba(255,255,255,0.85)',
  subtext: 'rgba(255,255,255,0.45)',
  input:   'rgba(255,255,255,0.06)',
  hover:   'rgba(255,255,255,0.04)',
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
  const colors   = [D.accent, D.green, D.amber, '#38BDF8', D.red, D.purple];
  const color    = colors[(initials.charCodeAt(0) || 0) % colors.length];
  if (user?.avatar) return <img src={user.avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} style={{ border: `2px solid ${D.border}` }} />;
  return (
    <div className={`w-${size} h-${size} rounded-full flex-shrink-0 grid place-items-center font-bold text-white text-xs`} style={{ background: color }}>
      {initials}
    </div>
  );
}

function Skeleton({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-xl animate-pulse`} style={{ background: 'rgba(255,255,255,0.06)' }} />;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: D.card, border: `1px solid ${D.border}` }}>
      {children}
    </div>
  );
}

function DarkInput({ value, onChange, placeholder, className = '' }: any) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 rounded-xl text-[13.5px] font-[inherit] outline-none transition-all ${className}`}
      style={{
        background: D.input,
        border: `1px solid ${D.border}`,
        color: D.text,
      }}
      onFocus={e => (e.target.style.borderColor = D.accent)}
      onBlur={e => (e.target.style.borderColor = D.border)}
    />
  );
}

/* ── Media preview ───────────────────────────────────────────────────────── */
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
function MediaPreview({ url, type }: { url: string; type: string }) {
  if (!url) return null;
  const cls = 'mt-3 rounded-xl overflow-hidden';
  const borderStyle = { border: `1px solid ${D.border}` };
  if (type === 'video') return <div className={cls} style={borderStyle}><video src={url} controls className="w-full max-h-72" /></div>;
  return <div className={cls} style={borderStyle}><img src={url} alt="" className="w-full max-h-72 object-cover" /></div>;
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
          <div className="w-10 h-10 rounded-xl grid place-items-center text-[15px] flex-shrink-0" style={{ background: it.color + '18', color: it.color }}>
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
    const url  = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/community/post/${post.id}`;
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full" style={{ background: tm.color + '18', color: tm.color, border: `1px solid ${tm.color}30` }}>
            <i className={`fas ${tm.icon} mr-1`} />{post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </span>
          {post.isPinned && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: D.amber + '20', color: D.amber }}>📌 Pinned</span>}
          <button onClick={() => onMessage(post.author)}
            className="w-7 h-7 rounded-lg border-0 cursor-pointer grid place-items-center text-[11px] transition-all hover:opacity-80"
            style={{ background: D.accent + '18', color: D.accent }}><i className="fas fa-paper-plane" /></button>
          {isOwner && (
            <div className="relative">
              <button onClick={() => setShowActions(v => !v)}
                className="w-7 h-7 rounded-lg border-0 cursor-pointer grid place-items-center text-[11px] transition-all"
                style={{ background: D.input, color: D.muted }}><i className="fas fa-ellipsis-v" /></button>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 top-full mt-1 z-[101] rounded-xl overflow-hidden w-[140px] shadow-2xl"
                    style={{ background: '#0D1525', border: `1px solid ${D.border}` }}>
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-[13px] border-0 cursor-pointer transition-all select-none`}
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
                <div className="fixed inset-0 z-[100]" onClick={() => setShowShareMenu(false)} />
                <div className="absolute right-0 bottom-full mb-2 z-[101] rounded-2xl overflow-hidden w-[180px] shadow-2xl"
                  style={{ background: '#0D1525', border: `1px solid ${D.border}` }}>
                  <div className="px-3.5 py-2.5" style={{ borderBottom: `1px solid ${D.border}` }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>Share via</p>
                  </div>
                  {[
                    { icon: 'fa-link',                    label: 'Copy link',   action: 'copy',      color: D.accent  },
                    { icon: 'fa-brands fa-x-twitter',     label: 'X / Twitter', action: 'twitter',   color: '#E2E8F0' },
                    { icon: 'fa-brands fa-linkedin',      label: 'LinkedIn',    action: 'linkedin',  color: '#38BDF8' },
                    { icon: 'fa-brands fa-whatsapp',      label: 'WhatsApp',    action: 'whatsapp',  color: D.green   },
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
    <div className="fixed inset-0 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        style={{ background: '#0D1525', border: `1px solid ${D.border}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-jakarta font-bold text-[17px] text-white">Edit Post</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border-0 cursor-pointer grid place-items-center transition-all hover:opacity-80"
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
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-[13.5px] font-semibold font-[inherit] cursor-pointer transition-all hover:opacity-80"
            style={{ border: `1px solid ${D.border}`, color: D.muted, background: 'transparent' }}>Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-3 rounded-xl text-[13.5px] font-semibold font-[inherit] cursor-pointer transition-all disabled:opacity-60 text-white"
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
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr]         = useState('');
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string } | null>(null);
  const [mediaTab, setMediaTab] = useState<'url' | 'upload'>('url');
  const [mediaUrl, setMediaUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleMediaUrl() {
    if (!mediaUrl.trim()) return;
    const isGif   = mediaUrl.toLowerCase().includes('.gif') || mediaUrl.includes('giphy');
    const isVideo  = /\.(mp4|webm|mov)/.test(mediaUrl.toLowerCase());
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
    <div className="fixed inset-0 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        style={{ background: '#0D1525', border: `1px solid ${D.border}` }} onClick={e => e.stopPropagation()}>
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
          { label: 'Title', key: 'title', type: 'input', placeholder: "What's on your mind?" },
          { label: 'Content', key: 'body', type: 'textarea', placeholder: 'Share your ideas, projects, or questions...' },
          { label: 'Tags (comma-separated)', key: 'tags', type: 'input', placeholder: 'react, typescript, career' },
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
                  <button onClick={handleMediaUrl} className="px-3 py-2 rounded-lg border-0 cursor-pointer text-[12px] font-semibold text-white transition-all hover:opacity-80"
                    style={{ background: D.accent }}>Add</button>
                </div>
              ) : (
                <div>
                  <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" onChange={handleFileUpload} className="hidden" id="media-upload" />
                  <label htmlFor="media-upload" className="flex flex-col items-center justify-center gap-2 py-5 cursor-pointer rounded-lg transition-all hover:opacity-80"
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
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold font-[inherit] cursor-pointer transition-all hover:opacity-80"
            style={{ border: `1px solid ${D.border}`, color: D.muted, background: 'transparent' }}>Cancel</button>
          <button onClick={submit} disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-0 cursor-pointer transition-all disabled:opacity-60 text-white"
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
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
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
    <div className={`fixed bottom-6 right-6 z-[400] w-[340px] rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all ${minimized ? 'h-[56px]' : 'h-[460px]'}`}
      style={{ background: '#0D1525', border: `1px solid ${D.border}` }}>
      <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${D.accent}, #38BDF8)` }}>
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
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed`}
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
          <div className="flex items-center gap-2 p-3 flex-shrink-0" style={{ borderTop: `1px solid ${D.border}`, background: D.card }}>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={`Message ${user.firstName}…`}
              className="flex-1 px-3.5 py-2.5 rounded-xl text-[12.5px] font-[inherit] outline-none transition-all"
              style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }} />
            <button onClick={sendMessage} disabled={!text.trim() || isSending}
              className="w-9 h-9 rounded-xl border-0 cursor-pointer grid place-items-center disabled:opacity-50 transition-all hover:opacity-80 flex-shrink-0"
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
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    apiFetch('/portfolio/community-feed?limit=6')
      .then(r => {
        const feed = Array.isArray(r.data) ? r.data : (r.data?.users ?? []);
        setPortfolios(r.success && feed.length > 0 ? feed : []);
      })
      .catch(() => setPortfolios([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="rounded-2xl p-5 mb-5 animate-pulse" style={{ background: D.card, border: `1px solid ${D.border}` }}>
      <div className="h-4 rounded w-40 mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="h-44 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />)}</div>
    </div>
  );
  if (portfolios.length === 0) return null;

  return (
    <div className="rounded-2xl mb-5 overflow-hidden" style={{ background: D.card, border: `1px solid ${D.border}` }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${D.border}` }}>
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
          <a href="/dashboard/portfolio" className="text-[11.5px] font-semibold no-underline px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: D.accent + '18', color: D.accent, border: `1px solid ${D.accent}20` }}>Share yours</a>
          <button onClick={() => setCollapsed(v => !v)} className="w-7 h-7 rounded-lg border-0 cursor-pointer grid place-items-center text-[11px] transition-all hover:opacity-80"
            style={{ background: D.input, color: D.muted }}><i className={`fas fa-chevron-${collapsed ? 'down' : 'up'}`} /></button>
        </div>
      </div>
      {!collapsed && (
        <div className="p-4 grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-md:grid-cols-1">
          {portfolios.map(u => (
            <div key={u.id} className="rounded-xl overflow-hidden group transition-all hover:-translate-y-0.5"
              style={{ border: `1px solid ${D.border}` }}>
              <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${D.accent}20, ${D.purple}20)` }}>
                {u.projects[0]?.thumbnail
                  ? <img src={u.projects[0].thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full grid place-items-center text-3xl" style={{ color: D.accent + '40' }}><i className="fas fa-code" /></div>}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,21,33,0.7), transparent)' }} />
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <div className="text-white font-semibold text-[11px] truncate">{u.projects[0]?.title || 'Project'}</div>
                </div>
              </div>
              <div className="p-3" style={{ background: D.card }}>
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
                    className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer transition-all hover:opacity-80"
                    style={{ background: D.accent + '18', color: D.accent }}>
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

/* ── Main Page ───────────────────────────────────────────────────────────── */
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
  const [chatUser, setChatUser] = useState<any>(null);
  const [editPost, setEditPost] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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
        {showNew && <NewPostModal onClose={() => setShowNew(false)} onCreated={post => { setPosts(prev => [post, ...prev]); }} />}
        {editPost && <EditPostModal post={editPost} onClose={() => setEditPost(null)} onUpdated={updated => setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))} />}
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
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/dashboard/community/messages"
                className="flex items-center gap-2 px-4 py-2.5 font-semibold text-[13px] rounded-xl no-underline transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: `1px solid ${D.border}` }}>
                <i className="fas fa-inbox" />Messages
              </Link>
              <button onClick={() => setShowNew(true)}
                className="flex items-center gap-2 px-5 py-2.5 font-semibold text-[13.5px] rounded-xl border-0 cursor-pointer transition-all hover:opacity-90 text-white"
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

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: D.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchPosts(1, type, sort, search)}
              placeholder="Search posts…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-[13px] font-[inherit] outline-none transition-all"
              style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }} />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-[13px] font-[inherit] outline-none cursor-pointer transition-all"
            style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }}>
            <option value="latest">Latest</option>
            <option value="popular">Most Liked</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        {/* Type filter tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {POST_TYPES.map(t => {
            const tm = TYPE_META[t.value];
            const active = type === t.value;
            return (
              <button key={t.value} onClick={() => setType(t.value)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold cursor-pointer transition-all"
                style={{
                  background: active ? (tm?.color || D.accent) + '20' : D.input,
                  color: active ? (tm?.color || D.accent) : D.muted,
                  border: `1px solid ${active ? (tm?.color || D.accent) + '50' : D.border}`,
                }}>
                <i className={`fas ${t.icon} text-[11px]`} />{t.label}
              </button>
            );
          })}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="grid gap-3.5">{[1,2,3].map(i => (
            <div key={i} className="rounded-2xl p-5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <div className="flex items-center gap-3 mb-3">
                <Skeleton h="h-9" w="w-9" />
                <div className="flex-1"><Skeleton h="h-3" w="w-1/3" /><div className="mt-1.5"><Skeleton h="h-2.5" w="w-1/5" /></div></div>
              </div>
              <Skeleton h="h-4" w="w-3/4" /><div className="mt-2"><Skeleton h="h-3" /></div><div className="mt-1.5"><Skeleton h="h-3" w="w-4/5" /></div>
            </div>
          ))}</div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: D.card, border: `1px solid ${D.border}` }}>
            <div className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: D.accent + '18' }}>
              <i className="fas fa-comments text-2xl" style={{ color: D.accent }} />
            </div>
            <h3 className="font-jakarta font-bold text-[16px] text-white mb-2">{type || search ? 'No posts found' : 'Be the first to post!'}</h3>
            <p className="text-[13px] mb-5" style={{ color: D.subtext }}>
              {type || search ? 'Try a different filter or search term.' : 'Share your projects, ask questions, or start a discussion.'}
            </p>
            {!type && !search && (
              <button onClick={() => setShowNew(true)}
                className="px-5 py-2.5 rounded-xl text-[13.5px] font-semibold border-0 cursor-pointer text-white transition-all hover:opacity-90"
                style={{ background: D.accent }}>
                <i className="fas fa-plus mr-2" />Create first post
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3.5">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike}
                onMessage={setChatUser} onEdit={setEditPost} onDelete={handleDeletePost} currentUserId={user?.id} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => fetchPosts(page - 1)} disabled={page === 1}
              className="w-9 h-9 rounded-xl border-0 grid place-items-center cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
              style={{ background: D.input, color: D.muted }}>
              <i className="fas fa-chevron-left" />
            </button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => fetchPosts(p)}
                className="w-9 h-9 rounded-xl text-[13px] font-semibold border-0 cursor-pointer transition-all"
                style={{ background: p === page ? D.accent : D.input, color: p === page ? 'white' : D.muted }}>
                {p}
              </button>
            ))}
            <button onClick={() => fetchPosts(page + 1)} disabled={page === pages}
              className="w-9 h-9 rounded-xl border-0 grid place-items-center cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
              style={{ background: D.input, color: D.muted }}>
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
