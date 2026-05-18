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

const JOBS = [
  { title: 'Senior React Developer', type: 'Full-time', location: 'Remote', applicants: 24, match: 91, status: 'active', posted: '3 days ago' },
  { title: 'Data Analyst', type: 'Full-time', location: 'Lagos', applicants: 17, match: 87, status: 'active', posted: '1 week ago' },
  { title: 'DevOps Engineer', type: 'Contract', location: 'Hybrid', applicants: 8, match: 79, status: 'active', posted: '2 weeks ago' },
  { title: 'UI/UX Designer', type: 'Part-time', location: 'Remote', applicants: 31, match: 95, status: 'closed', posted: '1 month ago' },
];

const APPLICANTS = [
  { name: 'Amara Okafor', role: 'Senior React Developer', score: 94, status: 'shortlisted', avatar: 'AO', bg: '#5b4cf5' },
  { name: 'Kemi Adeyemi', role: 'Data Analyst', score: 88, status: 'reviewing', avatar: 'KA', bg: '#10b981' },
  { name: 'Chidi Nwosu', role: 'Senior React Developer', score: 82, status: 'reviewing', avatar: 'CN', bg: '#f59e0b' },
  { name: 'Fatima Hassan', role: 'DevOps Engineer', score: 79, status: 'applied', avatar: 'FH', bg: '#ef4444' },
  { name: 'Taiwo Obi', role: 'Data Analyst', score: 76, status: 'applied', avatar: 'TO', bg: '#8b5cf6' },
];

const STATUS_COLORS: Record<string, [string, string]> = {
  shortlisted: ['#f0fdf4', '#15803d'],
  reviewing: ['#fffbeb', '#92400e'],
  applied: ['#eff6ff', '#1d4ed8'],
  active: ['#f0fdf4', '#15803d'],
  closed: ['#f5f5fb', '#6b6b8a'],
};

export default function EmployerDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applicants'>('overview');

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
        {(['overview', 'jobs', 'applicants'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer capitalize transition-all border-0 ${activeTab === t ? 'bg-white text-[#0a0a0f] font-semibold shadow-[0_1px_5px_rgba(0,0,0,0.09)]' : 'bg-transparent text-[#6b6b8a]'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3.5 mb-5 max-md:grid-cols-2">
            <StatCard icon="fa-briefcase" iconBg="#f4f2ff" iconColor="#5b4cf5" value="8" label="Active Jobs" delta="↑ 2 this month" deltaUp />
            <StatCard icon="fa-users" iconBg="#f0fdf4" iconColor="#22c55e" value="127" label="Total Applicants" delta="↑ 23 this week" deltaUp />
            <StatCard icon="fa-user-check" iconBg="#fffbeb" iconColor="#f59e0b" value="14" label="Shortlisted" delta="5 awaiting review" />
            <StatCard icon="fa-handshake" iconBg="#eff6ff" iconColor="#3b82f6" value="3" label="Hired This Month" delta="↑ 1 vs last month" deltaUp />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
            {/* Hiring pipeline */}
            <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-syne font-bold text-[15px]">Hiring Pipeline</span>
              </div>
              {[
                { stage: 'Applied', count: 127, pct: 100, color: '#e8e8f0', textColor: '#6b6b8a' },
                { stage: 'Reviewing', count: 48, pct: 38, color: '#3b82f6', textColor: '#1d4ed8' },
                { stage: 'Shortlisted', count: 14, pct: 11, color: '#f59e0b', textColor: '#92400e' },
                { stage: 'Interviewing', count: 6, pct: 5, color: '#5b4cf5', textColor: '#4c1d95' },
                { stage: 'Hired', count: 3, pct: 2, color: '#22c55e', textColor: '#15803d' },
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

            {/* Top job posts */}
            <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-syne font-bold text-[15px]">Top Performing Jobs</span>
              </div>
              {JOBS.slice(0, 3).map(job => (
                <div key={job.title} className="flex items-start gap-3 py-3 border-b border-[#f0f0f8] last:border-0">
                  <div className="w-9 h-9 rounded-[9px] bg-[#f4f2ff] border border-[#e8e8f0] grid place-items-center text-sm text-[#5b4cf5] flex-shrink-0">
                    <i className="fas fa-briefcase" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-[#0a0a0f] truncate">{job.title}</div>
                    <div className="text-xs text-[#6b6b8a]">{job.type} · {job.location} · {job.posted}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-[#5b4cf5]">{job.applicants}</div>
                    <div className="text-[10px] text-[#6b6b8a]">applicants</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent applicants */}
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-syne font-bold text-[15px]">Recent Applicants</span>
              <button onClick={() => setActiveTab('applicants')} className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] border border-[#e8e8f0] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#f4f2ff] transition-all">
                View all
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    {['Candidate','Applied For','Match Score','Status','Action'].map(h => (
                      <th key={h} className="py-2.5 px-4 text-left text-[11.5px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {APPLICANTS.map(a => {
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

      {activeTab === 'jobs' && (
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <span className="font-syne font-bold text-[15px]">All Job Posts</span>
            <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#5b4cf5] text-white text-sm font-semibold rounded-xl border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all">
              <i className="fas fa-plus" /> New Job
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {['Job Title','Type','Location','Applicants','Match Avg','Status','Posted','Actions'].map(h => (
                    <th key={h} className="py-2.5 px-4 text-left text-[11.5px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {JOBS.map(job => {
                  const [sbg, sc] = STATUS_COLORS[job.status];
                  return (
                    <tr key={job.title} className="hover:bg-[#fafafd] transition-colors">
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] font-semibold text-[#0a0a0f]">{job.title}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a]">{job.type}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a]">{job.location}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] font-semibold text-[#5b4cf5]">{job.applicants}</td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <span className="text-sm font-semibold text-[#22c55e]">{job.match}%</span>
                      </td>
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
        </div>
      )}

      {activeTab === 'applicants' && (
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <span className="font-syne font-bold text-[15px]">All Applicants</span>
            <div className="flex gap-2">
              <select className="text-sm text-[#6b6b8a] border border-[#e8e8f0] rounded-lg px-3 py-2 bg-white outline-none font-[inherit] cursor-pointer">
                <option>All Roles</option>
                <option>Senior React Developer</option>
                <option>Data Analyst</option>
                <option>DevOps Engineer</option>
              </select>
              <select className="text-sm text-[#6b6b8a] border border-[#e8e8f0] rounded-lg px-3 py-2 bg-white outline-none font-[inherit] cursor-pointer">
                <option>All Statuses</option>
                <option>Applied</option>
                <option>Reviewing</option>
                <option>Shortlisted</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {['Candidate','Applied For','Match Score','Status','Action'].map(h => (
                    <th key={h} className="py-2.5 px-4 text-left text-[11.5px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {APPLICANTS.map(a => {
                  const [sbg, sc] = STATUS_COLORS[a.status];
                  return (
                    <tr key={a.name} className="hover:bg-[#fafafd] transition-colors">
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full grid place-items-center font-syne font-bold text-xs text-white flex-shrink-0" style={{ background: a.bg }}>{a.avatar}</div>
                          <span className="font-semibold text-[#0a0a0f]">{a.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[13px]">{a.role}</td>
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
                          <button className="text-[12px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">View Profile</button>
                          <button className="text-[12px] font-semibold text-[#22c55e] bg-[#f0fdf4] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#22c55e] hover:text-white transition-all">Shortlist</button>
                          <button className="text-[12px] font-semibold text-[#ef4444] bg-[#fef2f2] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#ef4444] hover:text-white transition-all">Reject</button>
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
    </SidebarLayout>
  );
}
