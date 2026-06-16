'use client';

import { useState, useEffect, useRef } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/career-oracle',   icon: 'fa-brain',                label: 'Career Oracle' },
  { href: '/dashboard/skill-coach',     icon: 'fa-heart-pulse',          label: 'Skill Coach' },
  { href: '/dashboard/peer-genome',     icon: 'fa-users',                label: 'Peer Genome' },
  { href: '/dashboard/skill-decay',     icon: 'fa-chart-line',           label: 'Skill Decay' },
  { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles',  label: 'Ghost Recruiter' },
  { href: '/dashboard/community', icon: 'fa-users', label: 'Community' },
  { href: '/dashboard/portfolio', icon: 'fa-layer-group', label: 'Portfolio' },
  { href: '/dashboard/resume',        icon: 'fa-file-lines',           label: 'Resume' },
  { href: '/dashboard/platforms', icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

const TECH_COLORS: Record<string, string> = {
  React: '#61dafb', TypeScript: '#3178c6', Python: '#3776ab', Node: '#339933',
  Vue: '#42b883', Angular: '#dd0031', Django: '#092e20', Flask: '#000000',
  PostgreSQL: '#4169e1', MongoDB: '#47a248', AWS: '#ff9900', Docker: '#2496ed',
  TailwindCSS: '#06b6d4', GraphQL: '#e10098', Next: '#000000', Figma: '#f24e1e',
};
function getTechColor(tech: string) { return TECH_COLORS[tech] || '#4F8EF7'; }

function ScoreRing({ score }: { score: number }) {
  const r = 22; const circ = 2 * Math.PI * r;
  const fill = (score / 10) * circ;
  const color = score >= 9 ? '#00E5A0' : score >= 7.5 ? '#4F8EF7' : '#F59E0B';
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 28 28)" />
      <text x="28" y="33" textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

/* ── Toggle Switch ──────────────────────────────────────────────────────── */
function Toggle({ on, onChange, loading }: { on: boolean; onChange: (v: boolean) => void; loading?: boolean }) {
  return (
    <button
      onClick={() => !loading && onChange(!on)}
      disabled={loading}
      className={`relative w-11 h-6 rounded-full border-0 cursor-pointer transition-all flex-shrink-0 ${on ? 'bg-[#4F8EF7]' : 'bg-[rgba(255,255,255,0.1)]'} ${loading ? 'opacity-60' : ''}`}
      style={{ padding: 0 }}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

/* ── Project Card ───────────────────────────────────────────────────────── */
function ProjectCard({ project, onEdit, onDelete, onToggleCommunity }: any) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const shared = project.visibility === 'community';

  async function handleToggleCommunity() {
    setToggling(true);
    await onToggleCommunity(project.id, !shared);
    setToggling(false);
  }

  return (
    <div className={`rounded-2xl border overflow-hidden hover:-translate-y-0.5 transition-all group ${shared ? 'border-[#4F8EF7]/40 ring-1 ring-[#4F8EF7]/20' : 'border-[rgba(255,255,255,0.07)]'}`} style={{ background: '#0F1521' }}>
      <div className="relative h-40 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.1) 0%, rgba(167,139,250,0.1) 100%)' }}>
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-code text-4xl" style={{ color: 'rgba(79,142,247,0.3)' }} />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <ScoreRing score={parseFloat(project.score) || 8.0} />
        </div>
        {shared && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md" style={{ background: '#4F8EF7' }}>
            <i className="fas fa-users text-[9px]" />Community
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end gap-2 px-3 pb-3">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer"
              className="text-[11px] font-semibold text-white bg-black/40 backdrop-blur px-2.5 py-1 rounded-lg no-underline hover:bg-black/60 transition-all">
              <i className="fas fa-external-link-alt mr-1" />Live
            </a>
          )}
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noreferrer"
              className="text-[11px] font-semibold text-white bg-black/40 backdrop-blur px-2.5 py-1 rounded-lg no-underline hover:bg-black/60 transition-all">
              <i className="fab fa-github mr-1" />Code
            </a>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-jakarta font-bold text-[14.5px] leading-tight flex-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{project.title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(project)} className="w-7 h-7 rounded-lg text-xs border-0 cursor-pointer transition-all grid place-items-center" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
              <i className="fas fa-pen" />
            </button>
            <button onClick={() => onDelete(project.id)} className="w-7 h-7 rounded-lg text-xs border-0 cursor-pointer transition-all grid place-items-center" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
              <i className="fas fa-trash" />
            </button>
          </div>
        </div>

        <p className={`text-xs leading-relaxed mb-3 ${expanded ? '' : 'line-clamp-2'}`} style={{ color: 'rgba(255,255,255,0.45)' }}>
          {project.description}
        </p>
        {project.description?.length > 80 && (
          <button onClick={() => setExpanded(v => !v)} className="text-[11px] font-semibold border-0 bg-transparent cursor-pointer p-0 mb-2" style={{ color: '#4F8EF7' }}>
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(project.technologies || []).slice(0, 5).map((t: string) => (
            <span key={t} className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: getTechColor(t) + '18', color: getTechColor(t) }}>
              {t}
            </span>
          ))}
          {(project.technologies || []).length > 5 && (
            <span className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>+{project.technologies.length - 5}</span>
          )}
        </div>

        {/* Community share toggle per project */}
        <div className={`flex items-center justify-between pt-3 border-t ${shared ? 'border-[#4F8EF7]/20' : 'border-[rgba(255,255,255,0.06)]'}`}>
          <div className="flex items-center gap-2">
            <Toggle on={shared} onChange={() => handleToggleCommunity()} loading={toggling} />
            <span className="text-[11.5px] font-medium" style={{ color: shared ? '#4F8EF7' : 'rgba(255,255,255,0.45)' }}>
              {shared ? <span style={{ color: '#4F8EF7', fontWeight: 600 }}>Shared to feed</span> : 'Share to feed'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span><i className="fas fa-eye mr-1" />{project.views || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Project Modal ──────────────────────────────────────────────────────── */
function ProjectModal({ project, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    title:        project?.title || '',
    description:  project?.description || '',
    technologies: (project?.technologies || []).join(', '),
    liveUrl:      project?.liveUrl || '',
    githubUrl:    project?.githubUrl || '',
    thumbnail:    project?.thumbnail || '',
  });
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const [error, setError]           = useState('');
  const imgRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) { setError('Only image files are allowed'); return; }
    setUploading(true);
    setError('');
    const localUrl = URL.createObjectURL(file);
    setForm(p => ({ ...p, thumbnail: localUrl }));
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/v1/portfolio/projects/upload-image', {
        method: 'POST', credentials: 'include', body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');
      URL.revokeObjectURL(localUrl);
      setForm(p => ({ ...p, thumbnail: data.data.url }));
    } catch (e: any) {
      URL.revokeObjectURL(localUrl);
      setForm(p => ({ ...p, thumbnail: project?.thumbnail || '' }));
      setError(e.message || 'Image upload failed');
    } finally { setUploading(false); }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  }

  async function submit() {
    if (!form.title || !form.description) { setError('Title and description are required'); return; }
    if (uploading) { setError('Please wait for the image to finish uploading'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        technologies: form.technologies.split(',').map((t: string) => t.trim()).filter(Boolean),
        thumbnail: form.thumbnail || undefined,
      };
      const res = project?.id
        ? await apiFetch(`/portfolio/projects/${project.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiFetch('/portfolio/projects', { method: 'POST', body: JSON.stringify(payload) });
      if (res.success) { onSaved(res.message); onClose(); }
      else setError(res.message || 'Failed to save');
    } catch (e: any) { setError(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.09)' }} onClick={e => e.stopPropagation()}>

        {/* Image / banner area */}
        <div
          className={`relative h-44 rounded-t-2xl overflow-hidden cursor-pointer transition-all ${dragOver ? 'ring-2 ring-[#4F8EF7] ring-inset' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => imgRef.current?.click()}
        >
          {form.thumbnail ? (
            <>
              <img src={form.thumbnail} alt="Project thumbnail" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 text-white">
                  {uploading
                    ? <><div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin mb-1" /><span className="text-xs font-semibold">Uploading…</span></>
                    : <><i className="fas fa-camera text-2xl" /><span className="text-xs font-semibold mt-1">Change image</span></>
                  }
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setForm(p => ({ ...p, thumbnail: '' })); }}
                className="absolute top-3 right-3 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full border-0 cursor-pointer grid place-items-center text-xs transition-all">
                <i className="fas fa-times" />
              </button>
            </>
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed ${dragOver ? 'border-[#4F8EF7]' : 'border-[rgba(255,255,255,0.1)]'} rounded-t-2xl transition-all`} style={{ background: 'rgba(255,255,255,0.04)' }}>
              {uploading ? (
                <><div className="w-8 h-8 border-2 border-[#4F8EF7]/30 border-t-[#4F8EF7] rounded-full animate-spin" /><p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Uploading…</p></>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: 'rgba(79,142,247,0.1)' }}>
                    <i className="fas fa-image text-xl" style={{ color: '#4F8EF7' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold"><span style={{ color: '#4F8EF7' }}>Click to upload</span> or drag & drop</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Project cover image or logo • JPEG, PNG, WebP • max 8MB</p>
                  </div>
                </>
              )}
            </div>
          )}
          <input ref={imgRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>

        {/* Form body */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-jakarta font-bold text-[17px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{project?.id ? 'Edit Project' : 'Add Project'}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-xl border-0 cursor-pointer transition-all grid place-items-center" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
              <i className="fas fa-times" />
            </button>
          </div>
          {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
          <div className="flex flex-col gap-3">
            {[
              { label: 'Project Title *', key: 'title',        placeholder: 'e.g. E-commerce Dashboard' },
              { label: 'Live URL',        key: 'liveUrl',      placeholder: 'https://yourproject.com' },
              { label: 'GitHub URL',      key: 'githubUrl',    placeholder: 'https://github.com/you/project' },
              { label: 'Technologies (comma-separated)', key: 'technologies', placeholder: 'React, TypeScript, Node.js' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                  onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
                  onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Description *</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe what this project does, your role, and the impact…"
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none transition-all resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              />
            </div>
          </div>
          <div className="flex gap-2.5 mt-5">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all" style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
              Cancel
            </button>
            <button onClick={submit} disabled={saving || uploading}
              className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all disabled:opacity-60"
              style={{ background: '#4F8EF7' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; }}
            >
              {uploading ? 'Uploading image…' : saving ? 'Saving…' : project?.id ? 'Update Project' : 'Add Project (+1 coin)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Community Visibility Banner ────────────────────────────────────────── */
function CommunityVisibilityBanner({ portfolioPublic, onToggle, sharedCount, totalCount }: {
  portfolioPublic: boolean; onToggle: (v: boolean) => void;
  sharedCount: number; totalCount: number;
}) {
  const [toggling, setToggling] = useState(false);

  async function handle(v: boolean) {
    setToggling(true);
    await onToggle(v);
    setToggling(false);
  }

  return (
    <div className={`rounded-2xl p-5 mb-6 border flex items-center gap-4 transition-all ${portfolioPublic ? 'border-[#4F8EF7]/25' : 'border-[rgba(255,255,255,0.07)]'}`} style={{ background: portfolioPublic ? 'rgba(79,142,247,0.06)' : '#0F1521' }}>
      <div className={`w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 text-lg transition-all ${portfolioPublic ? 'text-white shadow-[0_4px_14px_rgba(79,142,247,0.35)]' : 'border'}`} style={portfolioPublic ? { background: '#4F8EF7' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <i className="fas fa-users" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-jakarta font-bold text-[14px]" style={{ color: 'rgba(255,255,255,0.85)' }}>Community Portfolio Feed</span>
          {portfolioPublic && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>VISIBLE</span>
          )}
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {portfolioPublic
            ? `Your profile is visible in the community feed. ${sharedCount} of ${totalCount} projects are shared.`
            : 'Enable to let fellow learners discover your work and projects in the Community tab.'}
        </p>
        {portfolioPublic && sharedCount === 0 && totalCount > 0 && (
          <p className="text-[11.5px] mt-1" style={{ color: '#F59E0B' }}>
            <i className="fas fa-info-circle mr-1" />Toggle individual projects below to show them in the feed.
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {portfolioPublic && (
          <div className="text-right hidden sm:block">
            <div className="font-jakarta font-bold text-[18px]" style={{ color: '#4F8EF7' }}>{sharedCount}</div>
            <div className="text-[10.5px]" style={{ color: 'rgba(255,255,255,0.45)' }}>shared</div>
          </div>
        )}
        <Toggle on={portfolioPublic} onChange={handle} loading={toggling} />
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function PortfolioPage() {
  const [data, setData]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<any>(null);
  const [toast, setToast]             = useState('');
  const [toastType, setToastType]     = useState<'success'|'info'>('success');
  const [activeTab, setActiveTab]     = useState<'projects' | 'skills' | 'certificates'>('projects');
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillInput, setSkillInput]   = useState('');
  const [skills, setSkills]           = useState<string[]>([]);
  const savedSkillsRef                = useRef<string[]>([]);
  const [portfolioPublic, setPortfolioPublic] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch('/portfolio');
      if (res.success) {
        setData(res.data);
        setSkills(res.data.user?.skills || []);
        savedSkillsRef.current = res.data.user?.skills || [];
        setPortfolioPublic(res.data.user?.portfolioPublic ?? false);
      }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function showToast(msg: string, type: 'success' | 'info' = 'success') {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleVisibilityToggle(v: boolean) {
    try {
      const res = await apiFetch('/portfolio/visibility', { method: 'PUT', body: JSON.stringify({ portfolioPublic: v }) });
      if (res.success) { setPortfolioPublic(v); showToast(res.message ?? 'Visibility updated', 'info'); }
    } catch {}
  }

  async function handleToggleCommunity(projectId: string, showInCommunity: boolean) {
    try {
      const res = await apiFetch(`/portfolio/projects/${projectId}/community`, {
        method: 'PUT',
        body: JSON.stringify({ showInCommunity }),
      });
      if (res.success) {
        setData((prev: any) => ({
          ...prev,
          projects: prev.projects.map((p: any) =>
            p.id === projectId ? { ...p, visibility: showInCommunity ? 'community' : 'public' } : p
          ),
        }));
        showToast(res.message ?? 'Project visibility updated', 'info');
      }
    } catch {}
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project?')) return;
    try {
      const res = await apiFetch(`/portfolio/projects/${id}`, { method: 'DELETE' });
      if (res.success) { showToast('Project deleted'); load(); }
    } catch {}
  }

  async function saveSkills() {
    try {
      const res = await apiFetch('/portfolio/skills', { method: 'PUT', body: JSON.stringify({ skills }) });
      if (res.success) {
        const saved = res.data?.skills || skills;
        setSkills(saved);
        savedSkillsRef.current = saved;
        showToast('Skills updated!');
        setEditingSkills(false);
      }
    } catch {}
  }

  function addSkill(s: string) {
    const trimmed = s.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills(prev => [...prev, trimmed]);
    setSkillInput('');
  }

  const stats      = data?.stats;
  const projects   = data?.projects || [];
  const certificates = data?.certificates || [];
  const user       = data?.user;
  const sharedCount = projects.filter((p: any) => p.visibility === 'community').length;

  if (loading) {
    return (
      <SidebarLayout navItems={navItems} pageTitle="Portfolio">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#4F8EF7]/30 border-t-[#4F8EF7] rounded-full animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout navItems={navItems} pageTitle="Portfolio">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 ${toastType === 'info' ? 'border' : ''}`} style={toastType === 'info' ? { background: '#0F1521', color: '#4F8EF7', borderColor: 'rgba(79,142,247,0.3)' } : { background: '#0F1521', color: '#00E5A0', border: '1px solid rgba(0,229,160,0.3)' }}>
          <i className={`fas ${toastType === 'info' ? 'fa-users' : 'fa-check-circle'}`} />{toast}
        </div>
      )}
      {modal !== null && (
        <ProjectModal project={modal} onClose={() => setModal(null)} onSaved={(msg: string) => { showToast(msg); load(); }} />
      )}

      {/* Profile header */}
      <div className="rounded-2xl p-6 mb-5" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-jakarta font-bold text-white text-2xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4F8EF7 0%, #A78BFA 100%)' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-jakarta font-bold text-xl mb-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{user?.name || 'Your Name'}</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{user?.title || 'Add your title in Settings'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{user?.location || ''}</p>
          </div>
          <div className="flex gap-5">
            {[
              { label: 'Projects', value: stats?.projectCount || 0, icon: 'fa-layer-group', color: '#4F8EF7' },
              { label: 'Avg Score', value: stats?.avgScore || '—', icon: 'fa-star', color: '#F59E0B' },
              { label: 'Total Views', value: stats?.totalViews || 0, icon: 'fa-eye', color: '#00E5A0' },
              { label: 'Certificates', value: stats?.certCount || 0, icon: 'fa-certificate', color: '#A78BFA' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-jakarta font-bold text-xl" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Visibility Banner */}
      <CommunityVisibilityBanner
        portfolioPublic={portfolioPublic}
        onToggle={handleVisibilityToggle}
        sharedCount={sharedCount}
        totalCount={projects.length}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['projects', 'skills', 'certificates'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer capitalize transition-all border-0 ${
              activeTab === t 
                ? 'font-semibold shadow-[0_1px_5px_rgba(0,0,0,0.09)]' 
                : 'bg-transparent'
            }`}
            style={activeTab === t ? { background: '#0F1521', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.09)' } : { color: 'rgba(255,255,255,0.45)' }}>
            {t}
            {t === 'projects' && sharedCount > 0 && portfolioPublic && (
              <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full align-middle" style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>{sharedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-jakarta font-bold text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>My Projects</h2>
              {portfolioPublic && (
                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Toggle <i className="fas fa-users text-[10px]" style={{ color: '#4F8EF7' }} /> on each project to share it to the Community feed
                </p>
              )}
            </div>
            <button onClick={() => setModal({})}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
              style={{ background: '#4F8EF7' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <i className="fas fa-plus" />Add Project
            </button>
          </div>
          {projects.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-16 h-16 rounded-2xl grid place-items-center text-3xl mx-auto mb-4" style={{ background: 'rgba(79,142,247,0.1)', color: '#4F8EF7' }}>
                <i className="fas fa-layer-group" />
              </div>
              <h3 className="font-jakarta font-bold text-[15px] mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>No projects yet</h3>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>Showcase your work and earn 1 Merit Coin per project!</p>
              <button onClick={() => setModal({})}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
                style={{ background: '#4F8EF7' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; }}>
                <i className="fas fa-plus" />Add Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 max-[1200px]:grid-cols-2 max-md:grid-cols-1">
              {projects.map((p: any) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onEdit={setModal}
                  onDelete={deleteProject}
                  onToggleCommunity={portfolioPublic ? handleToggleCommunity : () => showToast('Enable Community Portfolio Feed first', 'info')}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="rounded-2xl p-6" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-jakarta font-bold text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>My Skills</h2>
            {!editingSkills ? (
              <button onClick={() => setEditingSkills(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all"
                style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(79,142,247,0.12)'; (e.currentTarget as HTMLElement).style.color = '#4F8EF7'; }}>
                <i className="fas fa-pen" />Edit Skills
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setEditingSkills(false); setSkills(savedSkillsRef.current); }}
                  className="px-3.5 py-2 text-sm font-semibold rounded-xl border cursor-pointer transition-all"
                  style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  Cancel
                </button>
                <button onClick={saveSkills}
                  className="px-3.5 py-2 text-sm font-semibold text-white rounded-xl border-0 cursor-pointer transition-all"
                  style={{ background: '#4F8EF7' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; }}>
                  Save
                </button>
              </div>
            )}
          </div>
          {editingSkills && (
            <div className="mb-5 flex gap-2">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); } }}
                placeholder="Type a skill and press Enter…"
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              />
              <button onClick={() => addSkill(skillInput)}
                className="px-4 py-2.5 text-white text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all"
                style={{ background: '#4F8EF7' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; }}>
                Add
              </button>
            </div>
          )}
          {skills.length === 0 ? (
            <div className="py-10 text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <i className="fas fa-tools text-3xl mb-3 block" />
              <p className="text-sm">No skills listed yet. Click Edit Skills to add them.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {skills.map((s: string) => (
                <span key={s} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>
                  {s}
                  {editingSkills && (
                    <button onClick={() => setSkills(prev => prev.filter(x => x !== s))}
                      className="w-4 h-4 rounded-full border-0 cursor-pointer text-[10px] transition-all grid place-items-center"
                      style={{ background: 'rgba(79,142,247,0.2)', color: '#4F8EF7' }}>
                      <i className="fas fa-times" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-jakarta font-bold text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>Earned Certificates</h2>
            <a href="/dashboard/certificates" className="text-xs font-semibold px-3 py-1.5 rounded-lg no-underline transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: '#4F8EF7', border: '1px solid rgba(255,255,255,0.08)' }}>View all</a>
          </div>
          {certificates.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
              <i className="fas fa-certificate text-4xl mb-4 block" style={{ color: '#F59E0B' }} />
              <h3 className="font-jakarta font-bold text-[15px] mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>No certificates yet</h3>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>Complete courses to earn certificates that display here.</p>
              <a href="/dashboard/courses" className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold no-underline transition-all" style={{ background: '#4F8EF7' }}>Browse Courses</a>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
              {certificates.map((cert: any) => (
                <div key={cert.id} className="rounded-2xl p-5 transition-all" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl mb-3" style={{ background: 'rgba(245,158,11,0.1)' }}>🏆</div>
                  <h3 className="font-jakarta font-bold text-[14px] mb-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{cert.title}</h3>
                  <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>{cert.issuer || cert.course?.title}</p>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}