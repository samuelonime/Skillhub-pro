'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/community', icon: 'fa-users', label: 'Community' },
  { href: '/dashboard/portfolio', icon: 'fa-layer-group', label: 'Portfolio' },
  { href: '/dashboard/platforms', icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

const COURSE_COLORS = ['#5b4cf5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

const MERIT_TIERS = [
  { min: 5000, label: 'Platinum', icon: '💎', color: '#7c3aed', bg: '#f4f2ff' },
  { min: 2000, label: 'Gold',     icon: '🥇', color: '#d97706', bg: '#fffbeb' },
  { min: 500,  label: 'Silver',   icon: '🥈', color: '#6b7280', bg: '#f5f5fb' },
  { min: 0,    label: 'Bronze',   icon: '🥉', color: '#92400e', bg: '#fef3c7' },
];

function getTier(coins: number) {
  return MERIT_TIERS.find(t => coins >= t.min) || MERIT_TIERS[MERIT_TIERS.length - 1];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTIVITY_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  book:        { icon: 'fa-book-open',    bg: '#eff6ff', color: '#3b82f6' },
  certificate: { icon: 'fa-certificate',  bg: '#f0fdf4', color: '#22c55e' },
  coins:       { icon: 'fa-coins',        bg: '#fffbeb', color: '#f59e0b' },
  star:        { icon: 'fa-star',         bg: '#fef2f2', color: '#ef4444' },
  'paper-plane':{ icon: 'fa-paper-plane', bg: '#f4f2ff', color: '#5b4cf5' },
  gift:        { icon: 'fa-gift',         bg: '#f4f2ff', color: '#5b4cf5' },
  success:     { icon: 'fa-check-circle', bg: '#f0fdf4', color: '#22c55e' },
  info:        { icon: 'fa-info-circle',  bg: '#eff6ff', color: '#3b82f6' },
};

/* ─── Sub-components ────────────────────────────────────────────────────── */

function StatCard({ icon, iconBg, iconColor, value, label }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] flex items-center gap-3.5 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-all">
      <div className="w-11 h-11 rounded-xl grid place-items-center text-[17px] flex-shrink-0" style={{ background: iconBg, color: iconColor }}>
        <i className={`fas ${icon}`} />
      </div>
      <div>
        <div className="font-syne font-bold text-[22px] tracking-tight">{value ?? '—'}</div>
        <div className="text-xs text-[#6b6b8a] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function Skeleton({ h = 'h-4', w = 'w-full', rounded = 'rounded' }: { h?: string; w?: string; rounded?: string }) {
  return <div className={`${h} ${w} ${rounded} bg-[#f0f0f8] animate-pulse`} />;
}

export default function DashboardPage() {
  const [user, setUser]           = useState<any>(null);
  const [stats, setStats]         = useState<any>(null);
  const [courses, setCourses]     = useState<any[] | null>(null);
  const [jobs, setJobs]           = useState<any[] | null>(null);
  const [portfolio, setPortfolio] = useState<any | null>(null);
  const [platforms, setPlatforms] = useState<any[] | null>(null);
  const [activity, setActivity]   = useState<any[] | null>(null);

  useEffect(() => {
    // Fire all requests in parallel — each section updates independently
    apiFetch('/dashboard').then(r => {
      if (r.success) { setUser(r.data.user); setStats(r.data.stats); setActivity(r.data.recentNotifications || []); }
    }).catch(() => { setActivity([]); });

    apiFetch('/courses/enrolled').then(r => {
      if (r.success) setCourses(r.data.filter((c: any) => c.progress > 0 && c.progress < 100).slice(0, 3));
      else setCourses([]);
    }).catch(() => setCourses([]));

    apiFetch('/jobs/matches').then(r => {
      if (r.success) setJobs(r.data.slice(0, 3));
      else setJobs([]);
    }).catch(() => setJobs([]));

    apiFetch('/portfolio').then(r => {
      if (r.success) setPortfolio(r.data);
      else setPortfolio({ stats: null, projects: [] });
    }).catch(() => setPortfolio({ stats: null, projects: [] }));

    apiFetch('/platforms').then(r => {
      if (r.success) setPlatforms(r.data || []);
      else setPlatforms([]);
    }).catch(() => setPlatforms([]));
  }, []);

  const coins = user?.meritCoins ?? 0;
  const tier = getTier(coins);
  const nextTier = MERIT_TIERS.slice().reverse().find(t => t.min > coins);
  const tierProgress = nextTier ? Math.min(100, (coins / nextTier.min) * 100) : 100;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  const jobTierMsg =
    coins >= 5000 ? '💎 Platinum — all premium & enterprise jobs unlocked' :
    coins >= 2000 ? '🥇 Gold — senior & featured jobs unlocked' :
    coins >= 500  ? '🥈 Silver — mid-level jobs unlocked' :
                    '🥉 Bronze — earn coins to unlock more opportunities';

  return (
    <SidebarLayout navItems={navItems} pageTitle="Dashboard">

      {/* ── Welcome banner ─────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-4 flex-wrap relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#5b4cf5,#7c3aed)' }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top:-60,right:-60,width:200,height:200,background:'rgba(255,255,255,0.08)' }} />
        <div className="relative z-[1]">
          <h2 className="font-syne font-bold text-[20px] text-white mb-0.5">
            {greeting}{user ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h2>
          <p className="text-white/70 text-sm">Here's your learning overview for today.</p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: tier.bg + '28', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            {tier.icon} {tier.label} Tier
          </div>
        </div>
        <div className="relative z-[1] flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <i className="fas fa-coins text-[22px] text-[#fbbf24]" />
          <div>
            <div className="font-syne font-extrabold text-[22px] text-white leading-none">{coins.toLocaleString()}</div>
            <div className="text-[11px] text-white/60">Merit Coins</div>
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mb-4 max-md:grid-cols-2">
        <StatCard icon="fa-book-open"    iconBg="#f4f2ff" iconColor="#5b4cf5" value={stats?.activeCourses}      label="Active Courses" />
        <StatCard icon="fa-layer-group"  iconBg="#f0fdf4" iconColor="#22c55e" value={portfolio?.stats?.projectCount ?? 0} label="Portfolio Projects" />
        <StatCard icon="fa-briefcase"    iconBg="#fffbeb" iconColor="#f59e0b" value={stats?.jobApplications}     label="Applications" />
        <StatCard icon="fa-coins"        iconBg="#fef2f2" iconColor="#ef4444" value={coins.toLocaleString()}     label="Merit Coins" />
      </div>

      {/* ── Merit coin tier progress ────────────────────────────────────── */}
      {nextTier && (
        <div className="bg-white rounded-2xl p-4 border border-[#e8e8f0] mb-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="font-syne font-bold text-[13.5px]">Merit Coins Progress</span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#6b6b8a]">
              <span className="font-semibold" style={{ color: tier.color }}>{tier.icon} {tier.label}</span>
              <span>→</span>
              <span>{nextTier.icon} {nextTier.label} at {nextTier.min.toLocaleString()} coins</span>
            </div>
          </div>
          <div className="h-2 bg-[#e8e8f0] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${tierProgress}%`, background: 'linear-gradient(90deg,#5b4cf5,#7c3aed)' }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-[#5b4cf5] font-semibold">{coins.toLocaleString()} coins</span>
            <a href="/dashboard/rewards" className="text-[11px] font-semibold text-[#5b4cf5] hover:underline">Buy coins or earn more →</a>
          </div>
        </div>
      )}

      {/* ── Main grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">

        {/* Active Courses */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-syne font-bold text-[15px]">Active Courses</span>
            <a href="/dashboard/courses" className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] px-3 py-1.5 rounded-lg no-underline hover:bg-[#f4f2ff] transition-all">View all</a>
          </div>
          {courses === null ? (
            <div className="flex flex-col gap-3">{[1,2,3].map(i => <Skeleton key={i} h="h-12" rounded="rounded-xl" />)}</div>
          ) : courses.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[#9898b8]">No active courses yet.</p>
              <a href="/dashboard/courses" className="text-xs text-[#5b4cf5] font-semibold mt-1 inline-block">Browse courses →</a>
            </div>
          ) : courses.map((c: any, i: number) => (
            <div key={c.id} className="flex items-center gap-3 py-3 border-b border-[#f0f0f8] last:border-0">
              <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: COURSE_COLORS[i % COURSE_COLORS.length] + '22' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold text-[#0a0a0f] truncate">{c.title}</div>
                <div className="h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden mt-1.5">
                  <div className="h-full rounded-full" style={{ width: `${c.progress}%`, background: COURSE_COLORS[i % COURSE_COLORS.length] }} />
                </div>
              </div>
              <span className="text-xs font-semibold text-[#6b6b8a] flex-shrink-0">{c.progress}%</span>
            </div>
          ))}
        </div>

        {/* Portfolio snapshot */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-syne font-bold text-[15px]">
              <i className="fas fa-layer-group text-[#22c55e] mr-2" />Portfolio
            </span>
            <a href="/dashboard/portfolio" className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] px-3 py-1.5 rounded-lg no-underline hover:bg-[#f4f2ff] transition-all">Manage</a>
          </div>

          {portfolio === null ? (
            <div className="grid grid-cols-2 gap-3 mb-4">{[1,2,3,4].map(i => <Skeleton key={i} h="h-14" rounded="rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label:'Projects',    value: portfolio?.stats?.projectCount ?? 0, icon:'fa-layer-group', color:'#5b4cf5', bg:'#f4f2ff' },
                { label:'Avg Score',   value: portfolio?.stats?.avgScore || '—',   icon:'fa-star',        color:'#f59e0b', bg:'#fffbeb' },
                { label:'Total Views', value: portfolio?.stats?.totalViews ?? 0,   icon:'fa-eye',         color:'#10b981', bg:'#f0fdf4' },
                { label:'Certs',       value: portfolio?.stats?.certCount ?? 0,    icon:'fa-certificate', color:'#3b82f6', bg:'#eff6ff' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: s.bg }}>
                  <i className={`fas ${s.icon} text-sm flex-shrink-0`} style={{ color: s.color }} />
                  <div>
                    <div className="font-syne font-bold text-[16px] leading-none" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-[#6b6b8a] mt-0.5">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add project CTA if empty */}
          {portfolio !== null && (portfolio?.stats?.projectCount ?? 0) === 0 && (
            <a href="/dashboard/portfolio" className="flex items-center justify-center gap-2 py-2.5 mb-3 rounded-xl text-xs font-semibold text-[#5b4cf5] no-underline transition-all hover:-translate-y-px" style={{ background:'#f4f2ff', border:'1px dashed #c4bbfa' }}>
              <i className="fas fa-plus" />Add your first project (+25 coins)
            </a>
          )}

          {/* External platforms */}
          <div className="pt-3 border-t border-[#f0f0f8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#6b6b8a]">External Platforms</span>
              <a href="/dashboard/platforms" className="text-[11px] text-[#5b4cf5] font-semibold no-underline hover:underline">Connect more →</a>
            </div>
            {platforms === null ? (
              <Skeleton h="h-9" rounded="rounded-xl" />
            ) : platforms.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {platforms.map((p: any) => (
                  <span key={p.platform} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f0fdf4] text-[#22c55e]">
                    <i className="fas fa-check-circle mr-1" />{p.platform}
                  </span>
                ))}
              </div>
            ) : (
              <a href="/dashboard/platforms" className="flex items-center gap-2 p-2.5 rounded-xl no-underline hover:bg-[#f4f2ff] transition-all" style={{ background:'#f5f5fb' }}>
                <i className="fas fa-graduation-cap text-[#5b4cf5] text-sm" />
                <span className="text-xs text-[#5b4cf5] font-semibold">Connect Udemy, Coursera & more</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions + Job Matches ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <span className="font-syne font-bold text-[15px] block mb-4">Quick Actions</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon:'fa-plus',          label:'Enroll Course',      bg:'#f4f2ff', color:'#5b4cf5', href:'/dashboard/courses' },
              { icon:'fa-layer-group',   label:'Add Project',        bg:'#f0fdf4', color:'#22c55e', href:'/dashboard/portfolio' },
              { icon:'fa-graduation-cap',label:'Connect Platform',   bg:'#fffbeb', color:'#f59e0b', href:'/dashboard/platforms' },
              { icon:'fa-paper-plane',   label:'Browse Jobs',        bg:'#eff6ff', color:'#3b82f6', href:'/dashboard/jobs' },
              { icon:'fa-certificate',   label:'Certificates',       bg:'#fef2f2', color:'#ef4444', href:'/dashboard/certificates' },
              { icon:'fa-coins',         label:'Buy Coins',          bg:'#f4f2ff', color:'#7c3aed', href:'/dashboard/rewards' },
            ].map(a => (
              <a key={a.label} href={a.href} className="flex flex-col items-center gap-1.5 py-3 rounded-xl no-underline transition-all hover:scale-105" style={{ background: a.bg }}>
                <i className={`fas ${a.icon} text-base`} style={{ color: a.color }} />
                <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: a.color }}>{a.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Job Matches */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-syne font-bold text-[15px]">Job Matches</span>
            <a href="/dashboard/jobs" className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] px-3 py-1.5 rounded-lg no-underline hover:bg-[#f4f2ff] transition-all">View all</a>
          </div>

          {/* Tier notice */}
          <div className="mb-3 p-2.5 rounded-xl text-[11px] font-semibold" style={{ background: tier.bg, color: tier.color }}>
            {jobTierMsg}
          </div>

          {jobs === null ? (
            <div className="flex flex-col gap-3">{[1,2,3].map(i => <Skeleton key={i} h="h-14" rounded="rounded-xl" />)}</div>
          ) : jobs.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-[#9898b8]">No job matches yet.</p>
              <a href="/dashboard/jobs" className="text-xs text-[#5b4cf5] font-semibold mt-1 inline-block">Browse jobs →</a>
            </div>
          ) : jobs.map((job: any) => {
            const mc = job.match >= 85 ? '#22c55e' : job.match >= 70 ? '#f59e0b' : '#ef4444';
            return (
              <div key={job.id} className="flex items-start gap-3 py-3 border-b border-[#f0f0f8] last:border-0">
                <div className="w-9 h-9 rounded-lg bg-[#f5f5fb] border border-[#e8e8f0] grid place-items-center text-sm text-[#5b4cf5] flex-shrink-0">
                  <i className="fas fa-building" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#0a0a0f] truncate">{job.title}</div>
                  <div className="text-xs text-[#6b6b8a]">{job.company} · {job.location}</div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: mc + '22', color: mc }}>
                  {job.match}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
        <span className="font-syne font-bold text-[15px] block mb-4">Recent Activity</span>
        {activity === null ? (
          <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <Skeleton key={i} h="h-10" rounded="rounded-xl" />)}</div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-[#9898b8] py-4 text-center">No recent activity.</p>
        ) : activity.map((n: any) => {
          const style = ACTIVITY_ICONS[n.icon] || ACTIVITY_ICONS[n.type] || { icon:'fa-bell', bg:'#f5f5fb', color:'#6b6b8a' };
          return (
            <div key={n.id} className="flex items-start gap-2.5 py-2.5 border-b border-[#f0f0f8] last:border-0">
              <div className="w-8 h-8 rounded-lg grid place-items-center text-xs flex-shrink-0" style={{ background: style.bg, color: style.color }}>
                <i className={`fas ${style.icon}`} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-[#2d2d42] leading-snug">{n.message}</div>
                <div className="text-[11px] text-[#9898b8] mt-0.5">{timeAgo(n.createdAt)}</div>
              </div>
            </div>
          );
        })}
      </div>

    </SidebarLayout>
  );
}