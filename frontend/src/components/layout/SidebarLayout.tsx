'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  pageTitle: string;
}

export function SidebarLayout({ children, navItems, pageTitle }: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function logout() {
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_refresh');
    localStorage.removeItem('sh_user');
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5fb]">
      {/* Backdrop */}
      {mobileOpen && <div className="fixed inset-0 bg-[#0a0a0f]/52 backdrop-blur-sm z-[99] md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`w-[252px] min-h-screen bg-[#0a0a0f] flex flex-col fixed top-0 left-0 z-[100] transition-transform duration-[0.28s] max-md:-translate-x-full ${mobileOpen ? 'translate-x-0' : ''}`} style={{ boxShadow: mobileOpen ? '8px 0 32px rgba(0,0,0,0.22)' : undefined }}>
        <div className="flex items-center gap-2.5 px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img src="/meritlives.svg" alt="MeritLives" style={{width:28,height:28}} />
          <span className="font-syne font-extrabold text-[19px] text-white tracking-tight">SkillHub</span>
        </div>

        <nav className="flex-1 p-2.5 overflow-y-auto">
          {navItems.map(item => {
            const active = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium mb-0.5 no-underline transition-all ${active ? 'bg-[#5b4cf5] text-white' : 'text-white/52 hover:bg-white/[0.07] hover:text-white/88'}`}>
                <i className={`fas ${item.icon} w-4 text-center text-[13px]`} />
                {item.label}
                {item.badge ? <span className="ml-auto bg-[#ef4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={logout} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[10px] text-[#f87171] text-sm font-medium cursor-pointer transition-all hover:bg-[rgba(239,68,68,0.15)] hover:text-[#ef4444] hover:translate-x-0.5" style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)' }}>
            <i className="fas fa-sign-out-alt text-[13px] w-4 text-center" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-[252px] flex-1 flex flex-col min-h-screen max-md:ml-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[#e8e8f0] flex items-center justify-between px-7 sticky top-0 z-50 gap-4">
          <button onClick={() => setMobileOpen(v => !v)} className="md:hidden w-9 h-9 bg-[#f5f5fb] rounded-[10px] grid place-items-center cursor-pointer text-[#0a0a0f] text-base border-0 hover:bg-[#f4f2ff] hover:text-[#5b4cf5] transition-all">
            <i className="fas fa-bars" />
          </button>
          <span className="font-syne font-bold text-[17px] tracking-tight">{pageTitle}</span>
          <div className="relative flex-1 max-w-[340px] max-md:hidden">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px]" />
            <input type="text" placeholder="Search courses, jobs, skills…" className="w-full pl-9 pr-3 py-2.5 border border-[#e8e8f0] rounded-[10px] text-sm font-[inherit] bg-[#f5f5fb] text-[#0a0a0f] outline-none focus:border-[#5b4cf5] focus:bg-white focus:shadow-[0_0_0_3px_rgba(91,76,245,0.14)] transition-all" />
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 border-0 bg-[#f5f5fb] rounded-[10px] grid place-items-center cursor-pointer text-[#6b6b8a] text-[15px] hover:bg-[#f4f2ff] hover:text-[#5b4cf5] transition-all">
              <i className="fas fa-bell" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-7 flex-1 max-md:p-3.5">
          {children}
        </main>
      </div>
    </div>
  );
}