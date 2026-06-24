'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',             icon: 'fa-home',          label: 'Dashboard' },
  { href: '/dashboard/courses',     icon: 'fa-book-open',     label: 'Courses' },
  {
    icon: 'fa-sparkles',
    label: 'Next Generation',
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
  { href: '/dashboard/resume',        icon: 'fa-file-lines',           label: 'Resume' },
  { href: '/dashboard/platforms',   icon: 'fa-graduation-cap',label: 'Learning Platforms' },
  { href: '/dashboard/jobs',        icon: 'fa-briefcase',     label: 'Jobs' },
  { href: '/dashboard/certificates',icon: 'fa-certificate',   label: 'Certificates' },
  { href: '/dashboard/rewards',     icon: 'fa-coins',         label: 'Rewards' },
  { href: '/dashboard/settings',    icon: 'fa-gear',          label: 'Settings' },
];

const REWARD_COLORS: Record<string, string> = {
  'graduation-cap': '#4F8EF7', star: '#F59E0B', 'file-alt': '#F59E0B',
  comments: '#00E5A0', tshirt: '#4F8EF7', award: '#EF4444', rocket: '#EF4444',
  'user-tie': '#A78BFA', linkedin: '#4F8EF7',
};

// Prices: NGN processed via Paystack · USD shown as ~equivalent at ₦1,600/USD
const COIN_BUNDLES = [
  { key: 'coins_500',  coins: 500,  priceNGN: '₦1,000',  priceUSD: '~$0.63', amount: 100000, label: 'Starter Pack',    popular: false, bonus: '',         color: '#6B7280', desc: 'Perfect for getting started' },
  { key: 'coins_1500', coins: 1500, priceNGN: '₦2,500',  priceUSD: '~$1.56', amount: 250000, label: 'Growth Pack',     popular: true,  bonus: '+50 free',  color: '#4F8EF7', desc: 'Most popular — best value' },
  { key: 'coins_5000', coins: 5000, priceNGN: '₦7,000',  priceUSD: '~$4.38', amount: 700000, label: 'Premium Pack',    popular: false, bonus: '+300 free', color: '#F59E0B', desc: 'Unlocks all job opportunities' },
];

const MERIT_TIERS = [
  { min: 0,    max: 499,  label: 'Bronze',   icon: '🥉', color: '#CD7C54', bg: 'rgba(205,124,84,0.12)', perks: ['Entry-level job listings', 'Basic course access'] },
  { min: 500,  max: 1999, label: 'Silver',   icon: '🥈', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', perks: ['Mid-level job listings', 'Priority course enrollment', '+10% coin earn rate'] },
  { min: 2000, max: 4999, label: 'Gold',     icon: '🥇', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', perks: ['Senior & featured jobs', 'Employer shortlisting boost', '+25% coin earn rate', 'Portfolio featured badge'] },
  { min: 5000, max: Infinity, label: 'Platinum', icon: '💎', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', perks: ['ALL job listings incl. enterprise', 'Top of employer search results', '+50% coin earn rate', 'Verified badge on profile', 'Direct employer messages'] },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
}

type PaymentMode = 'ngn_card' | 'ngn_transfer' | 'usd_card';

const PAYMENT_MODES: { key: PaymentMode; icon: string; label: string; sub: string; color: string }[] = [
  { key: 'ngn_card',     icon: 'fa-credit-card',     label: 'Pay in Naira — Card',     sub: 'Debit/credit card, charged in ₦',       color: '#4F8EF7' },
  { key: 'ngn_transfer', icon: 'fa-university',       label: 'Pay in Naira — Transfer',  sub: 'Bank transfer to virtual account in ₦',  color: '#00E5A0' },
  { key: 'usd_card',     icon: 'fa-dollar-sign',      label: 'Pay in USD — Card',        sub: 'International card, charged in $',       color: '#F59E0B' },
];

function BuyCoinsModal({ onClose, onSuccess, userEmail }: any) {
  const [selected, setSelected] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('ngn_card');
  const [step, setStep] = useState<'bundle' | 'method'>('bundle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function purchase() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/payment/initiate', {
        method: 'POST',
        body: JSON.stringify({
          purpose: 'merit_coins',
          planOrBundle: selected,
          paymentMode,
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

  const selectedBundle = COIN_BUNDLES.find(b => b.key === selected);
  const selectedMode   = PAYMENT_MODES.find(m => m.key === paymentMode)!;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.09)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {step === 'method' && (
              <button onClick={() => setStep('bundle')} className="w-7 h-7 rounded-lg border-0 cursor-pointer grid place-items-center transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                <i className="fas fa-arrow-left text-xs" />
              </button>
            )}
            <h3 className="font-jakarta font-bold text-[17px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {step === 'bundle' ? 'Buy Merit Coins' : 'Choose Payment Method'}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border-0 cursor-pointer grid place-items-center transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-2 mb-5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${step === 'bundle' ? 'text-white' : ''}`} style={step === 'bundle' ? { background: '#4F8EF7' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>1 · Select Bundle</span>
          <i className="fas fa-chevron-right text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${step === 'method' ? 'text-white' : ''}`} style={step === 'method' ? { background: '#4F8EF7' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>2 · Payment Method</span>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

        {/* ── Step 1: Bundle selection ── */}
        {step === 'bundle' && (
          <>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>Choose how many coins you want to buy.</p>
            <div className="flex flex-col gap-3 mb-5">
              {COIN_BUNDLES.map(bundle => (
                <button
                  key={bundle.key}
                  onClick={() => setSelected(bundle.key)}
                  className={`w-full p-4 rounded-2xl border-2 text-left cursor-pointer transition-all font-[inherit] ${selected === bundle.key ? 'border-[#4F8EF7]' : 'border-transparent'}`}
                  style={selected === bundle.key ? { background: 'rgba(79,142,247,0.08)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: bundle.color + '18' }}>
                        <i className="fas fa-coins text-lg" style={{ color: bundle.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-jakarta font-bold text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{bundle.coins.toLocaleString()} Coins</span>
                          {bundle.bonus && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#00E5A0', color: '#000' }}>{bundle.bonus}</span>}
                          {bundle.popular && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#4F8EF7', color: 'white' }}>Popular</span>}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{bundle.label} — {bundle.desc}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-jakarta font-bold text-[16px]" style={{ color: bundle.color }}>{bundle.priceNGN}</div>
                      <div className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{bundle.priceUSD} USD</div>
                      <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>one-time</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              disabled={!selected}
              onClick={() => setStep('method')}
              className="w-full py-3 rounded-xl font-semibold text-sm border-0 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#4F8EF7', color: 'white' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; }}
            >
              Continue →
            </button>
          </>
        )}

        {/* ── Step 2: Payment method ── */}
        {step === 'method' && selectedBundle && (
          <>
            {/* Selected bundle recap */}
            <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: selectedBundle.color + '18' }}>
                <i className="fas fa-coins" style={{ color: selectedBundle.color }} />
              </div>
              <div className="flex-1">
                <div className="font-jakarta font-bold text-[14px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{selectedBundle.coins.toLocaleString()} Coins — {selectedBundle.label}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{selectedBundle.priceNGN} · {selectedBundle.priceUSD} USD</div>
              </div>
              <button onClick={() => setStep('bundle')} className="text-xs font-semibold cursor-pointer bg-transparent border-0" style={{ color: '#4F8EF7' }}>Change</button>
            </div>

            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>How would you like to pay?</p>

            <div className="flex flex-col gap-3 mb-5">
              {PAYMENT_MODES.map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setPaymentMode(mode.key)}
                  className={`w-full p-4 rounded-2xl border-2 text-left cursor-pointer transition-all font-[inherit] ${paymentMode === mode.key ? 'border-[#4F8EF7]' : 'border-transparent'}`}
                  style={paymentMode === mode.key ? { background: 'rgba(79,142,247,0.08)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0" style={{ background: mode.color + '18' }}>
                      <i className={`fas ${mode.icon}`} style={{ color: mode.color }} />
                    </div>
                    <div>
                      <div className="font-jakarta font-bold text-[14px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{mode.label}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{mode.sub}</div>
                    </div>
                    {paymentMode === mode.key && (
                      <i className="fas fa-check-circle ml-auto" style={{ color: '#4F8EF7' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Amount preview */}
            <div className="flex items-center justify-between p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>You will be charged</span>
              <span className="font-jakarta font-bold text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {paymentMode === 'usd_card' ? selectedBundle.priceUSD.replace('~', '') + ' USD' : selectedBundle.priceNGN + ' NGN'}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <i className="fas fa-lock text-[#00E5A0] text-sm" />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Secured by <strong>Paystack</strong> · SSL encrypted · Instant delivery</span>
            </div>

            <button
              disabled={loading}
              onClick={purchase}
              className="w-full py-3 rounded-xl font-semibold text-sm border-0 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{ background: selectedMode.color }}
            >
              {loading
                ? <span><i className="fas fa-spinner fa-spin mr-2" />Processing…</span>
                : `Pay ${paymentMode === 'usd_card' ? selectedBundle.priceUSD.replace('~', '') + ' USD' : selectedBundle.priceNGN} via Paystack →`
              }
            </button>
          </>
        )}
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
        <div className="fixed top-5 right-5 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2" style={{ background: '#0F1521', border: '1px solid rgba(79,142,247,0.3)' }}>
          <i className="fas fa-check-circle" style={{ color: '#00E5A0' }} />{toast}
        </div>
      )}
      {buyModal && (
        <BuyCoinsModal onClose={() => setBuyModal(false)} onSuccess={() => { setBuyModal(false); load(); }} />
      )}

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-jakarta font-bold text-[18px] sm:text-[21px] tracking-tight mb-0.5" style={{ color: '#FFFFFF' }}>Merit Coins & Rewards</h1>
          <p className="text-[13.5px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Earn coins by learning, buy more, and unlock top job opportunities.</p>
        </div>
        <button
          onClick={() => setBuyModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
          style={{ background: '#4F8EF7', color: 'white' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
        >
          <i className="fas fa-coins" />Buy Merit Coins
        </button>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl p-7 mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #0A1628 100%)', border: '1px solid rgba(79,142,247,0.15)' }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: -60, right: -60, width: 220, height: 220, background: 'rgba(79,142,247,0.08)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ bottom: -40, right: 80, width: 140, height: 140, background: 'rgba(0,229,160,0.05)' }} />
        <div className="relative z-[1] flex items-center justify-between flex-wrap gap-5">
          <div>
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Your Merit Coin Balance</p>
            <div className="flex items-center gap-2.5">
              <i className="fas fa-coins text-[#F59E0B] text-4xl" />
              <span className="font-jakarta font-extrabold text-[36px] sm:text-[52px] tracking-tight leading-none" style={{ color: '#FFFFFF' }}>
                {loading ? '—' : balance.toLocaleString()}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>≈ ₦{(balance * 5).toLocaleString()} · ~${((balance * 5) / 1600).toFixed(2)} USD in value</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-lg">{currentTier.icon}</span>
              <span className="font-bold text-sm" style={{ color: currentTier.color }}>{currentTier.label} Tier</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="font-jakarta font-bold text-xl" style={{ color: '#00E5A0' }}>+{earned.toLocaleString()}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Earned (history)</div>
            </div>
            <div className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="font-jakarta font-bold text-xl" style={{ color: '#F59E0B' }}>-{redeemed.toLocaleString()}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Redeemed (history)</div>
            </div>
          </div>
        </div>
        {nextTier && (
          <div className="relative z-[1] mt-5">
            <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <span>{currentTier.label}</span>
              <span>{nextTier.min.toLocaleString()} coins → {nextTier.label} {nextTier.icon}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, ((balance - currentTier.min) / (nextTier.min - currentTier.min)) * 100)}%`, background: 'linear-gradient(90deg, #4F8EF7, #A78BFA)' }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-full sm:w-fit mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([['redeem', 'Redeem Rewards'], ['buy', 'Buy Coins'], ['tiers', 'Merit Tiers']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer transition-all border-0 whitespace-nowrap ${
              activeTab === t 
                ? 'font-semibold shadow-[0_1px_5px_rgba(0,0,0,0.09)]' 
                : 'bg-transparent'
            }`}
            style={activeTab === t ? { background: '#0F1521', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.09)' } : { color: 'rgba(255,255,255,0.45)' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#4F8EF7]/30 border-t-[#4F8EF7] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Redeem Tab */}
          {activeTab === 'redeem' && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
              <div>
                <h2 className="font-jakarta font-bold text-[15px] mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>Redeem Rewards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catalog.map((r: any) => {
                    const canAfford = balance >= r.cost;
                    const color = REWARD_COLORS[r.icon] || '#4F8EF7';
                    return (
                      <div key={r.id} className="rounded-2xl p-4 transition-all relative" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {r.popular && <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#4F8EF7', color: 'white' }}>Popular</span>}
                        <div className="w-11 h-11 rounded-xl grid place-items-center text-lg mb-3" style={{ background: color + '18', color }}>
                          <i className={`fas fa-${r.icon}`} />
                        </div>
                        <h3 className="font-jakarta font-bold text-[14px] tracking-tight mb-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{r.name}</h3>
                        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <i className="fas fa-coins text-[#F59E0B] text-xs" />
                            <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>{r.cost}</span>
                          </div>
                          <button
                            disabled={!canAfford || redeeming === r.id}
                            onClick={() => canAfford && redeem(r.id, r.name)}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                            style={{ background: canAfford ? color : 'rgba(255,255,255,0.1)' }}
                          >
                            {redeeming === r.id ? '…' : canAfford ? 'Redeem' : 'Not enough'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl p-5 h-fit" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 className="font-jakarta font-bold text-[15px] mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>Transaction History</h2>
                {transactions.length === 0 ? (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No transactions yet. Complete courses to earn coins!</p>
                ) : transactions.map((t: any, i: number) => (
                  <div key={t.id || i} className="flex items-start gap-3 py-3" style={{ borderBottom: i < transactions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div className={`w-8 h-8 rounded-lg grid place-items-center text-xs flex-shrink-0 ${t.amount > 0 ? 'text-[#00E5A0]' : 'text-[#EF4444]'}`} style={{ background: t.amount > 0 ? 'rgba(0,229,160,0.1)' : 'rgba(239,68,68,0.1)' }}>
                      <i className={`fas fa-${t.amount > 0 ? 'arrow-up' : 'arrow-down'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] leading-snug truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{t.description}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.createdAt ? timeAgo(t.createdAt) : ''}</div>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${t.amount > 0 ? 'text-[#00E5A0]' : 'text-[#EF4444]'}`}>
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
              <h2 className="font-jakarta font-bold text-[15px] mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>Buy Merit Coins via Paystack</h2>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>Coins are added instantly after Paystack confirms your payment. No subscriptions — one-time purchases.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {COIN_BUNDLES.map(bundle => (
                  <div key={bundle.key} className={`rounded-2xl p-5 border-2 relative overflow-hidden transition-all`} style={bundle.popular ? { background: '#0F1521', borderColor: '#4F8EF7' } : { background: '#0F1521', borderColor: 'rgba(255,255,255,0.07)' }}>
                    {bundle.popular && (
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#4F8EF7' }} />
                    )}
                    {bundle.popular && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#4F8EF7', color: 'white' }}>Most Popular</span>
                    )}
                    <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl mb-3" style={{ background: bundle.color + '15' }}>
                      <i className="fas fa-coins" style={{ color: bundle.color }} />
                    </div>
                    <div className="font-jakarta font-bold text-[15px] mb-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{bundle.label}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-jakarta font-extrabold text-[22px]" style={{ color: bundle.color }}>{bundle.coins.toLocaleString()}</span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>coins</span>
                      {bundle.bonus && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#00E5A0', color: '#000' }}>{bundle.bonus}</span>}
                    </div>
                    <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{bundle.desc}</p>
                    <div className="font-jakarta font-bold text-xl" style={{ color: bundle.color }}>{bundle.priceNGN}</div>
                    <div className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{bundle.priceUSD} USD</div>
                    <button
                      onClick={() => setBuyModal(true)}
                      className="w-full py-2.5 text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all text-white"
                      style={{ background: bundle.color === '#6B7280' ? '#6B7280' : bundle.color }}
                    >
                      Buy Now
                    </button>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <i className="fas fa-shield-alt text-[#4F8EF7] text-2xl flex-shrink-0" />
                <div>
                  <div className="font-jakarta font-bold text-[14px] mb-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>Secure payments via Paystack</div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>All transactions are SSL-encrypted and processed by Paystack in NGN. USD prices shown are approximate at ₦1,600/USD. Coins are credited instantly after payment confirmation.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tiers Tab */}
          {activeTab === 'tiers' && (
            <div>
              <h2 className="font-jakarta font-bold text-[15px] mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>Merit Tiers & Job Unlocks</h2>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>Students with higher Merit Coins are automatically shown bigger and better job opportunities in their dashboard.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MERIT_TIERS.map(tier => {
                  const isCurrent = balance >= tier.min && balance <= tier.max;
                  return (
                    <div key={tier.label} className={`rounded-2xl p-5 border-2 transition-all`} style={isCurrent ? { background: '#0F1521', borderColor: tier.color } : { background: '#0F1521', borderColor: 'rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl" style={{ background: tier.bg }}>
                            {tier.icon}
                          </div>
                          <div>
                            <div className="font-jakarta font-bold text-[15px]" style={{ color: tier.color }}>{tier.label}</div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{tier.min.toLocaleString()}{tier.max === Infinity ? '+' : `–${tier.max.toLocaleString()}`} coins</div>
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
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{perk}</span>
                          </div>
                        ))}
                      </div>
                      {!isCurrent && balance < tier.min && (
                        <button onClick={() => setBuyModal(true)}
                          className="mt-4 w-full py-2 text-xs font-semibold rounded-xl border-0 cursor-pointer transition-all text-white"
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