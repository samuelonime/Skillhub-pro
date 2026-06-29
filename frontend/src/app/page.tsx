import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  Globe2,
  GraduationCap,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users2,
  Workflow,
} from 'lucide-react';

const platformSignals = [
  {
    title: 'Verified learning records',
    description: 'Turn course completion, imported certificates, and portfolio proof into a profile employers can trust.',
    icon: BadgeCheck,
    accent: 'var(--brand)',
  },
  {
    title: 'Workforce intelligence',
    description: 'Map skills to market demand, spot readiness gaps, and get guided toward the next role worth pursuing.',
    icon: Radar,
    accent: 'var(--brand-2)',
  },
  {
    title: 'Hiring-ready profiles',
    description: 'Present projects, credentials, application history, and talent signals in one executive-grade candidate view.',
    icon: BriefcaseBusiness,
    accent: 'var(--amber)',
  },
];

const capabilityCards = [
  {
    eyebrow: 'Learning layer',
    title: 'Structured upskilling with clear momentum',
    description: 'Courses, progress tracking, platform imports, and reward loops keep learning measurable instead of aspirational.',
    icon: BookOpen,
  },
  {
    eyebrow: 'Credential layer',
    title: 'Proof that survives beyond a CV',
    description: 'SkillHub turns certificates, project evidence, and portfolio assets into professional signal, not just storage.',
    icon: ShieldCheck,
  },
  {
    eyebrow: 'Opportunity layer',
    title: 'Live matching between talent and demand',
    description: 'Students discover relevant openings, employers discover fit faster, and both sides work from the same evidence base.',
    icon: Workflow,
  },
];

const productFlow = [
  {
    step: '01',
    title: 'Build a credible profile',
    description: 'Skills, certificates, portfolio artifacts, and work intent are combined into a professional identity that reads clearly to recruiters.',
  },
  {
    step: '02',
    title: 'Receive intelligence, not noise',
    description: 'The platform surfaces skill gaps, learning priorities, job matches, and real-time opportunities aligned to your profile.',
  },
  {
    step: '03',
    title: 'Convert readiness into outcomes',
    description: 'Apply with stronger signal, track application movement, and keep improving from one operating system instead of scattered tools.',
  },
];

const audiences = [
  {
    title: 'For emerging professionals',
    description: 'Move from learning mode to hiring mode with a cleaner profile, better job relevance, and verified proof of work.',
    icon: GraduationCap,
  },
  {
    title: 'For employers',
    description: 'Source candidates through capability signal instead of keyword guesswork, and manage openings from a focused talent workspace.',
    icon: Building2,
  },
  {
    title: 'For the African digital economy',
    description: 'SkillHub connects talent development, credibility, and opportunity flow into one sharper infrastructure layer.',
    icon: Globe2,
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <div
        className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h2 className="font-jakarta text-3xl font-extrabold tracking-[-0.04em] text-white md:text-5xl">{title}</h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-8 text-white/58 md:text-[16px]">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-0 h-135 w-225 -translate-x-1/2 blur-3xl"
          style={{
            background:
              'radial-gradient(circle at center, rgba(47,111,237,0.22) 0%, rgba(23,181,194,0.10) 34%, rgba(7,17,31,0) 72%)',
          }}
        />
        <div
          className="absolute -right-35 top-105 h-90 w-90 rounded-full blur-3xl"
          style={{ background: 'rgba(245,158,11,0.10)' }}
        />
      </div>

      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{ background: 'rgba(7,17,31,0.76)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <img src="/meritlives.svg" alt="SkillHub Pro" style={{ width: 30, height: 30 }} />
            <div>
              <div className="font-jakarta text-[15px] font-extrabold tracking-[-0.03em] text-white">SkillHub Pro</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/38">by Meritlives</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-[14px] font-medium text-white/62 md:flex">
            <a href="#platform" className="transition-colors hover:text-white">Platform</a>
            <a href="#workflow" className="transition-colors hover:text-white">Workflow</a>
            <a href="#audiences" className="transition-colors hover:text-white">Who it serves</a>
            <Link href="/about" className="transition-colors hover:text-white">About</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-[14px] font-semibold text-white/70 transition-colors hover:text-white md:inline-flex">
              Sign in
            </Link>
            <Link
              href="/login?tab=register"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-18 pt-14 md:px-10 md:pb-24 md:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Workforce acceleration for Africa's digital economy
          </div>

          <h1 className="font-jakarta text-5xl font-extrabold leading-[0.94] tracking-[-0.06em] text-white md:text-7xl lg:text-[88px]">
            Serious career infrastructure for modern African talent.
          </h1>

          <p className="mt-7 max-w-2xl text-[17px] leading-8 text-white/60 md:text-[18px]">
            SkillHub Pro combines learning, verified credentials, portfolio proof, hiring intelligence, and employer access into one refined platform.
            The result is a stronger professional signal for candidates and a clearer sourcing workflow for hiring teams.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login?tab=register"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}
            >
              Create your workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#platform"
              className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-[15px] font-semibold text-white/80 transition-colors hover:text-white"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
            >
              Explore the platform
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ['Unified signal', 'Learning, portfolio, jobs, and certificates aligned in one profile'],
              ['Built for employers too', 'Dedicated hiring workflows, not just learner dashboards'],
              ['Brand-grade presentation', 'Sharper surfaces that feel enterprise-ready from first touch'],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-3xl p-5"
                style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.18em] text-white/82">{title}</div>
                <p className="text-[13px] leading-6 text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute -left-6 top-10 hidden h-20 w-20 rounded-full blur-2xl md:block"
            style={{ background: 'rgba(23,181,194,0.25)' }}
          />
          <div
            className="relative overflow-hidden rounded-4xl p-5 md:p-6"
            style={{
              background: 'linear-gradient(180deg, rgba(14,23,39,0.96), rgba(9,16,30,0.96))',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
            }}
          >
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Talent Command Center</div>
                <div className="mt-1 font-jakarta text-[18px] font-bold text-white">Candidate readiness, market visibility, opportunity flow</div>
              </div>
              <div className="rounded-full px-3 py-1 text-[11px] font-semibold text-white" style={{ background: 'rgba(23,181,194,0.16)', border: '1px solid rgba(23,181,194,0.25)' }}>
                Live profile signal
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4 rounded-[28px] border p-5" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Profile overview</div>
                    <div className="mt-1 text-[18px] font-bold text-white">Product-minded frontend talent</div>
                  </div>
                  <div className="rounded-2xl px-3 py-2 text-right" style={{ background: 'rgba(47,111,237,0.14)' }}>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">Readiness</div>
                    <div className="font-jakarta text-xl font-extrabold text-white">92</div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {platformSignals.map(signal => {
                    const Icon = signal.icon;
                    return (
                      <div
                        key={signal.title}
                        className="rounded-2xl p-4"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${signal.accent}20`, color: signal.accent }}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-[14px] font-semibold text-white">{signal.title}</div>
                        <p className="mt-2 text-[12.5px] leading-6 text-white/48">{signal.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border p-5" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)' }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Opportunity radar</div>
                  <div className="mt-4 space-y-3">
                    {[
                      ['Frontend Engineer', 'Remote-first product team', 'High fit'],
                      ['Product Designer', 'Growth-stage fintech', 'Portfolio-led'],
                      ['Community Lead', 'Creator learning platform', 'Strong signal'],
                    ].map(([role, meta, tag]) => (
                      <div key={role} className="rounded-2xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(7,17,31,0.55)' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[14px] font-semibold text-white">{role}</div>
                            <div className="mt-1 text-[12px] text-white/45">{meta}</div>
                          </div>
                          <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white" style={{ background: 'rgba(245,158,11,0.16)' }}>
                            {tag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border p-5" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'linear-gradient(135deg, rgba(47,111,237,0.16), rgba(23,181,194,0.12))' }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Brand promise</div>
                  <div className="mt-3 font-jakarta text-2xl font-extrabold leading-tight text-white">
                    Professional signal in. Professional outcomes out.
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-white/68">
                    SkillHub is not just a course directory or a jobs board. It is a branded career operating layer built to make talent legible, credible, and discoverable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10 md:px-10">
        <div className="grid gap-4 rounded-4xl border p-6 md:grid-cols-3" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)' }}>
          {[
            ['Sharper hiring signal', 'Profiles communicate capability with far more context than a résumé upload.'],
            ['Cleaner learner experience', 'Progress, credentials, community, and opportunities stay connected instead of fragmented.'],
            ['Professional brand posture', 'The product now reads like a platform for serious career growth, not a generic course template.'],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-3xl p-4">
              <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/82">{title}</div>
              <p className="mt-2 text-[14px] leading-7 text-white/50">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        <SectionHeading
          eyebrow="Platform"
          title="One product system across learning, proof, and hiring"
          description="The frontend now leads with a clearer point of view: SkillHub Pro is an integrated workforce platform, not a collection of generic feature tiles."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {capabilityCards.map(card => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="rounded-[30px] p-7"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/42">{card.eyebrow}</div>
                <h3 className="mt-3 font-jakarta text-2xl font-bold tracking-[-0.04em] text-white">{card.title}</h3>
                <p className="mt-4 text-[14px] leading-7 text-white/52">{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        <SectionHeading
          eyebrow="Workflow"
          title="A cleaner journey from readiness to opportunity"
          description="Every section of the product should reinforce one idea: users are building professional momentum, not clicking through disconnected screens."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {productFlow.map(item => (
            <div
              key={item.step}
              className="rounded-[30px] p-7"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full border text-[12px] font-bold text-white/88" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {item.step}
              </div>
              <h3 className="font-jakarta text-[22px] font-bold tracking-[-0.04em] text-white">{item.title}</h3>
              <p className="mt-4 text-[14px] leading-7 text-white/52">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="audiences" className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        <SectionHeading
          eyebrow="Who it serves"
          title="Positioned for candidates, employers, and the ecosystem around them"
          description="Professional branding matters because the product speaks to multiple audiences at once. The UI should reflect confidence, clarity, and platform maturity on every surface."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {audiences.map(item => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-[30px] p-7"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-jakarta text-2xl font-bold tracking-[-0.04em] text-white">{item.title}</h3>
                <p className="mt-4 text-[14px] leading-7 text-white/52">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-6 md:px-10 md:pb-24">
        <div
          className="overflow-hidden rounded-[36px] border p-8 md:p-12"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, rgba(13,24,42,0.95), rgba(8,16,28,0.95))',
          }}
        >
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/68" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Users2 className="h-3.5 w-3.5" />
                Ready for sharper rollout
              </div>
              <h2 className="mt-5 font-jakarta text-3xl font-extrabold tracking-tighter text-white md:text-5xl">
                Launch a frontend that looks like the platform it claims to be.
              </h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-white/58 md:text-[16px]">
                The new direction emphasizes credibility, product maturity, and a distinct SkillHub identity grounded in workforce readiness, verified capability, and employer relevance.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/login?tab=register"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}
              >
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-[15px] font-semibold text-white/80 transition-colors hover:text-white"
                style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}
              >
                Learn about Meritlives
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-center gap-3">
            <img src="/meritlives.svg" alt="SkillHub Pro" style={{ width: 24, height: 24 }} />
            <div>
              <div className="font-jakarta text-[14px] font-bold text-white">SkillHub Pro</div>
              <div className="text-[11px] text-white/42">A Meritlives product for modern African talent</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-[13px] text-white/48">
            <Link href="/about" className="transition-colors hover:text-white">About</Link>
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
            <Link href="/contact" className="transition-colors hover:text-white">Contact</Link>
            <Link href="/login" className="transition-colors hover:text-white">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}