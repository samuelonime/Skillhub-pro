'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { setCachedUser, apiFetch, API_BASE } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandIcon } from '@/components/ui/BrandIcon';

type Tab = 'login' | 'register' | 'forgot' | 'reset';
type Role = 'student' | 'employer';
type AlertType = 'err' | 'ok';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: () => void;
        };
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: 'popup' | 'redirect';
            callback: (response: { code: string; error?: string }) => void;
          }) => { requestCode: () => void };
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: object) => void;
        signIn: () => Promise<{ authorization: { id_token: string }; user?: { name?: { firstName?: string; lastName?: string } } }>;
      };
    };
  }
}

function Alert({ msg, type }: { msg: string; type: AlertType }) {
  if (!msg) return null;
  return (
    <div className={`mb-3.5 flex items-center gap-2.5 rounded-2xl border p-3 text-[13px] ${type === 'ok' ? 'bg-[#092218] text-[#7FF0BF] border-[#00E5A0]/20' : 'bg-[#2A1114] text-[#FCA5A5] border-[#F87171]/20'}`}>
      <BrandIcon name={type === 'ok' ? 'fa-check-circle' : 'fa-exclamation-circle'} /> {msg}
    </div>
  );
}

function Spinner() {
  return <BrandIcon name="fa-spinner" className="mx-auto animate-spin text-[17px]" />;
}


/**
 * FIX: After a successful login/OAuth, redirect to the ?redirect param if present and safe,
 * otherwise fall back to the role-based default page.
 * This is what makes shared links work — the middleware preserved the destination
 * in the URL, and now we honour it after authentication.
 */
function usePostLoginRedirect() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  function isSafeRedirect(path: string | null): path is string {
    if (!path) return false;
    if (!path.startsWith('/') || path.startsWith('//')) return false;
    if (/[\r\n]/.test(path)) return false;
    return true;
  }

  return function redirect(role: string, delayMs = 800) {
    const param    = searchParams.get('redirect');
    const safeDest = isSafeRedirect(param)
      ? param
      : role === 'employer' ? '/employer'
      : role === 'admin'    ? '/admin'
      : '/dashboard';

    setTimeout(() => router.push(safeDest), delayMs);
  };
}

/* ── Google Button ───────────────────────────────────────────────────────── */
function GoogleButton({ onAlert, role, niche, label = 'Continue with Google' }: {
  onAlert: (msg: string, type?: AlertType) => void;
  role?: Role;
  niche?: string;
  label?: string;
}) {
  const postLoginRedirect = usePostLoginRedirect();
  const [gLoading, setGLoading] = useState(false);

  useEffect(() => {
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const handleGoogle = useCallback(() => {
    if (!window.google) return onAlert('Google sign-in not ready. Please refresh and try again.');
    if (role === 'student' && !niche) return onAlert('Please choose a learning niche before signing up with Google.', 'err');
    setGLoading(true);
    onAlert('');

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: async (response: { code: string; error?: string }) => {
        if (response.error) {
          if (response.error !== 'access_denied' && response.error !== 'popup_closed_by_user') {
            onAlert('Google sign-in cancelled or failed.');
          }
          setGLoading(false);
          return;
        }
        try {
          const body: Record<string, string> = { code: response.code };
          if (role) body.role = role;
          if (niche) body.niche = niche;
          const res = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            credentials: 'include',
          });
          const d = await res.json();
          if (!d.success) {
            if (d.message === 'Google account not registered') {
              onAlert('Google account not found. Please sign up with Google.', 'err');
              window.location.href = '/login?tab=register';
              return;
            }
            onAlert(d.message || 'Google sign-in failed');
            return;
          }
          setCachedUser(d.data.user);
          onAlert('Google sign-in successful! Redirecting…', 'ok');
          // FIX: honour ?redirect param so shared links work
          postLoginRedirect(d.data.user.role);
        } catch {
          onAlert('Google sign-in failed. Please check your connection.');
        } finally {
          setGLoading(false);
        }
      },
    });

    client.requestCode();
  }, [role, niche, onAlert, postLoginRedirect]);

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={gLoading}
      className="w-full py-[0.7rem] bg-[#21262d] border border-[#3d444d] rounded-lg text-sm font-medium font-[inherit] text-[#f0f6fc] cursor-pointer flex items-center justify-center gap-3 hover:bg-[#2c313a] hover:border-[#6e7681] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {gLoading ? (
        <div className="w-4.25 h-4.25 border-2 border-[#4285f4]/30 border-t-[#4285f4] rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {label}
    </button>
  );
}

/* ── Apple Button ────────────────────────────────────────────────────────── */
function AppleButton({ onAlert, role, niche, label = 'Continue with Apple' }: {
  onAlert: (msg: string, type?: AlertType) => void;
  role?: Role;
  niche?: string;
  label?: string;
}) {
  const postLoginRedirect = usePostLoginRedirect();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document.querySelector('script[src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"]')) return;
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const handleApple = useCallback(async () => {
    if (role === 'student' && !niche) return onAlert('Please choose a learning niche before signing up with Apple.', 'err');
    onAlert('');
    setLoading(true);
    try {
      if (!window.AppleID) throw new Error('Apple JS not loaded. Please refresh and try again.');
      window.AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || 'com.skillhub.web',
        scope: 'name email',
        redirectURI: window.location.origin + '/login',
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const id_token = response.authorization.id_token;
      const appleUser = response.user;
      const body: Record<string, any> = { id_token };
      if (role) body.role = role;
      if (niche) body.niche = niche;
      if (appleUser) body.user = appleUser;
      const res = await fetch(`${API_BASE}/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const d = await res.json();
      if (!d.success) {
        if (d.message?.includes('not registered')) {
          onAlert('Apple account not found. Please sign up first.', 'err');
          window.location.href = '/login?tab=register';
          return;
        }
        onAlert(d.message || 'Apple sign-in failed');
        return;
      }
      setCachedUser(d.data.user);
      onAlert('Apple sign-in successful! Redirecting…', 'ok');
      // FIX: honour ?redirect param so shared links work
      postLoginRedirect(d.data.user.role);
    } catch (err: any) {
      if (err?.error === 'popup_closed_by_user' || err?.error === 'user_cancelled_authorize') {
        setLoading(false);
        return;
      }
      onAlert(err.message || 'Apple sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [role, niche, onAlert, postLoginRedirect]);

  return (
    <button
      type="button"
      onClick={handleApple}
      disabled={loading}
      className="w-full py-[0.7rem] bg-[#21262d] border border-[#3d444d] rounded-lg text-sm font-medium font-[inherit] text-[#f0f6fc] cursor-pointer flex items-center justify-center gap-3 hover:bg-[#2c313a] hover:border-[#6e7681] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {loading ? (
        <div className="w-4.25 h-4.25 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
      ) : (
        <svg width="17" height="17" viewBox="0 0 814 1000" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-145.5-100.5C92.8 790.4 51.3 699.2 51.3 612.5c0-151.3 104.6-231.6 206.7-231.6 55.4 0 101.4 37.4 136.5 37.4 33.5 0 85.8-39.6 149.1-39.6 24.2 0 108.2 2.6 168.6 71.4zm-109.4-194.5c31.4-37.4 53.9-89.6 53.9-141.9 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.4 33.5-146.5 75.3-28.2 32.2-55.4 84.4-55.4 137.4 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.4-69.4z"/>
        </svg>
      )}
      {label}
    </button>
  );
}

/* ── Login Form ──────────────────────────────────────────────────────────── */
function LoginForm({ onAlert }: { onAlert: (msg: string, type?: AlertType) => void }) {
  const postLoginRedirect = usePostLoginRedirect();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSending, setForgotSending] = useState(false);

  async function forgotPassword() {
    if (!email.trim()) {
      return onAlert('Enter your email above first, then click "Forgot password?"');
    }
    setForgotSending(true);
    onAlert('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        credentials: 'include',
      });
      const d = await res.json().catch(() => ({}));
      // Backend always returns success to avoid leaking which emails exist
      onAlert(d.message || 'If that email exists, a reset link has been sent.', 'ok');
    } catch {
      onAlert('Cannot reach server. Please check your connection.');
    } finally {
      setForgotSending(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onAlert('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
        credentials: 'include',
      });
      if (res.status === 429) return onAlert('Too many login attempts. Please wait 15 minutes.');
      const d = await res.json();
      if (!d.success) return onAlert(d.message || 'Login failed');
      setCachedUser(d.data.user);
      onAlert('Login successful! Redirecting…', 'ok');
      // FIX: honour ?redirect param so shared links work
      postLoginRedirect(d.data.user.role);
    } catch { onAlert('Cannot reach server. Please check your connection.'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-[1.2rem]">
        <label className="block text-[0.85rem] font-medium text-[#e6edf3] mb-[0.4rem]">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          autoComplete="email"
          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-[0.7rem] text-[0.9rem] text-[#e6edf3] font-[inherit] outline-none focus:border-[#2f81f7] focus:shadow-[0_0_0_2px_rgba(47,129,247,0.25)] transition-all"
        />
      </div>
      <div className="mb-2">
        <label className="block text-[0.85rem] font-medium text-[#e6edf3] mb-[0.4rem]">Password</label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 pr-10 py-[0.7rem] text-[0.9rem] text-[#e6edf3] font-[inherit] outline-none focus:border-[#2f81f7] focus:shadow-[0_0_0_2px_rgba(47,129,247,0.25)] transition-all"
          />
          <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8FA8D6] text-sm cursor-pointer p-1 border-0 bg-transparent">
            <BrandIcon name={showPwd ? 'fa-eye-slash' : 'fa-eye'} />
          </button>
        </div>
      </div>
      <button type="button" onClick={forgotPassword} disabled={forgotSending} className="block text-right text-[12px] text-[#2f81f7] mb-5 w-full hover:underline disabled:opacity-60">
        {forgotSending ? 'Sending reset link…' : 'Forgot password?'}
      </button>
      <button
        type="submit"
        disabled={loading}
        className="mb-5 w-full rounded-2xl border-0 py-3 text-[0.95rem] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #4F8EF7, #2F6FED)', boxShadow: '0 16px 36px rgba(47,111,237,0.28)' }}
      >
        {loading ? <Spinner /> : 'Enter workspace'}
      </button>
      <div className="flex items-center gap-2 text-[0.75rem] text-[#6e7681] my-4">
        <div className="flex-1 h-px bg-[#30363d]" /><span>or continue with</span><div className="flex-1 h-px bg-[#30363d]" />
      </div>
      <div className="flex flex-col gap-3">
        <GoogleButton onAlert={onAlert} />
        <AppleButton onAlert={onAlert} />
      </div>
    </form>
  );
}

/* ── Register Form ───────────────────────────────────────────────────────── */
function RegisterForm({ onAlert }: { onAlert: (msg: string, type?: AlertType) => void }) {
  const postLoginRedirect = usePostLoginRedirect();
  const [role, setRole] = useState<Role>('student');
  const [fields, setFields] = useState({ fn: '', ln: '', email: '', pwd: '', pwdC: '', company: '' });
  const [niche, setNiche] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const up = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }));
  const niches = ['Web Development', 'Data Science', 'UI/UX Design', 'AI & Machine Learning', 'Cybersecurity', 'Cloud Engineering', 'Product Management', 'Digital Marketing'];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (fields.pwd !== fields.pwdC) return onAlert('Passwords do not match');
    setLoading(true); onAlert('');
    try {
      const body: any = { firstName: fields.fn, lastName: fields.ln, email: fields.email, password: fields.pwd, role, niche };
      if (role === 'employer' && fields.company) body.company = fields.company;
      if (role === 'student' && !niche) return onAlert('Choose your learning niche to continue');
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (res.status === 429) return onAlert('Too many attempts. Please wait 15 minutes.');
      const d = await res.json();
      if (!d.success) { const msg = d.errors ? d.errors.map((x: any) => x.msg).join('. ') : (d.message || 'Registration failed'); return onAlert(msg); }
      setCachedUser(d.data.user);
      onAlert('Account created! Redirecting…', 'ok');
      // FIX: honour ?redirect param so shared links work
      postLoginRedirect(d.data.user.role);
    } catch { onAlert('Cannot reach server. Please check your connection.'); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full bg-[#0d1117] border border-[#30363d] rounded-[8px] px-3 py-[0.7rem] text-[0.9rem] text-[#e6edf3] font-[inherit] outline-none focus:border-[#2f81f7] focus:shadow-[0_0_0_2px_rgba(47,129,247,0.25)] transition-all";
  const labelCls = "block text-[0.85rem] font-medium text-[#e6edf3] mb-[0.4rem]";

  return (
    <form onSubmit={submit}>
      {/* Student / Employer role tabs */}
      <div className="flex gap-2 bg-[#0d1117] p-[0.3rem] rounded-[48px] mb-6 border border-[#2a2f38]">
        {(['student', 'employer'] as Role[]).map(r => (
          <button
            type="button"
            key={r}
            onClick={() => setRole(r)}
            className={`flex-1 text-center py-[0.6rem] text-[0.9rem] font-medium rounded-[40px] cursor-pointer transition-all border-0 font-[inherit] ${role === r ? 'bg-[#2f81f7] text-white shadow-[0_2px_6px_rgba(47,129,247,0.3)]' : 'bg-transparent text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'}`}
          >
            {r === 'student' ? '👩‍🎓 Student' : '🏢 Employer'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-[1.2rem]">
        <div>
          <label className={labelCls}>First Name</label>
          <input type="text" value={fields.fn} onChange={e => up('fn', e.target.value)} placeholder="Alex" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Last Name</label>
          <input type="text" value={fields.ln} onChange={e => up('ln', e.target.value)} placeholder="Johnson" required className={inputCls} />
        </div>
      </div>

      {role === 'employer' && (
        <div className="mb-[1.2rem]">
          <label className={labelCls}>Company Name</label>
          <input type="text" value={fields.company} onChange={e => up('company', e.target.value)} placeholder="Your company" className={inputCls} />
        </div>
      )}

      <div className="mb-[1.2rem]">
        <label className={labelCls}>Email</label>
        <input type="email" value={fields.email} onChange={e => up('email', e.target.value)} placeholder="name@example.com" required className={inputCls} />
      </div>

      <div className="mb-[1.2rem]">
        <label className={labelCls}>Password</label>
        <div className="relative">
          <input type={showPwd ? 'text' : 'password'} value={fields.pwd} onChange={e => up('pwd', e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number" required className={`${inputCls} pr-10`} />
          <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8FA8D6] text-sm cursor-pointer p-1 border-0 bg-transparent">
            <BrandIcon name={showPwd ? 'fa-eye-slash' : 'fa-eye'} />
          </button>
        </div>
      </div>

      <div className="mb-5">
        <label className={labelCls}>Confirm Password</label>
        <input type="password" value={fields.pwdC} onChange={e => up('pwdC', e.target.value)} placeholder="Re-enter your password" required className={inputCls} />
      </div>

      {role === 'student' && (
        <div className="mb-5">
          <label className={labelCls}>Learning Niche</label>
          <div className="grid grid-cols-2 gap-2">
            {niches.map(item => (
              <button
                type="button"
                key={item}
                onClick={() => setNiche(item)}
                className={`text-left px-3.5 py-3 rounded-2xl border transition-all text-sm ${niche === item ? 'bg-[#5b4cf5] border-[#5b4cf5] text-white' : 'bg-[#0d1117] border-[#30363d] text-[#e6edf3] hover:bg-[#161b22]'}`}
              >
                {item}
              </button>
            ))}
          </div>
          {!niche && <p className="text-[0.8rem] text-[#f87171] mt-2">Select a niche before continuing.</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mb-5 w-full rounded-2xl border-0 py-3 text-[0.95rem] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #00A6A6, #0E7490)', boxShadow: '0 16px 36px rgba(14,116,144,0.22)' }}
      >
        {loading ? <Spinner /> : 'Create account'}
      </button>

      <div className="flex items-center gap-2 text-[0.75rem] text-[#6e7681] mb-4">
        <div className="flex-1 h-px bg-[#30363d]" /><span>or continue with</span><div className="flex-1 h-px bg-[#30363d]" />
      </div>
      <div className="flex flex-col gap-3">
        <GoogleButton onAlert={onAlert} role={role} niche={role === 'student' ? niche : undefined} label="Sign up with Google" />
        <AppleButton onAlert={onAlert} role={role} niche={role === 'student' ? niche : undefined} label="Sign up with Apple" />
      </div>
      <p className="text-[0.72rem] text-[#7d8590] text-left leading-relaxed mt-4">
        By creating an account you agree to our{' '}
        <a href="/privacy" className="text-[#2f81f7] hover:underline">Terms of Service</a>{' '}
        and <a href="/privacy" className="text-[#2f81f7] hover:underline">Privacy Policy</a>.
      </p>
    </form>
  );
}

/* ── Feature list for hero column ───────────────────────────────────────── */
const features = [
  { icon: 'fa-graduation-cap', title: 'Career-grade learning paths', desc: 'Move from exploration to job-ready capability with structured, high-signal learning tracks.' },
  { icon: 'fa-certificate', title: 'Verified proof of skill', desc: 'Bring together certificates, assessments, and outcomes in one trusted profile.' },
  { icon: 'fa-layer-group', title: 'Portfolio with hiring context', desc: 'Show work, impact, and technologies in a format employers can screen quickly.' },
  { icon: 'fa-briefcase', title: 'Matched opportunities', desc: 'Surface roles and AI-scouted openings that align with your skill profile.' },
  { icon: 'fa-users', title: 'Community momentum', desc: 'Share progress, ask better questions, and stay accountable with peers.' },
  { icon: 'fa-chart-line', title: 'Readiness signals', desc: 'Track progress, merit standing, and the actions that improve employability.' },
];

/* ── Main Page ───────────────────────────────────────────────────────────── */
function LoginPageInner() {
  const searchParams = useSearchParams();
  const initTab: Tab = (searchParams.get('tab') as Tab) === 'register' ? 'register' : 'login';
  const [tab, setTab] = useState<Tab>(initTab);
  const [alert, setAlert] = useState<{ msg: string; type: AlertType }>({ msg: '', type: 'err' });

  function onAlert(msg: string, type: AlertType = 'err') {
    setAlert({ msg, type });
  }

  return (
    <div
      className="min-h-screen text-[#e6edf3] flex items-start justify-center py-8 px-4"
      style={{ background: 'radial-gradient(circle at top left, rgba(79,142,247,0.16) 0%, transparent 34%), radial-gradient(circle at bottom right, rgba(0,229,160,0.1) 0%, transparent 30%), #080C14', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <div className="w-full max-w-7xl">
        <div className="flex flex-wrap gap-8 items-stretch">

          {/* ── LEFT: Hero / features ──────────────────────────────────── */}
          <div
            className="flex-[1.2] rounded-4xl p-8 border shadow-[0_30px_70px_rgba(0,0,0,0.34)]"
            style={{ background: 'linear-gradient(145deg, rgba(12,18,32,0.98) 0%, rgba(8,12,20,0.98) 100%)', borderColor: 'rgba(79,142,247,0.16)' }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-6">
              <img src="/meritlives.svg" alt="SkillHub" style={{ width: 28, height: 28 }} />
              <span className="font-jakarta font-extrabold text-[22px] tracking-tight text-white">SkillHub Pro</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.22)', color: '#8FB8FF' }}>
              <BrandIcon name="fa-sparkles" />
              Workforce acceleration for Africa
            </div>

            <h1
              className="mb-3 mt-6 font-jakarta font-extrabold leading-[1.1]"
              style={{ fontSize: 'clamp(2rem,3vw,2.8rem)', background: 'linear-gradient(135deg,#ffffff 0%,#b9d3ff 45%,#8DE1D8 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
            >
              {tab === 'login' ? 'Return to your operating system for skills, proof, and hiring.' : 'Build a profile employers can trust from day one.'}
            </h1>
            <p className="mb-8 border-l-[3px] pl-4 text-[1rem]" style={{ borderColor: '#4F8EF7', color: 'rgba(255,255,255,0.62)' }}>
              SkillHub Pro connects learning, proof of work, community momentum, and matched opportunities in one production-grade workspace.
            </p>

            <ul className="list-none">
              {features.map(f => (
                <li key={f.title} className="flex gap-3 mb-6">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                    style={{ background: 'rgba(0,229,160,0.12)', color: '#00E5A0' }}>
                    <BrandIcon name={f.icon} />
                  </div>
                  <div>
                    <h3 className="text-[1rem] font-semibold text-[#e6edf3] mb-[0.2rem]">{f.title}</h3>
                    <p className="text-[0.85rem]" style={{ color: 'rgba(255,255,255,0.48)' }}>{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Testimonial */}
            <div className="mt-2 rounded-2xl p-5 backdrop-blur-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="mb-3.5 text-[13.5px] italic leading-relaxed text-[rgba(255,255,255,0.72)]">
                “The platform made my profile look serious. Recruiters could see proof, not just claims, and that changed the quality of interviews I got.”
              </p>
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#2F6FED] bg-[#10213B] text-xs font-bold text-white">AO</div>
                <div>
                  <div className="text-sm font-semibold text-white">Adaeze Okoye</div>
                  <div className="text-xs text-[#8b949e]">Product Analyst, Lagos Growth Lab</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Auth card ────────────────────────────────────────── */}
          <div className="flex-1 min-w-85">
            <div
              className="rounded-[1.75rem] border p-7 shadow-[0_18px_48px_rgba(0,0,0,0.32)] h-full"
              style={{ background: 'rgba(12,18,32,0.96)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              {/* Sign In / Create Account tabs */}
              <div
                className="mb-7 flex gap-2 rounded-[48px] border p-[0.3rem]"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                {(['login', 'register'] as Tab[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTab(t); setAlert({ msg: '', type: 'err' }); }}
                    className={`flex-1 text-center py-[0.6rem] text-[0.9rem] font-medium rounded-[40px] cursor-pointer transition-all border-0 font-[inherit] ${tab === t ? 'text-white shadow-[0_2px_6px_rgba(47,129,247,0.3)]' : 'bg-transparent text-[#8b949e] hover:text-[#e6edf3]'}`}
                    style={tab === t ? { background: 'linear-gradient(135deg, #4F8EF7, #2F6FED)' } : undefined}
                  >
                    {t === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              <h2 className="mb-1 font-jakarta text-[1.8rem] font-extrabold tracking-tight text-white">
                {tab === 'login' ? 'Resume your progress' : 'Open your SkillHub Pro account'}
              </h2>
              <p className="mb-6 text-[0.9rem]" style={{ color: 'rgba(255,255,255,0.46)' }}>
                {tab === 'login' ? 'Access your courses, portfolio proof, AI insights, and matched opportunities.' : 'Start with a profile built for learners, builders, and hiring teams.'}
              </p>

              <Alert msg={alert.msg} type={alert.type} />

              {tab === 'login' && <LoginForm onAlert={onAlert} />}
              {tab === 'register' && <RegisterForm onAlert={onAlert} />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0c10] grid place-items-center text-white">Loading…</div>}>
      <LoginPageInner />
    </Suspense>
  );
}