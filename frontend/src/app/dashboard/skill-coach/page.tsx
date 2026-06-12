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

type EmotionState = 'confident' | 'engaged' | 'struggling' | 'frustrated' | 'disengaged';

const EMOTION_CONFIG: Record<EmotionState, { emoji: string; label: string; bg: string; textColor: string }> = {
  confident:  { emoji: '😄', label: 'Confident',  bg: '#f0fdf4', textColor: '#15803d' },
  engaged:    { emoji: '🙂', label: 'Engaged',    bg: '#eff6ff', textColor: '#1d4ed8' },
  struggling: { emoji: '😐', label: 'Struggling', bg: '#fffbeb', textColor: '#92400e' },
  frustrated: { emoji: '😤', label: 'Frustrated', bg: '#fef2f2', textColor: '#b91c1c' },
  disengaged: { emoji: '😶', label: 'Disengaged', bg: '#f5f5fb', textColor: '#6b6b8a' },
};

function Skeleton({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded bg-[#f0f0f8] animate-pulse`} />;
}

export default function SkillCoachPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signalSent, setSignalSent] = useState(false);

  useEffect(() => {
    apiFetch('/skill-coach/state')
      .then(r => { if (r.success) setData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Demo: manually record a behavioural signal
  async function sendSignal(signalType: string) {
    await apiFetch('/skill-coach/signal', {
      method: 'POST',
      body: JSON.stringify({ signalType, metadata: { source: 'manual_test' } }),
    }).catch(() => {});
    setSignalSent(true);
    setTimeout(() => setSignalSent(false), 2000);
  }

  const days: any[] = data?.days ?? [];
  const intervention: any = data?.intervention ?? null;

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SidebarLayout navItems={navItems} pageTitle="Skill Coach">

      {/* Header */}
      <div className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-4 flex-wrap relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
        <div className="absolute rounded-full pointer-events-none"
          style={{ top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.08)' }} />
        <div className="relative z-[1]">
          <h2 className="font-syne font-bold text-[20px] text-white mb-1">
            <i className="fas fa-heart-pulse mr-2" /> Emotion-Aware Coach
          </h2>
          <p className="text-white/80 text-sm">
            Detects frustration, boredom, and confidence from your learning patterns — and adapts your plan in real time.
          </p>
        </div>
        <div className="relative z-[1] px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.18)' }}>
          <div className="text-[11px] text-white/70 mb-0.5">Today's state</div>
          {loading ? (
            <Skeleton h="h-6" w="w-20" />
          ) : (
            <div className="font-syne font-extrabold text-white text-[18px]">
              {days.length ? EMOTION_CONFIG[days[days.length - 1]?.emotion as EmotionState]?.emoji ?? '🙂' : '🙂'}{' '}
              {days.length ? EMOTION_CONFIG[days[days.length - 1]?.emotion as EmotionState]?.label ?? 'Engaged' : 'Engaged'}
            </div>
          )}
        </div>
      </div>

      {/* 7-day heatmap */}
      <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5 mb-5">
        <h3 className="font-syne font-bold text-[15px] mb-4">7-day emotional heatmap</h3>
        {loading ? (
          <div className="flex gap-3">
            {[0,1,2,3,4,5,6].map(i => <Skeleton key={i} h="h-16" w="w-full" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {days.map((day: any, i: number) => {
                const cfg = EMOTION_CONFIG[day.emotion as EmotionState];
                return (
                  <div key={day.date} title={day.signals.join(' · ')}
                    className="rounded-xl flex flex-col items-center justify-center py-3 cursor-help"
                    style={{ background: cfg?.bg ?? '#f5f5fb' }}>
                    <span className="text-[22px]">{cfg?.emoji ?? '🙂'}</span>
                    <span className="text-[10px] mt-1" style={{ color: cfg?.textColor ?? '#6b6b8a' }}>
                      {dayLabels[i % 7]}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(EMOTION_CONFIG).map(([key, cfg]) => (
                <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px]"
                  style={{ background: cfg.bg, color: cfg.textColor }}>
                  {cfg.emoji} {cfg.label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Coach intervention */}
      {intervention && (
        <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5 mb-5">
          <h3 className="font-syne font-bold text-[15px] mb-1">
            <i className="fas fa-comment-dots text-[#f59e0b] mr-2" />
            Coach recommendation
          </h3>
          <div className="mt-3 p-4 rounded-xl bg-[#fffbeb] border border-[#fde68a]">
            <p className="text-[13px] text-[#92400e] leading-relaxed">{intervention.message}</p>
          </div>
          <div className="mt-3">
            <div className="text-[12px] text-[#6b7280] mb-2">Suggested actions</div>
            <ul className="space-y-1.5">
              {intervention.actions.map((action: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[#374151]">
                  <i className="fas fa-circle-check text-[#10b981] mt-0.5 text-[11px]" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <i className="fas fa-clock text-[#6b7280] text-[12px]" />
            <span className="text-[12px] text-[#6b7280]">
              Recommended session length today:{' '}
              <strong className="text-[#374151]">{intervention.sessionMinutes} minutes</strong>
            </span>
          </div>
        </div>
      )}

      {/* Signal recorder (dev/demo tool) */}
      <div className="bg-white rounded-2xl border border-[#e8e8f0] p-5">
        <h3 className="font-syne font-bold text-[15px] mb-1">
          <i className="fas fa-signal text-[#5b4cf5] mr-2" />
          Record a learning signal
        </h3>
        <p className="text-[12px] text-[#6b7280] mb-4">
          These are normally sent automatically by the player/quiz. Use this panel for testing.
        </p>
        <div className="flex flex-wrap gap-2">
          {['replay', 'abandon', 'quiz_retry', 'session_start', 'session_end'].map(sig => (
            <button key={sig} onClick={() => sendSignal(sig)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[#e8e8f0] bg-[#f5f5fb] text-[#5b4cf5] hover:bg-[#5b4cf5] hover:text-white transition-all">
              {sig.replace('_', ' ')}
            </button>
          ))}
        </div>
        {signalSent && (
          <div className="mt-3 text-[12px] text-[#10b981]">
            <i className="fas fa-check-circle mr-1" /> Signal recorded successfully.
          </div>
        )}
      </div>

    </SidebarLayout>
  );
}
