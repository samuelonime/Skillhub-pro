'use client';

import { useState, useEffect, useRef } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',             icon: 'fa-home',          label: 'Dashboard' },
  { href: '/dashboard/courses',     icon: 'fa-book-open',     label: 'Courses' },
  {
    icon: 'fa-sparkles',
    label: 'Next Gen',
    children: [
      { href: '/dashboard/career-oracle',   icon: 'fa-brain',               label: 'Career Oracle' },
      { href: '/dashboard/skill-coach',     icon: 'fa-heart-pulse',         label: 'Skill Coach' },
      { href: '/dashboard/skill-decay',     icon: 'fa-chart-line',          label: 'Skill Decay' },
      { href: '/dashboard/peer-genome',     icon: 'fa-users',               label: 'Peer Genome' },
      { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles', label: 'Ghost Recruiter' },
    ],
  },
  { href: '/dashboard/community',   icon: 'fa-users',         label: 'Community' },
  { href: '/dashboard/portfolio',   icon: 'fa-layer-group',   label: 'Portfolio' },
  { href: '/dashboard/resume',        icon: 'fa-file-lines',           label: 'Resume' },
  { href: '/dashboard/platforms',   icon: 'fa-graduation-cap',label: 'Learning Platforms' },
  { href: '/dashboard/jobs',        icon: 'fa-briefcase',     label: 'Jobs' },
  { href: '/dashboard/certificates',icon: 'fa-certificate',   label: 'Certificates' },
  { href: '/dashboard/rewards',     icon: 'fa-coins',         label: 'Rewards' },
  { href: '/dashboard/settings',    icon: 'fa-gear',          label: 'Settings' },
];

/* ─── Platform data ──────────────────────────────────────────────────────── */
const ALL_PLATFORMS = [
  {
    key: 'udemy',
    name: 'Udemy',
    tagline: "World's largest learning marketplace",
    logoUrl: 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg',
    logoBgWhite: true,
    accent: '#a435f0',
    accentDim: 'rgba(164,53,240,0.12)',
    coverGrad: 'linear-gradient(135deg, #2d1b4e 0%, #1a0d33 100%)',
    courses: '213,000+',
    students: '62M+',
    rating: 4.5,
    category: 'Marketplace',
    perks: ['Lifetime access', 'Certificate on completion', 'Mobile & desktop'],
    courseUrl: 'https://www.udemy.com/courses/',
    description: 'Learn from 69,000+ expert instructors covering every topic — from programming and design to business and wellness.',
  },
  {
    key: 'coursera',
    name: 'Coursera',
    tagline: 'University-grade learning, globally accessible',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Coursera-Logo_600x600.svg/600px-Coursera-Logo_600x600.svg.png',
    logoBgWhite: true,
    accent: '#0056d2',
    accentDim: 'rgba(0,86,210,0.12)',
    coverGrad: 'linear-gradient(135deg, #001e5a 0%, #000d30 100%)',
    courses: '7,000+',
    students: '130M+',
    rating: 4.7,
    category: 'Academic',
    perks: ['University certificates', 'Accredited degrees', '300+ partner institutions'],
    courseUrl: 'https://www.coursera.org/browse',
    description: 'Earn recognised credentials from Yale, Google, IBM, and 300 top universities — entirely online.',
  },
  {
    key: 'edx',
    name: 'edX',
    tagline: 'MIT & Harvard-quality education online',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/EdX.svg/800px-EdX.svg.png',
    logoBgWhite: false,
    accent: '#00b0a0',
    accentDim: 'rgba(0,176,160,0.12)',
    coverGrad: 'linear-gradient(135deg, #02262b 0%, #011518 100%)',
    courses: '3,500+',
    students: '45M+',
    rating: 4.6,
    category: 'Academic',
    perks: ['MicroMasters programs', 'Professional certificates', 'Free audit option'],
    courseUrl: 'https://www.edx.org/search',
    description: 'Access world-class MicroMasters, professional certificates, and bachelor\'s degrees from elite institutions.',
  },
  {
    key: 'cisco',
    name: 'Cisco Networking Academy',
    tagline: 'Build the skills that power the digital world',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Cisco_logo.svg/512px-Cisco_logo.svg.png',
    logoBgWhite: true,
    accent: '#049fd9',
    accentDim: 'rgba(4,159,217,0.12)',
    coverGrad: 'linear-gradient(135deg, #062d43 0%, #03141f 100%)',
    courses: '70+ career paths',
    students: '20M+ learners',
    rating: 4.6,
    category: 'Tech',
    perks: ['Networking fundamentals', 'Cybersecurity pathways', 'Industry certifications'],
    courseUrl: 'https://www.netacad.com/courses',
    description: 'Learn networking, cybersecurity, programming, and digital skills through Cisco-backed courses and career pathways.',
  },
  {
    key: 'credly',
    name: 'Credly',
    tagline: 'Digital credentials from trusted issuers',
    logoUrl: 'https://www.credly.com/favicon.ico',
    logoBgWhite: true,
    accent: '#6c63ff',
    accentDim: 'rgba(108,99,255,0.12)',
    coverGrad: 'linear-gradient(135deg, #211d4f 0%, #100e2a 100%)',
    courses: 'Issuer badges',
    students: 'Millions of earners',
    rating: 4.5,
    category: 'Professional',
    perks: ['Verifiable digital badges', 'Technology credentials', 'Shareable profiles'],
    courseUrl: 'https://www.credly.com/earner/earned_badges',
    description: 'Collect and share verified digital credentials issued by technology companies, universities, and professional organizations.',
  },
  {
    key: 'microsoft',
    name: 'Microsoft Learn',
    tagline: 'Build skills for the Microsoft ecosystem',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    logoBgWhite: true,
    accent: '#737373',
    accentDim: 'rgba(115,115,115,0.12)',
    coverGrad: 'linear-gradient(135deg, #263238 0%, #11181c 100%)',
    courses: 'Free learning paths',
    students: 'Global learners',
    rating: 4.6,
    category: 'Professional',
    perks: ['Azure training', 'Role-based certifications', 'Interactive sandboxes'],
    courseUrl: 'https://learn.microsoft.com/training/',
    description: 'Develop cloud, data, security, and developer skills with Microsoft learning paths and role-based credentials.',
  },
  {
    key: 'google',
    name: 'Google Cloud Skills Boost',
    tagline: 'Hands-on cloud training with real labs',
    logoUrl: 'https://www.gstatic.com/cloudskills/images/SkillsBoostIcon.png',
    logoBgWhite: true,
    accent: '#4285f4',
    accentDim: 'rgba(66,133,244,0.12)',
    coverGrad: 'linear-gradient(135deg, #102e5c 0%, #08162d 100%)',
    courses: 'Hands-on labs',
    students: 'Cloud learners',
    rating: 4.6,
    category: 'Tech',
    perks: ['Google Cloud labs', 'Skill badges', 'Cloud practice environments'],
    courseUrl: 'https://www.cloudskillsboost.google/catalog',
    description: 'Practice Google Cloud technologies through hands-on labs, quests, and skill badges built for cloud careers.',
  },
  {
    key: 'aws',
    name: 'AWS Training',
    tagline: 'Learn cloud skills from AWS experts',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
    logoBgWhite: true,
    accent: '#ff9900',
    accentDim: 'rgba(255,153,0,0.12)',
    coverGrad: 'linear-gradient(135deg, #4a2a05 0%, #211302 100%)',
    courses: 'Cloud learning paths',
    students: 'AWS learners',
    rating: 4.7,
    category: 'Tech',
    perks: ['AWS Skill Builder', 'Cloud labs', 'Certification preparation'],
    courseUrl: 'https://skillbuilder.aws/',
    description: 'Build practical AWS cloud skills with digital courses, hands-on labs, and certification preparation.',
  },
  {
    key: 'linkedin',
    name: 'LinkedIn Learning',
    tagline: 'Skills that advance your career',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/480px-LinkedIn_logo_initials.png',
    logoBgWhite: false,
    accent: '#0a66c2',
    accentDim: 'rgba(10,102,194,0.12)',
    coverGrad: 'linear-gradient(135deg, #0a2a4a 0%, #041525 100%)',
    courses: '21,000+',
    students: '27M+',
    rating: 4.4,
    category: 'Professional',
    perks: ['Profile integration', 'Skill assessments', 'Personalised paths'],
    courseUrl: 'https://www.linkedin.com/learning/browse/',
    description: 'Grow your career with skills-based learning that automatically connects to your LinkedIn profile and job applications.',
  },
  {
    key: 'pluralsight',
    name: 'Pluralsight',
    tagline: 'Tech & cloud skills for engineers',
    logoUrl: 'https://www.vectorlogo.zone/logos/pluralsight/pluralsight-icon.svg',
    logoBgWhite: false,
    accent: '#f15b2a',
    accentDim: 'rgba(241,91,42,0.12)',
    coverGrad: 'linear-gradient(135deg, #3d1a0a 0%, #1f0d05 100%)',
    courses: '7,500+',
    students: '17M+',
    rating: 4.5,
    category: 'Tech',
    perks: ['Skill IQ benchmarks', 'Role-based paths', 'Cloud sandbox labs'],
    courseUrl: 'https://www.pluralsight.com/browse',
    description: 'Master cloud, security, and software engineering with hands-on labs and precision skill assessments.',
  },
  {
    key: 'skillshare',
    name: 'Skillshare',
    tagline: 'Creative & business classes for makers',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Skillshare_Logo.svg/800px-Skillshare_Logo.svg.png',
    logoBgWhite: true,
    accent: '#00ba88',
    accentDim: 'rgba(0,186,136,0.12)',
    coverGrad: 'linear-gradient(135deg, #003d2e 0%, #001a14 100%)',
    courses: '40,000+',
    students: '12M+',
    rating: 4.3,
    category: 'Creative',
    perks: ['Project-based learning', 'Community critique', 'Offline downloads'],
    courseUrl: 'https://www.skillshare.com/browse',
    description: 'Learn design, illustration, film, writing, and entrepreneurship from working industry professionals.',
  },
  {
    key: 'alison',
    name: 'Alison',
    tagline: 'Free certified courses — no subscription',
    logoUrl: 'https://alison.com/images/alison-logo.png',
    logoBgWhite: true,
    accent: '#7eb63e',
    accentDim: 'rgba(126,182,62,0.12)',
    coverGrad: 'linear-gradient(135deg, #1c3510 0%, #0d1a08 100%)',
    courses: '5,000+',
    students: '40M+',
    rating: 4.2,
    category: 'Free',
    perks: ['100% free forever', 'CPD certificates', 'Diploma programs'],
    courseUrl: 'https://alison.com/courses',
    description: 'Access thousands of free certified courses — absolutely no subscription, paywall, or hidden fees.',
  },
  {
    key: 'futurelearn',
    name: 'FutureLearn',
    tagline: 'Expert-led learning with global community',
    logoUrl: 'https://ugc.futurelearn.com/uploads/images/96/0e/logo_960e9c1f-ce1d-4bc3-a23a-ee5a2c5d9e8a.png',
    logoBgWhite: false,
    accent: '#e4003b',
    accentDim: 'rgba(228,0,59,0.12)',
    coverGrad: 'linear-gradient(135deg, #3d0010 0%, #1a0008 100%)',
    courses: '1,000+',
    students: '18M+',
    rating: 4.4,
    category: 'Academic',
    perks: ['Discussion-driven learning', 'Expert educators', 'Microcredentials'],
    courseUrl: 'https://www.futurelearn.com/courses',
    description: 'Learn through conversation and expert-structured short courses from the world\'s most respected educators.',
  },
];

const CATEGORIES = ['All', 'Academic', 'Marketplace', 'Professional', 'Tech', 'Creative', 'Free'];

/* ─── Star rating ────────────────────────────────────────────────────────── */
function Stars({ rating, accent }: { rating: number; accent: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n} width="11" height="11" viewBox="0 0 10 10"
          fill={n <= Math.round(rating) ? accent : 'rgba(255,255,255,0.12)'}>
          <path d="M5 1l1.12 2.27 2.51.36-1.81 1.77.43 2.49L5 6.77l-2.25 1.12.43-2.49L1.37 3.63l2.51-.36L5 1z"/>
        </svg>
      ))}
      <span className="ml-1.5 text-[11px] font-bold tabular-nums" style={{ color: accent }}>{rating}</span>
    </div>
  );
}

/* ─── Platform logo with fallback ───────────────────────────────────────── */
function PlatformLogo({ p, size = 44 }: { p: typeof ALL_PLATFORMS[0]; size?: number }) {
  const [err, setErr] = useState(false);
  return (
    <div
      className="rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{
        width: size, height: size,
        background: p.logoBgWhite ? '#fff' : p.coverGrad.split('(')[0] === 'linear-gradient' ? '#111827' : '#111827',
        boxShadow: `0 0 0 1.5px ${p.accent}40, 0 4px 16px ${p.accent}20`,
      }}
    >
      {!err ? (
        <img
          src={p.logoUrl}
          alt={p.name}
          onError={() => setErr(true)}
          style={{ width: size * 0.7, height: size * 0.7, objectFit: 'contain' }}
        />
      ) : (
        <span className="font-jakarta font-black text-white" style={{ fontSize: size * 0.3 }}>
          {p.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

/* ─── Connection Dialog ──────────────────────────────────────────────────── */
type ConnectStatus = 'connecting' | 'success' | 'failed';

function ConnectionDialog({
  platform, onDone, onClose,
}: {
  platform: typeof ALL_PLATFORMS[0];
  onDone: (success: boolean) => void;
  onClose: () => void;
}) {
  const [status, setStatus]     = useState<ConnectStatus>('connecting');
  const [progress, setProgress] = useState(0);
  const [logLines, setLogLines] = useState<Array<{ text: string; type: 'info' | 'ok' | 'err' | 'dim' }>>([]);
  const [dots, setDots]         = useState('');
  const logRef                  = useRef<HTMLDivElement>(null);

  /* animated dots */
  useEffect(() => {
    if (status !== 'connecting') return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(t);
  }, [status]);

  /* scroll log to bottom */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  /* main connection flow */
  useEffect(() => {
    const steps: Array<{ pct: number; text: string; delay: number }> = [
      { pct: 12,  delay: 0,    text: `▶  Resolving ${platform.name} endpoint…` },
      { pct: 28,  delay: 520,  text: '▶  Opening encrypted TLS channel…' },
      { pct: 45,  delay: 980,  text: '▶  Sending OAuth 2.0 handshake…' },
      { pct: 62,  delay: 1500, text: `▶  Verifying ${platform.name} API credentials…` },
      { pct: 78,  delay: 2050, text: '▶  Syncing account metadata…' },
      { pct: 90,  delay: 2500, text: '▶  Fetching course catalogue headers…' },
      { pct: 97,  delay: 2900, text: '▶  Finalising secure session…' },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach(s => {
      timers.push(setTimeout(() => {
        setProgress(s.pct);
        setLogLines(prev => [...prev, { text: s.text, type: 'info' }]);
      }, s.delay));
    });

    /* API call */
    timers.push(setTimeout(() => {
      apiFetch(`/platforms/${platform.key}/connect`, { method: 'POST' })
        .then(res => {
          setProgress(100);
          setTimeout(() => {
            if (res.success) {
              setStatus('success');
              setLogLines(prev => [...prev, { text: `✔  Connection to ${platform.name} established successfully.`, type: 'ok' }]);
            } else {
              setStatus('failed');
              setLogLines(prev => [...prev, { text: `✘  ${res.message || 'Server refused the connection.'}`, type: 'err' }]);
            }
            onDone(res.success);
          }, 400);
        })
        .catch(() => {
          setProgress(100);
          setTimeout(() => {
            setStatus('failed');
            setLogLines(prev => [...prev, { text: '✘  Network error — could not reach platform.', type: 'err' }]);
            onDone(false);
          }, 400);
        });
    }, 3200));

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isConnecting = status === 'connecting';
  const isSuccess    = status === 'success';
  const accentNow    = isConnecting ? platform.accent : isSuccess ? '#00E5A0' : '#F87171';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
      onClick={isConnecting ? undefined : onClose}
    >
      <div
        className="w-full max-w-[460px] rounded-3xl relative overflow-hidden"
        style={{
          background: 'rgba(10,14,24,0.97)',
          border: `1px solid ${accentNow}35`,
          boxShadow: `0 50px 100px rgba(0,0,0,0.8), 0 0 80px ${accentNow}12, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Scanning glow stripe at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[1.5px] transition-all duration-700"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentNow} 50%, transparent 100%)`,
            boxShadow: `0 0 12px ${accentNow}`,
          }}
        />

        {/* Background ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-700"
          style={{
            width: 500, height: 300,
            background: `radial-gradient(ellipse at 50% 0%, ${accentNow}18 0%, transparent 65%)`,
          }}
        />

        {/* ── Header ── */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3.5">
            <PlatformLogo p={platform} size={46} />
            <div>
              <div className="font-jakarta font-bold text-[16px] text-white">{platform.name}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Learning Platform · OAuth 2.0</div>
            </div>
          </div>
          {!isConnecting && (
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl grid place-items-center cursor-pointer border-0 transition-all hover:opacity-70"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
              <i className="fas fa-times text-[12px]" />
            </button>
          )}
        </div>

        {/* ── Progress bar ── */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {isConnecting ? `Connecting${dots}` : isSuccess ? 'Connection established' : 'Connection failed'}
            </span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: accentNow }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: isConnecting
                  ? `linear-gradient(90deg, ${platform.accent}aa, ${platform.accent})`
                  : isSuccess ? '#00E5A0' : '#F87171',
                boxShadow: isConnecting ? `0 0 8px ${platform.accent}` : 'none',
              }}
            />
          </div>
        </div>

        {/* ── Terminal log ── */}
        <div className="px-6 py-3">
          <div
            ref={logRef}
            className="rounded-xl p-4 overflow-y-auto"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.05)',
              maxHeight: 148,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
              fontSize: 11,
              lineHeight: 1.7,
            }}
          >
            <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#27C93F' }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>skillhub://connect/{platform.key}</span>
            </div>
            {logLines.map((line, i) => (
              <div key={i} className="flex gap-2.5 mb-0.5 items-start">
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, userSelect: 'none', paddingTop: 1 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{
                  color: line.type === 'ok' ? '#00E5A0'
                    : line.type === 'err' ? '#F87171'
                    : line.type === 'dim' ? 'rgba(255,255,255,0.2)'
                    : 'rgba(255,255,255,0.5)',
                }}>
                  {line.text}
                </span>
              </div>
            ))}
            {isConnecting && (
              <div className="flex gap-2.5 items-center mt-1">
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>{String(logLines.length + 1).padStart(2, '0')}</span>
                <span className="animate-pulse" style={{ color: platform.accent }}>█</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Result card ── */}
        {!isConnecting && (
          <div className="px-6 pb-4">
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{
                background: isSuccess ? 'rgba(0,229,160,0.07)' : 'rgba(248,113,113,0.07)',
                border: `1px solid ${isSuccess ? 'rgba(0,229,160,0.2)' : 'rgba(248,113,113,0.2)'}`,
              }}
            >
              {/* Status icon */}
              <div
                className="w-12 h-12 rounded-2xl grid place-items-center flex-shrink-0 text-2xl"
                style={{ background: isSuccess ? 'rgba(0,229,160,0.12)' : 'rgba(248,113,113,0.12)' }}
              >
                {isSuccess ? '✓' : '✗'}
              </div>
              <div>
                <div
                  className="font-jakarta font-bold text-[16px] mb-0.5"
                  style={{ color: isSuccess ? '#00E5A0' : '#F87171' }}
                >
                  {isSuccess ? 'Connection Successful' : 'Connection Failed'}
                </div>
                <div className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {isSuccess
                    ? `Your ${platform.name} account is now linked. Certificates and progress will sync automatically.`
                    : 'Unable to connect. Check your network or try again later.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="px-6 pb-6 pt-1">
          {isConnecting ? (
            <div className="flex items-center justify-center gap-3 py-3">
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${platform.accent}40`, borderTopColor: platform.accent }}
              />
              <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Connecting to {platform.name}…
              </span>
            </div>
          ) : isSuccess ? (
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-[13px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}
              >
                Stay here
              </button>
              <button
                onClick={() => { onClose(); window.open(platform.courseUrl, '_blank'); }}
                className="flex-[2] py-3 rounded-xl text-[13px] font-bold border-0 cursor-pointer transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${platform.accent}, ${platform.accent}cc)`, color: '#fff', boxShadow: `0 8px 24px ${platform.accent}44` }}
              >
                <i className="fas fa-external-link-alt text-[11px]" />
                Browse {platform.name} Courses
              </button>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-[13px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}
              >
                Dismiss
              </button>
              <button
                onClick={() => window.open(platform.courseUrl, '_blank')}
                className="flex-1 py-3 rounded-xl text-[13px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80 flex items-center justify-center gap-2"
                style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}
              >
                <i className="fas fa-external-link-alt text-[10px]" /> Browse anyway
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Import Certificate Modal ───────────────────────────────────────────── */
function ImportCertModal({ platform, onClose, onImported }: {
  platform: typeof ALL_PLATFORMS[0];
  onClose: () => void;
  onImported: (msg: string) => void;
}) {
  const [form, setForm]     = useState({ title: '', completedAt: '', credentialUrl: '', skills: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function submit() {
    if (!form.title || !form.completedAt) { setError('Course title and completion date are required.'); return; }
    setSaving(true);
    try {
      const res = await apiFetch(`/platforms/${platform.key}/certificates`, {
        method: 'POST',
        body: JSON.stringify({ ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }),
      });
      if (res.success) { onImported('Certificate imported successfully!'); onClose(); }
      else setError(res.message || 'Failed to import certificate.');
    } catch (e: any) { setError(e.message || 'An error occurred.'); }
    finally { setSaving(false); }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-3xl overflow-hidden"
        style={{ background: 'rgba(10,14,24,0.97)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 50px 100px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <PlatformLogo p={platform} size={42} />
            <div>
              <div className="font-jakarta font-bold text-[15px] text-white">Import Certificate</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>from {platform.name}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl grid place-items-center cursor-pointer border-0 transition-all hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
            <i className="fas fa-times text-[12px]" />
          </button>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl text-[12px] font-medium" style={{ background: 'rgba(248,113,113,0.09)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
              <i className="fas fa-exclamation-circle mr-2" />{error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {[
              { label: 'Course Title',               key: 'title',         placeholder: 'e.g. Complete React Developer',  required: true },
              { label: 'Completion Date',             key: 'completedAt',   type: 'date',                                  required: true },
              { label: 'Credential URL',              key: 'credentialUrl', placeholder: 'https://certificate-url.com' },
              { label: 'Skills (comma-separated)',    key: 'skills',        placeholder: 'React, JavaScript, TypeScript' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {f.label}{f.required && <span className="ml-1" style={{ color: '#F87171' }}>*</span>}
                </label>
                <input
                  type={(f as any).type || 'text'}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={(f as any).placeholder || ''}
                  className="w-full px-4 py-3 rounded-xl text-[13px] font-[inherit] outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.8)', colorScheme: 'dark' }}
                  onFocus={e => { e.target.style.border = `1px solid ${platform.accent}60`; e.target.style.boxShadow = `0 0 0 3px ${platform.accent}14`; }}
                  onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 mt-6">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-[13px] font-semibold border-0 cursor-pointer transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
              Cancel
            </button>
            <button onClick={submit} disabled={saving}
              className="flex-[2] py-3 rounded-xl text-[13px] font-bold border-0 cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${platform.accent}, ${platform.accent}bb)`, color: '#fff' }}>
              {saving ? (<><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Importing…</>) : (<><i className="fas fa-download text-[11px]" /> Import Certificate</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Platform Card ──────────────────────────────────────────────────────── */
function PlatformCard({ platform, connected, onConnect, onImport }: {
  platform: typeof ALL_PLATFORMS[0];
  connected: boolean;
  onConnect: (p: typeof ALL_PLATFORMS[0]) => void;
  onImport:  (p: typeof ALL_PLATFORMS[0]) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-3xl overflow-hidden flex flex-col relative cursor-pointer"
      style={{
        background: '#0C1220',
        border: `1px solid ${hovered ? platform.accent + '35' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered ? `0 20px 60px ${platform.accent}18, 0 0 0 1px ${platform.accent}20` : '0 4px 20px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover banner */}
      <div
        className="relative px-5 pt-5 pb-4 overflow-hidden"
        style={{ background: platform.coverGrad, minHeight: 90 }}
      >
        {/* Cover texture orbs */}
        <div className="absolute pointer-events-none" style={{ top: -30, right: -20, width: 140, height: 140, background: `radial-gradient(circle, ${platform.accent}25 0%, transparent 70%)` }} />
        <div className="absolute pointer-events-none" style={{ bottom: -20, left: -10, width: 80, height: 80, background: `radial-gradient(circle, ${platform.accent}15 0%, transparent 70%)` }} />

        {/* Logo + badges */}
        <div className="relative z-10 flex items-start justify-between">
          <PlatformLogo p={platform} size={52} />
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full"
              style={{ background: `${platform.accent}28`, color: platform.accent, border: `1px solid ${platform.accent}40` }}
            >
              {platform.category}
            </span>
            {connected && (
              <span className="flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,229,160,0.14)', color: '#00E5A0', border: '1px solid rgba(0,229,160,0.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: '#00E5A0' }} />
                Connected
              </span>
            )}
          </div>
        </div>

        {/* Name + rating */}
        <div className="relative z-10 mt-3">
          <div className="font-jakarta font-extrabold text-[17px] text-white tracking-tight">{platform.name}</div>
          <div className="mt-1"><Stars rating={platform.rating} accent={platform.accent} /></div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Tagline */}
        <p className="text-[11.5px] italic mb-3.5" style={{ color: `${platform.accent}bb` }}>"{platform.tagline}"</p>

        {/* Description */}
        <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {platform.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Courses',  value: platform.courses },
            { label: 'Learners', value: platform.students },
          ].map(s => (
            <div key={s.label}
              className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: `${platform.accent}0d`, border: `1px solid ${platform.accent}1a` }}>
              <div className="font-jakarta font-bold text-[15px]" style={{ color: platform.accent }}>{s.value}</div>
              <div className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Perks */}
        <div className="flex flex-col gap-2 mb-5 flex-1">
          {platform.perks.map(perk => (
            <div key={perk} className="flex items-center gap-2.5 text-[11.5px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <div className="w-4 h-4 rounded-full grid place-items-center flex-shrink-0"
                style={{ background: `${platform.accent}18` }}>
                <i className="fas fa-check text-[7px]" style={{ color: platform.accent }} />
              </div>
              {perk}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {connected ? (
            <>
              <button
                onClick={() => onImport(platform)}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold border-0 cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${platform.accent}, ${platform.accent}bb)`, color: '#fff', boxShadow: `0 6px 20px ${platform.accent}35` }}
              >
                <i className="fas fa-download text-[10px]" /> Import Cert
              </button>
              <button
                onClick={() => window.open(platform.courseUrl, '_blank')}
                className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 border-0 cursor-pointer transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
              >
                <i className="fas fa-external-link-alt text-[11px]" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onConnect(platform)}
              className="w-full py-2.5 rounded-xl text-[12.5px] font-bold border-0 cursor-pointer flex items-center justify-center gap-2 transition-all"
              style={{
                background: hovered ? `linear-gradient(135deg, ${platform.accent}22, ${platform.accent}11)` : 'rgba(255,255,255,0.06)',
                color: hovered ? platform.accent : 'rgba(255,255,255,0.55)',
                border: `1px solid ${hovered ? platform.accent + '40' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              <i className="fas fa-plug text-[10px]" /> Connect Platform
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function PlatformsPage() {
  const [connected, setConnected]         = useState<Record<string, any>>({});
  const [certificates, setCertificates]   = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('All');
  const [search, setSearch]               = useState('');
  const [connectDialog, setConnectDialog] = useState<typeof ALL_PLATFORMS[0] | null>(null);
  const [importModal, setImportModal]     = useState<typeof ALL_PLATFORMS[0] | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [platRes, certRes] = await Promise.all([
        apiFetch('/platforms'),
        apiFetch('/platforms/certificates'),
      ]);
      if (platRes.success) {
        const map: Record<string, any> = {};
        (platRes.data || []).forEach((p: any) => { map[p.platform] = p; });
        setConnected(map);
      }
      if (certRes.success) setCertificates(certRes.data || []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4500);
  }

  function handleConnectionDone(success: boolean) {
    if (success) load();
  }

  const filtered = ALL_PLATFORMS
    .filter(p => filter === 'All' || p.category === filter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.tagline.toLowerCase().includes(search.toLowerCase()));

  const connectedCount = Object.keys(connected).length;

  return (
    <SidebarLayout navItems={navItems} pageTitle="Learning Platforms">

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-[400] flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all"
          style={{
            background: toast.ok ? 'rgba(0,229,160,0.12)' : 'rgba(248,113,113,0.12)',
            border: `1px solid ${toast.ok ? 'rgba(0,229,160,0.3)' : 'rgba(248,113,113,0.3)'}`,
            color: toast.ok ? '#00E5A0' : '#F87171',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <i className={`fas ${toast.ok ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
          {toast.msg}
        </div>
      )}

      {connectDialog && (
        <ConnectionDialog
          platform={connectDialog}
          onDone={handleConnectionDone}
          onClose={() => setConnectDialog(null)}
        />
      )}

      {importModal && (
        <ImportCertModal
          platform={importModal}
          onClose={() => setImportModal(null)}
          onImported={msg => { showToast(msg); setImportModal(null); load(); }}
        />
      )}

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden mb-6 p-7"
        style={{ background: 'linear-gradient(135deg, #080C14 0%, #0D1A2E 50%, #080C14 100%)', border: '1px solid rgba(79,142,247,0.15)' }}>
        {/* Orbs */}
        <div className="absolute pointer-events-none" style={{ top: -80, left: -40, width: 320, height: 320, background: 'radial-gradient(circle, rgba(79,142,247,0.15) 0%, transparent 65%)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: -60, right: 60, width: 220, height: 220, background: 'radial-gradient(circle, rgba(0,229,160,0.09) 0%, transparent 65%)' }} />

        <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(79,142,247,0.7)' }}>
              Marketplace
            </div>
            <h1 className="font-jakarta font-extrabold text-[2rem] text-white tracking-tight leading-tight mb-2">
              Learning Platforms
            </h1>
            <p className="text-[13px] max-w-[460px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Connect your favourite learning platforms, study their courses, then import certificates directly into your SkillHub profile.
            </p>
          </div>
          {/* Live stats */}
          <div className="flex gap-4">
            {[
              { n: connectedCount,          label: 'Connected',  accent: '#4F8EF7' },
              { n: certificates.length,     label: 'Certs',      accent: '#00E5A0' },
              { n: ALL_PLATFORMS.length,    label: 'Platforms',  accent: '#F59E0B' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-jakarta font-extrabold text-[2rem] leading-none" style={{ color: s.accent }}>{s.n}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mb-6 max-md:grid-cols-2">
        {[
          { n: '01', icon: 'fa-plug',             title: 'Connect',  text: 'Click Connect on any platform below' },
          { n: '02', icon: 'fa-shield-alt',        title: 'Verify',   text: 'We authenticate securely via OAuth 2.0' },
          { n: '03', icon: 'fa-book-open',         title: 'Learn',    text: 'Study and complete courses on the platform' },
          { n: '04', icon: 'fa-certificate',       title: 'Import',   text: 'Sync your certificates back to SkillHub' },
        ].map(s => (
          <div key={s.n} className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-8 h-8 rounded-xl grid place-items-center flex-shrink-0 font-jakarta font-black text-[11px]"
              style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>
              {s.n}
            </div>
            <div>
              <div className="font-jakarta font-bold text-[13px] text-white mb-0.5">{s.title}</div>
              <div className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter + Search ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-3.5 py-1.5 rounded-xl text-[12px] font-semibold border-0 cursor-pointer transition-all"
              style={{
                background: filter === cat ? '#4F8EF7' : 'rgba(255,255,255,0.06)',
                color: filter === cat ? '#fff' : 'rgba(255,255,255,0.45)',
                boxShadow: filter === cat ? '0 4px 14px rgba(79,142,247,0.35)' : 'none',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <input
            type="text"
            placeholder="Search platforms…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 rounded-xl text-[12px] font-[inherit] outline-none w-52 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
          />
        </div>
      </div>

      {/* ── Platform grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4 mb-8 max-[1300px]:grid-cols-3 max-[960px]:grid-cols-2 max-md:grid-cols-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-3xl animate-pulse" style={{ height: 400, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <i className="fas fa-search text-4xl block mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No platforms match "{search}"</p>
          <button onClick={() => setSearch('')} className="mt-3 text-[12px] font-semibold cursor-pointer border-0 bg-transparent" style={{ color: '#4F8EF7' }}>Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-8 max-[1300px]:grid-cols-3 max-[960px]:grid-cols-2 max-md:grid-cols-1">
          {filtered.map(platform => (
            <PlatformCard
              key={platform.key}
              platform={platform}
              connected={!!connected[platform.key]}
              onConnect={p => setConnectDialog(p)}
              onImport={p => setImportModal(p)}
            />
          ))}
        </div>
      )}

      {/* ── Imported Certificates ───────────────────────────────────────── */}
      {certificates.length > 0 && (
        <div className="rounded-3xl p-6" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl grid place-items-center text-[13px]" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
              <i className="fas fa-certificate" />
            </div>
            <span className="font-jakarta font-bold text-[15px] text-white">Imported Certificates</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
              {certificates.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
            {certificates.map((cert: any) => {
              const plat = ALL_PLATFORMS.find(p => p.key === cert.platform);
              return (
                <div key={cert.id}
                  className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    {plat ? <PlatformLogo p={plat} size={32} /> : (
                      <div className="w-8 h-8 rounded-lg grid place-items-center text-sm" style={{ background: 'rgba(255,255,255,0.07)' }}>📚</div>
                    )}
                    <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>{plat?.name || cert.issuer}</span>
                  </div>
                  <div className="font-jakarta font-semibold text-[13px] text-white/85 leading-snug mb-2">{cert.title}</div>
                  {cert.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {cert.skills.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[10.5px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {cert.completedAt ? new Date(cert.completedAt).toLocaleDateString() : ''}
                    </span>
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noreferrer"
                        className="text-[11px] font-semibold no-underline hover:opacity-70 transition-all" style={{ color: '#4F8EF7' }}>
                        View <i className="fas fa-external-link-alt text-[9px]" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </SidebarLayout>
  );
}
