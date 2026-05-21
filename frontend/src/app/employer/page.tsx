'use client';

import { useState, useEffect, useCallback } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/employer',            icon: 'fa-tachometer-alt', label: 'Dashboard' },
  { href: '/employer/jobs',       icon: 'fa-briefcase',      label: 'Job Management' },
  { href: '/employer/applicants', icon: 'fa-users',          label: 'Applicants' },
  { href: '/employer/talent',     icon: 'fa-search',         label: 'Talent Search' },
  { href: '/employer/analytics',  icon: 'fa-chart-bar',      label: 'Analytics' },
  { href: '/employer/company',    icon: 'fa-building',        label: 'Company' },
  { href: '/employer/settings',   icon: 'fa-gear',           label: 'Settings' },
];

/* ─── Merit Tier helpers ────────────────────────────────────────────────── */
const TIERS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  platinum: { label: 'Platinum', icon: '💎', color: '#7c3aed', bg: '#f4f2ff' },
  gold:     { label: 'Gold',     icon: '🥇', color: '#d97706', bg: '#fffbeb' },
  silver:   { label: 'Silver',   icon: '🥈', color: '#6b7280', bg: '#f5f5fb' },
  bronze:   { label: 'Bronze',   icon: '🥉', color: '#92400e', bg: '#fef3c7' },
};

function getTier(coins: number) {
  if (coins >= 5000) return 'platinum';
  if (coins >= 2000) return 'gold';
  if (coins >= 500)  return 'silver';
  return 'bronze';
}

function MeritBadge({ coins }: { coins: number }) {
  const t = TIERS[getTier(coins)];
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: t.bg, color: t.color }}>
      {t.icon} {t.label} · {coins.toLocaleString()}
    </span>
  );
}

function TierPill({ tier }: { tier: string }) {
  const t = TIERS[tier];
  if (!t) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: t.bg, color: t.color }}>
      {t.icon} {t.label}+
    </span>
  );
}

const STATUS_STYLE: Record<string, [string, string]> = {
  applied:      ['#eff6ff', '#1d4ed8'],
  reviewing:    ['#fffbeb', '#92400e'],
  shortlisted:  ['#f0fdf4', '#15803d'],
  interviewing: ['#f4f2ff', '#5b4cf5'],
  hired:        ['#f0fdf4', '#15803d'],
  rejected:     ['#fef2f2', '#dc2626'],
};

/* ─── Shared skeleton ────────────────────────────────────────────────────── */
function Sk({ h = 'h-4', w = 'w-full', r = 'rounded' }: any) {
  return <div className={`${h} ${w} ${r} bg-[#f0f0f8] animate-pulse`} />;
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ name, avatar, size = 8 }: { name: string; avatar?: string; size?: number }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#5b4cf5','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#06b6d4'];
  const color  = colors[initials.charCodeAt(0) % colors.length];
  const cls    = `w-${size} h-${size} rounded-full flex-shrink-0 grid place-items-center font-syne font-bold text-white text-xs`;
  return avatar
    ? <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
    : <div className={cls} style={{ background: color }}>{initials}</div>;
}

/* ─── Status dropdown ────────────────────────────────────────────────────── */
function StatusSelect({ appId, current, onChange }: { appId: string; current: string; onChange: (id: string, status: string) => void }) {
  const [loading, setLoading] = useState(false);
  const options = ['reviewing', 'shortlisted', 'interviewing', 'hired', 'rejected'];
  async function update(status: string) {
    setLoading(true);
    try {
      await apiFetch(`/employer/applicants/${appId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      onChange(appId, status);
    } catch {}
    finally { setLoading(false); }
  }
  const [sbg, sc] = STATUS_STYLE[current] || ['#f5f5fb', '#6b6b8a'];
  return (
    <div className="relative">
      <select
        value={current}
        disabled={loading}
        onChange={e => update(e.target.value)}
        className="text-[11px] font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer outline-none appearance-none pr-5 disabled:opacity-50"
        style={{ background: sbg, color: sc }}>
        {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
      {loading && <i className="fas fa-spinner fa-spin absolute right-1.5 top-1.5 text-[9px]" style={{ color: sc }} />}
    </div>
  );
}

/* ─── Candidate profile drawer ───────────────────────────────────────────── */
function ProfileDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setProfile(null);
    setLoading(true);
    apiFetch(`/employer/talent/${userId}`)
      .then(r => { if (r.success) setProfile(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40 backdrop-blur-sm" />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#e8e8f0] sticky top-0 bg-white z-10">
          <span className="font-syne font-bold text-[15px]">Candidate Profile</span>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] hover:bg-[#f0f0f8] grid place-items-center">
            <i className="fas fa-times text-xs" />
          </button>
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            <Sk h="h-20" r="rounded-2xl" />
            {[1,2,3,4].map(i => <Sk key={i} h="h-12" r="rounded-xl" />)}
          </div>
        ) : profile ? (
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
              <Avatar name={profile.name} avatar={profile.avatar} size={14} />
              <div>
                <h2 className="font-syne font-bold text-[17px]">{profile.name}</h2>
                <p className="text-sm text-[#6b6b8a]">{profile.title}</p>
                <p className="text-xs text-[#9898b8]">{profile.location}</p>
                <div className="mt-1.5"><MeritBadge coins={profile.meritCoins || 0} /></div>
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm text-[#6b6b8a] leading-relaxed mb-5 p-3 bg-[#f5f5fb] rounded-xl">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { label: 'Skills',       value: profile.skills?.length || 0,           color: '#5b4cf5', bg: '#f4f2ff' },
                { label: 'Certificates', value: profile.certificates?.length || 0,      color: '#22c55e', bg: '#f0fdf4' },
                { label: 'Projects',     value: profile.projects?.length || 0,          color: '#f59e0b', bg: '#fffbeb' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                  <div className="font-syne font-bold text-[18px]" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-[#6b6b8a]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="mb-5">
                <div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s: any) => (
                    <span key={s.name} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#f4f2ff] text-[#5b4cf5]">
                      {s.verified && <i className="fas fa-check-circle mr-1 text-[10px]" />}{s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {profile.certificates?.length > 0 && (
              <div className="mb-5">
                <div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Certificates</div>
                {profile.certificates.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2.5 py-2.5 border-b border-[#f0f0f8] last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-[#fffbeb] grid place-items-center text-sm flex-shrink-0">🏆</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate">{c.title}</div>
                      <div className="text-[11px] text-[#9898b8]">{c.provider}</div>
                    </div>
                    {c.credentialUrl && (
                      <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#5b4cf5] font-semibold no-underline">
                        View <i className="fas fa-external-link-alt text-[9px]" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {profile.projects?.length > 0 && (
              <div className="mb-5">
                <div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Projects</div>
                {profile.projects.map((p: any) => (
                  <div key={p.id} className="p-3 rounded-xl bg-[#f5f5fb] mb-2">
                    <div className="font-semibold text-[13px] mb-1">{p.title}</div>
                    <p className="text-[11px] text-[#6b6b8a] line-clamp-2 mb-2">{p.description}</p>
                    <div className="flex gap-1 flex-wrap">
                      {(p.techStack || []).slice(0, 4).map((t: string) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#6b6b8a] border border-[#e8e8f0]">{t}</span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#5b4cf5] font-semibold no-underline">Live ↗</a>}
                      {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#6b6b8a] font-semibold no-underline">GitHub ↗</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Platforms */}
            {profile.platforms?.length > 0 && (
              <div className="mb-5">
                <div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Learning Platforms</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.platforms.map((p: string) => (
                    <span key={p} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f0fdf4] text-[#22c55e]">
                      <i className="fas fa-check-circle mr-1" />{p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume */}
            {profile.resume?.fileUrl && (
              <a href={profile.resume.fileUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 p-3 rounded-xl bg-[#f4f2ff] no-underline hover:bg-[#5b4cf5] hover:text-white transition-all group">
                <i className="fas fa-file-pdf text-[#5b4cf5] group-hover:text-white" />
                <span className="text-sm font-semibold text-[#5b4cf5] group-hover:text-white">Download Resume</span>
              </a>
            )}
          </div>
        ) : (
          <div className="p-10 text-center text-[#9898b8]">Profile not available</div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function EmployerDashboardPage() {
  const [tab, setTab]           = useState<'overview' | 'jobs' | 'applicants' | 'talent'>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [jobs, setJobs]         = useState<any[] | null>(null);
  const [applicants, setApplicants] = useState<any[] | null>(null);
  const [talent, setTalent]     = useState<any[] | null>(null);
  const [talentTotal, setTalentTotal] = useState(0);

  // Filters
  const [tierFilter, setTierFilter]     = useState('all');
  const [jobFilter, setJobFilter]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [talentTier, setTalentTier]     = useState('all');
  const [talentSearch, setTalentSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const r = await apiFetch('/employer/dashboard');
      if (r.success) setOverview(r.data);
    } catch {}
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (jobStatusFilter) params.set('status', jobStatusFilter);
      const r = await apiFetch(`/employer/jobs?${params}`);
      if (r.success) setJobs(r.data);
    } catch { setJobs([]); }
  }, [jobStatusFilter]);

  const loadApplicants = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tierFilter !== 'all') params.set('tier', tierFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (jobFilter) params.set('jobId', jobFilter);
      const r = await apiFetch(`/employer/applicants?${params}&sort=coins`);
      if (r.success) setApplicants(r.data);
    } catch { setApplicants([]); }
  }, [tierFilter, statusFilter, jobFilter]);

  const loadTalent = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (talentTier !== 'all') params.set('tier', talentTier);
      if (talentSearch) params.set('search', talentSearch);
      const r = await apiFetch(`/employer/talent?${params}`);
      if (r.success) { setTalent(r.data.users); setTalentTotal(r.data.total); }
    } catch { setTalent([]); }
  }, [talentTier, talentSearch]);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { if (tab === 'jobs')       loadJobs();       }, [tab, loadJobs]);
  useEffect(() => { if (tab === 'applicants') loadApplicants(); }, [tab, loadApplicants]);
  useEffect(() => { if (tab === 'talent')     loadTalent();     }, [tab, loadTalent]);

  function onStatusChange(appId: string, newStatus: string) {
    setApplicants(prev => prev ? prev.map(a => a.applicationId === appId ? { ...a, status: newStatus } : a) : prev);
    loadOverview(); // refresh stats
  }

  const stats = overview?.stats;
  const pipeline = overview?.pipeline || [];
  const tierBreak = overview?.tierBreakdown || {};
  const recent = overview?.recentApplicants || [];

  const PIPELINE_COLORS: Record<string, string> = {
    applied: '#e8e8f0', reviewing: '#3b82f6', shortlisted: '#f59e0b', interviewing: '#5b4cf5', hired: '#22c55e',
  };

  return (
    <SidebarLayout navItems={navItems} pageTitle="Employer Dashboard">
      <ProfileDrawer userId={selectedUser} onClose={() => setSelectedUser(null)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">Employer Dashboard</h1>
          <p className="text-[13px] text-[#6b6b8a]">All data pulled live from your hiring pipeline.</p>
        </div>
        <a href="/employer/jobs/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold no-underline hover:bg-[#7c6ff7] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(91,76,245,0.3)] transition-all">
          <i className="fas fa-plus" /> Post a Job
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl w-fit mb-5 border border-[#e8e8f0]">
        {(['overview','jobs','applicants','talent'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer capitalize transition-all border-0 ${tab === t ? 'bg-white text-[#0a0a0f] font-semibold shadow-[0_1px_5px_rgba(0,0,0,0.09)]' : 'bg-transparent text-[#6b6b8a]'}`}>
            {t === 'talent' ? '⭐ Top Talent' : t}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4 max-md:grid-cols-2">
            {[
              { icon:'fa-briefcase',   bg:'#f4f2ff', color:'#5b4cf5', value: stats?.activeJobs,      label:'Active Jobs' },
              { icon:'fa-users',       bg:'#f0fdf4', color:'#22c55e', value: stats?.totalApplicants,  label:'Total Applicants' },
              { icon:'fa-user-check',  bg:'#fffbeb', color:'#f59e0b', value: stats?.shortlisted,      label:'Shortlisted' },
              { icon:'fa-handshake',   bg:'#eff6ff', color:'#3b82f6', value: stats?.hiredThisMonth,   label:'Hired This Month' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#e8e8f0] flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-all">
                <div className="w-11 h-11 rounded-xl grid place-items-center text-[17px] flex-shrink-0" style={{ background: s.bg, color: s.color }}>
                  <i className={`fas ${s.icon}`} />
                </div>
                <div>
                  {s.value === undefined ? <Sk h="h-7" w="w-12" r="rounded" /> : (
                    <div className="font-syne font-bold text-[22px]">{s.value ?? 0}</div>
                  )}
                  <div className="text-xs text-[#6b6b8a]">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
            {/* Pipeline */}
            <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
              <span className="font-syne font-bold text-[15px] block mb-4">Hiring Pipeline</span>
              {pipeline.length === 0 ? (
                <div className="flex flex-col gap-3">{[1,2,3,4,5].map(i => <Sk key={i} h="h-7" r="rounded-xl" />)}</div>
              ) : pipeline.map((stage: any) => (
                <div key={stage.stage} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="text-[12px] text-[#6b6b8a] capitalize w-24 flex-shrink-0">{stage.stage}</span>
                  <div className="flex-1 h-2.5 bg-[#f0f0f8] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(stage.pct, 2)}%`, background: PIPELINE_COLORS[stage.stage] || '#e8e8f0' }} />
                  </div>
                  <span className="text-[12px] font-semibold w-6 text-right" style={{ color: PIPELINE_COLORS[stage.stage] || '#6b6b8a' }}>{stage.count}</span>
                </div>
              ))}
            </div>

            {/* Merit coin intel */}
            <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
              <span className="font-syne font-bold text-[15px] block mb-1">Merit Coin Breakdown</span>
              <p className="text-xs text-[#6b6b8a] mb-4">Distribution of applicants by learning achievement tier.</p>
              {!stats ? (
                <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <Sk key={i} h="h-12" r="rounded-xl" />)}</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TIERS).map(([key, t]) => (
                    <div key={key} className="p-3 rounded-xl border border-[#e8e8f0]" style={{ background: t.bg + '60' }}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm">{t.icon}</span>
                        <span className="font-syne font-bold text-[18px]" style={{ color: t.color }}>{(tierBreak as any)[key] || 0}</span>
                      </div>
                      <div className="text-[11px] font-semibold" style={{ color: t.color }}>{t.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent applicants */}
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-syne font-bold text-[15px]">Recent Applicants</span>
              <button onClick={() => setTab('applicants')} className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] px-3 py-1.5 rounded-lg hover:bg-[#f4f2ff] transition-all">
                View all
              </button>
            </div>
            {recent.length === 0 && !overview ? (
              <div className="flex flex-col gap-3">{[1,2,3,4,5].map(i => <Sk key={i} h="h-14" r="rounded-xl" />)}</div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-[#9898b8] py-4 text-center">No applicants yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>{['Candidate','Applied For','Merit Tier','Certs','Projects','Status','Action'].map(h => (
                      <th key={h} className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {recent.map((a: any) => (
                      <tr key={a.applicationId} className="hover:bg-[#fafafd] transition-colors">
                        <td className="py-3 px-4 border-b border-[#f0f0f8]">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={a.name} avatar={a.avatar} />
                            <span className="font-semibold text-[#0a0a0f] text-[13px]">{a.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[12px]">{a.job?.title || '—'}</td>
                        <td className="py-3 px-4 border-b border-[#f0f0f8]"><MeritBadge coins={a.meritCoins} /></td>
                        <td className="py-3 px-4 border-b border-[#f0f0f8] font-semibold text-[13px]">{a.certCount}</td>
                        <td className="py-3 px-4 border-b border-[#f0f0f8] font-semibold text-[13px]" style={{ color: a.projectCount > 0 ? '#22c55e' : '#9898b8' }}>{a.projectCount}</td>
                        <td className="py-3 px-4 border-b border-[#f0f0f8]">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                            style={{ background: (STATUS_STYLE[a.status] || ['#f5f5fb','#6b6b8a'])[0], color: (STATUS_STYLE[a.status] || ['#f5f5fb','#6b6b8a'])[1] }}>
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-b border-[#f0f0f8]">
                          <button onClick={() => setSelectedUser(a.id)} className="text-[12px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">
                            Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ JOBS ══════════════════════════════════════════════════════════ */}
      {tab === 'jobs' && (
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <span className="font-syne font-bold text-[15px]">All Job Posts</span>
            <div className="flex gap-2 flex-wrap">
              <select value={jobStatusFilter} onChange={e => setJobStatusFilter(e.target.value)}
                className="text-sm text-[#6b6b8a] border border-[#e8e8f0] rounded-lg px-3 py-2 bg-white outline-none font-[inherit] cursor-pointer">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
              <a href="/employer/jobs/new" className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#5b4cf5] text-white text-sm font-semibold rounded-xl no-underline hover:bg-[#7c6ff7] transition-all">
                <i className="fas fa-plus" /> New Job
              </a>
            </div>
          </div>
          {jobs === null ? (
            <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <Sk key={i} h="h-16" r="rounded-xl" />)}</div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center">
              <i className="fas fa-briefcase text-4xl text-[#e8e8f0] mb-3 block" />
              <p className="text-sm text-[#9898b8] mb-3">No jobs posted yet.</p>
              <a href="/employer/jobs/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold no-underline hover:bg-[#7c6ff7] transition-all">
                Post your first job
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>{['Job Title','Type','Location','Min. Tier','Applicants','Status','Posted','Actions'].map(h => (
                    <th key={h} className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {jobs.map((job: any) => {
                    const [sbg, sc] = STATUS_STYLE[job.status] || ['#f5f5fb', '#6b6b8a'];
                    return (
                      <tr key={job.id} className="hover:bg-[#fafafd] transition-colors">
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <div className="font-semibold text-[#0a0a0f] text-[13px]">{job.title}</div>
                          {job.salary && <div className="text-[11px] text-[#9898b8]">{job.salary}</div>}
                        </td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[12px]">{job.type}</td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[12px]">{job.location}</td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">{job.minTier ? <TierPill tier={job.minTier} /> : <span className="text-[11px] text-[#9898b8]">Any</span>}</td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8] font-semibold text-[#5b4cf5] text-[13px]">{job.applicantCount ?? 0}</td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize" style={{ background: sbg, color: sc }}>{job.status}</span>
                        </td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#9898b8] text-[11px]">
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <div className="flex gap-1.5">
                            <a href={`/employer/jobs/${job.id}/edit`} className="text-[12px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg no-underline hover:bg-[#5b4cf5] hover:text-white transition-all">Edit</a>
                            <a href={`/employer/jobs/${job.id}`} className="text-[12px] font-semibold text-[#6b6b8a] bg-[#f5f5fb] px-2.5 py-1 rounded-lg no-underline hover:bg-[#e8e8f0] transition-all">View</a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ APPLICANTS ════════════════════════════════════════════════════ */}
      {tab === 'applicants' && (
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <span className="font-syne font-bold text-[15px]">All Applicants <span className="text-[#9898b8] text-sm font-normal">(sorted by Merit Coins)</span></span>
            <div className="flex gap-2 flex-wrap">
              {/* Tier filter */}
              <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl border border-[#e8e8f0]">
                {(['all','platinum','gold','silver','bronze'] as const).map(t => (
                  <button key={t} onClick={() => setTierFilter(t)}
                    className={`px-3 py-1.5 rounded-[8px] text-[11px] font-semibold border-0 cursor-pointer capitalize transition-all ${tierFilter === t ? 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-[#0a0a0f]' : 'bg-transparent text-[#6b6b8a]'}`}>
                    {t === 'all' ? 'All' : `${TIERS[t].icon} ${TIERS[t].label}`}
                  </button>
                ))}
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="text-sm text-[#6b6b8a] border border-[#e8e8f0] rounded-lg px-3 py-2 bg-white outline-none font-[inherit] cursor-pointer">
                <option value="">All Statuses</option>
                {['applied','reviewing','shortlisted','interviewing','hired','rejected'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {tierFilter !== 'all' && (
            <div className="mb-4 p-3 rounded-xl text-[12px] font-semibold" style={{ background: TIERS[tierFilter]?.bg, color: TIERS[tierFilter]?.color }}>
              {TIERS[tierFilter]?.icon} Showing {TIERS[tierFilter]?.label} tier — {applicants?.length ?? '…'} result{applicants?.length !== 1 ? 's' : ''}
            </div>
          )}

          {applicants === null ? (
            <div className="flex flex-col gap-3">{[1,2,3,4,5].map(i => <Sk key={i} h="h-16" r="rounded-xl" />)}</div>
          ) : applicants.length === 0 ? (
            <p className="text-sm text-[#9898b8] py-8 text-center">No applicants match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>{['#','Candidate','Applied For','Merit Tier','Skills','Certs','Projects','Status','Action'].map(h => (
                    <th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {applicants.map((a: any, idx: number) => (
                    <tr key={a.applicationId} className={`hover:bg-[#fafafd] transition-colors ${a.meritCoins >= 5000 ? 'bg-[#fafaff]' : ''}`}>
                      <td className="py-3 px-3 border-b border-[#f0f0f8]">
                        <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${idx===0?'bg-[#f59e0b] text-white':idx===1?'bg-[#9898b8] text-white':idx===2?'bg-[#cd7f32] text-white':'bg-[#f5f5fb] text-[#6b6b8a]'}`}>
                          {idx+1}
                        </span>
                      </td>
                      <td className="py-3 px-3 border-b border-[#f0f0f8]">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={a.name} avatar={a.avatar} />
                          <div>
                            <div className="font-semibold text-[#0a0a0f] text-[13px]">{a.name}</div>
                            {a.title && <div className="text-[10px] text-[#9898b8]">{a.title}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 border-b border-[#f0f0f8] text-[#6b6b8a] text-[12px]">{a.job?.title || '—'}</td>
                      <td className="py-3 px-3 border-b border-[#f0f0f8]"><MeritBadge coins={a.meritCoins} /></td>
                      <td className="py-3 px-3 border-b border-[#f0f0f8]">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {a.skills?.slice(0,3).map((s: any) => (
                            <span key={s.name} className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f2ff] text-[#5b4cf5] font-semibold">{s.name}</span>
                          ))}
                          {a.skills?.length > 3 && <span className="text-[10px] text-[#9898b8]">+{a.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3 border-b border-[#f0f0f8] font-semibold text-[13px]">{a.certCount}</td>
                      <td className="py-3 px-3 border-b border-[#f0f0f8] font-semibold text-[13px]" style={{ color: a.projectCount > 0 ? '#22c55e' : '#9898b8' }}>
                        {a.projectCount}
                      </td>
                      <td className="py-3 px-3 border-b border-[#f0f0f8]">
                        <StatusSelect appId={a.applicationId} current={a.status} onChange={onStatusChange} />
                      </td>
                      <td className="py-3 px-3 border-b border-[#f0f0f8]">
                        <button onClick={() => setSelectedUser(a.id)} className="text-[12px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">
                          Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ TOP TALENT ════════════════════════════════════════════════════ */}
      {tab === 'talent' && (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-syne font-bold text-[15px] mb-0.5">⭐ Top Talent — Ranked by Merit Coins</h2>
              <p className="text-[12px] text-[#6b6b8a]">{talentTotal.toLocaleString()} verified candidates. Platinum & Gold are your highest-achieving learners.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input value={talentSearch} onChange={e => setTalentSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadTalent()}
                placeholder="Search by name or title…"
                className="px-3 py-2 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] transition-all" />
              <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl border border-[#e8e8f0]">
                {(['all','platinum','gold','silver','bronze'] as const).map(t => (
                  <button key={t} onClick={() => setTalentTier(t)}
                    className={`px-3 py-1.5 rounded-[8px] text-[11px] font-semibold border-0 cursor-pointer capitalize transition-all ${talentTier === t ? 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-[#0a0a0f]' : 'bg-transparent text-[#6b6b8a]'}`}>
                    {t === 'all' ? 'All' : `${TIERS[t].icon} ${TIERS[t].label}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Platinum featured cards */}
          {talentTier === 'all' && talent && talent.some(u => u.meritCoins >= 5000) && (
            <div className="mb-5">
              <div className="text-[11px] font-bold text-[#7c3aed] bg-[#f4f2ff] px-2.5 py-1 rounded-full w-fit mb-3">💎 PLATINUM — TOP TALENT</div>
              <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                {talent.filter(u => u.meritCoins >= 5000).slice(0, 3).map((u: any) => (
                  <div key={u.id} className="bg-white rounded-2xl p-5 border-2 border-[#7c3aed]/25 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,58,237,0.12)] transition-all">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5b4cf5] to-[#7c3aed]" />
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar name={u.name} avatar={u.avatar} size={12} />
                      <div>
                        <div className="font-syne font-bold text-[14px]">{u.name}</div>
                        <div className="text-xs text-[#6b6b8a]">{u.title || u.location}</div>
                        <MeritBadge coins={u.meritCoins} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { v: u.skills?.length || 0,  label:'Skills',       color:'#5b4cf5', bg:'#f4f2ff' },
                        { v: u.certCount,             label:'Certs',        color:'#22c55e', bg:'#f0fdf4' },
                        { v: u.projectCount,          label:'Projects',     color:'#f59e0b', bg:'#fffbeb' },
                      ].map(s => (
                        <div key={s.label} className="text-center rounded-xl p-2" style={{ background: s.bg }}>
                          <div className="font-syne font-bold text-sm" style={{ color: s.color }}>{s.v}</div>
                          <div className="text-[9px] text-[#9898b8]">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {u.platforms?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {u.platforms.map((p: string) => (
                          <span key={p} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#22c55e]">{p}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedUser(u.id)} className="flex-1 py-2 text-xs font-semibold text-white bg-[#5b4cf5] rounded-xl border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all">View Profile</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full table */}
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
            {talent === null ? (
              <div className="flex flex-col gap-3">{[1,2,3,4,5].map(i => <Sk key={i} h="h-14" r="rounded-xl" />)}</div>
            ) : talent.length === 0 ? (
              <p className="text-sm text-[#9898b8] py-8 text-center">No candidates found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>{['#','Candidate','Merit Tier','Skills','Certs','Projects','Platforms','Action'].map(h => (
                      <th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {talent.map((u: any, idx: number) => (
                      <tr key={u.id} className={`hover:bg-[#fafafd] transition-colors ${u.meritCoins >= 5000 ? 'bg-[#fafaff]' : ''}`}>
                        <td className="py-3 px-3 border-b border-[#f0f0f8]">
                          <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${idx===0?'bg-[#f59e0b] text-white':idx===1?'bg-[#9898b8] text-white':idx===2?'bg-[#cd7f32] text-white':'bg-[#f5f5fb] text-[#6b6b8a]'}`}>
                            {idx+1}
                          </span>
                        </td>
                        <td className="py-3 px-3 border-b border-[#f0f0f8]">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.name} avatar={u.avatar} />
                            <div>
                              <div className="font-semibold text-[13px]">{u.name}</div>
                              {u.title && <div className="text-[10px] text-[#9898b8]">{u.title}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 border-b border-[#f0f0f8]"><MeritBadge coins={u.meritCoins} /></td>
                        <td className="py-3 px-3 border-b border-[#f0f0f8]">
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {u.skills?.slice(0,3).map((s: any) => (
                              <span key={s.name} className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f2ff] text-[#5b4cf5] font-semibold">{s.name}</span>
                            ))}
                            {u.skills?.length > 3 && <span className="text-[10px] text-[#9898b8]">+{u.skills.length-3}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 border-b border-[#f0f0f8] font-semibold text-[13px]">{u.certCount}</td>
                        <td className="py-3 px-3 border-b border-[#f0f0f8] font-semibold text-[13px]" style={{ color: u.projectCount > 0 ? '#22c55e' : '#9898b8' }}>{u.projectCount}</td>
                        <td className="py-3 px-3 border-b border-[#f0f0f8]">
                          {u.platforms?.length > 0
                            ? <span className="text-[11px] text-[#5b4cf5]">{u.platforms.slice(0,2).join(', ')}{u.platforms.length>2?` +${u.platforms.length-2}`:''}</span>
                            : <span className="text-[11px] text-[#9898b8]">—</span>}
                        </td>
                        <td className="py-3 px-3 border-b border-[#f0f0f8]">
                          <button onClick={() => setSelectedUser(u.id)} className="text-[12px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">
                            Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </SidebarLayout>
  );
}