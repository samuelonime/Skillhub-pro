'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
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

// ── Platform config ──────────────────────────────────────────────────────────
const PLATFORMS: Record<string, { color: string; logo: string; bg: string }> = {
  Udemy:            { color: '#a435f0', bg: '#2D2F31', logo: 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy-inverted.svg' },
  Coursera:         { color: '#0056d2', bg: '#1A1A2E', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Coursera-Logo_600x600.svg/600px-Coursera-Logo_600x600.svg.png' },
  edX:              { color: '#00b0a0', bg: '#0A1628', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/EdX.svg/800px-EdX.svg.png' },
  'LinkedIn Learning':{ color: '#0a66c2', bg: '#0A1628', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/480px-LinkedIn_logo_initials.png' },
  Pluralsight:      { color: '#f15b2a', bg: '#1A0A05', logo: 'https://www.vectorlogo.zone/logos/pluralsight/pluralsight-icon.svg' },
  Skillshare:       { color: '#00ba88', bg: '#001A14', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Skillshare_Logo.svg/800px-Skillshare_Logo.svg.png' },
  'Frontend Masters':{ color: '#e8403a', bg: '#1A0A0A', logo: 'https://frontendmasters.com/static/favicon-32x32.png' },
  AWS:              { color: '#ff9900', bg: '#1A1200', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/800px-Amazon_Web_Services_Logo.svg.png' },
};
const PLATFORM_ALIASES: Record<string, keyof typeof PLATFORMS> = {
  local: 'Udemy',
  meritlives: 'Coursera',
  'figma academy': 'Skillshare',
  figma: 'Skillshare',
  'amazon web services': 'AWS',
  aws: 'AWS',
  udemy: 'Udemy',
  coursera: 'Coursera',
  edx: 'edX',
  'linkedin learning': 'LinkedIn Learning',
  pluralsight: 'Pluralsight',
  skillshare: 'Skillshare',
  'frontend masters': 'Frontend Masters',
};

const REALISTIC_THUMBNAILS: Record<string, string> = {
  aws: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
  cloud: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
  devops: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=900&q=80',
  react: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
  javascript: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
  typescript: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
  nextjs: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
  html: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
  css: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
  node: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80',
  python: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=900&q=80',
  django: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=900&q=80',
  api: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80',
  data: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
  sql: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
  'machine learning': 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=900&q=80',
  ai: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=900&q=80',
  security: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=900&q=80',
  ethical: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=900&q=80',
  ui: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=900&q=80',
  ux: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=900&q=80',
  figma: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=900&q=80',
  flutter: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
  'react native': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
};

const CATEGORY_LANDING_COPY: Record<string, { eyebrow: string; outcome: string; audience: string; includes: string[] }> = {
  frontend: { eyebrow: 'Build production interfaces', outcome: 'Ship responsive apps with modern component patterns.', audience: 'Frontend developers', includes: ['Portfolio project', 'Code reviews', 'UI patterns'] },
  backend: { eyebrow: 'Design reliable services', outcome: 'Create APIs, data models, auth flows, and scalable backend systems.', audience: 'Backend engineers', includes: ['API project', 'Database design', 'Deployment flow'] },
  cloud: { eyebrow: 'Launch cloud-ready systems', outcome: 'Understand infrastructure, deployment, monitoring, and cloud operations.', audience: 'Cloud learners', includes: ['Cloud labs', 'Architecture demos', 'Ops checklist'] },
  data: { eyebrow: 'Turn data into decisions', outcome: 'Analyze datasets, build models, and communicate insights clearly.', audience: 'Data professionals', includes: ['Notebook labs', 'Dashboards', 'Model workflow'] },
  security: { eyebrow: 'Protect modern systems', outcome: 'Learn threat modeling, secure habits, and defensive workflows.', audience: 'Security learners', includes: ['Risk labs', 'Secure checklist', 'Incident basics'] },
  design: { eyebrow: 'Craft usable experiences', outcome: 'Research, prototype, and present polished product flows.', audience: 'Product designers', includes: ['Figma files', 'UX critique', 'Prototype sprint'] },
  mobile: { eyebrow: 'Build for every screen', outcome: 'Create polished mobile flows with practical app architecture.', audience: 'Mobile builders', includes: ['App screens', 'State patterns', 'Release prep'] },
  default: { eyebrow: 'Career-ready skill path', outcome: 'Practice job-relevant skills through lessons, demos, and projects.', audience: 'Skill builders', includes: ['Guided lessons', 'Hands-on project', 'Certificate prep'] },
};

// ── Real thumbnail sources mapped to course themes ───────────────────────────
// Prefer upstream API thumbnails first. When a course is missing one, fall back
// to a curated set of stable editorial images before ever showing the generic card.
const KEYWORD_THUMBNAILS: Record<string, string> = {
  ...REALISTIC_THUMBNAILS,
};

const CATEGORY_THUMBNAILS: Record<string, string> = {
  frontend: '/course-covers/frontend.svg',
  backend: '/course-covers/backend.svg',
  cloud: '/course-covers/cloud.svg',
  data: '/course-covers/data.svg',
  security: '/course-covers/security.svg',
  design: '/course-covers/design.svg',
  mobile: '/course-covers/mobile.svg',
  default: '/course-covers/default.svg',
};

const PLATFORM_THUMBNAILS: Record<string, string> = {
  udemy: '/course-covers/default.svg',
  coursera: '/course-covers/default.svg',
  edx: '/course-covers/default.svg',
  'linkedin learning': '/course-covers/default.svg',
  pluralsight: '/course-covers/default.svg',
  skillshare: '/course-covers/default.svg',
  'frontend masters': '/course-covers/frontend.svg',
  aws: '/course-covers/cloud.svg',
  meritlives: '/course-covers/default.svg',
};

const ALLOWED_COURSE_IMAGE_HOSTS = new Set([
  'img-c.udemycdn.com',
  'www.udemy.com',
  'd3njjcbhbojbot.cloudfront.net',
  'coursera-course-photos.s3.amazonaws.com',
  'images.unsplash.com',
  'res.cloudinary.com',
  'upload.wikimedia.org',
  'frontendmasters.com',
  'www.vectorlogo.zone',
  'vectorlogo.zone',
  'meritlives.com',
  'skillhub.meritlives.com',
]);

function isUsableImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function isAllowedCourseImageUrl(value: string) {
  if (value.startsWith('/')) return true;

  try {
    const { hostname } = new URL(value);
    return ALLOWED_COURSE_IMAGE_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

function uniqueUrls(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
function getCoursePlatform(course: any) {
  const raw = String(course.platform || course.provider || course.source || '').trim();
  const alias = PLATFORM_ALIASES[raw.toLowerCase()];
  return alias || raw || 'Skillhub';
}

function getCourseAccent(course: any) {
  const platform = getCoursePlatform(course);
  return PLATFORMS[platform] || { color: '#4F8EF7', bg: '#0A1628', logo: '' };
}

function formatDuration(value: unknown) {
  if (!value) return '';
  const text = String(value).trim();
  return /h|hour|min/i.test(text) ? text : `${text}h`;
}

function getLandingCopy(course: any) {
  const key = String(course.category || '').toLowerCase();
  return CATEGORY_LANDING_COPY[key] || CATEGORY_LANDING_COPY.default;
}

function getLearnerCount(course: any) {
  const value = course.students ?? course.enrollCount ?? course.enrollmentCount ?? course.learners;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number.toLocaleString() : null;
}

function getThumbnailCandidates(course: any): string[] {
  const directCandidates = [
    course.thumbnail,
    course.image,
    course.imageUrl,
    course.thumbnailUrl,
    course.coverImage,
    course.bannerImage,
  ].filter(isUsableImageUrl).filter(isAllowedCourseImageUrl);

  const haystack = [course.title, course.category, course.description, course.platform, course.provider, course.source]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const keywordMatches = Object.entries(KEYWORD_THUMBNAILS)
    .filter(([keyword]) => haystack.includes(keyword))
    .map(([, url]) => url);

  const categoryKey = String(course.category || '').toLowerCase();
  const platformKey = String(getCoursePlatform(course)).toLowerCase();

  return uniqueUrls([
    ...directCandidates,
    ...keywordMatches,
    CATEGORY_THUMBNAILS[categoryKey],
    PLATFORM_THUMBNAILS[platformKey],
    CATEGORY_THUMBNAILS.default,
  ]);
}

// ── Category / filter config ─────────────────────────────────────────────────
const CATEGORIES = ['All', 'Frontend', 'Backend', 'Cloud', 'Data', 'Security', 'Design', 'Mobile'];
const LEVELS     = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = ['Recommended', 'Most Popular', 'Highest Rated', 'Newest'];

// ── Star rating ───────────────────────────────────────────────────────────
function Stars({ rating, count }: { rating: number; count?: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i}
            className={`fas fa-star text-[10px] ${i < full ? '' : i === full && half ? 'fa-star-half-alt' : 'far fa-star'}`}
            style={{ color: i < full || (i === full && half) ? '#F59E0B' : 'rgba(255,255,255,0.2)' }}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold" style={{ color: '#F59E0B' }}>{rating.toFixed(1)}</span>
      {count && <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>({count.toLocaleString()})</span>}
    </div>
  );
}

// ── Platform logo badge ──────────────────────────────────────────────────────
function PlatformBadge({ platform }: { platform: string }) {
  const cfg = PLATFORMS[platform];
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
      {cfg && !imgErr ? (
        <img src={cfg.logo} alt={platform} onError={() => setImgErr(true)}
          style={{ width: 14, height: 14, objectFit: 'contain', filter: platform === 'Udemy' ? 'brightness(0) invert(1)' : 'none' }} />
      ) : (
        <div className="w-3 h-3 rounded-sm text-[8px] font-black text-white flex items-center justify-center"
          style={{ background: cfg?.color || '#4F8EF7' }}>
          {String(platform || '?').slice(0, 1)}
        </div>
      )}
      <span className="text-[10px] font-semibold text-white">{platform}</span>
    </div>
  );
}

// ── Course thumbnail with real image ─────────────────────────────────────────
function CourseThumbnail({ course }: { course: any }) {
  const [loaded, setLoaded]   = useState(false);
  const [error, setError]     = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = getThumbnailCandidates(course);
  const src = sources[sourceIndex];
  const platform = getCoursePlatform(course);
  const cfg = getCourseAccent(course);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setSourceIndex(0);
  }, [course.id, course.title, course.thumbnail, course.image, course.imageUrl]);

  return (
    <div className="relative overflow-hidden" style={{ paddingTop: '56.25%' /* 16:9 */ }}>
      {/* Skeleton shimmer while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse"
          style={{ background: `linear-gradient(135deg, ${cfg.bg} 0%, #1a1a2e 100%)` }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-book-open text-3xl opacity-20" style={{ color: cfg.color }} />
          </div>
        </div>
      )}

      {/* Real thumbnail image */}
      {!error && src && (
        <Image
          src={src}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (sourceIndex < sources.length - 1) {
              setLoaded(false);
              setSourceIndex(prev => prev + 1);
              return;
            }

            setError(true);
            setLoaded(true);
          }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease, transform 0.5s ease' }}
          unoptimized={src.startsWith('/')} 
        />
      )}

      {/* Fallback when image fails */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${cfg.bg} 0%, #1a1a2e 100%)` }}>
          <div className="text-center">
            <i className="fas fa-book-open text-4xl mb-2 block" style={{ color: cfg.color }} />
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {course.category || 'Course'}
            </span>
          </div>
        </div>
      )}

      {/* Gradient overlay at bottom for text legibility */}
      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }} />

      {/* Platform badge */}
      <PlatformBadge platform={platform} />

      {/* Badges: Bestseller / Top Rated / New */}
      {course.isBestseller && (
        <div className="absolute top-2.5 right-2.5 z-20 text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: '#F59E0B', color: '#1A0A00' }}>
          Bestseller
        </div>
      )}
      {course.isNew && !course.isBestseller && (
        <div className="absolute top-2.5 right-2.5 z-20 text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: '#00E5A0', color: '#001A10' }}>
          New
        </div>
      )}
      {course.isTopRated && !course.isBestseller && !course.isNew && (
        <div className="absolute top-2.5 right-2.5 z-20 text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: '#4F8EF7', color: '#001040' }}>
          Top Rated
        </div>
      )}

      {/* Duration bottom-right */}
      {course.duration && (
        <div className="absolute bottom-2 right-2.5 z-20 text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}>
          <i className="fas fa-clock mr-1 text-[9px]" />
          {formatDuration(course.duration)}
        </div>
      )}
    </div>
  );
}

// ── Course card ──────────────────────────────────────────────────────────
function CourseCard({ course, onEnroll, enrolling }: {
  course: any;
  onEnroll: (id: string) => void;
  enrolling: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const platform = getCoursePlatform(course);
  const cfg = getCourseAccent(course);
  const isEnrolled = course.enrolled || course.isEnrolled;
  const copy = getLandingCopy(course);
  const learnerCount = getLearnerCount(course);
  const instructorName = typeof course.instructor === 'string'
    ? course.instructor
    : (course.instructor?.name || course.instructor?.fullName || `${platform} instructors`);
  const price = course.price ? String(course.price) : (course.isPremium ? 'Pro' : 'Free preview');

  return (
    <div
      className="group overflow-hidden flex flex-col cursor-pointer relative"
      style={{
        minHeight: 520,
        background: `linear-gradient(180deg, rgba(12,18,32,0.98), ${cfg.bg} 145%)`,
        border: `1px solid ${hovered ? cfg.color + '66' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 8,
        boxShadow: hovered ? `0 22px 55px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.color}20` : '0 8px 24px rgba(0,0,0,0.28)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CourseThumbnail course={course} />

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] truncate" style={{ color: cfg.color }}>
            {copy.eyebrow}
          </span>
          <span className="text-[10px] font-bold px-2 py-1 shrink-0" style={{ borderRadius: 6, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.62)' }}>
            {price}
          </span>
        </div>

        <h3 className="font-jakarta font-extrabold text-[18px] leading-tight text-white tracking-normal" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course.title}
        </h3>

        <p className="text-[12.5px] leading-relaxed min-h-[54px]" style={{ color: 'rgba(255,255,255,0.55)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course.description || copy.outcome}
        </p>

        <div className="grid grid-cols-3 gap-2">
          <div className="px-2 py-2" style={{ borderRadius: 7, background: 'rgba(255,255,255,0.055)' }}>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.36)' }}>Level</div>
            <div className="text-[11px] font-bold text-white/80 truncate">{course.level || 'All levels'}</div>
          </div>
          <div className="px-2 py-2" style={{ borderRadius: 7, background: 'rgba(255,255,255,0.055)' }}>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.36)' }}>Duration</div>
            <div className="text-[11px] font-bold text-white/80 truncate">{formatDuration(course.duration) || 'Self-paced'}</div>
          </div>
          <div className="px-2 py-2" style={{ borderRadius: 7, background: 'rgba(255,255,255,0.055)' }}>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.36)' }}>Learners</div>
            <div className="text-[11px] font-bold text-white/80 truncate">{learnerCount || 'New'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {course.instructorAvatar ? (
            <img src={course.instructorAvatar} alt={instructorName} className="w-7 h-7 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full shrink-0 grid place-items-center text-[10px] font-bold text-white" style={{ background: cfg.color + '55' }}>
              {instructorName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.34)' }}>Instructor team</div>
            <div className="text-[12px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.66)' }}>{instructorName}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.34)' }}>What you get</div>
          <div className="grid gap-1.5">
            {copy.includes.map(item => (
              <div key={item} className="flex items-center gap-2 text-[11.5px]" style={{ color: 'rgba(255,255,255,0.58)' }}>
                <i className="fas fa-check text-[9px]" style={{ color: cfg.color }} />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="min-w-0 shrink-0">
            {course.rating && <Stars rating={parseFloat(course.rating)} count={course.ratingCount} />}
            {!course.rating && <div className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>{copy.audience}</div>}
          </div>
          <button
            onClick={() => onEnroll(course.id)}
            disabled={enrolling || isEnrolled}
            className="flex-1 py-2.5 text-[12px] font-bold border-0 cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-70"
            style={{
              borderRadius: 7,
              background: isEnrolled ? 'rgba(0,229,160,0.12)' : cfg.color,
              color: isEnrolled ? '#00E5A0' : '#fff',
              boxShadow: isEnrolled ? 'none' : `0 5px 16px ${cfg.color}40`,
            }}
          >
            {enrolling ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : isEnrolled ? (
              <><i className="fas fa-check text-[10px]" /> Enrolled</>
            ) : (
              <><i className="fas fa-arrow-up-right-from-square text-[10px]" /> View on {platform.split(' ')[0]}</>
            )}
          </button>
        </div>

        {isEnrolled && course.progress > 0 && (
          <div>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span>Progress</span>
              <span style={{ color: cfg.color }}>{course.progress}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${course.progress}%`, background: cfg.color }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0C1220', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="animate-pulse" style={{ paddingTop: '56.25%', background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-4 w-20 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div className="h-4 w-full rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-8 w-full rounded-xl animate-pulse mt-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  );
}

// ── Enrolled tab: my courses ──────────────────────────────────────────────────
function EnrolledCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/courses/enrolled')
      .then(r => { if (r.success) setCourses(r.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleEnroll(id: string) {
    setEnrolling(id);
    const course = courses.find(c => c.id === id);
    if (course?.courseUrl) window.open(course.courseUrl, '_blank');
    setEnrolling(null);
  }

  if (loading) return (
    <div className="grid grid-cols-4 gap-4 max-[1300px]:grid-cols-3 max-[960px]:grid-cols-2 max-md:grid-cols-1">
      {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  if (!courses.length) return (
    <div className="py-20 text-center rounded-2xl" style={{ background: '#0F1521', border: '1px dashed rgba(255,255,255,0.08)' }}>
      <i className="fas fa-book-open text-4xl block mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
      <p className="text-[15px] font-medium text-white/60 mb-2">No enrolled courses yet</p>
      <p className="text-[13px] mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>Browse the marketplace and enrol in your first course</p>
    </div>
  );

  return (
    <div className="grid grid-cols-4 gap-4 max-[1300px]:grid-cols-3 max-[960px]:grid-cols-2 max-md:grid-cols-1">
      {courses.map(c => (
        <CourseCard key={c.id} course={{ ...c, enrolled: true }} onEnroll={handleEnroll} enrolling={enrolling === c.id} />
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────
export default function CoursesClient() {
  const [tab, setTab]             = useState<'browse' | 'enrolled'>('browse');
  const [courses, setCourses]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [category, setCategory]   = useState('All');
  const [level, setLevel]         = useState('All Levels');
  const [sort, setSort]           = useState('Recommended');
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const PER_PAGE = 12;

  // Pick up a search term passed from the global top-bar search (?search=…)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search).get('search');
    if (q) { setSearch(q); setSearchInput(q); }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
        ...(category !== 'All' && { category }),
        ...(level !== 'All Levels' && { level }),
        ...(sort !== 'Recommended' && { sort }),
        ...(search && { search }),
      });
      const res = await apiFetch(`/courses?${params}`);
      if (res.success) {
        setCourses(res.data?.courses || res.data || []);
        setTotal(res.data?.total || 0);
      }
    } catch {}
    finally { setLoading(false); }
  }, [page, category, level, sort, search]);

  useEffect(() => { load(); }, [load]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [category, level, sort, search]);

  async function handleEnroll(id: string) {
    setEnrolling(id);
    try {
      const res = await apiFetch(`/courses/${id}/enroll`, { method: 'POST' });
      const course = courses.find(c => c.id === id);
      if (res.success || course?.courseUrl) {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, enrolled: true } : c));
        if (course?.courseUrl) window.open(course.courseUrl, '_blank');
      }
    } catch {}
    finally { setEnrolling(null); }
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <SidebarLayout navItems={navItems} pageTitle="Courses">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden mb-6 p-7"
        style={{ background: 'linear-gradient(135deg, #080C14 0%, #0D1A2E 50%, #080C14 100%)', border: '1px solid rgba(79,142,247,0.15)' }}>
        <div className="absolute pointer-events-none" style={{ top: -60, left: -30, width: 280, height: 280, background: 'radial-gradient(circle, rgba(79,142,247,0.16) 0%, transparent 65%)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: -40, right: 80, width: 200, height: 200, background: 'radial-gradient(circle, rgba(0,229,160,0.1) 0%, transparent 65%)' }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(79,142,247,0.7)' }}>
              Learning Marketplace
            </div>
            <h1 className="font-jakarta font-extrabold text-[2rem] text-white tracking-tight leading-tight mb-2">
              Courses from the World's<br />Best Platforms
            </h1>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {total > 0 ? `${total.toLocaleString()} courses` : 'Thousands of courses'} from Udemy, Coursera, edX, LinkedIn Learning & more
            </p>
          </div>
          {/* Search */}
          <div className="relative w-full max-w-90">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              type="text"
              placeholder="Search courses, skills, topics…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-[13px] font-[inherit] outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.5)'; e.target.style.background = 'rgba(79,142,247,0.07)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full grid place-items-center border-0 cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                <i className="fas fa-times text-[10px]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mb-5">
        {(['browse', 'enrolled'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold border-0 cursor-pointer capitalize transition-all"
            style={{
              background: tab === t ? '#4F8EF7' : 'rgba(255,255,255,0.06)',
              color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)',
              boxShadow: tab === t ? '0 4px 14px rgba(79,142,247,0.35)' : 'none',
            }}>
            {t === 'browse' ? 'Browse Courses' : 'My Courses'}
          </button>
        ))}
      </div>

      {tab === 'enrolled' ? <EnrolledCourses /> : (
        <>
          {/* ── Filters ───────────────────────────────────────── */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {/* Category pills */}
            <div className="flex gap-1.5 flex-wrap flex-1">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-xl text-[12px] font-semibold border-0 cursor-pointer transition-all"
                  style={{
                    background: category === cat ? '#4F8EF7' : 'rgba(255,255,255,0.06)',
                    color: category === cat ? '#fff' : 'rgba(255,255,255,0.45)',
                  }}>
                  {cat}
                </button>
              ))}
            </div>
            {/* Level select */}
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="px-3 py-2 rounded-xl text-[12px] font-[inherit] border-0 outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {LEVELS.map(l => <option key={l} value={l} style={{ background: '#0C1220' }}>{l}</option>)}
            </select>
            {/* Sort select */}
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="px-3 py-2 rounded-xl text-[12px] font-[inherit] border-0 outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {SORT_OPTIONS.map(s => <option key={s} value={s} style={{ background: '#0C1220' }}>{s}</option>)}
            </select>
          </div>

          {/* Results count */}
          {total > 0 && !loading && (
            <div className="text-[12px] mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {total.toLocaleString()} courses found
              {search && <span> for "<span style={{ color: '#4F8EF7' }}>{search}</span>"</span>}
              {category !== 'All' && <span> in <span style={{ color: '#4F8EF7' }}>{category}</span></span>}
            </div>
          )}

          {/* ── Grid ──────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-4 gap-4 max-[1300px]:grid-cols-3 max-[960px]:grid-cols-2 max-md:grid-cols-1">
              {Array.from({ length: PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="py-20 text-center rounded-2xl" style={{ background: '#0F1521', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <i className="fas fa-search text-4xl block mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-[14px] text-white/50 mb-2">No courses found</p>
              <button onClick={() => { setSearch(''); setSearchInput(''); setCategory('All'); setLevel('All Levels'); }}
                className="text-[12px] font-semibold border-0 bg-transparent cursor-pointer" style={{ color: '#4F8EF7' }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 max-[1300px]:grid-cols-3 max-[960px]:grid-cols-2 max-md:grid-cols-1">
              {courses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEnroll={handleEnroll}
                  enrolling={enrolling === course.id}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-9 h-9 rounded-xl grid place-items-center border-0 cursor-pointer disabled:opacity-30 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                <i className="fas fa-chevron-left text-[12px]" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i;
                if (pg > totalPages) return null;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className="w-9 h-9 rounded-xl grid place-items-center border-0 cursor-pointer text-[13px] font-semibold transition-all"
                    style={{
                      background: pg === page ? '#4F8EF7' : 'rgba(255,255,255,0.06)',
                      color: pg === page ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-9 h-9 rounded-xl grid place-items-center border-0 cursor-pointer disabled:opacity-30 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                <i className="fas fa-chevron-right text-[12px]" />
              </button>
            </div>
          )}
        </>
      )}
    </SidebarLayout>
  );
}