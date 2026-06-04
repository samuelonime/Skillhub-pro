'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/community', icon: 'fa-users', label: 'Community' },
  { href: '/dashboard/portfolio', icon: 'fa-layer-group', label: 'Portfolio' },
  { href: '/dashboard/platforms', icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

const ALL_PLATFORMS = [
  {
    key: 'udemy',
    name: 'Udemy',
    tagline: 'World\'s largest online learning marketplace',
    icon: '🎓',
    color: '#a435f0',
    bg: '#f7f0ff',
    courses: '213,000+',
    students: '62M+',
    perks: ['Lifetime access', 'Certificate of completion', 'Mobile & TV access'],
    category: 'Marketplace',
  },
  {
    key: 'coursera',
    name: 'Coursera',
    tagline: 'University-grade courses from top institutions',
    icon: '🏛️',
    color: '#0056d2',
    bg: '#eff6ff',
    courses: '7,000+',
    students: '130M+',
    perks: ['University certificates', 'Degree programs', 'Industry partners'],
    category: 'Academic',
  },
  {
    key: 'edx',
    name: 'edX',
    tagline: 'High-quality courses from MIT, Harvard & more',
    icon: '📐',
    color: '#02262b',
    bg: '#f0fdf4',
    courses: '3,500+',
    students: '45M+',
    perks: ['MicroMasters programs', 'Professional certificates', 'Audit for free'],
    category: 'Academic',
  },
  {
    key: 'linkedin',
    name: 'LinkedIn Learning',
    tagline: 'Professional skills tied to your career profile',
    icon: '💼',
    color: '#0077b5',
    bg: '#eff6ff',
    courses: '21,000+',
    students: '27M+',
    perks: ['Profile integration', 'Skill assessments', 'Career insights'],
    category: 'Professional',
  },
  {
    key: 'pluralsight',
    name: 'Pluralsight',
    tagline: 'Tech & creative skills for teams and individuals',
    icon: '💡',
    color: '#f15b2a',
    bg: '#fff7f5',
    courses: '7,000+',
    students: '17M+',
    perks: ['Skill IQ assessments', 'Role-based paths', 'Cloud labs'],
    category: 'Tech',
  },
  {
    key: 'skillshare',
    name: 'Skillshare',
    tagline: 'Creative, business & tech classes for creatives',
    icon: '🎨',
    color: '#00e676',
    bg: '#f0fdf4',
    courses: '40,000+',
    students: '12M+',
    perks: ['Project-based learning', 'Community feedback', 'Offline classes'],
    category: 'Creative',
  },
  {
    key: 'alison',
    name: 'Alison',
    tagline: 'Free online courses with certificates',
    icon: '🌍',
    color: '#7eb63e',
    bg: '#f7fdf0',
    courses: '5,000+',
    students: '40M+',
    perks: ['Free courses', 'CPD certificates', 'Diploma programs'],
    category: 'Free',
  },
  {
    key: 'futurelearn',
    name: 'FutureLearn',
    tagline: 'Social learning platform with expert educators',
    icon: '🚀',
    color: '#d60303',
    bg: '#fef2f2',
    courses: '1,000+',
    students: '18M+',
    perks: ['Expert teachers', 'Discussion threads', 'Business courses'],
    category: 'Academic',
  },
];

function ImportCertModal({ platformKey, platformName, onClose, onImported }: any) {
  const [form, setForm] = useState({ title: '', completedAt: '', credentialUrl: '', skills: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!form.title || !form.completedAt) { setError('Course title and date are required'); return; }
    setSaving(true);
    try {
      const res = await apiFetch(`/platforms/${platformKey}/certificates`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
        }),
      });
      if (res.success) { onImported('Certificate imported! It now appears on your profile.'); onClose(); }
      else setError(res.message || 'Failed to import');
    } catch (e: any) { setError(e.message || 'Failed to import'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-syne font-bold text-[17px]">Import Certificate from {platformName}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] hover:bg-[#f4f2ff] hover:text-[#5b4cf5] transition-all grid place-items-center">
            <i className="fas fa-times" />
          </button>
        </div>
        <p className="text-sm text-[#6b6b8a] mb-5">Add a completed course from {platformName} to your SkillHub profile. This will be visible to employers and earns you Merit Coins.</p>

        {error && <div className="mb-4 p-3 bg-[#fef2f2] text-[#ef4444] text-sm rounded-xl">{error}</div>}

        <div className="flex flex-col gap-3">
          {[
            { label: 'Course Title *', key: 'title', placeholder: 'e.g. Complete React Developer' },
            { label: 'Completion Date *', key: 'completedAt', type: 'date' },
            { label: 'Credential URL', key: 'credentialUrl', placeholder: 'https://certificate-url.com' },
            { label: 'Skills Gained (comma-separated)', key: 'skills', placeholder: 'React, JavaScript, UI Design' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-[#6b6b8a] mb-1">{f.label}</label>
              <input
                type={(f as any).type || 'text'}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={(f as any).placeholder || ''}
                className="w-full px-3.5 py-2.5 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.12)] transition-all"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e8e8f0] rounded-xl text-sm font-semibold text-[#6b6b8a] bg-white cursor-pointer hover:bg-[#f5f5fb] transition-all">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all disabled:opacity-60">
            {saving ? 'Importing…' : 'Import Certificate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlatformCard({ platform, connected, onConnect, onImport, connecting }: any) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8e8f0] overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
      <div className="h-2" style={{ background: platform.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl text-2xl grid place-items-center flex-shrink-0" style={{ background: platform.bg }}>
              {platform.icon}
            </div>
            <div>
              <h3 className="font-syne font-bold text-[15px] text-[#0a0a0f]">{platform.name}</h3>
              <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: platform.color + '15', color: platform.color }}>
                {platform.category}
              </span>
            </div>
          </div>
          {connected && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#22c55e] bg-[#f0fdf4] px-2.5 py-1 rounded-full">
              <i className="fas fa-check-circle text-[10px]" />Connected
            </span>
          )}
        </div>

        <p className="text-xs text-[#6b6b8a] mb-4 leading-relaxed">{platform.tagline}</p>

        <div className="flex gap-4 mb-4">
          <div className="text-center">
            <div className="font-syne font-bold text-sm" style={{ color: platform.color }}>{platform.courses}</div>
            <div className="text-[10px] text-[#9898b8]">Courses</div>
          </div>
          <div className="text-center">
            <div className="font-syne font-bold text-sm text-[#0a0a0f]">{platform.students}</div>
            <div className="text-[10px] text-[#9898b8]">Students</div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mb-5">
          {platform.perks.map((p: string) => (
            <div key={p} className="flex items-center gap-2 text-xs text-[#6b6b8a]">
              <i className="fas fa-check text-[10px]" style={{ color: platform.color }} />
              {p}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {connected ? (
            <>
              <button onClick={() => onImport(platform.key, platform.name)}
                className="flex-1 py-2 text-xs font-semibold text-white rounded-xl border-0 cursor-pointer transition-all hover:-translate-y-px"
                style={{ background: platform.color }}>
                <i className="fas fa-download mr-1.5" />Import Certificate
              </button>
              <a href="#" onClick={e => { e.preventDefault(); onConnect(platform.key, true); }}
                className="px-3 py-2 text-xs font-semibold text-[#6b6b8a] bg-[#f5f5fb] rounded-xl no-underline hover:bg-[#e8e8f0] transition-all flex items-center">
                <i className="fas fa-external-link-alt" />
              </a>
            </>
          ) : (
            <button
              disabled={connecting === platform.key}
              onClick={() => onConnect(platform.key)}
              className="w-full py-2 text-xs font-semibold text-white rounded-xl border-0 cursor-pointer transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-md"
              style={{ background: connecting === platform.key ? '#9898b8' : platform.color }}>
              {connecting === platform.key ? (
                <span><i className="fas fa-spinner fa-spin mr-1.5" />Connecting…</span>
              ) : (
                <span><i className="fas fa-plug mr-1.5" />Connect Platform</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlatformsPage() {
  const [connected, setConnected] = useState<Record<string, any>>({});
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [importModal, setImportModal] = useState<{ key: string; name: string } | null>(null);
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Academic', 'Marketplace', 'Professional', 'Tech', 'Creative', 'Free'];

  async function load() {
    setLoading(true);
    try {
      const [platRes, certRes] = await Promise.all([
        apiFetch('/platforms'),
        apiFetch('/platforms/certificates'),
      ]);
      if (platRes.success) {
        const map: Record<string, any> = {};
        (platRes.data || []).forEach((p: any) => { map[p.platform] = p; });
        setConnected(map);
      }
      if (certRes.success) setCertificates(certRes.data || []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 4000); }

  async function handleConnect(platformKey: string, reopen = false) {
    setConnecting(platformKey);
    try {
      const res = await apiFetch(`/platforms/${platformKey}/connect`, { method: 'POST' });
      if (res.success) {
        showToast(`Connected to ${ALL_PLATFORMS.find(p => p.key === platformKey)?.name}! Redirecting…`);
        load();
        // Open affiliate URL in new tab
        if (res.data?.affiliateUrl) {
          setTimeout(() => window.open(res.data.affiliateUrl, '_blank'), 1000);
        }
      } else {
        showToast(res.message || 'Connection failed');
      }
    } catch (e: any) {
      showToast(e.message || 'Connection failed');
    } finally {
      setConnecting(null);
    }
  }

  const filtered = filter === 'All' ? ALL_PLATFORMS : ALL_PLATFORMS.filter(p => p.category === filter);
  const connectedCount = Object.keys(connected).length;
  const certCount = certificates.length;
  const completedCount = certificates.length; // all imported = completed

  if (loading) {
    return (
      <SidebarLayout navItems={navItems} pageTitle="Learning Platforms">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#5b4cf5]/30 border-t-[#5b4cf5] rounded-full animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout navItems={navItems} pageTitle="Learning Platforms">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0a0a0f] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <i className="fas fa-check-circle text-[#22c55e]" />{toast}
        </div>
      )}
      {importModal && (
        <ImportCertModal
          platformKey={importModal.key}
          platformName={importModal.name}
          onClose={() => setImportModal(null)}
          onImported={(msg: string) => { showToast(msg); setImportModal(null); load(); }}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-syne font-bold text-[21px] tracking-tight mb-1">External Learning Platforms</h1>
        <p className="text-[13.5px] text-[#6b6b8a]">Connect platforms, study on them, and sync your progress & certificates back to SkillHub.</p>
      </div>

      {/* How it works banner */}
      <div className="rounded-2xl p-5 mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5b4cf5 0%, #7c3aed 100%)' }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.08)' }} />
        <div className="relative z-[1]">
          <h2 className="font-syne font-bold text-white text-[16px] mb-3">How it works</h2>
          <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
            {[
              { icon: 'fa-plug', step: '1', text: 'Click Connect on any platform' },
              { icon: 'fa-external-link-alt', step: '2', text: 'You\'re redirected to their site (via our referral link)' },
              { icon: 'fa-book-open', step: '3', text: 'Study and complete courses on the platform' },
              { icon: 'fa-download', step: '4', text: 'Import your certificates back to SkillHub' },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl grid place-items-center text-white font-bold text-xs flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {s.step}
                </div>
                <p className="text-white/80 text-xs leading-snug">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-6 max-md:grid-cols-3">
        {[
          { icon: 'fa-plug', bg: '#f4f2ff', color: '#5b4cf5', value: connectedCount, label: 'Platforms Connected' },
          { icon: 'fa-certificate', bg: '#f0fdf4', color: '#22c55e', value: certCount, label: 'Certificates Imported' },
          { icon: 'fa-check-circle', bg: '#fffbeb', color: '#f59e0b', value: completedCount, label: 'Courses Completed' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#e8e8f0] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl grid place-items-center text-sm flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div>
              <div className="font-syne font-bold text-[20px]" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#6b6b8a]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border-0 cursor-pointer transition-all ${filter === cat ? 'bg-[#5b4cf5] text-white shadow-[0_4px_14px_rgba(91,76,245,0.3)]' : 'bg-white text-[#6b6b8a] border border-[#e8e8f0] hover:bg-[#f4f2ff] hover:text-[#5b4cf5]'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Platform grid */}
      <div className="grid grid-cols-4 gap-4 mb-8 max-[1300px]:grid-cols-3 max-[960px]:grid-cols-2 max-md:grid-cols-1">
        {filtered.map(platform => (
          <PlatformCard
            key={platform.key}
            platform={platform}
            connected={!!connected[platform.key]}
            connecting={connecting}
            onConnect={handleConnect}
            onImport={(key: string, name: string) => setImportModal({ key, name })}
          />
        ))}
      </div>

      {/* Imported Certificates */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <h2 className="font-syne font-bold text-[15px] mb-4">
            <i className="fas fa-certificate text-[#f59e0b] mr-2" />Imported Certificates ({certificates.length})
          </h2>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            {certificates.map((cert: any) => {
              const plat = ALL_PLATFORMS.find(p => p.key === cert.platform);
              return (
                <div key={cert.id} className="rounded-xl p-4 border border-[#e8e8f0] hover:border-[#5b4cf5]/30 transition-all">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg text-base grid place-items-center" style={{ background: plat?.bg || '#f5f5fb' }}>
                      {plat?.icon || '📚'}
                    </div>
                    <span className="text-xs font-semibold text-[#6b6b8a]">{plat?.name || cert.issuer}</span>
                  </div>
                  <h3 className="font-syne font-bold text-[13px] text-[#0a0a0f] mb-1 leading-tight">{cert.title}</h3>
                  {cert.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cert.skills.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#f4f2ff] text-[#5b4cf5]">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f0f8]">
                    <span className="text-[11px] text-[#9898b8]">
                      {cert.completedAt ? new Date(cert.completedAt).toLocaleDateString() : ''}
                    </span>
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noreferrer"
                        className="text-[11px] font-semibold text-[#5b4cf5] no-underline hover:underline">
                        View <i className="fas fa-external-link-alt text-[9px]" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
