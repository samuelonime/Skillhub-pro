'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/portfolio', icon: 'fa-layer-group', label: 'Portfolio' },
  { href: '/dashboard/platforms', icon: 'fa-graduation-cap', label: 'Learning Platforms' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

const LOGO_COLORS = ['#5b4cf5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function logoColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return LOGO_COLORS[Math.abs(h) % LOGO_COLORS.length];
}

function matchColor(pct: number): [string, string] {
  if (pct >= 85) return ['#f0fdf4', '#15803d'];
  if (pct >= 70) return ['#fffbeb', '#92400e'];
  return ['#fef2f2', '#b91c1c'];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  async function loadJobs() {
    setLoading(true);
    try {
      const res = await apiFetch('/jobs');
      if (res.success) {
        setJobs(res.data);
        if (res.data.length > 0) setSelected(res.data[0].id);
      }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { loadJobs(); }, []);

  async function applyJob(jobId: string) {
    setApplying(jobId);
    try {
      const res = await apiFetch(`/jobs/${jobId}/apply`, { method: 'POST' });
      if (res.success) {
        setToast('Application submitted!');
        loadJobs();
      } else {
        setToast(res.message || 'Application failed');
      }
    } catch { setToast('Application failed'); }
    finally {
      setApplying(null);
      setTimeout(() => setToast(''), 3000);
    }
  }

  async function saveJob(jobId: string, isSaved: boolean) {
    setSaving(jobId);
    try {
      const res = await apiFetch(`/jobs/${jobId}/save`, { method: isSaved ? 'DELETE' : 'POST' });
      if (res.success) loadJobs();
    } catch {}
    finally { setSaving(null); }
  }

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.toLowerCase().includes(search.toLowerCase())
  );

  const detail = jobs.find(j => j.id === selected) || jobs[0];

  return (
    <SidebarLayout navItems={navItems} pageTitle="Jobs">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0a0a0f] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">Job Matches</h1>
          <p className="text-[13.5px] text-[#6b6b8a]">Jobs matched to your skills and experience — sorted by compatibility.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9898b8] text-[13px]" />
        <input
          type="text"
          placeholder="Search jobs or companies…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] bg-white text-[#0a0a0f] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.14)] transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#5b4cf5]/30 border-t-[#5b4cf5] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Job list */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {filtered.map(job => {
              const [mbg, mc] = matchColor(job.match ?? 60);
              const isActive = selected === job.id;
              const lc = logoColor(job.company || job.title || '');
              return (
                <div
                  key={job.id}
                  onClick={() => setSelected(job.id)}
                  className={`bg-white rounded-2xl p-4 border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] ${isActive ? 'border-[#5b4cf5] shadow-[0_0_0_1px_#5b4cf5]' : 'border-[#e8e8f0]'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl grid place-items-center font-syne font-bold text-sm text-white flex-shrink-0" style={{ background: lc }}>
                      {(job.company || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-syne font-bold text-[14px] tracking-tight">{job.title}</h3>
                          <p className="text-xs text-[#6b6b8a]">{job.company} · {job.location}</p>
                        </div>
                        {job.match != null && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: mbg, color: mc }}>{job.match}% match</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-[#6b6b8a]">{job.type}</span>
                        {job.salary && <><span className="text-xs text-[#6b6b8a]">·</span><span className="text-xs text-[#6b6b8a]">{job.salary}</span></>}
                        {job.applied && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4f2ff] text-[#5b4cf5]">Applied</span>}
                        {job.saved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#92400e]">Saved</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <i className="fas fa-briefcase text-[38px] text-[#9898b8] block mb-3" />
                <h3 className="font-syne font-bold text-[16px] text-[#2d2d42] mb-1.5">No jobs found</h3>
                <p className="text-[13.5px] text-[#6b6b8a]">Try a different search term.</p>
              </div>
            )}
          </div>

          {/* Job detail panel */}
          {detail && (
            <div className="w-[340px] flex-shrink-0 max-[1100px]:hidden">
              <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] sticky top-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl grid place-items-center font-syne font-bold text-lg text-white" style={{ background: logoColor(detail.company || '') }}>
                    {(detail.company || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-syne font-bold text-[16px] tracking-tight">{detail.title}</h3>
                    <p className="text-[13px] text-[#6b6b8a]">{detail.company}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: 'fa-map-marker-alt', label: detail.location },
                    { icon: 'fa-briefcase', label: detail.type },
                    { icon: 'fa-money-bill', label: detail.salary },
                    { icon: 'fa-clock', label: detail.createdAt ? timeAgo(detail.createdAt) : 'Recently' },
                  ].filter(i => i.label).map(item => (
                    <div key={item.icon} className="flex items-center gap-1.5 text-xs text-[#6b6b8a]">
                      <i className={`fas ${item.icon} text-[#9898b8]`} /> {item.label}
                    </div>
                  ))}
                </div>

                {detail.skills?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Required Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.skills.map((s: string) => (
                        <span key={s} className="px-2.5 py-1 bg-[#f4f2ff] text-[#5b4cf5] text-xs font-semibold rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {detail.description && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">About the Role</div>
                    <p className="text-[13px] text-[#2d2d42] leading-relaxed line-clamp-4">{detail.description}</p>
                  </div>
                )}

                {detail.match != null && (
                  <div className="mb-4 p-3 rounded-xl" style={{ background: matchColor(detail.match)[0] }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: matchColor(detail.match)[1] }}>Match Score</span>
                      <span className="text-sm font-bold" style={{ color: matchColor(detail.match)[1] }}>{detail.match}%</span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${detail.match}%`, background: matchColor(detail.match)[1] }} />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    disabled={detail.applied || applying === detail.id}
                    onClick={() => !detail.applied && applyJob(detail.id)}
                    className="w-full py-3 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] hover:-translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {applying === detail.id ? 'Applying…' : detail.applied ? '✓ Applied' : 'Apply Now'}
                  </button>
                  <button
                    disabled={saving === detail.id}
                    onClick={() => saveJob(detail.id, detail.saved)}
                    className="w-full py-3 bg-[#f5f5fb] text-[#6b6b8a] rounded-xl text-sm font-semibold border border-[#e8e8f0] cursor-pointer hover:border-[#5b4cf5] hover:text-[#5b4cf5] transition-all"
                  >
                    <i className={`fas fa-${detail.saved ? 'bookmark' : 'bookmark'} mr-1.5`} />
                    {detail.saved ? 'Saved' : 'Save Job'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}
