'use client';

import { useState, useEffect } from 'react';
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
  { href: '/dashboard/resume',      icon: 'fa-file-lines',           label: 'Resume' },
  { href: '/dashboard/platforms',   icon: 'fa-graduation-cap',label: 'Learning Platforms' },
  { href: '/dashboard/jobs',        icon: 'fa-briefcase',     label: 'Jobs' },
  { href: '/dashboard/certificates',icon: 'fa-certificate',   label: 'Certificates' },
  { href: '/dashboard/rewards',     icon: 'fa-coins',         label: 'Rewards' },
  { href: '/dashboard/settings',    icon: 'fa-gear',          label: 'Settings' },
];

type DecayLabel = 'fresh' | 'good' | 'fading' | 'at-risk' | 'cold';

const DECAY: Record<DecayLabel, { bar: string; label: string }> = {
  fresh:    { bar: '#00E5A0', label: 'Fresh'   },
  good:     { bar: '#4F8EF7', label: 'Good'    },
  fading:   { bar: '#F59E0B', label: 'Fading'  },
  'at-risk':{ bar: '#F87171', label: 'At risk' },
  cold:     { bar: '#6B7280', label: 'Cold'    },
};

type FilterType = 'all' | DecayLabel;

function Sk({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-lg animate-pulse`} style={{ background: 'rgba(255,255,255,0.06)' }} />;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </div>
  );
}

export default function SkillDecayPage() {
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/skill-decay')
      .then(r => { if (r.success) setData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function refreshSkill(skillName: string) {
    setRefreshing(skillName);
    const r = await apiFetch(`/skill-decay/refresh/${encodeURIComponent(skillName)}`, { method: 'POST' }).catch(() => null);
    if (r?.success) {
      setData((prev: any) => ({
        ...prev,
        skills: prev.skills.map((s: any) =>
          s.skill === skillName ? { ...s, freshness: 100, label: 'fresh', isAlert: false, isCritical: false } : s
        ),
        alerts: prev.alerts.filter((a: any) => a.skill !== skillName),
      }));
    }
    setRefreshing(null);
  }

  const skills: any[]  = data?.skills ?? [];
  const alerts: any[]  = data?.alerts ?? [];
  const summary: any   = data?.summary ?? {};
  const atRiskCount    = (summary.atRisk ?? 0) + (summary.cold ?? 0);
  const filtered       = filter === 'all' ? skills : skills.filter((s: any) => s.label === filter);

  return (
    <SidebarLayout navItems={navItems} pageTitle="Skill Decay">
      <div style={{ color: '#E2E8F0' }}>

        {/* Hero */}
        <div className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0A1628 0%,#0D1F3C 50%,#0A1628 100%)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 320, height: 320, background: 'radial-gradient(circle,rgba(248,113,113,0.15) 0%,transparent 65%)', borderRadius: '50%' }} />
          <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'rgba(248,113,113,0.8)' }}>
                Live Skill Monitor
              </div>
              <h1 className="font-jakarta font-bold text-[1.8rem] text-white leading-tight mb-2">Skill Decay</h1>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Most platforms show what you know. This shows what you're forgetting — before it costs you a job.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {loading ? <Sk h="h-10" w="w-16" /> : (
                <>
                  <div className="font-jakarta font-bold text-[2.4rem] leading-none" style={{ color: atRiskCount > 0 ? '#F87171' : '#00E5A0' }}>
                    {atRiskCount}
                  </div>
                  <div className="font-semibold text-[11px] uppercase tracking-widest" style={{ color: atRiskCount > 0 ? 'rgba(248,113,113,0.6)' : 'rgba(0,229,160,0.6)' }}>
                    Skills at risk
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Alert banners */}
        {!loading && alerts.length > 0 && (
          <div className="space-y-2 mb-5">
            {alerts.map((a: any) => (
              <div key={a.skill} className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <i className="fas fa-triangle-exclamation mt-0.5" style={{ color: '#F87171' }} />
                <p className="flex-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{a.message}</p>
                <button onClick={() => refreshSkill(a.skill)} disabled={refreshing === a.skill}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 whitespace-nowrap"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                  {refreshing === a.skill ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        {!loading && (
          <div className="grid grid-cols-5 gap-2 mb-5">
            {(['fresh', 'good', 'fading', 'at-risk', 'cold'] as DecayLabel[]).map(label => {
              const cfg   = DECAY[label];
              const count = label === 'fresh' ? summary.fresh : label === 'good' ? summary.good :
                            label === 'fading' ? summary.fading : label === 'at-risk' ? summary.atRisk : summary.cold;
              const active = filter === label;
              return (
                <button key={label} onClick={() => setFilter(active ? 'all' : label)}
                  className="rounded-xl p-3 text-center transition-all hover:-translate-y-0.5"
                  style={{
                    background: active ? `${cfg.bar}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? cfg.bar + '50' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <div className="font-jakarta font-bold text-[20px]" style={{ color: cfg.bar }}>{count ?? 0}</div>
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: active ? cfg.bar : 'rgba(255,255,255,0.3)' }}>{cfg.label}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Skills list */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <span className="font-jakarta font-semibold text-[14px] text-white/90">
              {filter === 'all' ? 'All Skills' : `${DECAY[filter as DecayLabel]?.label} Skills`}
            </span>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-[12px] font-semibold transition-all hover:opacity-70"
                style={{ color: '#4F8EF7' }}>
                Show all
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">{[0,1,2,3,4].map(i => <Sk key={i} h="h-10" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No skills in this category. Add skills to your profile to track them.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((s: any) => {
                const cfg = DECAY[s.label as DecayLabel] ?? DECAY.cold;
                return (
                  <div key={s.skill} className="flex items-center gap-3 py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-28 flex-shrink-0">
                      <div className="font-medium text-[13px] text-white/80 truncate">{s.skill}</div>
                      <div className="text-[11px] capitalize mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.level}</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${s.freshness}%`, background: cfg.bar }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {s.daysSinceUse}d since last use
                        </span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {s.demandCount} active jobs
                        </span>
                      </div>
                    </div>
                    <div className="w-16 text-right flex-shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
                        style={{ background: `${cfg.bar}18`, color: cfg.bar }}>
                        {cfg.label}
                      </span>
                    </div>
                    {(s.isAlert || s.isCritical) && (
                      <button onClick={() => refreshSkill(s.skill)} disabled={refreshing === s.skill}
                        title="Mark as recently used"
                        className="text-[11px] px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {refreshing === s.skill ? '…' : 'Refresh'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>
    </SidebarLayout>
  );
}