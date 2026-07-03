'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const D = {
  card:    'var(--card-bg)',
  border:  'var(--card-border)',
  accent:  '#4F8EF7',
  green:   '#00E5A0',
  amber:   '#F59E0B',
  purple:  '#A78BFA',
  red:     '#F87171',
  muted:   'var(--text-faint)',
  text:    'var(--text-body)',
  strong:  'var(--text-strong)',
  subtext: 'var(--text-faint)',
  input:   'var(--input-bg)',
  soft:    'var(--surface-soft)',
  softHover: 'var(--surface-soft-hover)',
  borderStrong: 'var(--border-strong)',
};

function Skeleton({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-xl animate-pulse`} style={{ background: D.soft }} />;
}

function Toast({ msg, type, onDone }: { msg: string; type: 'ok' | 'err'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl font-semibold text-[13px] text-white shadow-2xl animate-fade-in"
      style={{ background: type === 'ok' ? '#00C07F' : '#EF4444', minWidth: 240 }}>
      <i className={`fas ${type === 'ok' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-[15px]`} />
      {msg}
    </div>
  );
}

/* ── Profile Strength Ring ──────────────────────────────────────────────────── */
function StrengthRing({ value }: { value: number }) {
  const r = 30; const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  const color = value >= 80 ? D.green : value >= 50 ? D.accent : D.amber;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76">
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--border-soft)" strokeWidth="5" />
      <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 38 38)" />
      <text x="38" y="44" textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>{value}%</text>
    </svg>
  );
}

/* ── Tip card ──────────────────────────────────────────────────────────────── */
function TipCard({ icon, text, accent }: { icon: string; text: string; accent: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl"
      style={{ background: `${accent}0d`, border: `1px solid ${accent}22` }}>
      <div className="w-7 h-7 rounded-lg grid place-items-center flex-shrink-0 text-[11px]"
        style={{ background: `${accent}18`, color: accent }}>
        <i className={`fas ${icon}`} />
      </div>
      <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: D.subtext }}>{text}</p>
    </div>
  );
}

/* ── Drop zone ─────────────────────────────────────────────────────────────── */
function DropZone({ onFile, uploading }: { onFile: (f: File) => void; uploading: boolean }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const handle = (f: File | undefined) => {
    if (!f) return;
    if (!accept.includes(f.type)) return;
    if (f.size > 5 * 1024 * 1024) return;
    onFile(f);
  };

  return (
    <div
      className="rounded-2xl flex flex-col items-center justify-center gap-4 py-14 px-6 text-center cursor-pointer transition-all relative"
      style={{
        border: `2px dashed ${dragging ? D.accent : D.borderStrong}`,
        background: dragging ? `${D.accent}08` : D.input,
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
        onChange={e => handle(e.target.files?.[0])} disabled={uploading} />
      <div className="w-16 h-16 rounded-2xl grid place-items-center text-[26px]"
        style={{ background: `${D.accent}15`, color: D.accent }}>
        {uploading
          ? <i className="fas fa-spinner fa-spin" />
          : <i className="fas fa-cloud-arrow-up" />}
      </div>
      <div>
        <p className="font-jakarta font-bold text-[15px] mb-1.5" style={{ color: D.text }}>
          {uploading ? 'Uploading…' : 'Drop your resume here'}
        </p>
        <p className="text-[12.5px]" style={{ color: D.muted }}>
          {uploading ? 'Please wait' : 'PDF, DOC or DOCX · Max 5 MB'}
        </p>
      </div>
      {!uploading && (
        <div className="px-5 py-2.5 rounded-xl font-semibold text-[13px]"
          style={{ background: D.accent, color: '#fff' }}>
          Browse File
        </div>
      )}
    </div>
  );
}

/* ── Resume file card ──────────────────────────────────────────────────────── */
function ResumeCard({
  resume, onDelete, onReplace, deleting
}: {
  resume: { fileUrl: string; fileName: string; updatedAt: string };
  onDelete: () => void;
  onReplace: (f: File) => void;
  deleting: boolean;
}) {
  const replaceRef = useRef<HTMLInputElement>(null);
  const ext = resume.fileName.split('.').pop()?.toUpperCase() || 'FILE';
  const extColor = ext === 'PDF' ? '#F87171' : D.accent;
  const date = new Date(resume.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: D.card, border: `1px solid ${D.border}` }}>
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${D.accent}, ${D.green})` }} />
      <div className="p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl grid place-items-center flex-shrink-0 relative"
          style={{ background: `${extColor}15`, border: `1px solid ${extColor}30` }}>
          <i className="fas fa-file-lines text-[22px]" style={{ color: extColor }} />
          <span className="absolute -bottom-1 -right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full"
            style={{ background: extColor, color: '#fff' }}>
            {ext}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-jakarta font-bold text-[15px] truncate mb-1" style={{ color: D.text }}>
            {resume.fileName}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold"
              style={{ background: `${D.green}18`, color: D.green }}>
              <i className="fas fa-check-circle text-[9px]" /> Active
            </span>
            <span className="text-[11.5px]" style={{ color: D.muted }}>
              Updated {date}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <a href={resume.fileUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold no-underline transition-all hover:opacity-80"
            style={{ background: `${D.accent}15`, color: D.accent, border: `1px solid ${D.accent}30` }}>
            <i className="fas fa-eye text-[11px]" /> Preview
          </a>
          <a href={resume.fileUrl} download={resume.fileName}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold no-underline transition-all hover:opacity-80"
            style={{ background: `${D.green}15`, color: D.green, border: `1px solid ${D.green}30` }}>
            <i className="fas fa-download text-[11px]" /> Download
          </a>
          <button onClick={() => replaceRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80"
            style={{ background: `${D.amber}15`, color: D.amber, border: `1px solid ${D.amber}30` }}>
            <i className="fas fa-arrow-rotate-right text-[11px]" /> Replace
          </button>
          <button onClick={onDelete} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: `${D.red}15`, color: D.red, border: `1px solid ${D.red}30` }}>
            <i className={`fas ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'} text-[11px]`} />
            {deleting ? 'Removing…' : 'Remove'}
          </button>
          <input ref={replaceRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onReplace(f); }} />
        </div>
      </div>
      <div className="px-6 pb-5">
        <div className="flex items-center gap-2.5 p-3 rounded-xl text-[12px]"
          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}` }}>
          <i className="fas fa-building text-[11px]" style={{ color: D.muted }} />
          <span style={{ color: D.muted }}>
            Employers and recruiters can view this resume when your profile is public.{' '}
            <a href="/dashboard/settings" className="no-underline font-semibold" style={{ color: D.accent }}>
              Manage visibility →
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Resume Builder Checklist ───────────────────────────────────────────────── */
function ResumeChecklist({ profile }: { profile: any }) {
  const checks = [
    { label: 'Full name & contact info',     done: !!(profile?.firstName && profile?.email),    icon: 'fa-user' },
    { label: 'Professional headline / title', done: !!profile?.title,                            icon: 'fa-heading' },
    { label: 'Bio or summary',               done: !!profile?.bio,                              icon: 'fa-align-left' },
    { label: 'Location',                     done: !!profile?.location,                         icon: 'fa-location-dot' },
    { label: 'Skills added',                 done: (profile?.skills?.length || 0) > 0,          icon: 'fa-tags' },
    { label: 'Portfolio projects',           done: (profile?.projectCount || 0) > 0,            icon: 'fa-layer-group' },
    { label: 'Verified certificates',        done: (profile?.certCount || 0) > 0,               icon: 'fa-certificate' },
    { label: 'Resume file uploaded',         done: !!profile?.hasResume,                        icon: 'fa-file-lines' },
  ];
  const doneCount = checks.filter(c => c.done).length;

  return (
    <div className="rounded-2xl p-5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-jakarta font-bold text-[14px]" style={{ color: D.text }}>Resume Readiness</h3>
        <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: `${D.green}18`, color: D.green }}>
          {doneCount}/{checks.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / checks.length) * 100}%`, background: `linear-gradient(90deg, ${D.accent}, ${D.green})` }} />
      </div>
      <div className="flex flex-col gap-2.5">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full grid place-items-center flex-shrink-0 text-[9px]"
              style={{ background: c.done ? `${D.green}20` : 'rgba(255,255,255,0.06)', color: c.done ? D.green : D.muted }}>
              <i className={`fas ${c.done ? 'fa-check' : c.icon}`} />
            </div>
            <span className="text-[12.5px] flex-1" style={{ color: c.done ? D.text : D.muted }}>
              {c.label}
            </span>
            {!c.done && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', color: D.muted }}>
                Missing
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── AI Resume Section ──────────────────────────────────────────────────────── */
interface AiResume {
  id: string;
  content: string;
  dataSummary?: {
    completedCourses: number;
    skills: number;
    projects: number;
    certificates: number;
  };
  generatedAt: string;
  updatedAt: string;
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2 style="font-size:15px;font-weight:800;color:#0f172a;margin:24px 0 10px;padding-bottom:6px;border-bottom:1px solid #cbd5e1;text-transform:uppercase;letter-spacing:0.08em">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:13px;font-weight:700;color:#1e293b;margin:14px 0 6px">$1</h3>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:28px;font-weight:800;color:#020617;margin:0 0 6px;letter-spacing:-0.03em">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#020617">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#475569">$1</em>')
    .replace(/^\- (.+)$/gm, '<li style="margin:4px 0;color:#334155">$1</li>')
    .replace(/(<li.*<\/li>)/gs, '<ul style="margin:6px 0;padding-left:20px">$1</ul>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:#2563eb;text-decoration:none">$1</a>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #cbd5e1;margin:12px 0">')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function DataSummaryBar({ summary }: { summary: AiResume['dataSummary'] }) {
  if (!summary) return null;
  const stats = [
    { icon: '🎓', label: 'Courses', value: summary.completedCourses },
    { icon: '✨', label: 'Skills', value: summary.skills },
    { icon: '🚀', label: 'Projects', value: summary.projects },
    { icon: '📜', label: 'Certs', value: summary.certificates },
  ];
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize: 18 }}>{s.icon}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function ResumePage() {
  const [resume, setResume]       = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [toast, setToast]         = useState('');
  const [toastType, setToastType] = useState<'ok' | 'err'>('ok');
  const [visibility, setVisibility] = useState(true);
  const [togglingVis, setTogglingVis] = useState(false);

  // AI Resume state
  const [aiResume, setAiResume] = useState<AiResume | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [copied, setCopied] = useState(false);
  const [aiTab, setAiTab] = useState<'view' | 'preview'>('view');
  const [editingAiResume, setEditingAiResume] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const [savingAiResume, setSavingAiResume] = useState(false);

  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast(msg);
    setToastType(type);
  }, []);

  useEffect(() => {
    setAiDraft(aiResume?.content || '');
  }, [aiResume?.content]);

  /* ── Fetch data ───────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      apiFetch('/resume'),
      apiFetch('/resume/visibility'),
      apiFetch('/dashboard'),
      apiFetch('/resume/ai'),
    ]).then(([r, v, dash, ai]) => {
      setResume(r.data || null);
      setVisibility(v.data?.portfolioPublic ?? true);
      if (ai.success && ai.data) setAiResume(ai.data);
      if (dash.success && dash.data) {
        const u = dash.data.user || dash.data;
        setProfile({
          firstName:    u.firstName,
          email:        u.email,
          title:        u.title,
          bio:          u.bio,
          location:     u.location,
          skills:       u.skills || [],
          profileStrength: u.profileStrength ?? 20,
          projectCount: (dash.data.projects?.length || 0),
          certCount:    (dash.data.certificates?.length || 0),
          hasResume:    !!(r.data),
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));

    // Refresh profile data when window comes into focus (e.g., after editing in settings)
    const handleFocus = () => {
      apiFetch('/dashboard').then(dash => {
        if (dash.success && dash.data) {
          const u = dash.data.user || dash.data;
          setProfile((p: any) => ({
            ...p,
            firstName:    u.firstName,
            email:        u.email,
            title:        u.title,
            bio:          u.bio,
            location:     u.location,
            skills:       u.skills || [],
            profileStrength: u.profileStrength ?? 20,
            projectCount: (dash.data.projects?.length || 0),
            certCount:    (dash.data.certificates?.length || 0),
          }));
        }
      }).catch(() => {});
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  /* ── Upload ───────────────────────────────────────────────────── */
  async function uploadFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      showToast('File too large. Max size is 5MB.', 'err'); return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      const res = await fetch('/api/v1/resume', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setResume(data.data);
        setProfile((p: any) => p ? { ...p, hasResume: true } : p);
        showToast('Resume uploaded successfully! +1 MeritCoin on first upload 🎉');
      } else {
        showToast(data.message || 'Upload failed', 'err');
      }
    } catch {
      showToast('Upload failed. Please try again.', 'err');
    } finally {
      setUploading(false);
    }
  }

  /* ── Delete ───────────────────────────────────────────────────── */
  async function handleDelete() {
    if (!confirm('Remove your resume? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const r = await apiFetch('/resume', { method: 'DELETE' });
      if (r.success) {
        setResume(null);
        setProfile((p: any) => p ? { ...p, hasResume: false } : p);
        showToast('Resume removed.');
      } else {
        showToast(r.message || 'Delete failed', 'err');
      }
    } catch {
      showToast('Delete failed. Please try again.', 'err');
    } finally {
      setDeleting(false);
    }
  }

  /* ── Toggle visibility ────────────────────────────────────────── */
  async function toggleVisibility(val: boolean) {
    setTogglingVis(true);
    try {
      const r = await apiFetch('/resume/visibility', {
        method: 'PUT',
        body: JSON.stringify({ portfolioPublic: val }),
      });
      if (r.success) {
        setVisibility(val);
        showToast(`Profile is now ${val ? 'public' : 'private'}.`);
      } else {
        showToast(r.message || 'Update failed', 'err');
      }
    } catch {
      showToast('Update failed.', 'err');
    } finally {
      setTogglingVis(false);
    }
  }

  /* ── Generate AI Resume ───────────────────────────────────────── */
  async function generateAIResume() {
    setGenerating(true);
    setGenError('');
    try {
      const r = await fetch('/api/v1/resume/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await r.json();
      if (data.success) {
        const ai = await apiFetch('/resume/ai');
        if (ai.success && ai.data) {
          setAiResume(ai.data);
          setEditingAiResume(false);
          setAiTab('preview');
        }
        showToast('AI resume generated successfully! ✨');
      } else {
        setGenError(data.message || 'Generation failed. Please try again.');
      }
    } catch {
      setGenError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard() {
    if (!aiDraft) return;
    navigator.clipboard.writeText(aiDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveAiResumeEdits() {
    const trimmed = aiDraft.trim();
    if (!trimmed) {
      showToast('Resume content cannot be empty.', 'err');
      return;
    }

    setSavingAiResume(true);
    try {
      const res = await apiFetch('/resume/ai', {
        method: 'PUT',
        body: JSON.stringify({ content: trimmed }),
      });

      if (res.success && res.data) {
        setAiResume(res.data);
        setEditingAiResume(false);
        setAiTab('preview');
        showToast('AI resume updated successfully!');
      } else {
        showToast(res.message || 'Failed to save AI resume.', 'err');
      }
    } catch {
      showToast('Failed to save AI resume.', 'err');
    } finally {
      setSavingAiResume(false);
    }
  }

  function previewResume() {
    if (!aiDraft) return;
    const html = renderMarkdown(aiDraft);
    const win = window.open('', '_blank');
    if (!win) { alert('Please allow pop-ups to preview your resume.'); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>Resume Preview</title>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; background: #e2e8f0; color: #334155; }
        .page-shell { min-height: 100vh; padding: 40px 20px; }
        .toolbar { position: fixed; top: 16px; right: 16px; z-index: 10; }
        .toolbar button { font-family: Arial, sans-serif; padding: 10px 18px; background: #2563eb; color: #fff;
                          border: none; border-radius: 999px; cursor: pointer; font-weight: 700; box-shadow: 0 12px 30px rgba(37, 99, 235, 0.25); }
        .paper { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #dbe4f0; border-radius: 28px;
                 box-shadow: 0 30px 90px rgba(2, 6, 23, 0.18); padding: 32px 40px; }
        .paper-inner { max-width: 780px; margin: 0 auto; }
        .paper-head { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #dbe4f0;
                      display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
        .eyebrow { margin: 0; color: #2563eb; font: 700 11px/1.2 Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.16em; }
        .subcopy { margin: 8px 0 0; color: #64748b; font: 400 12px/1.5 Arial, sans-serif; }
        .meta { color: #64748b; font: 400 11px/1.5 Arial, sans-serif; text-align: right; }
        .meta strong { display: block; color: #0f172a; font-size: 13px; }
        .content { font-family: Georgia, 'Times New Roman', serif; line-height: 1.75; color: #334155; }
        .content h1 { font-size: 28px; font-weight: 800; color: #020617; margin: 0 0 6px; letter-spacing: -0.03em; }
        .content h2 { font-size: 15px; font-weight: 800; color: #0f172a; margin: 24px 0 10px; padding-bottom: 6px;
                      border-bottom: 1px solid #cbd5e1; text-transform: uppercase; letter-spacing: 0.08em; }
        .content h3 { font-size: 13px; font-weight: 700; color: #1e293b; margin: 14px 0 6px; }
        .content a { color: #2563eb; text-decoration: none; }
        .content ul { margin: 6px 0; padding-left: 20px; }
        .content li { margin: 4px 0; }
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: #fff; }
          .no-print { display: none !important; }
          .page-shell { padding: 0; min-height: auto; }
          .paper { max-width: none; margin: 0; border: none; border-radius: 0; box-shadow: none; padding: 0; }
          .paper-inner { max-width: none; }
          .content { font-size: 12pt; }
        }
      </style></head>
      <body>
        <div class="toolbar no-print"><button onclick="window.print()">Print / Save as PDF</button></div>
        <div class="page-shell">
          <div class="paper">
            <div class="paper-inner">
              <div class="paper-head">
                <div>
                  <p class="eyebrow">Professional Resume</p>
                  <p class="subcopy">Designed for recruiter review and PDF export.</p>
                </div>
                <div class="meta">Last updated<strong>${resumeLastUpdatedLabel}</strong></div>
              </div>
              <div class="content">${html}</div>
            </div>
          </div>
        </div>
      </body></html>`);
    win.document.close();
  }

  function downloadMarkdown() {
    if (!aiDraft) return;
    const blob = new Blob([aiDraft], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-resume.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadTxt() {
    if (!aiDraft) return;
    const txt = aiDraft
      .replace(/[#*_`]/g, '').replace(/\[(.+?)\]\(.+?\)/g, '$1').replace(/\n{3,}/g, '\n\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-resume.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Compute real profile strength from completion signals ──────── */
  const computedStrength = (() => {
    if (!profile) return 20;
    const signals = [
      !!(profile.firstName && profile.email),
      !!profile.title,
      !!profile.bio,
      !!profile.location,
      (profile.skills?.length || 0) > 0,
      (profile.projectCount || 0) > 0,
      (profile.certCount || 0) > 0,
      !!profile.hasResume,
    ];
    const done = signals.filter(Boolean).length;
    return Math.round((done / signals.length) * 100);
  })();

  const resumeLastUpdatedLabel = aiResume
    ? new Date(aiResume.updatedAt || aiResume.generatedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <SidebarLayout navItems={navItems} pageTitle="Resume">
      {toast && <Toast msg={toast} type={toastType} onDone={() => setToast('')} />}

      <div className="p-6 max-w-[1100px] mx-auto space-y-6">

        {/* ── Page header ───────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-jakarta font-extrabold text-[1.6rem] mb-1" style={{ color: D.strong }}>My Resume</h1>
            <p className="text-[13.5px]" style={{ color: D.subtext }}>
              Upload, manage, and share your professional resume with employers.
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: D.card, border: `1px solid ${D.border}` }}>
            <div className="text-right">
              <p className="text-[12px] font-semibold" style={{ color: D.text }}>Profile Visibility</p>
              <p className="text-[11px]" style={{ color: visibility ? D.green : D.muted }}>
                {visibility ? 'Public — visible to employers' : 'Private — hidden from employers'}
              </p>
            </div>
            <button
              onClick={() => !togglingVis && toggleVisibility(!visibility)}
              disabled={togglingVis}
              className="relative w-11 h-6 rounded-full border-0 cursor-pointer transition-all flex-shrink-0 disabled:opacity-60"
              style={{ background: visibility ? D.green : D.borderStrong, padding: 0 }}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                style={{ left: visibility ? '22px' : '2px' }} />
            </button>
          </div>
        </div>

        {/* ── AI Resume Section ──────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: D.card, border: `1px solid ${D.border}` }}>
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${D.accent}, #6BA0FF)` }} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h2 className="font-jakarta font-bold text-[16px] flex items-center gap-2" style={{ color: D.strong }}>
                  <span style={{ color: D.accent }}>🤖</span> AI-Powered Resume
                </h2>
                <p className="text-[12px]" style={{ color: D.subtext }}>
                  Generate a professional resume from your SkillHub progress, skills, and certificates.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateAIResume}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border-0 cursor-pointer transition-all disabled:opacity-50"
                  style={{ background: D.accent, color: '#fff' }}>
                  {generating ? (
                    <><i className="fas fa-spinner fa-spin" /> Generating…</>
                  ) : (
                    <><i className="fas fa-wand-magic-sparkles" /> {aiResume ? 'Regenerate' : 'Generate'}</>
                  )}
                </button>
                {aiResume && (
                  <>
                    <button onClick={() => {
                      setEditingAiResume(v => !v);
                      setAiDraft(aiResume.content);
                      setAiTab(v => (v === 'view' ? 'preview' : v));
                    }}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80"
                      style={{ background: D.soft, color: D.text, border: `1px solid ${D.border}` }}>
                      <i className={`fas ${editingAiResume ? 'fa-xmark' : 'fa-pen'}`} /> {editingAiResume ? 'Cancel Edit' : 'Edit'}
                    </button>
                    <button onClick={copyToClipboard}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80"
                      style={{ background: D.soft, color: D.text, border: `1px solid ${D.border}` }}>
                      <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} /> {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button onClick={previewResume}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80"
                      style={{ background: `${D.accent}15`, color: D.accent, border: `1px solid ${D.accent}30` }}>
                      <i className="fas fa-eye" /> Preview
                    </button>
                    <button onClick={downloadMarkdown}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80"
                      style={{ background: D.soft, color: D.text, border: `1px solid ${D.border}` }}>
                      <i className="fas fa-download" /> .md
                    </button>
                    <button onClick={downloadTxt}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80"
                      style={{ background: D.soft, color: D.text, border: `1px solid ${D.border}` }}>
                      <i className="fas fa-file-lines" /> .txt
                    </button>
                  </>
                )}
              </div>
            </div>

            {genError && (
              <div className="rounded-xl p-3 text-[13px] mb-4"
                style={{ background: `${D.red}15`, border: `1px solid ${D.red}30`, color: D.red }}>
                ⚠️ {genError}
              </div>
            )}

            {generating ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-4 animate-pulse">🤖</div>
                <p className="font-semibold text-[15px]" style={{ color: D.accent }}>AI is building your resume…</p>
                <p className="text-[13px] mt-1" style={{ color: D.subtext }}>Reading your courses, skills, projects and certificates…</p>
              </div>
            ) : aiResume ? (
              <div>
                <DataSummaryBar summary={aiResume.dataSummary} />
                {editingAiResume ? (
                  <div className="space-y-4">
                    <div className="rounded-xl p-4" style={{ background: D.soft, border: `1px solid ${D.border}` }}>
                      <label className="block text-[12px] font-semibold mb-2" style={{ color: D.muted }}>Edit Resume Content</label>
                      <textarea
                        value={aiDraft}
                        onChange={e => setAiDraft(e.target.value)}
                        rows={20}
                        className="w-full rounded-xl px-4 py-3 text-[13px] font-mono outline-none resize-y"
                        style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text, lineHeight: 1.7 }}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingAiResume(false); setAiDraft(aiResume.content); }}
                        className="px-4 py-2.5 rounded-xl text-[12px] font-semibold border-0 cursor-pointer"
                        style={{ background: D.soft, color: D.text, border: `1px solid ${D.border}` }}>
                        Discard
                      </button>
                      <button onClick={saveAiResumeEdits} disabled={savingAiResume}
                        className="px-4 py-2.5 rounded-xl text-[12px] font-semibold border-0 cursor-pointer disabled:opacity-60"
                        style={{ background: D.accent, color: '#fff' }}>
                        {savingAiResume ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-[28px] p-6 md:p-8 max-h-[720px] overflow-y-auto shadow-[0_30px_90px_rgba(2,6,23,0.18)]"
                      style={{ background: '#fff', border: '1px solid #dbe4f0' }}>
                      <div className="mx-auto max-w-[780px]">
                        <div className="mb-6 flex items-start justify-between gap-4 border-b pb-5" style={{ borderColor: '#dbe4f0' }}>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: '#2563eb' }}>Professional Resume</p>
                            <p className="text-[12px] mt-2" style={{ color: '#64748b' }}>Designed for recruiter review and PDF export.</p>
                          </div>
                          <div className="text-right text-[11px]" style={{ color: '#64748b' }}>
                            <div>Last updated</div>
                            <div className="font-semibold" style={{ color: '#0f172a' }}>{resumeLastUpdatedLabel}</div>
                          </div>
                        </div>
                        <div style={{ fontFamily: '"Georgia", "Times New Roman", serif', lineHeight: 1.75, color: '#334155' }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(aiDraft) }} />
                      </div>
                    </div>
                    <div className="mt-3 text-[11px]" style={{ color: D.muted }}>
                      Last generated: {new Date(aiResume.generatedAt).toLocaleString()}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="text-5xl mb-4">📄</div>
                <p className="font-semibold text-[15px]" style={{ color: D.text }}>No AI resume yet</p>
                <p className="text-[13px]" style={{ color: D.subtext }}>
                  Click "Generate" to let AI build your professional resume from your SkillHub progress.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Main grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-[1fr_320px] gap-6 max-lg:grid-cols-1">

          {/* Left column */}
          <div className="space-y-6">

            {/* Resume upload / card */}
            {loading ? (
              <div className="rounded-2xl p-6 space-y-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <Skeleton h="h-40" />
              </div>
            ) : resume ? (
              <ResumeCard
                resume={resume}
                onDelete={handleDelete}
                onReplace={uploadFile}
                deleting={deleting}
              />
            ) : (
              <div className="rounded-2xl p-6" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl grid place-items-center text-[14px]"
                    style={{ background: `${D.accent}18`, color: D.accent }}>
                    <i className="fas fa-cloud-arrow-up" />
                  </div>
                  <div>
                    <h2 className="font-jakarta font-bold text-[15px]" style={{ color: D.text }}>Upload Your Resume</h2>
                    <p className="text-[12px]" style={{ color: D.muted }}>PDF, DOC or DOCX · Max 5 MB · Earn +1 MeritCoin</p>
                  </div>
                </div>
                <DropZone onFile={uploadFile} uploading={uploading} />
              </div>
            )}

            {/* Profile strength */}
            {loading ? (
              <div className="rounded-2xl p-6" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <Skeleton h="h-28" />
              </div>
            ) : profile && (
              <div className="rounded-2xl p-6 flex items-center gap-6"
                style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <StrengthRing value={computedStrength} />
                <div className="flex-1">
                  <h3 className="font-jakarta font-bold text-[14px] mb-1" style={{ color: D.text }}>
                    Profile Strength
                  </h3>
                  <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: D.subtext }}>
                    {computedStrength >= 80
                      ? 'Excellent! Your profile is strong and ready for employers.'
                      : computedStrength >= 50
                        ? 'Good progress. Keep completing your profile to stand out.'
                        : 'Your profile needs more details to attract employers.'}
                  </p>
                  <a href="/dashboard/settings"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold no-underline transition-all hover:opacity-80"
                    style={{ background: `${D.accent}15`, color: D.accent, border: `1px solid ${D.accent}25` }}>
                    <i className="fas fa-pen text-[10px]" /> Complete Profile
                  </a>
                </div>
              </div>
            )}

            {/* Tips section */}
            <div className="rounded-2xl p-5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <h3 className="font-jakarta font-bold text-[14px] mb-4" style={{ color: D.text }}>
                <i className="fas fa-lightbulb mr-2" style={{ color: D.amber }} />
                Resume Tips
              </h3>
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <TipCard accent={D.accent}  icon="fa-file-pdf"     text="Use PDF format to preserve formatting across all devices and platforms." />
                <TipCard accent={D.green}   icon="fa-bullseye"     text="Tailor your resume for each role. Use keywords from the job description." />
                <TipCard accent={D.amber}   icon="fa-chart-bar"    text="Quantify your impact: 'Increased sales by 35%' beats 'improved sales'." />
                <TipCard accent={D.purple}  icon="fa-certificate"  text="Link your SkillHub certificates on your resume to add verifiable proof." />
                <TipCard accent="#F472B6"   icon="fa-align-left"   text="Keep it to 1–2 pages. Recruiters spend an average of 7 seconds on first review." />
                <TipCard accent="#38BDF8"   icon="fa-spell-check"  text="Proofread carefully. Spelling errors are the top reason resumes get rejected." />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Checklist */}
            {loading ? (
              <div className="rounded-2xl p-5 space-y-3" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} h="h-5" />)}
              </div>
            ) : profile ? (
              <ResumeChecklist profile={profile} />
            ) : null}

            {/* Quick links */}
            <div className="rounded-2xl p-5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <h3 className="font-jakarta font-bold text-[14px] mb-4" style={{ color: D.text }}>Quick Links</h3>
              <div className="flex flex-col gap-2">
                {[
                  { href: '/dashboard/portfolio',    icon: 'fa-layer-group',  label: 'Manage Portfolio',    accent: D.accent },
                  { href: '/dashboard/certificates', icon: 'fa-certificate',  label: 'View Certificates',   accent: D.green },
                  { href: '/dashboard/jobs',         icon: 'fa-briefcase',    label: 'Browse Jobs',         accent: D.amber },
                  { href: '/dashboard/settings',     icon: 'fa-gear',         label: 'Edit Profile',        accent: D.purple },
                ].map(l => (
                  <a key={l.href} href={l.href}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl no-underline transition-all hover:opacity-80"
                    style={{ background: `${l.accent}0d`, border: `1px solid ${l.accent}20` }}>
                    <div className="w-7 h-7 rounded-lg grid place-items-center text-[11px]"
                      style={{ background: `${l.accent}18`, color: l.accent }}>
                      <i className={`fas ${l.icon}`} />
                    </div>
                    <span className="text-[12.5px] font-semibold" style={{ color: D.text }}>{l.label}</span>
                    <i className="fas fa-arrow-right text-[9px] ml-auto" style={{ color: D.muted }} />
                  </a>
                ))}
              </div>
            </div>

            {/* Stats */}
            {resume && (
              <div className="rounded-2xl p-5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <h3 className="font-jakarta font-bold text-[14px] mb-4" style={{ color: D.text }}>Resume Status</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: 'fa-check-circle', label: 'Status',       val: 'Active',  color: D.green },
                    { icon: 'fa-eye',          label: 'Visibility',   val: visibility ? 'Public' : 'Private', color: visibility ? D.green : D.muted },
                    { icon: 'fa-file-lines',   label: 'Format',       val: resume.fileName.split('.').pop()?.toUpperCase() || 'FILE', color: D.accent },
                    { icon: 'fa-calendar',     label: 'Last Updated', val: new Date(resume.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), color: D.muted },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[12px]" style={{ color: D.muted }}>
                        <i className={`fas ${s.icon} w-4`} />
                        {s.label}
                      </div>
                      <span className="text-[12px] font-semibold" style={{ color: s.color }}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}