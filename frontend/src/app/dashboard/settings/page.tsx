'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { BrandIcon } from '@/components/ui/BrandIcon';
import { useTheme } from '@/providers/ThemeProvider';

type ThemeMode = 'dark' | 'light';

function Skeleton({ h = 'h-4', w = 'w-full', rounded = 'rounded-lg' }: { h?: string; w?: string; rounded?: string }) {
  return <div className={`${h} ${w} ${rounded} animate-pulse`} style={{ background: 'rgba(255,255,255,0.06)' }} />;
}

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

type SettingsTab = 'profile' | 'account' | 'notifications' | 'privacy' | 'appearance';

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div className="text-sm font-semibold" style={{ color: 'var(--text-body)' }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full transition-all border-0 cursor-pointer shrink-0"
        style={{ background: value ? '#4F8EF7' : 'var(--surface-soft)' }}
      >
        <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: value ? '20px' : '2px' }} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { theme: themeMode, setTheme: setThemeMode } = useTheme();
  const [tab, setTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'ok' | 'err'>('ok');

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  // New skill input
  const [newSkill, setNewSkill] = useState('');

  // Profile and settings state
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      // Use the native fetch wrapper here because apiFetch always sets
      // Content-Type: application/json, which breaks multipart uploads.
      // credentials: 'include' ensures the HttpOnly auth cookie is sent.
      const raw = await fetch('/api/v1/users/avatar', {
        method:      'POST',
        credentials: 'include',
        body:        formData,
        // DO NOT set Content-Type — the browser must set it with the multipart boundary
      });
      const data = await raw.json();
      if (data.success) {
        setProfile((p: any) => ({ ...p, avatar: data.data.avatarUrl }));
        showToast('Profile picture updated!');
      } else {
        showToast(data.message || 'Upload failed', 'err');
      }
    } catch {
      showToast('Upload failed. Please try again.', 'err');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function handleAvatarRemove() {
    setAvatarUploading(true);
    try {
      const res = await apiFetch('/users/avatar', { method: 'DELETE' });
      if (res.success) {
        setProfile((p: any) => ({ ...p, avatar: null }));
        showToast('Profile picture removed.');
      } else {
        showToast('Failed to remove picture.', 'err');
      }
    } catch {
      showToast('Failed to remove picture.', 'err');
    } finally {
      setAvatarUploading(false);
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [profileRes, settingsRes] = await Promise.all([
          apiFetch('/users/profile'),
          apiFetch('/settings'),
        ]);
        if (profileRes.success) {
          const d = profileRes.data;
          if (Array.isArray(d.skills)) d.skills = d.skills.map((s: any) => typeof s === "string" ? s : s.name).filter(Boolean);
          setProfile(d);
        }
        if (settingsRes.success) setSettings(settingsRes.data);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  function handleThemeChange(nextTheme: ThemeMode) {
    setThemeMode(nextTheme);
    showToast(`${nextTheme === 'light' ? 'Light' : 'Dark'} theme enabled.`);
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const { id, email, role, meritCoins, profileStrength, verified, createdAt, skills, ...safeProfile } = profile;
      const res = await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(safeProfile),
      });
      if (res.success) {
        showToast('Profile saved!');
      } else {
        showToast(res.message || 'Failed to save', 'err');
      }
    } catch { showToast('Failed to save', 'err'); }
    finally { setSaving(false); }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (res.success) showToast('Settings saved!');
      else showToast(res.message || 'Failed to save', 'err');
    } catch { showToast('Failed to save', 'err'); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('Passwords do not match', 'err'); return;
    }
    setPwSaving(true);
    try {
      const res = await apiFetch('/users/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      if (res.success) {
        showToast('Password updated! Please log in again.');
        setTimeout(() => { window.location.href = '/login'; }, 2000);
      } else {
        showToast(res.message || 'Failed to change password', 'err');
      }
    } catch { showToast('Failed to change password', 'err'); }
    finally { setPwSaving(false); }
  }

  function addSkill() {
    if (!newSkill.trim()) return;
    const skills = profile.skills || [];
    if (!skills.includes(newSkill.trim())) {
      setProfile((p: any) => ({ ...p, skills: [...skills, newSkill.trim()] }));
    }
    setNewSkill('');
  }

  function removeSkill(s: string) {
    setProfile((p: any) => ({ ...p, skills: (p.skills || []).filter((x: string) => x !== s) }));
  }

  const tabs: { key: SettingsTab; icon: string; label: string }[] = [
    { key: 'profile', icon: 'fa-user', label: 'Profile' },
    { key: 'account', icon: 'fa-lock', label: 'Account & Security' },
    { key: 'notifications', icon: 'fa-bell', label: 'Notifications' },
    { key: 'privacy', icon: 'fa-shield-alt', label: 'Privacy' },
    { key: 'appearance', icon: 'fa-circle-half-stroke', label: 'Appearance' },
  ];

  const initials = profile.firstName && profile.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : '?';

  function handleSave() {
    if (tab === 'profile') saveProfile();
    else saveSettings();
  }

  return (
    <SidebarLayout navItems={navItems} pageTitle="Settings">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl ${toastType === 'ok' ? '' : 'bg-[#EF4444]'}`} style={toastType === 'ok' ? { background: 'var(--surface)', border: '1px solid rgba(79,142,247,0.3)', color: 'var(--text-strong)' } : undefined}>
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-jakarta font-bold text-[21px] tracking-tight mb-0.5" style={{ color: 'var(--text-strong)' }}>Settings</h1>
        <p className="text-[13.5px]" style={{ color: 'var(--text-faint)' }}>Manage your account, profile, and preferences.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#4F8EF7]/30 border-t-[#4F8EF7] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-[220px_1fr] gap-5 max-md:grid-cols-1">
          {/* Settings nav */}
          <div className="rounded-2xl p-2 h-fit" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium font-[inherit] cursor-pointer border-0 text-left transition-all mb-0.5 ${
                  tab === t.key 
                    ? 'bg-[#4F8EF7] text-white' 
                    : 'bg-transparent hover:bg-[rgba(255,255,255,0.04)]'
                }`}
                style={tab !== t.key ? { color: 'var(--text-muted)' } : {}}
              >
                <BrandIcon name={t.icon} className="w-4 text-center text-[13px]" /> {t.label}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--panel-shadow)' }}>
            {tab === 'profile' && (
              <>
                <h2 className="font-jakarta font-bold text-[17px] mb-5" style={{ color: 'var(--text-body)' }}>Profile Information</h2>
                
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />

                  <div className="relative group cursor-pointer shrink-0" onClick={() => !avatarUploading && avatarInputRef.current?.click()}>
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="" className="w-16 h-16 rounded-full object-cover" style={{ border: '1px solid var(--border-soft)' }} />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#4F8EF7] grid place-items-center font-jakarta font-bold text-xl text-white" style={{ border: '1px solid var(--border-soft)' }}>{initials}</div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {avatarUploading
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <BrandIcon name="fa-camera" className="text-white text-sm" />}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-body)' }}>{profile.firstName} {profile.lastName}</p>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>{profile.email}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="text-xs font-medium hover:underline border-0 bg-transparent cursor-pointer p-0 disabled:opacity-50"
                        style={{ color: '#4F8EF7' }}
                      >
                        {avatarUploading ? 'Uploading…' : 'Upload photo'}
                      </button>
                      {profile.avatar && !avatarUploading && (
                        <>
                          <span style={{ color: 'var(--text-ghost)' }}>·</span>
                          <button
                            onClick={handleAvatarRemove}
                            className="text-xs font-medium hover:underline border-0 bg-transparent cursor-pointer p-0"
                            style={{ color: '#EF4444' }}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>JPEG, PNG or WebP · max 3 MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 max-md:grid-cols-1">
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>First Name</label>
                    <input 
                      value={profile.firstName || ''} 
                      onChange={e => setProfile((p: any) => ({ ...p, firstName: e.target.value }))} 
                      className="w-full px-3.5 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-body)' }}
                      onFocus={e => { e.target.style.border = '1px solid var(--focus-ring)'; e.target.style.background = 'var(--input-focus-bg)'; }}
                      onBlur={e => { e.target.style.border = '1px solid var(--input-border)'; e.target.style.background = 'var(--input-bg)'; }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Last Name</label>
                    <input 
                      value={profile.lastName || ''} 
                      onChange={e => setProfile((p: any) => ({ ...p, lastName: e.target.value }))} 
                      className="w-full px-3.5 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-body)' }}
                      onFocus={e => { e.target.style.border = '1px solid var(--focus-ring)'; e.target.style.background = 'var(--input-focus-bg)'; }}
                      onBlur={e => { e.target.style.border = '1px solid var(--input-border)'; e.target.style.background = 'var(--input-bg)'; }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Job Title</label>
                  <input 
                    value={profile.title || ''} 
                    onChange={e => setProfile((p: any) => ({ ...p, title: e.target.value }))} 
                    placeholder="e.g. Frontend Developer" 
                    className="w-full px-3.5 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-body)' }}
                    onFocus={e => { e.target.style.border = '1px solid var(--focus-ring)'; e.target.style.background = 'var(--input-focus-bg)'; }}
                    onBlur={e => { e.target.style.border = '1px solid var(--input-border)'; e.target.style.background = 'var(--input-bg)'; }}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Location</label>
                  <input 
                    value={profile.location || ''} 
                    onChange={e => setProfile((p: any) => ({ ...p, location: e.target.value }))} 
                    placeholder="e.g. Lagos, Nigeria" 
                    className="w-full px-3.5 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-body)' }}
                    onFocus={e => { e.target.style.border = '1px solid var(--focus-ring)'; e.target.style.background = 'var(--input-focus-bg)'; }}
                    onBlur={e => { e.target.style.border = '1px solid var(--input-border)'; e.target.style.background = 'var(--input-bg)'; }}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Bio</label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={e => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell employers about yourself…"
                    className="w-full px-3.5 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all resize-y min-h-[80px]"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-body)' }}
                    onFocus={e => { e.target.style.border = '1px solid var(--focus-ring)'; e.target.style.background = 'var(--input-focus-bg)'; }}
                    onBlur={e => { e.target.style.border = '1px solid var(--input-border)'; e.target.style.background = 'var(--input-bg)'; }}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Skills</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(profile.skills || []).map((s: string) => (
                      <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full" style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.2)' }}>
                        {s}
                        <button onClick={() => removeSkill(s)} className="ml-0.5 hover:text-[#EF4444] border-0 bg-transparent cursor-pointer text-xs leading-none" style={{ color: 'rgba(255,255,255,0.4)' }}>×</button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSkill()}
                        placeholder="Add skill…"
                        className="px-3 py-1.5 text-xs rounded-full outline-none font-[inherit]"
                        style={{ background: 'var(--input-bg)', border: '1px dashed var(--input-border)', color: 'var(--text-muted)' }}
                        onFocus={e => { e.target.style.border = '1px solid var(--focus-ring)'; e.target.style.background = 'var(--input-focus-bg)'; }}
                        onBlur={e => { e.target.style.border = '1px dashed var(--input-border)'; e.target.style.background = 'var(--input-bg)'; }}
                      />
                      <button onClick={addSkill} className="px-2 py-1.5 text-xs font-bold rounded-full border-0 cursor-pointer transition-all" style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>+</button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'account' && (
              <>
                <h2 className="font-jakarta font-bold text-[17px] mb-5" style={{ color: 'var(--text-body)' }}>Account & Security</h2>
                <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 className="font-jakarta font-semibold text-[14px] mb-4" style={{ color: 'var(--text-muted)' }}>Change Password</h3>
                  {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
                    <div key={field} className="mb-4">
                      <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        {['Current Password', 'New Password', 'Confirm New Password'][i]}
                      </label>
                      <input
                        type="password"
                        value={(pwForm as any)[field]}
                        onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                        placeholder={['Enter current password', 'Min 8 chars, 1 uppercase, 1 number', 'Re-enter new password'][i]}
                        className="w-full px-3.5 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-body)' }}
                        onFocus={e => { e.target.style.border = '1px solid var(--focus-ring)'; e.target.style.background = 'var(--input-focus-bg)'; }}
                        onBlur={e => { e.target.style.border = '1px solid var(--input-border)'; e.target.style.background = 'var(--input-bg)'; }}
                      />
                    </div>
                  ))}
                  <button
                    disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}
                    onClick={changePassword}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all disabled:opacity-60"
                    style={{ background: '#4F8EF7', color: 'white' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; }}
                  >
                    {pwSaving ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
                <div>
                  <h3 className="font-jakarta font-semibold text-[14px] mb-1" style={{ color: '#EF4444' }}>Danger Zone</h3>
                  <p className="text-[13px] mb-3" style={{ color: 'var(--text-faint)' }}>Permanently delete your account and all associated data.</p>
                  <button 
                    onClick={() => {
                      if (confirm('Account deletion is permanent and cannot be undone. To proceed, our support team will verify your identity and remove your account within 48 hours. Continue?')) {
                        window.location.href = 'mailto:support@skillhub.meritlives.com?subject=Account%20Deletion%20Request';
                      }
                    }}
                    className="px-4 py-2.5 text-sm font-semibold rounded-xl border cursor-pointer transition-all"
                    style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EF4444'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger-text)'; }}
                  >
                    Delete Account
                  </button>
                </div>
              </>
            )}

            {tab === 'notifications' && (
              <>
                <h2 className="font-jakarta font-bold text-[17px] mb-5" style={{ color: 'var(--text-body)' }}>Notification Preferences</h2>
                <div className="mb-5">
                  <h3 className="font-jakarta font-semibold text-[13px] uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>General</h3>
                  <Toggle label="Email Notifications" desc="Receive notifications via email" value={settings.emailNotifs ?? true} onChange={v => setSettings((s: any) => ({ ...s, emailNotifs: v }))} />
                  <Toggle label="Push Notifications" desc="Receive push notifications in browser" value={settings.pushNotifs ?? true} onChange={v => setSettings((s: any) => ({ ...s, pushNotifs: v }))} />
                  <Toggle label="Weekly Digest" desc="Weekly summary of your activity" value={settings.weeklyDigest ?? false} onChange={v => setSettings((s: any) => ({ ...s, weeklyDigest: v }))} />
                </div>
                <div className="mb-5">
                  <h3 className="font-jakarta font-semibold text-[13px] uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>Jobs</h3>
                  <Toggle label="Job Alerts" desc="Get notified when new jobs match your profile" value={settings.jobAlerts ?? true} onChange={v => setSettings((s: any) => ({ ...s, jobAlerts: v }))} />
                </div>
                <div>
                  <h3 className="font-jakarta font-semibold text-[13px] uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>Learning</h3>
                  <Toggle label="Course Updates" desc="Reminders and updates about your enrolled courses" value={settings.courseUpdates ?? true} onChange={v => setSettings((s: any) => ({ ...s, courseUpdates: v }))} />
                </div>
              </>
            )}

            {tab === 'privacy' && (
              <>
                <h2 className="font-jakarta font-bold text-[17px] mb-5" style={{ color: 'var(--text-body)' }}>Privacy Settings</h2>
                <Toggle label="Public Profile" desc="Let employers find your profile in searches" value={settings.profileVisible ?? true} onChange={v => setSettings((s: any) => ({ ...s, profileVisible: v }))} />
                <Toggle label="Show Email" desc="Display your email on your public profile" value={settings.showEmail ?? false} onChange={v => setSettings((s: any) => ({ ...s, showEmail: v }))} />
                <Toggle label="Show Location" desc="Display your location on your public profile" value={settings.showLocation ?? true} onChange={v => setSettings((s: any) => ({ ...s, showLocation: v }))} />
              </>
            )}

            {tab === 'appearance' && (
              <>
                <h2 className="font-jakarta font-bold text-[17px] mb-5" style={{ color: 'var(--text-body)' }}>Appearance</h2>
                <div className="rounded-2xl p-4 mb-5" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border-soft)' }}>
                  <div className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>Theme</div>
                  <Toggle
                    label="Light theme"
                    desc="Switch your dashboard shell between dark and light surfaces. Your preference is saved on this device."
                    value={themeMode === 'light'}
                    onChange={value => handleThemeChange(value ? 'light' : 'dark')}
                  />
                  <div className="flex items-center gap-2 mt-4 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ background: themeMode === 'light' ? 'rgba(37,99,235,0.12)' : 'var(--surface)', border: '1px solid var(--border-soft)', color: themeMode === 'light' ? '#2563EB' : 'var(--text-muted)' }}>
                      White
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ background: themeMode === 'dark' ? 'rgba(37,99,235,0.12)' : 'var(--surface)', border: '1px solid var(--border-soft)', color: themeMode === 'dark' ? '#2563EB' : 'var(--text-muted)' }}>
                      Black
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Save button - not shown for account tab (has its own save) */}
            {tab !== 'account' && tab !== 'appearance' && (
              <div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  disabled={saving}
                  onClick={handleSave}
                  className="px-6 py-2.5 text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all disabled:opacity-60"
                  style={{ background: '#4F8EF7', color: 'white' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; }}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition-all"
                  style={{ background: 'var(--surface-soft)', color: 'var(--text-muted)', border: '1px solid var(--border-soft)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-soft-hover)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-soft)'; }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}