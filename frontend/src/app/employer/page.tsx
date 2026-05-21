'use client';

import { useState } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

const navItems = [
  { href: '/employer', icon: 'fa-tachometer-alt', label: 'Dashboard' },
  { href: '/employer/jobs', icon: 'fa-briefcase', label: 'Job Management' },
  { href: '/employer/applicants', icon: 'fa-users', label: 'Applicants', badge: 5 },
  { href: '/employer/talent', icon: 'fa-search', label: 'Talent Search' },
  { href: '/employer/analytics', icon: 'fa-chart-bar', label: 'Analytics' },
  { href: '/employer/company', icon: 'fa-building', label: 'Company' },
  { href: '/employer/settings', icon: 'fa-gear', label: 'Settings' },
];

function StatCard({ icon, iconBg, iconColor, value, label, delta, deltaUp }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-3.5 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-all">
      <div className="w-11 h-11 rounded-xl grid place-items-center text-[17px] flex-shrink-0" style={{ background: iconBg, color: iconColor }}>
        <i className={`fas ${icon}`} />
      </div>
      <div>
        <div className="font-syne font-bold text-[22px] tracking-tight">{value}</div>
        <div className="text-xs text-[#6b6b8a] mt-0.5">{label}</div>
        {delta && <div className={`text-[11px] mt-0.5 ${deltaUp ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{delta}</div>}
      </div>
    </div>
  );
}

const MERIT_TIERS: Record<string, { label: string; icon: string; color: string; bg: string; minCoins: number }> = {
  platinum: { label: 'Platinum', icon: '💎', color: '#7c3aed', bg: '#f4f2ff', minCoins: 5000 },
  gold:     { label: 'Gold',     icon: '🥇', color: '#d97706', bg: '#fffbeb', minCoins: 2000 },
  silver:   { label: 'Silver',   icon: '🥈', color: '#6b7280', bg: '#f5f5fb', minCoins: 500  },
  bronze:   { label: 'Bronze',   icon: '🥉', color: '#92400e', bg: '#fef3c7', minCoins: 0    },
};

function getTier(coins: number) {
  if (coins >= 5000) return 'platinum';
  if (coins >= 2000) return 'gold';
  if (coins >= 500)  return 'silver';
  return 'bronze';
}

// Extended applicant list with merit coins
const APPLICANTS = [
  { name: 'Amara Okafor',  role: 'Senior React Developer',  score: 94, status: 'shortlisted', avatar: 'AO', bg: '#5b4cf5', coins: 6200, certificates: 8, projects: 5, platforms: ['Udemy','Coursera'] },
  { name: 'Kemi Adeyemi',  role: 'Data Analyst',            score: 88, status: 'reviewing',   avatar: 'KA', bg: '#10b981', coins: 3100, certificates: 5, projects: 3, platforms: ['edX'] },
  { name: 'Chidi Nwosu',   role: 'Senior React Developer',  score: 82, status: 'reviewing',   avatar: 'CN', bg: '#f59e0b', coins: 1800, certificates: 4, projects: 2, platforms: ['Udemy'] },
  { name: 'Fatima Hassan', role: 'DevOps Engineer',         score: 79, status: 'applied',     avatar: 'FH', bg: '#ef4444', coins: 720,  certificates: 3, projects: 1, platforms: [] },
  { name: 'Taiwo Obi',     role: 'Data Analyst',            score: 76, status: 'applied',     avatar: 'TO', bg: '#8b5cf6', coins: 290,  certificates: 2, projects: 0, platforms: [] },
  { name: 'Ngozi Eze',     role: 'UI/UX Designer',          score: 91, status: 'shortlisted', avatar: 'NE', bg: '#ec4899', coins: 5400, certificates: 7, projects: 6, platforms: ['Coursera','LinkedIn'] },
];

// Job posts with merit tier requirements
const JOBS = [
  { title: 'Senior React Developer',    type: 'Full-time', location: 'Remote',    applicants: 24, match: 91, status: 'active',  posted: '3 days ago',  minTier: 'gold',     salaryRange: '$4,000–$6,000/mo' },
  { title: 'Data Analyst',              type: 'Full-time', location: 'Lagos',     applicants: 17, match: 87, status: 'active',  posted: '1 week ago',  minTier: 'silver',   salaryRange: '₦600k–₦900k/mo'  },
  { title: 'DevOps Engineer',           type: 'Contract',  location: 'Hybrid',    applicants: 8,  match: 79, status: 'active',  posted: '2 weeks ago', minTier: 'gold',     salaryRange: '$3,500–$5,000/mo' },
  { title: 'UI/UX Designer',            type: 'Part-time', location: 'Remote',    applicants: 31, match: 95, status: 'closed',  posted: '1 month ago', minTier: 'bronze',   salaryRange: '₦400k–₦600k/mo'  },
  { title: 'VP of Engineering',         type: 'Full-time', location: 'Abuja',     applicants: 5,  match: 88, status: 'active',  posted: '5 days ago',  minTier: 'platinum', salaryRange: '$10,000+/mo'      },
  { title: 'Machine Learning Engineer', type: 'Full-time', location: 'Remote',    applicants: 12, match: 83, status: 'active',  posted: '4 days ago',  minTier: 'platinum', salaryRange: '$6,000–$9,000/mo' },
];

const STATUS_COLORS: Record<string, [string, string]> = {
  shortlisted: ['#f0fdf4', '#15803d'],
  reviewing:   ['#fffbeb', '#92400e'],
  applied:     ['#eff6ff', '#1d4ed8'],
  active:      ['#f0fdf4', '#15803d'],
  closed:      ['#f5f5fb', '#6b6b8a'],
};

function MeritBadge({ coins }: { coins: number }) {
  const tier = MERIT_TIERS[getTier(coins)];
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: tier.bg, color: tier.color }}>
      {tier.icon} {tier.label} · {coins.toLocaleString()}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const t = MERIT_TIERS[tier];
  if (!t) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: t.bg, color: t.color }}>
      {t.icon} {t.label}+
    </span>
  );
}

export default function EmployerDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applicants' | 'talent'>('overview');
  const [coinFilter, setCoinFilter] = useState<'all' | 'platinum' | 'gold' | 'silver' | 'bronze'>('all');
  const [jobTierFilter, setJobTierFilter] = useState<'all' | 'platinum' | 'gold' | 'silver' | 'bronze'>('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const filteredApplicants = APPLICANTS.filter(a => {
    if (coinFilter === 'all') return true;
    return getTier(a.coins) === coinFilter;
  });

  const sortedApplicants = [...filteredApplicants].sort((a, b) => b.coins - a.coins);

  // Platinum/gold applicants surface to top of talent tab
  const topTalent = [...APPLICANTS].sort((a, b) => b.coins - a.coins);
  const featuredTalent = topTalent.filter(a => a.coins >= 2000);

  return (
    <SidebarLayout navItems={navItems} pageTitle="Employer Dashboard">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">Welcome back, Alex 👋</h1>
          <p className="text-[13.5px] text-[#6b6b8a]">Here's what's happening with your hiring pipeline today.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(91,76,245,0.3)] transition-all">
          <i className="fas fa-plus" /> Post a Job
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl w-fit mb-6 border border-[#e8e8f0]">
        {(['overview', 'jobs', 'applicants', 'talent'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer capitalize transition-all border-0 ${activeTab === t ? 'bg-white text-[#0a0a0f] font-semibold shadow-[0_1px_5px_rgba(0,0,0,0.09)]' : 'bg-transparent text-[#6b6b8a]'}`}>
            {t === 'talent' ? '⭐ Top Talent' : t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-4 gap-3.5 mb-5 max-md:grid-cols-2">
            <StatCard icon="fa-briefcase" iconBg="#f4f2ff" iconColor="#5b4cf5" value="8" label="Active Jobs" delta="↑ 2 this month" deltaUp />
            <StatCard icon="fa-users" iconBg="#f0fdf4" iconColor="#22c55e" value="127" label="Total Applicants" delta="↑ 23 this week" deltaUp />
            <StatCard icon="fa-user-check" iconBg="#fffbeb" iconColor="#f59e0b" value="14" label="Shortlisted" delta="5 awaiting review" />
            <StatCard icon="fa-handshake" iconBg="#eff6ff" iconColor="#3b82f6" value="3" label="Hired This Month" delta="↑ 1 vs last month" deltaUp />
          </div>

          {/* Merit Coin Insight Banner */}
          <div className="rounded-2xl p-5 mb-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)' }}>
            <div className="absolute rounded-full pointer-events-none" style={{ top: -30, right: -30, width: 140, height: 140, background: 'rgba(91,76,245,0.15)' }} />
            <div className="relative z-[1]">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-coins text-[#fbbf24]" />
                    <span className="font-syne font-bold text-white text-[15px]">Merit Coin Hiring Intelligence</span>
                  </div>
                  <p className="text-white/60 text-xs mb-4">Candidates are ranked by Merit Coins — a verified score of learning achievement, course completions, and platform activity.</p>
                  <div className="flex gap-3 flex-wrap">
                    {Object.values(MERIT_TIERS).map(t => {
                      const count = APPLICANTS.filter(a => getTier(a.coins) === Object.keys(MERIT_TIERS).find(k => MERIT_TIERS[k] === t)).length;
                      return (
                        <div key={t.label} className="px-3 py-2 rounded-xl" style={{ background: t.bg + '30', border: `1px solid ${t.color}30` }}>
                          <div className="font-syne font-bold text-sm" style={{ color: t.color }}>{t.icon} {count}</div>
                          <div className="text-[10px]" style={{ color: t.color + 'aa' }}>{t.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs text-white/60">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#7c3aed] flex-shrink-0" /><span>💎 Platinum — Top 2% of learners</span></div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#d97706] flex-shrink-0" /><span>🥇 Gold — Senior-ready candidates</span></div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#6b7280] flex-shrink-0" /><span>🥈 Silver — Mid-level candidates</span></div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#92400e] flex-shrink-0" /><span>🥉 Bronze — Entry-level candidates</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
            {/* Hiring pipeline */}
            <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <span className="font-syne font-bold text-[15px] block mb-4">Hiring Pipeline</span>
              {[
                { stage: 'Applied',      count: 127, pct: 100, color: '#e8e8f0', textColor: '#6b6b8a' },
                { stage: 'Reviewing',    count: 48,  pct: 38,  color: '#3b82f6', textColor: '#1d4ed8' },
                { stage: 'Shortlisted',  count: 14,  pct: 11,  color: '#f59e0b', textColor: '#92400e' },
                { stage: 'Interviewing', count: 6,   pct: 5,   color: '#5b4cf5', textColor: '#4c1d95' },
                { stage: 'Hired',        count: 3,   pct: 2,   color: '#22c55e', textColor: '#15803d' },
              ].map(row => (
                <div key={row.stage} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="text-[13px] text-[#6b6b8a] w-24 flex-shrink-0">{row.stage}</span>
                  <div className="flex-1 h-2.5 bg-[#f0f0f8] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.color }} />
                  </div>
                  <span className="text-[13px] font-semibold w-8 text-right" style={{ color: row.textColor }}>{row.count}</span>
                </div>
              ))}
            </div>

            {/* Top Talent Preview */}
            <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-syne font-bold text-[15px]">⭐ Top Talent (by Merit Coins)</span>
                <button onClick={() => setActiveTab('talent')} className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] border border-[#e8e8f0] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#f4f2ff] transition-all">
                  View all
                </button>
              </div>
              {topTalent.slice(0, 4).map(a => {
                const tier = MERIT_TIERS[getTier(a.coins)];
                return (
                  <div key={a.name} className="flex items-center gap-3 py-2.5 border-b border-[#f0f0f8] last:border-0">
                    <div className="w-8 h-8 rounded-full grid place-items-center font-syne font-bold text-xs text-white flex-shrink-0" style={{ background: a.bg }}>{a.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#0a0a0f] truncate">{a.name}</div>
                      <div className="text-[11px] text-[#9898b8] truncate">{a.role}</div>
                    </div>
                    <MeritBadge coins={a.coins} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent applicants */}
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-syne font-bold text-[15px]">Recent Applicants</span>
              <button onClick={() => setActiveTab('applicants')} className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] border border-[#e8e8f0] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#f4f2ff] transition-all">View all</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    {['Candidate','Applied For','Merit Tier','Match Score','Status','Action'].map(h => (
                      <th key={h} className="py-2.5 px-4 text-left text-[11.5px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...APPLICANTS].sort((a, b) => b.coins - a.coins).slice(0, 5).map(a => {
                    const [sbg, sc] = STATUS_COLORS[a.status] || ['#f5f5fb', '#6b6b8a'];
                    return (
                      <tr key={a.name} className="hover:bg-[#fafafd] transition-colors">
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full grid place-items-center font-syne font-bold text-xs text-white flex-shrink-0" style={{ background: a.bg }}>{a.avatar}</div>
                            <span className="font-semibold text-[#0a0a0f]">{a.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[13px]">{a.role}</td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]"><MeritBadge coins={a.coins} /></td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[80px] h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#5b4cf5]" style={{ width: `${a.score}%` }} />
                            </div>
                            <span className="text-[13px] font-semibold text-[#5b4cf5]">{a.score}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: sbg, color: sc }}>{a.status}</span>
                        </td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <div className="flex items-center gap-1.5">
                            <button className="text-[12px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">View</button>
                            <button className="text-[12px] font-semibold text-[#22c55e] bg-[#f0fdf4] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#22c55e] hover:text-white transition-all">Shortlist</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* JOBS TAB */}
      {activeTab === 'jobs' && (
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <span className="font-syne font-bold text-[15px]">All Job Posts</span>
            <div className="flex items-center gap-2">
              <select value={jobTierFilter} onChange={e => setJobTierFilter(e.target.value as any)}
                className="text-sm text-[#6b6b8a] border border-[#e8e8f0] rounded-lg px-3 py-2 bg-white outline-none font-[inherit] cursor-pointer">
                <option value="all">All Tiers</option>
                <option value="bronze">🥉 Bronze+ Required</option>
                <option value="silver">🥈 Silver+ Required</option>
                <option value="gold">🥇 Gold+ Required</option>
                <option value="platinum">💎 Platinum Required</option>
              </select>
              <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#5b4cf5] text-white text-sm font-semibold rounded-xl border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all">
                <i className="fas fa-plus" /> New Job
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {['Job Title','Type','Location','Min. Tier','Applicants','Status','Posted','Actions'].map(h => (
                    <th key={h} className="py-2.5 px-4 text-left text-[11.5px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {JOBS.filter(j => jobTierFilter === 'all' || j.minTier === jobTierFilter).map(job => {
                  const [sbg, sc] = STATUS_COLORS[job.status];
                  return (
                    <tr key={job.title} className="hover:bg-[#fafafd] transition-colors">
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <div className="font-semibold text-[#0a0a0f]">{job.title}</div>
                        <div className="text-[11px] text-[#9898b8] mt-0.5">{job.salaryRange}</div>
                      </td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a]">{job.type}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a]">{job.location}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]"><TierBadge tier={job.minTier} /></td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] font-semibold text-[#5b4cf5]">{job.applicants}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: sbg, color: sc }}>{job.status}</span>
                      </td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[13px]">{job.posted}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <div className="flex items-center gap-1.5">
                          <button className="text-[12px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">Edit</button>
                          <button className="text-[12px] font-semibold text-[#6b6b8a] bg-[#f5f5fb] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#e8e8f0] transition-all">View</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-[#f5f5fb] rounded-xl">
            <p className="text-xs text-[#6b6b8a]">
              <i className="fas fa-info-circle text-[#5b4cf5] mr-1.5" />
              <strong>Merit Tier Requirements</strong>: When posting a job, set a minimum tier. Students meeting or exceeding the requirement will see the job featured prominently in their dashboard. Platinum/Gold jobs are highlighted as premium opportunities.
            </p>
          </div>
        </div>
      )}

      {/* APPLICANTS TAB */}
      {activeTab === 'applicants' && (
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <span className="font-syne font-bold text-[15px]">All Applicants</span>
            <div className="flex gap-2 flex-wrap">
              {/* Merit coin filter */}
              <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl border border-[#e8e8f0]">
                {(['all', 'platinum', 'gold', 'silver', 'bronze'] as const).map(tier => {
                  const t = tier === 'all' ? null : MERIT_TIERS[tier];
                  return (
                    <button key={tier} onClick={() => setCoinFilter(tier)}
                      className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border-0 cursor-pointer capitalize transition-all ${coinFilter === tier ? 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-[#0a0a0f]' : 'bg-transparent text-[#6b6b8a]'}`}>
                      {t ? `${t.icon} ${t.label}` : 'All'}
                    </button>
                  );
                })}
              </div>
              <select className="text-sm text-[#6b6b8a] border border-[#e8e8f0] rounded-lg px-3 py-2 bg-white outline-none font-[inherit] cursor-pointer">
                <option>All Roles</option>
                <option>Senior React Developer</option>
                <option>Data Analyst</option>
                <option>DevOps Engineer</option>
              </select>
            </div>
          </div>

          {coinFilter !== 'all' && (
            <div className="mb-4 p-3.5 rounded-xl flex items-center gap-2.5" style={{ background: MERIT_TIERS[coinFilter]?.bg, border: `1px solid ${MERIT_TIERS[coinFilter]?.color}30` }}>
              <span className="text-lg">{MERIT_TIERS[coinFilter]?.icon}</span>
              <p className="text-sm font-semibold" style={{ color: MERIT_TIERS[coinFilter]?.color }}>
                Showing {coinFilter} tier applicants — {sortedApplicants.length} result{sortedApplicants.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {['Candidate', 'Applied For', 'Merit Tier', 'Courses Done', 'Portfolio', 'Match', 'Status', 'Action'].map(h => (
                    <th key={h} className="py-2.5 px-4 text-left text-[11.5px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedApplicants.map(a => {
                  const [sbg, sc] = STATUS_COLORS[a.status];
                  return (
                    <tr key={a.name} className={`hover:bg-[#fafafd] transition-colors ${a.coins >= 5000 ? 'bg-[#fafaff]' : ''}`}>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full grid place-items-center font-syne font-bold text-xs text-white flex-shrink-0 relative" style={{ background: a.bg }}>
                            {a.avatar}
                            {a.coins >= 5000 && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#7c3aed] border border-white text-[7px] text-white grid place-items-center">💎</div>}
                          </div>
                          <span className="font-semibold text-[#0a0a0f]">{a.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[13px]">{a.role}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]"><MeritBadge coins={a.coins} /></td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <div className="text-[13px] font-semibold text-[#0a0a0f]">{a.certificates}</div>
                        {a.platforms.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {a.platforms.map(p => <span key={p} className="text-[9px] text-[#5b4cf5] font-semibold">{p}</span>)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <span className="text-[13px] font-semibold" style={{ color: a.projects > 0 ? '#22c55e' : '#9898b8' }}>
                          {a.projects} project{a.projects !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#5b4cf5]" style={{ width: `${a.score}%` }} />
                          </div>
                          <span className="text-[13px] font-semibold text-[#5b4cf5]">{a.score}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: sbg, color: sc }}>{a.status}</span>
                      </td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <div className="flex items-center gap-1.5">
                          <button className="text-[12px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">Profile</button>
                          <button className="text-[12px] font-semibold text-[#22c55e] bg-[#f0fdf4] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#22c55e] hover:text-white transition-all">Shortlist</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOP TALENT TAB */}
      {activeTab === 'talent' && (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-syne font-bold text-[15px] mb-0.5">⭐ Top Talent — Sorted by Merit Coins</h2>
              <p className="text-[13px] text-[#6b6b8a]">Platinum & Gold candidates are your highest-achieving applicants. They've completed the most courses and earned the most coins.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-10 h-5 rounded-full transition-colors relative ${showFeaturedOnly ? 'bg-[#5b4cf5]' : 'bg-[#e8e8f0]'}`} onClick={() => setShowFeaturedOnly(v => !v)}>
                <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all ${showFeaturedOnly ? 'right-0.5' : 'left-0.5'}`} />
              </div>
              <span className="text-sm font-semibold text-[#6b6b8a]">Gold+ only</span>
            </label>
          </div>

          {/* Featured Platinum candidates */}
          {!showFeaturedOnly && featuredTalent.some(a => a.coins >= 5000) && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-[#7c3aed] bg-[#f4f2ff] px-2.5 py-1 rounded-full">💎 PLATINUM CANDIDATES</span>
              </div>
              <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                {topTalent.filter(a => a.coins >= 5000).map(a => (
                  <div key={a.name} className="bg-white rounded-2xl p-5 border-2 border-[#7c3aed]/30 shadow-[0_4px_20px_rgba(124,58,237,0.08)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5b4cf5] to-[#7c3aed]" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full grid place-items-center font-syne font-bold text-sm text-white relative" style={{ background: a.bg }}>
                        {a.avatar}
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#7c3aed] border-2 border-white text-[10px] text-white grid place-items-center">💎</div>
                      </div>
                      <div>
                        <div className="font-syne font-bold text-[14px]">{a.name}</div>
                        <div className="text-xs text-[#6b6b8a]">{a.role}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center rounded-xl p-2 bg-[#f4f2ff]">
                        <div className="font-syne font-bold text-[#7c3aed] text-sm">{a.coins.toLocaleString()}</div>
                        <div className="text-[9px] text-[#9898b8]">Coins</div>
                      </div>
                      <div className="text-center rounded-xl p-2 bg-[#f0fdf4]">
                        <div className="font-syne font-bold text-[#22c55e] text-sm">{a.certificates}</div>
                        <div className="text-[9px] text-[#9898b8]">Certs</div>
                      </div>
                      <div className="text-center rounded-xl p-2 bg-[#fffbeb]">
                        <div className="font-syne font-bold text-[#f59e0b] text-sm">{a.projects}</div>
                        <div className="text-[9px] text-[#9898b8]">Projects</div>
                      </div>
                    </div>
                    {a.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {a.platforms.map(p => (
                          <span key={p} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5fb] text-[#5b4cf5]">{p}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 text-xs font-semibold text-white bg-[#5b4cf5] rounded-xl border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all">View Profile</button>
                      <button className="flex-1 py-2 text-xs font-semibold text-white bg-[#22c55e] rounded-xl border-0 cursor-pointer hover:bg-[#16a34a] transition-all">Shortlist</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All talent sorted by coins */}
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
            <div className="text-[12px] font-semibold text-[#6b6b8a] mb-3 uppercase tracking-wide">
              {showFeaturedOnly ? 'Gold+ Candidates' : 'All Candidates'} — Ranked by Merit Coins
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    {['#', 'Candidate', 'Role', 'Merit Tier', 'Certs', 'Projects', 'Platforms', 'Score', 'Action'].map(h => (
                      <th key={h} className="py-2.5 px-4 text-left text-[11.5px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(showFeaturedOnly ? topTalent.filter(a => a.coins >= 2000) : topTalent).map((a, idx) => {
                    const [sbg, sc] = STATUS_COLORS[a.status];
                    return (
                      <tr key={a.name} className={`hover:bg-[#fafafd] transition-colors ${a.coins >= 5000 ? 'bg-gradient-to-r from-[#fafaff] to-white' : ''}`}>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold ${idx === 0 ? 'bg-[#f59e0b] text-white' : idx === 1 ? 'bg-[#9898b8] text-white' : idx === 2 ? 'bg-[#cd7f32] text-white' : 'bg-[#f5f5fb] text-[#6b6b8a]'}`}>{idx + 1}</span>
                        </td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full grid place-items-center font-syne font-bold text-xs text-white flex-shrink-0" style={{ background: a.bg }}>{a.avatar}</div>
                            <span className="font-semibold text-[#0a0a0f]">{a.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[13px]">{a.role}</td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]"><MeritBadge coins={a.coins} /></td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8] font-semibold text-[#0a0a0f]">{a.certificates}</td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8] font-semibold" style={{ color: a.projects > 0 ? '#22c55e' : '#9898b8' }}>{a.projects}</td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          {a.platforms.length > 0
                            ? <span className="text-[11px] text-[#5b4cf5]">{a.platforms.join(', ')}</span>
                            : <span className="text-[11px] text-[#9898b8]">None</span>}
                        </td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <span className="font-semibold text-[#5b4cf5]">{a.score}%</span>
                        </td>
                        <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                          <div className="flex items-center gap-1.5">
                            <button className="text-[12px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">View</button>
                            <button className="text-[12px] font-semibold text-[#22c55e] bg-[#f0fdf4] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#22c55e] hover:text-white transition-all">Hire</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </SidebarLayout>
  );
}
