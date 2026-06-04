'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/portfolio', icon: 'fa-layer-group', label: 'Portfolio' },
  { href: '/dashboard/platforms', icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

const REWARD_COLORS: Record<string, string> = {
  'graduation-cap': '#5b4cf5', star: '#f59e0b', 'file-alt': '#f59e0b',
  comments: '#10b981', tshirt: '#3b82f6', award: '#ef4444', rocket: '#ef4444',
  'user-tie': '#8b5cf6', linkedin: '#3b82f6',
};

// Prices: NGN processed via Paystack · USD shown as ~equivalent at ₦1,600/USD
const COIN_BUNDLES = [
  { key: 'coins_500',  coins: 500,  priceNGN: '₦1,000',  priceUSD: '~$0.63', amount: 100000, label: 'Starter Pack',    popular: false, bonus: '',         color: '#6b6b8a', desc: 'Perfect for getting started' },
  { key: 'coins_1500', coins: 1500, priceNGN: '₦2,500',  priceUSD: '~$1.56', amount: 250000, label: 'Growth Pack',     popular: true,  bonus: '+50 free',  color: '#5b4cf5', desc: 'Most popular — best value' },
  { key: 'coins_5000', coins: 5000, priceNGN: '₦7,000',  priceUSD: '~$4.38', amount: 700000, label: 'Premium Pack',    popular: false, bonus: '+300 free', color: '#f59e0b', desc: 'Unlocks all job opportunities' },
];

const MERIT_TIERS = [
  { min: 0,    max: 499,  label: 'Bronze',   icon: '🥉', color: '#92400e', bg: '#fef3c7', perks: ['Entry-level job listings', 'Basic course access'] },
  { min: 500,  max: 1999, label: 'Silver',   icon: '🥈', color: '#6b7280', bg: '#f5f5fb', perks: ['Mid-level job listings', 'Priority course enrollment', '+10% coin earn rate'] },
  { min: 2000, max: 4999, label: 'Gold',     icon: '🥇', color: '#d97706', bg: '#fffbeb', perks: ['Senior & featured jobs', 'Employer shortlisting boost', '+25% coin earn rate', 'Portfolio featured badge'] },
  { min: 5000, max: Infinity, label: 'Platinum', icon: '💎', color: '#7c3aed', bg: '#f4f2ff', perks: ['ALL job listings incl. enterprise', 'Top of employer search results', '+50% coin earn rate', 'Verified badge on profile', 'Direct employer messages'] },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
}

function BuyCoinsModal({ onClose, onSuccess, userEmail }: any) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function purchase() {
    if (!selected) return;
    const bundle = COIN_BUNDLES.find(b => b.key === selected)!;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/payment/initiate', {
        method: 'POST',
        body: JSON.stringify({
          purpose: 'merit_coins',
          planOrBundle: selected,
          callbackUrl: `${window.location.origin}/dashboard/rewards?payment=success`,
        }),
      });
      if (res.success && res.data?.authorizationUrl) {
        window.location.href = res.data.authorizationUrl;
      } else {
        setError(res.message || 'Payment initiation failed');
      }
    } catch (e: any) {
      setError(e.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-syne font-bold text-[17px]">Buy Merit Coins</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] hover:bg-[#f4f2ff] hover:text-[#5b4cf5] transition-all grid place-items-center">
            <i className="fas fa-times" />
          </button>
        </div>
        <p className="text-sm text-[#6b6b8a] mb-5">Secure payment via Paystack. Coins are added instantly after payment confirmation.</p>

        {error && <div className="mb-4 p-3 bg-[#fef2f2] text-[#ef4444] text-sm rounded-xl">{error}</div>}

        <div className="flex flex-col gap-3 mb-5">
          {COIN_BUNDLES.map(bundle => (
            <button
              key={bundle.key}
              onClick={() => setSelected(bundle.key)}
              className={`w-full p-4 rounded-2xl border-2 text-left cursor-pointer transition-all font-[inherit] ${selected === bundle.key ? 'border-[#5b4cf5] bg-[#f4f2ff]' : 'border-[#e8e8f0] bg-white hover:border-[#5b4cf5]/40'}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: bundle.color + '18' }}>
                    <i className="fas fa-coins text-lg" style={{ color: bundle.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-syne font-bold text-[15px]">{bundle.coins.toLocaleString()} Coins</span>
                      {bundle.bonus && <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full bg-[#22c55e]">{bundle.bonus}</span>}
                      {bundle.popular && <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full bg-[#5b4cf5]">Popular</span>}
                    </div>
                    <div className="text-xs text-[#6b6b8a]">{bundle.label} — {bundle.desc}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-syne font-bold text-[16px]" style={{ color: bundle.color }}>{bundle.priceNGN}</div>
                  <div className="text-[11px] text-[#9898b8] font-medium">{bundle.priceUSD}</div>
                  <div className="text-[10px] text-[#9898b8]">one-time</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4 p-3 bg-[#f5f5fb] rounded-xl">
          <i className="fas fa-lock text-[#22c55e] text-sm" />
          <span className="text-xs text-[#6b6b8a]">Secured by <strong>Paystack</strong> · SSL encrypted · Instant delivery</span>
        </div>

        <button
          disabled={!selected || loading}
          onClick={purchase}
          className="w-full py-3 bg-[#5b4cf5] text-white rounded-xl font-semibold text-sm border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <span><i className="fas fa-spinner fa-spin mr-2" />Processing…</span> : 'Pay with Paystack →'}
        </button>
      </div>
    </div>
  );
}

export default function RewardsPage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [buyModal, setBuyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'redeem' | 'buy' | 'tiers'>('redeem');

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

  useEffect(() => {
    load();
    // Check for payment success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setToast('Payment successful! Verifying your coins…');
      window.history.replaceState({}, '', '/dashboard/rewards');
    }
  }, []);

  async function redeem(rewardId: string, rewardName: string) {
    setRedeeming(rewardId);
    try {
      const res = await apiFetch(`/rewards/${rewardId}/redeem`, { method: 'POST' });
      if (res.success) { setToast(`${rewardName} redeemed successfully!`); load(); }
      else setToast(res.message || 'Redemption failed');
    } catch { setToast('Redemption failed'); }
    finally { setRedeeming(null); setTimeout(() => setToast(''), 3000); }
  }

  const earned = transactions.filter(t => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
  const redeemed = Math.abs(transactions.filter(t => t.amount < 0).reduce((s: number, t: any) => s + t.amount, 0));
  const currentTier = MERIT_TIERS.find(t => balance >= t.min && balance <= t.max) || MERIT_TIERS[0];
  const nextTier = MERIT_TIERS.find(t => t.min > balance);

  return (
    <SidebarLayout navItems={navItems} pageTitle="Rewards">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0a0a0f] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <i className="fas fa-check-circle text-[#22c55e]" />{toast}
        </div>
      )}
      {buyModal && (
        <BuyCoinsModal onClose={() => setBuyModal(false)} onSuccess={() => { setBuyModal(false); load(); }} />
      )}

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-[18px] sm:text-[21px] tracking-tight mb-0.5">Merit Coins & Rewards</h1>
          <p className="text-[13.5px] text-[#6b6b8a]">Earn coins by learning, buy more, and unlock top job opportunities.</p>
        </div>
        <button
          onClick={() => setBuyModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(91,76,245,0.3)] transition-all"
        >
          <i className="fas fa-coins" />Buy Merit Coins
        </button>
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
              <span className="font-syne font-extrabold text-[36px] sm:text-[52px] text-white tracking-tight leading-none">
                {loading ? '—' : balance.toLocaleString()}
              </span>
            </div>
            <p className="text-white/60 text-xs mt-1">≈ ₦{(balance * 5).toLocaleString()} · ~${((balance * 5) / 1600).toFixed(2)} USD in value</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <span className="text-lg">{currentTier.icon}</span>
              <span className="text-white font-bold text-sm">{currentTier.label} Tier</span>
            </div>
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
        {nextTier && (
          <div className="relative z-[1] mt-5">
            <div className="flex items-center justify-between text-white/70 text-xs mb-1.5">
              <span>{currentTier.label}</span>
              <span>{nextTier.min.toLocaleString()} coins → {nextTier.label} {nextTier.icon}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, ((balance - currentTier.min) / (nextTier.min - currentTier.min)) * 100)}%`, background: 'rgba(255,255,255,0.8)' }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl w-full sm:w-fit mb-6 border border-[#e8e8f0] overflow-x-auto">
        {([['redeem', 'Redeem Rewards'], ['buy', 'Buy Coins'], ['tiers', 'Merit Tiers']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer transition-all border-0 whitespace-nowrap ${activeTab === t ? 'bg-white text-[#0a0a0f] font-semibold shadow-[0_1px_5px_rgba(0,0,0,0.09)]' : 'bg-transparent text-[#6b6b8a]'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#5b4cf5]/30 border-t-[#5b4cf5] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Redeem Tab */}
          {activeTab === 'redeem' && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
              <div>
                <h2 className="font-syne font-bold text-[15px] mb-4">Redeem Rewards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Buy Tab */}
          {activeTab === 'buy' && (
            <div className="max-w-2xl">
              <h2 className="font-syne font-bold text-[15px] mb-2">Buy Merit Coins via Paystack</h2>
              <p className="text-sm text-[#6b6b8a] mb-5">Coins are added instantly after Paystack confirms your payment. No subscriptions — one-time purchases.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {COIN_BUNDLES.map(bundle => (
                  <div key={bundle.key} className={`bg-white rounded-2xl p-5 border-2 ${bundle.popular ? 'border-[#5b4cf5]' : 'border-[#e8e8f0]'} relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all`}>
                    {bundle.popular && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#5b4cf5]" />
                    )}
                    {bundle.popular && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5b4cf5] text-white">Most Popular</span>
                    )}
                    <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl mb-3" style={{ background: bundle.color + '15' }}>
                      <i className="fas fa-coins" style={{ color: bundle.color }} />
                    </div>
                    <div className="font-syne font-bold text-[15px] mb-0.5">{bundle.label}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-syne font-extrabold text-[22px]" style={{ color: bundle.color }}>{bundle.coins.toLocaleString()}</span>
                      <span className="text-xs text-[#6b6b8a]">coins</span>
                      {bundle.bonus && <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full bg-[#22c55e]">{bundle.bonus}</span>}
                    </div>
                    <p className="text-xs text-[#6b6b8a] mb-4">{bundle.desc}</p>
                    <div className="font-syne font-bold text-xl" style={{ color: bundle.color }}>{bundle.priceNGN}</div>
                    <div className="text-sm font-semibold text-[#9898b8] mb-4">{bundle.priceUSD} USD</div>
                    <button
                      onClick={() => setBuyModal(true)}
                      className="w-full py-2.5 text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all hover:-translate-y-px text-white"
                      style={{ background: bundle.color === '#6b6b8a' ? '#6b6b8a' : bundle.color }}
                    >
                      Buy Now
                    </button>
                  </div>
                ))}
              </div>
              <div className="bg-[#f5f5fb] rounded-2xl p-5 flex items-center gap-4">
                <i className="fas fa-shield-alt text-[#5b4cf5] text-2xl flex-shrink-0" />
                <div>
                  <div className="font-syne font-bold text-[14px] mb-0.5">Secure payments via Paystack</div>
                  <p className="text-xs text-[#6b6b8a]">All transactions are SSL-encrypted and processed by Paystack in NGN. USD prices shown are approximate at ₦1,600/USD. Coins are credited instantly after payment confirmation.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tiers Tab */}
          {activeTab === 'tiers' && (
            <div>
              <h2 className="font-syne font-bold text-[15px] mb-2">Merit Tiers & Job Unlocks</h2>
              <p className="text-sm text-[#6b6b8a] mb-5">Students with higher Merit Coins are automatically shown bigger and better job opportunities in their dashboard.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MERIT_TIERS.map(tier => {
                  const isCurrent = balance >= tier.min && balance <= tier.max;
                  return (
                    <div key={tier.label} className={`bg-white rounded-2xl p-5 border-2 transition-all ${isCurrent ? 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]' : 'border-[#e8e8f0]'}`}
                      style={{ borderColor: isCurrent ? tier.color : undefined }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl" style={{ background: tier.bg }}>
                            {tier.icon}
                          </div>
                          <div>
                            <div className="font-syne font-bold text-[15px]" style={{ color: tier.color }}>{tier.label}</div>
                            <div className="text-xs text-[#6b6b8a]">{tier.min.toLocaleString()}{tier.max === Infinity ? '+' : `–${tier.max.toLocaleString()}`} coins</div>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full" style={{ background: tier.color }}>Current</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {tier.perks.map(perk => (
                          <div key={perk} className="flex items-center gap-2 text-sm">
                            <i className="fas fa-check-circle text-xs" style={{ color: tier.color }} />
                            <span className="text-[#2d2d42]">{perk}</span>
                          </div>
                        ))}
                      </div>
                      {!isCurrent && balance < tier.min && (
                        <button onClick={() => setBuyModal(true)}
                          className="mt-4 w-full py-2 text-xs font-semibold rounded-xl border-0 cursor-pointer transition-all text-white hover:-translate-y-px"
                          style={{ background: tier.color }}>
                          Get {(tier.min - balance).toLocaleString()} more coins to unlock
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </SidebarLayout>
  );
}