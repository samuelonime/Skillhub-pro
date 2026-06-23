'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch, getCachedUser } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/career-oracle', icon: 'fa-brain', label: 'Career Oracle' },
  { href: '/dashboard/skill-coach', icon: 'fa-heart-pulse', label: 'Skill Coach' },
  { href: '/dashboard/peer-genome', icon: 'fa-users', label: 'Peer Genome' },
  { href: '/dashboard/skill-decay', icon: 'fa-chart-line', label: 'Skill Decay' },
  { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles', label: 'Ghost Recruiter' },
  { href: '/dashboard/community', icon: 'fa-users', label: 'Community' },
  { href: '/dashboard/portfolio', icon: 'fa-layer-group', label: 'Portfolio' },
  { href: '/dashboard/resume', icon: 'fa-file-lines', label: 'Resume' },
  { href: '/dashboard/platforms', icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

/* ── Design tokens ────────────────────────────────────────────────────────── */
const D = {
  card: '#0F1521',
  border: 'rgba(255,255,255,0.07)',
  accent: '#4F8EF7',
  green: '#00E5A0',
  amber: '#F59E0B',
  purple: '#A78BFA',
  red: '#F87171',
  muted: 'rgba(255,255,255,0.35)',
  text: 'rgba(255,255,255,0.85)',
  subtext: 'rgba(255,255,255,0.45)',
  input: 'rgba(255,255,255,0.06)',
};

const COLORS = [D.accent, D.green, D.amber, '#38BDF8', D.red, D.purple, '#ec4899', '#14b8a6'];

const PROVIDER_PLATFORM_MAP: Record<string, string> = {
  udemy: 'udemy',
  coursera: 'coursera',
  'coursera.org': 'coursera',
  edx: 'edx',
  'linkedin learning': 'linkedin',
  skillshare: 'skillshare',
  pluralsight: 'pluralsight',
  alison: 'alison',
  futurelearn: 'futurelearn',
};

const PLATFORM_SEARCH_URL: Record<string, (title: string) => string> = {
  udemy: title => `https://www.udemy.com/courses/search/?q=${encodeURIComponent(title)}`,
  coursera: title => `https://www.coursera.org/search?query=${encodeURIComponent(title)}`,
  edx: title => `https://www.edx.org/search?q=${encodeURIComponent(title)}`,
  linkedin: title => `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(title)}`,
  skillshare: title => `https://www.skillshare.com/search?query=${encodeURIComponent(title)}`,
  pluralsight: title => `https://www.pluralsight.com/search?q=${encodeURIComponent(title)}`,
  alison: title => `https://alison.com/search?query=${encodeURIComponent(title)}`,
  futurelearn: title => `https://www.futurelearn.com/search?q=${encodeURIComponent(title)}`,
};

const PLATFORM_LABELS: Record<string, string> = {
  udemy: 'Udemy',
  coursera: 'Coursera',
  edx: 'edX',
  linkedin: 'LinkedIn Learning',
  skillshare: 'Skillshare',
  pluralsight: 'Pluralsight',
  alison: 'Alison',
  futurelearn: 'FutureLearn',
};

function getPlatformKey(provider: string | undefined) {
  if (!provider) return null;
  const lower = provider.toLowerCase();
  return Object.entries(PROVIDER_PLATFORM_MAP).reduce<string | null>(
    (match, [name, key]) => match || (lower.includes(name) ? key : null),
    null
  );
}

function matchesPlatform(course: any, platform: string) {
  const key = course.platformKey || getPlatformKey(course.provider);
  return String(key || '').toLowerCase() === platform.toLowerCase();
}

function getCoursePlatformUrl(course: any) {
  if (course.externalUrl) return course.externalUrl;
  const key = course.platformKey || getPlatformKey(course.provider);
  if (!key) return null;
  return PLATFORM_SEARCH_URL[key]?.(course.title || course.provider || '') || null;
}

function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'title_asc', label: 'Title: A → Z' },
  { value: 'title_desc', label: 'Title: Z → A' },
  { value: 'progress_desc', label: 'Most Progress' },
  { value: 'coins_desc', label: 'Most Coins' },
];

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

function Skeleton({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-xl animate-pulse`} style={{ background: 'rgba(255,255,255,0.06)' }} />;
}

export default function CoursesClient() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [toast, setToast] = useState('');
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All Levels');
  const [sort, setSort] = useState('default');
  const [platform, setPlatform] = useState('');
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [externalCourses, setExternalCourses] = useState<any[]>([]);

  useEffect(() => {
    const platformParam = searchParams.get('platform');
    const categoryParam = searchParams.get('category');
    const user = getCachedUser();
    if (platformParam) setPlatform(platformParam);
    if (categoryParam) setCategory(categoryParam);
    else if (user?.interestNiche) setCategory(user.interestNiche);
  }, [searchParams?.toString()]);

  async function loadCourses() {
    setLoading(true);
    try {
      const [coursesRes, platformsRes, certsRes] = await Promise.all([
        apiFetch('/courses'),
        apiFetch('/platforms'),
        apiFetch('/platforms/certificates'),
      ]);
      if (coursesRes.success) {
        setCourses(coursesRes.data);
        const cats = ['All', ...Array.from(new Set<string>(coursesRes.data.map((c: any) => c.category).filter(Boolean)))];
        setCategories(cats);
      }
      if (platformsRes.success) setPlatforms(platformsRes.data || []);
      if (certsRes.success) {
        const imported = (certsRes.data || []).map((cert: any) => {
          const provider = cert.platform || cert.issuer || 'External Platform';
          const platformKey = getPlatformKey(provider);
          const connected = platformsRes.success && (platformsRes.data || []).some(
            (p: any) => p.platform?.toLowerCase() === platformKey
          );
          return {
            id: cert.id,
            title: cert.title,
            provider,
            category: cert.skills?.[0] || 'Platform course',
            level: 'External',
            enrolled: true,
            progress: 100,
            external: true,
            externalUrl: cert.credentialUrl || getCoursePlatformUrl({ provider, title: cert.title, platformKey }),
            platform: provider,
            platformKey,
            platformLabel: cert.platform || provider,
            connected: connected || false,
            badge: 'Imported',
            completedAt: cert.completedAt,
          };
        });
        setExternalCourses(imported);
        setCategories(prev => {
          const importedCats = imported.map((c: any) => c.category).filter(Boolean);
          const existing = prev.filter(c => c !== 'All');
          return ['All', ...Array.from(new Set([...existing, ...importedCats]))];
        });
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function enroll(courseId: string, title: string) {
    setEnrolling(courseId);
    try {
      const res = await apiFetch(`/courses/${courseId}/enroll`, { method: 'POST' });
      if (res.success) {
        setToast(`Enrolled in ${title}! +1 Merit Coin`);
        setTimeout(() => setToast(''), 3000);
        loadCourses();
      } else {
        setToast(res.message || 'Enrollment failed');
        setTimeout(() => setToast(''), 3000);
      }
    } catch {
      setToast('Enrollment failed');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setEnrolling(null);
    }
  }

  function openExternalCourse(course: any) {
    const url = getCoursePlatformUrl(course);
    if (!url) {
      setToast('No external course link available');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function openMeritlivesCourse(course: any) {
    if (!course.slug && !course.url) {
      setToast('Course link unavailable');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    // Extract the course slug from course.url if not directly on the object
    // course.url looks like https://digitalskills.meritlives.com/courses/{slug}
    const slug = course.slug || course.url?.split('/courses/')?.[1]?.split('?')?.[0];
    if (!slug) {
      window.open(course.url, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      const res = await apiFetch('/sso/meritlives', {
        method: 'POST',
        body: JSON.stringify({ courseSlug: slug }),
      });
      // FIXED: Use res.data?.url instead of res.url
      if (res.success && res.data?.url) {
        window.open(res.data.url, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback: open course page directly (student may need to log in manually)
        window.open(course.url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(course.url, '_blank', 'noopener,noreferrer');
    }
  }

  function handleCourseAction(course: any) {
    if (course.source === 'meritlives') {
      if (course.enrolled) {
        openMeritlivesCourse(course);
      } else {
        enroll(course.id, course.title);
      }
      return;
    }
    if (course.enrolled || course.external || course.connected || course.platformKey) {
      openExternalCourse(course);
      return;
    }
    enroll(course.id, course.title);
  }

  function clearFilters() {
    setSearch('');
    setFilter('all');
    setCategory('All');
    setLevel('All Levels');
    setSort('default');
  }

  const hasActiveFilters = search || filter !== 'all' || category !== 'All' || level !== 'All Levels' || sort !== 'default';

  const visible = useMemo(() => {
    const merged = [...courses, ...externalCourses];
    let result = merged.filter(c => {
      if (filter === 'enrolled' && !c.enrolled) return false;
      if (filter === 'available' && c.enrolled) return false;
      if (platform && !matchesPlatform(c, platform)) return false;
      if (category !== 'All' && c.category !== category) return false;
      if (level !== 'All Levels' && c.level !== level) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!c.title?.toLowerCase().includes(q) &&
            !c.category?.toLowerCase().includes(q) &&
            !c.level?.toLowerCase().includes(q) &&
            !c.provider?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
    if (sort === 'title_asc') result = [...result].sort((a, b) => a.title?.localeCompare(b.title));
    else if (sort === 'title_desc') result = [...result].sort((a, b) => b.title?.localeCompare(a.title));
    else if (sort === 'progress_desc') result = [...result].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
    else if (sort === 'coins_desc') result = [...result].sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0));
    return result;
  }, [courses, externalCourses, filter, category, level, search, sort, platform]);

  const platformLabel = platform
    ? PLATFORM_LABELS[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)
    : '';

  const selectStyle = {
    background: D.input,
    border: `1px solid ${D.border}`,
    color: D.text,
    appearance: 'none' as const,
  };

  return (
    <SidebarLayout navItems={navItems} pageTitle="Courses">
      <div style={{ color: D.text }}>
        {toast && (
          <div
            className="fixed top-5 right-5 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2"
            style={{ background: '#0D1525', border: `1px solid ${D.green}40` }}
          >
            <i className="fas fa-check-circle" style={{ color: D.green }} />
            {toast}
          </div>
        )}

        {/* Hero banner */}
        <div
          className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #0A1628 100%)',
            border: `1px solid ${D.green}25`,
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              top: -80,
              left: -60,
              width: 320,
              height: 320,
              background: `radial-gradient(circle, ${D.green}15 0%, transparent 65%)`,
              borderRadius: '50%',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: -60,
              right: 80,
              width: 220,
              height: 220,
              background: `radial-gradient(circle, ${D.accent}10 0%, transparent 65%)`,
              borderRadius: '50%',
            }}
          />
          <div className="relative z-10">
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: D.green + 'cc' }}>
              Learning Hub
            </div>
            <h1 className="font-jakarta font-bold text-[2rem] text-white leading-tight mb-1">My Courses</h1>
            <p className="text-[13px]" style={{ color: D.subtext }}>
              Continue learning and earn Merit Coins for every module completed.
            </p>
          </div>
        </div>

        {platform && (
          <div
            className="rounded-2xl px-4 py-3 mb-4 text-sm flex items-center gap-2"
            style={{ background: D.accent + '15', border: `1px solid ${D.accent}30`, color: D.text }}
          >
            <i className="fas fa-filter text-[11px]" style={{ color: D.accent }} />
            Showing <strong style={{ color: D.accent }}>{platformLabel}</strong> courses
            {category !== 'All' ? ` for ${category}` : ''}.
            <button
              onClick={() => setPlatform('')}
              className="ml-auto text-[11px] border-0 bg-transparent cursor-pointer hover:opacity-70 transition-all"
              style={{ color: D.muted }}
            >
              Clear ×
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <i
              className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
              style={{ color: D.muted }}
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm font-[inherit] outline-none transition-all"
              style={{ background: D.input, border: `1px solid ${D.border}`, color: D.text }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 cursor-pointer hover:opacity-70 transition-all"
                style={{ color: D.muted }}
              >
                <i className="fas fa-times text-xs" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="pl-3.5 pr-8 py-2.5 rounded-xl text-sm font-medium font-[inherit] outline-none cursor-pointer transition-all"
              style={{
                ...selectStyle,
                color: level !== 'All Levels' ? D.accent : D.text,
                borderColor: level !== 'All Levels' ? D.accent : D.border,
              }}
            >
              {LEVELS.map(l => (
                <option key={l} value={l} style={{ background: '#0D1525', color: D.text }}>
                  {l}
                </option>
              ))}
            </select>
            <i
              className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none"
              style={{ color: D.muted }}
            />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="pl-3.5 pr-8 py-2.5 rounded-xl text-sm font-medium font-[inherit] outline-none cursor-pointer transition-all"
              style={{
                ...selectStyle,
                color: sort !== 'default' ? D.accent : D.text,
                borderColor: sort !== 'default' ? D.accent : D.border,
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} style={{ background: '#0D1525', color: D.text }}>
                  {o.label}
                </option>
              ))}
            </select>
            <i
              className="fas fa-arrow-up-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none"
              style={{ color: D.muted }}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all"
              style={{ border: `1px solid ${D.red}40`, color: D.red, background: D.red + '10' }}
            >
              <i className="fas fa-times text-xs" />
              Clear
            </button>
          )}
        </div>

        {/* Filter tabs + categories */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: D.input, border: `1px solid ${D.border}` }}>
            {(['all', 'enrolled', 'available'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer capitalize transition-all border-0"
                style={{
                  background: filter === f ? D.accent : 'transparent',
                  color: filter === f ? 'white' : D.muted,
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: category === c ? D.accent : D.input,
                  color: category === c ? 'white' : D.muted,
                  border: `1px solid ${category === c ? D.accent : D.border}`,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {!loading && (
          <p className="text-[12.5px] mb-4" style={{ color: D.muted }}>
            {visible.length} course{visible.length !== 1 ? 's' : ''} found
            {hasActiveFilters && <span className="ml-1">— filters active</span>}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: D.accent + '30', borderTopColor: D.accent }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-md:grid-cols-1">
            {visible.map((course: any) => {
              const color = colorFor(course.id);
              return (
                <div
                  key={`${course.source || 'local'}-${course.id}`}
                  className="rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-200"
                  style={{ background: D.card, border: `1px solid ${D.border}` }}
                >
                  {/* Card header / thumbnail */}
                  <div
                    className="h-28 relative flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${color}20, ${color}35)` }}
                  >
                    <i className="fas fa-book-open text-4xl" style={{ color }} />
                    {course.badge && (
                      <span
                        className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: color }}
                      >
                        {course.badge}
                      </span>
                    )}
                    {course.enrolled && course.progress > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1.5"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                      >
                        <div
                          className="h-full transition-all"
                          style={{ width: `${course.progress}%`, background: color }}
                        />
                      </div>
                    )}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `radial-gradient(circle at 50% 50%, ${color}15 0%, transparent 70%)` }}
                    />
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {course.category && (
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: color + '18', color }}
                        >
                          {course.category}
                        </span>
                      )}
                      {course.level && <span className="text-[11px]" style={{ color: D.muted }}>{course.level}</span>}
                    </div>

                    <h3 className="font-jakarta font-bold text-[15px] tracking-tight mb-1 leading-tight text-white">
                      {course.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: D.subtext }}>
                      {course.provider && (
                        <span>
                          <i className="fas fa-building mr-1" style={{ color: D.muted }} />
                          {course.provider}
                        </span>
                      )}
                      {course.modules && (
                        <span>
                          <i className="fas fa-layer-group mr-1" style={{ color: D.muted }} />
                          {course.modules} modules
                        </span>
                      )}
                      {course.duration && (
                        <span>
                          <i className="fas fa-clock mr-1" style={{ color: D.muted }} />
                          {course.duration}
                        </span>
                      )}
                    </div>

                    {course.enrolled && course.progress > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span style={{ color: D.muted }}>Progress</span>
                          <span className="font-semibold" style={{ color }}>
                            {course.progress}%
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden mb-3"
                          style={{ background: 'rgba(255,255,255,0.08)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${course.progress}%`, background: color }}
                          />
                        </div>
                        <button
                          onClick={() => handleCourseAction(course)}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer text-white transition-all hover:opacity-90"
                          style={{ background: color }}
                        >
                          {course.source === 'meritlives'
                            ? 'Continue on Meritlives'
                            : course.external || course.connected || course.platformKey
                              ? `Open on ${course.platformLabel || course.provider}`
                              : 'Continue Learning'}
                        </button>
                      </>
                    ) : course.enrolled ? (
                      <button
                        onClick={() => handleCourseAction(course)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer text-white transition-all hover:opacity-90"
                        style={{ background: color }}
                      >
                        {course.source === 'meritlives'
                          ? 'Start on Meritlives'
                          : course.external || course.connected || course.platformKey
                            ? `Open on ${course.platformLabel || course.provider}`
                            : 'Start Learning'}
                      </button>
                    ) : (
                      <>
                        {course.coins && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <i className="fas fa-coins text-xs" style={{ color: D.amber }} />
                            <span className="text-xs font-semibold" style={{ color: D.amber }}>
                              Earn {course.coins} Merit Coins
                            </span>
                          </div>
                        )}
                        <button
                          disabled={enrolling === course.id}
                          onClick={() => handleCourseAction(course)}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-60 hover:text-white"
                          style={{ border: `1px solid ${color}`, color, background: 'transparent' }}
                          onMouseEnter={e => {
                            if (enrolling !== course.id) {
                              (e.target as HTMLButtonElement).style.background = color;
                              (e.target as HTMLButtonElement).style.color = 'white';
                            }
                          }}
                          onMouseLeave={e => {
                            (e.target as HTMLButtonElement).style.background = 'transparent';
                            (e.target as HTMLButtonElement).style.color = color;
                          }}
                        >
                          {course.external || course.connected || course.platformKey
                            ? `Open on ${course.platformLabel || course.provider}`
                            : enrolling === course.id
                              ? 'Enrolling…'
                              : 'Enroll Now'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-4"
              style={{ background: D.green + '18' }}
            >
              <i className="fas fa-book text-3xl" style={{ color: D.green }} />
            </div>
            <h3 className="font-jakarta font-bold text-[16px] text-white mb-1.5">No courses found</h3>
            <p className="text-[13.5px] mb-4" style={{ color: D.subtext }}>
              Try adjusting your filters to see more results.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer text-white transition-all hover:opacity-90"
                style={{ background: D.accent }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}