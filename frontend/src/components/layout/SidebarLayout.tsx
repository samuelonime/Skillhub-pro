"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart3,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Circle,
  Coins,
  Crown,
  FileText,
  GraduationCap,
  HeartPulse,
  Home,
  Layers3,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';
import { apiFetch, logout } from '@/lib/api';
import { BrandIcon } from '@/components/ui/BrandIcon';

interface NavItem {
  href?: string;
  icon: string;
  label: string;
  badge?: number;
  children?: NavItem[];
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  pageTitle: string;
}

const HIDDEN_DASHBOARD_NAV_HREFS = new Set(['/dashboard/resume', '/dashboard/certificates']);

const NOTIF_ICON: Record<string, { icon: string; color: string }> = {
  success:            { icon: 'fa-check-circle', color: '#00E5A0' },
  book:               { icon: 'fa-book-open', color: '#4F8EF7' },
  certificate:        { icon: 'fa-certificate', color: '#00E5A0' },
  coins:              { icon: 'fa-coins', color: '#F59E0B' },
  star:               { icon: 'fa-star', color: '#F59E0B' },
  briefcase:          { icon: 'fa-briefcase', color: '#A78BFA' },
  'paper-plane':      { icon: 'fa-paper-plane', color: '#A78BFA' },
  application_update: { icon: 'fa-briefcase', color: '#A78BFA' },
  message:            { icon: 'fa-comment-dots', color: '#4F8EF7' },
  comments:           { icon: 'fa-comment-dots', color: '#4F8EF7' },
  info:               { icon: 'fa-info-circle', color: '#4F8EF7' },
};

function routeForNotif(n: any): string | null {
  const type = n.type || '';
  const icon = n.icon || '';
  if (type === 'message' || icon === 'comments' || icon === 'comment-dots') return '/dashboard/community/messages';
  if (icon === 'briefcase' || type === 'application_update') return '/dashboard/jobs';
  if (icon === 'book') return '/dashboard/courses';
  if (icon === 'certificate') return '/dashboard/certificates';
  if (icon === 'coins') return '/dashboard/rewards';
  return null;
}

function iconFor(n: any) {
  return NOTIF_ICON[n.icon] || NOTIF_ICON[n.type] || { icon: 'fa-bell', color: '#6B7280' };
}

const SIDEBAR_ICON_MAP: Record<string, LucideIcon> = {
  'fa-home': Home,
  'fa-book-open': BookOpen,
  'fa-sparkles': Sparkles,
  'fa-brain': Brain,
  'fa-heart-pulse': HeartPulse,
  'fa-chart-line': TrendingUp,
  'fa-users': Users,
  'fa-wand-magic-sparkles': WandSparkles,
  'fa-layer-group': Layers3,
  'fa-file-lines': FileText,
  'fa-graduation-cap': GraduationCap,
  'fa-briefcase': BriefcaseBusiness,
  'fa-certificate': Sparkles,
  'fa-coins': Coins,
  'fa-gear': Settings,
  'fa-tachometer-alt': LayoutDashboard,
  'fa-search': Search,
  'fa-chart-bar': BarChart3,
  'fa-building': Building2,
  'fa-crown': Crown,
};

function SidebarMenuIcon({ icon, className = 'w-4 h-4' }: { icon: string; className?: string }) {
  const Icon = SIDEBAR_ICON_MAP[icon] || Circle;
  return <Icon className={className} strokeWidth={2} aria-hidden="true" />;
}

function TimeAgo({ date }: { date: string }) {
  const [text, setText] = useState('');

  useEffect(() => {
    const update = () => {
      const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
      if (seconds < 60) setText('Just now');
      else if (seconds < 3600) setText(`${Math.floor(seconds / 60)}m ago`);
      else if (seconds < 86400) setText(`${Math.floor(seconds / 3600)}h ago`);
      else setText(`${Math.floor(seconds / 86400)}d ago`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [date]);

  return <>{text || '...'}</>;
}

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
    if (dest) {
      onClose();
      router.push(dest);
    }
  }

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div
      className="absolute top-12 right-0 w-90 rounded-2xl z-200 overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', boxShadow: 'var(--panel-shadow)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <span className="font-jakarta font-semibold text-[13px]" style={{ color: 'var(--text-strong)' }}>Notifications</span>
          {unread > 0 && <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: '#EF4444' }}>{unread}</span>}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={markAll}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all hover:opacity-80"
              style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.2)' }}
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg grid place-items-center cursor-pointer border-0 transition-all hover:opacity-70"
            style={{ background: 'var(--surface-soft)', color: 'var(--text-faint)' }}
          >
            <BrandIcon name="fa-times" className="text-xs" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-105">
        {loading ? (
          <div className="flex flex-col gap-0">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-lg shrink-0 animate-pulse" style={{ background: 'var(--surface-soft)' }} />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 rounded animate-pulse w-3/4" style={{ background: 'var(--surface-soft)' }} />
                  <div className="h-2.5 rounded animate-pulse w-1/3" style={{ background: 'var(--surface-soft)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="py-12 text-center">
            <BrandIcon name="fa-bell" className="text-3xl mb-3 block mx-auto" style={{ color: 'var(--text-ghost)' }} />
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No notifications yet</p>
          </div>
        ) : (
          notifs.map(n => {
            const { icon, color } = iconFor(n);
            const target = routeForNotif(n);
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className="flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer"
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  background: !n.read ? 'rgba(79,142,247,0.05)' : 'transparent',
                }}
              >
                <div className="w-8 h-8 rounded-full grid place-items-center text-[11px] shrink-0" style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
                  <BrandIcon name={icon} className="text-[11px]" />
                </div>
                <div className="flex-1 min-w-0">
                  {n.title && <p className="text-[12.5px] font-semibold mb-0.5 leading-snug" style={{ color: 'var(--text-body)' }}>{n.title}</p>}
                  <p className="text-[12px] leading-snug" style={{ color: 'var(--text-faint)' }}>{n.message}</p>
                  <p className="text-[10.5px] mt-1 font-medium" style={{ color: 'var(--text-ghost)' }}>{n.createdAt ? <TimeAgo date={n.createdAt} /> : ''}</p>
                </div>
                {target ? (
                  <BrandIcon name="fa-chevron-right" className="text-[10px] shrink-0 mt-1.5" style={{ color: 'var(--text-faint)' }} />
                ) : !n.read ? (
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: '#4F8EF7' }} />
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ProfileDropdown({ user, isEmployer, onClose }: { user: any; isEmployer: boolean; onClose: () => void }) {
  return (
    <div
      className="absolute top-12 right-0 w-55 rounded-2xl z-200 overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', boxShadow: 'var(--panel-shadow)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="font-semibold text-[13px]" style={{ color: 'var(--text-body)' }}>{user?.firstName} {user?.lastName}</div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{user?.email}</div>
        <span
          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full capitalize mt-2"
          style={{
            background: user?.role === 'employer' ? 'rgba(245,158,11,0.12)' : 'rgba(79,142,247,0.12)',
            color: user?.role === 'employer' ? '#F59E0B' : '#4F8EF7',
            border: `1px solid ${user?.role === 'employer' ? 'rgba(245,158,11,0.25)' : 'rgba(79,142,247,0.25)'}`,
          }}
        >
          {user?.role}
        </span>
      </div>
      <div className="p-1.5">
        {[
          { icon: 'fa-user-circle', label: 'Profile', href: isEmployer ? '/employer/company' : '/dashboard/settings' },
          { icon: 'fa-gear', label: 'Settings', href: isEmployer ? '/employer/settings' : '/dashboard/settings' },
        ].map(item => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium no-underline transition-all hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-soft)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <BrandIcon name={item.icon} className="w-4 text-center text-[12px]" style={{ color: 'var(--text-faint)' }} />
            {item.label}
          </Link>
        ))}
        <div className="h-px my-1" style={{ background: 'var(--border-subtle)' }} />
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium border-0 bg-transparent cursor-pointer transition-all"
          style={{ color: '#F87171' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-soft)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <BrandIcon name="fa-sign-out-alt" className="text-[12px] w-4 text-center" /> Log Out
        </button>
      </div>
    </div>
  );
}

function UserAvatar({ user, size = 8 }: { user: any; size?: number }) {
  const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const initials = name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors = ['#4F8EF7', '#00E5A0', '#F59E0B', '#A78BFA', '#F472B6', '#38BDF8'];
  const color = colors[(initials.charCodeAt(0) || 0) % colors.length];
  const dim = `${size * 4}px`;

  if (!user) {
    return <div style={{ width: dim, height: dim, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }} className="rounded-full shrink-0 grid place-items-center animate-pulse" />;
  }

  if (user.avatar) {
    return <img src={user.avatar} alt={name} style={{ width: dim, height: dim }} className="rounded-full object-cover shrink-0 cursor-pointer ring-1 ring-white/10 hover:ring-2 hover:ring-[#4F8EF7] transition-all" />;
  }

  return (
    <div style={{ width: dim, height: dim, background: color + '28', border: `1px solid ${color}50`, color }} className="rounded-full shrink-0 grid place-items-center font-jakarta font-bold text-xs cursor-pointer hover:ring-2 hover:ring-[#4F8EF7] transition-all">
      {initials}
    </div>
  );
}

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

  const visibleNavItems = navItems
    .filter(item => !item.href || !HIDDEN_DASHBOARD_NAV_HREFS.has(item.href))
    .map(item => item.children
      ? {
          ...item,
          children: item.children.filter(child => !child.href || !HIDDEN_DASHBOARD_NAV_HREFS.has(child.href)),
        }
      : item,
    )
    .filter(item => !item.children || item.children.length > 0);

  const isEmployer = pathname?.startsWith('/employer') || false;

  const isItemActive = useCallback((item: NavItem): boolean => {
    if (item.children) return item.children.some(isItemActive);
    if (!item.href) return false;
    return item.href === '/dashboard' || item.href === '/employer'
      ? pathname === item.href
      : pathname === item.href || pathname?.startsWith(item.href + '/');
  }, [pathname]);

  useEffect(() => {
    const updates: Record<string, boolean> = {};
    visibleNavItems.forEach(item => {
      if (item.children && item.children.some(isItemActive)) {
        updates[item.label] = true;
      }
    });
    if (Object.keys(updates).length) {
      setOpenGroups(prev => ({ ...prev, ...updates }));
    }
  }, [isItemActive, visibleNavItems]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

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

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen theme-transition" style={{ background: 'var(--page-bg-solid)' }}>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-99 md:hidden transition-opacity duration-300" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed top-0 left-0 z-100 w-70 h-full transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-center justify-between px-5 py-5 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <img src="/meritlives.svg" alt="SkillHub" style={{ width: 26, height: 26 }} />
            <span className="font-jakarta font-extrabold text-[18px] tracking-tight" style={{ color: 'var(--text-strong)' }}>SkillHub</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden w-8 h-8 rounded-lg grid place-items-center" style={{ background: 'var(--surface-soft)', color: 'var(--text-muted)' }}>
            <BrandIcon name="fa-times" className="text-sm" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--scroll-thumb) transparent' }}>
          <nav className="p-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-2" style={{ color: 'var(--text-ghost)' }}>Navigation</div>
            {visibleNavItems.map(item => {
              if (item.children) {
                const groupActive = item.children.some(isItemActive);
                const isOpen = !!openGroups[item.label];
                return (
                  <div key={item.label} className="mb-0.5">
                    <button
                      type="button"
                      onClick={() => setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium no-underline transition-all relative"
                      style={{
                        background: groupActive ? 'rgba(79,142,247,0.12)' : 'transparent',
                        color: 'var(--text-strong)',
                        border: groupActive ? '1px solid rgba(79,142,247,0.2)' : '1px solid transparent',
                      }}
                    >
                      {groupActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{ background: '#4F8EF7' }} />}
                      <SidebarMenuIcon icon={item.icon} className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} aria-hidden="true" />
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
                              className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium no-underline transition-all relative"
                              style={{
                                background: active ? 'rgba(79,142,247,0.12)' : 'transparent',
                                color: 'var(--text-strong)',
                                border: active ? '1px solid rgba(79,142,247,0.2)' : '1px solid transparent',
                              }}
                            >
                              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{ background: '#4F8EF7' }} />}
                              <SidebarMenuIcon icon={child.icon} className="h-4 w-4 shrink-0" />
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
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium mb-0.5 no-underline transition-all relative"
                  style={{
                    background: active ? 'rgba(79,142,247,0.12)' : 'transparent',
                    color: 'var(--text-strong)',
                    border: active ? '1px solid rgba(79,142,247,0.2)' : '1px solid transparent',
                  }}
                >
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{ background: '#4F8EF7' }} />}
                  <SidebarMenuIcon icon={item.icon} className="h-4.5 w-4.5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge ? <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center" style={{ background: '#EF4444' }}>{item.badge}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--sidebar-bg)' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-2">
            <UserAvatar user={user} size={8} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-body)' }}>{user ? `${user.firstName} ${user.lastName}` : 'Loading...'}</div>
              <div className="text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>{user?.email || ''}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-[10px] text-[12px] font-medium cursor-pointer transition-all border-0"
            style={{ background: 'var(--danger-soft)', color: 'rgba(248,113,113,0.9)', border: '1px solid var(--danger-border)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft-strong)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)'; }}
          >
            <BrandIcon name="fa-sign-out-alt" className="text-[11px]" /> Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden md:pl-70">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 gap-4" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <button onClick={() => setMobileOpen(true)} className="md:hidden w-8 h-8 rounded-lg grid place-items-center cursor-pointer border-0 transition-all shrink-0" style={{ background: 'var(--surface-soft)', color: 'var(--text-muted)' }}>
            <BrandIcon name="fa-bars" className="text-[13px]" />
          </button>

          <span className="font-jakarta font-semibold text-[15px] tracking-tight truncate flex-1 md:flex-none" style={{ color: 'var(--text-body)' }}>{pageTitle}</span>

          <div className="relative flex-1 max-w-[320px] hidden md:block">
            <BrandIcon name="fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <input
              type="text"
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
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-body)' }}
              onFocus={e => { e.target.style.border = '1px solid var(--focus-ring)'; e.target.style.background = 'var(--input-focus-bg)'; }}
              onBlur={e => { e.target.style.border = '1px solid var(--input-border)'; e.target.style.background = 'var(--input-bg)'; }}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEmployer && (
              <Link href="/dashboard/community/messages" className="w-10 h-10 border-0 rounded-lg grid place-items-center cursor-pointer text-[18px] transition-all relative no-underline" style={{ background: 'var(--surface-soft)', color: 'var(--text-faint)' }} title="Messages">
                <BrandIcon name="fa-comment-dots" />
                {unreadMsgs > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold grid place-items-center" style={{ background: '#4F8EF7', border: '2px solid var(--header-bg)' }}>{unreadMsgs > 9 ? '9+' : unreadMsgs}</span>}
              </Link>
            )}

            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setShowNotifs(v => !v); setShowProfile(false); }}
                className="w-10 h-10 border-0 rounded-lg grid place-items-center cursor-pointer text-[18px] transition-all relative"
                style={{ background: 'var(--surface-soft)', color: 'var(--text-faint)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-body)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'; }}
              >
                <BrandIcon name="fa-bell" />
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold grid place-items-center" style={{ background: '#EF4444', border: '2px solid var(--header-bg)' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
            </div>

            <div ref={profileRef} className="relative">
              <div onClick={() => { setShowProfile(v => !v); setShowNotifs(false); }}>
                <UserAvatar user={user} size={8} />
              </div>
              {showProfile && <ProfileDropdown user={user} isEmployer={isEmployer} onClose={() => setShowProfile(false)} />}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 flex-1" style={{ color: 'var(--text-body)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
