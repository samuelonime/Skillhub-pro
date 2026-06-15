'use client';

import { useState, useEffect, useCallback } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/app/employer/EmployerAccessGuard';

const TIERS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  platinum: { label: 'Platinum', icon: '💎', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  gold: { label: 'Gold', icon: '🥇', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  silver: { label: 'Silver', icon: '🥈', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  bronze: { label: 'Bronze', icon: '🥉', color: '#CD7C54', bg: 'rgba(205,124,84,0.12)' },
};
function getTier(c: number) { return c >= 5000 ? 'platinum' : c >= 2000 ? 'gold' : c >= 500 ? 'silver' : 'bronze'; }
function MeritBadge({ coins }: { coins: number }) {
  const t = TIERS[getTier(coins)];
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}20` }}>{t.icon} {t.label} · {coins.toLocaleString()}</span>;
}

const STATUS_STYLE: Record<string, [string, string]> = {
  applied: ['rgba(59,130,246,0.12)', '#3B82F6'], reviewing: ['rgba(245,158,11,0.12)', '#F59E0B'], shortlisted: ['rgba(0,229,160,0.12)', '#00E5A0'],
  interviewing: ['rgba(79,142,247,0.12)', '#4F8EF7'], hired: ['rgba(0,229,160,0.15)', '#00E5A0'], rejected: ['rgba(239,68,68,0.12)', '#EF4444'],
};

function Sk({ h = 'h-4', w = 'w-full', r = 'rounded' }: any) { return <div className={`${h} ${w} ${r} animate-pulse`} style={{ background: 'rgba(255,255,255,0.06)' }} />; }

function Avatar({ name, avatar, size = 8 }: { name: string; avatar?: string; size?: number }) {
  const initials = (name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#4F8EF7', '#00E5A0', '#F59E0B', '#A78BFA', '#EF4444', '#38BDF8'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  if (avatar) return <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0 border border-[rgba(255,255,255,0.1)]`} />;
  return <div className={`w-${size} h-${size} rounded-full flex-shrink-0 grid place-items-center font-jakarta font-bold text-white text-xs`} style={{ background: color }}>{initials}</div>;
}

function PostJobModal({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', type: 'Full-time', location: '', salary: '', skills: '', minTier: '', isPremium: false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  function set(k: string, v: any) { setForm(p => ({ ...p, [k]: v })); }
  async function submit() {
    if (!form.title || !form.description || !form.location) { setErr('Title, description and location are required'); return; }
    setSaving(true); setErr('');
    try {
      const res = await apiFetch('/jobs', { method: 'POST', body: JSON.stringify({ ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }) });
      if (res.success) { onPosted(); onClose(); } else setErr(res.message || 'Failed');
    } catch (e: any) { setErr(e.message || 'Failed'); } finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.09)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-jakarta font-bold text-[17px]" style={{ color: 'rgba(255,255,255,0.85)' }}>Post a New Job</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border-0 cursor-pointer grid place-items-center transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}><i className="fas fa-times text-xs" /></button>
        </div>
        {err && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>{err}</div>}
        <div className="flex flex-col gap-3">
          {[{ label: 'Job Title *', key: 'title', ph: 'e.g. Senior Frontend Developer' }, { label: 'Location *', key: 'location', ph: 'e.g. Lagos or Remote' }, { label: 'Salary Range', key: 'salary', ph: 'e.g. ₦400k–₦600k/mo' }, { label: 'Required Skills (comma-separated)', key: 'skills', ph: 'React, TypeScript, Node.js' }].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Job Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}>
                {['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Min. Merit Tier</label>
              <select value={form.minTier} onChange={e => set('minTier', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}>
                <option value="">Any (visible to all)</option>
                <option value="bronze">🥉 Bronze+ (0+)</option>
                <option value="silver">🥈 Silver+ (500+)</option>
                <option value="gold">🥇 Gold+ (2,000+)</option>
                <option value="platinum">💎 Platinum only (5,000+)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Job Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="Describe the role, responsibilities and requirements…"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none transition-all resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <input type="checkbox" checked={form.isPremium} onChange={e => set('isPremium', e.target.checked)} className="w-4 h-4 accent-[#4F8EF7]" />
            <div><div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Mark as Featured / Sponsored</div><div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Featured jobs appear as opportunity ads on student dashboards</div></div>
          </label>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all" style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all disabled:opacity-60"
            style={{ background: '#4F8EF7' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; }}>{saving ? 'Posting…' : 'Post Job'}</button>
        </div>
      </div>
    </div>
  );
}

export default function EmployerDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [employer, setEmployer] = useState<any>(null);
  const [showPostJob, setShowPostJob] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  const loadOverview = useCallback(async () => {
    try {
      const [dash, profile] = await Promise.all([
        apiFetch('/employer/dashboard'),
        apiFetch('/employer/profile'),
      ]);
      if (dash.success) setOverview(dash.data);
      if (profile.success) setEmployer(profile.data);
    } catch { }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })();
  const fullName = employer ? `${employer.firstName} ${employer.lastName}` : '';
  const company = employer?.company || '';

  const stats = overview?.stats;
  const pipeline = overview?.pipeline || [];
  const tierBreak = overview?.tierBreakdown || {};
  const recent = overview?.recentApplicants || [];

  const PIPE_COLORS: Record<string, string> = { applied: '#3B82F6', reviewing: '#F59E0B', shortlisted: '#00E5A0', interviewing: '#4F8EF7', hired: '#00E5A0' };
  const headers = ['Candidate', 'Applied For', 'Merit Tier', 'Certs', 'Projects', 'Status'];

  return (
    <EmployerAccessGuard>
      <SidebarLayout navItems={employerNavItems} pageTitle="Dashboard">
        {toast && (
          <div className="fixed top-5 right-5 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2" style={{ background: '#0F1521', border: '1px solid rgba(79,142,247,0.3)' }}>
            <i className="fas fa-check-circle" style={{ color: '#00E5A0' }} />{toast}
          </div>
        )}
        {showPostJob && <PostJobModal onClose={() => setShowPostJob(false)} onPosted={() => { showToast('Job posted successfully!'); loadOverview(); }} />}

        {/* Welcome Banner */}
        <div className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-4 flex-wrap relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #0A1628 100%)', border: '1px solid rgba(79,142,247,0.15)' }}>
          <div className="absolute rounded-full pointer-events-none" style={{ top: -50, right: -50, width: 200, height: 200, background: 'rgba(79,142,247,0.15)' }} />
          <div className="absolute rounded-full pointer-events-none" style={{ bottom: -40, right: 100, width: 130, height: 130, background: 'rgba(0,229,160,0.08)' }} />
          <div className="relative z-[1]">
            {employer ? (
              <>
                <p className="text-sm mb-1" style={{ color: 'rgba(79,142,247,0.8)' }}>{greeting} 👋</p>
                <h2 className="font-jakarta font-bold text-[22px] mb-0.5" style={{ color: '#FFFFFF' }}>{fullName}</h2>
                {company && <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{company}</p>}
              </>
            ) : (
              <div className="flex flex-col gap-2"><Sk h="h-4" w="w-32" r="rounded" /><Sk h="h-7" w="w-48" r="rounded-lg" /><Sk h="h-3" w="w-24" r="rounded" /></div>
            )}
          </div>
          <button onClick={() => setShowPostJob(true)}
            className="relative z-[1] inline-flex items-center gap-2 px-5 py-3 text-white text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all hover:-translate-y-px"
            style={{ background: '#4F8EF7', boxShadow: '0 4px 14px rgba(79,142,247,0.3)' }}>
            <i className="fas fa-plus" /> Post a Job
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4 max-md:grid-cols-2">
          {[
            { icon: 'fa-briefcase', color: '#4F8EF7', value: stats?.activeJobs, label: 'Active Jobs' },
            { icon: 'fa-users', color: '#00E5A0', value: stats?.totalApplicants, label: 'Total Applicants' },
            { icon: 'fa-user-check', color: '#F59E0B', value: stats?.shortlisted, label: 'Shortlisted' },
            { icon: 'fa-handshake', color: '#A78BFA', value: stats?.hiredThisMonth, label: 'Hired This Month' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 transition-all hover:-translate-y-0.5" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl grid place-items-center text-[17px] flex-shrink-0" style={{ background: s.color + '18', color: s.color }}>
                  <i className={`fas ${s.icon}`} />
                </div>
                <div>
                  {s.value === undefined ? <Sk h="h-7" w="w-10" r="rounded" /> : <div className="font-jakarta font-bold text-[22px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{s.value ?? 0}</div>}
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline + Tier Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
          <div className="rounded-2xl p-5" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="font-jakarta font-bold text-[15px] block mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>Hiring Pipeline</span>
            {pipeline.length === 0 ? <div className="flex flex-col gap-3">{[1, 2, 3, 4, 5].map(i => <Sk key={i} h="h-7" r="rounded-xl" />)}</div>
              : pipeline.map((s: any) => (
                <div key={s.stage} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="text-[12px] capitalize w-24 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.stage}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(s.pct, 2)}%`, background: PIPE_COLORS[s.stage] || '#4F8EF7' }} />
                  </div>
                  <span className="text-[12px] font-semibold w-6 text-right" style={{ color: PIPE_COLORS[s.stage] || 'rgba(255,255,255,0.6)' }}>{s.count}</span>
                </div>
              ))}
          </div>
          <div className="rounded-2xl p-5" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="font-jakarta font-bold text-[15px] block mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>Applicant Merit Tiers</span>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>Learning achievement breakdown across all applicants.</p>
            {!stats ? <div className="flex flex-col gap-3">{[1, 2, 3, 4].map(i => <Sk key={i} h="h-12" r="rounded-xl" />)}</div>
              : <div className="grid grid-cols-2 gap-2">
                {Object.entries(TIERS).map(([key, t]) => (
                  <div key={key} className="p-3 rounded-xl" style={{ background: t.bg, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm">{t.icon}</span>
                      <span className="font-jakarta font-bold text-[18px]" style={{ color: t.color }}>{(tierBreak as any)[key] || 0}</span>
                    </div>
                    <div className="text-[11px] font-semibold" style={{ color: t.color }}>{t.label}</div>
                  </div>
                ))}
              </div>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-4 max-md:grid-cols-2">
          {[
            { icon: 'fa-plus', label: 'Post Job', color: '#4F8EF7', action: () => setShowPostJob(true) },
            { icon: 'fa-users', label: 'Applicants', color: '#00E5A0', href: '/employer/applicants' },
            { icon: 'fa-search', label: 'Find Talent', color: '#F59E0B', href: '/employer/talent' },
            { icon: 'fa-chart-bar', label: 'Analytics', color: '#A78BFA', href: '/employer/analytics' },
          ].map(a => (
            a.action
              ? <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-2 py-4 rounded-2xl cursor-pointer transition-all hover:scale-105" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
                <i className={`fas ${a.icon} text-xl`} style={{ color: a.color }} />
                <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
              </button>
              : <a key={a.label} href={a.href} className="flex flex-col items-center gap-2 py-4 rounded-2xl no-underline transition-all hover:scale-105" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
                <i className={`fas ${a.icon} text-xl`} style={{ color: a.color }} />
                <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
              </a>
          ))}
        </div>

        {/* Recent Applicants */}
        <div className="rounded-2xl p-5" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-jakarta font-bold text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>Recent Applicants</span>
            <a href="/employer/applicants" className="text-xs font-semibold px-3 py-1.5 rounded-lg no-underline transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: '#4F8EF7', border: '1px solid rgba(255,255,255,0.08)' }}>View all →</a>
          </div>
          {!overview ? <div className="flex flex-col gap-3">{[1, 2, 3, 4, 5].map(i => <Sk key={i} h="h-14" r="rounded-xl" />)}</div>
            : recent.length === 0 ? (
              <div className="py-10 text-center">
                <i className="fas fa-users text-4xl mb-3 block" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>No applicants yet.</p>
                <button onClick={() => setShowPostJob(true)} className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all" style={{ background: '#4F8EF7' }}>Post your first job</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {headers.map(h => (
                        <th key={h} className="py-2.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.45)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((a: any) => (
                      <tr key={a.applicationId} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={a.name} avatar={a.avatar} size={8} />
                            <span className="font-semibold text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{a.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{a.job?.title || '—'}</td>
                        <td className="py-3 px-4"><MeritBadge coins={a.meritCoins} /></td>
                        <td className="py-3 px-4 font-semibold text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{a.certCount}</td>
                        <td className="py-3 px-4 font-semibold text-[13px]" style={{ color: a.projectCount > 0 ? '#00E5A0' : 'rgba(255,255,255,0.3)' }}>{a.projectCount}</td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: (STATUS_STYLE[a.status] || ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.6)'])[0], color: (STATUS_STYLE[a.status] || ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.6)'])[1] }}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </SidebarLayout>
    </EmployerAccessGuard>
  );
}