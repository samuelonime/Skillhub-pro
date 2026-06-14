'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',               icon: 'fa-home',              label: 'Dashboard' },
    { href: '/dashboard/courses',       icon: 'fa-book-open',         label: 'Courses' },
    { href: '/dashboard/career-oracle', icon: 'fa-brain',             label: 'Career Oracle' },
    { href: '/dashboard/skill-coach',   icon: 'fa-heart-pulse',       label: 'Skill Coach' },
    { href: '/dashboard/peer-genome',   icon: 'fa-users',             label: 'Peer Genome' },
    { href: '/dashboard/skill-decay',   icon: 'fa-chart-line',        label: 'Skill Decay' },
    { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles', label: 'Ghost Recruiter' },
    { href: '/dashboard/community',     icon: 'fa-users',             label: 'Community' },
    { href: '/dashboard/portfolio',     icon: 'fa-layer-group',       label: 'Portfolio' },
    { href: '/dashboard/platforms',     icon: 'fa-graduation-cap',    label: 'Learning Platforms' },
    { href: '/dashboard/jobs',          icon: 'fa-briefcase',         label: 'Jobs' },
    { href: '/dashboard/certificates',  icon: 'fa-certificate',       label: 'Certificates' },
    { href: '/dashboard/rewards',       icon: 'fa-coins',             label: 'Rewards' },
    { href: '/dashboard/settings',      icon: 'fa-gear',              label: 'Settings' },
];

function Sk({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-lg animate-pulse`} style={{ background: 'rgba(255,255,255,0.06)' }} />;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <div className="font-jakarta font-semibold text-[14px] text-white/90">{title}</div>
      {sub && <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</div>}
    </div>
  );
}

export default function GhostRecruiterPage() {
  const [jobId, setJobId]       = useState('');
  const [packet, setPacket]     = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied]   = useState(false);
  const [err, setErr]           = useState('');
  const [jobs, setJobs]         = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    apiFetch('/jobs?limit=10&status=active')
      .then(r => { if (r.success) setJobs(r.data?.jobs || r.data || []); })
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, []);

  async function generate(id?: string) {
    const target = id ?? jobId;
    if (!target.trim()) { setErr('Select or enter a Job ID.'); return; }
    setErr(''); setPacket(null); setApplied(false); setCoverLetter(''); setLoading(true);
    const r = await apiFetch(`/ghost-recruiter/${target}`).catch(() => null);
    if (r?.success) { setPacket(r.data); setJobId(target); setCoverLetter(r.data.coverLetter || ''); }
    else setErr(r?.message || 'Could not generate packet. Check the Job ID.');
    setLoading(false);
  }

  async function applyNow() {
    if (!packet || !jobId) return;
    setApplying(true);
    const r = await apiFetch(`/ghost-recruiter/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ coverLetter }),
    }).catch(() => null);
    if (r?.success) setApplied(true);
    else setErr(r?.message || 'Application failed. You may have already applied.');
    setApplying(false);
  }

  const matchColor = packet
    ? packet.matchPercentage >= 85 ? '#00E5A0'
    : packet.matchPercentage >= 70 ? '#F59E0B' : '#F87171'
    : '#A78BFA';

  return (
    <SidebarLayout navItems={navItems} pageTitle="Ghost Recruiter">
      <div style={{ color: '#E2E8F0' }}>

        {/* Hero */}
        <div className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0A1628 0%,#0D1F3C 50%,#0A1628 100%)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 320, height: 320, background: 'radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 65%)', borderRadius: '50%' }} />
          <div className="absolute pointer-events-none" style={{ bottom: -60, right: 80, width: 220, height: 220, background: 'radial-gradient(circle,rgba(79,142,247,0.1) 0%,transparent 65%)', borderRadius: '50%' }} />
          <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'rgba(167,139,250,0.8)' }}>
                AI Application Co-pilot
              </div>
              <h1 className="font-jakarta font-bold text-[1.8rem] text-white leading-tight mb-2">Ghost Recruiter</h1>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Pick a job. Your skills get reordered, your best projects surface, and a personalised cover letter writes itself.
              </p>
            </div>
            {packet && (
              <div className="flex flex-col items-end gap-1">
                <div className="font-jakarta font-bold text-[2.4rem] leading-none" style={{ color: matchColor }}>
                  {packet.matchPercentage}%
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: `${matchColor}80` }}>
                  Match score
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job picker */}
        <Card className="mb-4">
          <SectionHeader title="Choose a Job" sub="Select from active listings or paste a Job ID directly." />
          {jobsLoading ? (
            <div className="space-y-2 mb-4">{[0,1,2].map(i => <Sk key={i} h="h-12" />)}</div>
          ) : (
            <div className="grid grid-cols-1 gap-2 mb-4 max-h-52 overflow-y-auto">
              {jobs.map(j => (
                <button key={j.id} onClick={() => generate(j.id)}
                  className="text-left px-4 py-3 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{
                    background: jobId === j.id ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${jobId === j.id ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[13px] text-white/85">{j.title}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{j.company} · {j.location}</div>
                    </div>
                    {jobId === j.id && <i className="fas fa-circle-check" style={{ color: '#A78BFA' }} />}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Or paste a Job ID directly"
              value={jobId}
              onChange={e => setJobId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generate()}
              className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <button onClick={() => generate()} disabled={loading}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40"
              style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)' }}>
              {loading ? 'Generating…' : 'Generate packet'}
            </button>
          </div>
          {err && (
            <p className="mt-2 text-[12px]" style={{ color: '#F87171' }}>
              <i className="fas fa-circle-xmark mr-1" />{err}
            </p>
          )}
        </Card>

        {/* Skeleton loader */}
        {loading && (
          <div className="space-y-4">
            <Sk h="h-40" /><Sk h="h-32" /><Sk h="h-24" />
          </div>
        )}

        {/* Packet */}
        {packet && !loading && (
          <>
            {/* Skill reorder */}
            <Card className="mb-4">
              <SectionHeader
                title="Skills — Reordered for This Role"
                sub="Ranked by how strongly the employer's job description weights each skill."
              />
              <div className="grid grid-cols-2 gap-4">
                {/* Default order */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Your default order</div>
                  {packet.skills.reordered.slice(0, 6).map((s: any, i: number) => {
                    const change = packet.skills.reorderChanges.find((c: any) => c.name === s.name);
                    return (
                      <div key={s.name} className="flex items-center gap-2 py-2"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-[12px] w-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {change?.oldRank ?? i + 1}.
                        </span>
                        <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.name}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Reordered */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(167,139,250,0.6)' }}>Reordered for this job</div>
                  {packet.skills.reordered.slice(0, 6).map((s: any, i: number) => {
                    const change = packet.skills.reorderChanges.find((c: any) => c.name === s.name);
                    const moved  = change?.moved ?? 0;
                    return (
                      <div key={s.name} className="flex items-center gap-2 py-2"
                        style={{ borderBottom: '1px solid rgba(167,139,250,0.1)' }}>
                        <span className="text-[12px] font-bold w-5 flex-shrink-0" style={{ color: '#A78BFA' }}>{i + 1}.</span>
                        <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.name}</span>
                        {moved > 0 && (
                          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(0,229,160,0.15)', color: '#00E5A0' }}>
                            ↑{moved}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Cover letter */}
            <Card className="mb-4">
              <SectionHeader
                title="AI-Written Cover Letter"
                sub="Built from your real portfolio, skills, and the employer's job description. Edit before sending."
              />
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-xl text-[13px] leading-relaxed outline-none resize-none text-white/80"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </Card>

            {/* Recommended projects */}
            {packet.projects.recommended.length > 0 && (
              <Card className="mb-4">
                <SectionHeader
                  title="Most Relevant Portfolio Projects"
                  sub="Ranked by how closely they match this role's requirements."
                />
                <div className="space-y-2">
                  {packet.projects.recommended.map((p: any) => (
                    <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.12)' }}>
                      <div className="w-7 h-7 rounded-lg grid place-items-center flex-shrink-0" style={{ background: 'rgba(79,142,247,0.15)' }}>
                        <i className="fas fa-code text-[11px]" style={{ color: '#4F8EF7' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[13px] text-white/85">{p.title}</div>
                        {p.description && (
                          <div className="text-[12px] mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.description}</div>
                        )}
                      </div>
                      {p.liveUrl && (
                        <a href={p.liveUrl} target="_blank" rel="noreferrer"
                          className="text-[11px] font-semibold flex-shrink-0 transition-all hover:opacity-70"
                          style={{ color: '#4F8EF7' }}>
                          View <i className="fas fa-arrow-up-right-from-square text-[9px]" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Apply */}
            <div className="flex items-center gap-4">
              {applied ? (
                <div className="flex items-center gap-2 font-semibold text-[14px]" style={{ color: '#00E5A0' }}>
                  <i className="fas fa-circle-check text-[20px]" />
                  Application submitted! You earned 1 Merit Coin.
                </div>
              ) : (
                <button onClick={applyNow} disabled={applying}
                  className="px-6 py-3 rounded-xl font-semibold text-[14px] transition-all disabled:opacity-40 hover:-translate-y-0.5"
                  style={{ background: 'rgba(0,229,160,0.15)', color: '#00E5A0', border: '1px solid rgba(0,229,160,0.25)' }}>
                  {applying ? 'Submitting…' : 'Apply with this packet'}
                </button>
              )}
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Your cover letter and reordered skills will be sent to the employer.
              </span>
            </div>
          </>
        )}

      </div>
    </SidebarLayout>
  );
}