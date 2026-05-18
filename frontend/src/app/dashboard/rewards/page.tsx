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

const REWARD_COLORS: Record<string, string> = {
  'graduation-cap': '#5b4cf5',
  star: '#f59e0b',
  'file-alt': '#f59e0b',
  comments: '#10b981',
  tshirt: '#3b82f6',
  award: '#ef4444',
  rocket: '#ef4444',
  'user-tie': '#8b5cf6',
  linkedin: '#3b82f6',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
}

export default function RewardsPage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [rewardsRes, txRes] = await Promise.all([
        apiFetch('/rewards'),
        apiFetch('/rewards/transactions'),
      ]);
      if (rewardsRes.success) {
        setCatalog(rewardsRes.data.catalog || []);
        setBalance(rewardsRes.data.balance || 0);
      }
      if (txRes.success) setTransactions(txRes.data.slice(0, 10));
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function redeem(rewardId: string, rewardName: string) {
    setRedeeming(rewardId);
    try {
      const res = await apiFetch(`/rewards/${rewardId}/redeem`, { method: 'POST' });
      if (res.success) {
        setToast(`${rewardName} redeemed successfully!`);
        load();
      } else {
        setToast(res.message || 'Redemption failed');
      }
    } catch { setToast('Redemption failed'); }
    finally {
      setRedeeming(null);
      setTimeout(() => setToast(''), 3000);
    }
  }

  const earned = transactions.filter(t => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
  const redeemed = Math.abs(transactions.filter(t => t.amount < 0).reduce((s: number, t: any) => s + t.amount, 0));

  return (
    <SidebarLayout navItems={navItems} pageTitle="Rewards">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0a0a0f] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

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
              <span className="font-syne font-extrabold text-[52px] text-white tracking-tight leading-none">
                {loading ? '—' : balance.toLocaleString()}
              </span>
            </div>
            <p className="text-white/60 text-xs mt-1">≈ ₦{(balance * 5).toLocaleString()} in value</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="font-syne font-bold text-xl text-white">+{earned.toLocaleString()}</div>
              <div className="text-white/60 text-xs mt-0.5">Earned (history)</div>
            </div>
            <div className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="font-syne font-bold text-xl text-white">-{redeemed.toLocaleString()}</div>
              <div className="text-white/60 text-xs mt-0.5">Redeemed (history)</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#5b4cf5]/30 border-t-[#5b4cf5] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_320px] gap-4 max-[1100px]:grid-cols-1">
          {/* Redeem rewards */}
          <div>
            <h2 className="font-syne font-bold text-[15px] mb-4">Redeem Rewards</h2>
            <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
              {catalog.map((r: any) => {
                const canAfford = balance >= r.cost;
                const color = REWARD_COLORS[r.icon] || '#5b4cf5';
                return (
                  <div key={r.id} className="bg-white rounded-2xl p-4 border border-[#e8e8f0] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-all relative">
                    {r.popular && <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5b4cf5] text-white">Popular</span>}
                    <div className="w-11 h-11 rounded-xl grid place-items-center text-lg mb-3" style={{ background: color + '18', color }}>
                      <i className={`fas fa-${r.icon}`} />
                    </div>
                    <h3 className="font-syne font-bold text-[14px] tracking-tight mb-0.5">{r.name}</h3>
                    <p className="text-xs text-[#6b6b8a] mb-3">{r.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <i className="fas fa-coins text-[#f59e0b] text-xs" />
                        <span className="text-sm font-bold text-[#f59e0b]">{r.cost}</span>
                      </div>
                      <button
                        disabled={!canAfford || redeeming === r.id}
                        onClick={() => canAfford && redeem(r.id, r.name)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                        style={{ background: canAfford ? color : '#9898b8' }}
                      >
                        {redeeming === r.id ? '…' : canAfford ? 'Redeem' : 'Not enough'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction history */}
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] h-fit">
            <h2 className="font-syne font-bold text-[15px] mb-4">Transaction History</h2>
            {transactions.length === 0 ? (
              <p className="text-sm text-[#9898b8]">No transactions yet. Complete courses to earn coins!</p>
            ) : transactions.map((t: any, i: number) => (
              <div key={t.id || i} className="flex items-start gap-3 py-3 border-b border-[#f0f0f8] last:border-0">
                <div className={`w-8 h-8 rounded-lg grid place-items-center text-xs flex-shrink-0 ${t.amount > 0 ? 'bg-[#f0fdf4] text-[#22c55e]' : 'bg-[#fef2f2] text-[#ef4444]'}`}>
                  <i className={`fas fa-${t.amount > 0 ? 'arrow-up' : 'arrow-down'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#2d2d42] leading-snug truncate">{t.description}</div>
                  <div className="text-[11px] text-[#9898b8] mt-0.5">{t.createdAt ? timeAgo(t.createdAt) : ''}</div>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${t.amount > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
