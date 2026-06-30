'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { BrandIcon } from '@/components/ui/BrandIcon';

interface Plan {
  label:          string;
  amountKobo:     number;
  amountUsdCents: number;
  period:         number;
  naira:          number;
  nairaDisplay:   string;
  usd:            number;
  usdDisplay:     string;
  exchangeRate:   number;
}

interface PlansResponse {
  plans:            Record<string, Plan>;
  exchangeRate:     number;
  exchangeRateNote: string;
}

type PaymentMode = 'ngn_card' | 'ngn_transfer' | 'usd_paypal';

function Sk({ h = 'h-4', w = 'w-full', r = 'rounded' }: any) {
  return <div className={`${h} ${w} ${r} animate-pulse`} style={{ background: 'rgba(255,255,255,0.06)' }} />;
}

const FEATURES = [
  'Post unlimited job listings',
  'Access the full talent pool',
  'View & manage all applicants',
  'Advanced analytics & reports',
  'Shortlist & contact candidates',
  'Full company profile page',
  'Priority support',
];

export default function SubscribePage() {
  const router = useRouter();

  const [plans,        setPlans]        = useState<Record<string, Plan> | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateNote,     setRateNote]     = useState('');
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState<'employer_monthly' | 'employer_annual'>('employer_annual');
  const [paymentMode,  setPaymentMode]  = useState<PaymentMode>('ngn_card');
  const [processing,   setProcessing]   = useState(false);
  const [toast,        setToast]        = useState('');
  const [toastType,    setToastType]    = useState<'success' | 'error'>('success');
  const [accessStatus, setAccessStatus] = useState<any>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 5000);
  }

  useEffect(() => {
    Promise.all([
      apiFetch<PlansResponse>('/payment/plans'),
      apiFetch('/employer/access-status'),
    ]).then(([plansRes, accessRes]) => {
      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data.plans);
        setExchangeRate(plansRes.data.exchangeRate);
        setRateNote(plansRes.data.exchangeRateNote);
      }
      if (accessRes.success && accessRes.data) {
        setAccessStatus(accessRes.data);
      }
    }).catch(() => {
      showToast('Failed to load plans', 'error');
    }).finally(() => setLoading(false));
  }, []);

  async function handleSubscribe() {
    if (!plans) return;
    setProcessing(true);
    try {
      const callbackUrl = `${window.location.origin}/employer/subscribe/callback`;
      const res = await apiFetch('/payment/initiate', {
        method: 'POST',
        body: JSON.stringify({
          purpose:      'subscription',
          planOrBundle: selected,
          callbackUrl,
          paymentMode,
        }),
      });

      if (res.success && res.data) {
        // Paystack returns authorizationUrl; PayPal returns approvalUrl
        const redirectUrl = res.data.authorizationUrl || res.data.approvalUrl;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          showToast('No redirect URL returned. Please try again.', 'error');
          setProcessing(false);
        }
      } else {
        showToast(res.message || 'Failed to initiate payment', 'error');
        setProcessing(false);
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to initiate payment', 'error');
      setProcessing(false);
    }
  }

  const monthlyPlan = plans?.employer_monthly;
  const annualPlan  = plans?.employer_annual;

  const annualSavingsNGN = monthlyPlan && annualPlan
    ? (monthlyPlan.naira * 12) - annualPlan.naira : 0;
  const annualSavingsUSD = monthlyPlan && annualPlan
    ? ((monthlyPlan.usd * 12) - annualPlan.usd).toFixed(2) : '0';

  const isUsd        = paymentMode === 'usd_paypal';
  const selectedPlan = plans?.[selected];

  const ctaPrice = selectedPlan
    ? isUsd ? selectedPlan.usdDisplay : selectedPlan.nairaDisplay
    : '…';

  return (
    <SidebarLayout navItems={employerNavItems} pageTitle="Employer Subscription">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-999 px-5 py-3.5 rounded-2xl text-white text-sm font-semibold shadow-xl flex items-center gap-2 ${toastType === 'success' ? 'bg-[#0F1521] border border-[#00E5A0]/30' : 'bg-[#0F1521] border border-[#EF4444]/30'}`}
          style={toastType === 'success' ? { color: '#2563eb' } : { color: '#EF4444' }}>
          <BrandIcon name={toastType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} className="text-sm" />
          {toast}
        </div>
      )}

      <div className="max-w-215 mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-full mb-4" style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.2)' }}>
            <BrandIcon name="fa-crown" className="text-xs" /> Employer Plans
          </div>
          <h1 className="font-jakarta font-extrabold text-[32px] mb-3" style={{ color: '#FFFFFF' }}>
            Choose your plan
          </h1>
          <p className="text-[15px] max-w-120 mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Get full access to all employer features. Post jobs, find talent, and grow your team.
          </p>

          {accessStatus && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: accessStatus.hasAccess ? 'rgba(0,229,160,0.12)' : 'rgba(239,68,68,0.12)',
                color: accessStatus.hasAccess ? '#00E5A0' : '#EF4444',
                border: `1px solid ${accessStatus.hasAccess ? 'rgba(0,229,160,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
              <BrandIcon name={accessStatus.hasAccess ? 'fa-check-circle' : 'fa-exclamation-circle'} className="text-sm" />
              {accessStatus.trialActive
                ? `Free trial active — ${accessStatus.trialDaysLeft} day${accessStatus.trialDaysLeft !== 1 ? 's' : ''} remaining`
                : accessStatus.subscription
                ? `Subscribed — ${accessStatus.subscription.plan.replace('_', ' ')} plan`
                : 'No active subscription'}
            </div>
          )}
        </div>

        {/* Plan toggle (monthly / annual) */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {(['employer_monthly', 'employer_annual'] as const).map(key => {
            const label  = key === 'employer_monthly' ? 'Monthly' : 'Annual';
            const active = selected === key;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all"
                style={{
                  background: active ? '#4F8EF7' : 'rgba(255,255,255,0.04)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {label}
                {key === 'employer_annual' && annualSavingsNGN > 0 && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,229,160,0.12)', color: active ? '#fff' : '#00E5A0' }}>
                    Save {isUsd ? `$${annualSavingsUSD}` : `₦${annualSavingsNGN.toLocaleString('en-NG')}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {(['employer_monthly', 'employer_annual'] as const).map(key => {
            const plan     = plans?.[key];
            const active   = selected === key;
            const isAnnual = key === 'employer_annual';

            return (
              <div
                key={key}
                onClick={() => setSelected(key)}
                className="relative rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1"
                style={{
                  border: active ? '2px solid #4F8EF7' : '1px solid rgba(255,255,255,0.07)',
                  background: active ? 'rgba(79,142,247,0.06)' : '#0F1521',
                  boxShadow: active ? '0 8px 32px rgba(79,142,247,0.12)' : 'none',
                }}
              >
                {isAnnual && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-[11px] font-bold rounded-full whitespace-nowrap" style={{ background: '#4F8EF7' }}>
                    BEST VALUE
                  </div>
                )}
                {active && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full grid place-items-center" style={{ background: '#4F8EF7' }}>
                    <BrandIcon name="fa-check" className="text-white text-[10px]" />
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-sm font-bold mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {isAnnual ? 'Annual Plan' : 'Monthly Plan'}
                  </div>

                  {loading ? (
                    <>
                      <Sk h="h-9" w="w-32" r="rounded-lg" />
                      <Sk h="h-4" w="w-24" r="rounded" />
                    </>
                  ) : plan ? (
                    <>
                      {/* Primary price — switches based on currency mode */}
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="font-jakarta font-extrabold text-[34px]" style={{ color: '#FFFFFF' }}>
                          {isUsd ? plan.usdDisplay : plan.nairaDisplay}
                        </span>
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          /{isAnnual ? 'year' : 'month'}
                        </span>
                      </div>

                      {/* Secondary equivalent price */}
                      <div className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {isUsd
                          ? `≈ ${plan.nairaDisplay}/${isAnnual ? 'year' : 'month'}`
                          : `≈ ${plan.usdDisplay}/${isAnnual ? 'year' : 'month'} (live rate)`
                        }
                      </div>

                      {isAnnual && monthlyPlan && (
                        <div className="mt-2 text-[12px] font-semibold" style={{ color: '#4F8EF7' }}>
                          {isUsd
                            ? `$${(plan.usd / 12).toFixed(2)}/mo billed annually`
                            : `₦${Math.round(plan.naira / 12).toLocaleString('en-NG')}/mo billed annually`}
                          {(isUsd ? parseFloat(annualSavingsUSD) > 0 : annualSavingsNGN > 0) && (
                            <span className="ml-1.5" style={{ color: '#00E5A0' }}>
                              · Save {isUsd ? `$${annualSavingsUSD}` : `₦${annualSavingsNGN.toLocaleString('en-NG')}`} vs monthly
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>

                <ul className="flex flex-col gap-2">
                  {FEATURES.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <BrandIcon name="fa-check-circle" className="text-[12px] shrink-0" style={{ color: '#4F8EF7' }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── Payment method selector ─────────────────────────────── */}
        <div className="mb-6">
          <div className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Payment Method
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([
              { mode: 'ngn_card'     as PaymentMode, icon: 'fa-credit-card', label: 'Card (NGN)',     sub: 'Paystack · Naira'   },
              { mode: 'ngn_transfer' as PaymentMode, icon: 'fa-building-columns', label: 'Transfer (NGN)', sub: 'Paystack · Bank'    },
              { mode: 'usd_paypal'   as PaymentMode, icon: 'fa-paypal',      label: 'PayPal (USD)',   sub: 'International'      },
            ] as const).map(({ mode, icon, label, sub }) => {
              const active = paymentMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-2xl border-0 cursor-pointer transition-all"
                  style={{
                    background: active ? 'rgba(79,142,247,0.10)' : 'rgba(255,255,255,0.03)',
                    border: active ? '2px solid #4F8EF7' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <BrandIcon name={icon === 'fa-paypal' ? 'fab fa-paypal' : icon} className="text-[22px]" style={{ color: active ? '#4F8EF7' : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-[13px] font-bold" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>{label}</span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exchange rate note */}
        {exchangeRate && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-6 text-[12px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
            <BrandIcon name="fa-info-circle" className="text-sm" style={{ color: '#4F8EF7' }} />
            <span>
              {isUsd
                ? `USD prices are fixed. PayPal handles conversion. ${rateNote}`
                : rateNote || `Live rate: ₦${exchangeRate.toLocaleString('en-NG')} = $1.00`
              }
            </span>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleSubscribe}
            disabled={processing || loading}
            className="px-10 py-4 text-white font-bold text-[15px] rounded-2xl border-0 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
            style={{ background: '#4F8EF7', boxShadow: '0 4px 14px rgba(79,142,247,0.3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            {processing ? (
              <>
                <BrandIcon name="fa-spinner" className="mr-2 animate-spin" />
                {isUsd ? 'Redirecting to PayPal…' : 'Redirecting to Paystack…'}
              </>
            ) : (
              <>
                <BrandIcon name={isUsd ? 'fab fa-paypal' : 'fa-lock'} className="mr-2 text-sm" />
                Subscribe — {ctaPrice}
              </>
            )}
          </button>

          <p className="text-[12px] mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {isUsd
              ? 'Secure payment via PayPal · Cancel anytime · No hidden fees'
              : 'Secure payment via Paystack · Cancel anytime · No hidden fees'
            }
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}