'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { searchWebJobs, scoreJobsAgainstSkills, ScrapedJob } from '@/lib/jobSearchApi';

const navItems = [
  { href: '/dashboard',                 icon: 'fa-home',                label: 'Dashboard' },
  { href: '/dashboard/courses',         icon: 'fa-book-open',           label: 'Courses' },
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
  { href: '/dashboard/community',       icon: 'fa-users',               label: 'Community' },
  { href: '/dashboard/portfolio',       icon: 'fa-layer-group',         label: 'Portfolio' },
  { href: '/dashboard/resume',          icon: 'fa-file-lines',          label: 'Resume' },
  { href: '/dashboard/platforms',       icon: 'fa-graduation-cap',      label: 'Learning Platforms' },
  { href: '/dashboard/jobs',            icon: 'fa-briefcase',           label: 'Jobs' },
  { href: '/dashboard/certificates',    icon: 'fa-certificate',         label: 'Certificates' },
  { href: '/dashboard/rewards',         icon: 'fa-coins',               label: 'Rewards' },
  { href: '/dashboard/settings',        icon: 'fa-gear',                label: 'Settings' },
];

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const D = {
  card:    '#0F1521',
  border:  'rgba(255,255,255,0.07)',
  accent:  '#4F8EF7',
  green:   '#00E5A0',
  amber:   '#F59E0B',
  purple:  '#A78BFA',
  indigo:  '#6366f1',
  red:     '#F87171',
  muted:   'rgba(255,255,255,0.35)',
  text:    'rgba(255,255,255,0.85)',
  subtext: 'rgba(255,255,255,0.45)',
  input:   'rgba(255,255,255,0.06)',
};

/* ── Tiers ──────────────────────────────────────────────────────────────────── */
const TIERS = {
  platinum: { label: 'Platinum', icon: '💎', color: D.purple, gradient: 'linear-gradient(135deg,#5b4cf5,#7c3aed)' },
  gold:     { label: 'Gold',     icon: '🥇', color: D.amber,  gradient: 'linear-gradient(135deg,#d97706,#f59e0b)' },
  silver:   { label: 'Silver',   icon: '🥈', color: '#94A3B8', gradient: 'linear-gradient(135deg,#6b7280,#9ca3af)' },
  bronze:   { label: 'Bronze',   icon: '🥉', color: '#CD7C54', gradient: 'linear-gradient(135deg,#92400e,#b45309)' },
} as const;
type TierKey = keyof typeof TIERS;

/* ── Job Scout source metadata ──────────────────────────────────────────────── */
const SCOUT_SOURCE: Record<string, { icon: string; color: string }> = {
  google:       { icon: '🔎', color: '#4285f4' },
  linkedin:     { icon: '💼', color: '#0a66c2' },
  indeed:       { icon: '🔵', color: '#003a9b' },
  twitter:      { icon: '🐦', color: '#1da1f2' },
  glassdoor:    { icon: '🟢', color: '#0caa41' },
  jobberman:    { icon: '🇳🇬', color: '#00823b' },
  ngcareers:    { icon: '📋', color: '#e25c00' },
  myjobmag:     { icon: '📌', color: '#c0392b' },
  company_site: { icon: '🏢', color: D.purple },
  job_board:    { icon: '🌐', color: '#64748b' },
  web:          { icon: '🌐', color: '#64748b' },
  other:        { icon: '🔍', color: '#94a3b8' },
};

const SCOUT_TYPE_COLOR: Record<string, string> = {
  'full-time':  D.green,
  'part-time':  D.amber,
  'remote':     D.indigo,
  'contract':   '#ec4899',
  'internship': '#0ea5e9',
};

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const LOGO_COLORS = [D.accent, D.green, D.amber, '#38BDF8', D.red, D.purple, '#ec4899', '#14b8a6'];
function logoColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return LOGO_COLORS[Math.abs(h) % LOGO_COLORS.length];
}
function matchColor(pct: number): [string, string] {
  if (pct >= 85) return [D.green + '20', D.green];
  if (pct >= 70) return [D.amber + '20', D.amber];
  return [D.red + '20', D.red];
}
function timeAgo(d: string) {
  const sec = (Date.now() - new Date(d).getTime()) / 1000;
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  const days = Math.floor(sec / 86400);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getJobCover(job: any) {
  if (job?.kind === 'scouted') return '/job-covers/scouted.svg';
  if (job?.isPremium) return '/job-covers/premium.svg';
  return '/job-covers/default.svg';
}

function JobMediaHeader({ job, accent }: { job: any; accent: string }) {
  return (
    <div className="relative h-34 overflow-hidden" style={{ background: '#0C1422' }}>
      <Image
        src={getJobCover(job)}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        unoptimized
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,18,32,0.92) 0%, rgba(12,18,32,0.16) 58%, rgba(12,18,32,0.02) 100%)' }} />
      <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
        style={{ background: 'rgba(7,17,31,0.72)', border: `1px solid ${accent}50` }}>
        <span className="block h-2 w-2 rounded-full" style={{ background: accent }} />
        {job?.kind === 'scouted' ? 'AI Scouted' : job?.isPremium ? 'Featured Role' : 'Open Role'}
      </div>
    </div>
  );
}

function Sk({ h = 'h-4', w = 'w-full', r = 'rounded-xl' }: { h?: string; w?: string; r?: string }) {
  return <div className={`${h} ${w} ${r} animate-pulse`} style={{ background: 'rgba(255,255,255,0.06)' }} />;
}
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: D.card, border: `1px solid ${D.border}` }}>
      {children}
    </div>
  );
}

/* ── Employer job card ──────────────────────────────────────────────────────── */
function OpportunityAd({ job, userTier, onApply, onSave, applying, saving }: any) {
  const jobTier = (job.minTier || 'bronze') as TierKey;
  const t  = TIERS[jobTier] || TIERS.bronze;
  const lc = logoColor(job.company || '');
  const [mbg, mc] = matchColor(job.match || 60);

  return (
    <div className="relative rounded-2xl overflow-hidden group hover:-translate-y-0.5 transition-all duration-200"
      style={{ background: D.card, border: `1px solid ${job.isPremium ? D.purple + '50' : D.border}` }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at 10% 10%, ${lc}08 0%, transparent 60%)` }} />
      {job.isPremium && <div className="h-0.5 w-full" style={{ background: t.gradient }} />}
      <JobMediaHeader job={job} accent={job.isPremium ? t.color : lc} />
      <div className="p-5 relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl grid place-items-center font-jakarta font-bold text-base text-white shrink-0" style={{ background: lc }}>
              {(job.company || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-jakarta font-bold text-[14.5px] tracking-tight truncate text-white">{job.title}</h3>
              <p className="text-xs truncate" style={{ color: D.subtext }}>{job.company ? `${job.company} · ${job.location}` : job.location}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {job.isPremium && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: t.color + '20', color: t.color, border: `1px solid ${t.color}30` }}>
                {t.icon} {t.label}
              </span>
            )}
            {job.match != null && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: mbg, color: mc }}>{job.match}% match</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap mb-3">
          {job.type && <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: D.subtext }}><i className="fas fa-briefcase text-[9px]" />{job.type}</span>}
          {job.salary && <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: D.subtext }}><i className="fas fa-money-bill-wave text-[9px]" />{job.salary}</span>}
          {job.createdAt && <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: D.muted }}><i className="fas fa-clock text-[9px]" />{timeAgo(job.createdAt)}</span>}
        </div>
        {job.description && <p className="text-[12.5px] leading-relaxed line-clamp-2 mb-3" style={{ color: D.subtext }}>{job.description}</p>}
        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.skills.slice(0, 5).map((s: string) => (
              <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: D.accent + '18', color: D.accent }}>{s}</span>
            ))}
            {job.skills.length > 5 && <span className="text-[10px]" style={{ color: D.muted }}>+{job.skills.length - 5}</span>}
          </div>
        )}
        <div className="flex gap-2">
          <button disabled={job.applied || applying === job.id} onClick={() => !job.applied && onApply(job.id)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed text-white"
            style={{ background: job.applied ? 'rgba(255,255,255,0.1)' : job.isPremium ? t.gradient : D.accent }}>
            {applying === job.id ? 'Applying…' : job.applied ? '✓ Applied' : 'Apply Now'}
          </button>
          <button disabled={saving === job.id} onClick={() => onSave(job.id, job.saved)}
            className="w-10 h-10 rounded-xl border-0 cursor-pointer grid place-items-center shrink-0 transition-all hover:opacity-80"
            style={{ background: job.saved ? D.accent + '18' : D.input, color: job.saved ? D.accent : D.muted }}>
            <i className="fas fa-bookmark text-sm" />
          </button>
        </div>
        {job.isPremium && (
          <div className="mt-2.5 flex items-center gap-1 text-[10px]" style={{ color: D.muted }}>
            <i className="fas fa-ad text-[9px]" /> Sponsored opportunity
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Locked tier teaser ─────────────────────────────────────────────────────── */
function LockedTierTeaser({ targetTier, coinsNeeded }: { targetTier: TierKey; coinsNeeded: number }) {
  const t = TIERS[targetTier];
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px dashed ${t.color}40`, background: t.color + '08' }}>
      <div className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-3xl shrink-0" style={{ background: t.color + '18' }}>🔒</div>
        <div className="flex-1">
          <h3 className="font-jakarta font-bold text-[14px] mb-1" style={{ color: t.color }}>{t.icon} {t.label} Opportunities Locked</h3>
          <p className="text-xs mb-2" style={{ color: D.subtext }}>
            Earn <strong>{coinsNeeded.toLocaleString()} more Merit Coins</strong> to unlock {t.label.toLowerCase()} job opportunities.
          </p>
          <a href="/dashboard/rewards" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl no-underline text-white hover:opacity-90 transition-all"
            style={{ background: t.gradient }}>
            <i className="fas fa-coins" /> Earn coins →
          </a>
        </div>
      </div>
    </div>
  );
}


/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function JobsPage() {
  const [featured, setFeatured]           = useState<any>(null);
  const [scouted, setScouted]             = useState<any[]>([]);
  const [allJobs, setAllJobs]             = useState<any[] | null>(null);
  const [scoutUnread, setScoutUnread]     = useState(0);
  const [selected, setSelected]           = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [activeTab, setActiveTab]         = useState<'opportunities' | 'all' | 'saved' | 'applications' | 'websearch'>('opportunities');
  const [saved, setSaved]                 = useState<any[] | null>(null);
  const [applications, setApplications]   = useState<any[] | null>(null);
  const [applying, setApplying]           = useState<string | null>(null);
  const [saving, setSaving]               = useState<string | null>(null);
  const [toast, setToast]                 = useState('');

  // ── Web search state ───────────────────────────────────────────────────────
  const [webQuery,     setWebQuery]       = useState('');
  const [webResults,   setWebResults]     = useState<ScrapedJob[] | null>(null);
  const [webSearching, setWebSearching]   = useState(false);
  const [webError,     setWebError]       = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  // ── Web search handler ─────────────────────────────────────────────────────
  async function runWebSearch() {
    if (!webQuery.trim()) return;
    setWebSearching(true);
    setWebError('');
    try {
      const jobs = await searchWebJobs(webQuery);
      // featured?.userSkills is where SkillHub stores the user's skill list.
      // If your API returns skills under a different key, update this line.
      const userSkills: string[] = featured?.userSkills ?? user?.skills ?? [];
      setWebResults(scoreJobsAgainstSkills(jobs, userSkills));
    } catch (err: any) {
      setWebError(
        err?.message ||
        'Search failed. The Render free-tier service may be waking up — try again in ~30 s.'
      );
    } finally {
      setWebSearching(false);
    }
  }

  async function markScoutOpened(alertId?: string) {
    if (!alertId) return;
    setScouted(prev => prev.map(job => job.alertId === alertId ? { ...job, opened: true } : job));
    setScoutUnread(prev => Math.max(0, prev - 1));
    try {
      await apiFetch(`/job-scout/alerts/${alertId}/open`, { method: 'POST' });
    } catch {}
  }

  useEffect(() => {
    apiFetch('/jobs/featured')
      .then(r => { if (r.success) setFeatured(r.data); else setFeatured({ jobs: [], userTier: 'bronze', userCoins: 0 }); })
      .catch(() => setFeatured({ jobs: [], userTier: 'bronze', userCoins: 0 }));
    apiFetch('/jobs')
      .then(r => { if (r.success) { setAllJobs(r.data); if (r.data.length > 0) setSelected(r.data[0].id); } else setAllJobs([]); })
      .catch(() => setAllJobs([]));
    apiFetch('/job-scout/my-alerts')
      .then(r => {
        if (r.success && Array.isArray(r.data?.alerts)) {
          setScoutUnread(r.data?.unread || 0);
          const leads = r.data.alerts
            .filter((a: any) => a.lead)
            .map((a: any) => ({
              id:          a.lead.id,
              kind:        'scouted',
              alertId:     a.id,
              title:       a.lead.title,
              company:     a.lead.company,
              location:    a.lead.location || 'Remote',
              type:        a.lead.type || 'full-time',
              salary:      a.lead.salary,
              description: a.lead.description,
              url:         a.lead.url,
              applyUrl:    a.lead.url,
              source:      a.lead.source,
              skills:      a.lead.skills || [],
              postedAt:    a.lead.postedAt || a.lead.fetchedAt,
              opened:      a.opened,
              match:       a.match?.score,
              reasons:     a.match?.reasons || [],
            }));
          setScouted(leads);
        } else {
          setScouted([]);
          setScoutUnread(0);
        }
      })
      .catch(() => {
        setScouted([]);
        setScoutUnread(0);
      });
  }, []);

  useEffect(() => {
    if (activeTab === 'saved')        apiFetch('/jobs/saved').then(r => { if (r.success) setSaved(r.data); else setSaved([]); }).catch(() => setSaved([]));
    if (activeTab === 'applications') apiFetch('/jobs/applications').then(r => { if (r.success) setApplications(r.data); else setApplications([]); }).catch(() => setApplications([]));
  }, [activeTab]);

  async function applyJob(jobId: string) {
    const job = [...(allJobs || []), ...scouted].find(j => j.id === jobId);
    if (job?.kind === 'scouted') {
      await markScoutOpened(job.alertId);
      try {
        await apiFetch(`/job-scout/alerts/${job.alertId}/applied`, { method: 'POST' });
      } catch {}
      window.open(job.applyUrl || job.url, '_blank', 'noreferrer');
      return;
    }
    setApplying(jobId);
    try {
      const res = await apiFetch(`/jobs/${jobId}/apply`, { method: 'POST' });
      if (res.success) {
        showToast('Application submitted! 🎉');
        apiFetch('/jobs/featured').then(r => { if (r.success) setFeatured(r.data); });
        apiFetch('/jobs').then(r => { if (r.success) setAllJobs(r.data); });
      } else showToast(res.message || 'Application failed');
    } catch { showToast('Application failed'); } finally { setApplying(null); }
  }

  async function saveJob(jobId: string, isSaved: boolean) {
    const job = (allJobs || []).find(j => j.id === jobId);
    if (job?.kind === 'scouted') return;
    setSaving(jobId);
    try {
      const res = await apiFetch(`/jobs/${jobId}/save`, { method: 'POST' });
      if (res.success) {
        apiFetch('/jobs/featured').then(r => { if (r.success) setFeatured(r.data); });
        apiFetch('/jobs').then(r => { if (r.success) setAllJobs(r.data); });
        if (activeTab === 'saved') apiFetch('/jobs/saved').then(r => { if (r.success) setSaved(r.data); });
      }
    } catch {} finally { setSaving(null); }
  }

  const coins      = featured?.userCoins || 0;
  const userTier   = (featured?.userTier || 'bronze') as TierKey;
  const tier       = TIERS[userTier];
  const premiumAds    = (featured?.jobs || []).filter((j: any) => j.isPremium);
  const standardJobs  = (featured?.jobs || []).filter((j: any) => !j.isPremium);
  const TIER_ORDER: TierKey[] = ['bronze', 'silver', 'gold', 'platinum'];
  const lockedTiers   = TIER_ORDER.slice(TIER_ORDER.indexOf(userTier) + 1);
  const filtered      = (allJobs || []).filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) || j.company?.toLowerCase().includes(search.toLowerCase())
  );
  const detail = (allJobs || []).find(j => j.id === selected);

  const APP_STATUS_COLOR: Record<string, [string, string]> = {
    applied:      [D.accent + '20',  D.accent],
    reviewing:    [D.amber + '20',   D.amber],
    shortlisted:  [D.green + '20',   D.green],
    interviewing: [D.purple + '20',  D.purple],
    hired:        [D.green + '20',   D.green],
    rejected:     [D.red + '20',     D.red],
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs: Array<{ key: 'opportunities' | 'all' | 'saved' | 'applications' | 'websearch'; label: string; badge?: number }> = [
    { key: 'opportunities', label: '⭐ Opportunities', badge: scoutUnread },
    { key: 'all',           label: 'All Jobs' },
    { key: 'websearch',     label: '🔍 Search the Web' },
    { key: 'saved',         label: 'Saved' },
    { key: 'applications',  label: 'My Applications' },
  ];

  return (
    <SidebarLayout navItems={navItems} pageTitle="Jobs">
      <div style={{ color: D.text }}>
        {toast && (
          <div className="fixed top-5 right-5 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2"
            style={{ background: '#0D1525', border: `1px solid ${D.green}40` }}>
            <i className="fas fa-check-circle" style={{ color: D.green }} />{toast}
          </div>
        )}

        {/* Hero banner */}
        <div className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #0A1628 100%)', border: `1px solid ${D.amber}25` }}>
          <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 320, height: 320, background: `radial-gradient(circle, ${D.amber}15 0%, transparent 65%)`, borderRadius: '50%' }} />
          <div className="absolute pointer-events-none" style={{ bottom: -60, right: 80, width: 220, height: 220, background: `radial-gradient(circle, ${D.accent}10 0%, transparent 65%)`, borderRadius: '50%' }} />
          <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: D.amber + 'cc' }}>Career Hub</div>
              <h1 className="font-jakarta font-bold text-[2rem] text-white leading-tight mb-1">Job Opportunities</h1>
              <p className="text-[13px]" style={{ color: D.subtext }}>Jobs matched to your skills · AI-scouted alerts · higher Merit Coins unlock better roles.</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl" style={{ background: tier.color + '18', border: `1px solid ${tier.color}30` }}>
              <span className="text-xl">{tier.icon}</span>
              <div>
                <div className="font-jakarta font-bold text-[13px]" style={{ color: tier.color }}>{tier.label} Tier</div>
                <div className="text-[10px]" style={{ color: tier.color + '99' }}>{coins.toLocaleString()} coins</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5 flex-wrap" style={{ background: D.input, border: `1px solid ${D.border}`, width: 'fit-content' }}>
          {tabs.map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="relative px-4 py-2 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer transition-all border-0 whitespace-nowrap"
              style={{
                background: activeTab === key ? D.accent : 'transparent',
                color: activeTab === key ? 'white' : D.muted,
              }}
            >
              {label}
              {badge !== undefined && badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: D.amber,
                    color: '#000',
                    fontSize: 9,
                    fontWeight: 800,
                    borderRadius: '50%',
                    minWidth: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Opportunities Tab ──────────────────────────────────────────────── */}
        {activeTab === 'opportunities' && (
          <div>
            {featured === null ? (
              <div className="grid grid-cols-2 gap-4 mb-6 max-md:grid-cols-1">{[1,2,3,4].map(i => <Sk key={i} h="h-48" r="rounded-2xl" />)}</div>
            ) : premiumAds.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full" style={{ background: D.purple + '40', border: `1px solid ${D.purple}50` }}>⭐ FEATURED</span>
                  <span className="text-[11px]" style={{ color: D.muted }}>Posted by verified employers · matched to your {tier.label} tier</span>
                </div>
                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                  {premiumAds.map((job: any) => <OpportunityAd key={job.id} job={job} userTier={userTier} onApply={applyJob} onSave={saveJob} applying={applying} saving={saving} />)}
                </div>
              </div>
            )}
            {standardJobs.length > 0 && (
              <div className="mb-6">
                <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: D.muted }}>Matched Jobs ({standardJobs.length})</div>
                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                  {standardJobs.map((job: any) => <OpportunityAd key={job.id} job={job} userTier={userTier} onApply={applyJob} onSave={saveJob} applying={applying} saving={saving} />)}
                </div>
              </div>
            )}
            {featured !== null && premiumAds.length === 0 && standardJobs.length === 0 && scouted.length === 0 && (
              <div className="rounded-2xl p-12 text-center mb-6" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <i className="fas fa-briefcase text-4xl block mb-3" style={{ color: D.muted }} />
                <h3 className="font-jakarta font-bold text-[15px] text-white mb-2">No opportunities yet</h3>
                <p className="text-sm" style={{ color: D.subtext }}>Check back soon — employers are posting!</p>
              </div>
            )}
            {scouted.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.purple }}>
                    <i className="fas fa-robot mr-1.5" />AI Job Scout
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${D.purple}20`, color: D.purple }}>
                    {scouted.length} found on the web
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {scouted.map((job: any) => (
                    <div key={job.id} onClick={() => { setSelected(job.id); markScoutOpened(job.alertId); }}
                      className="rounded-2xl overflow-hidden cursor-pointer transition-all"
                      style={{ background: D.card, border: `1px solid ${selected === job.id ? D.purple : !job.opened ? D.amber : D.border}` }}>
                      <JobMediaHeader job={job} accent={!job.opened ? D.amber : D.purple} />
                      <div className="p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-jakarta font-bold text-[14px] text-white">{job.title}</h3>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${D.purple}20`, color: D.purple }}>Scouted</span>
                            {!job.opened && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${D.amber}20`, color: D.amber }}>New</span>}
                            {job.match != null && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${D.green}18`, color: D.green }}>{job.match}% match</span>}
                          </div>
                          <p className="text-[12px] mt-0.5" style={{ color: D.subtext }}>
                            {job.company} · {job.location} · <span style={{ color: D.muted }}>via {job.source}</span>
                          </p>
                          {job.salary && <p className="text-[12px] mt-1 font-semibold" style={{ color: D.green }}>{job.salary}</p>}
                          {job.reasons?.length > 0 && (
                            <p className="text-[11px] mt-1.5" style={{ color: D.muted }}>{job.reasons.join(' • ')}</p>
                          )}
                          {job.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {job.skills.slice(0, 5).map((s: string) => (
                                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${D.accent}15`, color: D.accent }}>{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <a href={job.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold no-underline shrink-0 transition-all hover:opacity-80"
                          style={{ background: `linear-gradient(135deg, ${D.indigo}, ${D.purple})`, color: '#fff' }}>
                          View & Apply <i className="fas fa-arrow-up-right-from-square text-[10px]" />
                        </a>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lockedTiers.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: D.muted }}>Unlock More Opportunities</div>
                <div className="flex flex-col gap-3">
                  {lockedTiers.map(lt => {
                    const needed = lt === 'silver' ? 500 - coins : lt === 'gold' ? 2000 - coins : 5000 - coins;
                    return <LockedTierTeaser key={lt} targetTier={lt} coinsNeeded={Math.max(0, needed)} />;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── All Jobs Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'all' && (
          <>
            <div className="relative mb-4 max-w-md">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: D.muted }} />
              <input type="text" placeholder="Search jobs or companies…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all"
                style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }} />
            </div>
            {allJobs === null ? (
              <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <Sk key={i} h="h-28" r="rounded-2xl" />)}</div>
            ) : (
              <div className="flex gap-4">
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  {filtered.length === 0 ? (
                    <div className="text-center py-16">
                      <i className="fas fa-briefcase text-[38px] block mb-3" style={{ color: D.muted }} />
                      <h3 className="font-jakarta font-bold text-[16px] text-white mb-1.5">No jobs found</h3>
                      <p className="text-[13px]" style={{ color: D.subtext }}>Try a different search or earn more coins.</p>
                    </div>
                  ) : filtered.map(job => {
                    const [mbg, mc] = matchColor(job.match ?? 60);
                    const isActive = selected === job.id;
                    const lc = logoColor(job.company || '');
                    return (
                      <div key={job.id} onClick={() => setSelected(job.id)}
                        className="rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5"
                        style={{ background: D.card, border: `2px solid ${isActive ? D.accent : D.border}` }}>
                        {job.isPremium && <div className="h-0.5 w-full rounded-full mb-3" style={{ background: 'linear-gradient(90deg,#5b4cf5,#7c3aed)' }} />}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl grid place-items-center font-jakarta font-bold text-sm text-white shrink-0" style={{ background: lc }}>
                            {(job.company || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-jakarta font-bold text-[14px] tracking-tight truncate text-white">{job.title}</h3>
                                <p className="text-xs" style={{ color: D.subtext }}>{job.company ? `${job.company} · ${job.location}` : job.location}</p>
                              </div>
                              {job.match != null && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: mbg, color: mc }}>{job.match}%</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {job.type && <span className="text-xs" style={{ color: D.subtext }}>{job.type}</span>}
                              {job.salary && <><span className="text-xs" style={{ color: D.muted }}>·</span><span className="text-xs" style={{ color: D.subtext }}>{job.salary}</span></>}
                              {job.isPremium && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: D.purple + '20', color: D.purple }}>⭐ Featured</span>}
                              {job.kind === 'scouted' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: D.indigo + '20', color: D.indigo }}>
                                  {(SCOUT_SOURCE[job.source] || SCOUT_SOURCE.other).icon} AI Scouted
                                </span>
                              )}
                              {job.applied && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: D.green + '20', color: D.green }}>✓ Applied</span>}
                              {job.saved && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: D.amber + '20', color: D.amber }}>🔖 Saved</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {detail && (
                  <div className="w-85 shrink-0 max-[1100px]:hidden">
                    <div className="rounded-2xl p-5 sticky top-20" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                      {detail.isPremium && <div className="h-0.5 w-full rounded-full mb-4" style={{ background: 'linear-gradient(90deg,#5b4cf5,#7c3aed)' }} />}
                      <div className="relative -mx-5 -mt-5 mb-4 overflow-hidden border-b" style={{ borderColor: D.border }}>
                        <JobMediaHeader job={detail} accent={detail.kind === 'scouted' ? D.indigo : detail.isPremium ? D.purple : D.accent} />
                      </div>
                      {detail.kind === 'scouted' && (
                        <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: D.indigo + '20', color: D.indigo }}>
                          {(SCOUT_SOURCE[detail.source] || SCOUT_SOURCE.other).icon} AI-Scouted from {detail.source?.replace('_', ' ')}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl grid place-items-center font-jakarta font-bold text-lg text-white" style={{ background: logoColor(detail.company || '') }}>
                          {(detail.company || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-jakarta font-bold text-[16px] tracking-tight text-white">{detail.title}</h3>
                          <p className="text-[13px]" style={{ color: D.subtext }}>{detail.company}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {[
                          { icon: 'fa-map-marker-alt', label: detail.location },
                          { icon: 'fa-briefcase',      label: detail.type },
                          { icon: 'fa-money-bill',     label: detail.salary },
                          { icon: 'fa-clock',          label: detail.createdAt ? timeAgo(detail.createdAt) : 'Recently' },
                        ].filter(i => i.label).map(item => (
                          <div key={item.icon} className="flex items-center gap-1.5 text-xs" style={{ color: D.subtext }}>
                            <i className={`fas ${item.icon}`} style={{ color: D.muted }} />{item.label}
                          </div>
                        ))}
                      </div>
                      {detail.skills?.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: D.muted }}>Required Skills</div>
                          <div className="flex flex-wrap gap-1.5">
                            {detail.skills.map((s: string) => <span key={s} className="px-2.5 py-1 text-xs font-semibold rounded-full" style={{ background: D.accent + '18', color: D.accent }}>{s}</span>)}
                          </div>
                        </div>
                      )}
                      {detail.description && (
                        <div className="mb-4">
                          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: D.muted }}>About the Role</div>
                          <p className="text-[13px] leading-relaxed line-clamp-5" style={{ color: D.subtext }}>{detail.description}</p>
                        </div>
                      )}
                      {detail.match != null && (
                        <div className="mb-4 p-3 rounded-xl" style={{ background: matchColor(detail.match)[0] }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold" style={{ color: matchColor(detail.match)[1] }}>Match Score</span>
                            <span className="text-sm font-bold" style={{ color: matchColor(detail.match)[1] }}>{detail.match}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <div className="h-full rounded-full" style={{ width: `${detail.match}%`, background: matchColor(detail.match)[1] }} />
                          </div>
                          {detail.kind === 'scouted' && detail.reasons?.length > 0 && (
                            <p className="text-[11px] mt-2" style={{ color: matchColor(detail.match)[1] }}>{detail.reasons.join(' • ')}</p>
                          )}
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <button disabled={detail.kind !== 'scouted' && (detail.applied || applying === detail.id)}
                          onClick={() => { if (detail.kind === 'scouted') applyJob(detail.id); else if (!detail.applied) applyJob(detail.id); }}
                          className="w-full py-3 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed text-white"
                          style={{ background: detail.kind === 'scouted' ? `linear-gradient(135deg, ${D.indigo}, ${D.purple})` : detail.applied ? 'rgba(255,255,255,0.1)' : detail.isPremium ? 'linear-gradient(135deg,#5b4cf5,#7c3aed)' : D.accent }}>
                          {detail.kind === 'scouted' ? 'View & Apply ↗' : applying === detail.id ? 'Applying…' : detail.applied ? '✓ Applied' : 'Apply Now'}
                        </button>
                        {detail.kind !== 'scouted' && (
                        <button disabled={saving === detail.id} onClick={() => saveJob(detail.id, detail.saved)}
                          className="w-full py-3 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all hover:opacity-80"
                          style={{ background: D.input, color: detail.saved ? D.accent : D.muted }}>
                          <i className="fas fa-bookmark mr-1.5" />{detail.saved ? 'Saved' : 'Save Job'}
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Web Search Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'websearch' && (
          <div>
            {/* Search bar */}
            <div className="flex gap-2 mb-6 max-w-xl">
              <input
                type="text"
                placeholder="e.g. React developer Nigeria, remote data analyst…"
                value={webQuery}
                onChange={e => setWebQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runWebSearch()}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all"
                style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }}
                onFocus={e => { e.target.style.borderColor = D.accent; }}
                onBlur={e => { e.target.style.borderColor = D.border; }}
              />
              <button
                onClick={runWebSearch}
                disabled={webSearching || !webQuery.trim()}
                className="px-6 py-3 rounded-xl text-sm font-semibold border-0 cursor-pointer text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: D.accent }}
              >
                {webSearching ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Searching…
                  </span>
                ) : 'Search'}
              </button>
            </div>

            {/* Empty state with suggestion chips */}
            {webResults === null && !webSearching && !webError && (
              <div className="rounded-2xl p-10 text-center" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <i className="fas fa-search text-3xl block mb-4" style={{ color: D.accent + '60' }} />
                <p className="text-[14px] font-semibold text-white/80 mb-1">Search live jobs across the web</p>
                <p className="text-[12.5px] mb-6" style={{ color: D.subtext }}>
                  Results are pulled in real-time and scored against your verified SkillHub skills.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['React developer Lagos', 'Remote data analyst', 'Python engineer Nigeria', 'Cloud engineer Africa'].map(q => (
                    <button key={q} onClick={() => setWebQuery(q)}
                      className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer transition-all hover:opacity-80"
                      style={{ background: D.accent + '14', color: D.accent, border: `1px solid ${D.accent}30` }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error state */}
            {webError && (
              <div className="rounded-2xl p-4 mb-5 flex items-start gap-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <i className="fas fa-exclamation-circle text-[14px] mt-0.5 flex-shrink-0" style={{ color: D.red }} />
                <div>
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: D.red }}>Search error</p>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{webError}</p>
                  <button onClick={runWebSearch}
                    className="mt-2 text-[11.5px] font-semibold border-0 bg-transparent cursor-pointer"
                    style={{ color: D.accent }}>
                    Try again →
                  </button>
                </div>
              </div>
            )}

            {/* Skeleton */}
            {webSearching && (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => <Sk key={i} h="h-24" r="rounded-2xl" />)}
              </div>
            )}

            {/* Results */}
            {webResults !== null && !webSearching && (
              webResults.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                  <i className="fas fa-search text-4xl block mb-3" style={{ color: D.muted }} />
                  <h3 className="font-jakarta font-bold text-[15px] text-white mb-2">No results found</h3>
                  <p className="text-sm" style={{ color: D.subtext }}>Try a different search term.</p>
                </div>
              ) : (
                <>
                  {/* Result count + clear */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px]" style={{ color: D.subtext }}>
                      {webResults.length} live jobs for{' '}
                      <strong className="text-white/70">"{webQuery}"</strong>
                    </p>
                    <button
                      onClick={() => { setWebResults(null); setWebQuery(''); }}
                      className="text-[11.5px] font-semibold border-0 bg-transparent cursor-pointer"
                      style={{ color: D.muted }}
                    >
                      Clear ×
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {webResults.map((job, i) => {
                      const [mbg, mc] = job.match != null ? matchColor(job.match) : ['transparent', D.muted];
                      return (
                        <div
                          key={job.id || i}
                          className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                          style={{ background: D.card, border: `1px solid ${D.border}` }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Left */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-jakarta font-bold text-[14px] text-white">{job.title}</h3>
                                {job.match != null && (
                                  <span
                                    className="text-[10.5px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: mbg, color: mc }}
                                  >
                                    {job.match}% match
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] mb-2" style={{ color: D.subtext }}>
                                <span className="font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>{job.company}</span>
                                {job.location && <span> · {job.location}</span>}
                                <span style={{ color: D.muted }}> · via {job.source}</span>
                              </p>
                              {job.skills && job.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {job.skills.slice(0, 6).map(s => (
                                    <span
                                      key={s}
                                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                      style={{ background: D.accent + '16', color: D.accent }}
                                    >
                                      {s}
                                    </span>
                                  ))}
                                  {job.skills.length > 6 && (
                                    <span className="text-[10px]" style={{ color: D.muted }}>
                                      +{job.skills.length - 6} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* Right: CTA */}
                            <a
                              href={job.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold no-underline text-white transition-all hover:opacity-80"
                              style={{ background: D.accent }}
                            >
                              View <i className="fas fa-external-link-alt text-[10px]" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* ── Saved Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'saved' && (
          <div>
            {saved === null ? (
              <div className="flex flex-col gap-3">{[1,2,3].map(i => <Sk key={i} h="h-40" r="rounded-2xl" />)}</div>
            ) : saved.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                <i className="fas fa-bookmark text-4xl block mb-3" style={{ color: D.muted }} />
                <h3 className="font-jakarta font-bold text-[15px] text-white mb-2">No saved jobs</h3>
                <p className="text-sm" style={{ color: D.subtext }}>Jobs you bookmark will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                {saved.map((job: any) => <OpportunityAd key={job.id} job={job} userTier={userTier} onApply={applyJob} onSave={saveJob} applying={applying} saving={saving} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Applications Tab ──────────────────────────────────────────────── */}
        {activeTab === 'applications' && (
          <Card>
            <span className="font-jakarta font-bold text-[15px] text-white block mb-4">My Applications</span>
            {applications === null ? (
              <div className="flex flex-col gap-3">{[1,2,3].map(i => <Sk key={i} h="h-16" r="rounded-xl" />)}</div>
            ) : applications.length === 0 ? (
              <div className="py-10 text-center">
                <i className="fas fa-paper-plane text-4xl block mb-3" style={{ color: D.muted }} />
                <p className="text-sm" style={{ color: D.subtext }}>You haven't applied to any jobs yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>{['Job', 'Company', 'Applied', 'Status'].map(h => (
                      <th key={h} className="py-2.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: D.muted, borderBottom: `1px solid ${D.border}` }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {applications.map((app: any) => {
                      const [sbg, sc] = APP_STATUS_COLOR[app.status] || [D.input, D.muted];
                      return (
                        <tr key={app.id} className="transition-colors hover:opacity-80">
                          <td className="py-3.5 px-4 font-semibold text-white" style={{ borderBottom: `1px solid ${D.border}` }}>{app.job?.title}</td>
                          <td className="py-3.5 px-4" style={{ color: D.subtext, borderBottom: `1px solid ${D.border}` }}>{app.job?.company}</td>
                          <td className="py-3.5 px-4 text-[12px]" style={{ color: D.muted, borderBottom: `1px solid ${D.border}` }}>
                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3.5 px-4" style={{ borderBottom: `1px solid ${D.border}` }}>
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: sbg, color: sc }}>{app.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

      </div>
    </SidebarLayout>
  );
}
