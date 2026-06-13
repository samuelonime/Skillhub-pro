'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch, getCachedUser } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/career-oracle',   icon: 'fa-brain',               label: 'Career Oracle' },
  { href: '/dashboard/skill-coach',     icon: 'fa-heart-pulse',         label: 'Skill Coach' },
  { href: '/dashboard/peer-genome',     icon: 'fa-users',               label: 'Peer Genome' },
  { href: '/dashboard/skill-decay',     icon: 'fa-chart-line',          label: 'Skill Decay' },
  { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles', label: 'Ghost Recruiter' },
  { href: '/dashboard/community', icon: 'fa-users', label: 'Community' },
  { href: '/dashboard/portfolio', icon: 'fa-layer-group', label: 'Portfolio' },
  { href: '/dashboard/platforms', icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

const COLORS = ['#5b4cf5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

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

function getPlatformKey(provider: string | undefined) {
  if (!provider) return null;
  const lower = provider.toLowerCase();
  return Object.entries(PROVIDER_PLATFORM_MAP).reduce<string | null>((match, [name, key]) => {
    return match || (lower.includes(name) ? key : null);
  }, null);
}

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

      if (platformsRes.success) {
        setPlatforms(platformsRes.data || []);
      }

      if (certsRes.success) {
        const imported = (certsRes.data || []).map((cert: any) => {
          const provider = cert.platform || cert.issuer || 'External Platform';
          const platformKey = getPlatformKey(provider);
          const connected = platformsRes.success && (platformsRes.data || []).some((p: any) => p.platform?.toLowerCase() === platformKey);
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
          const importedCats = imported.map((course: any) => course.category).filter(Boolean);
          return ['All', ...Array.from(new Set([...prev, ...importedCats]))];
        });
      }
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { loadCourses(); }, []);

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
    } finally { setEnrolling(null); }
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

  function handleCourseAction(course: any) {
    if (course.enrolled || course.external || course.connected) {
      openExternalCourse(course);
      return;
    }
    if (course.platformKey) {
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
        if (
          !c.title?.toLowerCase().includes(q) &&
          !c.category?.toLowerCase().includes(q) &&
          !c.level?.toLowerCase().includes(q) &&
          !c.provider?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });

    if (sort === 'title_asc') result = [...result].sort((a, b) => a.title?.localeCompare(b.title));
    else if (sort === 'title_desc') result = [...result].sort((a, b) => b.title?.localeCompare(a.title));
    else if (sort === 'progress_desc') result = [...result].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
    else if (sort === 'coins_desc') result = [...result].sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0));

    return result;
  }, [courses, externalCourses, filter, category, level, search, sort, platform]);

  const platformLabel = platform ? PLATFORM_LABELS[platform] || platform.charAt(0).toUpperCase() + platform.slice(1) : '';

  return (
    <SidebarLayout navItems={navItems} pageTitle="Courses">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0a0a0f] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">My Courses</h1>
          <p className="text-[13.5px] text-[#6b6b8a]">Continue learning and earn Merit Coins for every module completed.</p>
        </div>
      </div>

      {platform && (
        <div className="rounded-2xl bg-[#f8fbff] border border-[#dbeafe] p-4 mb-4 text-sm text-[#3730a3]">
          Showing <strong>{platformLabel}</strong> courses{category !== 'All' ? ` for ${category}` : ''}.
        </div>
      )}

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-xs pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#e8e8f0] bg-white text-sm text-[#0a0a0f] placeholder-[#9898b8] focus:outline-none focus:border-[#5b4cf5] focus:ring-1 focus:ring-[#5b4cf5]/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898b8] hover:text-[#0a0a0f] cursor-pointer border-0 bg-transparent p-0 leading-none"
            >
              <i className="fas fa-times text-xs" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#e8e8f0] bg-white text-sm font-medium text-[#0a0a0f] focus:outline-none focus:border-[#5b4cf5] cursor-pointer transition-all"
            style={{ color: level !== 'All Levels' ? '#5b4cf5' : undefined, borderColor: level !== 'All Levels' ? '#5b4cf5' : undefined }}
          >
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[#9898b8] text-[10px] pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#e8e8f0] bg-white text-sm font-medium text-[#0a0a0f] focus:outline-none focus:border-[#5b4cf5] cursor-pointer transition-all"
            style={{ color: sort !== 'default' ? '#5b4cf5' : undefined, borderColor: sort !== 'default' ? '#5b4cf5' : undefined }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <i className="fas fa-arrow-up-down absolute right-3 top-1/2 -translate-y-1/2 text-[#9898b8] text-[10px] pointer-events-none" />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#ef4444] border border-[#ef4444]/30 bg-[#ef4444]/5 hover:bg-[#ef4444]/10 cursor-pointer transition-all border-0"
            style={{ border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <i className="fas fa-times text-xs" />
            Clear
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl border border-[#e8e8f0]">
          {(['all', 'enrolled', 'available'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-[9px] text-sm font-medium font-[inherit] cursor-pointer capitalize transition-all border-0 ${filter === f ? 'bg-white text-[#0a0a0f] font-semibold shadow-[0_1px_5px_rgba(0,0,0,0.09)]' : 'bg-transparent text-[#6b6b8a]'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all ${category === c ? 'bg-[#5b4cf5] text-white border-[#5b4cf5]' : 'bg-white text-[#6b6b8a] border-[#e8e8f0] hover:border-[#5b4cf5] hover:text-[#5b4cf5]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <p className="text-[12.5px] text-[#9898b8] mb-4">
          {visible.length} course{visible.length !== 1 ? 's' : ''} found
          {hasActiveFilters && <span className="ml-1">— filters active</span>}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#5b4cf5]/30 border-t-[#5b4cf5] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-md:grid-cols-1">
          {visible.map((course: any) => {
            const color = colorFor(course.id);
            return (
              <div key={course.id} className="bg-white rounded-2xl border border-[#e8e8f0] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] transition-all">
                <div className="h-28 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}>
                  <i className="fas fa-book-open text-4xl" style={{ color }} />
                  {course.badge && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>{course.badge}</span>
                  )}
                  {course.enrolled && course.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30">
                      <div className="h-full transition-all" style={{ width: `${course.progress}%`, background: color }} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {course.category && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: color + '18', color }}>{course.category}</span>}
                    {course.level && <span className="text-[11px] text-[#6b6b8a]">{course.level}</span>}
                  </div>
                  <h3 className="font-syne font-bold text-[15px] tracking-tight mb-1 leading-tight">{course.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#6b6b8a] mb-3">
                    {course.provider && <span><i className="fas fa-building mr-1" />{course.provider}</span>}
                    {course.modules && <span><i className="fas fa-layer-group mr-1" />{course.modules} modules</span>}
                    {course.duration && <span><i className="fas fa-clock mr-1" />{course.duration}</span>}
                  </div>

                  {course.enrolled && course.progress > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[#6b6b8a]">Progress</span>
                        <span className="font-semibold" style={{ color }}>{course.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden mb-3">
                        <div className="h-full rounded-full" style={{ width: `${course.progress}%`, background: color }} />
                      </div>
                      <button
                        onClick={() => handleCourseAction(course)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer text-white transition-all hover:-translate-y-px"
                        style={{ background: color }}
                      >
                        {course.external || course.connected || course.platformKey
                          ? `Open on ${course.platformLabel || course.provider}`
                          : 'Continue Learning'}
                      </button>
                    </>
                  ) : course.enrolled ? (
                    <button
                      onClick={() => handleCourseAction(course)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer text-white transition-all"
                      style={{ background: color }}
                    >
                      {course.external || course.connected || course.platformKey
                        ? `Open on ${course.platformLabel || course.provider}`
                        : 'Start Learning'}
                    </button>
                  ) : (
                    <>
                      {course.coins && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <i className="fas fa-coins text-[#f59e0b] text-xs" />
                          <span className="text-xs font-semibold text-[#f59e0b]">Earn {course.coins} Merit Coins</span>
                        </div>
                      )}
                      <button
                        disabled={enrolling === course.id}
                        onClick={() => handleCourseAction(course)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all hover:text-white disabled:opacity-60"
                        style={{ borderColor: color, color, background: 'transparent' }}
                        onMouseEnter={e => { if (enrolling !== course.id) { (e.target as HTMLButtonElement).style.background = color; (e.target as HTMLButtonElement).style.color = 'white'; } }}
                        onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = color; }}
                      >
                        {course.external || course.connected || course.platformKey
                          ? `Open on ${course.platformLabel || course.provider}`
                          : enrolling === course.id ? 'Enrolling…' : 'Enroll Now'}
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
          <i className="fas fa-book text-[38px] text-[#9898b8] block mb-3" />
          <h3 className="font-syne font-bold text-[16px] text-[#2d2d42] mb-1.5">No courses found</h3>
          <p className="text-[13.5px] text-[#6b6b8a] mb-4">Try adjusting your filters to see more results.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#5b4cf5] border-0 cursor-pointer hover:-translate-y-px transition-all shadow-[0_4px_14px_rgba(91,76,245,0.35)]"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}
