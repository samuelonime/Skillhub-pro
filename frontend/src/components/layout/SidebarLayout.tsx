'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, getCachedUser, logout } from '@/lib/api';

interface NavItem {
  href:   string;
  icon:   string;
  label:  string;
  badge?: number;
}

interface SidebarLayoutProps {
  children:  React.ReactNode;
  navItems:  NavItem[];
  pageTitle: string;
}

/* ── Notification panel ──────────────────────────────────────────────────── */
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const NOTIF_ICON: Record<string, { icon: string; bg: string; color: string }> = {
  success:            { icon: 'fa-check-circle',  bg: '#f0fdf4', color: '#22c55e' },
  book:               { icon: 'fa-book-open',     bg: '#eff6ff', color: '#3b82f6' },
  certificate:        { icon: 'fa-certificate',   bg: '#f0fdf4', color: '#22c55e' },
  coins:              { icon: 'fa-coins',         bg: '#fffbeb', color: '#f59e0b' },
  star:               { icon: 'fa-star',          bg: '#fffbeb', color: '#f59e0b' },
  briefcase:          { icon: 'fa-briefcase',     bg: '#f4f2ff', color: '#5b4cf5' },
  'paper-plane':      { icon: 'fa-paper-plane',  bg: '#f4f2ff', color: '#5b4cf5' },
  application_update: { icon: 'fa-briefcase',    bg: '#f4f2ff', color: '#5b4cf5' },
  info:               { icon: 'fa-info-circle',  bg: '#eff6ff', color: '#3b82f6' },
};
function iconFor(n: any) {
  return NOTIF_ICON[n.icon] || NOTIF_ICON[n.type] || { icon: 'fa-bell', bg: '#f5f5fb', color: '#6b6b8a' };
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    apiFetch('/dashboard/notifications')
      .then(r => { if (r.success) setNotifs(r.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function markAll() {
    await apiFetch('/dashboard/notifications/read-all', { method: 'PUT' }).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markOne(id: string) {
    await apiFetch(`/dashboard/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="absolute top-12 right-0 w-[360px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.14)] border border-[#e8e8f0] z-[200] overflow-hidden" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e8e8f0]">
        <div className="flex items-center gap-2">
          <span className="font-syne font-bold text-[14px]">Notifications</span>
          {unread > 0 && (
            <span className="text-[10px] font-bold text-white bg-[#ef4444] px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAll} className="text-[11px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] grid place-items-center hover:bg-[#f0f0f8] transition-all">
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[420px]">
        {loading ? (
          <div className="flex flex-col gap-0">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f0f0f8]">
                <div className="w-8 h-8 rounded-lg bg-[#f0f0f8] animate-pulse flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 bg-[#f0f0f8] animate-pulse rounded w-3/4" />
                  <div className="h-2.5 bg-[#f0f0f8] animate-pulse rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="py-12 text-center">
            <i className="fas fa-bell text-3xl text-[#e8e8f0] mb-3 block" />
            <p className="text-sm text-[#9898b8]">No notifications yet</p>
          </div>
        ) : notifs.map(n => {
          const { icon, bg, color } = iconFor(n);
          return (
            <div
              key={n.id}
              onClick={() => !n.read && markOne(n.id)}
              className={`flex items-start gap-3 px-4 py-3.5 border-b border-[#f0f0f8] last:border-0 transition-colors ${!n.read ? 'bg-[#fafaff] cursor-pointer hover:bg-[#f4f2ff]' : 'bg-white'}`}
            >
              <div className="w-8 h-8 rounded-lg grid place-items-center text-[13px] flex-shrink-0" style={{ background: bg, color }}>
                <i className={`fas ${icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                {n.title && <p className="text-[12.5px] font-semibold text-[#0a0a0f] mb-0.5 leading-snug">{n.title}</p>}
                <p className="text-[12px] text-[#6b6b8a] leading-snug">{n.message}</p>
                <p className="text-[10.5px] text-[#9898b8] mt-1">{n.createdAt ? timeAgo(n.createdAt) : ''}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-[#5b4cf5] flex-shrink-0 mt-1.5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Profile dropdown ────────────────────────────────────────────────────── */
function ProfileDropdown({ user, isEmployer, onClose }: { user: any; isEmployer: boolean; onClose: () => void }) {
  return (
    <div className="absolute top-12 right-0 w-[220px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.14)] border border-[#e8e8f0] z-[200] overflow-hidden" onClick={e => e.stopPropagation()}>
      {/* User info */}
      <div className="px-4 py-3.5 border-b border-[#e8e8f0]">
        <div className="font-semibold text-[13px] text-[#0a0a0f]">{user?.firstName} {user?.lastName}</div>
        <div className="text-[11px] text-[#9898b8] mt-0.5">{user?.email}</div>
        <div className="mt-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{
            background: user?.role === 'employer' ? '#fffbeb' : '#f4f2ff',
            color:      user?.role === 'employer' ? '#d97706'  : '#5b4cf5',
          }}>
            {user?.role}
          </span>
        </div>
      </div>
      {/* Links */}
      <div className="p-1.5">
        {[
          { icon: 'fa-user-circle', label: 'Profile',  href: isEmployer ? '/employer/company'  : '/dashboard/settings' },
          { icon: 'fa-gear',        label: 'Settings', href: isEmployer ? '/employer/settings' : '/dashboard/settings' },
        ].map(item => (
          <Link key={item.label} href={item.href} onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-[#2d2d42] font-medium no-underline hover:bg-[#f5f5fb] transition-all">
            <i className={`fas ${item.icon} text-[#6b6b8a] text-[12px] w-4 text-center`} />
            {item.label}
          </Link>
        ))}
        <div className="h-px bg-[#e8e8f0] my-1" />
        <button onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] text-[#ef4444] font-medium border-0 bg-transparent cursor-pointer hover:bg-[#fef2f2] transition-all">
          <i className="fas fa-sign-out-alt text-[12px] w-4 text-center" />
          Log Out
        </button>
      </div>
    </div>
  );
}

/* ── User Avatar ─────────────────────────────────────────────────────────── */
function UserAvatar({ user, size = 8 }: { user: any; size?: number }) {
  const name     = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const initials = name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors   = ['#5b4cf5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];
  const color    = colors[(initials.charCodeAt(0) || 0) % colors.length];
  const cls      = `w-${size} h-${size} rounded-full flex-shrink-0 grid place-items-center font-syne font-bold text-white text-xs cursor-pointer hover:ring-2 hover:ring-[#5b4cf5] hover:ring-offset-1 transition-all`;

  if (user?.avatar) {
    return <img src={user.avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-[#5b4cf5] hover:ring-offset-1 transition-all`} />;
  }
  return <div className={cls} style={{ background: color }}>{initials}</div>;
}

/* ── Main Layout ─────────────────────────────────────────────────────────── */
export function SidebarLayout({ children, navItems, pageTitle }: SidebarLayoutProps) {
  const pathname    = usePathname();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser]               = useState<any>(getCachedUser());
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isEmployer = navItems.some(n => n.href.startsWith('/employer'));

  // Fetch fresh user data
  useEffect(() => {
    apiFetch('/auth/me')
      .then(r => { if (r.success && r.data) setUser(r.data); })
      .catch(() => {});
  }, []);

  // Fetch unread notification count
  const fetchUnread = useCallback(() => {
    apiFetch('/dashboard/notifications')
      .then(r => {
        if (r.success) setUnreadCount((r.data || []).filter((n: any) => !n.read).length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f5f5fb]">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-[#0a0a0f]/52 backdrop-blur-sm z-[99] md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-[252px] min-h-screen bg-[#0a0a0f] flex flex-col fixed top-0 left-0 z-[100] transition-transform duration-[0.28s] max-md:-translate-x-full ${mobileOpen ? 'translate-x-0' : ''}`}
        style={{ boxShadow: mobileOpen ? '8px 0 32px rgba(0,0,0,0.22)' : undefined }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-9 h-9 bg-[#5b4cf5] rounded-[9px] grid place-items-center font-syne font-bold text-white text-sm">S</div>
          <span className="font-syne font-extrabold text-[19px] text-white tracking-tight">SkillHub</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2.5 overflow-y-auto">
          {navItems.map(item => {
            const active = item.href === '/dashboard' || item.href === '/employer'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium mb-0.5 no-underline transition-all ${active ? 'bg-[#5b4cf5] text-white' : 'text-white/52 hover:bg-white/[0.07] hover:text-white/88'}`}>
                <i className={`fas ${item.icon} w-4 text-center text-[13px]`} />
                {item.label}
                {item.badge ? <span className="ml-auto bg-[#ef4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar user card */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-2">
            <UserAvatar user={user} size={8} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-white truncate">{user ? `${user.firstName} ${user.lastName}` : '…'}</div>
              <div className="text-[10.5px] text-white/40 truncate">{user?.email || ''}</div>
            </div>
          </div>
          <button onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[10px] text-[#f87171] text-sm font-medium cursor-pointer transition-all hover:bg-[rgba(239,68,68,0.15)] hover:text-[#ef4444]"
            style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)' }}>
            <i className="fas fa-sign-out-alt text-[13px] w-4 text-center" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="ml-[252px] flex-1 flex flex-col min-h-screen max-md:ml-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[#e8e8f0] flex items-center justify-between px-7 sticky top-0 z-50 gap-4">
          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(v => !v)}
            className="md:hidden w-9 h-9 bg-[#f5f5fb] rounded-[10px] grid place-items-center cursor-pointer text-[#0a0a0f] text-base border-0 hover:bg-[#f4f2ff] hover:text-[#5b4cf5] transition-all">
            <i className="fas fa-bars" />
          </button>

          <span className="font-syne font-bold text-[17px] tracking-tight">{pageTitle}</span>

          {/* Search */}
          <div className="relative flex-1 max-w-[340px] max-md:hidden">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px]" />
            <input type="text" placeholder="Search courses, jobs, skills…"
              className="w-full pl-9 pr-3 py-2.5 border border-[#e8e8f0] rounded-[10px] text-sm font-[inherit] bg-[#f5f5fb] text-[#0a0a0f] outline-none focus:border-[#5b4cf5] focus:bg-white focus:shadow-[0_0_0_3px_rgba(91,76,245,0.14)] transition-all" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setShowNotifs(v => !v); setShowProfile(false); }}
                className="w-9 h-9 border-0 bg-[#f5f5fb] rounded-[10px] grid place-items-center cursor-pointer text-[#6b6b8a] text-[15px] hover:bg-[#f4f2ff] hover:text-[#5b4cf5] transition-all relative">
                <i className="fas fa-bell" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ef4444] text-white text-[9px] font-bold grid place-items-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <NotificationPanel onClose={() => setShowNotifs(false)} />
              )}
            </div>

            {/* Profile avatar */}
            <div ref={profileRef} className="relative">
              <div onClick={() => { setShowProfile(v => !v); setShowNotifs(false); }}>
                <UserAvatar user={user} size={9} />
              </div>
              {showProfile && (
                <ProfileDropdown user={user} isEmployer={isEmployer} onClose={() => setShowProfile(false)} />
              )}
            </div>
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