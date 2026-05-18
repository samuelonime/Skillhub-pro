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

const HISTORY = [
  { icon: 'fa-book-open', color: '#5b4cf5', bg: '#f4f2ff', label: 'Completed Module 12: React Hooks', amount: +150, date: 'Today' },
  { icon: 'fa-certificate', color: '#10b981', bg: '#f0fdf4', label: 'Earned React Fundamentals certificate', amount: +500, date: 'Yesterday' },
  { icon: 'fa-paper-plane', color: '#3b82f6', bg: '#eff6ff', label: 'Applied to job at Paystack', amount: +50, date: '3 days ago' },
  { icon: 'fa-star', color: '#f59e0b', bg: '#fffbeb', label: 'Profile strength improved to 72%', amount: +100, date: '1 week ago' },
  { icon: 'fa-shopping-cart', color: '#ef4444', bg: '#fef2f2', label: 'Redeemed: Mock Interview Session', amount: -300, date: '2 weeks ago' },
  { icon: 'fa-book-open', color: '#5b4cf5', bg: '#f4f2ff', label: 'Completed Module 8: State Management', amount: +150, date: '2 weeks ago' },
];

const REWARDS = [
  { title: 'Premium Course Unlock', desc: 'Get any premium course for free', cost: 800, icon: 'fa-graduation-cap', color: '#5b4cf5', popular: true },
  { title: 'Mock Interview Session', desc: '1-hour session with a hiring expert', cost: 300, icon: 'fa-comments', color: '#10b981' },
  { title: 'Resume Review', desc: 'Expert review with feedback in 24h', cost: 200, icon: 'fa-file-alt', color: '#f59e0b' },
  { title: 'Profile Boost (7 days)', desc: 'Featured placement in employer searches', cost: 500, icon: 'fa-rocket', color: '#ef4444' },
  { title: 'Career Coaching (30min)', desc: 'One-on-one with a career advisor', cost: 600, icon: 'fa-user-tie', color: '#8b5cf6' },
  { title: 'LinkedIn Optimisation', desc: 'Expert LinkedIn profile review', cost: 250, icon: 'fa-linkedin', color: '#3b82f6' },
];

export default function RewardsPage() {
  const balance = 1250;

  return (
    <SidebarLayout navItems={navItems} pageTitle="Rewards">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">Merit Coins & Rewards</h1>
          <p className="text-[13.5px] text-[#6b6b8a]">Earn coins by learning and redeem them for career-boosting rewards.</p>
        </div>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl p-7 mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5b4cf5 0%, #7c3aed 100%)' }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: -60, right: -60, width: 220, height: 220, background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ bottom: -40, right: 80, width: 140, height: 140, background: 'rgba(255,255,255,0.05)' }} />
        <div className="relative z-[1] flex items-center justify-between flex-wrap gap-5">
          <div>
            <p className="text-white/70 text-sm mb-1">Your Merit Coin Balance</p>
            <div className="flex items-center gap-2.5">
              <i className="fas fa-coins text-[#fbbf24] text-4xl" />
              <span className="font-syne font-extrabold text-[52px] text-white tracking-tight leading-none">{balance.toLocaleString()}</span>
            </div>
            <p className="text-white/60 text-xs mt-1">≈ ₦{(balance * 5).toLocaleString()} in value</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="font-syne font-bold text-xl text-white">+1,550</div>
              <div className="text-white/60 text-xs mt-0.5">Earned this month</div>
            </div>
            <div className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="font-syne font-bold text-xl text-white">-300</div>
              <div className="text-white/60 text-xs mt-0.5">Redeemed this month</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 max-[1100px]:grid-cols-1">
        {/* Redeem rewards */}
        <div>
          <h2 className="font-syne font-bold text-[15px] mb-4">Redeem Rewards</h2>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {REWARDS.map(r => {
              const canAfford = balance >= r.cost;
              return (
                <div key={r.title} className="bg-white rounded-2xl p-4 border border-[#e8e8f0] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-all relative">
                  {r.popular && <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5b4cf5] text-white">Popular</span>}
                  <div className="w-11 h-11 rounded-xl grid place-items-center text-lg mb-3" style={{ background: r.color + '18', color: r.color }}>
                    <i className={`fas ${r.icon}`} />
                  </div>
                  <h3 className="font-syne font-bold text-[14px] tracking-tight mb-0.5">{r.title}</h3>
                  <p className="text-xs text-[#6b6b8a] mb-3">{r.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <i className="fas fa-coins text-[#f59e0b] text-xs" />
                      <span className="text-sm font-bold text-[#f59e0b]">{r.cost}</span>
                    </div>
                    <button
                      disabled={!canAfford}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                      style={{ background: canAfford ? r.color : '#9898b8' }}
                    >
                      {canAfford ? 'Redeem' : 'Not enough'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] h-fit">
          <h2 className="font-syne font-bold text-[15px] mb-4">Transaction History</h2>
          {HISTORY.map((h, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-[#f0f0f8] last:border-0">
              <div className="w-8 h-8 rounded-lg grid place-items-center text-xs flex-shrink-0" style={{ background: h.bg, color: h.color }}>
                <i className={`fas ${h.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#2d2d42] leading-snug">{h.label}</div>
                <div className="text-[11px] text-[#9898b8] mt-0.5">{h.date}</div>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${h.amount > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {h.amount > 0 ? '+' : ''}{h.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
