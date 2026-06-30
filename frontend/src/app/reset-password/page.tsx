'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { BrandIcon } from '@/components/ui/BrandIcon';

function ResetPasswordForm() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token    = params.get('token');

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid or missing reset link. Please request a new one.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return setError('Password must be 8+ characters with at least 1 uppercase letter and 1 number');
    }
    setLoading(true);
    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      if (res.success) {
        setDone(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(res.message || 'Reset failed. The link may have expired.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080C14] px-4 py-10">
      <div className="absolute left-[-120px] top-[-80px] h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(79,142,247,0.22) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-120px] right-[-60px] h-96 w-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,229,160,0.14) 0%, transparent 72%)' }} />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center gap-8 max-lg:flex-col">
        <div className="flex-1 rounded-[2rem] border p-8 max-lg:w-full"
          style={{ background: 'linear-gradient(145deg, rgba(12,18,32,0.96) 0%, rgba(9,19,33,0.98) 100%)', borderColor: 'rgba(79,142,247,0.16)', boxShadow: '0 32px 90px rgba(0,0,0,0.35)' }}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.22)', color: '#7EB3FF' }}>
            <BrandIcon name="fa-lock" />
            Account recovery
          </div>
          <h1 className="mt-6 font-jakarta text-[clamp(2rem,4vw,3.1rem)] font-black leading-[1.05] text-white">
            Reset access without breaking momentum.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.58)' }}>
            Set a fresh password for your SkillHub workspace, keep your certificates and job activity protected, and get back into your learning flow.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              'Minimum 8 characters with at least one uppercase letter and one number.',
              'Your existing courses, portfolio, and employer activity remain unchanged.',
              'Expired links can be replaced instantly from the login screen.',
            ].map(item => (
              <div key={item} className="flex items-start gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ background: 'rgba(0,229,160,0.12)', color: '#00E5A0' }}>
                  <BrandIcon name="fa-check-circle" />
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.66)' }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md rounded-[2rem] border p-8"
          style={{ background: 'rgba(12,18,32,0.94)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.34)' }}>
          <div className="mb-6 inline-grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: 'rgba(79,142,247,0.14)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.2)' }}>
            <BrandIcon name="fa-lock-open" className="text-lg" />
          </div>
          <h2 className="font-jakarta text-2xl font-bold text-white">Choose a new password</h2>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.48)' }}>
            Make it strong enough for production work and easy enough for you to remember.
          </p>

          {done ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full"
                style={{ background: 'rgba(0,229,160,0.12)', color: '#00E5A0' }}>
                <BrandIcon name="fa-check-circle" className="text-2xl" />
              </div>
              <p className="mb-1 font-jakarta text-lg font-bold text-white">Password updated</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.48)' }}>Redirecting you to the secure login flow…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
                style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.22)', color: '#FCA5A5' }}>
                <BrandIcon name="fa-circle-exclamation" className="mt-0.5" />
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.42)' }}>
                New password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="Min 8 chars, 1 uppercase, 1 number"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all font-[inherit]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.88)' }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.42)' }}>
                Confirm password
              </label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                required placeholder="Repeat new password"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all font-[inherit]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.88)' }}
              />
            </div>
            <button
              type="submit" disabled={loading || !token}
              className="w-full rounded-2xl border-0 py-3.5 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #4F8EF7, #2F6FED)', boxShadow: '0 18px 40px rgba(47,111,237,0.28)' }}
            >
              {loading ? <span className="inline-flex items-center gap-2"><BrandIcon name="fa-spinner" className="animate-spin" />Resetting…</span> : 'Reset password'}
            </button>
          </form>
        )}

          <p className="mt-6 text-center text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>
            <a href="/login" className="font-semibold no-underline" style={{ color: '#7EB3FF' }}>Back to secure login</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}