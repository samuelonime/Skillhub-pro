'use client';

import { useState } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/portfolio', icon: 'fa-folder', label: 'Portfolio' },
  { href: '/dashboard/skillpaths', icon: 'fa-road', label: 'Skill Paths' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

const JOBS = [
  { id: 1, title: 'Frontend Developer', company: 'Paystack', location: 'Remote', type: 'Full-time', salary: '$2,500–$4,000/mo', match: 92, skills: ['React', 'TypeScript', 'CSS'], posted: '2 days ago', logo: 'P', logoColor: '#5b4cf5', status: null },
  { id: 2, title: 'React Engineer', company: 'Flutterwave', location: 'Lagos, NG', type: 'Full-time', salary: '$1,800–$3,200/mo', match: 85, skills: ['React', 'Node.js', 'MongoDB'], posted: '3 days ago', logo: 'F', logoColor: '#10b981', status: 'applied' },
  { id: 3, title: 'UI Developer', company: 'Interswitch', location: 'Hybrid', type: 'Contract', salary: '₦500K–₦800K/mo', match: 78, skills: ['Vue.js', 'CSS', 'Figma'], posted: '5 days ago', logo: 'I', logoColor: '#f59e0b', status: null },
  { id: 4, title: 'JavaScript Engineer', company: 'Andela', location: 'Remote', type: 'Full-time', salary: '$3,000–$5,000/mo', match: 88, skills: ['JavaScript', 'React', 'GraphQL'], posted: '1 week ago', logo: 'A', logoColor: '#ef4444', status: 'saved' },
  { id: 5, title: 'Full Stack Developer', company: 'Kuda Bank', location: 'Lagos, NG', type: 'Full-time', salary: '₦600K–₦1M/mo', match: 74, skills: ['React', 'Python', 'PostgreSQL'], posted: '1 week ago', logo: 'K', logoColor: '#8b5cf6', status: null },
  { id: 6, title: 'Frontend Architect', company: 'Mono', location: 'Remote', type: 'Senior', salary: '$4,000–$6,500/mo', match: 81, skills: ['React', 'TypeScript', 'AWS'], posted: '2 weeks ago', logo: 'M', logoColor: '#3b82f6', status: null },
];

function matchColor(pct: number) {
  if (pct >= 85) return ['#f0fdf4', '#15803d'];
  if (pct >= 70) return ['#fffbeb', '#92400e'];
  return ['#fef2f2', '#b91c1c'];
}

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = JOBS.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  );

  const detail = JOBS.find(j => j.id === selected) || JOBS[0];

  return (
    <SidebarLayout navItems={navItems} pageTitle="Jobs">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">Job Matches</h1>
          <p className="text-[13.5px] text-[#6b6b8a]">Jobs matched to your skills and experience — sorted by compatibility.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px]" />
        <input type="text" placeholder="Search jobs or companies…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] bg-white text-[#0a0a0f] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.14)] transition-all" />
      </div>

      <div className="flex gap-4">
        {/* Job list */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {filtered.map(job => {
            const [mbg, mc] = matchColor(job.match);
            const isActive = selected === job.id || (!selected && job.id === JOBS[0].id);
            return (
              <div
                key={job.id}
                onClick={() => setSelected(job.id)}
                className={`bg-white rounded-2xl p-4 border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] ${isActive ? 'border-[#5b4cf5] shadow-[0_0_0_1px_#5b4cf5]' : 'border-[#e8e8f0]'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl grid place-items-center font-syne font-bold text-sm text-white flex-shrink-0" style={{ background: job.logoColor }}>{job.logo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-syne font-bold text-[14px] tracking-tight">{job.title}</h3>
                        <p className="text-xs text-[#6b6b8a]">{job.company} · {job.location}</p>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: mbg, color: mc }}>{job.match}% match</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-[#6b6b8a]">{job.type}</span>
                      <span className="text-xs text-[#6b6b8a]">·</span>
                      <span className="text-xs text-[#6b6b8a]">{job.salary}</span>
                      {job.status === 'applied' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4f2ff] text-[#5b4cf5]">Applied</span>}
                      {job.status === 'saved' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#92400e]">Saved</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <i className="fas fa-briefcase text-[38px] text-[#9898b8] block mb-3" />
              <h3 className="font-syne font-bold text-[16px] text-[#2d2d42] mb-1.5">No jobs found</h3>
              <p className="text-[13.5px] text-[#6b6b8a]">Try a different search term.</p>
            </div>
          )}
        </div>

        {/* Job detail panel */}
        <div className="w-[340px] flex-shrink-0 max-[1100px]:hidden">
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] sticky top-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl grid place-items-center font-syne font-bold text-lg text-white" style={{ background: detail.logoColor }}>{detail.logo}</div>
              <div>
                <h3 className="font-syne font-bold text-[16px] tracking-tight">{detail.title}</h3>
                <p className="text-[13px] text-[#6b6b8a]">{detail.company}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { icon: 'fa-map-marker-alt', label: detail.location },
                { icon: 'fa-briefcase', label: detail.type },
                { icon: 'fa-money-bill', label: detail.salary },
                { icon: 'fa-clock', label: detail.posted },
              ].map(item => (
                <div key={item.icon} className="flex items-center gap-1.5 text-xs text-[#6b6b8a]">
                  <i className={`fas ${item.icon} text-[#9898b8]`} /> {item.label}
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Required Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.skills.map(s => (
                  <span key={s} className="px-2.5 py-1 bg-[#f4f2ff] text-[#5b4cf5] text-xs font-semibold rounded-full">{s}</span>
                ))}
              </div>
            </div>

            <div className="mb-4 p-3 rounded-xl" style={{ background: matchColor(detail.match)[0] }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold" style={{ color: matchColor(detail.match)[1] }}>Match Score</span>
                <span className="text-sm font-bold" style={{ color: matchColor(detail.match)[1] }}>{detail.match}%</span>
              </div>
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${detail.match}%`, background: matchColor(detail.match)[1] }} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button className="w-full py-3 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] hover:-translate-y-px transition-all">
                {detail.status === 'applied' ? '✓ Applied' : 'Apply Now'}
              </button>
              <button className="w-full py-3 bg-[#f5f5fb] text-[#6b6b8a] rounded-xl text-sm font-semibold border border-[#e8e8f0] cursor-pointer hover:border-[#5b4cf5] hover:text-[#5b4cf5] transition-all">
                <i className="fas fa-bookmark mr-1.5" /> Save Job
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
