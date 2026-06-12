'use client';

import { useState } from 'react';
import Link from 'next/link';

const LAST_UPDATED = 'June 12, 2026';
const EFFECTIVE_DATE = 'June 12, 2026';
const CONTACT_EMAIL = 'privacy@skillhub.io';
const CONTACT_PHONE = 'support@skillhub.ng';
const COMPANY_NAME = 'SkillHub (a Meritlives LLC product)';

const sections = [
  { id: 'introduction',       title: '1. Introduction' },
  { id: 'information',        title: '2. Information We Collect' },
  { id: 'how-we-use',         title: '3. How We Use Your Information' },
  { id: 'ai-data',            title: '4. AI Features & Career Data' },
  { id: 'sharing',            title: '5. Data Sharing & Disclosure' },
  { id: 'platforms',          title: '6. Third-Party Learning Platforms' },
  { id: 'cookies',            title: '7. Cookies & Tracking' },
  { id: 'security',           title: '8. Security Measures' },
  { id: 'retention',          title: '9. Data Retention' },
  { id: 'rights',             title: '10. Your Rights & Choices' },
  { id: 'children',           title: '11. Children\'s Privacy' },
  { id: 'international',      title: '12. International Data Transfers' },
  { id: 'changes',            title: '13. Changes to This Policy' },
  { id: 'contact',            title: '14. Contact Us' },
];

function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="block" style={{ marginTop: -80, paddingTop: 80 }} />;
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function InfoBlock({ icon, title, items, accent }: { icon: string; title: string; items: string[]; accent: string }) {
  return (
    <div className="rounded-2xl p-5 mb-4"
      style={{ background: accent + '08', border: `1px solid ${accent}20` }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl grid place-items-center text-[13px] flex-shrink-0"
          style={{ background: accent + '18', color: accent }}>
          <i className={`fas ${icon}`} />
        </div>
        <span className="font-jakarta font-semibold text-[14px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{title}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]" style={{ background: accent }} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RightsCard({ icon, title, desc, accent }: { icon: string; title: string; desc: string; accent: string }) {
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3 transition-all hover:-translate-y-0.5"
      style={{ background: '#0C1220', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-9 h-9 rounded-xl grid place-items-center text-[13px] flex-shrink-0"
        style={{ background: accent + '18', color: accent }}>
        <i className={`fas ${icon}`} />
      </div>
      <div>
        <div className="font-jakarta font-semibold text-[13px] mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{title}</div>
        <div className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</div>
      </div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#080C14', fontFamily: "'Inter', sans-serif", color: '#E2E8F0' }}>

      {/* ── Top nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(8,12,20,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <img src="/meritlives.svg" alt="SkillHub" style={{ width: 26, height: 26 }} />
          <span className="font-jakarta font-extrabold text-[18px] text-white tracking-tight">SkillHub</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium hidden md:block" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Last updated {LAST_UPDATED}
          </span>
          <Link href="/login"
            className="px-4 py-2 rounded-xl text-[12.5px] font-semibold no-underline transition-all hover:opacity-80"
            style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.25)' }}>
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 py-16 text-center"
        style={{ background: 'linear-gradient(180deg, #0A1628 0%, #080C14 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(79,142,247,0.14) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.25)' }}>
            <i className="fas fa-shield-halved text-[11px]" style={{ color: '#4F8EF7' }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#4F8EF7' }}>Privacy Policy</span>
          </div>
          <h1 className="font-jakarta font-extrabold text-[2.6rem] text-white tracking-tight leading-tight mb-4">
            Your Privacy,<br />
            <span style={{ background: 'linear-gradient(90deg, #4F8EF7, #00E5A0)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              Our Responsibility
            </span>
          </h1>
          <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
            SkillHub is a product of Meritlives LLC. This policy explains exactly what data we collect, why we collect it, how it powers your learning experience, and how you stay in full control at all times.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {[
              { icon: 'fa-calendar', label: `Effective ${EFFECTIVE_DATE}` },
              { icon: 'fa-lock',     label: 'GDPR & NDPR Compliant' },
              { icon: 'fa-eye-slash',label: 'No Data Selling — Ever' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                <i className={`fas ${b.icon} text-[10px]`} style={{ color: '#4F8EF7' }} />
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12 flex gap-10 items-start">

        {/* ── Sidebar TOC (desktop) ───────────────────────────────── */}
        <aside className="w-64 flex-shrink-0 sticky top-24 hidden lg:block">
          <div className="rounded-2xl p-4" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Contents
            </div>
            <nav className="flex flex-col gap-0.5">
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`}
                  onClick={() => setActiveSection(s.id)}
                  className="block px-3 py-2 rounded-xl text-[12px] font-medium no-underline transition-all"
                  style={{
                    background: activeSection === s.id ? 'rgba(79,142,247,0.12)' : 'transparent',
                    color: activeSection === s.id ? '#4F8EF7' : 'rgba(255,255,255,0.38)',
                    borderLeft: activeSection === s.id ? '2px solid #4F8EF7' : '2px solid transparent',
                  }}>
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* Mobile TOC toggle */}
          <div className="lg:hidden mb-6">
            <button onClick={() => setTocOpen(v => !v)}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border-0 cursor-pointer text-[13px] font-semibold"
              style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              <i className="fas fa-list text-[11px]" style={{ color: '#4F8EF7' }} />
              Table of Contents
              <i className={`fas fa-chevron-${tocOpen ? 'up' : 'down'} ml-auto text-[10px]`} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </button>
            {tocOpen && (
              <div className="mt-1 rounded-xl p-3" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
                {sections.map(s => (
                  <a key={s.id} href={`#${s.id}`} onClick={() => setTocOpen(false)}
                    className="block px-2 py-1.5 rounded-lg text-[12px] no-underline transition-all hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.5)' }}>{s.title}</a>
                ))}
              </div>
            )}
          </div>

          {/* ── 1. Introduction ───────────────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="introduction" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>
                <i className="fas fa-handshake" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">1. Introduction</h2>
            </div>
            <div className="prose-skillhub">
              <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Welcome to <strong className="text-white/80">SkillHub</strong>, a product of <strong className="text-white/80">Meritlives LLC</strong>. SkillHub is a professional learning and career development platform that helps students, developers, and professionals build in-demand skills, earn verified certificates, build portfolios, and connect with employers.
              </p>
              <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you access or use the SkillHub platform — including our website, mobile apps, AI Career Navigator, learning platform integrations, and any related services (collectively, the "Services").
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                By creating an account or using our Services, you agree to the terms of this Privacy Policy. If you do not agree, please discontinue use of our Services. This policy was last updated on <strong className="text-white/70">{LAST_UPDATED}</strong> and is effective from <strong className="text-white/70">{EFFECTIVE_DATE}</strong>.
              </p>
            </div>
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 2. Information We Collect ─────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="information" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(0,229,160,0.12)', color: '#00E5A0' }}>
                <i className="fas fa-database" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">2. Information We Collect</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              We collect information to provide, improve, and personalise our Services. We collect only what is necessary and relevant to the functionality you use.
            </p>
            <InfoBlock
              icon="fa-user"
              title="Account & Identity Information"
              accent="#4F8EF7"
              items={[
                'Full name, email address, username, and password (stored encrypted with bcrypt).',
                'Profile photo, job title, bio, country/region, and professional links you add voluntarily.',
                'Role selection — whether you register as a Student or Employer.',
                'Company name and employer-specific profile data (Employer accounts only).',
                'OAuth tokens when you sign in via Google or Apple (we receive a short-lived token only; we never store your Google or Apple password).',
              ]}
            />
            <InfoBlock
              icon="fa-graduation-cap"
              title="Learning & Activity Data"
              accent="#00E5A0"
              items={[
                'Courses you enrol in, modules you complete, and your progress percentages.',
                'Certificates you upload or import from connected learning platforms (Udemy, Coursera, edX, LinkedIn Learning, Pluralsight, Skillshare, Alison, FutureLearn).',
                'Portfolio projects, descriptions, technology stacks, visibility settings, and project scores.',
                'Skills you list, endorse, or have verified through platform integrations.',
                'Merit Coins balance, earning history, and tier status (Bronze / Silver / Gold / Platinum).',
              ]}
            />
            <InfoBlock
              icon="fa-briefcase"
              title="Job Application & Career Data"
              accent="#F59E0B"
              items={[
                'Job listings you view, save, or apply to.',
                'Application status and employer responses shared back to you.',
                'Job match scores generated by our algorithm, based on your skills and certificates.',
                'Career preferences you set, including desired roles, salary range, and location.',
              ]}
            />
            <InfoBlock
              icon="fa-chart-bar"
              title="Usage & Technical Data"
              accent="#A78BFA"
              items={[
                'Pages visited, features used, and time spent on the platform.',
                'Device type, browser, operating system, screen resolution, and IP address.',
                'Referring URLs and search terms used within the platform.',
                'Error logs and crash reports (anonymised where possible) to improve platform stability.',
                'Session tokens stored in HttpOnly cookies — never accessible to JavaScript, preventing XSS attacks.',
              ]}
            />
            <InfoBlock
              icon="fa-comments"
              title="Community & Communication Data"
              accent="#F472B6"
              items={[
                'Posts, comments, likes, and community contributions you make publicly.',
                'Direct messages and notifications received or sent via the platform.',
                'Feedback you submit through support channels or in-app feedback tools.',
              ]}
            />
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 3. How We Use Your Information ───────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="how-we-use" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                <i className="fas fa-cogs" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">3. How We Use Your Information</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              We use your information only for legitimate, transparent purposes directly connected to delivering the SkillHub service.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: 'fa-rocket',        title: 'Delivering the Platform',        accent: '#4F8EF7',  desc: 'Processing your enrolments, tracking course progress, awarding Merit Coins, managing your portfolio, and facilitating job applications.' },
                { icon: 'fa-brain',         title: 'AI Career Navigator',            accent: '#A78BFA',  desc: 'Your learning data, certificates, job history, and skill profile are processed by our AI to generate personalised skill gap maps, career trajectory forecasts, and weekly action plans. See Section 4 for full details.' },
                { icon: 'fa-search',        title: 'Job Matching',                   accent: '#F59E0B',  desc: 'We use your verified skills and certificates to compute match scores against employer-posted roles so you receive relevant job recommendations.' },
                { icon: 'fa-chart-line',    title: 'Platform Improvement',           accent: '#00E5A0',  desc: 'Aggregated, anonymised usage data helps us understand which features are most valuable, identify bugs, and prioritise development.' },
                { icon: 'fa-bell',          title: 'Communications',                 accent: '#F472B6',  desc: 'We send transactional emails (account creation, password reset, enrolment confirmation) and, if opted in, product updates, course recommendations, and career insights.' },
                { icon: 'fa-gavel',         title: 'Legal & Safety Compliance',      accent: '#F87171',  desc: 'To comply with applicable laws and regulations, including the Nigerian Data Protection Regulation (NDPR) and General Data Protection Regulation (GDPR) for EU users, and to prevent fraud or abuse.' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-4 p-4 rounded-2xl"
                  style={{ background: '#0C1220', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-9 h-9 rounded-xl grid place-items-center text-[13px] flex-shrink-0"
                    style={{ background: item.accent + '18', color: item.accent }}>
                    <i className={`fas ${item.icon}`} />
                  </div>
                  <div>
                    <div className="font-jakarta font-semibold text-[13px] mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.title}</div>
                    <div className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 4. AI Features ────────────────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="ai-data" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA' }}>
                <i className="fas fa-brain" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">4. AI Features & Career Data</h2>
              <Tag label="New" color="#A78BFA" />
            </div>
            <p className="text-[14px] leading-relaxed mb-5 mt-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
              SkillHub's <strong className="text-white/70">AI Career Navigator</strong> is a first-of-its-kind feature that analyses your entire SkillHub profile — courses, certificates, portfolio, job applications, and Merit Coin history — and cross-references it with live market demand data to generate personalised career intelligence.
            </p>
            <div className="rounded-2xl p-5 mb-5"
              style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <div className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: 'rgba(167,139,250,0.7)' }}>
                What the AI Analyses
              </div>
              <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
                {[
                  'Enrolled courses and completion progress',
                  'Verified certificates and issuing platforms',
                  'Portfolio projects and technology stacks',
                  'Job application history and outcomes',
                  'Merit Coin tier and achievement history',
                  'Skills listed and their verified status',
                  'Live job market demand by skill (anonymised)',
                  'Your stated career goals and preferences',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <i className="fas fa-check text-[10px]" style={{ color: '#A78BFA' }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <InfoBlock
              icon="fa-shield-alt"
              title="AI Data Handling Commitments"
              accent="#A78BFA"
              items={[
                'AI analysis runs on-platform using your SkillHub profile data only — we do not send your personal details to third-party AI providers without your explicit consent.',
                'The conversational "Ask AI" feature sends a sanitised, anonymised profile summary as context to the AI model; your name, email, and direct identifiers are never included in AI prompts.',
                'AI-generated career insights are advisory only — they are not binding assessments, employment recommendations, or guarantees of career outcomes.',
                'You can delete your AI analysis history at any time from Settings → Privacy → Clear AI Data.',
                'Market demand signals are derived from anonymised, aggregated job listing data and do not expose individual employer or candidate details.',
              ]}
            />
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 5. Data Sharing ───────────────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="sharing" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171' }}>
                <i className="fas fa-share-nodes" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">5. Data Sharing & Disclosure</h2>
            </div>

            <div className="rounded-2xl p-5 mb-5"
              style={{ background: 'rgba(0,229,160,0.07)', border: '1px solid rgba(0,229,160,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-ban text-[13px]" style={{ color: '#00E5A0' }} />
                <span className="font-jakarta font-bold text-[14px]" style={{ color: '#00E5A0' }}>We do not sell your data. Ever.</span>
              </div>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                In line with the Meritlives LLC commitment, SkillHub never sells, rents, or trades your personal information to advertisers, data brokers, or any third party for commercial gain.
              </p>
            </div>

            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              We may share your information in the following limited, controlled circumstances:
            </p>
            {[
              {
                title: 'With Employers (Student profiles — opt-in only)',
                accent: '#4F8EF7',
                desc: 'If you choose to make your profile discoverable, verified employers on SkillHub may view your public profile, skills, certificates, and portfolio. You control your visibility at any time via Settings → Profile Visibility. Your email and phone number are never shared with employers without your explicit consent.',
              },
              {
                title: 'With Service Providers',
                accent: '#F59E0B',
                desc: 'We engage trusted third-party providers who process data on our behalf — such as cloud hosting (server infrastructure), email delivery services, and analytics tools. These providers are contractually bound to process data only for SkillHub purposes and are prohibited from using it for their own ends.',
              },
              {
                title: 'Legal Requirements',
                accent: '#F87171',
                desc: 'We may disclose information if required by law, court order, or government regulation, or if we believe in good faith that disclosure is necessary to protect the rights, safety, or property of SkillHub, our users, or the public.',
              },
              {
                title: 'Business Transfers',
                accent: '#A78BFA',
                desc: 'If SkillHub or Meritlives LLC undergoes a merger, acquisition, or asset sale, your data may be transferred to the acquiring entity. We will notify you via email and/or prominent notice on the platform before your data becomes subject to a different privacy policy.',
              },
            ].map(item => (
              <div key={item.title} className="mb-3 p-4 rounded-2xl"
                style={{ background: '#0C1220', border: `1px solid ${item.accent}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.accent }} />
                  <div className="font-jakarta font-semibold text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.title}</div>
                </div>
                <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.desc}</p>
              </div>
            ))}
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 6. Third-Party Platforms ──────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="platforms" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(56,189,248,0.12)', color: '#38BDF8' }}>
                <i className="fas fa-plug" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">6. Third-Party Learning Platforms</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              SkillHub allows you to connect external learning platforms — including Udemy, Coursera, edX, LinkedIn Learning, Pluralsight, Skillshare, Alison, and FutureLearn — to import your certificates and track your progress in one place.
            </p>
            <InfoBlock
              icon="fa-link"
              title="How Platform Connections Work"
              accent="#38BDF8"
              items={[
                'Connections are made via OAuth 2.0 — the industry standard for secure, permission-based account linking.',
                'We request only the minimum permissions necessary: typically read access to your completed courses and certificates.',
                'We never receive or store your password for any connected platform.',
                'You can revoke any platform connection at any time from Dashboard → Learning Platforms.',
                'When you disconnect a platform, we immediately remove the access token and cease data syncing. Previously imported certificates remain in your profile unless you manually delete them.',
                'Each connected platform operates under its own privacy policy. We encourage you to review their policies directly.',
              ]}
            />
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 7. Cookies ────────────────────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="cookies" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                <i className="fas fa-cookie-bite" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">7. Cookies & Tracking Technologies</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              We use cookies and similar technologies to operate the platform securely and understand how users engage with it.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { type: 'Essential',     color: '#00E5A0', desc: 'HttpOnly session cookies (sh_access, sh_refresh) that authenticate your session. These are required for the platform to function and cannot be disabled. They are never readable by JavaScript, protecting you from token-theft attacks.' },
                { type: 'Preference',    color: '#4F8EF7', desc: 'Cookies that remember your language, theme, and UI preferences between sessions.' },
                { type: 'Analytics',     color: '#F59E0B', desc: 'Anonymised usage analytics to understand which features are used most, page load performance, and error rates. No personally identifiable information is collected through analytics cookies.' },
                { type: 'No Advertising', color: '#F87171', desc: 'SkillHub does not use advertising or tracking cookies. We do not participate in cross-site tracking, retargeting networks, or ad exchanges.' },
              ].map(c => (
                <div key={c.type} className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background: '#0C1220', border: `1px solid ${c.color}25` }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-[5px]" style={{ background: c.color }} />
                  <div>
                    <span className="font-jakarta font-semibold text-[13px] mr-2" style={{ color: c.color }}>{c.type}</span>
                    <span className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{c.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 8. Security ───────────────────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="security" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(0,229,160,0.12)', color: '#00E5A0' }}>
                <i className="fas fa-shield-halved" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">8. Security Measures</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Meritlives LLC takes the security of your SkillHub data seriously. We implement industry-standard and beyond-baseline protections:
            </p>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              {[
                { icon: 'fa-lock',         title: 'Encrypted Passwords',    desc: 'All passwords are hashed with bcrypt before storage. We never store plaintext passwords.',        color: '#00E5A0' },
                { icon: 'fa-cookie',       title: 'HttpOnly Auth Cookies',  desc: 'Auth tokens live in HttpOnly cookies — inaccessible to JavaScript, eliminating XSS token theft.', color: '#4F8EF7' },
                { icon: 'fa-rotate',       title: 'Token Rotation',         desc: 'Short-lived access tokens are silently refreshed using long-lived refresh tokens without interrupting your session.', color: '#A78BFA' },
                { icon: 'fa-network-wired',title: 'TLS Encryption',         desc: 'All data in transit is protected by TLS 1.3. We do not support legacy protocols (SSL, TLS 1.0/1.1).', color: '#F59E0B' },
                { icon: 'fa-gauge',        title: 'Rate Limiting',          desc: 'Login, registration, and API endpoints are rate-limited to prevent brute-force attacks.',            color: '#38BDF8' },
                { icon: 'fa-clock',        title: 'Session Expiry',         desc: 'Inactive sessions expire automatically. You can also manually invalidate all sessions from Settings.', color: '#F472B6' },
              ].map(s => (
                <div key={s.title} className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background: '#0C1220', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-8 h-8 rounded-xl grid place-items-center text-[12px] flex-shrink-0"
                    style={{ background: s.color + '18', color: s.color }}>
                    <i className={`fas ${s.icon}`} />
                  </div>
                  <div>
                    <div className="font-jakarta font-semibold text-[12.5px] mb-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.title}</div>
                    <div className="text-[11.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[13px] leading-relaxed mt-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              While we implement robust protections, no system is completely immune to risk. In the event of a data breach that affects your personal information, we will notify you and the appropriate authorities within 72 hours as required by applicable law.
            </p>
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 9. Data Retention ─────────────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="retention" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(56,189,248,0.12)', color: '#38BDF8' }}>
                <i className="fas fa-clock-rotate-left" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">9. Data Retention</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              We retain your personal information for as long as your account is active, or as long as needed to provide you with Services and comply with legal obligations.
            </p>
            {[
              { label: 'Active account data',        period: 'Duration of account',     note: 'Retained while your account exists and you use the Services.' },
              { label: 'Deleted account data',       period: '30 days',                 note: 'Upon account deletion, personal data is permanently purged within 30 days, except where legal retention obligations apply.' },
              { label: 'Anonymised usage analytics', period: 'Up to 2 years',           note: 'Aggregated, non-identifiable analytics data may be retained longer to identify long-term platform trends.' },
              { label: 'Legal compliance records',   period: 'As required by law',      note: 'Certain transaction or compliance records may be retained for 5–7 years as required by financial or regulatory laws.' },
              { label: 'AI analysis snapshots',      period: '90 days then auto-purged', note: 'AI career analysis results are stored for 90 days so you can re-access previous insights, then automatically deleted unless you save them manually.' },
            ].map(r => (
              <div key={r.label} className="flex items-start gap-4 py-3.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{r.label}</div>
                <div className="w-36 text-[12px] font-semibold flex-shrink-0 text-right" style={{ color: '#38BDF8' }}>{r.period}</div>
                <div className="flex-1 text-[12px] text-right hidden md:block" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.note}</div>
              </div>
            ))}
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 10. Your Rights ───────────────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="rights" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>
                <i className="fas fa-user-shield" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">10. Your Rights & Choices</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              You have meaningful rights over your personal data. These apply regardless of where you are located, and are reinforced by GDPR (EU/EEA users) and NDPR (Nigeria users).
            </p>
            <div className="grid grid-cols-2 gap-3 mb-5 max-sm:grid-cols-1">
              <RightsCard icon="fa-eye"           title="Right to Access"        accent="#4F8EF7"  desc="Request a full copy of all personal data we hold about you. We will respond within 30 days." />
              <RightsCard icon="fa-pen"           title="Right to Correction"    accent="#00E5A0"  desc="Correct any inaccurate or outdated information directly in your profile or by contacting us." />
              <RightsCard icon="fa-trash"         title="Right to Deletion"      accent="#F87171"  desc="Request complete deletion of your account and personal data. We will process this within 30 days." />
              <RightsCard icon="fa-ban"           title="Right to Object"        accent="#F59E0B"  desc="Object to processing of your data for direct marketing or AI profiling at any time." />
              <RightsCard icon="fa-file-export"   title="Right to Portability"   accent="#A78BFA"  desc="Request your data in a portable, machine-readable format (JSON or CSV) to transfer to another service." />
              <RightsCard icon="fa-pause"         title="Right to Restrict"      accent="#38BDF8"  desc="Request that we restrict processing of your data while a dispute is being resolved." />
            </div>
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.18)' }}>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                To exercise any right, email us at <strong className="text-[#4F8EF7]">{CONTACT_EMAIL}</strong> with your account email and the specific request. We will verify your identity before acting. Most requests are fulfilled within 30 days at no cost.
              </p>
            </div>
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 11. Children ──────────────────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="children" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171' }}>
                <i className="fas fa-child" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">11. Children's Privacy</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
              SkillHub's Services are intended for users who are <strong className="text-white/70">16 years of age or older</strong>. In line with the original Meritlives LLC policy baseline, we do not knowingly collect personal information from children under 13.
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              If you believe that we have inadvertently collected information from a child under 13, please contact us immediately at <strong className="text-[#4F8EF7]">{CONTACT_EMAIL}</strong>. We will promptly investigate and delete the relevant data.
            </p>
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 12. International Transfers ───────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="international" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(56,189,248,0.12)', color: '#38BDF8' }}>
                <i className="fas fa-globe" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">12. International Data Transfers</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
              SkillHub operates globally and may store or process your data in jurisdictions outside your country of residence, including the United States, the European Union, and other locations where our infrastructure providers operate.
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Where we transfer data internationally, we ensure appropriate safeguards are in place — including Standard Contractual Clauses (SCCs) for EU users, and equivalent mechanisms for users in other jurisdictions. Our data handling aligns with both the Nigerian Data Protection Regulation (NDPR) and the EU General Data Protection Regulation (GDPR).
            </p>
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 13. Changes ───────────────────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="changes" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                <i className="fas fa-rotate" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">13. Changes to This Policy</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
              We may update this Privacy Policy periodically to reflect changes in our Services, legal requirements, or data practices. We will always post the updated policy on this page with the revised "Last Updated" date.
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              For material changes — such as new data uses, new sharing partners, or changes to your rights — we will notify you proactively by email and/or a prominent in-app notice at least 14 days before the changes take effect. Continued use of the Services after the effective date constitutes acceptance of the updated policy.
            </p>
          </section>

          <div className="h-px mb-12" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* ── 14. Contact ───────────────────────────────────────── */}
          <section className="mb-12">
            <SectionAnchor id="contact" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-[14px]"
                style={{ background: 'rgba(0,229,160,0.12)', color: '#00E5A0' }}>
                <i className="fas fa-envelope" />
              </div>
              <h2 className="font-jakarta font-bold text-[1.4rem] text-white">14. Contact Us</h2>
            </div>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
              If you have questions, concerns, or requests regarding this Privacy Policy or how SkillHub handles your personal data, please reach out to us:
            </p>
            <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
              {[
                { icon: 'fa-building',    label: 'Data Controller',    value: COMPANY_NAME,    accent: '#4F8EF7' },
                { icon: 'fa-envelope',    label: 'Privacy Email',      value: CONTACT_EMAIL,   accent: '#00E5A0' },
                { icon: 'fa-envelope',    label: 'Support Email',       value: CONTACT_PHONE,   accent: '#F59E0B' },
              ].map(c => (
                <div key={c.label} className="rounded-2xl p-5 text-center"
                  style={{ background: '#0C1220', border: `1px solid ${c.accent}25` }}>
                  <div className="w-10 h-10 rounded-xl grid place-items-center text-[14px] mx-auto mb-3"
                    style={{ background: c.accent + '18', color: c.accent }}>
                    <i className={`fas ${c.icon}`} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{c.label}</div>
                  <div className="text-[13px] font-semibold" style={{ color: c.accent }}>{c.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl p-5"
              style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.15)' }}>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                We aim to respond to all privacy-related inquiries within <strong className="text-white/60">5 business days</strong>. For data subject access requests or deletion requests, we will acknowledge within 48 hours and fulfil within 30 days.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="rounded-2xl p-6 text-center"
            style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src="/meritlives.svg" alt="SkillHub" style={{ width: 20, height: 20 }} />
              <span className="font-jakarta font-bold text-[14px] text-white">SkillHub</span>
            </div>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              A Meritlives LLC product · Privacy Policy · Effective {EFFECTIVE_DATE}
            </p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <Link href="/about" className="text-[11px] no-underline hover:opacity-80" style={{ color: 'rgba(79,142,247,0.7)' }}>About SkillHub</Link>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
              <Link href="/contact" className="text-[11px] no-underline hover:opacity-80" style={{ color: 'rgba(79,142,247,0.7)' }}>Contact Support</Link>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
              <Link href="/dashboard" className="text-[11px] no-underline hover:opacity-80" style={{ color: 'rgba(79,142,247,0.7)' }}>Dashboard</Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
