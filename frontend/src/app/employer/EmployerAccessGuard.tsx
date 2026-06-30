'use client';

/**
 * EmployerAccessGuard
 * -------------------
 * Wraps every employer page. On mount it calls GET /employer/access-status.
 *
 * If the user has valid access (trial active OR active subscription):
 *   → renders children + an optional trial countdown banner.
 *
 * If the user has NO valid access (trial expired, no subscription):
 *   → renders a full-page paywall blocking all employer content.
 *
 * The backend also enforces this on every API call — the frontend guard
 * is purely for UX (no flash of restricted content, clear messaging).
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { BrandIcon } from '@/components/ui/BrandIcon';

// Keep in sync with PLANS.employer_monthly.amount in backend/src/routes/payment.js
const EMPLOYER_MONTHLY_DISPLAY = '₦10,000';

interface AccessStatus {
  hasAccess:      boolean;
  trialActive:    boolean;
  trialEndsAt:    string | null;
  trialDaysLeft:  number;
  subscription:   any | null;
}

interface Props {
  children: React.ReactNode;
}

/* ── Small helper components ─────────────────────────────────────────── */

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-[3px] border-[#e8e8f0] border-t-[#2563eb] rounded-full animate-spin" />
    </div>
  );
}

function TrialBanner({ daysLeft, onSubscribe }: { daysLeft: number; onSubscribe: () => void }) {
  const urgent = daysLeft <= 2;
  return (
    <div
      className="flex items-center justify-between gap-3 px-5 py-3 text-sm font-medium rounded-xl mb-6"
      style={{
        background: urgent ? '#fef2f2' : '#fffbeb',
        border:     `1.5px solid ${urgent ? '#fca5a5' : '#fcd34d'}`,
        color:      urgent ? '#b91c1c' : '#92400e',
      }}
    >
      <div className="flex items-center gap-2.5">
        <BrandIcon name={urgent ? 'fa-exclamation-circle' : 'fa-clock'} className="text-base" />
        <span>
          {daysLeft === 0
            ? 'Your free trial expires today.'
            : daysLeft === 1
            ? 'Your free trial expires tomorrow.'
            : `Your free trial ends in ${daysLeft} days.`}
          {' '}Subscribe to keep full access.
        </span>
      </div>
      <button
        onClick={onSubscribe}
        className="flex-shrink-0 px-4 py-1.5 rounded-lg text-white text-xs font-bold border-0 cursor-pointer transition-all"
        style={{ background: '#2563eb' }}
      >
        Subscribe Now
      </button>
    </div>
  );
}

function Paywall({ trialExpired }: { trialExpired: boolean }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-[#eff6ff] grid place-items-center mb-6">
        <BrandIcon name="fa-lock" className="text-[32px] text-[#2563eb]" />
      </div>

      {/* Heading */}
      <h2 className="font-syne font-bold text-[26px] text-[#0a0a0f] mb-3">
        {trialExpired ? 'Your Free Trial Has Ended' : 'Subscription Required'}
      </h2>
      <p className="text-[#6b6b8a] text-[15px] max-w-[480px] leading-relaxed mb-8">
        {trialExpired
          ? 'Your 7-day free trial has expired. Subscribe to an Employer plan to keep posting jobs, searching talent, and accessing analytics.'
          : 'This feature is available to subscribed employers. Choose a plan to get started.'}
      </p>

      {/* Feature list */}
      <div className="grid grid-cols-2 gap-3 mb-10 w-full max-w-[440px]">
        {[
          { icon: 'fa-briefcase',  label: 'Post unlimited jobs' },
          { icon: 'fa-users',      label: 'Browse all applicants' },
          { icon: 'fa-search',     label: 'Search talent pool' },
          { icon: 'fa-chart-bar',  label: 'Full analytics access' },
          { icon: 'fa-building',   label: 'Company profile page' },
          { icon: 'fa-star',       label: 'Shortlist candidates' },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-2.5 bg-[#f5f5fb] rounded-xl px-4 py-3 text-sm text-[#2d2d42] font-medium">
            <BrandIcon name={f.icon} className="text-[#2563eb] text-[13px] w-4 text-center" />
            {f.label}
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push('/employer/subscribe')}
        className="px-8 py-4 bg-[#2563eb] text-white font-bold text-[15px] rounded-2xl border-0 cursor-pointer hover:bg-[#1d4ed8] transition-all shadow-lg shadow-[#2563eb]/25"
      >
        View Plans & Subscribe
      </button>
      <p className="text-[12px] text-[#9898b8] mt-4">
        Monthly from {EMPLOYER_MONTHLY_DISPLAY} · Cancel anytime
      </p>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */

export function EmployerAccessGuard({ children }: Props) {
  const router  = useRouter();
  const [status, setStatus]   = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch<AccessStatus>('/employer/access-status');
      if (res.success && res.data) {
        setStatus(res.data);
      } else {
        // Unexpected — treat as no access
        setStatus({ hasAccess: false, trialActive: false, trialEndsAt: null, trialDaysLeft: 0, subscription: null });
      }
    } catch {
      setStatus({ hasAccess: false, trialActive: false, trialEndsAt: null, trialDaysLeft: 0, subscription: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  if (loading) return <Spinner />;

  // No access at all — show paywall
  if (!status?.hasAccess) {
    const trialExpired = !!(status?.trialEndsAt && new Date(status.trialEndsAt) <= new Date());
    return <Paywall trialExpired={trialExpired} />;
  }

  // Has access — render children with optional trial banner
  return (
    <>
      {status.trialActive && (
        <TrialBanner
          daysLeft={status.trialDaysLeft}
          onSubscribe={() => router.push('/employer/subscribe')}
        />
      )}
      {children}
    </>
  );
}