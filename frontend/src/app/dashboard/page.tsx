'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { BrandIcon } from '@/components/ui/BrandIcon';

const navItems = [
  { href: '/dashboard',             icon: 'fa-home',          label: 'Dashboard' },
  { href: '/dashboard/courses',     icon: 'fa-book-open',     label: 'Courses' },
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
  { href: '/dashboard/community',   icon: 'fa-users',         label: 'Community' },
  { href: '/dashboard/portfolio',   icon: 'fa-layer-group',   label: 'Portfolio' },
  { href: '/dashboard/resume',      icon: 'fa-file-lines',    label: 'Resume' },
  { href: '/dashboard/platforms',   icon: 'fa-graduation-cap',label: 'Learning Platforms' },
  { href: '/dashboard/jobs',        icon: 'fa-briefcase',     label: 'Jobs' },
  { href: '/dashboard/certificates',icon: 'fa-certificate',   label: 'Certificates' },
  { href: '/dashboard/rewards',     icon: 'fa-coins',         label: 'Rewards' },
  { href: '/dashboard/settings',    icon: 'fa-gear',          label: 'Settings' },
];

const COURSE_COLORS = ['#4F8EF7', '#00E5A0', '#F59E0B', '#DC2626', '#F87171', '#38BDF8'];

const MERIT_TIERS = [
  { min: 5000, label: 'Platinum', icon: '💎', color: '#DC2626' },
  { min: 2000, label: 'Gold',     icon: '🥇', color: '#F59E0B' },
  { min: 500,  label: 'Silver',   icon: '🥈', color: '#94A3B8' },
  { min: 0,    label: 'Bronze',   icon: '🥉', color: '#CD7C54' },
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

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  book:          { icon: 'fa-book-open',    color: '#4F8EF7' },
  certificate:   { icon: 'fa-certificate',  color: '#00E5A0' },
  coins:         { icon: 'fa-coins',        color: '#F59E0B' },
  star:          { icon: 'fa-star',         color: '#F59E0B' },
  'paper-plane': { icon: 'fa-paper-plane',  color: '#DC2626' },
  gift:          { icon: 'fa-gift',         color: '#DC2626' },
  success:       { icon: 'fa-check-circle', color: '#00E5A0' },
  info:          { icon: 'fa-info-circle',  color: '#4F8EF7' },
};

function Skeleton({ h = 'h-4', w = 'w-full', rounded = 'rounded-lg' }: { h?: string; w?: string; rounded?: string }) {
  return <div className={`${h} ${w} ${rounded} animate-pulse`} style={{ background: 'var(--surface-soft)' }} />;
}

/* ── Metric card ────────────────────────────────────────────────────────── */
function MetricCard({ value, label, sub, accent }: { value: any; label: string; sub?: string; accent: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col justify-between gap-3 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-200"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at 20% 20%, ${accent}12 0%, transparent 60%)` }} />
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-faint)' }}>{label}</div>
      <div>
        <div className="font-jakarta font-bold text-[2rem] leading-none text-ink">{value ?? '—'}</div>
        {sub && <div className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>{sub}</div>}
      </div>
      <div className="h-[2px] w-8 rounded-full" style={{ background: accent }} />
    </div>
  );
}

/* ── Section shell ──────────────────────────────────────────────────────── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <span className="font-jakarta font-semibold text-[14px] text-ink-90 tracking-tight">{title}</span>
      {action && href && (
        <a href={href} className="text-[11px] font-semibold no-underline px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.2)' }}>
          {action}
        </a>
      )}
    </div>
  );
}

/* ── Main dashboard ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [user, setUser]           = useState<any>(null);
  const [stats, setStats]         = useState<any>(null);
  const [courses, setCourses]     = useState<any[] | null>(null);
  const [jobs, setJobs]           = useState<any[] | null>(null);
  const [portfolio, setPortfolio] = useState<any | null>(null);
  const [platforms, setPlatforms] = useState<any[] | null>(null);
  const [activity, setActivity]   = useState<any[] | null>(null);

  useEffect(() => {
    apiFetch('/dashboard').then(r => {
      if (r.success) { setUser(r.data.user); setStats(r.data.stats); setActivity(r.data.recentNotifications || []); }
    }).catch(() => { setActivity([]); });

    apiFetch('/courses/enrolled').then(r => {
      if (r.success) setCourses(r.data.filter((c: any) => c.progress > 0 && c.progress < 100).slice(0, 4));
      else setCourses([]);
    }).catch(() => setCourses([]));

    apiFetch('/jobs/matches').then(r => {
      if (r.success) setJobs(r.data.slice(0, 4));
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

  return (
    <SidebarLayout navItems={navItems} pageTitle="Dashboard">
      <div style={{ color: 'var(--text-body)' }}>

        {/* ── Hero banner ──────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          {/* Glow orbs */}
          <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 320, height: 320, background: 'radial-gradient(circle, rgba(79,142,247,0.18) 0%, transparent 65%)', borderRadius: '50%' }} />
          <div className="absolute pointer-events-none" style={{ bottom: -60, right: 80, width: 220, height: 220, background: 'radial-gradient(circle, rgba(0,229,160,0.1) 0%, transparent 65%)', borderRadius: '50%' }} />

          <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'rgba(79,142,247,0.8)' }}>
                {greeting}
              </div>
              <h1 className="font-jakarta font-bold text-[2rem] leading-tight mb-2" style={{ color: 'var(--text-strong)' }}>
                {user ? `${user.name?.split(' ')[0] ?? user.firstName}` : <span className="opacity-40">Loading…</span>}
              </h1>
              <p className="text-[13px]" style={{ color: 'var(--text-faint)' }}>
                Here's your learning overview for today.
              </p>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--border-soft)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}>
                  {tier.icon} {tier.label} Tier
                </span>
                {nextTier && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ color: 'var(--text-faint)' }}>
                    {nextTier.min.toLocaleString()} coins to {nextTier.label}
                  </span>
                )}
              </div>
            </div>

            {/* Coins spotlight */}
            <div className="flex flex-col items-end gap-1">
              <div className="font-jakarta font-bold text-[2.4rem] leading-none" style={{ color: '#F59E0B' }}>
                {coins.toLocaleString()}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(245,158,11,0.6)' }}>
                Merit Coins
              </div>
              {nextTier && (
                <div className="mt-2 w-32">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-strong)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${tierProgress}%`, background: 'linear-gradient(90deg, #F59E0B, #FCD34D)' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Metric row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mb-4 max-md:grid-cols-2">
          <MetricCard value={stats?.activeCourses ?? <span className="opacity-30 text-2xl">—</span>}        label="Active Courses"    sub="In progress"         accent="#4F8EF7" />
          <MetricCard value={portfolio?.stats?.projectCount ?? 0}                                            label="Portfolio"         sub="Projects published"  accent="#00E5A0" />
          <MetricCard value={stats?.jobApplications ?? 0}                                                    label="Applications"      sub="Jobs applied"        accent="#F59E0B" />
          <MetricCard value={portfolio?.stats?.certCount ?? 0}                                               label="Certificates"      sub="Verified"            accent="#DC2626" />
        </div>

        {/* ── Main 2-col grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-4 max-lg:grid-cols-1">

          {/* Active Courses */}
          <Card>
            <SectionHeader title="Active Courses" action="View all" href="/dashboard/courses" />
            {courses === null ? (
              <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <Skeleton key={i} h="h-10" />)}</div>
            ) : courses.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 grid place-items-center" style={{ background: 'rgba(79,142,247,0.1)' }}>
                  <BrandIcon name="fa-book-open" style={{ color: '#4F8EF7' }} />
                </div>
                <p className="text-[13px] mb-2" style={{ color: 'var(--text-faint)' }}>No active courses yet.</p>
                <a href="/dashboard/courses" className="text-[12px] font-semibold no-underline" style={{ color: '#4F8EF7' }}>Browse courses →</a>
              </div>
            ) : courses.map((c: any, i: number) => (
              <div key={c.id} className="flex items-center gap-3.5 py-3" style={{ borderBottom: i < courses.length - 1 ? '1px solid var(--surface-soft)' : 'none' }}>
                <div className="w-9 h-9 rounded-xl shrink-0 grid place-items-center text-[13px] font-bold text-ink-70"
                  style={{ background: COURSE_COLORS[i % COURSE_COLORS.length] + '22', border: `1px solid ${COURSE_COLORS[i % COURSE_COLORS.length]}30` }}>
                  {c.title?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink-85 truncate mb-1.5">{c.title}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-soft)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${c.progress}%`, background: COURSE_COLORS[i % COURSE_COLORS.length] }} />
                    </div>
                    <span className="text-[11px] font-semibold shrink-0" style={{ color: COURSE_COLORS[i % COURSE_COLORS.length] }}>{c.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Job Matches */}
          <Card>
            <SectionHeader title="Job Matches" action="Browse all" href="/dashboard/jobs" />

            {/* Tier notice */}
            <div className="mb-4 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: 'var(--border-subtle)', border: '1px solid var(--border-soft)' }}>
              <span className="text-[13px]">{tier.icon}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-faint)' }}>
                {tier.label} tier · {coins >= 5000 ? 'All jobs unlocked' : `Earn ${(nextTier?.min ?? 0) - coins} more coins to unlock ${nextTier?.label}`}
              </span>
            </div>

            {jobs === null ? (
              <div className="flex flex-col gap-3">{[1,2,3].map(i => <Skeleton key={i} h="h-14" />)}</div>
            ) : jobs.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 grid place-items-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <BrandIcon name="fa-briefcase" style={{ color: '#F59E0B' }} />
                </div>
                <p className="text-[13px] mb-2" style={{ color: 'var(--text-faint)' }}>No job matches yet.</p>
                <a href="/dashboard/jobs" className="text-[12px] font-semibold no-underline" style={{ color: '#4F8EF7' }}>Browse jobs →</a>
              </div>
            ) : jobs.map((job: any, i: number) => {
              const matchColor = job.match >= 85 ? '#00E5A0' : job.match >= 70 ? '#F59E0B' : '#F87171';
              return (
                <div key={job.id} className="flex items-center gap-3 py-3" style={{ borderBottom: i < jobs.length - 1 ? '1px solid var(--surface-soft)' : 'none' }}>
                  <div className="w-9 h-9 rounded-xl grid place-items-center text-[12px] shrink-0"
                    style={{ background: 'var(--surface-soft)', color: 'var(--text-faint)', border: '1px solid var(--border-soft)' }}>
                    <BrandIcon name="fa-building" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-ink-85 truncate">{job.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{job.company} · {job.location}</div>
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-[12px] font-bold" style={{ color: matchColor }}>{job.match}%</span>
                    <span className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-ghost)' }}>match</span>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* ── Bottom row: Quick actions + Portfolio + Activity ─────────── */}
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">

          {/* Quick Actions */}
          <Card>
            <SectionHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'fa-plus',          label: 'Enroll Course',    accent: '#4F8EF7', href: '/dashboard/courses' },
                { icon: 'fa-layer-group',   label: 'Add Project',      accent: '#00E5A0', href: '/dashboard/portfolio' },
                { icon: 'fa-graduation-cap',label: 'Connect Platform', accent: '#F59E0B', href: '/dashboard/platforms' },
                { icon: 'fa-paper-plane',   label: 'Browse Jobs',      accent: '#2563EB', href: '/dashboard/jobs' },
                { icon: 'fa-certificate',   label: 'Certificates',     accent: '#38BDF8', href: '/dashboard/certificates' },
                { icon: 'fa-coins',         label: 'Buy Coins',        accent: '#F59E0B', href: '/dashboard/rewards' },
              ].map(a => (
                <a key={a.label} href={a.href}
                  className="flex flex-col items-start gap-2.5 p-3 rounded-xl no-underline group transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--border-subtle)', border: '1px solid var(--surface-soft)' }}>
                  <div className="w-7 h-7 rounded-lg grid place-items-center text-[12px]"
                    style={{ background: a.accent + '18', color: a.accent }}>
                    <BrandIcon name={a.icon} />
                  </div>
                  <span className="text-[11px] font-medium leading-tight" style={{ color: 'var(--text-muted)' }}>{a.label}</span>
                </a>
              ))}
            </div>
          </Card>

          {/* Portfolio */}
          <Card>
            <SectionHeader title="Portfolio" action="Manage" href="/dashboard/portfolio" />
            {portfolio === null ? (
              <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} h="h-16" />)}</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Projects',    value: portfolio?.stats?.projectCount ?? 0, accent: '#4F8EF7' },
                  { label: 'Avg Score',   value: portfolio?.stats?.avgScore || '—',   accent: '#F59E0B' },
                  { label: 'Total Views', value: portfolio?.stats?.totalViews ?? 0,   accent: '#00E5A0' },
                  { label: 'Certs',       value: portfolio?.stats?.certCount ?? 0,    accent: '#DC2626' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                    style={{ background: 'var(--border-subtle)', border: '1px solid var(--surface-soft)' }}>
                    <span className="text-[12px]" style={{ color: 'var(--text-faint)' }}>{s.label}</span>
                    <span className="font-jakarta font-bold text-[15px]" style={{ color: s.accent }}>{s.value}</span>
                  </div>
                ))}

                {/* Platforms */}
                <div className="pt-2 mt-1" style={{ borderTop: '1px solid var(--surface-soft)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Platforms</span>
                    <a href="/dashboard/platforms" className="text-[11px] font-semibold no-underline" style={{ color: '#4F8EF7' }}>Connect →</a>
                  </div>
                  {platforms === null ? <Skeleton h="h-6" w="w-3/4" /> :
                    platforms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {platforms.map((p: any) => (
                          <span key={p.platform} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(0,229,160,0.1)', color: '#00E5A0', border: '1px solid rgba(0,229,160,0.2)' }}>
                            {p.platform}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <a href="/dashboard/platforms" className="flex items-center gap-2 p-2 rounded-lg no-underline transition-all hover:opacity-80"
                        style={{ background: 'rgba(79,142,247,0.08)', border: '1px dashed rgba(79,142,247,0.25)' }}>
                        <BrandIcon name="fa-plus" className="text-[11px]" style={{ color: '#4F8EF7' }} />
                        <span className="text-[11px] font-medium" style={{ color: '#4F8EF7' }}>Connect Udemy, Coursera & more</span>
                      </a>
                    )
                  }
                </div>
              </div>
            )}
          </Card>

          {/* Recent Activity — timeline style */}
          <Card>
            <SectionHeader title="Recent Activity" />
            {activity === null ? (
              <div className="flex flex-col gap-4">{[1,2,3,4].map(i => <Skeleton key={i} h="h-8" />)}</div>
            ) : activity.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px]" style={{ color: 'var(--text-faint)' }}>No recent activity.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-3.25 top-2 bottom-2 w-px" style={{ background: 'var(--border-soft)' }} />
                <div className="flex flex-col gap-0">
                  {activity.slice(0, 6).map((n: any, i: number) => {
                    const style = ACTIVITY_ICONS[n.icon] || ACTIVITY_ICONS[n.type] || { icon: 'fa-bell', color: '#6B7280' };
                    return (
                      <div key={n.id} className="flex items-start gap-3 py-3 pl-1 relative">
                        <div className="w-6 h-6 rounded-full grid place-items-center text-[10px] shrink-0 z-10 relative"
                          style={{ background: 'var(--surface)', border: `1px solid ${style.color}40`, color: style.color }}>
                          <BrandIcon name={style.icon} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>{n.message}</div>
                          <div className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-ghost)' }}>{timeAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

        </div>
      </div>
    </SidebarLayout>
  );
}
