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

function Skeleton({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded bg-[#f0f0f8] animate-pulse`} />;
}

function formatNGN(amount: number) {
  return '₦' + new Intl.NumberFormat('en-NG').format(amount);
}

interface Snapshot {
  months: number;
  coins: number;
  role: string;
  level: number;
  salary: number;
}

interface WhatIfResult {
  before: Snapshot & { salary: number };
  after: Snapshot & { salary: number };
  levelChange: number;
  salaryUplift: number;
  hypotheticalSkills: string[];
}

export default function CareerOraclePage() {
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [whatIfSkills, setWhatIfSkills] = useState('');
  const [whatIf, setWhatIf]         = useState<WhatIfResult | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfErr, setWhatIfErr]   = useState('');

  useEffect(() => {
    apiFetch('/career-oracle')
      .then(r => { if (r.success) setData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function runWhatIf() {
    const skills = whatIfSkills.trim();
    if (!skills) { setWhatIfErr('Enter at least one skill.'); return; }
    setWhatIfErr('');
    setWhatIf(null);
    setWhatIfLoading(true);
    const r = await apiFetch(
      `/career-oracle/what-if?skills=${encodeURIComponent(skills)}`
    ).catch(() => null);
    if (r?.success) setWhatIf(r.data);
    else setWhatIfErr(r?.message || 'Simulation failed. Try again.');
    setWhatIfLoading(false);
  }

  const current: Snapshot          = data?.current;
  const trajectory: Snapshot[]     = data?.trajectory ?? [];
  const blockingSkills: string[]   = data?.blockingSkills ?? [];
  const salaryUplift: number       = data?.salaryUplift ?? 0;
  const jobMatchScore: number      = data?.jobMatchScore ?? 0;
  const velocityPerMonth: number   = data?.velocityPerMonth ?? 0;
  const ladder: any[]              = data?.ladder ?? [];

  const allSnapshots: Snapshot[] = current ? [current, ...trajectory] : [];

  return (
    <SidebarLayout navItems={navItems} pageTitle="Career Oracle">

      {/* Header */}
      <div
        className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-4 flex-wrap relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#5b4cf5,#7c3aed)' }}
      >
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.08)' }}
        />
        <div className="relative z-[1]">
          <h2 className="font-syne font-bold text-[20px] text-white mb-1">
            <i className="fas fa-brain mr-2" /> Career Oracle
          </h2>
          <p className="text-white/80 text-sm">
            See where your current pace takes you in 6, 12, and 24 months — before you make a career decision.
          </p>
        </div>
        {!loading && current && (
          <div
            className="relative z-[1] px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <div className="text-[11px] text-white/70 mb-0.5">Job match score</div>
            <div className="font-syne font-extrabold text-white text-[22px]">{jobMatchScore}%</div>
          </div>
        )}
      </div>

      {/* Trajectory timeline */}
      <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5 mb-5">
        <h3 className="font-syne font-bold text-[15px] mb-1">Trajectory simulation</h3>
        <p className="text-[12px] text-[#6b7280] mb-5">
          Based on your current learning velocity of{' '}
          <strong className="text-[#5b4cf5]">
            {loading ? '…' : `${velocityPerMonth} Merit Coins / month`}
          </strong>.
        </p>

        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} h="h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {allSnapshots.map((snap, i) => (
              <div
                key={snap.months}
                className={`rounded-xl p-4 border ${
                  i === 0
                    ? 'border-[#5b4cf5] bg-[#f4f2ff]'
                    : 'border-[#e8e8f0] bg-[#fafafa]'
                }`}
              >
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${
                    i === 0 ? 'text-[#5b4cf5]' : 'text-[#9ca3af]'
                  }`}
                >
                  {i === 0 ? 'Now' : `${snap.months} months`}
                </div>
                <div className="font-syne font-bold text-[14px] text-[#1a1a2e] leading-tight mb-1">
                  {snap.role}
                </div>
                <div className="text-[12px] text-[#6b7280] mb-3">
                  Level {snap.level}
                </div>
                <div className={`font-bold text-[13px] ${i === 0 ? 'text-[#5b4cf5]' : 'text-[#374151]'}`}>
                  {formatNGN(snap.salary)}
                  <span className="font-normal text-[10px] text-[#9ca3af]"> /yr</span>
                </div>
                <div className="text-[11px] text-[#9ca3af] mt-1">
                  {snap.coins.toLocaleString()} coins
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary uplift & blocking skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

        {/* Salary uplift */}
        <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5">
          <h3 className="font-syne font-bold text-[15px] mb-1">
            <i className="fas fa-arrow-trend-up text-[#10b981] mr-2" />
            24-month salary uplift
          </h3>
          {loading ? (
            <Skeleton h="h-10" w="w-32" />
          ) : (
            <>
              <div className="font-syne font-extrabold text-[28px] text-[#10b981] mt-2">
                {salaryUplift > 0 ? `+${formatNGN(salaryUplift)}` : formatNGN(0)}
              </div>
              <p className="text-[12px] text-[#6b7280] mt-1">
                If you maintain your current learning pace for 24 months.
              </p>
            </>
          )}
        </div>

        {/* Blocking skills */}
        <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5">
          <h3 className="font-syne font-bold text-[15px] mb-1">
            <i className="fas fa-lock text-[#ef4444] mr-2" />
            Skills blocking your next level
          </h3>
          {loading ? (
            <div className="space-y-2 mt-2">
              <Skeleton h="h-6" w="w-24" />
              <Skeleton h="h-6" w="w-32" />
            </div>
          ) : blockingSkills.length === 0 ? (
            <p className="text-[13px] text-[#10b981] mt-2">
              <i className="fas fa-circle-check mr-1" />
              No blocking skills — you're on track for the next level.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-3">
              {blockingSkills.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]"
                >
                  <i className="fas fa-circle-xmark mr-1 text-[10px]" />
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Role ladder */}
      {!loading && ladder.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5 mb-5">
          <h3 className="font-syne font-bold text-[15px] mb-4">
            <i className="fas fa-stairs text-[#5b4cf5] mr-2" />
            Full career ladder
          </h3>
          <div className="space-y-2">
            {ladder.map((rung: any) => {
              const isCurrentOrPast = current && rung.level <= current.level;
              return (
                <div
                  key={rung.level}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isCurrentOrPast
                      ? 'border-[#5b4cf5] bg-[#f4f2ff]'
                      : 'border-[#e8e8f0] bg-[#fafafa]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                      isCurrentOrPast ? 'bg-[#5b4cf5] text-white' : 'bg-[#e8e8f0] text-[#9ca3af]'
                    }`}
                  >
                    {rung.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-[13px] ${isCurrentOrPast ? 'text-[#5b4cf5]' : 'text-[#374151]'}`}>
                      {rung.label}
                      {current && rung.level === current.level && (
                        <span className="ml-2 text-[10px] bg-[#5b4cf5] text-white px-1.5 py-0.5 rounded font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#9ca3af]">
                      {rung.minCoins.toLocaleString()} coins required
                    </div>
                  </div>
                  <div className={`text-right flex-shrink-0 ${isCurrentOrPast ? 'text-[#5b4cf5]' : 'text-[#9ca3af]'}`}>
                    <div className="font-bold text-[13px]">{formatNGN(rung.salary)}</div>
                    <div className="text-[10px]">/yr est.</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* What-If simulator */}
      <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5">
        <h3 className="font-syne font-bold text-[15px] mb-1">
          <i className="fas fa-flask text-[#5b4cf5] mr-2" />
          What-if simulator
        </h3>
        <p className="text-[12px] text-[#6b7280] mb-4">
          Hypothetically add skills and see how your trajectory changes before committing to a learning path.
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. docker, kubernetes, react"
            value={whatIfSkills}
            onChange={e => setWhatIfSkills(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runWhatIf()}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#e8e8f0] text-[13px] outline-none focus:border-[#5b4cf5]"
          />
          <button
            onClick={runWhatIf}
            disabled={whatIfLoading}
            className="px-5 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-[13px] font-semibold hover:bg-[#4a3de0] transition-all disabled:opacity-50"
          >
            {whatIfLoading ? 'Simulating…' : 'Simulate'}
          </button>
        </div>

        {whatIfErr && (
          <p className="mt-2 text-[12px] text-[#ef4444]">
            <i className="fas fa-circle-xmark mr-1" />{whatIfErr}
          </p>
        )}

        {whatIf && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Before */}
            <div className="p-4 rounded-xl bg-[#fef2f2] border border-[#fecaca]">
              <div className="text-[11px] text-[#b91c1c] font-semibold uppercase tracking-wide mb-2">
                Without these skills
              </div>
              <div className="font-syne font-bold text-[14px] text-[#1a1a2e]">{whatIf.before.role}</div>
              <div className="text-[12px] text-[#6b7280] mt-0.5">Level {whatIf.before.level}</div>
              <div className="font-bold text-[13px] text-[#b91c1c] mt-2">
                {formatNGN(whatIf.before.salary)}<span className="font-normal text-[10px] text-[#9ca3af]"> /yr</span>
              </div>
            </div>

            {/* After */}
            <div className="p-4 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0]">
              <div className="text-[11px] text-[#15803d] font-semibold uppercase tracking-wide mb-2">
                With {whatIf.hypotheticalSkills.slice(0, 2).join(', ')}{whatIf.hypotheticalSkills.length > 2 ? ' +more' : ''}
              </div>
              <div className="font-syne font-bold text-[14px] text-[#1a1a2e]">{whatIf.after.role}</div>
              <div className="text-[12px] text-[#6b7280] mt-0.5">Level {whatIf.after.level}</div>
              <div className="font-bold text-[13px] text-[#15803d] mt-2">
                {formatNGN(whatIf.after.salary)}<span className="font-normal text-[10px] text-[#9ca3af]"> /yr</span>
              </div>
              {whatIf.salaryUplift > 0 && (
                <div className="mt-2 text-[11px] text-[#15803d] font-semibold">
                  +{formatNGN(whatIf.salaryUplift)} potential uplift
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </SidebarLayout>
  );
}