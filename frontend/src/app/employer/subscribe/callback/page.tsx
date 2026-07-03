'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { BrandIcon } from '@/components/ui/BrandIcon';

/**
 * Handles both payment provider callbacks:
 *
 * Paystack → redirects back with ?reference=SH-xxx&trxref=SH-xxx
 *   → POST /payment/verify/:reference
 *
 * PayPal   → redirects back with ?token=ORDER_ID&PayerID=xxx
 *   → POST /payment/paypal/capture { orderId }
 */
function CallbackContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Detect provider from URL params
  const paystackRef = searchParams.get('reference') || searchParams.get('trxref');
  const paypalToken = searchParams.get('token');    // PayPal order ID
  const cancelled   = searchParams.get('cancelled');

  const [status,   setStatus]  = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message,  setMessage] = useState('Verifying your payment…');
  const [plan,     setPlan]    = useState('');
  const [provider, setProvider] = useState<'paystack' | 'paypal' | null>(null);

  async function verifyPaystack(reference: string) {
    try {
      const res = await apiFetch(`/payment/verify/${reference}`, { method: 'POST' });
      if (res.success) {
        handleSuccess(res.data);
      } else {
        setStatus('failed');
        setMessage(res.message || 'Payment verification failed.');
      }
    } catch (e: any) {
      setStatus('failed');
      setMessage(e.message || 'Payment verification failed. Please contact support.');
    }
  }

  async function capturePayPal(orderId: string) {
    try {
      const res = await apiFetch('/payment/paypal/capture', {
        method: 'POST',
        body:   JSON.stringify({ orderId }),
      });
      if (res.success) {
        handleSuccess(res.data);
      } else {
        setStatus('failed');
        setMessage(res.message || 'PayPal payment capture failed.');
      }
    } catch (e: any) {
      setStatus('failed');
      setMessage(e.message || 'PayPal payment failed. Please contact support.');
    }
  }

  function handleSuccess(data: any) {
    setStatus('success');
    const meta = typeof data?.metadata === 'string' ? JSON.parse(data.metadata) : data?.metadata;
    if (meta?.plan) setPlan(meta.plan.replace('_', ' '));
    setMessage('Payment confirmed! Your subscription is now active.');
    setTimeout(() => router.push('/employer'), 3000);
  }

  useEffect(() => {
    // User cancelled from PayPal — show friendly message
    if (cancelled === '1') {
      setStatus('failed');
      setMessage('Payment was cancelled. No charge was made.');
      return;
    }

    if (paystackRef) {
      setProvider('paystack');
      verifyPaystack(paystackRef);
    } else if (paypalToken) {
      setProvider('paypal');
      capturePayPal(paypalToken);
    } else {
      setStatus('failed');
      setMessage('No payment reference found. Please try again.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icons: Record<string, string> = {
    verifying: 'fa-spinner fa-spin',
    success:   'fa-check-circle',
    failed:    'fa-times-circle',
  };
  const colors: Record<string, string> = {
    verifying: '#2563eb',
    success:   '#10b981',
    failed:    '#ef4444',
  };

  return (
    <div className="min-h-screen bg-[#f5f5fb] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-lg">
        <div className="w-20 h-20 rounded-full grid place-items-center mx-auto mb-6"
          style={{ background: `${colors[status]}18` }}>
          <BrandIcon name={icons[status]} className="text-[36px]" style={{ color: colors[status] }} />
        </div>

        {/* Provider badge */}
        {provider && status === 'verifying' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-4"
            style={{ background: '#f5f5fb', color: '#6b6b8a' }}>
            <BrandIcon name={provider === 'paypal' ? 'fab fa-paypal' : 'fa-credit-card'} className="text-sm" style={{ color: provider === 'paypal' ? '#003087' : '#2563eb' }} />
            {provider === 'paypal' ? 'Confirming PayPal payment…' : 'Confirming Paystack payment…'}
          </div>
        )}

        <h2 className="font-syne font-bold text-[22px] text-[#0a0a0f] mb-3">
          {status === 'verifying' ? 'Verifying Payment'
            : status === 'success' ? 'Subscription Active!'
            : 'Payment Failed'}
        </h2>

        <p className="text-[#6b6b8a] text-sm mb-6">{message}</p>

        {plan && status === 'success' && (
          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl px-4 py-3 text-[#15803d] text-sm font-medium mb-6 capitalize">
            <BrandIcon name="fa-crown" className="mr-2" />{plan} plan activated
          </div>
        )}

        {status === 'success' && (
          <p className="text-[12px] text-[#9898b8]">Redirecting to your dashboard…</p>
        )}

        {status === 'failed' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/employer/subscribe')}
              className="w-full py-3 bg-[#2563eb] text-white font-bold rounded-xl border-0 cursor-pointer hover:bg-[#1d4ed8] transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/employer')}
              className="w-full py-3 bg-[#f5f5fb] text-[#6b6b8a] font-medium rounded-xl border-0 cursor-pointer transition-all"
              style={{ border: '1px solid #ededf5' }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscribeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5fb] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#e8e8f0] border-t-[#2563eb] rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}