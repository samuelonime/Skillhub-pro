'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';

interface Plan {
  label:        string;
  amount:       number;
  period:       number;
  naira:        number;
  nairaDisplay: string;
  usd:          number;
  usdDisplay:   string;
  exchangeRate: number;
}

interface PlansResponse {
  plans:            Record<string, Plan>;
  exchangeRate:     number;
  exchangeRateNote: string;
}

function Sk({ h = 'h-4', w = 'w-full', r = 'rounded' }: any) {
  return <div className={`${h} ${w} ${r} bg-[#f0f0f8] animate-pulse`} />;
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
        }),
      });
      if (res.success && res.data?.authorizationUrl) {
        window.location.href = res.data.authorizationUrl;
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

  // Savings calculation
  const annualSavingsNGN = monthlyPlan && annualPlan
    ? (monthlyPlan.naira * 12) - annualPlan.naira
    : 0;
  const annualSavingsUSD = monthlyPlan && annualPlan
    ? ((monthlyPlan.usd * 12) - annualPlan.usd).toFixed(2)
    : '0';

  return (
    <SidebarLayout navItems={employerNavItems} pageTitle="Employer Subscription">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[999] px-5 py-3.5 rounded-2xl text-white text-sm font-semibold shadow-xl flex items-center gap-2 ${toastType === 'success' ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}>
          <i className={`fas ${toastType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
          {toast}
        </div>
      )}

      <div className="max-w-[860px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#f4f2ff] text-[#5b4cf5] text-xs font-bold rounded-full mb-4">
            <i className="fas fa-crown" /> Employer Plans
          </div>
          <h1 className="font-syne font-extrabold text-[32px] text-[#0a0a0f] mb-3">
            Choose your plan
          </h1>
          <p className="text-[#6b6b8a] text-[15px] max-w-[480px] mx-auto">
            Get full access to all employer features. Post jobs, find talent, and grow your team.
          </p>

          {/* Current status badge */}
          {accessStatus && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: accessStatus.hasAccess ? '#f0fdf4' : '#fef2f2',
                color:      accessStatus.hasAccess ? '#15803d' : '#b91c1c',
              }}>
              <i className={`fas ${accessStatus.hasAccess ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
              {accessStatus.trialActive
                ? `Free trial active — ${accessStatus.trialDaysLeft} day${accessStatus.trialDaysLeft !== 1 ? 's' : ''} remaining`
                : accessStatus.subscription
                ? `Subscribed — ${accessStatus.subscription.plan.replace('_', ' ')} plan`
                : 'No active subscription'}
            </div>
          )}
        </div>

        {/* Plan toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {(['employer_monthly', 'employer_annual'] as const).map(key => {
            const label = key === 'employer_monthly' ? 'Monthly' : 'Annual';
            const active = selected === key;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all"
                style={{
                  background: active ? '#5b4cf5' : '#f5f5fb',
                  color:      active ? '#fff'     : '#6b6b8a',
                }}
              >
                {label}
                {key === 'employer_annual' && annualSavingsNGN > 0 && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: active ? 'rgba(255,255,255,0.25)' : '#dcfce7', color: active ? '#fff' : '#15803d' }}>
                    Save ₦{annualSavingsNGN.toLocaleString('en-NG')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {(['employer_monthly', 'employer_annual'] as const).map(key => {
            const plan   = plans?.[key];
            const active = selected === key;
            const isAnnual = key === 'employer_annual';

            return (
              <div
                key={key}
                onClick={() => setSelected(key)}
                className="relative rounded-2xl p-6 cursor-pointer transition-all"
                style={{
                  border:     active ? '2.5px solid #5b4cf5' : '1.5px solid #e8e8f0',
                  background: active ? '#fafaff' : '#fff',
                  boxShadow:  active ? '0 8px 32px rgba(91,76,245,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                {/* Popular badge */}
                {isAnnual && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#5b4cf5] text-white text-[11px] font-bold rounded-full">
                    BEST VALUE
                  </div>
                )}

                {/* Active check */}
                {active && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#5b4cf5] grid place-items-center">
                    <i className="fas fa-check text-white text-[10px]" />
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-sm font-bold text-[#6b6b8a] mb-1">
                    {isAnnual ? 'Annual Plan' : 'Monthly Plan'}
                  </div>

                  {loading ? (
                    <>
                      <Sk h="h-9" w="w-32" r="rounded-lg" />
                      <Sk h="h-4" w="w-24" r="rounded" />
                    </>
                  ) : plan ? (
                    <>
                      {/* NGN price — primary */}
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="font-syne font-extrabold text-[34px] text-[#0a0a0f]">
                          {plan.nairaDisplay}
                        </span>
                        <span className="text-[#9898b8] text-sm">
                          /{isAnnual ? 'year' : 'month'}
                        </span>
                      </div>

                      {/* USD equivalent — secondary */}
                      <div className="text-[13px] text-[#9898b8] font-medium">
                        ≈ {plan.usdDisplay}/{isAnnual ? 'year' : 'month'}
                        {' '}
                        <span className="text-[11px]">(live rate)</span>
                      </div>

                      {/* Annual: show monthly breakdown */}
                      {isAnnual && monthlyPlan && (
                        <div className="mt-2 text-[12px] text-[#5b4cf5] font-semibold">
                          ₦{Math.round(plan.naira / 12).toLocaleString('en-NG')}/mo billed annually
                          {annualSavingsNGN > 0 && (
                            <span className="ml-1.5 text-[#10b981]">
                              · Save ₦{annualSavingsNGN.toLocaleString('en-NG')} vs monthly
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-2">
                  {FEATURES.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-[#2d2d42]">
                      <i className="fas fa-check-circle text-[#5b4cf5] text-[12px] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Exchange rate note */}
        {exchangeRate && (
          <div className="flex items-center gap-2 bg-[#f5f5fb] rounded-xl px-4 py-3 mb-6 text-[12px] text-[#9898b8]">
            <i className="fas fa-info-circle text-[#5b4cf5]" />
            <span>{rateNote || `Live rate: ₦${exchangeRate.toLocaleString('en-NG')} = $1.00`}</span>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleSubscribe}
            disabled={processing || loading}
            className="px-10 py-4 bg-[#5b4cf5] text-white font-bold text-[15px] rounded-2xl border-0 cursor-pointer hover:bg-[#4c3ed4] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#5b4cf5]/25"
          >
            {processing
              ? <><i className="fas fa-spinner fa-spin mr-2" />Redirecting to Paystack…</>
              : <>
                  <i className="fas fa-lock mr-2 text-sm" />
                  Subscribe — {selected === 'employer_annual'
                    ? plans?.employer_annual?.nairaDisplay ?? '…'
                    : plans?.employer_monthly?.nairaDisplay ?? '…'}
                </>
            }
          </button>

          <p className="text-[12px] text-[#9898b8] mt-3">
            Secure payment via Paystack · Cancel anytime · No hidden fees
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}