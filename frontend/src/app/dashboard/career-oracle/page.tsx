'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

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

function formatNGN(n: number) {
  return '₦' + new Intl.NumberFormat('en-NG').format(n);
}

interface Snapshot { months: number; coins: number; role: string; level: number; salary: number; }
interface WhatIfResult {
  before: Snapshot & { salary: number };
  after:  Snapshot & { salary: number };
  levelChange: number; salaryUplift: number; hypotheticalSkills: string[];
}

const LEVEL_ACCENT = ['#4F8EF7', '#00E5A0', '#F59E0B', '#A78BFA', '#F472B6', '#38BDF8'];

export default function CareerOraclePage() {
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [whatIfSkills, setWhatIfSkills] = useState('');
  const [whatIf, setWhatIf]       = useState<WhatIfResult | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfErr, setWhatIfErr] = useState('');

  useEffect(() => {
    apiFetch('/career-oracle')
      .then(r => { if (r.success) setData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function runWhatIf() {
    const s = whatIfSkills.trim();
    if (!s) { setWhatIfErr('Enter at least one skill.'); return; }
    setWhatIfErr(''); setWhatIf(null); setWhatIfLoading(true);
    const r = await apiFetch(`/career-oracle/what-if?skills=${encodeURIComponent(s)}`).catch(() => null);
    if (r?.success) setWhatIf(r.data);
    else setWhatIfErr(r?.message || 'Simulation failed.');
    setWhatIfLoading(false);
  }

  const current: Snapshot        = data?.current;
  const trajectory: Snapshot[]   = data?.trajectory ?? [];
  const blockingSkills: string[] = data?.blockingSkills ?? [];
  const salaryUplift: number     = data?.salaryUplift ?? 0;
  const jobMatchScore: number    = data?.jobMatchScore ?? 0;
  const velocityPerMonth: number = data?.velocityPerMonth ?? 0;
  const ladder: any[]            = data?.ladder ?? [];
  const allSnaps: Snapshot[]     = current ? [current, ...trajectory] : [];

  return (
    <SidebarLayout navItems={navItems} pageTitle="Career Oracle">
      <div style={{ color: '#E2E8F0' }}>

        {/* Hero */}
        <div className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0A1628 0%,#0D1F3C 50%,#0A1628 100%)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 320, height: 320, background: 'radial-gradient(circle,rgba(167,139,250,0.18) 0%,transparent 65%)', borderRadius: '50%' }} />
          <div className="absolute pointer-events-none" style={{ bottom: -60, right: 80, width: 220, height: 220, background: 'radial-gradient(circle,rgba(79,142,247,0.12) 0%,transparent 65%)', borderRadius: '50%' }} />
          <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'rgba(167,139,250,0.8)' }}>
                Predictive Intelligence
              </div>
              <h1 className="font-jakarta font-bold text-[1.8rem] text-white leading-tight mb-2">Career Oracle</h1>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                See where your current pace takes you in 6, 12, and 24 months — before you make a career decision.
              </p>
            </div>
            {!loading && current && (
              <div className="flex flex-col items-end gap-1">
                <div className="font-jakarta font-bold text-[2.2rem] leading-none" style={{ color: '#A78BFA' }}>
                  {jobMatchScore}%
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(167,139,250,0.6)' }}>
                  Job match
                </div>
                <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {velocityPerMonth} coins / month
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trajectory cards */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-5">
            <span className="font-jakarta font-semibold text-[14px] text-white/90">Trajectory Simulation</span>
            <span className="text-[11px] px-3 py-1 rounded-lg" style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.2)' }}>
              At current pace
            </span>
          </div>
          {loading ? (
            <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
              {[0,1,2,3].map(i => <Sk key={i} h="h-32" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
              {allSnaps.map((snap, i) => {
                const accent = LEVEL_ACCENT[snap.level] ?? '#4F8EF7';
                return (
                  <div key={snap.months} className="rounded-xl p-4 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-200"
                    style={{ background: i === 0 ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
                      style={{ background: `radial-gradient(circle at 20% 20%,${accent}10 0%,transparent 60%)` }} />
                    <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: i === 0 ? '#A78BFA' : 'rgba(255,255,255,0.3)' }}>
                      {i === 0 ? 'Now' : `${snap.months}m`}
                    </div>
                    <div className="font-jakarta font-bold text-[13px] text-white/90 leading-tight mb-1">{snap.role}</div>
                    <div className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Level {snap.level}</div>
                    <div className="font-jakarta font-bold text-[13px]" style={{ color: accent }}>
                      {formatNGN(snap.salary)}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>/yr · {snap.coins.toLocaleString()} coins</div>
                    <div className="h-[2px] w-6 rounded-full mt-3" style={{ background: accent }} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Uplift + blocking skills */}
        <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
          <Card>
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>24-month salary uplift</div>
            {loading ? <Sk h="h-10" w="w-36" /> : (
              <>
                <div className="font-jakarta font-bold text-[2rem] leading-none" style={{ color: '#00E5A0' }}>
                  {salaryUplift > 0 ? `+${formatNGN(salaryUplift)}` : '₦0'}
                </div>
                <div className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  If you maintain your current learning pace.
                </div>
                <div className="h-[2px] w-8 rounded-full mt-4" style={{ background: '#00E5A0' }} />
              </>
            )}
          </Card>

          <Card>
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Blocking skills — next level</div>
            {loading ? (
              <div className="space-y-2"><Sk h="h-6" w="w-24" /><Sk h="h-6" w="w-32" /></div>
            ) : blockingSkills.length === 0 ? (
              <div className="flex items-center gap-2">
                <i className="fas fa-circle-check" style={{ color: '#00E5A0' }} />
                <span className="text-[13px] text-white/70">No blockers — you're on track.</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {blockingSkills.map(skill => (
                  <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <i className="fas fa-lock text-[9px]" />{skill}
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Career ladder */}
        {!loading && ladder.length > 0 && (
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-5">
              <span className="font-jakarta font-semibold text-[14px] text-white/90">Full Career Ladder</span>
            </div>
            <div className="space-y-2">
              {ladder.map((rung: any) => {
                const isPast    = current && rung.level < current.level;
                const isCurrent = current && rung.level === current.level;
                const accent    = LEVEL_ACCENT[rung.level] ?? '#4F8EF7';
                return (
                  <div key={rung.level} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{ background: isCurrent ? `${accent}14` : 'rgba(255,255,255,0.03)', border: `1px solid ${isCurrent ? `${accent}40` : 'rgba(255,255,255,0.06)'}` }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                      style={{ background: isCurrent || isPast ? accent : 'rgba(255,255,255,0.08)', color: isCurrent || isPast ? '#0F1521' : 'rgba(255,255,255,0.3)' }}>
                      {isCurrent ? <i className="fas fa-location-dot text-[11px]" /> : isPast ? <i className="fas fa-check text-[10px]" /> : rung.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[13px] flex items-center gap-2" style={{ color: isCurrent ? accent : 'rgba(255,255,255,0.7)' }}>
                        {rung.label}
                        {isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: accent, color: '#0F1521' }}>YOU</span>
                        )}
                      </div>
                      <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{rung.minCoins.toLocaleString()} coins required</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-jakarta font-bold text-[13px]" style={{ color: isCurrent ? accent : 'rgba(255,255,255,0.4)' }}>{formatNGN(rung.salary)}</div>
                      <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>/yr</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* What-if simulator */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="font-jakarta font-semibold text-[14px] text-white/90">
              <i className="fas fa-flask mr-2" style={{ color: '#4F8EF7' }} />What-If Simulator
            </span>
          </div>
          <p className="text-[12px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Add skills hypothetically and see how your trajectory changes before committing to a path.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              id="eg-docker-kubernetes-react"
              name="eg_docker_kubernetes_react"
              placeholder="e.g. docker, kubernetes, react"
              value={whatIfSkills}
              onChange={e => setWhatIfSkills(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runWhatIf()}
              className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <button
              onClick={runWhatIf}
              disabled={whatIfLoading}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40"
              style={{ background: 'rgba(79,142,247,0.15)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.25)' }}
            >
              {whatIfLoading ? 'Simulating…' : 'Simulate'}
            </button>
          </div>
          {whatIfErr && (
            <p className="mt-2 text-[12px]" style={{ color: '#F87171' }}>
              <i className="fas fa-circle-xmark mr-1" />{whatIfErr}
            </p>
          )}
          {whatIf && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(248,113,113,0.7)' }}>Without these skills</div>
                <div className="font-jakarta font-bold text-[14px] text-white/85">{whatIf.before.role}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Level {whatIf.before.level}</div>
                <div className="font-bold text-[13px] mt-2" style={{ color: '#F87171' }}>{formatNGN(whatIf.before.salary)}<span className="font-normal text-[10px] ml-1" style={{ color: 'rgba(255,255,255,0.25)' }}>/yr</span></div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(0,229,160,0.7)' }}>
                  With {whatIf.hypotheticalSkills.slice(0,2).join(', ')}{whatIf.hypotheticalSkills.length > 2 ? ' +more' : ''}
                </div>
                <div className="font-jakarta font-bold text-[14px] text-white/85">{whatIf.after.role}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Level {whatIf.after.level}</div>
                <div className="font-bold text-[13px] mt-2" style={{ color: '#00E5A0' }}>{formatNGN(whatIf.after.salary)}<span className="font-normal text-[10px] ml-1" style={{ color: 'rgba(255,255,255,0.25)' }}>/yr</span></div>
                {whatIf.salaryUplift > 0 && (
                  <div className="mt-1.5 text-[11px] font-semibold" style={{ color: '#00E5A0' }}>+{formatNGN(whatIf.salaryUplift)} uplift</div>
                )}
              </div>
            </div>
          )}
        </Card>

      </div>
    </SidebarLayout>
  );
}