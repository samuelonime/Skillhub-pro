'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { setCachedUser } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

const API = 'https://skillhub-u918.onrender.com/api/v1';

type Tab = 'login' | 'register' | 'forgot' | 'reset';
type Role = 'student' | 'employer' | 'instructor';
type AlertType = 'err' | 'ok';

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

function LoginForm({ onAlert }: { onAlert: (msg: string, type?: AlertType) => void }) {
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
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
        credentials: 'include', // receive HttpOnly cookies
      });
      if (res.status === 429) return onAlert('Too many login attempts. Please wait 15 minutes.');
      const d = await res.json();
      if (!d.success) return onAlert(d.message || 'Login failed');
      // Only cache non-sensitive display data — tokens are in HttpOnly cookies
      setCachedUser(d.data.user);
      onAlert('Login successful! Redirecting…', 'ok');
      const role = d.data.user.role;
      setTimeout(() => router.push(role === 'employer' ? '/employer' : role === 'admin' ? '/admin' : '/dashboard'), 800);
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
      <div className="flex items-center gap-2.5 my-4 text-[#9898b8] text-xs"><div className="flex-1 h-px bg-[#e8e8f0]" />or<div className="flex-1 h-px bg-[#e8e8f0]" /></div>
      <button type="button" className="w-full py-3 bg-white text-[#0a0a0f] border border-[#e8e8f0] rounded-xl text-sm font-medium font-[inherit] cursor-pointer flex items-center justify-center gap-2.5 hover:border-[#4285f4] hover:shadow-[0_2px_10px_rgba(66,133,244,0.15)] transition-all">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4.5 h-4.5" /> Continue with Google
      </button>
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
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include', // receive HttpOnly cookies
      });
      if (res.status === 429) return onAlert('Too many attempts. Please wait 15 minutes.');
      const d = await res.json();
      if (!d.success) { const msg = d.errors ? d.errors.map((x: any) => x.msg).join('. ') : (d.message || 'Registration failed'); return onAlert(msg); }
      // Only cache non-sensitive display data — tokens are in HttpOnly cookies
      setCachedUser(d.data.user);
      onAlert('Account created! Redirecting…', 'ok');
      setTimeout(() => router.push(role === 'employer' ? '/employer' : '/dashboard'), 800);
    } catch { onAlert('Cannot reach server. Please check your connection.'); }
    finally { setLoading(false); }
  }

  const roles: { key: Role; icon: string; label: string }[] = [
    { key: 'student', icon: 'fa-user-graduate', label: 'Student' },
    { key: 'employer', icon: 'fa-building', label: 'Employer' },
    { key: 'instructor', icon: 'fa-chalkboard-teacher', label: 'Instructor' },
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
      <div className="flex items-center gap-2.5 mb-4 text-[#9898b8] text-xs"><div className="flex-1 h-px bg-[#e8e8f0]" />or<div className="flex-1 h-px bg-[#e8e8f0]" /></div>
      <button type="button" className="w-full py-3 bg-white text-[#0a0a0f] border border-[#e8e8f0] rounded-xl text-sm font-medium font-[inherit] cursor-pointer flex items-center justify-center gap-2.5 hover:border-[#4285f4] transition-all mb-3.5">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4.5 h-4.5" /> Continue with Google
      </button>
      <p className="text-xs text-[#6b6b8a] text-center leading-relaxed">By creating an account you agree to our <a href="#" className="text-[#5b4cf5]">Terms of Service</a> and <a href="#" className="text-[#5b4cf5]">Privacy Policy</a>.</p>
    </form>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const initTab: Tab = (searchParams.get('tab') as Tab) === 'register' ? 'register' : 'login';
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
        {/* Tab switcher — only for login/register */}
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

        {tab === 'login' && <LoginForm onAlert={onAlert} />}
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