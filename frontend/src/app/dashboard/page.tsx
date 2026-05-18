'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
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
        <div className="font-syne font-bold text-[22px] tracking-tight">{value ?? '—'}</div>
        <div className="text-xs text-[#6b6b8a] mt-0.5">{label}</div>
        {delta && <div className={`text-[11px] mt-0.5 ${deltaUp ? 'text-[#22c55e]' : 'text-[#6b6b8a]'}`}>{delta}</div>}
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

const ICON_MAP: Record<string, { icon: string; bg: string; color: string }> = {
  book: { icon: 'fa-book-open', bg: '#eff6ff', color: '#3b82f6' },
  certificate: { icon: 'fa-certificate', bg: '#f0fdf4', color: '#22c55e' },
  coins: { icon: 'fa-coins', bg: '#fffbeb', color: '#f59e0b' },
  star: { icon: 'fa-star', bg: '#fef2f2', color: '#ef4444' },
  'paper-plane': { icon: 'fa-paper-plane', bg: '#f4f2ff', color: '#5b4cf5' },
  gift: { icon: 'fa-gift', bg: '#f4f2ff', color: '#5b4cf5' },
  success: { icon: 'fa-check-circle', bg: '#f0fdf4', color: '#22c55e' },
  info: { icon: 'fa-info-circle', bg: '#eff6ff', color: '#3b82f6' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const COURSE_COLORS = ['#5b4cf5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dash, enrolled, jobMatches] = await Promise.all([
          apiFetch('/dashboard'),
          apiFetch('/courses/enrolled'),
          apiFetch('/jobs/matches'),
        ]);
        if (dash.success) setData(dash.data);
        if (enrolled.success) setCourses(enrolled.data.filter((c: any) => c.progress > 0 && c.progress < 100).slice(0, 3));
        if (jobMatches.success) setJobs(jobMatches.data.slice(0, 3));
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  const user = data?.user;
  const stats = data?.stats;
  const notifications = data?.recentNotifications || [];
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (loading) {
    return (
      <SidebarLayout navItems={navItems} pageTitle="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#5b4cf5]/30 border-t-[#5b4cf5] rounded-full animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout navItems={navItems} pageTitle="Dashboard">
      {/* Welcome banner */}
      <div className="rounded-2xl p-7 mb-6 flex items-center justify-between gap-5 flex-wrap relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5b4cf5 0%, #7c3aed 100%)', color: '#fff' }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: -60, right: -60, width: 220, height: 220, background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ bottom: -40, right: 80, width: 140, height: 140, background: 'rgba(255,255,255,0.05)' }} />
        <div className="relative z-[1]">
          <h2 className="font-syne font-bold text-[22px] text-white mb-1">{greeting}{user ? `, ${user.name.split(' ')[0]}` : ''}! 👋</h2>
          <p className="text-white/75 text-sm">Here's your learning overview for today.</p>
        </div>
        <div className="relative z-[1] flex items-center gap-2.5 px-4 py-3 rounded-xl backdrop-blur-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <i className="fas fa-coins text-[22px] text-[#fbbf24]" />
          <div>
            <div className="font-syne font-extrabold text-[22px] text-white">{(user?.meritCoins ?? 0).toLocaleString()}</div>
            <div className="text-[11px] text-white/70">Merit Coins</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-5 max-md:grid-cols-2">
        <StatCard icon="fa-book-open" iconBg="#f4f2ff" iconColor="#5b4cf5" value={stats?.activeCourses} label="Active Courses" />
        <StatCard icon="fa-certificate" iconBg="#f0fdf4" iconColor="#22c55e" value={stats?.certificates} label="Certificates" />
        <StatCard icon="fa-briefcase" iconBg="#fffbeb" iconColor="#f59e0b" value={stats?.jobApplications} label="Applications" />
        <StatCard icon="fa-coins" iconBg="#fef2f2" iconColor="#ef4444" value={(stats?.meritCoins ?? 0).toLocaleString()} label="Merit Coins" />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
        {/* Active Courses */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-syne font-bold text-[15px]">Active Courses</span>
            <a href="/dashboard/courses" className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] border border-[#e8e8f0] px-3 py-1.5 rounded-lg no-underline hover:bg-[#f4f2ff] transition-all">View all</a>
          </div>
          {courses.length > 0 ? courses.map((c: any, i: number) => (
            <CourseCard
              key={c.id}
              title={c.title}
              sub={c.category}
              progress={c.progress}
              color={COURSE_COLORS[i % COURSE_COLORS.length]}
            />
          )) : (
            <p className="text-sm text-[#9898b8] py-4 text-center">No active courses yet. <a href="/dashboard/courses" className="text-[#5b4cf5]">Browse courses</a></p>
          )}
        </div>

        {/* Profile strength */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-syne font-bold text-[15px]">Profile Strength</span>
              <a href="/dashboard/settings" className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] border border-[#e8e8f0] px-3 py-1.5 rounded-lg no-underline hover:bg-[#f4f2ff] transition-all">Improve</a>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-syne font-bold text-[22px] text-[#5b4cf5]">{user?.profileStrength ?? 0}%</div>
              <span className="text-xs text-[#6b6b8a]">Complete your profile</span>
            </div>
            <div className="h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#5b4cf5] transition-all" style={{ width: `${user?.profileStrength ?? 0}%` }} />
            </div>
            <p className="text-xs text-[#6b6b8a] mt-3">
              {(user?.profileStrength ?? 0) < 80 ? 'Add a profile photo and bio to increase your strength' : 'Great profile! Keep it updated.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex-1">
            <div className="flex items-center justify-between mb-4">
              <span className="font-syne font-bold text-[15px]">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'fa-plus', label: 'Enroll Course', bg: '#f4f2ff', color: '#5b4cf5', href: '/dashboard/courses' },
                { icon: 'fa-paper-plane', label: 'Browse Jobs', bg: '#f0fdf4', color: '#22c55e', href: '/dashboard/jobs' },
                { icon: 'fa-certificate', label: 'Certificates', bg: '#fffbeb', color: '#f59e0b', href: '/dashboard/certificates' },
                { icon: 'fa-trophy', label: 'View Rewards', bg: '#fef2f2', color: '#ef4444', href: '/dashboard/rewards' },
              ].map(a => (
                <a key={a.label} href={a.href} className="flex flex-col items-center gap-1.5 py-3 rounded-xl no-underline transition-all hover:scale-105" style={{ background: a.bg }}>
                  <i className={`fas ${a.icon} text-base`} style={{ color: a.color }} />
                  <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
                </a>
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
          {jobs.length > 0 ? jobs.map((job: any) => {
            const mc = job.match >= 85 ? '#22c55e' : job.match >= 70 ? '#f59e0b' : '#ef4444';
            return (
              <div key={job.id} className="flex items-start gap-3 py-3.5 border-b border-[#f0f0f8] last:border-0">
                <div className="w-9 h-9 rounded-[9px] bg-[#f5f5fb] border border-[#e8e8f0] grid place-items-center text-sm text-[#5b4cf5] flex-shrink-0">
                  <i className="fas fa-building" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-[#0a0a0f] mb-0.5">{job.title}</div>
                  <div className="text-xs text-[#6b6b8a] mb-1.5">{job.company} · {job.location}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#6b6b8a]">{job.salary}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: mc + '26', color: mc }}>
                      <i className="fas fa-star text-[9px]" /> {job.match}% match
                    </span>
                  </div>
                </div>
                <a href="/dashboard/jobs" className="text-[13px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] hover:bg-[#5b4cf5] hover:text-white px-3 py-1.5 rounded-lg no-underline transition-all">View</a>
              </div>
            );
          }) : (
            <p className="text-sm text-[#9898b8] py-4 text-center">No job matches yet. <a href="/dashboard/jobs" className="text-[#5b4cf5]">Browse jobs</a></p>
          )}
        </div>

        {/* Recent activity (from notifications) */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-syne font-bold text-[15px]">Recent Activity</span>
          </div>
          {notifications.length > 0 ? notifications.map((n: any) => {
            const style = ICON_MAP[n.icon] || ICON_MAP[n.type] || { icon: 'fa-bell', bg: '#f5f5fb', color: '#6b6b8a' };
            return (
              <ActivityItem
                key={n.id}
                icon={style.icon}
                iconBg={style.bg}
                iconColor={style.color}
                msg={n.message}
                time={timeAgo(n.createdAt)}
              />
            );
          }) : (
            <p className="text-sm text-[#9898b8] py-4 text-center">No recent activity.</p>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
