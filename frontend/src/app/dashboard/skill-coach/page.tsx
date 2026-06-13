'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';

const navItems = [
  { href: '/dashboard',                 icon: 'fa-home',                label: 'Dashboard' },
  { href: '/dashboard/courses',         icon: 'fa-book-open',           label: 'Courses' },
  { href: '/dashboard/career-oracle',   icon: 'fa-brain',               label: 'Career Oracle' },
  { href: '/dashboard/skill-coach',     icon: 'fa-heart-pulse',         label: 'Skill Coach' },
  { href: '/dashboard/peer-genome',     icon: 'fa-users',               label: 'Peer Genome' },
  { href: '/dashboard/skill-decay',     icon: 'fa-chart-line',          label: 'Skill Decay' },
  { href: '/dashboard/ghost-recruiter', icon: 'fa-wand-magic-sparkles', label: 'Ghost Recruiter' },
  { href: '/dashboard/jobs',            icon: 'fa-briefcase',           label: 'Jobs' },
  { href: '/dashboard/certificates',    icon: 'fa-certificate',         label: 'Certificates' },
  { href: '/dashboard/rewards',         icon: 'fa-coins',               label: 'Rewards' },
  { href: '/dashboard/settings',        icon: 'fa-gear',                label: 'Settings' },
];

type EmotionState = 'confident' | 'engaged' | 'struggling' | 'frustrated' | 'disengaged';

const EMOTION: Record<EmotionState, { emoji: string; label: string; accent: string }> = {
  confident:  { emoji: '😄', label: 'Confident',  accent: '#00E5A0' },
  engaged:    { emoji: '🙂', label: 'Engaged',    accent: '#4F8EF7' },
  struggling: { emoji: '😐', label: 'Struggling', accent: '#F59E0B' },
  frustrated: { emoji: '😤', label: 'Frustrated', accent: '#F87171' },
  disengaged: { emoji: '😶', label: 'Disengaged', accent: '#6B7280' },
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

export default function SkillCoachPage() {
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [signalSent, setSignalSent] = useState(false);

  useEffect(() => {
    apiFetch('/skill-coach/state')
      .then(r => { if (r.success) setData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function sendSignal(signalType: string) {
    await apiFetch('/skill-coach/signal', {
      method: 'POST',
      body: JSON.stringify({ signalType, metadata: { source: 'manual_test' } }),
    }).catch(() => {});
    setSignalSent(true);
    setTimeout(() => setSignalSent(false), 2000);
  }

  const days: any[]        = data?.days ?? [];
  const intervention: any  = data?.intervention ?? null;
  const todayEmotion       = days[days.length - 1]?.emotion as EmotionState;
  const todayCfg           = todayEmotion ? EMOTION[todayEmotion] : EMOTION.engaged;

  return (
    <SidebarLayout navItems={navItems} pageTitle="Skill Coach">
      <div style={{ color: '#E2E8F0' }}>

        {/* Hero */}
        <div className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0A1628 0%,#0D1F3C 50%,#0A1628 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 320, height: 320, background: 'radial-gradient(circle,rgba(245,158,11,0.15) 0%,transparent 65%)', borderRadius: '50%' }} />
          <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'rgba(245,158,11,0.8)' }}>
                Emotion-Aware Learning
              </div>
              <h1 className="font-jakarta font-bold text-[1.8rem] text-white leading-tight mb-2">Skill Coach</h1>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Detects frustration, boredom, and confidence from your learning patterns — and adapts your plan in real time.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {loading ? <Sk h="h-8" w="w-28" /> : (
                <>
                  <div className="font-jakarta font-bold text-[2rem] leading-none">{todayCfg.emoji}</div>
                  <div className="font-semibold text-[14px]" style={{ color: todayCfg.accent }}>{todayCfg.label}</div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Today's state</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 7-day heatmap */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-5">
            <span className="font-jakarta font-semibold text-[14px] text-white/90">7-Day Emotional Heatmap</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-7 gap-2">{[0,1,2,3,4,5,6].map(i => <Sk key={i} h="h-20" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {days.map((day: any, i: number) => {
                  const cfg = EMOTION[day.emotion as EmotionState] ?? EMOTION.engaged;
                  return (
                    <div key={day.date} title={day.signals.join(' · ')}
                      className="rounded-xl flex flex-col items-center justify-center py-4 cursor-help transition-all hover:-translate-y-0.5"
                      style={{ background: `${cfg.accent}14`, border: `1px solid ${cfg.accent}30` }}>
                      <span className="text-[22px]">{cfg.emoji}</span>
                      <span className="text-[10px] font-semibold mt-1.5" style={{ color: cfg.accent }}>{DAY_LABELS[i % 7]}</span>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                {Object.entries(EMOTION).map(([key, cfg]) => (
                  <span key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: `${cfg.accent}14`, color: cfg.accent, border: `1px solid ${cfg.accent}25` }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Coach intervention */}
        {intervention && (
          <Card className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl grid place-items-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                <i className="fas fa-comment-dots" style={{ color: '#F59E0B' }} />
              </div>
              <span className="font-jakarta font-semibold text-[14px] text-white/90">Coach Recommendation</span>
            </div>
            <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{intervention.message}</p>
            </div>
            <div className="space-y-2 mb-4">
              {intervention.actions.map((action: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <i className="fas fa-circle-check mt-0.5 text-[11px]" style={{ color: '#00E5A0' }} />
                  <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{action}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <i className="fas fa-clock text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Recommended today:{' '}
                <strong className="text-white/70">{intervention.sessionMinutes} minutes</strong>
              </span>
            </div>
          </Card>
        )}

        {/* Signal recorder */}
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl grid place-items-center" style={{ background: 'rgba(79,142,247,0.15)' }}>
              <i className="fas fa-signal" style={{ color: '#4F8EF7' }} />
            </div>
            <span className="font-jakarta font-semibold text-[14px] text-white/90">Record a Learning Signal</span>
          </div>
          <p className="text-[12px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Normally sent automatically by the player and quiz engine. Use this panel for testing.
          </p>
          <div className="flex flex-wrap gap-2">
            {['replay', 'abandon', 'quiz_retry', 'session_start', 'session_end'].map(sig => (
              <button key={sig} onClick={() => sendSignal(sig)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:opacity-80"
                style={{ background: 'rgba(79,142,247,0.1)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.2)' }}>
                {sig.replace('_', ' ')}
              </button>
            ))}
          </div>
          {signalSent && (
            <div className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: '#00E5A0' }}>
              <i className="fas fa-check-circle" /> Signal recorded.
            </div>
          )}
        </Card>

      </div>
    </SidebarLayout>
  );
}