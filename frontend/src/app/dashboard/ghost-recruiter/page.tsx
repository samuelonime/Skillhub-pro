'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',                 icon: 'fa-home',                 label: 'Dashboard' },
  { href: '/dashboard/courses',         icon: 'fa-book-open',            label: 'Courses' },
  { href: '/dashboard/career-oracle',   icon: 'fa-brain',                label: 'Career Oracle' },
  { href: '/dashboard/skill-coach',     icon: 'fa-heart-pulse',          label: 'Skill Coach' },
  { href: '/dashboard/peer-genome',     icon: 'fa-users',                label: 'Peer Genome' },
  { href: '/dashboard/skill-decay',     icon: 'fa-chart-line',           label: 'Skill Decay' },
  { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles',  label: 'Ghost Recruiter' },
  { href: '/dashboard/jobs',            icon: 'fa-briefcase',            label: 'Jobs' },
  { href: '/dashboard/certificates',    icon: 'fa-certificate',          label: 'Certificates' },
  { href: '/dashboard/rewards',         icon: 'fa-coins',                label: 'Rewards' },
  { href: '/dashboard/settings',        icon: 'fa-gear',                 label: 'Settings' },
];

function Skeleton({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded bg-[#f0f0f8] animate-pulse`} />;
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

  useEffect(() => {
    apiFetch('/jobs?limit=10&status=active')
      .then(r => { if (r.success) setJobs(r.data?.jobs || r.data || []); })
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, []);

  async function generate(id?: string) {
    const target = id ?? jobId;
    if (!target.trim()) { setErr('Enter or select a Job ID.'); return; }
    setErr('');
    setPacket(null);
    setApplied(false);
    setLoading(true);
    const r = await apiFetch(`/ghost-recruiter/${target}`).catch(() => null);
    if (r?.success) {
      setPacket(r.data);
      setJobId(target);
    } else {
      setErr(r?.message || 'Could not generate packet. Check the Job ID.');
    }
    setLoading(false);
  }

  async function applyNow() {
    if (!packet || !jobId) return;
    setApplying(true);
    const r = await apiFetch(`/ghost-recruiter/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ coverLetter: packet.coverLetter }),
    }).catch(() => null);
    if (r?.success) setApplied(true);
    else setErr(r?.message || 'Application failed. You may have already applied.');
    setApplying(false);
  }

  return (
    <SidebarLayout navItems={navItems} pageTitle="Ghost Recruiter">

      {/* Header */}
      <div className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-4 flex-wrap relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
        <div className="absolute rounded-full pointer-events-none"
          style={{ top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.08)' }} />
        <div className="relative z-[1]">
          <h2 className="font-syne font-bold text-[20px] text-white mb-1">
            <i className="fas fa-wand-magic-sparkles mr-2" /> Ghost Recruiter
          </h2>
          <p className="text-white/80 text-sm">
            Pick a job. Your skills get reordered, your best projects surface, and a personalised cover letter writes itself — in seconds.
          </p>
        </div>
        {packet && (
          <div className="relative z-[1] px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.18)' }}>
            <div className="text-[11px] text-white/70 mb-0.5">Match score</div>
            <div className="font-syne font-extrabold text-white text-[22px]">{packet.matchPercentage}%</div>
          </div>
        )}
      </div>

      {/* Job picker */}
      <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5 mb-5">
        <h3 className="font-syne font-bold text-[15px] mb-3">Choose a job</h3>
        {jobsLoading ? (
          <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} h="h-10" />)}</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 mb-4 max-h-52 overflow-y-auto">
            {jobs.map(j => (
              <button key={j.id}
                onClick={() => generate(j.id)}
                className={`text-left px-4 py-3 rounded-xl border transition-all ${
                  jobId === j.id
                    ? 'border-[#059669] bg-[#f0fdf4]'
                    : 'border-[#e8e8f0] hover:border-[#059669] hover:bg-[#f0fdf4]'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[13px] text-[#374151]">{j.title}</div>
                    <div className="text-[12px] text-[#6b7280]">{j.company} · {j.location}</div>
                  </div>
                  {jobId === j.id && <i className="fas fa-circle-check text-[#059669]" />}
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
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#e8e8f0] text-[13px] outline-none focus:border-[#059669]"
          />
          <button
            onClick={() => generate()}
            disabled={loading}
            className="px-5 py-2.5 bg-[#059669] text-white rounded-xl text-[13px] font-semibold hover:bg-[#047857] transition-all disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate packet'}
          </button>
        </div>
        {err && <p className="mt-2 text-[12px] text-[#ef4444]"><i className="fas fa-circle-xmark mr-1" />{err}</p>}
      </div>

      {/* Generated packet */}
      {loading && (
        <div className="space-y-4">
          <Skeleton h="h-40" />
          <Skeleton h="h-32" />
          <Skeleton h="h-24" />
        </div>
      )}

      {packet && !loading && (
        <>
          {/* Skill reorder */}
          <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5 mb-4">
            <h3 className="font-syne font-bold text-[15px] mb-1">
              <i className="fas fa-arrows-up-down text-[#5b4cf5] mr-2" />
              Skills — reordered for this role
            </h3>
            <p className="text-[12px] text-[#6b7280] mb-4">
              Your skills are ranked by how strongly the employer's job description weights each one.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Original order */}
              <div>
                <div className="text-[11px] text-[#9ca3af] uppercase tracking-wide mb-2">Your default order</div>
                {packet.skills.reordered.slice(0, 6).map((s: any, i: number) => {
                  const change = packet.skills.reorderChanges.find((c: any) => c.name === s.name);
                  return (
                    <div key={s.name} className="flex items-center gap-2 py-1.5 border-b border-[#f5f5fb] last:border-0">
                      <span className="text-[12px] text-[#9ca3af] w-5">{change?.oldRank ?? i + 1}.</span>
                      <span className="text-[13px] text-[#6b7280]">{s.name}</span>
                    </div>
                  );
                })}
              </div>
              {/* Reordered */}
              <div className="bg-[#f0fdf4] rounded-xl p-3">
                <div className="text-[11px] text-[#166534] uppercase tracking-wide mb-2">Reordered for this job</div>
                {packet.skills.reordered.slice(0, 6).map((s: any, i: number) => {
                  const change = packet.skills.reorderChanges.find((c: any) => c.name === s.name);
                  const moved  = change?.moved ?? 0;
                  return (
                    <div key={s.name} className="flex items-center gap-2 py-1.5 border-b border-[#bbf7d0] last:border-0">
                      <span className="text-[12px] text-[#166534] font-bold w-5">{i + 1}.</span>
                      <span className="text-[13px] font-medium text-[#166534]">{s.name}</span>
                      {moved > 0 && (
                        <span className="ml-auto text-[10px] text-[#15803d] bg-[#dcfce7] px-1.5 py-0.5 rounded font-bold">
                          ↑{moved}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cover letter */}
          <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5 mb-4">
            <h3 className="font-syne font-bold text-[15px] mb-1">
              <i className="fas fa-envelope-open-text text-[#059669] mr-2" />
              AI-written cover letter
            </h3>
            <p className="text-[12px] text-[#6b7280] mb-4">
              Written using your real portfolio, skills, and the employer's job description. Edit before sending.
            </p>
            <textarea
              defaultValue={packet.coverLetter}
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-[#e8e8f0] text-[13px] leading-relaxed outline-none focus:border-[#059669] resize-none"
            />
          </div>

          {/* Recommended projects */}
          {packet.projects.recommended.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5 mb-4">
              <h3 className="font-syne font-bold text-[15px] mb-3">
                <i className="fas fa-layer-group text-[#5b4cf5] mr-2" />
                Most relevant portfolio projects
              </h3>
              <div className="space-y-2">
                {packet.projects.recommended.map((p: any) => (
                  <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#f5f5fb] border border-[#e8e8f0]">
                    <i className="fas fa-code text-[#5b4cf5] mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-[13px]">{p.title}</div>
                      {p.description && (
                        <div className="text-[12px] text-[#6b7280] mt-0.5 line-clamp-2">{p.description}</div>
                      )}
                    </div>
                    {p.liveUrl && (
                      <a href={p.liveUrl} target="_blank" rel="noreferrer"
                        className="text-[11px] text-[#5b4cf5] hover:underline flex-shrink-0">
                        View <i className="fas fa-arrow-up-right-from-square text-[9px]" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          <div className="flex items-center gap-3">
            {applied ? (
              <div className="flex items-center gap-2 text-[#10b981] font-semibold text-[14px]">
                <i className="fas fa-circle-check text-[20px]" />
                Application submitted! You earned 10 Merit Coins.
              </div>
            ) : (
              <button
                onClick={applyNow}
                disabled={applying}
                className="px-6 py-3 bg-[#059669] text-white rounded-xl font-semibold text-[14px] hover:bg-[#047857] transition-all disabled:opacity-50">
                {applying ? 'Submitting…' : 'Apply with this packet'}
              </button>
            )}
            <span className="text-[12px] text-[#9ca3af]">
              Your cover letter and skill order will be sent to the employer.
            </span>
          </div>
        </>
      )}

    </SidebarLayout>
  );
}
