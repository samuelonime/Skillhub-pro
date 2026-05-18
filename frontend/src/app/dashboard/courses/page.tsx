'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

const COLORS = ['#5b4cf5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [toast, setToast] = useState('');

  async function loadCourses() {
    setLoading(true);
    try {
      const res = await apiFetch('/courses');
      if (res.success) {
        setCourses(res.data);
        const cats = ['All', ...Array.from(new Set<string>(res.data.map((c: any) => c.category).filter(Boolean)))];
        setCategories(cats);
      }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { loadCourses(); }, []);

  async function enroll(courseId: string, title: string) {
    setEnrolling(courseId);
    try {
      const res = await apiFetch(`/courses/${courseId}/enroll`, { method: 'POST' });
      if (res.success) {
        setToast(`Enrolled in ${title}! +10 Merit Coins`);
        setTimeout(() => setToast(''), 3000);
        loadCourses();
      } else {
        setToast(res.message || 'Enrollment failed');
        setTimeout(() => setToast(''), 3000);
      }
    } catch { setToast('Enrollment failed'); setTimeout(() => setToast(''), 3000); }
    finally { setEnrolling(null); }
  }

  const visible = courses.filter(c => {
    if (filter === 'enrolled' && !c.enrolled) return false;
    if (filter === 'available' && c.enrolled) return false;
    if (category !== 'All' && c.category !== category) return false;
    return true;
  });

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

      {/* Filters */}
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
                      <button className="w-full py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer text-white transition-all hover:-translate-y-px" style={{ background: color }}>
                        Continue Learning
                      </button>
                    </>
                  ) : course.enrolled ? (
                    <button className="w-full py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer text-white transition-all" style={{ background: color }}>
                      Start Learning
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
                        onClick={() => enroll(course.id, course.title)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all hover:text-white disabled:opacity-60"
                        style={{ borderColor: color, color, background: 'transparent' }}
                        onMouseEnter={e => { if (enrolling !== course.id) { (e.target as HTMLButtonElement).style.background = color; (e.target as HTMLButtonElement).style.color = 'white'; } }}
                        onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = color; }}
                      >
                        {enrolling === course.id ? 'Enrolling…' : 'Enroll Now'}
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
          <p className="text-[13.5px] text-[#6b6b8a]">Try adjusting your filters to see more results.</p>
        </div>
      )}
    </SidebarLayout>
  );
}
