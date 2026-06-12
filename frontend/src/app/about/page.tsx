
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/* ── Animated counter hook ──────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

/* ── Intersection observer hook ─────────────────────────────────────────── */
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Stat counter card ──────────────────────────────────────────────────── */
function StatCard({ value, suffix, label, accent }: {
  value: number; suffix: string; label: string; accent: string;
}) {
  const { ref, inView } = useInView();
  const count = useCountUp(value, 1800, inView);
  return (
    <div ref={ref} className="text-center py-8 px-4 rounded-3xl relative overflow-hidden group transition-all hover:-translate-y-1"
      style={{ background: '#0C1220', border: `1px solid ${accent}25` }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${accent}10 0%, transparent 65%)` }} />
      <div className="font-jakarta font-black text-[3rem] leading-none mb-2" style={{ color: accent }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-12 rounded-full" style={{ background: accent }} />
    </div>
  );
}

/* ── Value card ─────────────────────────────────────────────────────────── */
function ValueCard({ icon, title, desc, accent, delay }: {
  icon: string; title: string; desc: string; accent: string; delay: number;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <div ref={ref}
      className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-500 hover:-translate-y-1"
      style={{
        background: '#0C1220',
        border: `1px solid ${accent}22`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}>
      <div className="w-12 h-12 rounded-2xl grid place-items-center text-[18px]"
        style={{ background: `${accent}18`, color: accent }}>
        <i className={`fas ${icon}`} />
      </div>
      <div>
        <div className="font-jakarta font-bold text-[16px] text-white mb-2">{title}</div>
        <div className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</div>
      </div>
      <div className="h-px mt-auto" style={{ background: `${accent}25` }} />
    </div>
  );
}

/* ── Pillar card ─────────────────────────────────────────────────────────── */
function PillarCard({ num, icon, title, items, accent }: {
  num: string; icon: string; title: string; items: string[]; accent: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
      style={{ background: '#0C1220', border: `1px solid ${open ? accent + '40' : 'rgba(255,255,255,0.07)'}` }}
      onClick={() => setOpen(v => !v)}
    >
      <div className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl grid place-items-center text-[18px] flex-shrink-0"
          style={{ background: `${accent}18`, color: accent }}>
          <i className={`fas ${icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: `${accent}80` }}>
            Pillar {num}
          </div>
          <div className="font-jakarta font-bold text-[15px] text-white">{title}</div>
        </div>
        <div className="w-7 h-7 rounded-lg grid place-items-center flex-shrink-0 transition-transform duration-200"
          style={{ background: 'rgba(255,255,255,0.06)', transform: open ? 'rotate(180deg)' : 'none' }}>
          <i className="fas fa-chevron-down text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </div>
      </div>
      {open && (
        <div className="px-5 pb-5 pt-1" style={{ borderTop: `1px solid ${accent}18` }}>
          <ul className="flex flex-col gap-2.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]" style={{ background: accent }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Timeline item ──────────────────────────────────────────────────────── */
function TimelineItem({ year, title, desc, accent, last }: {
  year: string; title: string; desc: string; accent: string; last?: boolean;
}) {
  const { ref, inView } = useInView(0.15);
  return (
    <div ref={ref} className="flex gap-6 transition-all duration-600"
      style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(-20px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
      {/* Line + dot */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
        <div className="w-10 h-10 rounded-full grid place-items-center text-[11px] font-black z-10 relative"
          style={{ background: `${accent}20`, border: `2px solid ${accent}`, color: accent }}>
          {year.slice(2)}
        </div>
        {!last && <div className="flex-1 w-px mt-2" style={{ background: 'rgba(255,255,255,0.07)' }} />}
      </div>
      {/* Content */}
      <div className="pb-10 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: `${accent}80` }}>{year}</div>
        <div className="font-jakarta font-bold text-[15px] text-white mb-1.5">{title}</div>
        <div className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</div>
      </div>
    </div>
  );
}

/* ── Social link ─────────────────────────────────────────────────────────── */
function SocialLink({ icon, label, href, color }: { icon: string; label: string; href: string; color: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl no-underline transition-all hover:-translate-y-0.5 hover:opacity-90"
      style={{ background: `${color}12`, border: `1px solid ${color}30`, color }}>
      <i className={`fab ${icon} text-[15px]`} />
      <span className="text-[12.5px] font-semibold">{label}</span>
    </a>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function AboutPage() {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#080C14', fontFamily: "'Inter', sans-serif", color: '#E2E8F0' }}>

      {/* ── Sticky nav ────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all"
        style={{
          background: navScrolled ? 'rgba(8,12,20,0.95)' : 'transparent',
          borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
          backdropFilter: navScrolled ? 'blur(16px)' : 'none',
        }}>
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <img src="/meritlives.svg" alt="SkillHub" style={{ width: 26, height: 26 }} />
          <span className="font-jakarta font-extrabold text-[18px] text-white tracking-tight">SkillHub</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: 'Who We Are',  href: '#who' },
            { label: 'Our Pillars', href: '#pillars' },
            { label: 'Values',      href: '#values' },
            { label: 'Vision',      href: '#vision' },
            { label: 'Journey',     href: '#journey' },
          ].map(n => (
            <a key={n.label} href={n.href}
              className="px-3.5 py-2 rounded-xl text-[12.5px] font-medium no-underline transition-all hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login"
            className="px-4 py-2 rounded-xl text-[12.5px] font-semibold no-underline transition-all hover:opacity-80"
            style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.25)' }}>
            Sign In
          </Link>
          <Link href="/login?tab=register"
            className="px-4 py-2 rounded-xl text-[12.5px] font-bold no-underline transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4F8EF7, #00E5A0)', color: '#fff' }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-20">
        {/* Ambient orbs */}
        <div className="absolute pointer-events-none" style={{ top: '10%', left: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(79,142,247,0.14) 0%, transparent 65%)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: '15%', right: '8%', width: 380, height: 380, background: 'radial-gradient(circle, rgba(0,229,160,0.10) 0%, transparent 65%)' }} />
        <div className="absolute pointer-events-none" style={{ top: '40%', right: '20%', width: 260, height: 260, background: 'radial-gradient(circle, rgba(167,139,250,0.09) 0%, transparent 65%)' }} />

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <div className="relative z-10 text-center max-w-[860px] mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4F8EF7' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#4F8EF7' }}>
              A Meritlives LLC Product
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-jakarta font-black leading-[1.08] tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)' }}>
            <span className="text-white">We Build Platforms</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #4F8EF7 0%, #00E5A0 50%, #A78BFA 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              That Shape Futures
            </span>
          </h1>

          <p className="text-[16px] leading-relaxed max-w-[600px] mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
            SkillHub is built by Meritlives — a digital innovation subsidiary of KGC Meritzone Consults Ltd — with a single mandate: bridge the gap between human potential and the digital economy across Africa and beyond.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/login?tab=register"
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl no-underline font-jakarta font-bold text-[14px] text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #4F8EF7, #A78BFA)', boxShadow: '0 12px 40px rgba(79,142,247,0.35)' }}>
              <i className="fas fa-rocket text-[12px]" /> Join SkillHub Free
            </Link>
            <a href="#who"
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl no-underline font-jakarta font-semibold text-[14px] transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              Our Story <i className="fas fa-arrow-down text-[11px]" />
            </a>
          </div>

          {/* Scroll hint */}
          <div className="mt-16 flex justify-center">
            <div className="flex flex-col items-center gap-1.5 animate-bounce" style={{ animationDuration: '2s' }}>
              <div className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                <div className="w-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────────── */}
      <section className="px-6 py-8 max-w-[1200px] mx-auto -mt-4">
        <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
          <StatCard value={50000}  suffix="+"  label="Active Learners"       accent="#4F8EF7" />
          <StatCard value={8}      suffix=""   label="Learning Platforms"    accent="#00E5A0" />
          <StatCard value={213000} suffix="+"  label="Courses Available"     accent="#F59E0B" />
          <StatCard value={130}    suffix="+"  label="Countries Reached"     accent="#A78BFA" />
        </div>
      </section>

      {/* ── WHO WE ARE ────────────────────────────────────────────── */}
      <section id="who" className="px-6 py-20 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 gap-16 items-center max-lg:grid-cols-1">
          {/* Text side */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(79,142,247,0.7)' }}>
              Who We Are
            </div>
            <h2 className="font-jakarta font-extrabold text-[2.2rem] text-white leading-tight tracking-tight mb-6">
              A Digital Ecosystem Built for the Next Generation
            </h2>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Meritlives is a dynamic digital innovation subsidiary of <strong className="text-white/70">KGC Meritzone Consults Ltd</strong>, established with a mandate to empower individuals, businesses, and institutions through cutting-edge technology, data-driven solutions, and modern digital learning systems.
            </p>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              As a forward-looking technology brand, Meritlives bridges the gap between human potential and emerging digital opportunities — providing tools, platforms, training, and services designed for today's fast-paced, tech-first world.
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <strong className="text-white/70">SkillHub</strong> is our flagship EdTech product — the intersection of all four Meritlives pillars, brought together into one career-defining platform for students and professionals across Africa and beyond.
            </p>
          </div>

          {/* Visual side */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden relative"
              style={{ background: 'linear-gradient(145deg, #0D1A2E, #080C14)', border: '1px solid rgba(79,142,247,0.15)', minHeight: 360 }}>
              <div className="absolute pointer-events-none" style={{ top: -40, right: -20, width: 250, height: 250, background: 'radial-gradient(circle, rgba(79,142,247,0.18) 0%, transparent 65%)' }} />
              <div className="absolute pointer-events-none" style={{ bottom: -30, left: -10, width: 180, height: 180, background: 'radial-gradient(circle, rgba(0,229,160,0.12) 0%, transparent 65%)' }} />

              <div className="relative z-10 p-8 flex flex-col gap-5 h-full">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/meritlives.svg" alt="SkillHub" style={{ width: 32, height: 32 }} />
                  <div>
                    <div className="font-jakarta font-extrabold text-[16px] text-white">SkillHub</div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>by Meritlives LLC · KGC Meritzone</div>
                  </div>
                </div>

                {/* Company chain */}
                {[
                  { label: 'KGC Meritzone Consults Ltd',  note: 'Parent Company',          color: '#F59E0B' },
                  { label: 'Meritlives LLC',               note: 'Digital Innovation Arm',  color: '#4F8EF7' },
                  { label: 'SkillHub Platform',            note: 'Flagship EdTech Product', color: '#00E5A0' },
                ].map((item, i) => (
                  <div key={item.label}>
                    {i > 0 && (
                      <div className="flex items-center gap-2 my-1 ml-4">
                        <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
                        <i className="fas fa-arrow-down text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }} />
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3.5 rounded-xl"
                      style={{ background: `${item.color}0d`, border: `1px solid ${item.color}25` }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <div>
                        <div className="font-jakarta font-semibold text-[13px] text-white">{item.label}</div>
                        <div className="text-[10.5px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.note}</div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-auto p-3 rounded-xl text-[12px] italic" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  "As a subsidiary of KGC Meritzone, we inherit the discipline of a consulting firm and the agility of a modern tech brand."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE PILLARS ──────────────────────────────────────────── */}
      <section id="pillars" className="px-6 py-20" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(0,229,160,0.7)' }}>
              Our Core Pillars
            </div>
            <h2 className="font-jakarta font-extrabold text-[2rem] text-white tracking-tight mb-4">
              Four Pillars. One Ecosystem.
            </h2>
            <p className="text-[14px] max-w-[520px] mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Meritlives operates as an integrated ecosystem of digital services. SkillHub sits at the intersection of all four, delivering them as one seamless career platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <PillarCard
              num="01" icon="fa-graduation-cap" accent="#4F8EF7"
              title="Digital Learning & Training Solutions"
              items={[
                'Online courses and live classes across ICT, digital skills, cloud computing, and emerging technologies',
                'Skill-based digital training with verified certificates you can import directly to SkillHub',
                'Support for instructors creating and publishing high-quality courses',
                'Professional development content for students and working professionals',
                'Accessible, affordable, and effective — built for African learners and global reach',
              ]}
            />
            <PillarCard
              num="02" icon="fa-code" accent="#00E5A0"
              title="ICT & Software Services"
              items={[
                'Website and web application development for businesses and institutions',
                'ICT installation, support, and system setup and management',
                'Automation tools and custom software solutions',
                'Helping businesses modernize operations through smart technology deployment',
                'Optimized workflows and tailored business platforms',
              ]}
            />
            <PillarCard
              num="03" icon="fa-bullhorn" accent="#F59E0B"
              title="Digital Media, Marketing & Content"
              items={[
                'Content creation, social media automation, and online promotion strategies',
                'SEO and digital visibility services for brands and businesses',
                'News and blog management through the Meritlives Media content ecosystem',
                'Meritlives Auto News — strategic, data-driven digital outreach at scale',
                'Supporting individuals, brands, and businesses build their digital presence',
              ]}
            />
            <PillarCard
              num="04" icon="fa-coins" accent="#A78BFA"
              title="Cryptocurrency Research & Insights"
              items={[
                'Crypto market insights and blockchain educational content for beginners and intermediates',
                'Industry trends and investment awareness guides',
                'Demystifying blockchain technology for the everyday African professional',
                'Creating awareness for digital finance opportunities in emerging markets',
                'Content aligned with our mission to make financial technology accessible',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────────────── */}
      <section id="values" className="px-6 py-20 max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(167,139,250,0.7)' }}>
            Our Values
          </div>
          <h2 className="font-jakarta font-extrabold text-[2rem] text-white tracking-tight mb-4">
            The Principles We Build By
          </h2>
          <p className="text-[14px] max-w-[480px] mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Every product decision, every hire, every feature — filtered through five values that haven't changed since day one.
          </p>
        </div>

        <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
          {[
            { icon: 'fa-lightbulb',    title: 'Innovation',    desc: 'We constantly explore new digital solutions to keep our users ahead of the curve.',              accent: '#4F8EF7', delay: 0   },
            { icon: 'fa-handshake',    title: 'Integrity',     desc: 'Professionalism and transparency guide every product decision and business relationship.',        accent: '#00E5A0', delay: 80  },
            { icon: 'fa-globe',        title: 'Accessibility', desc: 'Technology and knowledge should be available to anyone willing to grow, regardless of geography.', accent: '#F59E0B', delay: 160 },
            { icon: 'fa-star',         title: 'Excellence',    desc: 'We deliver high-quality outcomes consistently. Good enough has never been good enough for us.',    accent: '#A78BFA', delay: 240 },
            { icon: 'fa-seedling',     title: 'Impact',        desc: 'Everything we create must help someone grow — a student, a developer, a business, a career.',      accent: '#F472B6', delay: 320 },
          ].map(v => (
            <ValueCard key={v.title} {...v} />
          ))}
        </div>
      </section>

      {/* ── VISION + MISSION ──────────────────────────────────────── */}
      <section id="vision" className="px-6 py-20"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, #080C14 100%)' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 gap-6 mb-8 max-md:grid-cols-1">
            {/* Vision */}
            <div className="relative rounded-3xl overflow-hidden p-8"
              style={{ background: 'linear-gradient(145deg, #0A1628, #080C14)', border: '1px solid rgba(79,142,247,0.2)' }}>
              <div className="absolute pointer-events-none" style={{ top: -40, right: -20, width: 200, height: 200, background: 'radial-gradient(circle, rgba(79,142,247,0.18) 0%, transparent 65%)' }} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl grid place-items-center mb-5 text-[18px]"
                  style={{ background: 'rgba(79,142,247,0.15)', color: '#4F8EF7' }}>
                  <i className="fas fa-eye" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(79,142,247,0.6)' }}>
                  Our Vision
                </div>
                <p className="font-jakarta font-bold text-[18px] text-white leading-snug">
                  To become Africa's most impactful digital empowerment brand — where technology, education, and innovation converge to unlock limitless possibilities for individuals and organisations.
                </p>
              </div>
            </div>

            {/* Mission */}
            <div className="relative rounded-3xl overflow-hidden p-8"
              style={{ background: 'linear-gradient(145deg, #091A14, #080C14)', border: '1px solid rgba(0,229,160,0.2)' }}>
              <div className="absolute pointer-events-none" style={{ top: -40, left: -20, width: 200, height: 200, background: 'radial-gradient(circle, rgba(0,229,160,0.14) 0%, transparent 65%)' }} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl grid place-items-center mb-5 text-[18px]"
                  style={{ background: 'rgba(0,229,160,0.12)', color: '#00E5A0' }}>
                  <i className="fas fa-bullseye" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(0,229,160,0.6)' }}>
                  Our Mission
                </div>
                <p className="font-jakarta font-bold text-[18px] text-white leading-snug">
                  To create accessible digital solutions, learning systems, and technology-driven services that empower people, strengthen businesses, and accelerate growth across diverse sectors.
                </p>
              </div>
            </div>
          </div>

          {/* What makes us different */}
          <div className="rounded-3xl p-8"
            style={{ background: '#0C1220', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6" style={{ color: 'rgba(245,158,11,0.7)' }}>
              What Makes SkillHub Different
            </div>
            <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
              {[
                { icon: 'fa-layer-group',   title: 'A Complete Ecosystem',          desc: 'Not just a course catalogue. SkillHub connects learning, portfolio, job matching, certificates, and AI career intelligence in one place.',           accent: '#4F8EF7' },
                { icon: 'fa-globe-africa',  title: 'Built for African Markets',      desc: 'User-friendly solutions designed for African learners and professionals, with global platform integrations that bring world-class content home.',    accent: '#00E5A0' },
                { icon: 'fa-building',      title: 'Corporate-Backed Agility',       desc: 'Strong parent-company support from KGC Meritzone Consults Ltd gives SkillHub the stability of a consulting firm and the speed of a tech startup.',  accent: '#F59E0B' },
                { icon: 'fa-certificate',   title: 'Verified, Portable Credentials', desc: 'Certificates from 8+ platforms, verified and displayed in a professional portfolio that employers can trust — not just lines on a CV.',            accent: '#A78BFA' },
                { icon: 'fa-brain',         title: 'AI-Powered Career Intelligence', desc: 'Our AI Career Navigator is the only tool of its kind — reading your entire profile and generating a personalised career roadmap, not generic tips.', accent: '#F472B6' },
                { icon: 'fa-coins',         title: 'Reward-Driven Learning',         desc: 'Merit Coins incentivise consistent learning. Earn as you grow, unlock premium features, and build momentum that keeps you progressing.',           accent: '#38BDF8' },
              ].map(d => (
                <div key={d.title} className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0 text-[12px]"
                    style={{ background: `${d.accent}15`, color: d.accent }}>
                    <i className={`fas ${d.icon}`} />
                  </div>
                  <div>
                    <div className="font-jakarta font-semibold text-[13px] text-white mb-1">{d.title}</div>
                    <div className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── JOURNEY / TIMELINE ────────────────────────────────────── */}
      <section id="journey" className="px-6 py-20 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 gap-16 max-lg:grid-cols-1">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(167,139,250,0.7)' }}>
              Our Journey
            </div>
            <h2 className="font-jakarta font-extrabold text-[2rem] text-white tracking-tight mb-6 leading-tight">
              From Consulting Roots to a Global EdTech Platform
            </h2>
            <p className="text-[14px] leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
              KGC Meritzone was born from a belief that technology should be simple, empowering, and accessible to anyone willing to grow. SkillHub is the most direct expression of that belief — an AI-powered platform that makes the world's best learning resources work for your specific career, not just anyone's.
            </p>

            {/* Future outlook */}
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.18)' }}>
              <div className="text-[10.5px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(79,142,247,0.65)' }}>
                Future Outlook
              </div>
              <div className="flex flex-col gap-2">
                {[
                  'Advanced EdTech platforms with deeper AI personalisation',
                  'AI-powered business intelligence and automation tools',
                  'Cloud-based enterprise learning for organisations',
                  'Expanded content networks across African markets',
                  'International recognition as Africa\'s #1 digital empowerment brand',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-[12.5px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <i className="fas fa-arrow-right text-[9px]" style={{ color: '#4F8EF7' }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="pt-2">
            <TimelineItem year="2021" accent="#F59E0B"
              title="KGC Meritzone Founded"
              desc="KGC Meritzone Consults Ltd established as a globally positioned consulting, technology, and enterprise solutions firm." />
            <TimelineItem year="2022" accent="#4F8EF7"
              title="Meritlives LLC Launched"
              desc="Meritlives created as the dedicated digital innovation subsidiary — spanning ICT services, digital media, and online education." />
            <TimelineItem year="2023" accent="#00E5A0"
              title="Learning Platform Ecosystem"
              desc="Meritlives Learning goes live, connecting students with online courses, live classes, and instructor-led skill training across Africa." />
            <TimelineItem year="2024" accent="#A78BFA"
              title="SkillHub Beta Launched"
              desc="SkillHub launched as the flagship EdTech product — combining courses, certificates, portfolio, and job matching in one platform." />
            <TimelineItem year="2025" accent="#F472B6"
              title="AI Career Navigator Released"
              desc="SkillHub introduces the world's first full-profile AI career intelligence system — skill gap mapping, trajectory forecasting, and 7-day action plans." />
            <TimelineItem year="2026" accent="#38BDF8" last
              title="Global Expansion"
              desc="SkillHub reaches learners in 130+ countries, with 8 major platform integrations and 50,000+ active professionals on the platform." />
          </div>
        </div>
      </section>

      {/* ── PARENT COMPANY CALLOUT ─────────────────────────────────── */}
      <section className="px-6 py-16" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-[900px] mx-auto rounded-3xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #080C14, #0D1A2E)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="absolute pointer-events-none" style={{ top: -60, right: -30, width: 300, height: 300, background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 65%)' }} />
          <div className="relative z-10 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl grid place-items-center text-[22px] mx-auto mb-5"
              style={{ background: 'rgba(245,158,11,0.14)', color: '#F59E0B' }}>
              <i className="fas fa-building" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(245,158,11,0.65)' }}>
              Our Parent Company
            </div>
            <h3 className="font-jakarta font-extrabold text-[1.8rem] text-white mb-4 tracking-tight">
              KGC Meritzone Consults Ltd
            </h3>
            <p className="text-[14px] leading-relaxed max-w-[580px] mx-auto mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              A globally positioned firm specialising in consulting, technology services, training, and enterprise solutions. As the parent company, KGC Meritzone provides Meritlives — and by extension SkillHub — with the operational discipline, compliance infrastructure, and corporate stability to build at scale.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {[
                { label: 'Consulting Excellence',    icon: 'fa-briefcase' },
                { label: 'Corporate Integrity',      icon: 'fa-shield-alt' },
                { label: 'Global Reach',             icon: 'fa-globe' },
                { label: 'Enterprise-Grade Systems', icon: 'fa-server' },
              ].map(tag => (
                <div key={tag.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.22)' }}>
                  <i className={`fas ${tag.icon} text-[9px]`} />
                  {tag.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(79,142,247,0.12) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-[600px] mx-auto">
          <h2 className="font-jakarta font-extrabold text-[2.2rem] text-white tracking-tight leading-tight mb-4">
            Ready to Build Your Future?
          </h2>
          <p className="text-[15px] leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Join 50,000+ professionals who are already using SkillHub to learn faster, earn verified credentials, and land better opportunities.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/login?tab=register"
              className="flex items-center gap-2 px-7 py-4 rounded-2xl no-underline font-jakarta font-bold text-[15px] text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #4F8EF7, #A78BFA)', boxShadow: '0 12px 40px rgba(79,142,247,0.4)' }}>
              <i className="fas fa-rocket text-[12px]" /> Create Free Account
            </Link>
            <a href="https://meritlives.com" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-7 py-4 rounded-2xl no-underline font-jakarta font-semibold text-[14px] transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }}>
              <i className="fas fa-external-link-alt text-[11px]" /> Visit Meritlives
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="px-6 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between gap-6 flex-wrap mb-8">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <img src="/meritlives.svg" alt="SkillHub" style={{ width: 22, height: 22 }} />
              <span className="font-jakarta font-extrabold text-[16px] text-white tracking-tight">SkillHub</span>
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>by Meritlives LLC</span>
            </Link>
            <div className="flex flex-wrap gap-2">
              <SocialLink icon="fa-facebook-f"  label="Facebook"  href="https://web.facebook.com/meritlives1"                                          color="#1877F2" />
              <SocialLink icon="fa-instagram"   label="Instagram" href="https://www.instagram.com/meritlives"                                          color="#E1306C" />
              <SocialLink icon="fa-linkedin-in" label="LinkedIn"  href="https://www.linkedin.com/company/meritlives/"                                  color="#0A66C2" />
              <SocialLink icon="fa-youtube"     label="YouTube"   href="https://youtube.com/channel/UCCh9OVlY9dBQFoaW0Hu7WQQ"                         color="#FF0000" />
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              © {new Date().getFullYear()} KGC Meritzone Consults Ltd · All rights reserved
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Contact', href: 'https://service.meritlives.com/contact/' },
                { label: 'Dashboard', href: '/dashboard' },
              ].map(link => (
                <Link key={link.label} href={link.href}
                  className="text-[12px] no-underline transition-all hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
