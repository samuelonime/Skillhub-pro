'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, logout } from '@/lib/api';

interface NavItem {
  href?:     string;
  icon:      string;
  label:     string;
  badge?:    number;
  children?: NavItem[];
}

interface SidebarLayoutProps {
  children:  React.ReactNode;
  navItems:  NavItem[];
  pageTitle: string;
}

const NOTIF_ICON: Record<string, { icon: string; color: string }> = {
  success:            { icon: 'fa-check-circle',  color: '#00E5A0' },
  book:               { icon: 'fa-book-open',     color: '#4F8EF7' },
  certificate:        { icon: 'fa-certificate',   color: '#00E5A0' },
  coins:              { icon: 'fa-coins',         color: '#F59E0B' },
  star:               { icon: 'fa-star',          color: '#F59E0B' },
  briefcase:          { icon: 'fa-briefcase',     color: '#A78BFA' },
  'paper-plane':      { icon: 'fa-paper-plane',   color: '#A78BFA' },
  application_update: { icon: 'fa-briefcase',     color: '#A78BFA' },
  message:            { icon: 'fa-comment-dots',  color: '#4F8EF7' },
  comments:           { icon: 'fa-comment-dots',  color: '#4F8EF7' },
  info:               { icon: 'fa-info-circle',   color: '#4F8EF7' },
};

// Where each notification routes when clicked
function routeForNotif(n: any): string | null {
  const t = n.type || '';
  const icon = n.icon || '';
  if (t === 'message' || icon === 'comments' || icon === 'comment-dots') return '/dashboard/community/messages';
  if (icon === 'briefcase' || t === 'application_update') return '/dashboard/jobs';
  if (icon === 'book') return '/dashboard/courses';
  if (icon === 'certificate') return '/dashboard/certificates';
  if (icon === 'coins') return '/dashboard/rewards';
  return null;
}

function iconFor(n: any) {
  return NOTIF_ICON[n.icon] || NOTIF_ICON[n.type] || { icon: 'fa-bell', color: '#6B7280' };
}

// TimeAgo component - handles relative times without hydration mismatch
function TimeAgo({ date }: { date: string }) {
  const [text, setText] = useState('');
  
  useEffect(() => {
    const update = () => {
      const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
      if (s < 60) setText('Just now');
      else if (s < 3600) setText(`${Math.floor(s / 60)}m ago`);
      else if (s < 86400) setText(`${Math.floor(s / 3600)}h ago`);
      else setText(`${Math.floor(s / 86400)}d ago`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [date]);
  
  return <>{text || '...'}</>;
}

/* ── Notification panel ──────────────────────────────────────────────────── */
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  function handleClick(n: any) {
    if (!n.read) markOne(n.id);
    const dest = routeForNotif(n);
    if (dest) { onClose(); router.push(dest); }
  }

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div
      className="absolute top-12 right-0 w-[360px] rounded-2xl z-[200] overflow-hidden"
      style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="font-jakarta font-semibold text-[13px] text-white/90">Notifications</span>
          {unread > 0 && (
            <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: '#EF4444' }}>{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAll} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all hover:opacity-80"
              style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.2)' }}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="w-7 h-7 rounded-lg grid place-items-center cursor-pointer border-0 transition-all hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[420px]">
        {loading ? (
          <div className="flex flex-col gap-0">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-start gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-lg flex-shrink-0 animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 rounded animate-pulse w-3/4" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <div className="h-2.5 rounded animate-pulse w-1/3" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="py-12 text-center">
            <i className="fas fa-bell text-3xl mb-3 block" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No notifications yet</p>
          </div>
        ) : (
          notifs.map(n => {
            const { icon, color } = iconFor(n);
            return (
              <div key={n.id} onClick={() => handleClick(n)}
                className="flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: !n.read ? 'rgba(79,142,247,0.05)' : 'transparent',
                }}
              >
                <div className="w-8 h-8 rounded-full grid place-items-center text-[11px] flex-shrink-0"
                  style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
                  <i className={`fas ${icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  {n.title && <p className="text-[12.5px] font-semibold mb-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>{n.title}</p>}
                  <p className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>{n.message}</p>
                  <p className="text-[10.5px] mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {n.createdAt ? <TimeAgo date={n.createdAt} /> : ''}
                  </p>
                </div>
                {routeForNotif(n)
                  ? <i className="fas fa-chevron-right text-[10px] flex-shrink-0 mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  : !n.read && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: '#4F8EF7' }} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Profile dropdown ────────────────────────────────────────────────────── */
function ProfileDropdown({ user, isEmployer, onClose }: { user: any; isEmployer: boolean; onClose: () => void }) {
  return (
    <div
      className="absolute top-12 right-0 w-[220px] rounded-2xl z-[200] overflow-hidden"
      style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="font-semibold text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{user?.firstName} {user?.lastName}</div>
        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{user?.email}</div>
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full capitalize mt-2"
          style={{ background: user?.role === 'employer' ? 'rgba(245,158,11,0.12)' : 'rgba(79,142,247,0.12)', color: user?.role === 'employer' ? '#F59E0B' : '#4F8EF7', border: `1px solid ${user?.role === 'employer' ? 'rgba(245,158,11,0.25)' : 'rgba(79,142,247,0.25)'}` }}>
          {user?.role}
        </span>
      </div>
      <div className="p-1.5">
        {[
          { icon: 'fa-user-circle', label: 'Profile',  href: isEmployer ? '/employer/company'  : '/dashboard/settings' },
          { icon: 'fa-gear',        label: 'Settings', href: isEmployer ? '/employer/settings' : '/dashboard/settings' },
        ].map(item => (
          <Link key={item.label} href={item.href} onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium no-underline transition-all hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <i className={`fas ${item.icon} w-4 text-center text-[12px]`} style={{ color: 'rgba(255,255,255,0.3)' }} />
            {item.label}
          </Link>
        ))}
        <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <button onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium border-0 bg-transparent cursor-pointer transition-all"
          style={{ color: '#F87171' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <i className="fas fa-sign-out-alt text-[12px] w-4 text-center" /> Log Out
        </button>
      </div>
    </div>
  );
}

/* ── User Avatar ─────────────────────────────────────────────────────────── */
function UserAvatar({ user, size = 8 }: { user: any; size?: number }) {
  const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const initials = name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors = ['#4F8EF7', '#00E5A0', '#F59E0B', '#A78BFA', '#F472B6', '#38BDF8'];
  const color = colors[(initials.charCodeAt(0) || 0) % colors.length];
  const dim = `${size * 4}px`;

  if (!user) {
    // Show a skeleton avatar during loading
    return (
      <div style={{ width: dim, height: dim, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
        className="rounded-full flex-shrink-0 grid place-items-center animate-pulse">
      </div>
    );
  }

  if (user.avatar) {
    return <img src={user.avatar} alt={name} style={{ width: dim, height: dim }} className="rounded-full object-cover flex-shrink-0 cursor-pointer ring-1 ring-white/10 hover:ring-2 hover:ring-[#4F8EF7] transition-all" />;
  }
  
  return (
    <div style={{ width: dim, height: dim, background: color + '28', border: `1px solid ${color}50`, color }}
      className="rounded-full flex-shrink-0 grid place-items-center font-jakarta font-bold text-xs cursor-pointer hover:ring-2 hover:ring-[#4F8EF7] transition-all">
      {initials}
    </div>
  );
}

/* ── Sidebar (FIXED with working mobile menu AND SCROLLBAR) ─────────────────────────────────────────────── */
export function SidebarLayout({ children, navItems, pageTitle }: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [user, setUser] = useState<any>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Determine if employer route
  const isEmployer = pathname?.startsWith('/employer') || false;

  const isItemActive = (item: NavItem): boolean => {
    if (item.children) return item.children.some(isItemActive);
    if (!item.href) return false;
    return item.href === '/dashboard' || item.href === '/employer'
      ? pathname === item.href
      : pathname === item.href || pathname?.startsWith(item.href + '/');
  };

  // Auto-expand a group if one of its children is the active route
  useEffect(() => {
    const updates: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.children && item.children.some(isItemActive)) {
        updates[item.label] = true;
      }
    });
    if (Object.keys(updates).length) {
      setOpenGroups(prev => ({ ...prev, ...updates }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close mobile menu when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  // Fetch user data
  useEffect(() => {
    apiFetch('/auth/me').then(r => { 
      if (r.success && r.data) setUser(r.data); 
    }).catch(() => {});
  }, []);

  const fetchUnread = useCallback(() => {
    apiFetch('/dashboard/notifications')
      .then(r => {
        if (r.success) {
          const all = r.data || [];
          const isMsg = (n: any) => n.type === 'message' || n.icon === 'comments' || n.icon === 'comment-dots';
          setUnreadMsgs(all.filter((n: any) => !n.read && isMsg(n)).length);
          setUnreadCount(all.filter((n: any) => !n.read && !isMsg(n)).length);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen" style={{ background: '#080C14' }}>
      {/* Backdrop overlay - only visible on mobile when menu is open */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] md:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar with scrollable navigation ──────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 z-[100]
          w-[280px] h-full
          transition-transform duration-300 ease-in-out
          md:translate-x-0 md:relative
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ 
          background: '#080C14', 
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Logo - fixed at top */}
        <div className="flex items-center justify-between px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2.5">
            <img src="/meritlives.svg" alt="SkillHub" style={{ width: 26, height: 26 }} />
            <span className="font-jakarta font-extrabold text-[18px] text-white tracking-tight">SkillHub</span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg grid place-items-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) rgba(255,255,255,0.05)'
          }}
        >
          <nav className="p-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Navigation
            </div>
            {navItems.map(item => {
              if (item.children) {
                const groupActive = item.children.some(isItemActive);
                const isOpen = !!openGroups[item.label];
                return (
                  <div key={item.label} className="mb-0.5">
                    <button
                      type="button"
                      onClick={() => setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-medium no-underline transition-all relative"
                      style={{
                        background: groupActive ? 'rgba(79,142,247,0.12)' : 'transparent',
                        color: groupActive ? '#4F8EF7' : 'rgba(255,255,255,0.4)',
                        border: groupActive ? '1px solid rgba(79,142,247,0.2)' : '1px solid transparent',
                      }}
                    >
                      {groupActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{ background: '#4F8EF7' }} />
                      )}
                      <i className={`fas ${item.icon} w-4 text-center text-[12px]`} />
                      <span className="flex-1 text-left">{item.label}</span>
                      <i className={`fas fa-chevron-down text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="mt-0.5 ml-3 pl-2 flex flex-col gap-0.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                        {item.children.map(child => {
                          const active = isItemActive(child);
                          return (
                            <Link
                              key={child.href}
                              href={child.href!}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[12.5px] font-medium no-underline transition-all relative"
                              style={{
                                background: active ? 'rgba(79,142,247,0.12)' : 'transparent',
                                color: active ? '#4F8EF7' : 'rgba(255,255,255,0.4)',
                                border: active ? '1px solid rgba(79,142,247,0.2)' : '1px solid transparent',
                              }}
                            >
                              {active && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{ background: '#4F8EF7' }} />
                              )}
                              <i className={`fas ${child.icon} w-4 text-center text-[11px]`} />
                              <span className="flex-1 text-left">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const active = isItemActive(item);
              return (
                <Link 
                  key={item.href} 
                  href={item.href!}
                  onClick={() => setMobileOpen(false)} // Close mobile menu on navigation
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-medium mb-0.5 no-underline transition-all relative"
                  style={{
                    background: active ? 'rgba(79,142,247,0.12)' : 'transparent',
                    color: active ? '#4F8EF7' : 'rgba(255,255,255,0.4)',
                    border: active ? '1px solid rgba(79,142,247,0.2)' : '1px solid transparent',
                  }}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{ background: '#4F8EF7' }} />
                  )}
                  <i className={`fas ${item.icon} w-4 text-center text-[12px]`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge ? (
                    <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center" style={{ background: '#EF4444' }}>
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User card at bottom - fixed */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#080C14' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-2">
            <UserAvatar user={user} size={8} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-white/80 truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
              </div>
              <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {user?.email || ''}
              </div>
            </div>
          </div>
          <button onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-[10px] text-[12px] font-medium cursor-pointer transition-all border-0"
            style={{ background: 'rgba(239,68,68,0.07)', color: 'rgba(248,113,113,0.8)', border: '1px solid rgba(239,68,68,0.15)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.07)'; }}
          >
            <i className="fas fa-sign-out-alt text-[11px]" /> Log Out
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 gap-4"
          style={{ background: 'rgba(8,12,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-8 h-8 rounded-lg grid place-items-center cursor-pointer border-0 transition-all flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
          >
            <i className="fas fa-bars text-[13px]" />
          </button>

          <span className="font-jakarta font-semibold text-[15px] text-white/85 tracking-tight truncate flex-1 md:flex-none">
            {pageTitle}
          </span>

          {/* Search - hidden on mobile */}
          <div className="relative flex-1 max-w-[320px] hidden md:block">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <input type="text" 
              id="search-courses-jobs-skills"
              name="search_courses_jobs_skills"
              placeholder="Search courses, jobs, skills…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/dashboard/courses?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-[13px] font-[inherit] outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Messages — separate from notifications */}
            {!isEmployer && (
              <Link href="/dashboard/community/messages"
                className="w-8 h-8 border-0 rounded-lg grid place-items-center cursor-pointer text-[14px] transition-all relative no-underline"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                title="Messages">
                <i className="fas fa-comment-dots" />
                {unreadMsgs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold grid place-items-center" style={{ background: '#4F8EF7', border: '2px solid #080C14' }}>
                    {unreadMsgs > 9 ? '9+' : unreadMsgs}
                  </span>
                )}
              </Link>
            )}
            {/* Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setShowNotifs(v => !v); setShowProfile(false); }}
                className="w-8 h-8 border-0 rounded-lg grid place-items-center cursor-pointer text-[14px] transition-all relative"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
              >
                <i className="fas fa-bell" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold grid place-items-center" style={{ background: '#EF4444', border: '2px solid #080C14' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
            </div>

            {/* Avatar */}
            <div ref={profileRef} className="relative">
              <div onClick={() => { setShowProfile(v => !v); setShowNotifs(false); }}>
                <UserAvatar user={user} size={8} />
              </div>
              {showProfile && <ProfileDropdown user={user} isEmployer={isEmployer} onClose={() => setShowProfile(false)} />}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6 flex-1" style={{ color: '#E2E8F0' }}>
          {children}
        </main>
      </div>
    </div>
  );
}