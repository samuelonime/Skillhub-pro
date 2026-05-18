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

type SettingsTab = 'profile' | 'account' | 'notifications' | 'privacy';

function Input({ label, type = 'text', defaultValue, placeholder }: any) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">{label}</label>
      <input type={type} defaultValue={defaultValue} placeholder={placeholder} className="w-full px-3.5 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] text-[#0a0a0f] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.14)] transition-all" />
    </div>
  );
}

function Toggle({ label, desc, defaultOn = false }: { label: string; desc?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#f0f0f8] last:border-0">
      <div>
        <div className="text-sm font-semibold text-[#0a0a0f]">{label}</div>
        {desc && <div className="text-xs text-[#6b6b8a] mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => setOn(v => !v)}
        className="relative w-10 h-5 rounded-full transition-all border-0 cursor-pointer flex-shrink-0"
        style={{ background: on ? '#5b4cf5' : '#e8e8f0' }}
      >
        <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: on ? '20px' : '2px' }} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs: { key: SettingsTab; icon: string; label: string }[] = [
    { key: 'profile', icon: 'fa-user', label: 'Profile' },
    { key: 'account', icon: 'fa-lock', label: 'Account & Security' },
    { key: 'notifications', icon: 'fa-bell', label: 'Notifications' },
    { key: 'privacy', icon: 'fa-shield-alt', label: 'Privacy' },
  ];

  return (
    <SidebarLayout navItems={navItems} pageTitle="Settings">
      <div className="mb-6">
        <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">Settings</h1>
        <p className="text-[13.5px] text-[#6b6b8a]">Manage your account, profile, and preferences.</p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-5 max-md:grid-cols-1">
        {/* Settings nav */}
        <div className="bg-white rounded-2xl p-2 border border-[#e8e8f0] h-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium font-[inherit] cursor-pointer border-0 text-left transition-all mb-0.5 ${tab === t.key ? 'bg-[#5b4cf5] text-white' : 'bg-transparent text-[#6b6b8a] hover:bg-[#f5f5fb]'}`}
            >
              <i className={`fas ${t.icon} w-4 text-center text-[13px]`} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e8f0]">
          {tab === 'profile' && (
            <>
              <h2 className="font-syne font-bold text-[17px] mb-5">Profile Information</h2>
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#e8e8f0]">
                <div className="w-16 h-16 rounded-full bg-[#5b4cf5] grid place-items-center font-syne font-bold text-xl text-white">AJ</div>
                <div>
                  <button className="px-4 py-2 bg-[#f4f2ff] text-[#5b4cf5] text-sm font-semibold rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all mr-2">Upload Photo</button>
                  <button className="px-4 py-2 bg-[#fef2f2] text-[#ef4444] text-sm font-semibold rounded-lg border-0 cursor-pointer hover:bg-[#ef4444] hover:text-white transition-all">Remove</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 max-md:grid-cols-1">
                <Input label="First Name" defaultValue="Alex" />
                <Input label="Last Name" defaultValue="Johnson" />
              </div>
              <Input label="Email Address" type="email" defaultValue="alex.johnson@example.com" />
              <Input label="Phone Number" type="tel" defaultValue="+234 801 234 5678" />
              <Input label="Location" defaultValue="Lagos, Nigeria" />
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Bio</label>
                <textarea className="w-full px-3.5 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] text-[#0a0a0f] bg-white outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.14)] transition-all resize-y min-h-[80px]" defaultValue="Frontend developer with 3 years experience in React, TypeScript and modern web technologies." />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-[#2d2d42] mb-2">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {['JavaScript','React','TypeScript','CSS','Node.js'].map(s => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f2ff] text-[#5b4cf5] text-xs font-semibold rounded-full">
                      {s} <button className="ml-0.5 text-[#9898b8] hover:text-[#ef4444] border-0 bg-none cursor-pointer text-xs">×</button>
                    </span>
                  ))}
                  <button className="px-3 py-1.5 bg-[#f5f5fb] text-[#6b6b8a] text-xs font-semibold rounded-full border border-dashed border-[#e8e8f0] cursor-pointer hover:border-[#5b4cf5] hover:text-[#5b4cf5] transition-all">+ Add Skill</button>
                </div>
              </div>
            </>
          )}

          {tab === 'account' && (
            <>
              <h2 className="font-syne font-bold text-[17px] mb-5">Account & Security</h2>
              <div className="mb-6 pb-6 border-b border-[#e8e8f0]">
                <h3 className="font-syne font-semibold text-[14px] mb-4">Change Password</h3>
                <Input label="Current Password" type="password" placeholder="Enter current password" />
                <Input label="New Password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" />
                <Input label="Confirm New Password" type="password" placeholder="Re-enter new password" />
              </div>
              <div>
                <h3 className="font-syne font-semibold text-[14px] mb-1">Two-Factor Authentication</h3>
                <p className="text-[13px] text-[#6b6b8a] mb-3">Add an extra layer of security to your account.</p>
                <button className="px-4 py-2.5 bg-[#f4f2ff] text-[#5b4cf5] text-sm font-semibold rounded-xl border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">Enable 2FA</button>
              </div>
              <div className="mt-6 pt-6 border-t border-[#e8e8f0]">
                <h3 className="font-syne font-semibold text-[14px] text-[#ef4444] mb-1">Danger Zone</h3>
                <p className="text-[13px] text-[#6b6b8a] mb-3">Permanently delete your account and all associated data.</p>
                <button className="px-4 py-2.5 bg-[#fef2f2] text-[#ef4444] text-sm font-semibold rounded-xl border border-[#fecaca] cursor-pointer hover:bg-[#ef4444] hover:text-white transition-all">Delete Account</button>
              </div>
            </>
          )}

          {tab === 'notifications' && (
            <>
              <h2 className="font-syne font-bold text-[17px] mb-5">Notification Preferences</h2>
              <div className="mb-5">
                <h3 className="font-syne font-semibold text-[13px] text-[#6b6b8a] uppercase tracking-wide mb-2">Job Alerts</h3>
                <Toggle label="New Job Matches" desc="Get notified when new jobs match your profile" defaultOn />
                <Toggle label="Application Updates" desc="Status changes on your applications" defaultOn />
                <Toggle label="Saved Job Reminders" desc="Reminders about jobs you've saved" defaultOn />
              </div>
              <div className="mb-5">
                <h3 className="font-syne font-semibold text-[13px] text-[#6b6b8a] uppercase tracking-wide mb-2">Learning</h3>
                <Toggle label="Course Progress Reminders" desc="Daily reminders to continue your courses" />
                <Toggle label="New Course Releases" desc="When courses in your interest areas launch" defaultOn />
                <Toggle label="Certificate Earned" desc="Celebration notification when you earn a cert" defaultOn />
              </div>
              <div>
                <h3 className="font-syne font-semibold text-[13px] text-[#6b6b8a] uppercase tracking-wide mb-2">Merit Coins</h3>
                <Toggle label="Coins Earned" desc="When you earn Merit Coins" defaultOn />
                <Toggle label="Redemption Confirmations" desc="When you redeem coins for rewards" defaultOn />
                <Toggle label="Low Balance Alerts" desc="When balance drops below 200 coins" />
              </div>
            </>
          )}

          {tab === 'privacy' && (
            <>
              <h2 className="font-syne font-bold text-[17px] mb-5">Privacy Settings</h2>
              <Toggle label="Public Profile" desc="Let employers find your profile in searches" defaultOn />
              <Toggle label="Show Certificates" desc="Display your certificates on your public profile" defaultOn />
              <Toggle label="Show Skills" desc="Let employers see your skill profile" defaultOn />
              <Toggle label="Job Search Status" desc="Signal to employers that you're open to opportunities" defaultOn />
              <Toggle label="Profile Analytics" desc="Allow SkillHub to analyse your profile views" />
              <Toggle label="Data for Improvement" desc="Share anonymised data to help improve SkillHub" />
            </>
          )}

          {/* Save button */}
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#e8e8f0]">
            <button onClick={save} className="px-6 py-2.5 bg-[#5b4cf5] text-white text-sm font-semibold rounded-xl border-0 cursor-pointer hover:bg-[#7c6ff7] hover:-translate-y-px transition-all">
              {saved ? <><i className="fas fa-check mr-1.5" />Saved!</> : 'Save Changes'}
            </button>
            <button className="px-6 py-2.5 bg-[#f5f5fb] text-[#6b6b8a] text-sm font-semibold rounded-xl border border-[#e8e8f0] cursor-pointer hover:border-[#9898b8] transition-all">Cancel</button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
