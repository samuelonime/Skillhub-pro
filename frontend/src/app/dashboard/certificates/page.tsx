'use client';

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

const CERTS = [
  { id: 1, title: 'React Fundamentals', issuer: 'SkillHub', date: 'Apr 2025', credential: 'SH-2025-RF-001', color: '#5b4cf5', icon: 'fa-code', verified: true },
  { id: 2, title: 'JavaScript ES6+', issuer: 'SkillHub', date: 'Mar 2025', credential: 'SH-2025-JS-082', color: '#f59e0b', icon: 'fa-js', verified: true },
  { id: 3, title: 'CSS & Responsive Design', issuer: 'SkillHub', date: 'Feb 2025', credential: 'SH-2025-CSS-054', color: '#10b981', icon: 'fa-paint-brush', verified: true },
];

const UPCOMING = [
  { title: 'React & TypeScript Mastery', progress: 65, color: '#5b4cf5' },
  { title: 'Python for Data Science', progress: 30, color: '#10b981' },
];

export default function CertificatesPage() {
  return (
    <SidebarLayout navItems={navItems} pageTitle="Certificates">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">My Certificates</h1>
          <p className="text-[13.5px] text-[#6b6b8a]">All your verified certificates in one place — shareable and blockchain-backed.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] hover:-translate-y-px transition-all">
          <i className="fas fa-upload" /> Upload Certificate
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 max-md:grid-cols-1">
        {[
          { icon: 'fa-certificate', bg: '#f4f2ff', color: '#5b4cf5', val: '3', label: 'Earned Certificates' },
          { icon: 'fa-shield-alt', bg: '#f0fdf4', color: '#22c55e', val: '3', label: 'Verified by SkillHub' },
          { icon: 'fa-share-alt', bg: '#fffbeb', color: '#f59e0b', val: '7', label: 'Times Shared' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#e8e8f0] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl grid place-items-center text-[17px] flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div>
              <div className="font-syne font-bold text-[22px]">{s.val}</div>
              <div className="text-xs text-[#6b6b8a]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 max-[1100px]:grid-cols-1">
        {/* Certificates */}
        <div>
          <h2 className="font-syne font-bold text-[15px] mb-4">Earned Certificates</h2>
          <div className="flex flex-col gap-4">
            {CERTS.map(cert => (
              <div key={cert.id} className="bg-white rounded-2xl border border-[#e8e8f0] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all">
                <div className="h-2" style={{ background: cert.color }} />
                <div className="p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl grid place-items-center text-2xl flex-shrink-0" style={{ background: cert.color + '18', color: cert.color }}>
                    <i className={`fas ${cert.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-syne font-bold text-[15px] tracking-tight">{cert.title}</h3>
                      {cert.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#15803d]">
                          <i className="fas fa-check-circle" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b6b8a] mb-1">{cert.issuer} · Issued {cert.date}</p>
                    <p className="text-[11px] font-mono text-[#9898b8]">ID: {cert.credential}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button className="px-3.5 py-2 text-xs font-semibold text-[#5b4cf5] bg-[#f4f2ff] rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">
                      <i className="fas fa-download mr-1" /> Download
                    </button>
                    <button className="px-3.5 py-2 text-xs font-semibold text-[#6b6b8a] bg-[#f5f5fb] border border-[#e8e8f0] rounded-lg cursor-pointer hover:border-[#5b4cf5] hover:text-[#5b4cf5] transition-all">
                      <i className="fas fa-share-alt mr-1" /> Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: upcoming + tips */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
            <h2 className="font-syne font-bold text-[15px] mb-4">Upcoming Certificates</h2>
            {UPCOMING.map(u => (
              <div key={u.title} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[#0a0a0f] leading-tight pr-2">{u.title}</span>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: u.color }}>{u.progress}%</span>
                </div>
                <div className="h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${u.progress}%`, background: u.color }} />
                </div>
                <p className="text-[11px] text-[#9898b8] mt-1">{100 - u.progress}% left to earn certificate</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
            <h2 className="font-syne font-bold text-[15px] mb-3">Share Your Achievements</h2>
            <p className="text-[13px] text-[#6b6b8a] leading-relaxed mb-4">Share your verified certificates directly to LinkedIn, Twitter, or generate a shareable link for job applications.</p>
            <div className="flex flex-col gap-2">
              {[
                { icon: 'fa-linkedin', label: 'Add to LinkedIn', bg: '#eff6ff', color: '#1d4ed8' },
                { icon: 'fa-twitter', label: 'Share on Twitter', bg: '#f0fdf4', color: '#15803d' },
                { icon: 'fa-link', label: 'Copy Share Link', bg: '#f5f5fb', color: '#6b6b8a' },
              ].map(btn => (
                <button key={btn.label} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all text-left" style={{ background: btn.bg, color: btn.color }}>
                  <i className={`fab ${btn.icon}`} /> {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
