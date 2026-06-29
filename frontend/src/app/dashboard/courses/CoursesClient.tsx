'use client';

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

// ── Real thumbnail sources mapped to known course types ──────────────────────
// These use publicly available, real course thumbnail images from Udemy/Coursera
// affiliate APIs. In production these come from the API response directly.
// Here we provide a curated fallback map for demo + real API-sourced thumbnails.
const THUMBNAIL_MAP: Record<string, string> = {
  // AWS / Cloud
  'aws':        'https://img-c.udemycdn.com/course/480x270/362328_91f3_10.jpg',
  'cloud':      'https://img-c.udemycdn.com/course/480x270/3087012_f595_3.jpg',
  'devops':     'https://img-c.udemycdn.com/course/480x270/1667960_f3e4_3.jpg',
  // Frontend
  'react':      'https://img-c.udemycdn.com/course/480x270/1362070_b9a1_2.jpg',
  'typescript': 'https://img-c.udemycdn.com/course/480x270/947098_02ec_3.jpg',
  'javascript': 'https://img-c.udemycdn.com/course/480x270/851712_fc61_6.jpg',
  'nextjs':     'https://img-c.udemycdn.com/course/480x270/3450000_1d64_4.jpg',
  'css':        'https://img-c.udemycdn.com/course/480x270/1430746_2f43_10.jpg',
  'html':       'https://img-c.udemycdn.com/course/480x270/1565838_e54e_16.jpg',
  // Backend
  'node':       'https://img-c.udemycdn.com/course/480x270/1672986_c11e_8.jpg',
  'python':     'https://img-c.udemycdn.com/course/480x270/567828_67d0.jpg',
  'django':     'https://img-c.udemycdn.com/course/480x270/1113822_b37c_6.jpg',
  'api':        'https://img-c.udemycdn.com/course/480x270/3828440_7498.jpg',
  // Data
  'data':       'https://img-c.udemycdn.com/course/480x270/903744_8eb2.jpg',
  'sql':        'https://img-c.udemycdn.com/course/480x270/703122_3b2d_4.jpg',
  'machine learning': 'https://img-c.udemycdn.com/course/480x270/950390_270f_3.jpg',
  'ai':         'https://img-c.udemycdn.com/course/480x270/4382638_4198.jpg',
  // Security
  'security':   'https://img-c.udemycdn.com/course/480x270/1042110_2c5a_5.jpg',
  'ethical':    'https://img-c.udemycdn.com/course/480x270/614988_5f5c_4.jpg',
  // Design
  'ui':         'https://img-c.udemycdn.com/course/480x270/1174948_d3f3_3.jpg',
  'ux':         'https://img-c.udemycdn.com/course/480x270/1174948_d3f3_3.jpg',
  'figma':      'https://img-c.udemycdn.com/course/480x270/2641988_f1e5.jpg',
  // Mobile
  'flutter':    'https://img-c.udemycdn.com/course/480x270/1708340_7108_5.jpg',
  'react native':'https://img-c.udemycdn.com/course/480x270/1436092_2024_4.jpg',
  // Generic fallback per platform
  'default_udemy':    'https://img-c.udemycdn.com/course/480x270/1362070_b9a1_2.jpg',
  'default_coursera': 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera-course-photos.s3.amazonaws.com/bb/4a45401d9a11e0a68f277be11af93f/jhep-logo.png',
  'default':          'https://img-c.udemycdn.com/course/480x270/567828_67d0.jpg',
};

function getThumbnail(course: any): string {
  // 1. Use API-provided thumbnail if available
  if (course.thumbnail && course.thumbnail.startsWith('http')) return course.thumbnail;
  if (course.image && course.image.startsWith('http')) return course.image;
  if (course.imageUrl && course.imageUrl.startsWith('http')) return course.imageUrl;

  // 2. Match by course title keywords
  const title = (course.title || '').toLowerCase();
  for (const [key, url] of Object.entries(THUMBNAIL_MAP)) {
    if (key.startsWith('default')) continue;
    if (title.includes(key)) return url;
  }

  // 3. Platform default
  const platform = (course.platform || course.source || '').toLowerCase();
  if (platform.includes('udemy'))    return THUMBNAIL_MAP['default_udemy'];
  if (platform.includes('coursera')) return THUMBNAIL_MAP['default_coursera'];

  return THUMBNAIL_MAP['default'];
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
  const src = getThumbnail(course);
  const platform = course.platform || course.source || '';
  const cfg = PLATFORMS[platform] || { color: '#4F8EF7', bg: '#0A1628' };

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
      {!error && (
        <img
          src={src}
          alt={course.title}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease, transform 0.5s ease' }}
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
          {course.duration}h
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
  const platform = course.platform || course.source || '';
  const cfg = PLATFORMS[platform] || { color: '#4F8EF7', bg: '#0A1628' };
  const isEnrolled = course.enrolled || course.isEnrolled;

  return (
    <div
      className="group rounded-2xl overflow-hidden flex flex-col cursor-pointer relative"
      style={{
        background: '#0C1220',
        border: `1px solid ${hovered ? cfg.color + '50' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered ? `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.color}25` : '0 4px 16px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <CourseThumbnail course={course} />

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Category + Level pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {course.category && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: cfg.color + '18', color: cfg.color, border: `1px solid ${cfg.color}35` }}>
              {course.category}
            </span>
          )}
          {course.level && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {course.level}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-jakarta font-semibold text-[14px] leading-snug text-white/90 line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course.title}
        </h3>

        {/* Instructor */}
        {course.instructor && (() => {
          const instructorName =
            typeof course.instructor === 'string'
              ? course.instructor
              : (course.instructor?.name || course.instructor?.fullName || '');
          if (!instructorName) return null;
          return (
            <div className="flex items-center gap-2">
              {course.instructorAvatar ? (
                <img src={course.instructorAvatar} alt={instructorName}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full flex-shrink-0 grid place-items-center text-[8px] font-bold text-white"
                  style={{ background: cfg.color + '40' }}>
                  {instructorName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="text-[11.5px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {instructorName}
              </span>
            </div>
          );
        })()}

        {/* Rating */}
        {course.rating && (
          <Stars rating={parseFloat(course.rating)} count={course.ratingCount} />
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {course.duration && (
            <span><i className="fas fa-clock mr-1" />{course.duration}h</span>
          )}
          {course.lectures && (
            <span><i className="fas fa-play-circle mr-1" />{course.lectures} lectures</span>
          )}
          {course.students && (
            <span><i className="fas fa-users mr-1" />{Number(course.students).toLocaleString()}</span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-auto pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {course.price && !isEnrolled && (
            <div className="flex-shrink-0">
              {course.originalPrice && course.originalPrice !== course.price && (
                <div className="text-[10px] line-through" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {course.originalPrice}
                </div>
              )}
              <div className="text-[13px] font-bold text-white">{course.price}</div>
            </div>
          )}
          <button
            onClick={() => onEnroll(course.id)}
            disabled={enrolling || isEnrolled}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-bold border-0 cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
            style={{
              background: isEnrolled
                ? 'rgba(0,229,160,0.12)'
                : `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
              color: isEnrolled ? '#00E5A0' : '#fff',
              boxShadow: isEnrolled ? 'none' : `0 4px 14px ${cfg.color}40`,
            }}
          >
            {enrolling ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : isEnrolled ? (
              <><i className="fas fa-check text-[10px]" /> Enrolled</>
            ) : (
              <><i className="fas fa-external-link-alt text-[10px]" /> Enroll on {platform.split(' ')[0]}</>
            )}
          </button>
        </div>

        {/* Progress bar if enrolled */}
        {isEnrolled && course.progress > 0 && (
          <div>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span>Progress</span>
              <span style={{ color: cfg.color }}>{course.progress}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${course.progress}%`, background: cfg.color }} />
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
          <div className="relative w-full max-w-[360px]">
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