'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: 'fa-book-open', label: 'Courses' },
  { href: '/dashboard/jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { href: '/dashboard/certificates', icon: 'fa-certificate', label: 'Certificates' },
  { href: '/dashboard/rewards', icon: 'fa-coins', label: 'Rewards' },
  { href: '/dashboard/settings', icon: 'fa-gear', label: 'Settings' },
];

const COLORS = ['#5b4cf5', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];
function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ name: '', issuer: '', issueDate: '' });
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [certsRes, coursesRes] = await Promise.all([
        apiFetch('/certificates'),
        apiFetch('/courses/enrolled'),
      ]);
      if (certsRes.success) setCerts(certsRes.data);
      if (coursesRes.success) {
        setUpcoming(coursesRes.data.filter((c: any) => c.progress > 0 && c.progress < 100).slice(0, 3));
      }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function uploadCert() {
    if (!form.name || !form.issuer || !form.issueDate) return;
    setUploading(true);
    try {
      const res = await apiFetch('/certificates', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (res.success) {
        setToast('Certificate added!');
        setShowUpload(false);
        setForm({ name: '', issuer: '', issueDate: '' });
        load();
      } else {
        setToast(res.message || 'Failed to add certificate');
      }
    } catch { setToast('Failed to add certificate'); }
    finally {
      setUploading(false);
      setTimeout(() => setToast(''), 3000);
    }
  }

  async function deleteCert(id: string) {
    if (!confirm('Delete this certificate?')) return;
    try {
      await apiFetch(`/certificates/${id}`, { method: 'DELETE' });
      setToast('Certificate removed');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch {}
  }

  function share(cert: any, platform: string) {
    const text = `I earned the "${cert.name}" certificate from ${cert.issuer} on SkillHub Pro! 🎓`;
    const url = `https://skillhub.pro/verify/${cert.credentialId || cert.id}`;
    if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url).then(() => { setToast('Link copied!'); setTimeout(() => setToast(''), 2000); });
    }
  }

  return (
    <SidebarLayout navItems={navItems} pageTitle="Certificates">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0a0a0f] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-[21px] tracking-tight mb-0.5">My Certificates</h1>
          <p className="text-[13.5px] text-[#6b6b8a]">All your verified certificates in one place — shareable and blockchain-backed.</p>
        </div>
        <button
          onClick={() => setShowUpload(v => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] hover:-translate-y-px transition-all"
        >
          <i className="fas fa-upload" /> Add Certificate
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="bg-white rounded-2xl p-5 border border-[#5b4cf5] mb-6">
          <h3 className="font-syne font-bold text-[15px] mb-4">Add External Certificate</h3>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            <div>
              <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Certificate Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. AWS Solutions Architect" className="w-full px-3.5 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] transition-all" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Issuing Organization</label>
              <input value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} placeholder="e.g. Amazon Web Services" className="w-full px-3.5 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] transition-all" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#2d2d42] mb-1.5">Issue Date</label>
              <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} className="w-full px-3.5 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] transition-all" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button disabled={uploading} onClick={uploadCert} className="px-5 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all disabled:opacity-60">
              {uploading ? 'Saving…' : 'Save Certificate'}
            </button>
            <button onClick={() => setShowUpload(false)} className="px-5 py-2.5 bg-[#f5f5fb] text-[#6b6b8a] rounded-xl text-sm font-semibold border border-[#e8e8f0] cursor-pointer hover:border-[#5b4cf5] transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 max-md:grid-cols-1">
        {[
          { icon: 'fa-certificate', bg: '#f4f2ff', color: '#5b4cf5', val: certs.length, label: 'Earned Certificates' },
          { icon: 'fa-shield-alt', bg: '#f0fdf4', color: '#22c55e', val: certs.filter(c => c.verified !== false).length, label: 'Verified' },
          { icon: 'fa-clock', bg: '#fffbeb', color: '#f59e0b', val: upcoming.length, label: 'In Progress' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#e8e8f0] flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl grid place-items-center text-[17px] flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div>
              <div className="font-syne font-bold text-[22px]">{loading ? '—' : s.val}</div>
              <div className="text-xs text-[#6b6b8a]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#5b4cf5]/30 border-t-[#5b4cf5] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_320px] gap-4 max-[1100px]:grid-cols-1">
          <div>
            <h2 className="font-syne font-bold text-[15px] mb-4">Earned Certificates</h2>
            {certs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#e8e8f0]">
                <i className="fas fa-certificate text-[38px] text-[#9898b8] block mb-3" />
                <h3 className="font-syne font-bold text-[16px] text-[#2d2d42] mb-1.5">No certificates yet</h3>
                <p className="text-[13.5px] text-[#6b6b8a]">Complete courses to earn verified certificates.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {certs.map((cert: any) => {
                  const color = colorFor(cert.id);
                  const date = cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '';
                  return (
                    <div key={cert.id} className="bg-white rounded-2xl border border-[#e8e8f0] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all">
                      <div className="h-2" style={{ background: color }} />
                      <div className="p-5 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl grid place-items-center text-2xl flex-shrink-0" style={{ background: color + '18', color }}>
                          <i className="fas fa-certificate" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-syne font-bold text-[15px] tracking-tight">{cert.name}</h3>
                            {cert.verified !== false && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#15803d]">
                                <i className="fas fa-check-circle" /> Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6b6b8a] mb-1">{cert.issuer}{date ? ` · Issued ${date}` : ''}</p>
                          {cert.credentialId && <p className="text-[11px] font-mono text-[#9898b8]">ID: {cert.credentialId}</p>}
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button onClick={() => share(cert, 'linkedin')} className="px-3.5 py-2 text-xs font-semibold text-[#5b4cf5] bg-[#f4f2ff] rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">
                            <i className="fab fa-linkedin mr-1" /> LinkedIn
                          </button>
                          <button onClick={() => share(cert, 'copy')} className="px-3.5 py-2 text-xs font-semibold text-[#6b6b8a] bg-[#f5f5fb] border border-[#e8e8f0] rounded-lg cursor-pointer hover:border-[#5b4cf5] hover:text-[#5b4cf5] transition-all">
                            <i className="fas fa-link mr-1" /> Copy Link
                          </button>
                          <button onClick={() => deleteCert(cert.id)} className="px-3.5 py-2 text-xs font-semibold text-[#ef4444] bg-[#fef2f2] border border-[#fecaca] rounded-lg cursor-pointer hover:bg-[#ef4444] hover:text-white transition-all">
                            <i className="fas fa-trash mr-1" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
              <h2 className="font-syne font-bold text-[15px] mb-4">Upcoming Certificates</h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-[#9898b8]">No courses in progress. <a href="/dashboard/courses" className="text-[#5b4cf5]">Enroll now</a></p>
              ) : upcoming.map((u: any) => {
                const color = colorFor(u.id);
                return (
                  <div key={u.id} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-[#0a0a0f] leading-tight pr-2 truncate">{u.title}</span>
                      <span className="text-xs font-semibold flex-shrink-0" style={{ color }}>{u.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-[#e8e8f0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${u.progress}%`, background: color }} />
                    </div>
                    <p className="text-[11px] text-[#9898b8] mt-1">{100 - u.progress}% left to earn certificate</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
              <h2 className="font-syne font-bold text-[15px] mb-3">Share Your Achievements</h2>
              <p className="text-[13px] text-[#6b6b8a] leading-relaxed mb-4">Share your verified certificates directly to LinkedIn, Twitter, or copy a shareable link.</p>
              {certs.length > 0 && (
                <div className="flex flex-col gap-2">
                  {[
                    { icon: 'fa-linkedin', label: 'Share Latest on LinkedIn', bg: '#eff6ff', color: '#1d4ed8', action: () => share(certs[0], 'linkedin') },
                    { icon: 'fa-twitter', label: 'Share on Twitter', bg: '#f0fdf4', color: '#15803d', action: () => share(certs[0], 'twitter') },
                    { icon: 'fa-link', label: 'Copy Share Link', bg: '#f5f5fb', color: '#6b6b8a', action: () => share(certs[0], 'copy') },
                  ].map(btn => (
                    <button key={btn.label} onClick={btn.action} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all text-left" style={{ background: btn.bg, color: btn.color }}>
                      <i className={`fab ${btn.icon}`} /> {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
