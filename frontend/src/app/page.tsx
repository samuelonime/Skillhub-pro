 'use client';

import { useEffect, useState, type ReactNode, type CSSProperties } from 'react';
import Link from 'next/link';

const BLUE = '#2563EB';
const BLUE_DARK = '#1D4ED8';
const RED = '#E11D2E';
const DARK = '#0A0D14';
const DARK2 = '#10141F';

const MENU = {
  Platform: {
    cols: [
      {
        label: 'AI CAREER TOOLS',
        items: [
          { name: 'AI Career Navigator', desc: 'Personalised skill gap maps', href: '/dashboard/ai-navigator', badge: 'New' },
          { name: 'Peer Genome', desc: 'See what people like you did', href: '#' },
          { name: 'Smart Job Matching', desc: 'AI-scored role recommendations', href: '/dashboard/jobs' },
        ],
      },
      {
        label: 'LEARNING & GROWTH',
        items: [
          { name: 'Course Marketplace', desc: 'Curated from 8+ platforms', href: '/dashboard/courses' },
          { name: 'Verified Certificates', desc: 'Import & showcase proof', href: '/dashboard/certificates' },
          { name: 'Merit Coins & Tiers', desc: 'Gamified learning rewards', href: '/dashboard/rewards' },
        ],
      },
      {
        label: 'CAREER ASSETS',
        items: [
          { name: 'Portfolio Builder', desc: 'Live, employer-visible proof', href: '/dashboard/portfolio' },
          { name: 'Community', desc: 'Discuss, discover, connect', href: '/dashboard/community' },
        ],
      },
    ],
    footer: { name: 'View all features', href: '#' },
  },
  Solutions: {
    cols: [
      {
        label: 'BY AUDIENCE',
        items: [
          { name: 'For Students', desc: 'Learn, prove, get hired', href: '#' },
          { name: 'For Employers', desc: 'Hire verified talent', href: '/employer' },
          { name: 'For Universities', desc: 'Boost graduate outcomes', href: '#' },
        ],
      },
      {
        label: 'BY GOAL',
        items: [
          { name: 'Skill Verification', desc: 'Turn courses into proof', href: '#' },
          { name: 'Career Transition', desc: 'Pivot with AI guidance', href: '#' },
          { name: 'Remote Job Readiness', desc: 'Global opportunity matching', href: '#' },
        ],
      },
    ],
    footer: { name: 'View all solutions', href: '#' },
  },
  Resources: {
    cols: [
      {
        label: 'EXPLORE',
        items: [
          { name: 'Blog & Career Insights', desc: 'Skills, salaries, market data', href: '#' },
          { name: 'Help Center', desc: 'Guides and documentation', href: '#' },
          { name: 'Community Forum', desc: 'Ask, share, discuss', href: '/dashboard/community' },
        ],
      },
      {
        label: 'COMPANY',
        items: [
          { name: 'About SkillHub', desc: 'Meritlives LLC product', href: '/about' },
          { name: 'Privacy Policy', desc: 'How we handle your data', href: '/privacy' },
        ],
      },
    ],
    footer: { name: 'View all resources', href: '#' },
  },
};

const NAV_KEYS = Object.keys(MENU) as Array<keyof typeof MENU>;

const FEATURE_TABS = [
  { key: 'learn', label: 'Learn', icon: 'fa-book-open', text: 'Connect 8+ learning platforms — Udemy, Coursera, edX and more — and let AI tell you exactly which course closes your biggest skill gap.' },
  { key: 'prove', label: 'Prove it', icon: 'fa-certificate', text: 'Verified certificates, a live portfolio, and Merit Coins turn your learning into proof employers actually trust.' },
  { key: 'match', label: 'Match', icon: 'fa-bullseye', text: 'AI scores you against every open role using your real verified skills — so you only apply where it counts.' },
  { key: 'hire', label: 'Get hired', icon: 'fa-briefcase', text: 'Employers see your full skill profile, not a one-page CV. Faster decisions, better-fit offers.' },
] as const;

function SmartLink({ href, className, style, children }: { href: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  if (href.startsWith('/')) {
    return <Link href={href} className={className} style={style}>{children}</Link>;
  }

  return <a href={href} className={className} style={style}>{children}</a>;
}

function MegaMenu({ menuKey }: { menuKey: keyof typeof MENU }) {
  const data = MENU[menuKey];

  return (
    <div
      className="absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 overflow-hidden rounded-2xl"
      style={{ width: 720, background: DARK2, border: `1px solid ${BLUE}25`, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
    >
      <div className="grid gap-6 p-6" style={{ gridTemplateColumns: `repeat(${data.cols.length}, 1fr)` }}>
        {data.cols.map((col) => (
          <div key={col.label}>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {col.label}
            </div>
            <div className="flex flex-col gap-1">
              {col.items.map((item) => (
                <SmartLink key={item.name} href={item.href} className="flex items-start gap-1 rounded-xl px-3 py-2.5 no-underline transition-all" style={{ color: 'inherit' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-white">{item.name}</span>
                      {'badge' in item && item.badge ? (
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: `${RED}20`, color: '#FF6B7A' }}>
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[11.5px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</div>
                  </div>
                </SmartLink>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <SmartLink href={data.footer.href} className="flex items-center gap-1.5 text-[12.5px] font-semibold no-underline" style={{ color: BLUE }}>
          {data.footer.name} <i className="fas fa-arrow-right text-[10px]" />
        </SmartLink>
      </div>
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<keyof typeof MENU | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] transition-all"
      style={{
        background: scrolled ? 'rgba(10,13,20,0.92)' : 'rgba(10,13,20,0.6)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
      }}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 no-underline">
          <div className="grid h-7 w-7 place-items-center rounded-lg font-jakarta text-[13px] font-black text-white" style={{ background: `linear-gradient(135deg, ${BLUE}, ${RED})` }}>
            S
          </div>
          <span className="font-jakarta text-[17px] font-extrabold tracking-tight text-white">SkillHub</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {NAV_KEYS.map((key) => (
            <div key={key} className="relative" onMouseEnter={() => setOpenMenu(key)}>
              <button className="flex cursor-pointer items-center gap-1.5 rounded-lg border-0 px-3.5 py-2 text-[13.5px] font-medium transition-all" style={{ background: openMenu === key ? 'rgba(255,255,255,0.06)' : 'transparent', color: 'rgba(255,255,255,0.75)' }}>
                {key}
                <i className="fas fa-chevron-down text-[8px]" style={{ opacity: 0.5 }} />
              </button>
              {openMenu === key ? <MegaMenu menuKey={key} /> : null}
            </div>
          ))}
          <a href="#" className="rounded-lg px-3.5 py-2 text-[13.5px] font-medium no-underline transition-all" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Pricing
          </a>
        </nav>

        <div className="relative hidden items-center md:flex">
          <i className="fas fa-search absolute left-3 text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input type="text" placeholder="Search courses, jobs, skills…" className="w-56 rounded-lg py-2 pr-3 pl-9 text-[12.5px] font-[inherit] outline-none transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }} />
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Link href="/login" className="rounded-lg px-3.5 py-2 text-[13px] font-semibold no-underline transition-all" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Sign in
          </Link>
          <Link href="/login?tab=register" className="rounded-lg px-4 py-2 text-[13px] font-bold no-underline text-white transition-all" style={{ background: BLUE, boxShadow: `0 4px 14px ${BLUE}40` }}>
            Sign up
          </Link>
        </div>

        <button onClick={() => setMobileOpen((value) => !value)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border-0 lg:hidden" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
          <i className={`fas fa-${mobileOpen ? 'times' : 'bars'} text-[14px]`} />
        </button>
      </div>

      {mobileOpen ? (
        <div className="flex flex-col gap-1 border-t px-6 py-4 lg:hidden" style={{ background: DARK2, borderTopColor: 'rgba(255,255,255,0.06)' }}>
          {NAV_KEYS.map((key) => (
            <div key={key} className="py-2.5 text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{key}</div>
          ))}
          <div className="my-2 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <Link href="/login" className="py-2.5 text-[14px] font-semibold no-underline" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Sign in
          </Link>
          <Link href="/login?tab=register" className="mt-2 rounded-lg py-3 text-center text-[14px] font-bold no-underline text-white" style={{ background: BLUE }}>
            Sign up
          </Link>
        </div>
      ) : null}
    </header>
  );
}

function Hero() {
  const [email, setEmail] = useState('');

  return (
    <section className="relative overflow-hidden px-6 pt-44 pb-24 text-center">
      <div className="pointer-events-none absolute" style={{ top: '5%', left: '12%', width: 480, height: 480, background: `radial-gradient(circle, ${BLUE}22 0%, transparent 65%)` }} />
      <div className="pointer-events-none absolute" style={{ top: '15%', right: '10%', width: 360, height: 360, background: `radial-gradient(circle, ${RED}18 0%, transparent 65%)` }} />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />

      <div className="relative z-10 mx-auto max-w-[820px]">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5" style={{ background: `${RED}14`, border: `1px solid ${RED}35` }}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: RED }} />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: '#FF6B7A' }}>AI Career Navigator now live</span>
        </div>

        <h1 className="mb-6 font-jakarta font-black leading-[1.08] tracking-tight" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)' }}>
          <span className="text-white">Learning is constant.</span>
          <br />
          <span style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${RED} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            SkillHub keeps you hired.
          </span>
        </h1>

        <p className="mx-auto mb-9 max-w-[560px] text-[16px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          The career platform where learners, verified credentials, and AI come together to turn courses into job offers.
        </p>

        <div className="mb-5 flex flex-wrap items-center justify-center gap-2.5">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-72 rounded-xl px-4 py-3.5 text-[14px] font-[inherit] outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff' }}
            onFocus={(event) => { event.target.style.border = `1px solid ${BLUE}80`; }}
            onBlur={(event) => { event.target.style.border = '1px solid rgba(255,255,255,0.14)'; }}
          />
          <Link href="/login?tab=register" className="rounded-xl px-6 py-3.5 font-jakarta text-[14px] font-bold text-white no-underline transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, boxShadow: `0 12px 32px ${BLUE}45` }}>
            Sign up for SkillHub
          </Link>
        </div>
        <a href="#" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold no-underline transition-all" style={{ border: `1px solid ${RED}40`, color: '#FF6B7A', background: `${RED}0d` }}>
          <i className="fas fa-bolt text-[11px]" /> Try AI Career Navigator
        </a>
      </div>
    </section>
  );
}

function FeatureTabs() {
  const [active, setActive] = useState<(typeof FEATURE_TABS)[number]['key']>('learn');
  const tab = FEATURE_TABS.find((item) => item.key === active)!;

  return (
    <section className="mx-auto max-w-[1100px] px-6 py-20">
      <h2 className="mb-10 text-center font-jakarta text-[1.9rem] font-extrabold tracking-tight text-white">SkillHub features</h2>
      <div className="mb-10 flex flex-wrap items-center justify-center gap-1">
        {FEATURE_TABS.map((tabItem) => (
          <button key={tabItem.key} onClick={() => setActive(tabItem.key)} className="flex cursor-pointer items-center gap-2 rounded-xl border-0 px-4 py-2.5 text-[13px] font-semibold transition-all" style={{ background: active === tabItem.key ? `linear-gradient(135deg, ${BLUE}, ${RED})` : 'rgba(255,255,255,0.05)', color: active === tabItem.key ? '#fff' : 'rgba(255,255,255,0.45)' }}>
            <i className={`fas ${tabItem.icon} text-[11px]`} /> {tabItem.label}
          </button>
        ))}
      </div>
      <div className="rounded-3xl p-10 text-center" style={{ background: DARK2, border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="mx-auto max-w-[560px] text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{tab.text}</p>
      </div>
    </section>
  );
}

function LogoStrip() {
  const names = ['Yabatech', 'LASU', 'UNILAG', 'Covenant Uni', 'FUTA', 'Kwara Poly', 'Babcock', 'OAU'];

  return (
    <section className="px-6 py-12 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mb-6 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.25)' }}>Trusted by learners from</div>
      <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-center gap-x-10 gap-y-3">
        {names.map((name) => <span key={name} className="font-jakarta text-[15px] font-bold" style={{ color: 'rgba(255,255,255,0.22)' }}>{name}</span>)}
      </div>
    </section>
  );
}

function FeatureSection({ eyebrow, title, text, cta, ctaHref, accent, reverse, mockup }: { eyebrow: string; title: string; text: string; cta: string; ctaHref: string; accent: string; reverse?: boolean; mockup: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1100px] px-6 py-16">
      <div className={`grid grid-cols-2 items-center gap-14 max-lg:grid-cols-1 ${reverse ? 'lg:[direction:rtl]' : ''}`}>
        <div className={reverse ? 'lg:[direction:ltr]' : undefined}>
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>{eyebrow}</div>
          <h3 className="mb-4 font-jakarta text-[1.7rem] font-extrabold leading-tight tracking-tight text-white">{title}</h3>
          <p className="mb-6 text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{text}</p>
          <SmartLink href={ctaHref} className="inline-flex items-center gap-2 text-[13.5px] font-bold no-underline" style={{ color: accent }}>
            {cta} <i className="fas fa-arrow-right text-[11px]" />
          </SmartLink>
        </div>
        <div className={reverse ? 'lg:[direction:ltr]' : undefined}>{mockup}</div>
      </div>
    </section>
  );
}

function MockupCard({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-1" style={{ background: `linear-gradient(135deg, ${accent}30, transparent)` }}>
      <div className="rounded-[1.4rem] p-6" style={{ background: DARK2, border: '1px solid rgba(255,255,255,0.07)', minHeight: 280 }}>{children}</div>
    </div>
  );
}

function Testimonial() {
  return (
    <section className="mx-auto max-w-[760px] px-6 py-20 text-center">
      <i className="fas fa-quote-left mb-6 block text-2xl" style={{ color: BLUE }} />
      <p className="mb-8 font-jakarta text-[1.5rem] font-medium leading-snug text-white" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
        "SkillHub didn't just teach me React. It told me exactly which gap was holding me back, and three months later I had an offer."
      </p>
      <div className="flex items-center justify-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full font-jakarta text-[13px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${BLUE}, ${RED})` }}>AO</div>
        <div className="text-left">
          <div className="text-[13px] font-semibold text-white">Ada Obi</div>
          <div className="text-[11.5px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Data Analyst, Lagos</div>
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  const [email, setEmail] = useState('');

  return (
    <section className="relative overflow-hidden px-6 py-24 text-center">
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${BLUE}14 0%, transparent 70%)` }} />
      <div className="relative z-10 mx-auto max-w-[600px]">
        <h2 className="mb-4 font-jakarta text-[2.1rem] font-extrabold leading-tight tracking-tight text-white">Millions of skills. One platform that proves yours.</h2>
        <p className="mb-8 text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Join SkillHub to learn faster, earn verified credentials, and get matched with roles that fit who you actually are.
        </p>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5">
          <input type="email" placeholder="Enter your email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-72 rounded-xl px-4 py-3.5 text-[14px] font-[inherit] outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff' }} />
          <Link href="/login?tab=register" className="rounded-xl px-6 py-3.5 font-jakarta text-[14px] font-bold text-white no-underline transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, ${BLUE}, ${RED})`, boxShadow: `0 12px 32px ${RED}35` }}>
            Sign up for SkillHub
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: 'Platform', links: ['Features', 'AI Navigator', 'Courses', 'Portfolio', 'Pricing'] },
    { title: 'Ecosystem', links: ['Learning Platforms', 'Employer Portal', 'Universities', 'Mobile App'] },
    { title: 'Support', links: ['Docs', 'Help Center', 'Community Forum', 'Contact'] },
    { title: 'Company', links: ['About', 'Privacy Policy', 'Careers', 'Newsroom'] },
  ];

  return (
    <footer className="px-6 py-16" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-12 grid gap-10 max-md:grid-cols-2 md:grid-cols-5">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg font-jakarta text-[13px] font-black text-white" style={{ background: `linear-gradient(135deg, ${BLUE}, ${RED})` }}>S</div>
              <span className="font-jakarta text-[15px] font-extrabold text-white">SkillHub</span>
            </div>
            <p className="mb-4 text-[11.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
              The developer newsletter for your career. Tips and market data, twice a month.
            </p>
            <div className="flex gap-1.5">
              <input placeholder="you@email.com" className="flex-1 rounded-lg px-3 py-2 text-[11px] outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <button className="rounded-lg border-0 px-3 py-2 text-[11px] font-bold text-white" style={{ background: BLUE }}>Subscribe</button>
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-[12px] font-bold text-white">{col.title}</div>
              <div className="flex flex-col gap-2">
                {col.links.map((link) => <a key={link} href="#" className="text-[12px] no-underline transition-all hover:opacity-80" style={{ color: 'rgba(255,255,255,0.35)' }}>{link}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6" style={{ borderTopColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[11.5px]" style={{ color: 'rgba(255,255,255,0.22)' }}>© 2026 SkillHub · A Meritlives LLC Product</p>
          <div className="flex items-center gap-4">
            {['linkedin-in', 'instagram', 'youtube', 'x-twitter'].map((icon) => (
              <a key={icon} href="#" className="text-[14px] transition-all hover:opacity-70" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <i className={`fab fa-${icon}`} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: DARK, fontFamily: "'Inter', sans-serif", color: '#E2E8F0' }}>
      <Nav />
      <Hero />
      <FeatureTabs />
      <LogoStrip />

      <FeatureSection
        eyebrow="Learn · 8 platforms, one home"
        title="Stop switching tabs. Start closing skill gaps."
        text="Connect Udemy, Coursera, edX, LinkedIn Learning, Pluralsight and more in one place. SkillHub's AI tells you exactly which course matters most for your next role — not the most popular one."
        cta="Explore the marketplace"
        ctaHref="/dashboard/courses"
        accent={BLUE}
        mockup={
          <MockupCard accent={BLUE}>
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${BLUE}20` }}>
                <i className="fas fa-book-open text-[12px]" style={{ color: BLUE }} />
              </div>
              <span className="text-[12px] font-semibold text-white/80">AI suggested course</span>
            </div>
            {[
              { t: 'Advanced TypeScript', p: 84 },
              { t: 'System Design Basics', p: 41 },
              { t: 'SQL Optimisation', p: 67 },
            ].map((row) => (
              <div key={row.t} className="mb-3">
                <div className="mb-1.5 flex justify-between text-[11px]">
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{row.t}</span>
                  <span style={{ color: BLUE }}>{row.p}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full" style={{ width: `${row.p}%`, background: BLUE }} />
                </div>
              </div>
            ))}
          </MockupCard>
        }
      />

      <FeatureSection
        reverse
        eyebrow="Prove it · verified, not claimed"
        title="Certificates that mean something to employers."
        text="Every imported certificate is linked back to its source platform, skills-tagged, and displayed in a live portfolio. Employers see proof, not promises."
        cta="See the portfolio builder"
        ctaHref="/dashboard/portfolio"
        accent={RED}
        mockup={
          <MockupCard accent={RED}>
            <div className="mb-4 flex items-center gap-2.5">
              <i className="fas fa-certificate text-[14px]" style={{ color: RED }} />
              <span className="text-[12px] font-semibold text-white/80">Verified certificates</span>
            </div>
            {['Google Data Analytics — Coursera', 'AWS Solutions Architect — Udemy', 'React Mastery — Frontend Masters'].map((certificate) => (
              <div key={certificate} className="mb-2.5 flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <i className="fas fa-check-circle text-[11px]" style={{ color: '#00E5A0' }} />
                <span className="text-[11.5px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{certificate}</span>
              </div>
            ))}
          </MockupCard>
        }
      />

      <Testimonial />

      <FeatureSection
        eyebrow="Match · AI scored, real-time"
        title="Know your match score before you apply."
        text="SkillHub reads your verified skills and certificates, then scores you against every open role — so you spend time where it actually counts."
        cta="View job matches"
        ctaHref="/dashboard/jobs"
        accent={BLUE}
        mockup={
          <MockupCard accent={BLUE}>
            {[
              { r: 'Data Analyst · Lagos', m: 91, c: '#00E5A0' },
              { r: 'Cloud Engineer · Remote', m: 78, c: '#F59E0B' },
              { r: 'ML Engineer · Abuja', m: 64, c: BLUE },
            ].map((job) => (
              <div key={job.r} className="mb-3 flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="flex-1 text-[11.5px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{job.r}</span>
                <span className="text-[14px] font-bold" style={{ color: job.c }}>{job.m}%</span>
              </div>
            ))}
          </MockupCard>
        }
      />

      <ClosingCTA />
      <Footer />
    </div>
  );
}