'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',                 icon: 'fa-home',                 label: 'Dashboard' },
  { href: '/dashboard/courses',         icon: 'fa-book-open',            label: 'Courses' },
  { href: '/dashboard/career-oracle',   icon: 'fa-brain',                label: 'Career Oracle' },
  { href: '/dashboard/skill-coach',     icon: 'fa-heart-pulse',          label: 'Skill Coach' },
  { href: '/dashboard/peer-genome',     icon: 'fa-users',                label: 'Peer Genome' },
  { href: '/dashboard/skill-decay',     icon: 'fa-chart-line',           label: 'Skill Decay' },
  { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles',  label: 'Ghost Recruiter' },
  { href: '/dashboard/jobs',            icon: 'fa-briefcase',            label: 'Jobs' },
  { href: '/dashboard/certificates',    icon: 'fa-certificate',          label: 'Certificates' },
  { href: '/dashboard/rewards',         icon: 'fa-coins',                label: 'Rewards' },
  { href: '/dashboard/settings',        icon: 'fa-gear',                 label: 'Settings' },
];

type DecayLabel = 'fresh' | 'good' | 'fading' | 'at-risk' | 'cold';

const LABEL_CONFIG: Record<DecayLabel, { bar: string; text: string; bg: string; label: string }> = {
  fresh:   { bar: '#10b981', text: '#15803d', bg: '#f0fdf4', label: 'Fresh'   },
  good:    { bar: '#3b82f6', text: '#1d4ed8', bg: '#eff6ff', label: 'Good'    },
  fading:  { bar: '#f59e0b', text: '#92400e', bg: '#fffbeb', label: 'Fading'  },
  'at-risk': { bar: '#ef4444', text: '#b91c1c', bg: '#fef2f2', label: 'At risk' },
  cold:    { bar: '#9ca3af', text: '#4b5563', bg: '#f5f5fb', label: 'Cold'    },
};

function Skeleton({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded bg-[#f0f0f8] animate-pulse`} />;
}

type FilterType = 'all' | DecayLabel;

export default function SkillDecayPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/skill-decay')
      .then(r => { if (r.success) setData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function refreshSkill(skillName: string) {
    setRefreshing(skillName);
    const r = await apiFetch(`/skill-decay/refresh/${encodeURIComponent(skillName)}`, {
      method: 'POST',
    }).catch(() => null);
    if (r?.success) {
      // Optimistically update freshness to 100
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

  const filtered = filter === 'all' ? skills : skills.filter(s => s.label === filter);

  return (
    <SidebarLayout navItems={navItems} pageTitle="Skill Decay">

      {/* Header */}
      <div className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-4 flex-wrap relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
        <div className="absolute rounded-full pointer-events-none"
          style={{ top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.08)' }} />
        <div className="relative z-[1]">
          <h2 className="font-syne font-bold text-[20px] text-white mb-1">
            <i className="fas fa-chart-line mr-2" /> Skill Decay Monitor
          </h2>
          <p className="text-white/80 text-sm">
            Most platforms show what you know. This shows what you're forgetting — before it costs you a job.
          </p>
        </div>
        <div className="relative z-[1] px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.18)' }}>
          <div className="text-[11px] text-white/70 mb-0.5">Skills at risk</div>
          {loading ? (
            <Skeleton h="h-6" w="w-12" />
          ) : (
            <div className="font-syne font-extrabold text-white text-[22px]">
              {(summary.atRisk ?? 0) + (summary.cold ?? 0)}
            </div>
          )}
        </div>
      </div>

      {/* Alert banner */}
      {!loading && alerts.length > 0 && (
        <div className="space-y-2 mb-5">
          {alerts.map((a: any) => (
            <div key={a.skill}
              className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-[#fef2f2] border border-[#fecaca]">
              <i className="fas fa-triangle-exclamation text-[#ef4444] mt-0.5" />
              <p className="text-[13px] text-[#b91c1c] flex-1">{a.message}</p>
              <button onClick={() => refreshSkill(a.skill)}
                disabled={refreshing === a.skill}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626] transition-all disabled:opacity-50 whitespace-nowrap">
                {refreshing === a.skill ? 'Refreshing…' : 'Refresh skill'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {!loading && (
        <div className="grid grid-cols-5 gap-2 mb-5">
          {(['fresh', 'good', 'fading', 'at-risk', 'cold'] as DecayLabel[]).map(label => {
            const cfg = LABEL_CONFIG[label];
            const count = label === 'fresh' ? summary.fresh :
                          label === 'good'  ? summary.good  :
                          label === 'fading'? summary.fading :
                          label === 'at-risk'? summary.atRisk : summary.cold;
            return (
              <button key={label} onClick={() => setFilter(filter === label ? 'all' : label)}
                className={`rounded-xl p-3 text-center border transition-all ${
                  filter === label ? 'border-2' : 'border-[#e8e8f0]'
                }`}
                style={{
                  background: cfg.bg,
                  borderColor: filter === label ? cfg.bar : undefined,
                }}>
                <div className="font-syne font-bold text-[20px]" style={{ color: cfg.text }}>{count ?? 0}</div>
                <div className="text-[11px] mt-0.5" style={{ color: cfg.text }}>{cfg.label}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Skills list */}
      <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-syne font-bold text-[15px]">
            {filter === 'all' ? 'All skills' : `${LABEL_CONFIG[filter as DecayLabel].label} skills`}
          </h3>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')}
              className="text-[12px] text-[#5b4cf5] hover:underline">
              Show all
            </button>
          )}
        </div>
        {loading ? (
          <div className="space-y-3">
            {[0,1,2,3,4].map(i => <Skeleton key={i} h="h-10" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-[#6b7280] text-[13px]">
            No skills in this category. Add skills to your profile to track them.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s: any) => {
              const cfg = LABEL_CONFIG[s.label as DecayLabel] ?? LABEL_CONFIG.cold;
              return (
                <div key={s.skill} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0">
                    <div className="font-medium text-[13px] text-[#374151] truncate">{s.skill}</div>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5 capitalize">{s.level}</div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-[#f0f0f8] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.freshness}%`, background: cfg.bar }} />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[10px] text-[#9ca3af]">
                        {s.daysSinceUse}d since last use
                      </span>
                      <span className="text-[10px] text-[#9ca3af]">
                        {s.demandCount} active jobs
                      </span>
                    </div>
                  </div>
                  <div className="w-16 text-right flex-shrink-0">
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
                      style={{ background: cfg.bg, color: cfg.text }}>
                      {cfg.label}
                    </span>
                  </div>
                  {(s.isAlert || s.isCritical) && (
                    <button
                      onClick={() => refreshSkill(s.skill)}
                      disabled={refreshing === s.skill}
                      title="Mark as recently used"
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-[#e8e8f0] text-[#5b4cf5] hover:bg-[#f4f2ff] transition-all disabled:opacity-50 flex-shrink-0">
                      {refreshing === s.skill ? '…' : 'Refresh'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </SidebarLayout>
  );
}
