'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { BrandIcon } from '@/components/ui/BrandIcon';

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
  { href: '/dashboard/resume',      icon: 'fa-file-lines',           label: 'Resume' },
  { href: '/dashboard/platforms',   icon: 'fa-graduation-cap',label: 'Learning Platforms' },
  { href: '/dashboard/jobs',        icon: 'fa-briefcase',     label: 'Jobs' },
  { href: '/dashboard/certificates',icon: 'fa-certificate',   label: 'Certificates' },
  { href: '/dashboard/rewards',     icon: 'fa-coins',         label: 'Rewards' },
  { href: '/dashboard/settings',    icon: 'fa-gear',          label: 'Settings' },
];

type DecayLabel = 'fresh' | 'good' | 'fading' | 'at-risk' | 'cold';

const DECAY: Record<DecayLabel, { bar: string; label: string }> = {
  fresh:    { bar: '#00E5A0', label: 'Fresh'   },
  good:     { bar: '#4F8EF7', label: 'Good'    },
  fading:   { bar: '#F59E0B', label: 'Fading'  },
  'at-risk':{ bar: '#F87171', label: 'At risk' },
  cold:     { bar: '#6B7280', label: 'Cold'    },
};

type FilterType = 'all' | DecayLabel;

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

/* ────────────────────────────────────────────────────────────────────────
   Retention timeline — dependency-free SVG (matches the hand-rolled bar style).
   No new backend fields: each skill's decay constant is solved from the data
   you already return — S = -daysSinceUse / ln(freshness / 100). Each line holds
   at 100 until the last-use day, then decays, and projects 120 days forward.
   ──────────────────────────────────────────────────────────────────────── */
const DAY_MIN = -90;
const DAY_MAX = 120;
const STEP = 6;

function skillSeries(s: any) {
  const days = Math.max(0, s.daysSinceUse ?? 0);
  const f = Math.max(1, Math.min(100, s.freshness ?? 100));
  const S = days <= 0 || f >= 100 ? Infinity : -days / Math.log(f / 100);
  const at = (x: number) => {
    const elapsed = days + x;
    if (elapsed <= 0) return 100;
    return S === Infinity ? 100 : 100 * Math.exp(-elapsed / S);
  };
  const pts: [number, number][] = [];
  for (let x = DAY_MIN; x <= DAY_MAX; x += STEP) pts.push([x, at(x)]);
  return pts;
}

function RetentionTimeline({
  skills, focused, setFocused,
}: { skills: any[]; focused: string | null; setFocused: (v: string | null) => void }) {
  const W = 720, H = 250;
  const pad = { l: 30, r: 14, t: 12, b: 26 };
  const xScale = (x: number) => pad.l + ((x - DAY_MIN) / (DAY_MAX - DAY_MIN)) * (W - pad.l - pad.r);
  const yScale = (v: number) => pad.t + ((100 - v) / 100) * (H - pad.t - pad.b);
  const fmtDay = (d: number) => (d === 0 ? 'Today' : d < 0 ? `${d}d` : `+${d}d`);
  const xTicks = [-90, -60, -30, 0, 30, 60, 90, 120];

  const series = useMemo(
    () => skills.map((s) => ({
      key: s.skill,
      color: (DECAY[s.label as DecayLabel] ?? DECAY.cold).bar,
      pts: skillSeries(s),
      current: s.freshness,
    })),
    [skills]
  );

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* projection region (future) */}
        <rect x={xScale(0)} y={pad.t} width={xScale(DAY_MAX) - xScale(0)} height={H - pad.t - pad.b}
          fill="#4F8EF7" opacity={0.04} />
        {/* horizontal grid + y labels */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={yScale(v)} y2={yScale(v)} stroke="rgba(255,255,255,0.06)" />
            <text x={pad.l - 6} y={yScale(v) + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">{v}</text>
          </g>
        ))}
        {/* x ticks */}
        {xTicks.map((d) => (
          <text key={d} x={xScale(d)} y={H - 8} textAnchor="middle" fontSize="9"
            fill={d === 0 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.28)'}>{fmtDay(d)}</text>
        ))}
        {/* today marker */}
        <line x1={xScale(0)} x2={xScale(0)} y1={pad.t} y2={H - pad.b} stroke="rgba(255,255,255,0.28)" strokeDasharray="3 3" />
        {/* skill lines */}
        {series.map((s) => {
          const dim = focused && focused !== s.key;
          const path = s.pts.map((p, i) => `${i ? 'L' : 'M'}${xScale(p[0]).toFixed(1)} ${yScale(p[1]).toFixed(1)}`).join(' ');
          return (
            <path key={s.key} d={path} fill="none" stroke={s.color}
              strokeWidth={focused === s.key ? 2.6 : 1.5}
              strokeOpacity={dim ? 0.12 : focused === s.key ? 1 : 0.5}
              strokeLinejoin="round" />
          );
        })}
        {/* focused endpoint dot @ today */}
        {focused && (() => {
          const s = series.find((x) => x.key === focused);
          if (!s) return null;
          return <circle cx={xScale(0)} cy={yScale(s.current)} r={3.5} fill={s.color} />;
        })()}
      </svg>

      {/* legend / focus chips */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {skills.map((s: any) => {
          const cfg = DECAY[s.label as DecayLabel] ?? DECAY.cold;
          const active = focused === s.skill;
          return (
            <button key={s.skill} onClick={() => setFocused(active ? null : s.skill)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-all"
              style={{
                background: active ? `${cfg.bar}20` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? cfg.bar + '60' : 'rgba(255,255,255,0.07)'}`,
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
              }}>
              <span style={{ width: 7, height: 7, borderRadius: 7, background: cfg.bar }} />
              {s.skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* AI analysis chat — posts to your backend, which calls Gemini (see the
   companion route file). Grounded in the skills/summary already on screen. */
type Msg = { role: 'user' | 'assistant'; content: string };

function AnalyzePanel({ skills, summary }: { skills: any[]; summary: any }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const quickPrompts = [
    'What should I refresh this week?',
    'Which skills are most at risk, and why?',
    'Draft a focused 30-day refresher plan',
    'Explain the decay on my weakest skill',
  ];

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    const next = [...messages, { role: 'user' as const, content: question }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      // apiFetch is expected to set Content-Type: application/json.
      const r = await apiFetch('/skill-decay/analyze', {
        method: 'POST',
        body: JSON.stringify({ question, history: next, context: { skills, summary } }),
      }).catch(() => null);
      const answer = r?.success ? (r.data?.answer ?? r.data?.reply ?? '') : '';
      setMessages((m) => [...m, { role: 'assistant', content: answer || "I couldn't analyze that just now — try again." }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Analysis failed to load. Check your connection and try again.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 300 }}>
      <div className="flex items-center gap-2 mb-3">
        <BrandIcon name="fa-wand-magic-sparkles" style={{ color: '#4F8EF7' }} />
        <span className="font-jakarta font-semibold text-[14px] text-white/90">Analyze with AI</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2.5 pr-1" style={{ maxHeight: 240 }}>
        {messages.length === 0 ? (
          <div className="space-y-2">
            {quickPrompts.map((q) => (
              <button key={q} onClick={() => ask(q)}
                className="w-full text-left rounded-xl px-3 py-2.5 text-[12.5px] transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}>
                {q}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className="rounded-2xl px-3 py-2 text-[12.5px] whitespace-pre-wrap"
                style={{
                  maxWidth: '90%',
                  background: m.role === 'user' ? '#4F8EF7' : 'rgba(255,255,255,0.04)',
                  border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,0.75)',
                  lineHeight: 1.5,
                }}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {busy && (
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#4F8EF7' }} />
            Reading the decay curves…
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 rounded-xl px-3 py-2"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask(input)}
          placeholder="Ask about these skills…"
          className="flex-1 bg-transparent outline-none text-[12.5px]"
          style={{ color: '#E2E8F0' }}
        />
        <button onClick={() => ask(input)} disabled={busy || !input.trim()}
          className="rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-40"
          style={{ background: input.trim() && !busy ? '#4F8EF7' : 'rgba(255,255,255,0.06)' }}>
          <BrandIcon name="fa-paper-plane" style={{ color: '#fff', fontSize: 12 }} />
        </button>
      </div>
    </div>
  );
}

export default function SkillDecayPage() {
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [focused, setFocused]     = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/skill-decay')
      .then(r => { if (r.success) setData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function refreshSkill(skillName: string) {
    setRefreshing(skillName);
    const r = await apiFetch(`/skill-decay/refresh/${encodeURIComponent(skillName)}`, { method: 'POST' }).catch(() => null);
    if (r?.success) {
      setData((prev: any) => ({
        ...prev,
        skills: prev.skills.map((s: any) =>
          s.skill === skillName ? { ...s, freshness: 100, label: 'fresh', isAlert: false, isCritical: false } : s
        ),
        alerts: prev.alerts.filter((a: any) => a.skill !== skillName),
      }));
    }
    setRefreshing(null);
  }

  const skills: any[]  = data?.skills ?? [];
  const alerts: any[]  = data?.alerts ?? [];
  const summary: any   = data?.summary ?? {};
  const atRiskCount    = (summary.atRisk ?? 0) + (summary.cold ?? 0);
  const filtered       = filter === 'all' ? skills : skills.filter((s: any) => s.label === filter);

  return (
    <SidebarLayout navItems={navItems} pageTitle="Skill Decay">
      <div style={{ color: '#E2E8F0' }}>

        {/* Hero */}
        <div className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0A1628 0%,#0D1F3C 50%,#0A1628 100%)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 320, height: 320, background: 'radial-gradient(circle,rgba(248,113,113,0.15) 0%,transparent 65%)', borderRadius: '50%' }} />
          <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'rgba(248,113,113,0.8)' }}>
                Live Skill Monitor
              </div>
              <h1 className="font-jakarta font-bold text-[1.8rem] text-white leading-tight mb-2">Skill Decay</h1>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Most platforms show what you know. This shows what you're forgetting — before it costs you a job.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {loading ? <Sk h="h-10" w="w-16" /> : (
                <>
                  <div className="font-jakarta font-bold text-[2.4rem] leading-none" style={{ color: atRiskCount > 0 ? '#F87171' : '#00E5A0' }}>
                    {atRiskCount}
                  </div>
                  <div className="font-semibold text-[11px] uppercase tracking-widest" style={{ color: atRiskCount > 0 ? 'rgba(248,113,113,0.6)' : 'rgba(0,229,160,0.6)' }}>
                    Skills at risk
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Alert banners */}
        {!loading && alerts.length > 0 && (
          <div className="space-y-2 mb-5">
            {alerts.map((a: any) => (
              <div key={a.skill} className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <BrandIcon name="fa-triangle-exclamation" className="mt-0.5" style={{ color: '#F87171' }} />
                <p className="flex-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{a.message}</p>
                <button onClick={() => refreshSkill(a.skill)} disabled={refreshing === a.skill}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 whitespace-nowrap"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                  {refreshing === a.skill ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        {!loading && (
          <div className="grid grid-cols-5 gap-2 mb-5">
            {(['fresh', 'good', 'fading', 'at-risk', 'cold'] as DecayLabel[]).map(label => {
              const cfg   = DECAY[label];
              const count = label === 'fresh' ? summary.fresh : label === 'good' ? summary.good :
                            label === 'fading' ? summary.fading : label === 'at-risk' ? summary.atRisk : summary.cold;
              const active = filter === label;
              return (
                <button key={label} onClick={() => setFilter(active ? 'all' : label)}
                  className="rounded-xl p-3 text-center transition-all hover:-translate-y-0.5"
                  style={{
                    background: active ? `${cfg.bar}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? cfg.bar + '50' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <div className="font-jakarta font-bold text-[20px]" style={{ color: cfg.bar }}>{count ?? 0}</div>
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: active ? cfg.bar : 'rgba(255,255,255,0.3)' }}>{cfg.label}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* NEW — Retention timeline + AI analysis */}
        {!loading && skills.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-4 mb-5">
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-jakarta font-semibold text-[14px] text-white/90">Retention over time</span>
                  <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>90d back · 120d projected</span>
                </div>
                <p className="text-[11.5px] mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Each line holds at full until its last use, then decays. Tap a skill to isolate it.
                </p>
                <RetentionTimeline skills={skills} focused={focused} setFocused={setFocused} />
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card className="h-full">
                <AnalyzePanel skills={skills} summary={summary} />
              </Card>
            </div>
          </div>
        )}

        {/* Skills list */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <span className="font-jakarta font-semibold text-[14px] text-white/90">
              {filter === 'all' ? 'All Skills' : `${DECAY[filter as DecayLabel]?.label} Skills`}
            </span>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-[12px] font-semibold transition-all hover:opacity-70"
                style={{ color: '#4F8EF7' }}>
                Show all
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">{[0,1,2,3,4].map(i => <Sk key={i} h="h-10" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No skills in this category. Add skills to your profile to track them.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((s: any) => {
                const cfg = DECAY[s.label as DecayLabel] ?? DECAY.cold;
                const isFocused = focused === s.skill;
                return (
                  <div key={s.skill} onClick={() => setFocused(isFocused ? null : s.skill)}
                    className="flex items-center gap-3 py-2 cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isFocused ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    <div className="w-28 flex-shrink-0">
                      <div className="font-medium text-[13px] text-white/80 truncate">{s.skill}</div>
                      <div className="text-[11px] capitalize mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.level}</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${s.freshness}%`, background: cfg.bar }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {s.daysSinceUse}d since last use
                        </span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {s.demandCount} active jobs
                        </span>
                      </div>
                    </div>
                    <div className="w-16 text-right flex-shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
                        style={{ background: `${cfg.bar}18`, color: cfg.bar }}>
                        {cfg.label}
                      </span>
                    </div>
                    {(s.isAlert || s.isCritical) && (
                      <button onClick={(e) => { e.stopPropagation(); refreshSkill(s.skill); }} disabled={refreshing === s.skill}
                        title="Mark as recently used"
                        className="text-[11px] px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {refreshing === s.skill ? '…' : 'Refresh'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>
    </SidebarLayout>
  );
}
