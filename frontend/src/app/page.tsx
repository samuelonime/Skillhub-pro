'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between backdrop-blur-2xl border-b bg-[#08080f]/70 transition-all duration-300"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
        padding: scrolled ? '14px 60px' : '20px 60px',
      }}
    >
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-9 h-9 bg-[#5b4cf5] rounded-[10px] grid place-items-center text-white text-sm font-bold font-syne">S</div>
        <span className="font-syne font-extrabold text-xl text-white tracking-tight">SkillHub</span>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        {['Features', 'How it works', 'Pricing'].map((label, i) => (
          <a key={label} href={['#features', '#how', '#pricing'][i]} className="text-[#9898b8] text-sm font-medium hover:text-white transition-colors no-underline">
            {label}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login" className="px-5 py-2.5 border rounded-[10px] bg-transparent text-white text-sm font-medium hover:text-[#7c6ff7] transition-all no-underline" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          Sign in
        </Link>
        <Link href="/login?tab=register" className="px-5 py-2.5 bg-[#5b4cf5] rounded-[10px] text-white text-sm font-semibold hover:bg-[#7c6ff7] hover:-translate-y-px transition-all no-underline">
          Get started free
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  const avatarSeeds = [
    { name: 'AJ', bg: '5b4cf5' }, { name: 'SW', bg: '10b981' },
    { name: 'KO', bg: 'f59e0b' }, { name: 'TB', bg: 'ef4444' },
    { name: 'FA', bg: '8b5cf6' },
  ];

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden grid-overlay"
      style={{ paddingTop: 160, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}
    >
      {/* Blobs */}
      <div className="absolute rounded-full pointer-events-none animate-drift" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(91,76,245,0.3) 0%, transparent 70%)', top: -100, left: -150, filter: 'blur(100px)' }} />
      <div className="absolute rounded-full pointer-events-none animate-drift-2" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', bottom: -50, right: -100, filter: 'blur(100px)' }} />
      <div className="absolute rounded-full pointer-events-none animate-drift-3" style={{ width: 350, height: 350, background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)', top: '40%', left: '50%', filter: 'blur(100px)' }} />

      {/* Badge */}
      <div className="animate-fade-up relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium text-[#a78bfa] mb-7" style={{ background: 'rgba(91,76,245,0.15)', border: '1px solid rgba(91,76,245,0.35)' }}>
        <span className="animate-pulse-dot w-1.5 h-1.5 rounded-full bg-[#10b981]" style={{ boxShadow: '0 0 8px #10b981' }} />
        Now live in Nigeria &amp; across Africa
      </div>

      {/* H1 */}
      <h1 className="animate-fade-up-1 font-syne font-extrabold relative z-10 mb-6" style={{ fontSize: 'clamp(44px,6vw,82px)', lineHeight: 1.04, letterSpacing: -3 }}>
        <span className="grad-text">Launch Your Tech Career</span><br />
        With Skills That <span className="accent-text">Actually Matter</span>
      </h1>

      <p className="animate-fade-up-2 relative z-10 text-[#9898b8] max-w-[580px] mx-auto mb-10" style={{ fontSize: 'clamp(16px,1.8vw,19px)', lineHeight: 1.7 }}>
        SkillHub connects African tech talent with world-class courses, verified certificates, and top employers — all in one platform built for your growth.
      </p>

      <div className="animate-fade-up-3 flex items-center gap-3.5 justify-center flex-wrap relative z-10">
        <Link href="/login?tab=register" className="inline-flex items-center gap-2 px-7 py-4 bg-[#5b4cf5] rounded-2xl text-white text-base font-semibold hover:bg-[#7c6ff7] hover:-translate-y-0.5 transition-all no-underline" style={{ boxShadow: '0 8px 32px rgba(91,76,245,0.4)' }}>
          <i className="fas fa-rocket" /> Start for free
        </Link>
        <a href="#how" className="inline-flex items-center gap-2 px-7 py-4 bg-transparent rounded-2xl text-white text-base font-medium hover:text-[#a78bfa] transition-all no-underline" style={{ border: '1.5px solid rgba(255,255,255,0.08)' }}>
          <i className="fas fa-play-circle" /> See how it works
        </a>
      </div>

      {/* Social proof */}
      <div className="animate-fade-up-4 flex items-center gap-4 justify-center mt-12 relative z-10 flex-wrap">
        <div className="flex">
          {avatarSeeds.map((a, i) => (
            <img key={a.name} src={`https://ui-avatars.com/api/?name=${a.name}&background=${a.bg}&color=fff&bold=true`} alt={a.name} className="w-8 h-8 rounded-full object-cover border-2 border-[#08080f]" style={{ marginLeft: i === 0 ? 0 : -10 }} />
          ))}
        </div>
        <div>
          <div className="text-[#f59e0b] text-sm mb-0.5">★★★★★</div>
          <div className="text-[#9898b8] text-sm">Trusted by <strong className="text-white">12,000+</strong> tech professionals</div>
        </div>
      </div>

      {/* Dashboard preview */}
      <div className="animate-fade-up-5 relative z-10 mt-16 max-w-[900px] w-full">
        <div className="rounded-2xl p-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-1.5 px-3.5 py-2.5 mb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            <div className="flex-1 h-5 mx-3 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="bg-[#13131f] rounded-[13px] overflow-hidden grid" style={{ gridTemplateColumns: '200px 1fr', aspectRatio: '16/7' }}>
            {/* Sidebar */}
            <div className="bg-[#1e1e2e] p-5 flex flex-col gap-2" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#5b4cf5] rounded-[7px] grid place-items-center text-xs font-bold text-white font-syne">S</div>
                <span className="font-syne font-bold text-sm text-white">SkillHub</span>
              </div>
              {[['🏠','Dashboard',true],['📖','Courses',false],['💼','Jobs',false],['🏆','Certificates',false],['📁','Portfolio',false],['🪙','Rewards',false]].map(([icon, label, active]) => (
                <div key={String(label)} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs ${active ? 'text-[#a78bfa]' : 'text-[#9898b8]'}`} style={active ? { background: 'rgba(91,76,245,0.15)' } : {}}>
                  {icon} {label}
                </div>
              ))}
            </div>
            {/* Main */}
            <div className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-4 gap-2.5">
                {[['6','#a78bfa','Courses'],['3','#10b981','Certs'],['12','#f59e0b','Apps'],['1,250','#ef4444','Coins']].map(([v, c, l]) => (
                  <div key={String(l)} className="rounded-[10px] p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="font-syne font-bold text-xl mb-0.5" style={{ color: String(c) }}>{v}</div>
                    <div className="text-[10px] text-[#6b6b8a]">{l}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[10px] p-3.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-[11px] font-semibold text-[#9898b8] uppercase tracking-wide mb-2.5">Active Courses</div>
                  {[['#5b4cf5',65],['#10b981',30]].map(([color, width], i) => (
                    <div key={i} className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ background: `${color}4d` }} />
                      <div className="flex-1">
                        <div className="h-2 rounded-sm mb-1" style={{ width: '80%', background: 'rgba(255,255,255,0.06)' }} />
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-full rounded-full" style={{ width: `${width}%`, background: String(color) }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-[10px] p-3.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-[11px] font-semibold text-[#9898b8] uppercase tracking-wide mb-2.5">Job Matches</div>
                  {[['#f59e0b','92%','#10b981'],['#a78bfa','78%','#f59e0b']].map(([accent, pct, pill], i) => (
                    <div key={i} className="flex items-center gap-2 mb-2.5">
                      <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ background: `${accent}4d` }} />
                      <div className="flex-1">
                        <div className="h-2 rounded-sm mb-1" style={{ width: '70%', background: 'rgba(255,255,255,0.06)' }} />
                        <div className="h-2 rounded-sm" style={{ width: '45%', background: 'rgba(255,255,255,0.06)' }} />
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${pill}26`, color: String(pill) }}>{pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[300px] pointer-events-none z-[3]" style={{ background: 'linear-gradient(transparent, #08080f)' }} />
    </section>
  );
}

function StatsBand() {
  return (
    <div className="relative z-[4] py-8 px-[60px] flex items-center justify-center gap-16 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      {[['12K+','Active learners'],['95%','Job placement rate'],['500+','Hiring partners'],['50+','Courses available'],['₦0','To get started']].map(([num, desc]) => (
        <div key={String(desc)} className="text-center">
          <div className="font-syne font-extrabold text-4xl tracking-tight mb-1 stat-num-grad">{num}</div>
          <div className="text-[13px] text-[#6b6b8a]">{desc}</div>
        </div>
      ))}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="relative z-[4] py-24 max-w-[1200px] mx-auto" style={{ padding: '100px 60px' }}>
      <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold text-[#a78bfa] uppercase tracking-wide mb-5" style={{ background: 'rgba(91,76,245,0.12)', border: '1px solid rgba(91,76,245,0.25)' }}>
        <i className="fas fa-sparkles" /> Features
      </div>
      <h2 className="font-syne font-extrabold leading-tight mb-4" style={{ fontSize: 'clamp(32px,4vw,52px)', letterSpacing: -2 }}>
        Everything you need to<br /><span className="brand-grad-text">grow your career</span>
      </h2>
      <p className="text-[17px] leading-relaxed text-[#9898b8] max-w-[520px]">From learning to landing your dream job — SkillHub has every tool you need in one place.</p>

      <div className="grid grid-cols-2 gap-5 mt-14 max-[900px]:grid-cols-1">
        {/* Large card */}
        <div className="col-span-2 grid grid-cols-2 gap-8 items-center rounded-2xl p-8 hover:border-[rgba(91,76,245,0.4)] hover:-translate-y-1 transition-all max-[900px]:grid-cols-1 max-[900px]:col-span-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div className="w-12 h-12 rounded-2xl grid place-items-center text-xl mb-5" style={{ background: 'rgba(91,76,245,0.15)', color: '#7c6ff7' }}>
              <i className="fas fa-brain" />
            </div>
            <h3 className="font-syne font-bold text-xl tracking-tight mb-2.5">Smart Skill Matching</h3>
            <p className="text-[15px] leading-relaxed text-[#9898b8]">Our algorithm matches your current skills with jobs that need exactly what you have — and recommends courses to close the gap. Get 90%+ match rates before you even apply.</p>
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'rgba(91,76,245,0.06)', border: '1px solid rgba(91,76,245,0.15)' }}>
            <div className="text-xs text-[#9898b8] mb-3 font-semibold">YOUR SKILL PROFILE</div>
            <div className="flex flex-wrap gap-1 mb-4">
              {['JavaScript','React','Node.js','Python','CSS'].map(t => (
                <span key={t} className="px-3 py-1.5 text-[13px] text-[#a78bfa] rounded-full" style={{ background: 'rgba(91,76,245,0.12)', border: '1px solid rgba(91,76,245,0.2)' }}>{t}</span>
              ))}
            </div>
            <div className="p-3.5 rounded-[10px]" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="text-[11px] text-[#10b981] font-semibold mb-1.5">TOP MATCH</div>
              <div className="text-[13px] font-semibold text-white">Frontend Developer — Paystack</div>
              <div className="text-[11px] text-[#9898b8] mt-1">Remote · $2,500–$4,000/mo · <span className="text-[#10b981] font-bold">92% match</span></div>
            </div>
          </div>
        </div>

        {[
          { icon: 'fa-certificate', bg: 'rgba(16,185,129,0.15)', title: 'Verified Certificates', desc: 'Every certificate you earn is blockchain-verified and shareable. Employers trust SkillHub credentials because we verify them ourselves.' },
          { icon: 'fa-coins', bg: 'rgba(245,158,11,0.15)', title: 'Merit Coins Rewards', desc: 'Earn Merit Coins for every course completed, certificate added, and project uploaded. Redeem them for premium courses, profile boosts, and career services.' },
          { icon: 'fa-folder-open', bg: 'rgba(167,139,250,0.15)', title: 'Portfolio Builder', desc: 'Showcase your projects with AI-scored portfolios. Employers can see your work, skills, and certificates in one professional profile.' },
          { icon: 'fa-building', bg: 'rgba(91,76,245,0.15)', title: 'Employer Dashboard', desc: 'Post jobs, search verified candidates, and track applications — all from a dedicated employer portal built for African hiring teams.' },
        ].map(card => (
          <div key={card.title} className="rounded-2xl p-8 hover:border-[rgba(91,76,245,0.4)] hover:-translate-y-1 transition-all cursor-default" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-12 h-12 rounded-2xl grid place-items-center text-xl mb-5" style={{ background: card.bg }}>
              <i className={`fas ${card.icon}`} />
            </div>
            <h3 className="font-syne font-bold text-xl tracking-tight mb-2.5">{card.title}</h3>
            <p className="text-[15px] leading-relaxed text-[#9898b8]">{card.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="relative z-[4] py-24 max-w-[1200px] mx-auto text-center" style={{ padding: '100px 60px' }}>
      <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold text-[#a78bfa] uppercase tracking-wide mx-auto mb-5" style={{ background: 'rgba(91,76,245,0.12)', border: '1px solid rgba(91,76,245,0.25)' }}>
        <i className="fas fa-map" /> How it works
      </div>
      <h2 className="font-syne font-extrabold leading-tight mb-4" style={{ fontSize: 'clamp(32px,4vw,52px)', letterSpacing: -2 }}>
        Three steps to your<br /><span className="brand-grad-text">next opportunity</span>
      </h2>
      <p className="text-[17px] leading-relaxed text-[#9898b8] max-w-[520px] mx-auto">No complicated setup. Start learning and earning in minutes.</p>

      <div className="grid grid-cols-3 mt-14 relative max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <div className="absolute top-8 left-[15%] right-[15%] h-px max-[900px]:hidden" style={{ background: 'linear-gradient(90deg, transparent, #5b4cf5, transparent)' }} />
        {[
          { n: 1, title: 'Create your profile', desc: 'Sign up free, add your skills and experience. Your profile strength score guides you to stand out to employers.' },
          { n: 2, title: 'Learn & earn coins', desc: 'Enroll in free and premium courses. Complete modules, earn Merit Coins, and get certificates that employers actually verify.' },
          { n: 3, title: 'Get hired', desc: 'Apply to matched jobs with one click. Your verified profile does the talking — no more sending CVs into the void.' },
        ].map(s => (
          <div key={s.n} className="text-center px-6">
            <div className="w-16 h-16 rounded-full bg-[#5b4cf5] grid place-items-center font-syne font-extrabold text-2xl text-white mx-auto mb-6 relative z-[2]" style={{ boxShadow: '0 0 30px rgba(91,76,245,0.35)' }}>{s.n}</div>
            <h3 className="font-syne font-bold text-lg tracking-tight mb-2.5">{s.title}</h3>
            <p className="text-sm leading-relaxed text-[#9898b8]">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="relative z-[4] py-24 max-w-[1200px] mx-auto text-center" style={{ padding: '100px 60px' }}>
      <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold text-[#a78bfa] uppercase tracking-wide mx-auto mb-5" style={{ background: 'rgba(91,76,245,0.12)', border: '1px solid rgba(91,76,245,0.25)' }}>
        <i className="fas fa-tag" /> Pricing
      </div>
      <h2 className="font-syne font-extrabold leading-tight mb-4" style={{ fontSize: 'clamp(32px,4vw,52px)', letterSpacing: -2 }}>
        Start free.<br /><span className="brand-grad-text">Upgrade when ready.</span>
      </h2>
      <p className="text-[17px] leading-relaxed text-[#9898b8] max-w-[520px] mx-auto">No credit card required to get started.</p>

      <div className="grid grid-cols-3 gap-5 mt-14 max-[900px]:grid-cols-1">
        {/* Free */}
        <PricingCard
          label="Free" price="₦0" period="Forever free"
          features={[
            { y: true, t: 'Access 30+ free courses' }, { y: true, t: 'Basic job matching' },
            { y: true, t: 'Portfolio builder' }, { y: true, t: 'Merit Coins rewards' },
            { y: false, t: 'Premium courses' }, { y: false, t: 'Priority job matching' },
            { y: false, t: 'Featured profile' },
          ]}
          cta="Get started free" href="/login?tab=register" filled={false}
        />
        {/* Pro */}
        <PricingCard
          label="Pro" price="₦5,000" priceSub="/mo" period="or ₦45,000/year — save 25%"
          features={['Everything in Free','All premium courses','Priority job matching','Featured profile badge','Resume review service','Mock interview sessions','2× Merit Coin earning'].map(t => ({ y: true, t }))}
          cta="Start Pro free trial" href="/login?tab=register" filled featured badge="Most Popular"
        />
        {/* Employer */}
        <PricingCard
          label="Employer" price="₦15,000" priceSub="/mo" period="or ₦135,000/year"
          features={[
            ...['Post unlimited jobs','Search verified candidates','Employer dashboard','Application tracking','Skill-matched shortlists','Priority support'].map(t => ({ y: true, t })),
            { y: false, t: 'Course hosting' },
          ]}
          cta="Start hiring" href="/login?tab=register" filled={false}
        />
      </div>
    </section>
  );
}

function PricingCard({ label, price, priceSub, period, features, cta, href, filled, featured, badge }: any) {
  return (
    <div className="rounded-3xl p-9 relative hover:-translate-y-1.5 transition-all text-left" style={featured ? {
      border: '1px solid #5b4cf5',
      background: 'linear-gradient(140deg, rgba(91,76,245,0.12) 0%, rgba(91,76,245,0.04) 100%)',
      boxShadow: '0 0 0 1px #5b4cf5, 0 20px 60px rgba(91,76,245,0.2)',
    } : {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5b4cf5] text-white text-[11px] font-bold px-3.5 py-1 rounded-full whitespace-nowrap">{badge}</div>}
      <div className="text-[13px] font-semibold text-[#6b6b8a] uppercase tracking-widest mb-3">{label}</div>
      <div className="font-syne font-extrabold text-5xl tracking-tight mb-1">
        {price}{priceSub && <sub className="text-lg font-medium text-[#9898b8] align-middle">{priceSub}</sub>}
      </div>
      <div className="text-[13px] text-[#6b6b8a] mb-7">{period}</div>
      <ul className="flex flex-col gap-3 mb-8">
        {features.map((f: any) => (
          <li key={f.t} className={`flex items-center gap-2.5 text-sm ${f.y ? 'text-[#9898b8]' : 'text-white/25'}`}>
            <i className={`fas ${f.y ? 'fa-check text-[#10b981]' : 'fa-times'} text-xs flex-shrink-0`} /> {f.t}
          </li>
        ))}
      </ul>
      <Link href={href} className={`block w-full py-3.5 text-center rounded-xl text-[15px] font-semibold transition-all no-underline ${filled ? 'bg-[#5b4cf5] text-white hover:bg-[#7c6ff7] hover:-translate-y-px' : 'text-white hover:border-[#7c6ff7]'}`} style={!filled ? { border: '1.5px solid rgba(255,255,255,0.08)' } : { boxShadow: '0 8px 24px rgba(91,76,245,0.35)' }}>
        {cta}
      </Link>
    </div>
  );
}

function Testimonials() {
  const items = [
    { init: 'AJ', g1: '#5b4cf5', g2: '#7c6ff7', q: 'I went from zero to landing a React developer role at a Lagos startup in 4 months. The skill matching is scary accurate — I got a 92% match on my first application.', name: 'Alex Johnson', role: 'Frontend Developer, Lagos' },
    { init: 'SW', g1: '#10b981', g2: '#34d399', q: 'As an employer, finding verified talent used to take weeks. With SkillHub I posted a job and had 3 shortlisted candidates within 48 hours.', name: 'Sarah Williams', role: 'HR Manager, TechVision Africa' },
    { init: 'KO', g1: '#f59e0b', g2: '#fbbf24', q: 'The Merit Coins system kept me motivated. I redeemed coins for a mock interview, which helped me nail my Andela application. Got the job. Worth every minute.', name: 'Kofi Osei', role: 'Data Analyst, Andela' },
  ];
  return (
    <section className="relative z-[4] py-24 max-w-[1200px] mx-auto" style={{ padding: '100px 60px' }}>
      <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold text-[#a78bfa] uppercase tracking-wide mb-5" style={{ background: 'rgba(91,76,245,0.12)', border: '1px solid rgba(91,76,245,0.25)' }}>
        <i className="fas fa-quote-left" /> Stories
      </div>
      <h2 className="font-syne font-extrabold leading-tight mb-14" style={{ fontSize: 'clamp(32px,4vw,52px)', letterSpacing: -2 }}>
        Real people.<br /><span className="brand-grad-text">Real results.</span>
      </h2>
      <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-1">
        {items.map(t => (
          <div key={t.name} className="rounded-2xl p-7" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[#f59e0b] text-sm mb-3.5">★★★★★</div>
            <p className="text-[15px] leading-relaxed italic mb-5" style={{ color: 'rgba(255,255,255,0.72)' }}>"{t.q}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full grid place-items-center font-syne font-bold text-sm text-white flex-shrink-0" style={{ background: `linear-gradient(135deg,${t.g1},${t.g2})` }}>{t.init}</div>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-[#6b6b8a]">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <div className="relative z-[4] mb-20 rounded-[32px] py-20 px-[60px] text-center overflow-hidden mx-[60px] max-[900px]:mx-6 max-[900px]:py-14 max-[900px]:px-7" style={{ background: 'linear-gradient(135deg, rgba(91,76,245,0.2) 0%, rgba(91,76,245,0.05) 100%)', border: '1px solid rgba(91,76,245,0.3)' }}>
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(91,76,245,0.3) 0%, transparent 70%)' }} />
      <h2 className="font-syne font-extrabold leading-tight mb-4 relative z-[2]" style={{ fontSize: 'clamp(32px,4vw,52px)', letterSpacing: -2 }}>Ready to build your future?</h2>
      <p className="text-[17px] text-[#9898b8] max-w-[480px] mx-auto mb-9 relative z-[2] leading-relaxed">Join 12,000+ tech professionals already using SkillHub to learn, grow, and get hired.</p>
      <div className="flex gap-3.5 justify-center flex-wrap relative z-[2]">
        <Link href="/login?tab=register" className="inline-flex items-center gap-2 px-7 py-4 bg-[#5b4cf5] rounded-2xl text-white text-base font-semibold hover:bg-[#7c6ff7] hover:-translate-y-0.5 transition-all no-underline" style={{ boxShadow: '0 8px 32px rgba(91,76,245,0.4)' }}>
          <i className="fas fa-rocket" /> Create free account
        </Link>
        <Link href="/login" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-white text-base font-medium hover:text-[#a78bfa] transition-all no-underline" style={{ border: '1.5px solid rgba(255,255,255,0.08)' }}>
          <i className="fas fa-sign-in-alt" /> Sign in
        </Link>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative z-[4] py-12 px-[60px] flex items-center justify-between flex-wrap gap-5 max-[900px]:px-6 max-[900px]:flex-col max-[900px]:text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-[#5b4cf5] rounded-[10px] grid place-items-center font-syne font-bold text-white">S</div>
        <span className="font-syne font-extrabold text-xl text-white tracking-tight">SkillHub</span>
      </div>
      <span className="text-[13px] text-[#6b6b8a]">© 2025 SkillHub Pro. Built for Africa's tech talent.</span>
      <div className="flex gap-7">
        {['Privacy','Terms','Support'].map(l => <a key={l} href="#" className="text-[13px] text-[#6b6b8a] hover:text-white no-underline transition-colors">{l}</a>)}
        <Link href="/login" className="text-[13px] text-[#6b6b8a] hover:text-white no-underline transition-colors">Sign in</Link>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[#08080f] text-white min-h-screen overflow-x-hidden noise-bg">
      <Navbar />
      <Hero />
      <StatsBand />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
