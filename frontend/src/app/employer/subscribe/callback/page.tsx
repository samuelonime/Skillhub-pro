'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function SubscribeCallbackPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const reference    = searchParams.get('reference') || searchParams.get('trxref');

  const [status,  setStatus]  = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment…');
  const [plan,    setPlan]    = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found. Please try again.');
      return;
    }

    (async () => {
      try {
        const res = await apiFetch(`/payment/verify/${reference}`, { method: 'POST' });
        if (res.success) {
          setStatus('success');
          const raw  = res.data as any;
          const meta = typeof raw?.metadata === 'string'
            ? JSON.parse(raw.metadata)
            : raw?.metadata;
          if (meta?.plan) setPlan(meta.plan.replace('_', ' '));
          setMessage('Payment verified! Your subscription is now active.');
          setTimeout(() => router.push('/employer'), 3000);
        } else {
          setStatus('failed');
          setMessage(res.message || 'Payment verification failed.');
        }
      } catch (e: any) {
        setStatus('failed');
        setMessage(e.message || 'Payment verification failed. Please contact support.');
      }
    })();
  }, [reference, router]);

  const icons: Record<string, string> = {
    verifying: 'fa-spinner fa-spin',
    success:   'fa-check-circle',
    failed:    'fa-times-circle',
  };
  const colors: Record<string, string> = {
    verifying: '#5b4cf5',
    success:   '#10b981',
    failed:    '#ef4444',
  };

  return (
    <div className="min-h-screen bg-[#f5f5fb] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-lg">
        <div className="w-20 h-20 rounded-full grid place-items-center mx-auto mb-6"
          style={{ background: `${colors[status]}18` }}>
          <i className={`fas ${icons[status]} text-[36px]`} style={{ color: colors[status] }} />
        </div>

        <h2 className="font-syne font-bold text-[22px] text-[#0a0a0f] mb-3">
          {status === 'verifying' ? 'Verifying Payment' : status === 'success' ? 'Subscription Active!' : 'Payment Failed'}
        </h2>

        <p className="text-[#6b6b8a] text-sm mb-6">{message}</p>

        {plan && status === 'success' && (
          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl px-4 py-3 text-[#15803d] text-sm font-medium mb-6 capitalize">
            <i className="fas fa-crown mr-2" />{plan} plan activated
          </div>
        )}

        {status === 'success' && (
          <p className="text-[12px] text-[#9898b8]">Redirecting to your dashboard…</p>
        )}

        {status === 'failed' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/employer/subscribe')}
              className="w-full py-3 bg-[#5b4cf5] text-white font-bold rounded-xl border-0 cursor-pointer hover:bg-[#4c3ed4] transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/employer')}
              className="w-full py-3 bg-[#f5f5fb] text-[#6b6b8a] font-medium rounded-xl border-0 cursor-pointer hover:bg-[#eded] transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}