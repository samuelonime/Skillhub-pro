'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

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
    <div className="min-h-screen bg-[#f5f5fb] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <div className="w-12 h-12 rounded-2xl bg-[#5b4cf5]/10 grid place-items-center mb-6">
          <i className="fas fa-lock-open text-[#5b4cf5] text-lg" />
        </div>
        <h1 className="font-syne font-bold text-2xl text-[#0a0a0f] mb-2">Set new password</h1>
        <p className="text-sm text-[#6b6b8a] mb-6">
          Choose a strong password for your SkillHub account.
        </p>

        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#10b981]/10 grid place-items-center mx-auto mb-4">
              <i className="fas fa-check-circle text-[#10b981] text-2xl" />
            </div>
            <p className="font-semibold text-[#0a0a0f] mb-1">Password reset!</p>
            <p className="text-sm text-[#6b6b8a]">Redirecting you to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fca5a5] text-sm text-[#b91c1c]">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-[#3a3a55] uppercase tracking-wider mb-1.5 block">
                New password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="Min 8 chars, 1 uppercase, 1 number"
                className="w-full px-4 py-3 rounded-xl border border-[#e8e8f0] text-sm outline-none focus:border-[#5b4cf5] transition-all font-[inherit]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#3a3a55] uppercase tracking-wider mb-1.5 block">
                Confirm password
              </label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                required placeholder="Repeat new password"
                className="w-full px-4 py-3 rounded-xl border border-[#e8e8f0] text-sm outline-none focus:border-[#5b4cf5] transition-all font-[inherit]"
              />
            </div>
            <button
              type="submit" disabled={loading || !token}
              className="w-full py-3.5 bg-[#5b4cf5] text-white font-bold rounded-xl border-0 cursor-pointer hover:bg-[#4c3ed4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <><i className="fas fa-spinner fa-spin mr-2" />Resetting…</> : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-[#9898b8] mt-6">
          <a href="/login" className="text-[#5b4cf5] font-semibold hover:underline">Back to login</a>
        </p>
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