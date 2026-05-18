'use client';

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

function CourseCard({ title, sub, progress, color }: any) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#f0f0f8] last:border-0">
      <div className="w-12 h-12 rounded-[10px] flex-shrink-0" style={{ background: color + '26' }} />
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-[#0a0a0f] mb-0.5 leading-tight truncate">{title}</div>
        <div className="text-xs text-[#6b6b8a] mb-1.5">{sub}</div>
        <div className="h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: color }} />
        </div>
      </div>
      <span className="text-xs font-semibold text-[#6b6b8a]">{progress}%</span>
    </div>
  );
}

function JobMatchCard({ title, company, location, salary, match, matchColor }: any) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-[#f0f0f8] last:border-0">
      <div className="w-9 h-9 rounded-[9px] bg-[#f5f5fb] border border-[#e8e8f0] grid place-items-center text-sm text-[#5b4cf5] flex-shrink-0">
        <i className="fas fa-building" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-[#0a0a0f] mb-0.5">{title}</div>
        <div className="text-xs text-[#6b6b8a] mb-1.5">{company} · {location}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#6b6b8a]">{salary}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: matchColor + '26', color: matchColor }}>
            <i className="fas fa-star text-[9px]" /> {match}% match
          </span>
        </div>
      </div>
      <button className="text-[13px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] hover:bg-[#5b4cf5] hover:text-white px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-all">Apply</button>
    </div>
  );
}

function ActivityItem({ icon, iconBg, iconColor, msg, time }: any) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-[#f0f0f8] last:border-0">
      <div className="w-8 h-8 rounded-lg grid place-items-center text-xs flex-shrink-0" style={{ background: iconBg, color: iconColor }}>
        <i className={`fas ${icon}`} />
      </div>
      <div>
        <div className="text-[13px] text-[#2d2d42] leading-snug">{msg}</div>
        <div className="text-[11px] text-[#9898b8] mt-0.5">{time}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SidebarLayout navItems={navItems} pageTitle="Dashboard">
      {/* Welcome banner */}
      <div className="rounded-2xl p-7 mb-6 flex items-center justify-between gap-5 flex-wrap relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5b4cf5 0%, #7c3aed 100%)', color: '#fff' }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: -60, right: -60, width: 220, height: 220, background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ bottom: -40, right: 80, width: 140, height: 140, background: 'rgba(255,255,255,0.05)' }} />
        <div className="relative z-[1]">
          <h2 className="font-syne font-bold text-[22px] text-white mb-1">Good morning! 👋</h2>
          <p className="text-white/75 text-sm">Here's your learning overview for today.</p>
        </div>
        <div className="relative z-[1] flex items-center gap-2.5 px-4 py-3 rounded-xl backdrop-blur-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <i className="fas fa-coins text-[22px] text-[#fbbf24]" />
          <div>
            <div className="font-syne font-extrabold text-[22px] text-white">1,250</div>
            <div className="text-[11px] text-white/70">Merit Coins</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5 max-md:grid-cols-2">
        <StatCard icon="fa-book-open" iconBg="#f4f2ff" iconColor="#5b4cf5" value="6" label="Active Courses" delta="↑ 2 this month" deltaUp />
        <StatCard icon="fa-certificate" iconBg="#f0fdf4" iconColor="#22c55e" value="3" label="Certificates" delta="↑ 1 new" deltaUp />
        <StatCard icon="fa-briefcase" iconBg="#fffbeb" iconColor="#f59e0b" value="12" label="Applications" delta="4 pending" />
        <StatCard icon="fa-coins" iconBg="#fef2f2" iconColor="#ef4444" value="1,250" label="Merit Coins" delta="↑ 350 this week" deltaUp />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
        {/* Active Courses */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-syne font-bold text-[15px]">Active Courses</span>
            <a href="/dashboard/courses" className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] border border-[#e8e8f0] px-3 py-1.5 rounded-lg no-underline hover:bg-[#f4f2ff] transition-all">View all</a>
          </div>
          <CourseCard title="React & TypeScript Mastery" sub="12 of 24 modules" progress={65} color="#5b4cf5" />
          <CourseCard title="Python for Data Science" sub="5 of 18 modules" progress={30} color="#10b981" />
          <CourseCard title="UI/UX Design Fundamentals" sub="3 of 12 modules" progress={22} color="#f59e0b" />
        </div>

        {/* Profile strength */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-syne font-bold text-[15px]">Profile Strength</span>
              <a href="/dashboard/settings" className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] border border-[#e8e8f0] px-3 py-1.5 rounded-lg no-underline hover:bg-[#f4f2ff] transition-all">Improve</a>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-syne font-bold text-[22px] text-[#5b4cf5]">72%</div>
              <span className="text-xs text-[#6b6b8a]">Complete your profile</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: '72%' }} /></div>
            <p className="text-xs text-[#6b6b8a] mt-3">Add a profile photo and bio to reach 85%</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex-1">
            <div className="flex items-center justify-between mb-4">
              <span className="font-syne font-bold text-[15px]">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'fa-plus', label: 'Enroll Course', bg: '#f4f2ff', color: '#5b4cf5' },
                { icon: 'fa-paper-plane', label: 'Apply to Job', bg: '#f0fdf4', color: '#22c55e' },
                { icon: 'fa-upload', label: 'Add Certificate', bg: '#fffbeb', color: '#f59e0b' },
                { icon: 'fa-trophy', label: 'View Rewards', bg: '#fef2f2', color: '#ef4444' },
              ].map(a => (
                <button key={a.label} className="flex flex-col items-center gap-1.5 py-3 rounded-xl cursor-pointer border-0 transition-all hover:scale-105" style={{ background: a.bg }}>
                  <i className={`fas ${a.icon} text-base`} style={{ color: a.color }} />
                  <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        {/* Job matches */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-syne font-bold text-[15px]"><i className="fas fa-briefcase text-[#5b4cf5] mr-2" />Job Matches</span>
            <a href="/dashboard/jobs" className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] border border-[#e8e8f0] px-3 py-1.5 rounded-lg no-underline hover:bg-[#f4f2ff] transition-all">View all</a>
          </div>
          <JobMatchCard title="Frontend Developer" company="Paystack" location="Remote" salary="$2,500–$4,000/mo" match={92} matchColor="#22c55e" />
          <JobMatchCard title="React Engineer" company="Flutterwave" location="Lagos" salary="$1,800–$3,200/mo" match={85} matchColor="#22c55e" />
          <JobMatchCard title="UI Developer" company="Interswitch" location="Hybrid" salary="₦500K–₦800K/mo" match={78} matchColor="#f59e0b" />
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-syne font-bold text-[15px]">Recent Activity</span>
          </div>
          <ActivityItem icon="fa-certificate" iconBg="#f0fdf4" iconColor="#22c55e" msg="Earned certificate: React Fundamentals" time="2 hours ago" />
          <ActivityItem icon="fa-coins" iconBg="#fffbeb" iconColor="#f59e0b" msg="Earned 150 Merit Coins for completing Module 12" time="5 hours ago" />
          <ActivityItem icon="fa-paper-plane" iconBg="#f4f2ff" iconColor="#5b4cf5" msg="Applied to Frontend Developer at Paystack" time="1 day ago" />
          <ActivityItem icon="fa-book-open" iconBg="#eff6ff" iconColor="#3b82f6" msg="Enrolled in Python for Data Science" time="2 days ago" />
          <ActivityItem icon="fa-star" iconBg="#fef2f2" iconColor="#ef4444" msg="Profile strength improved to 72%" time="3 days ago" />
        </div>
      </div>
    </SidebarLayout>
  );
}
