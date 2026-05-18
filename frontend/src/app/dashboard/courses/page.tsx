'use client';

import { useState } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/portfolio', icon: 'fa-folder', label: 'Portfolio' },
  { href: '/dashboard/skillpaths', icon: 'fa-road', label: 'Skill Paths' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

const COURSES = [
  { id: 1, title: 'React & TypeScript Mastery', category: 'Frontend', level: 'Intermediate', modules: 24, duration: '18h', progress: 65, enrolled: true, color: '#5b4cf5', coins: 500, badge: 'Popular' },
  { id: 2, title: 'Python for Data Science', category: 'Data', level: 'Beginner', modules: 18, duration: '14h', progress: 30, enrolled: true, color: '#10b981', coins: 400 },
  { id: 3, title: 'UI/UX Design Fundamentals', category: 'Design', level: 'Beginner', modules: 12, duration: '9h', progress: 22, enrolled: true, color: '#f59e0b', coins: 300 },
  { id: 4, title: 'Node.js & REST APIs', category: 'Backend', level: 'Intermediate', modules: 20, duration: '16h', progress: 0, enrolled: false, color: '#3b82f6', coins: 450, badge: 'New' },
  { id: 5, title: 'Cloud Computing with AWS', category: 'DevOps', level: 'Advanced', modules: 28, duration: '22h', progress: 0, enrolled: false, color: '#ef4444', coins: 600 },
  { id: 6, title: 'Machine Learning Basics', category: 'Data', level: 'Intermediate', modules: 22, duration: '20h', progress: 0, enrolled: false, color: '#8b5cf6', coins: 550, badge: 'Hot' },
];

const CATEGORIES = ['All', 'Frontend', 'Backend', 'Data', 'Design', 'DevOps'];

export default function CoursesPage() {
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');
  const [category, setCategory] = useState('All');

  const visible = COURSES.filter(c => {
    if (filter === 'enrolled' && !c.enrolled) return false;
    if (filter === 'available' && c.enrolled) return false;
    if (category !== 'All' && c.category !== category) return false;
    return true;
  });

  return (
    <SidebarLayout navItems={navItems} pageTitle="Courses">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">My Courses</h1>
          <p className="text-[13.5px] text-[#6b6b8a]">Continue learning and earn Merit Coins for every module completed.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] hover:-translate-y-px transition-all">
          <i className="fas fa-search" /> Browse All Courses
        </button>
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
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all ${category === c ? 'bg-[#5b4cf5] text-white border-[#5b4cf5]' : 'bg-white text-[#6b6b8a] border-[#e8e8f0] hover:border-[#5b4cf5] hover:text-[#5b4cf5]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-md:grid-cols-1">
        {visible.map(course => (
          <div key={course.id} className="bg-white rounded-2xl border border-[#e8e8f0] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] transition-all">
            {/* Color banner */}
            <div className="h-28 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${course.color}22, ${course.color}44)` }}>
              <i className="fas fa-book-open text-4xl" style={{ color: course.color }} />
              {course.badge && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: course.color }}>{course.badge}</span>
              )}
              {course.enrolled && course.progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30">
                  <div className="h-full transition-all" style={{ width: `${course.progress}%`, background: course.color }} />
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: course.color + '18', color: course.color }}>{course.category}</span>
                <span className="text-[11px] text-[#6b6b8a]">{course.level}</span>
              </div>
              <h3 className="font-syne font-bold text-[15px] tracking-tight mb-1 leading-tight">{course.title}</h3>
              <div className="flex items-center gap-3 text-xs text-[#6b6b8a] mb-3">
                <span><i className="fas fa-layer-group mr-1" />{course.modules} modules</span>
                <span><i className="fas fa-clock mr-1" />{course.duration}</span>
              </div>

              {course.enrolled && course.progress > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#6b6b8a]">Progress</span>
                    <span className="font-semibold" style={{ color: course.color }}>{course.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full" style={{ width: `${course.progress}%`, background: course.color }} />
                  </div>
                  <button className="w-full py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer text-white transition-all hover:-translate-y-px" style={{ background: course.color }}>
                    Continue Learning
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-3">
                    <i className="fas fa-coins text-[#f59e0b] text-xs" />
                    <span className="text-xs font-semibold text-[#f59e0b]">Earn {course.coins} Merit Coins</span>
                  </div>
                  <button className="w-full py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all hover:text-white" style={{ borderColor: course.color, color: course.color, background: 'transparent' }}
                    onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = course.color; (e.target as HTMLButtonElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = course.color; }}>
                    Enroll Now
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16">
          <i className="fas fa-book text-[38px] text-[#9898b8] block mb-3" />
          <h3 className="font-syne font-bold text-[16px] text-[#2d2d42] mb-1.5">No courses found</h3>
          <p className="text-[13.5px] text-[#6b6b8a]">Try adjusting your filters to see more results.</p>
        </div>
      )}
    </SidebarLayout>
  );
}
