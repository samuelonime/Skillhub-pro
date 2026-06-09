'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { setCachedUser, apiFetch, API_BASE } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

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
      };
    };
  }
}

function Alert({ msg, type }: { msg: string; type: AlertType }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-[10px] text-[13px] mb-3.5 ${type === 'ok' ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]' : 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'}`}>
      <i className={`fas fa-${type === 'ok' ? 'check-circle' : 'exclamation-circle'}`} /> {msg}
    </div>
  );
}

function Spinner() {
  return <div className="w-[17px] h-[17px] border-2 border-white/30 border-t-white rounded-full mx-auto" style={{ animation: 'spin 0.7s linear infinite' }} />;
}

function GoogleButton({ onAlert, role, label = 'Continue with Google' }: {
  onAlert: (msg: string, type?: AlertType) => void;
  role?: Role;
  label?: string;
}) {
  const router = useRouter();
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
    if (!window.google) {
      return onAlert('Google sign-in not ready. Please refresh and try again.');
    }
    setGLoading(true);
    onAlert('');
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: async ({ credential }: { credential: string }) => {
        try {
          const body: Record<string, string> = { credential };
          if (role) body.role = role;
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
              router.push('/login?tab=register');
              return;
            }
            onAlert(d.message || 'Google sign-in failed');
            return;
          }
          setCachedUser(d.data.user);
          onAlert('Google sign-in successful! Redirecting…', 'ok');
          const userRole = d.data.user.role;
          setTimeout(() => router.push(userRole === 'employer' ? '/employer' : userRole === 'admin' ? '/admin' : '/dashboard'), 800);
        } catch {
          onAlert('Google sign-in failed. Please check your connection.');
        } finally {
          setGLoading(false);
        }
      },
    });
    window.google.accounts.id.prompt();
  }, [role, onAlert, router]);

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={gLoading}
      className="w-full py-3 bg-white text-[#0a0a0f] border border-[#e8e8f0] rounded-xl text-sm font-medium font-[inherit] cursor-pointer flex items-center justify-center gap-2.5 hover:border-[#4285f4] hover:shadow-[0_2px_10px_rgba(66,133,244,0.15)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {gLoading ? (
        <div className="w-[17px] h-[17px] border-2 border-[#4285f4]/30 border-t-[#4285f4] rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
      ) : (
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4.5 h-4.5" />
      )}
      {label}
    </button>
  );
}

/* ── Apple Sign-In Button ───────────────────────────────────────────────── */
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: object) => void;
        signIn: () => Promise<{ authorization: { id_token: string }; user?: { name?: { firstName?: string; lastName?: string } } }>;
      };
    };
  }
}

function AppleButton({ onAlert, role, label = 'Continue with Apple' }: {
  onAlert: (msg: string, type?: AlertType) => void;
  role?: Role;
  label?: string;
}) {
  const router = useRouter();
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
    onAlert('');
    setLoading(true);
    try {
      if (!window.AppleID) throw new Error('Apple JS not loaded. Please refresh and try again.');

      window.AppleID.auth.init({
        clientId:     process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || 'com.skillhub.web',
        scope:        'name email',
        redirectURI:  window.location.origin + '/login',
        usePopup:     true,
      });

      const response = await window.AppleID.auth.signIn();
      const id_token  = response.authorization.id_token;
      const appleUser = response.user; // only present on first login

      const body: Record<string, any> = { id_token };
      if (role)      body.role = role;
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
          router.push('/login?tab=register');
          return;
        }
        onAlert(d.message || 'Apple sign-in failed');
        return;
      }

      setCachedUser(d.data.user);
      onAlert('Apple sign-in successful! Redirecting…', 'ok');
      const userRole = d.data.user.role;
      setTimeout(() => router.push(userRole === 'employer' ? '/employer' : userRole === 'admin' ? '/admin' : '/dashboard'), 800);
    } catch (err: any) {
      // Apple popup closed by user — don't show an error
      if (err?.error === 'popup_closed_by_user' || err?.error === 'user_cancelled_authorize') {
        setLoading(false);
        return;
      }
      onAlert(err.message || 'Apple sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [role, onAlert, router]);

  return (
    <button
      type="button"
      onClick={handleApple}
      disabled={loading}
      className="w-full py-3 bg-[#0a0a0f] text-white border border-[#0a0a0f] rounded-xl text-sm font-medium font-[inherit] cursor-pointer flex items-center justify-center gap-2.5 hover:bg-[#1a1a2e] hover:shadow-[0_2px_10px_rgba(0,0,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {loading ? (
        <div className="w-[17px] h-[17px] border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
      ) : (
        /* Apple logo SVG — using the official  mark */
        <svg width="17" height="17" viewBox="0 0 814 1000" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-145.5-100.5C92.8 790.4 51.3 699.2 51.3 612.5c0-151.3 104.6-231.6 206.7-231.6 55.4 0 101.4 37.4 136.5 37.4 33.5 0 85.8-39.6 149.1-39.6 24.2 0 108.2 2.6 168.6 71.4zm-109.4-194.5c31.4-37.4 53.9-89.6 53.9-141.9 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.4 33.5-146.5 75.3-28.2 32.2-55.4 84.4-55.4 137.4 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.4-69.4z"/>
        </svg>
      )}
      {label}
    </button>
  );
}

function LoginForm({ onAlert, redirectTo }: { onAlert: (msg: string, type?: AlertType) => void; redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const role = d.data.user.role;
      const destination = redirectTo || (role === 'employer' ? '/employer' : role === 'admin' ? '/admin' : '/dashboard');
      setTimeout(() => router.push(destination), 800);
    } catch { onAlert('Cannot reach server. Please check your connection.'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-4">
        <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Email address</label>
        <div className="relative">
          <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px] pointer-events-none" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full pl-9 pr-3 py-3 border border-[#e8e8f0] rounded-[10px] text-sm font-[inherit] text-[#0a0a0f] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.15)] transition-all" />
        </div>
      </div>
      <div className="mb-2">
        <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Password</label>
        <div className="relative">
          <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px] pointer-events-none" />
          <input type={showPwd ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" required className="w-full pl-9 pr-10 py-3 border border-[#e8e8f0] rounded-[10px] text-sm font-[inherit] text-[#0a0a0f] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.15)] transition-all" />
          <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898b8] text-sm bg-none border-none cursor-pointer p-1">
            <i className={`fas fa-${showPwd ? 'eye-slash' : 'eye'}`} />
          </button>
        </div>
      </div>
      <button type="button" className="block text-right text-[12px] text-[#5b4cf5] mb-4 w-full">Forgot password?</button>
      <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#5b4cf5] text-white rounded-xl text-[15px] font-semibold font-[inherit] cursor-pointer hover:bg-[#7c6ff7] hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(91,76,245,0.33)] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
        {loading ? <Spinner /> : 'Sign In'}
      </button>
      <div className="flex items-center gap-2.5 my-4 text-[#9898b8] text-xs"><div className="flex-1 h-px bg-[#e8e8f0]" />or continue with<div className="flex-1 h-px bg-[#e8e8f0]" /></div>
      <div className="flex flex-col gap-2.5">
        <GoogleButton onAlert={onAlert} />
        <AppleButton onAlert={onAlert} />
      </div>
    </form>
  );
}

function RegisterForm({ onAlert }: { onAlert: (msg: string, type?: AlertType) => void }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>('student');
  const [fields, setFields] = useState({ fn: '', ln: '', email: '', pwd: '', pwdC: '', company: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const up = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (fields.pwd !== fields.pwdC) return onAlert('Passwords do not match');
    setLoading(true); onAlert('');
    try {
      const body: any = { firstName: fields.fn, lastName: fields.ln, email: fields.email, password: fields.pwd, role };
      if (role === 'employer' && fields.company) body.company = fields.company;
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
      setTimeout(() => router.push(role === 'employer' ? '/employer' : '/dashboard'), 800);
    } catch { onAlert('Cannot reach server. Please check your connection.'); }
    finally { setLoading(false); }
  }

  const roles: { key: Role; icon: string; label: string }[] = [
    { key: 'student', icon: 'fa-user-graduate', label: 'Student' },
    { key: 'employer', icon: 'fa-building', label: 'Employer' },
    
  ];

  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {roles.map(r => (
          <button type="button" key={r.key} onClick={() => setRole(r.key)} className={`py-3 px-1.5 border-2 rounded-xl cursor-pointer text-center transition-all ${role === r.key ? 'border-[#5b4cf5] bg-[#f4f2ff]' : 'border-[#e8e8f0] hover:border-[#7c6ff7]'}`}>
            <i className={`fas ${r.icon} text-[17px] block mb-1 ${role === r.key ? 'text-[#5b4cf5]' : 'text-[#6b6b8a]'}`} />
            <span className={`text-xs font-semibold ${role === r.key ? 'text-[#5b4cf5]' : 'text-[#2d2d42]'}`}>{r.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div>
          <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">First Name</label>
          <div className="relative"><i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px] pointer-events-none" /><input type="text" value={fields.fn} onChange={e => up('fn', e.target.value)} placeholder="Alex" required className="w-full pl-9 pr-3 py-3 border border-[#e8e8f0] rounded-[10px] text-sm font-[inherit] text-[#0a0a0f] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.15)] transition-all" /></div>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Last Name</label>
          <div className="relative"><i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px] pointer-events-none" /><input type="text" value={fields.ln} onChange={e => up('ln', e.target.value)} placeholder="Johnson" required className="w-full pl-9 pr-3 py-3 border border-[#e8e8f0] rounded-[10px] text-sm font-[inherit] text-[#0a0a0f] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.15)] transition-all" /></div>
        </div>
      </div>
      {role === 'employer' && (
        <div className="mb-4">
          <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Company Name</label>
          <div className="relative"><i className="fas fa-briefcase absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px] pointer-events-none" /><input type="text" value={fields.company} onChange={e => up('company', e.target.value)} placeholder="Your company" className="w-full pl-9 pr-3 py-3 border border-[#e8e8f0] rounded-[10px] text-sm font-[inherit] text-[#0a0a0f] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.15)] transition-all" /></div>
        </div>
      )}
      <div className="mb-4">
        <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Email Address</label>
        <div className="relative"><i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px] pointer-events-none" /><input type="email" value={fields.email} onChange={e => up('email', e.target.value)} placeholder="you@example.com" required className="w-full pl-9 pr-3 py-3 border border-[#e8e8f0] rounded-[10px] text-sm font-[inherit] text-[#0a0a0f] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.15)] transition-all" /></div>
      </div>
      <div className="mb-4">
        <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Password</label>
        <div className="relative">
          <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px] pointer-events-none" />
          <input type={showPwd ? 'text' : 'password'} value={fields.pwd} onChange={e => up('pwd', e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number" required className="w-full pl-9 pr-10 py-3 border border-[#e8e8f0] rounded-[10px] text-sm font-[inherit] text-[#0a0a0f] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.15)] transition-all" />
          <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898b8] text-sm cursor-pointer p-1"><i className={`fas fa-${showPwd ? 'eye-slash' : 'eye'}`} /></button>
        </div>
      </div>
      <div className="mb-5">
        <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Confirm Password</label>
        <div className="relative"><i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px] pointer-events-none" /><input type="password" value={fields.pwdC} onChange={e => up('pwdC', e.target.value)} placeholder="Re-enter your password" required className="w-full pl-9 pr-3 py-3 border border-[#e8e8f0] rounded-[10px] text-sm font-[inherit] text-[#0a0a0f] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.15)] transition-all" /></div>
      </div>
      <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#5b4cf5] text-white rounded-xl text-[15px] font-semibold font-[inherit] cursor-pointer hover:bg-[#7c6ff7] hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(91,76,245,0.33)] disabled:opacity-60 disabled:cursor-not-allowed transition-all mb-4">
        {loading ? <Spinner /> : 'Create Account'}
      </button>
      <div className="flex items-center gap-2.5 mb-4 text-[#9898b8] text-xs"><div className="flex-1 h-px bg-[#e8e8f0]" />or continue with<div className="flex-1 h-px bg-[#e8e8f0]" /></div>
      <div className="flex flex-col gap-2.5">
        <GoogleButton onAlert={onAlert} role={role} label="Sign up with Google" />
        <AppleButton onAlert={onAlert} role={role} label="Sign up with Apple" />
      </div>
      <p className="text-xs text-[#6b6b8a] text-center leading-relaxed mt-3.5">By creating an account you agree to our <a href="#" className="text-[#5b4cf5]">Terms of Service</a> and <a href="#" className="text-[#5b4cf5]">Privacy Policy</a>.</p>
    </form>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const initTab: Tab = (searchParams.get('tab') as Tab) === 'register' ? 'register' : 'login';
  const redirectTo = searchParams.get('redirect') || undefined;
  const [tab, setTab] = useState<Tab>(initTab);
  const [alert, setAlert] = useState<{ msg: string; type: AlertType }>({ msg: '', type: 'err' });

  const headings: Record<Tab, [string, string]> = {
    login: ['Welcome back', 'Sign in to your SkillHub account'],
    register: ['Create your account', 'Join 50,000+ professionals on SkillHub'],
    forgot: ['Forgot password?', "We'll send a reset link to your inbox"],
    reset: ['Set new password', 'Choose a strong password for your account'],
  };

  function onAlert(msg: string, type: AlertType = 'err') {
    setAlert({ msg, type });
  }

  return (
    <div className="min-h-screen grid grid-cols-2 bg-[#0a0a0f] text-white max-[860px]:grid-cols-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Left hero */}
      <div className="relative flex flex-col justify-between p-12 overflow-hidden max-[860px]:hidden" style={{ background: 'linear-gradient(140deg, #0d0b1e 0%, #1a1040 50%, #0a0a0f 100%)' }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: -180, left: -180, width: 560, height: 560, background: 'radial-gradient(circle, rgba(91,76,245,0.28) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ bottom: -80, right: -80, width: 360, height: 360, background: 'radial-gradient(circle, rgba(124,111,247,0.14) 0%, transparent 70%)' }} />
        <div className="relative z-[2] flex items-center gap-2.5">
          <img src="/meritlives.svg" alt="MeritLives" style={{width:28,height:28}} />
          <span className="font-syne font-extrabold text-[22px] tracking-tight">SkillHub</span>
        </div>
        <div className="relative z-[2]">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-[#7c6ff7] mb-6" style={{ background: 'rgba(91,76,245,0.18)', border: '1px solid rgba(91,76,245,0.32)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> Platform v2.0 — Now live
          </div>
          <h1 className="font-syne font-extrabold mb-4" style={{ fontSize: 'clamp(36px,3.8vw,50px)', lineHeight: 1.08, letterSpacing: -2 }}>
            Build skills.<br /><em className="not-italic brand-grad-text">Get hired.</em><br />Grow faster.
          </h1>
          <p className="text-[15px] leading-relaxed text-[#9898b8] max-w-[370px] mb-9">The professional platform connecting ambitious learners with top employers across Africa.</p>
          <div className="flex gap-7">
            {[['50K+','Active Learners'],['2,400+','Placements'],['98%','Satisfaction']].map(([n, l]) => (
              <div key={l} className="flex flex-col gap-0.5">
                <span className="font-syne font-bold text-[22px] tracking-tight">{n}</span>
                <span className="text-xs text-[#6b6b8a]">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-[2] rounded-2xl p-5 backdrop-blur-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[13.5px] leading-relaxed italic mb-3.5" style={{ color: 'rgba(255,255,255,0.72)' }}>
            "SkillHub helped me transition from marketing to data science in 6 months. Landed a role with a 40% salary increase."
          </p>
          <div className="flex items-center gap-2.5">
            <img className="w-8 h-8 rounded-full object-cover border-2 border-[#5b4cf5]" src="https://randomuser.me/api/portraits/women/32.jpg" alt="Sarah" />
            <div>
              <div className="text-sm font-semibold">Sarah Johnson</div>
              <div className="text-xs text-[#9898b8]">Data Analyst, TechVision Africa</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="bg-white text-[#0a0a0f] flex flex-col justify-center px-14 py-15 overflow-y-auto min-h-screen max-[480px]:px-4">
        {(tab === 'login' || tab === 'register') && (
          <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl w-fit mb-8">
            {(['login','register'] as Tab[]).map(t => (
              <button key={t} onClick={() => { setTab(t); setAlert({ msg: '', type: 'err' }); }} className={`px-6 py-2.5 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer transition-all border-0 ${tab === t ? 'bg-white text-[#0a0a0f] font-semibold shadow-[0_1px_5px_rgba(0,0,0,0.09)]' : 'bg-transparent text-[#6b6b8a]'}`}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>
        )}

        <h2 className="font-syne font-extrabold text-[27px] tracking-tight mb-1">{headings[tab][0]}</h2>
        <p className="text-sm text-[#6b6b8a] mb-7">{headings[tab][1]}</p>

        <Alert msg={alert.msg} type={alert.type} />

        {tab === 'login' && <LoginForm onAlert={onAlert} redirectTo={redirectTo} />}
        {tab === 'register' && <RegisterForm onAlert={onAlert} />}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] grid place-items-center text-white">Loading…</div>}>
      <LoginPageInner />
    </Suspense>
  );
}