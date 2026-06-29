'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

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
  { href: '/dashboard/resume',      icon: 'fa-file-lines',    label: 'Resume' },
  { href: '/dashboard/platforms',   icon: 'fa-graduation-cap',label: 'Learning Platforms' },
  { href: '/dashboard/jobs',        icon: 'fa-briefcase',     label: 'Jobs' },
  { href: '/dashboard/certificates',icon: 'fa-certificate',   label: 'Certificates' },
  { href: '/dashboard/rewards',     icon: 'fa-coins',         label: 'Rewards' },
  { href: '/dashboard/settings',    icon: 'fa-gear',          label: 'Settings' },
];

/* ── Design tokens ────────────────────────────────────────────────────────── */
const D = {
  card:    '#0F1521',
  border:  'rgba(255,255,255,0.07)',
  accent:  '#4F8EF7',
  green:   '#00E5A0',
  amber:   '#F59E0B',
  purple:  '#A78BFA',
  red:     '#F87171',
  sky:     '#38BDF8',
  muted:   'rgba(255,255,255,0.35)',
  text:    'rgba(255,255,255,0.85)',
  subtext: 'rgba(255,255,255,0.45)',
  input:   'rgba(255,255,255,0.06)',
};

const CERT_COLORS = [D.accent, D.amber, D.green, D.sky, D.red, D.purple, '#ec4899', '#14b8a6'];
function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return CERT_COLORS[Math.abs(h) % CERT_COLORS.length];
}

function Skeleton({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-xl animate-pulse`} style={{ background: 'rgba(255,255,255,0.06)' }} />;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: D.card, border: `1px solid ${D.border}` }}>
      {children}
    </div>
  );
}

function isVerified(cert: { status?: string }) {
  return cert.status === 'verified' || (cert as { verified?: boolean }).verified === true;
}

export default function CertificatesPage() {
  const [certs, setCerts]       = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');
  const [toastOk, setToastOk]   = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm]         = useState({ title: '', provider: '', issueDate: '' });
  const [uploading, setUploading] = useState(false);

  function showMsg(msg: string, ok = true) {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(''), 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const [certsRes, coursesRes] = await Promise.all([
        apiFetch('/certificates'),
        apiFetch('/courses/enrolled'),
      ]);
      if (certsRes.success) setCerts(certsRes.data);
      if (coursesRes.success) setUpcoming(coursesRes.data.filter((c: any) => c.progress > 0 && c.progress < 100).slice(0, 3));
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function uploadCert() {
    if (!form.title || !form.provider || !form.issueDate) return;
    setUploading(true);
    try {
      const res = await apiFetch('/certificates', { method: 'POST', body: JSON.stringify(form) });
      if (res.success) {
        showMsg('Certificate added!');
        setShowUpload(false);
        setForm({ title: '', provider: '', issueDate: '' });
        load();
      } else showMsg(res.message || 'Failed to add certificate', false);
    } catch { showMsg('Failed to add certificate', false); }
    finally { setUploading(false); }
  }

  async function deleteCert(id: string) {
    if (!confirm('Delete this certificate?')) return;
    try {
      await apiFetch(`/certificates/${id}`, { method: 'DELETE' });
      showMsg('Certificate removed');
      load();
    } catch {}
  }

  function share(cert: any, platform: string) {
    const text = `I earned the "${cert.title || cert.name}" certificate from ${cert.provider || cert.issuer} on SkillHub Pro! 🎓`;
    const url  = `https://skillhub.pro/verify/${cert.credentialId || cert.id}`;
    if (platform === 'linkedin') window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, '_blank');
    else if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    else navigator.clipboard.writeText(url).then(() => showMsg('Link copied!'));
  }

  const fieldStyle = { background: D.input, border: `1px solid ${D.border}`, color: D.text };

  return (
    <SidebarLayout navItems={navItems} pageTitle="Certificates">
      <div style={{ color: D.text }}>
        {toast && (
          <div className="fixed top-5 right-5 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2"
            style={{ background: '#0D1525', border: `1px solid ${toastOk ? D.green : D.red}40` }}>
            <i className={`fas ${toastOk ? 'fa-check-circle' : 'fa-exclamation-circle'}`}
              style={{ color: toastOk ? D.green : D.red }} />
            {toast}
          </div>
        )}

        {/* Hero banner */}
        <div className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #0A1628 100%)', border: `1px solid ${D.purple}25` }}>
          <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 320, height: 320, background: `radial-gradient(circle, ${D.purple}18 0%, transparent 65%)`, borderRadius: '50%' }} />
          <div className="absolute pointer-events-none" style={{ bottom: -60, right: 80, width: 220, height: 220, background: `radial-gradient(circle, ${D.amber}10 0%, transparent 65%)`, borderRadius: '50%' }} />
          <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: D.purple + 'cc' }}>Achievement Vault</div>
              <h1 className="font-jakarta font-bold text-[2rem] text-white leading-tight mb-1">My Certificates</h1>
              <p className="text-[13px]" style={{ color: D.subtext }}>All your verified certificates in one place — shareable and blockchain-backed.</p>
            </div>
            <button onClick={() => setShowUpload(v => !v)}
              className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-[13.5px] rounded-xl border-0 cursor-pointer transition-all hover:opacity-90 text-white"
              style={{ background: `linear-gradient(135deg, ${D.purple}, ${D.accent})` }}>
              <i className="fas fa-upload" /> Add Certificate
            </button>
          </div>
        </div>

        {/* Upload form */}
        {showUpload && (
          <div className="rounded-2xl p-5 mb-5" style={{ background: D.card, border: `1px solid ${D.purple}50` }}>
            <h3 className="font-jakarta font-bold text-[15px] text-white mb-4">Add External Certificate</h3>
            <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
              {[
                { label: 'Certificate Name', key: 'title', type: 'text', placeholder: 'e.g. AWS Solutions Architect' },
                { label: 'Issuing Organization', key: 'provider', type: 'text', placeholder: 'e.g. Amazon Web Services' },
                { label: 'Issue Date', key: 'issueDate', type: 'date', placeholder: '' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: D.muted }}>{label}</label>
                  <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all"
                    style={fieldStyle} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button disabled={uploading} onClick={uploadCert}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all disabled:opacity-60 text-white"
                style={{ background: D.accent }}>
                {uploading ? 'Saving…' : 'Save Certificate'}
              </button>
              <button onClick={() => setShowUpload(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:opacity-80"
                style={{ background: D.input, border: `1px solid ${D.border}`, color: D.muted }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-5 max-md:grid-cols-1">
          {[
            { icon: 'fa-certificate', color: D.purple, label: 'Earned Certificates', val: certs.length },
            { icon: 'fa-shield-alt',  color: D.green,  label: 'Verified',            val: certs.filter(c => isVerified(c)).length },
            { icon: 'fa-clock',       color: D.amber,  label: 'In Progress',         val: upcoming.length },
          ].map(s => (
            <div key={s.label}
              className="rounded-2xl p-5 flex items-center gap-3.5 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-200"
              style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(circle at 20% 20%, ${s.color}12 0%, transparent 60%)` }} />
              <div className="w-11 h-11 rounded-xl grid place-items-center text-[17px] flex-shrink-0"
                style={{ background: s.color + '18', color: s.color }}>
                <i className={`fas ${s.icon}`} />
              </div>
              <div>
                <div className="font-jakarta font-bold text-[22px] text-white">{loading ? '—' : s.val}</div>
                <div className="text-xs" style={{ color: D.muted }}>{s.label}</div>
              </div>
              <div className="absolute bottom-0 left-5 h-[2px] w-8 rounded-full" style={{ background: s.color }} />
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: D.accent + '30', borderTopColor: D.accent }} />
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_300px] gap-4 max-[1100px]:grid-cols-1">

            {/* Certificates list */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-jakarta font-semibold text-[14px] text-white/90">Earned Certificates</span>
                <span className="text-[11px] font-semibold px-3 py-1 rounded-lg" style={{ background: D.purple + '18', color: D.purple }}>
                  {certs.length} total
                </span>
              </div>

              {certs.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                  <div className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: D.purple + '18' }}>
                    <i className="fas fa-certificate text-3xl" style={{ color: D.purple }} />
                  </div>
                  <h3 className="font-jakarta font-bold text-[16px] text-white mb-1.5">No certificates yet</h3>
                  <p className="text-[13.5px]" style={{ color: D.subtext }}>Complete courses to earn verified certificates.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {certs.map((cert: any) => {
                    const color = colorFor(cert.id);
                    const date  = cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '';
                    return (
                      <div key={cert.id}
                        className="rounded-2xl overflow-hidden group hover:-translate-y-0.5 transition-all duration-200"
                        style={{ background: D.card, border: `1px solid ${D.border}` }}>
                        {/* Color stripe */}
                        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}60)` }} />

                        <div className="p-5 flex items-center gap-4">
                          {/* Icon */}
                          <div className="w-14 h-14 rounded-2xl grid place-items-center text-2xl flex-shrink-0 relative"
                            style={{ background: color + '18', color }}>
                            <i className="fas fa-certificate" />
                            {isVerified(cert) && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full grid place-items-center text-[9px]"
                                style={{ background: D.green, color: 'white' }}>
                                <i className="fas fa-check" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <h3 className="font-jakarta font-bold text-[15px] tracking-tight text-white">{cert.title || cert.name}</h3>
                              {isVerified(cert) && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: D.green + '20', color: D.green }}>
                                  <i className="fas fa-check-circle" /> Verified
                                </span>
                              )}
                            </div>
                            <p className="text-xs mb-1" style={{ color: D.subtext }}>
                              {cert.provider || cert.issuer}{date ? ` · Issued ${date}` : ''}
                            </p>
                            {cert.credentialId && (
                              <p className="text-[11px] font-mono" style={{ color: D.muted }}>ID: {cert.credentialId}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button onClick={() => share(cert, 'linkedin')}
                              className="px-3.5 py-2 text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all hover:opacity-80"
                              style={{ background: D.accent + '18', color: D.accent }}>
                              <i className="fab fa-linkedin mr-1" /> LinkedIn
                            </button>
                            <button onClick={() => share(cert, 'copy')}
                              className="px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all hover:opacity-80"
                              style={{ background: D.input, border: `1px solid ${D.border}`, color: D.muted }}>
                              <i className="fas fa-link mr-1" /> Copy Link
                            </button>
                            <button onClick={() => deleteCert(cert.id)}
                              className="px-3.5 py-2 text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all hover:opacity-80"
                              style={{ background: D.red + '18', color: D.red }}>
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

              {/* Upcoming */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-jakarta font-semibold text-[14px] text-white/90">Upcoming Certificates</span>
                  <i className="fas fa-clock text-[12px]" style={{ color: D.amber }} />
                </div>
                {upcoming.length === 0 ? (
                  <p className="text-sm" style={{ color: D.subtext }}>
                    No courses in progress.{' '}
                    <a href="/dashboard/courses" className="no-underline font-semibold" style={{ color: D.accent }}>Enroll now</a>
                  </p>
                ) : upcoming.map((u: any) => {
                  const color = colorFor(u.id);
                  return (
                    <div key={u.id} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-white leading-tight pr-2 truncate">{u.title}</span>
                        <span className="text-xs font-semibold flex-shrink-0" style={{ color }}>{u.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${u.progress}%`, background: color }} />
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: D.muted }}>{100 - u.progress}% left to earn certificate</p>
                    </div>
                  );
                })}
              </Card>

              {/* Share widget */}
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl grid place-items-center text-[13px]"
                    style={{ background: D.amber + '18', color: D.amber }}>
                    <i className="fas fa-share-alt" />
                  </div>
                  <h2 className="font-jakarta font-bold text-[15px] text-white">Share Achievements</h2>
                </div>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: D.subtext }}>
                  Share your verified certificates directly to LinkedIn, Twitter, or copy a shareable link.
                </p>
                {certs.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {[
                      { icon: 'fa-linkedin', label: 'Share on LinkedIn',  accent: D.accent,  action: () => share(certs[0], 'linkedin') },
                      { icon: 'fa-twitter',  label: 'Share on Twitter',   accent: D.sky,     action: () => share(certs[0], 'twitter')  },
                      { icon: 'fa-link',     label: 'Copy Share Link',    accent: D.green,   action: () => share(certs[0], 'copy')     },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.action}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all text-left hover:opacity-80"
                        style={{ background: btn.accent + '18', color: btn.accent }}>
                        <i className={`fab ${btn.icon} w-4`} /> {btn.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px]" style={{ color: D.muted }}>Earn a certificate to start sharing.</p>
                )}
              </Card>

              {/* Badge preview */}
              {certs.length > 0 && (() => {
                const cert  = certs[0];
                const color = colorFor(cert.id);
                return (
                  <Card>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl grid place-items-center text-[13px]"
                        style={{ background: D.purple + '18', color: D.purple }}>
                        <i className="fas fa-medal" />
                      </div>
                      <h2 className="font-jakarta font-bold text-[15px] text-white">Latest Badge</h2>
                    </div>
                    <div className="flex flex-col items-center py-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}` }}>
                      <div className="w-20 h-20 rounded-2xl grid place-items-center text-4xl mb-3" style={{ background: color + '20', color }}>
                        <i className="fas fa-certificate" />
                      </div>
                      <div className="font-jakarta font-bold text-[14px] text-white text-center mb-0.5">{cert.title || cert.name}</div>
                      <div className="text-[11px]" style={{ color: D.muted }}>{cert.provider || cert.issuer}</div>
                      {isVerified(cert) && (
                        <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: D.green + '20', color: D.green }}>
                          <i className="fas fa-check-circle" /> Blockchain Verified
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })()}
            </div>

          </div>
        )}
      </div>
    </SidebarLayout>
  );
}