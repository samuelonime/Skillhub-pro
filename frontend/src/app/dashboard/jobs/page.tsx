'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',            icon: 'fa-home',         label: 'Dashboard' },
  { href: '/dashboard/courses',    icon: 'fa-book-open',    label: 'Courses' },
  { href: '/dashboard/community', icon: 'fa-users', label: 'Community' },
  { href: '/dashboard/portfolio',  icon: 'fa-layer-group',  label: 'Portfolio' },
  { href: '/dashboard/platforms',  icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs',       icon: 'fa-briefcase',    label: 'Jobs' },
  { href: '/dashboard/certificates',icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/rewards',    icon: 'fa-coins',        label: 'Rewards' },
  { href: '/dashboard/settings',   icon: 'fa-gear',         label: 'Settings' },
];

/* ─── Tier config ────────────────────────────────────────────────────────── */
const TIERS = {
  platinum: { label:'Platinum', icon:'💎', color:'#7c3aed', bg:'#f4f2ff', border:'#c4b5fd', gradient:'linear-gradient(135deg,#5b4cf5,#7c3aed)' },
  gold:     { label:'Gold',     icon:'🥇', color:'#d97706', bg:'#fffbeb', border:'#fcd34d', gradient:'linear-gradient(135deg,#d97706,#f59e0b)' },
  silver:   { label:'Silver',   icon:'🥈', color:'#6b7280', bg:'#f5f5fb', border:'#d1d5db', gradient:'linear-gradient(135deg,#6b7280,#9ca3af)' },
  bronze:   { label:'Bronze',   icon:'🥉', color:'#92400e', bg:'#fef3c7', border:'#d97706', gradient:'linear-gradient(135deg,#92400e,#b45309)' },
} as const;
type TierKey = keyof typeof TIERS;

function getTier(coins: number): TierKey {
  if (coins >= 5000) return 'platinum';
  if (coins >= 2000) return 'gold';
  if (coins >= 500)  return 'silver';
  return 'bronze';
}

const LOGO_COLORS = ['#5b4cf5','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
function logoColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return LOGO_COLORS[Math.abs(h) % LOGO_COLORS.length];
}
function matchColor(pct: number): [string,string] {
  if (pct >= 85) return ['#f0fdf4','#15803d'];
  if (pct >= 70) return ['#fffbeb','#92400e'];
  return ['#fef2f2','#b91c1c'];
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days/7)}w ago`;
}

function Sk({ h='h-4', w='w-full', r='rounded' }: any) {
  return <div className={`${h} ${w} ${r} bg-[#f0f0f8] animate-pulse`} />;
}

/* ─── Opportunity Ad Card (tier-gated, employer-posted) ──────────────────── */
function OpportunityAd({ job, userTier, onApply, onSave, applying, saving }: any) {
  const jobTier = (job.minTier || 'bronze') as TierKey;
  const t = TIERS[jobTier] || TIERS.bronze;
  const lc = logoColor(job.company || '');
  const isPremium = job.isPremium;
  const [mbg, mc] = matchColor(job.match || 60);

  return (
    <div className={`relative rounded-2xl overflow-hidden border-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] ${isPremium ? '' : 'border-[#e8e8f0]'}`}
      style={{ borderColor: isPremium ? t.border : undefined }}>
      {/* Premium stripe */}
      {isPremium && (
        <div className="h-1 w-full" style={{ background: t.gradient }} />
      )}

      <div className="bg-white p-5">
        {/* Ad header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl grid place-items-center font-syne font-bold text-base text-white flex-shrink-0" style={{ background: lc }}>
              {(job.company || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-syne font-bold text-[14.5px] tracking-tight text-[#0a0a0f] truncate">{job.title}</h3>
              <p className="text-xs text-[#6b6b8a] truncate">{job.company ? `${job.company} · ${job.location}` : job.location}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {/* Tier badge */}
            {isPremium && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
                {t.icon} {t.label}
              </span>
            )}
            {/* Match score */}
            {job.match != null && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: mbg, color: mc }}>
                {job.match}% match
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] text-[#6b6b8a]">
            <i className="fas fa-briefcase text-[9px]" />{job.type}
          </span>
          {job.salary && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#6b6b8a]">
              <i className="fas fa-money-bill-wave text-[9px]" />{job.salary}
            </span>
          )}
          {job.createdAt && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#9898b8]">
              <i className="fas fa-clock text-[9px]" />{timeAgo(job.createdAt)}
            </span>
          )}
        </div>

        {/* Description snippet */}
        {job.description && (
          <p className="text-[12.5px] text-[#6b6b8a] leading-relaxed line-clamp-2 mb-3">{job.description}</p>
        )}

        {/* Skills */}
        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.skills.slice(0, 5).map((s: string) => (
              <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f4f2ff] text-[#5b4cf5]">{s}</span>
            ))}
            {job.skills.length > 5 && <span className="text-[10px] text-[#9898b8]">+{job.skills.length - 5}</span>}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            disabled={job.applied || applying === job.id}
            onClick={() => !job.applied && onApply(job.id)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed text-white"
            style={{ background: job.applied ? '#9898b8' : isPremium ? t.gradient : '#5b4cf5' }}>
            {applying === job.id ? 'Applying…' : job.applied ? '✓ Applied' : 'Apply Now'}
          </button>
          <button
            disabled={saving === job.id}
            onClick={() => onSave(job.id, job.saved)}
            className="w-10 h-10 rounded-xl border border-[#e8e8f0] bg-white cursor-pointer hover:border-[#5b4cf5] hover:bg-[#f4f2ff] transition-all grid place-items-center flex-shrink-0"
            style={{ color: job.saved ? '#5b4cf5' : '#9898b8' }}>
            <i className={`fas fa-bookmark text-sm`} />
          </button>
        </div>

        {/* Sponsored label */}
        {isPremium && (
          <div className="mt-2.5 flex items-center gap-1 text-[10px] text-[#9898b8]">
            <i className="fas fa-ad text-[9px]" /> Sponsored opportunity
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Locked tier teaser ─────────────────────────────────────────────────── */
function LockedTierTeaser({ targetTier, coinsNeeded }: { targetTier: TierKey; coinsNeeded: number }) {
  const t = TIERS[targetTier];
  return (
    <div className="relative rounded-2xl border-2 border-dashed overflow-hidden" style={{ borderColor: t.border }}>
      <div className="absolute inset-0" style={{ background: t.bg, opacity: 0.4 }} />
      <div className="relative p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-3xl flex-shrink-0" style={{ background: t.bg }}>
          🔒
        </div>
        <div className="flex-1">
          <h3 className="font-syne font-bold text-[14px] mb-1" style={{ color: t.color }}>
            {t.icon} {t.label} Opportunities Locked
          </h3>
          <p className="text-xs text-[#6b6b8a] mb-2">
            Earn <strong>{coinsNeeded.toLocaleString()} more Merit Coins</strong> to unlock {t.label.toLowerCase()} job opportunities from premium employers.
          </p>
          <a href="/dashboard/rewards"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl no-underline text-white transition-all hover:-translate-y-px"
            style={{ background: t.gradient }}>
            <i className="fas fa-coins" /> Earn coins →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function JobsPage() {
  const [featured, setFeatured]   = useState<any>(null);   // { jobs, userTier, userCoins }
  const [allJobs, setAllJobs]     = useState<any[]|null>(null);
  const [selected, setSelected]   = useState<string|null>(null);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState<'opportunities'|'all'|'saved'|'applications'>('opportunities');
  const [saved, setSaved]         = useState<any[]|null>(null);
  const [applications, setApplications] = useState<any[]|null>(null);
  const [applying, setApplying]   = useState<string|null>(null);
  const [saving, setSaving]       = useState<string|null>(null);
  const [toast, setToast]         = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  useEffect(() => {
    apiFetch('/jobs/featured')
      .then(r => { if (r.success) setFeatured(r.data); else setFeatured({ jobs:[], userTier:'bronze', userCoins:0 }); })
      .catch(() => setFeatured({ jobs:[], userTier:'bronze', userCoins:0 }));

    apiFetch('/jobs')
      .then(r => {
        if (r.success) {
          setAllJobs(r.data);
          if (r.data.length > 0) setSelected(r.data[0].id);
        } else setAllJobs([]);
      })
      .catch(() => setAllJobs([]));
  }, []);

  useEffect(() => {
    if (activeTab === 'saved') {
      apiFetch('/jobs/saved').then(r => { if (r.success) setSaved(r.data); else setSaved([]); }).catch(() => setSaved([]));
    }
    if (activeTab === 'applications') {
      apiFetch('/jobs/applications').then(r => { if (r.success) setApplications(r.data); else setApplications([]); }).catch(() => setApplications([]));
    }
  }, [activeTab]);

  async function applyJob(jobId: string) {
    setApplying(jobId);
    try {
      const res = await apiFetch(`/jobs/${jobId}/apply`, { method: 'POST' });
      if (res.success) {
        showToast('Application submitted! 🎉');
        // Refresh both lists
        apiFetch('/jobs/featured').then(r => { if (r.success) setFeatured(r.data); });
        apiFetch('/jobs').then(r => { if (r.success) setAllJobs(r.data); });
      } else showToast(res.message || 'Application failed');
    } catch { showToast('Application failed'); }
    finally { setApplying(null); }
  }

  async function saveJob(jobId: string, isSaved: boolean) {
    setSaving(jobId);
    try {
      const res = await apiFetch(`/jobs/${jobId}/save`, { method: isSaved ? 'DELETE' : 'POST' });
      if (res.success) {
        apiFetch('/jobs/featured').then(r => { if (r.success) setFeatured(r.data); });
        apiFetch('/jobs').then(r => { if (r.success) setAllJobs(r.data); });
        if (activeTab === 'saved') apiFetch('/jobs/saved').then(r => { if (r.success) setSaved(r.data); });
      }
    } catch {}
    finally { setSaving(null); }
  }

  const coins    = featured?.userCoins || 0;
  const userTier = (featured?.userTier || 'bronze') as TierKey;
  const tier     = TIERS[userTier];

  // Split featured jobs into premium ads + standard
  const premiumAds   = (featured?.jobs || []).filter((j: any) => j.isPremium);
  const standardJobs = (featured?.jobs || []).filter((j: any) => !j.isPremium);

  // Locked tier teasers — show what the user is missing
  const TIER_ORDER: TierKey[] = ['bronze','silver','gold','platinum'];
  const currentTierIdx = TIER_ORDER.indexOf(userTier);
  const lockedTiers = TIER_ORDER.slice(currentTierIdx + 1);

  const filtered = (allJobs || []).filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.toLowerCase().includes(search.toLowerCase())
  );
  const detail = (allJobs || []).find(j => j.id === selected);

  const APP_STATUS_STYLE: Record<string, [string,string]> = {
    applied:      ['#eff6ff','#1d4ed8'],
    reviewing:    ['#fffbeb','#92400e'],
    shortlisted:  ['#f0fdf4','#15803d'],
    interviewing: ['#f4f2ff','#5b4cf5'],
    hired:        ['#dcfce7','#15803d'],
    rejected:     ['#fef2f2','#dc2626'],
  };

  return (
    <SidebarLayout navItems={navItems} pageTitle="Jobs">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0a0a0f] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <i className="fas fa-check-circle text-[#22c55e]" />{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">Job Opportunities</h1>
          <p className="text-[13px] text-[#6b6b8a]">Jobs matched to your skills — higher Merit Coins unlock better opportunities.</p>
        </div>
        {/* User tier badge */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2" style={{ background: tier.bg, borderColor: tier.border }}>
          <span className="text-lg">{tier.icon}</span>
          <div>
            <div className="font-syne font-bold text-[13px]" style={{ color: tier.color }}>{tier.label} Tier</div>
            <div className="text-[10px]" style={{ color: tier.color + 'aa' }}>{coins.toLocaleString()} coins</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl w-fit mb-5 border border-[#e8e8f0] flex-wrap">
        {([
          ['opportunities', '⭐ Opportunities'],
          ['all',          'All Jobs'],
          ['saved',        'Saved'],
          ['applications', 'My Applications'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer transition-all border-0 whitespace-nowrap ${activeTab===key?'bg-white text-[#0a0a0f] font-semibold shadow-[0_1px_5px_rgba(0,0,0,0.09)]':'bg-transparent text-[#6b6b8a]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ OPPORTUNITIES TAB ══════════════════════════════════════════════ */}
      {activeTab === 'opportunities' && (
        <div>
          {/* Premium opportunity ads */}
          {featured === null ? (
            <div>
              <div className="text-[11px] font-bold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-full w-fit mb-3">⭐ FEATURED OPPORTUNITIES</div>
              <div className="grid grid-cols-2 gap-4 mb-6 max-md:grid-cols-1">{[1,2,3,4].map(i=><Sk key={i} h="h-48" r="rounded-2xl"/>)}</div>
            </div>
          ) : premiumAds.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full" style={{ background: 'linear-gradient(90deg,#5b4cf5,#7c3aed)' }}>
                  ⭐ FEATURED OPPORTUNITIES
                </span>
                <span className="text-[11px] text-[#9898b8]">Posted by verified employers · matched to your {tier.label} tier</span>
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                {premiumAds.map((job: any) => (
                  <OpportunityAd key={job.id} job={job} userTier={userTier}
                    onApply={applyJob} onSave={saveJob} applying={applying} saving={saving} />
                ))}
              </div>
            </div>
          )}

          {/* Standard matched jobs */}
          {standardJobs.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-3">
                Matched Jobs ({standardJobs.length})
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                {standardJobs.map((job: any) => (
                  <OpportunityAd key={job.id} job={job} userTier={userTier}
                    onApply={applyJob} onSave={saveJob} applying={applying} saving={saving} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {featured !== null && premiumAds.length === 0 && standardJobs.length === 0 && (
            <div className="bg-white rounded-2xl p-12 border border-[#e8e8f0] text-center mb-6">
              <i className="fas fa-briefcase text-4xl text-[#e8e8f0] mb-3 block" />
              <h3 className="font-syne font-bold text-[15px] mb-2">No opportunities yet</h3>
              <p className="text-sm text-[#9898b8]">Employers haven't posted jobs matching your tier yet. Check back soon!</p>
            </div>
          )}

          {/* Locked tier teasers */}
          {lockedTiers.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-3">
                Unlock More Opportunities
              </div>
              <div className="flex flex-col gap-3">
                {lockedTiers.map(lt => {
                  const coinsNeeded = lt === 'silver' ? 500 - coins : lt === 'gold' ? 2000 - coins : 5000 - coins;
                  return <LockedTierTeaser key={lt} targetTier={lt} coinsNeeded={Math.max(0, coinsNeeded)} />;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ALL JOBS TAB ═══════════════════════════════════════════════════ */}
      {activeTab === 'all' && (
        <>
          <div className="relative mb-4 max-w-md">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px]" />
            <input type="text" placeholder="Search jobs or companies…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all" />
          </div>

          {allJobs === null ? (
            <div className="flex flex-col gap-3">{[1,2,3,4].map(i=><Sk key={i} h="h-28" r="rounded-2xl"/>)}</div>
          ) : (
            <div className="flex gap-4">
              {/* Job list */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <i className="fas fa-briefcase text-[38px] text-[#e8e8f0] block mb-3" />
                    <h3 className="font-syne font-bold text-[16px] text-[#2d2d42] mb-1.5">No jobs found</h3>
                    <p className="text-[13px] text-[#6b6b8a]">Try a different search or earn more coins to unlock more listings.</p>
                  </div>
                ) : filtered.map(job => {
                  const [mbg, mc] = matchColor(job.match ?? 60);
                  const isActive = selected === job.id;
                  const lc = logoColor(job.company || '');
                  return (
                    <div key={job.id} onClick={() => setSelected(job.id)}
                      className={`bg-white rounded-2xl p-4 border-2 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] ${isActive?'border-[#5b4cf5]':'border-[#e8e8f0]'} ${job.isPremium?'shadow-[0_2px_8px_rgba(91,76,245,0.08)]':''}`}>
                      {job.isPremium && <div className="h-0.5 w-full rounded-full mb-3" style={{ background:'linear-gradient(90deg,#5b4cf5,#7c3aed)' }} />}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl grid place-items-center font-syne font-bold text-sm text-white flex-shrink-0" style={{ background: lc }}>
                          {(job.company || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-syne font-bold text-[14px] tracking-tight truncate">{job.title}</h3>
                              <p className="text-xs text-[#6b6b8a]">{job.company ? `${job.company} · ${job.location}` : job.location}</p>
                            </div>
                            {job.match != null && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background:mbg, color:mc }}>{job.match}%</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-[#6b6b8a]">{job.type}</span>
                            {job.salary && <><span className="text-xs text-[#9898b8]">·</span><span className="text-xs text-[#6b6b8a]">{job.salary}</span></>}
                            {job.isPremium && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#f4f2ff] text-[#5b4cf5]">⭐ Featured</span>}
                            {job.applied && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#f0fdf4] text-[#15803d]">✓ Applied</span>}
                            {job.saved && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#fffbeb] text-[#92400e]">🔖 Saved</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail panel */}
              {detail && (
                <div className="w-[340px] flex-shrink-0 max-[1100px]:hidden">
                  <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] sticky top-20">
                    {detail.isPremium && <div className="h-1 w-full rounded-full mb-4" style={{ background:'linear-gradient(90deg,#5b4cf5,#7c3aed)' }} />}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl grid place-items-center font-syne font-bold text-lg text-white" style={{ background:logoColor(detail.company||'') }}>
                        {(detail.company||'?')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-syne font-bold text-[16px] tracking-tight">{detail.title}</h3>
                        <p className="text-[13px] text-[#6b6b8a]">{detail.company}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { icon:'fa-map-marker-alt', label:detail.location },
                        { icon:'fa-briefcase',      label:detail.type },
                        { icon:'fa-money-bill',     label:detail.salary },
                        { icon:'fa-clock',          label:detail.createdAt?timeAgo(detail.createdAt):'Recently' },
                      ].filter(i=>i.label).map(item => (
                        <div key={item.icon} className="flex items-center gap-1.5 text-xs text-[#6b6b8a]">
                          <i className={`fas ${item.icon} text-[#9898b8]`} />{item.label}
                        </div>
                      ))}
                    </div>
                    {detail.skills?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Required Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.skills.map((s: string) => <span key={s} className="px-2.5 py-1 bg-[#f4f2ff] text-[#5b4cf5] text-xs font-semibold rounded-full">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {detail.description && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">About the Role</div>
                        <p className="text-[13px] text-[#2d2d42] leading-relaxed line-clamp-5">{detail.description}</p>
                      </div>
                    )}
                    {detail.match != null && (
                      <div className="mb-4 p-3 rounded-xl" style={{ background:matchColor(detail.match)[0] }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold" style={{ color:matchColor(detail.match)[1] }}>Match Score</span>
                          <span className="text-sm font-bold" style={{ color:matchColor(detail.match)[1] }}>{detail.match}%</span>
                        </div>
                        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width:`${detail.match}%`, background:matchColor(detail.match)[1] }} />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <button disabled={detail.applied||applying===detail.id} onClick={() => !detail.applied&&applyJob(detail.id)}
                        className="w-full py-3 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: detail.applied?'#9898b8':detail.isPremium?'linear-gradient(135deg,#5b4cf5,#7c3aed)':'#5b4cf5' }}>
                        {applying===detail.id?'Applying…':detail.applied?'✓ Applied':'Apply Now'}
                      </button>
                      <button disabled={saving===detail.id} onClick={() => saveJob(detail.id, detail.saved)}
                        className="w-full py-3 bg-[#f5f5fb] rounded-xl text-sm font-semibold border border-[#e8e8f0] cursor-pointer hover:border-[#5b4cf5] hover:text-[#5b4cf5] transition-all"
                        style={{ color: detail.saved?'#5b4cf5':'#6b6b8a' }}>
                        <i className="fas fa-bookmark mr-1.5" />{detail.saved?'Saved':'Save Job'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ SAVED TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'saved' && (
        <div>
          {saved === null ? (
            <div className="flex flex-col gap-3">{[1,2,3].map(i=><Sk key={i} h="h-40" r="rounded-2xl"/>)}</div>
          ) : saved.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-[#e8e8f0] text-center">
              <i className="fas fa-bookmark text-4xl text-[#e8e8f0] mb-3 block" />
              <h3 className="font-syne font-bold text-[15px] mb-2">No saved jobs</h3>
              <p className="text-sm text-[#9898b8]">Jobs you bookmark will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              {saved.map((job: any) => (
                <OpportunityAd key={job.id} job={job} userTier={userTier}
                  onApply={applyJob} onSave={saveJob} applying={applying} saving={saving} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ APPLICATIONS TAB ═══════════════════════════════════════════════ */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <span className="font-syne font-bold text-[15px] block mb-4">My Applications</span>
          {applications === null ? (
            <div className="flex flex-col gap-3">{[1,2,3].map(i=><Sk key={i} h="h-16" r="rounded-xl"/>)}</div>
          ) : applications.length === 0 ? (
            <div className="py-10 text-center">
              <i className="fas fa-paper-plane text-4xl text-[#e8e8f0] mb-3 block" />
              <p className="text-sm text-[#9898b8]">You haven't applied to any jobs yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr>{['Job','Company','Applied','Status'].map(h=>(
                  <th key={h} className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide">{h}</th>
                ))}</tr></thead>
                <tbody>{applications.map((app: any) => {
                  const [sbg, sc] = APP_STATUS_STYLE[app.status] || ['#f5f5fb','#6b6b8a'];
                  return (
                    <tr key={app.id} className="hover:bg-[#fafafd] transition-colors">
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] font-semibold text-[#0a0a0f]">{app.job?.title}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a]">{app.job?.company}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#9898b8] text-[12px]">{app.appliedAt?new Date(app.appliedAt).toLocaleDateString():'—'}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background:sbg, color:sc }}>{app.status}</span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}