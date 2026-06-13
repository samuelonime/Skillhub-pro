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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // ADDED: error state
  const [signalSent, setSignalSent] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiFetch('/skill-coach/state');
        
        if (mounted) {
          if (response && response.success) {
            setData(response.data);
          } else {
            // Handle API error gracefully
            console.error('API returned error:', response);
            setError(response?.message || 'Failed to load coach data');
            // Set empty data structure to prevent rendering errors
            setData({ days: [], intervention: null });
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Skill coach fetch error:', err);
          setError('Unable to connect to the learning coach. Please check your connection.');
          setData({ days: [], intervention: null });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, []);

  async function sendSignal(signalType: string) {
    try {
      await apiFetch('/skill-coach/signal', {
        method: 'POST',
        body: JSON.stringify({ signalType, metadata: { source: 'manual_test' } }),
      });
      setSignalSent(true);
      setTimeout(() => setSignalSent(false), 2000);
    } catch (err) {
      console.error('Failed to send signal:', err);
    }
  }

  // SAFE DATA ACCESS with fallbacks
  const days: any[] = data?.days ?? [];
  const intervention: any = data?.intervention ?? null;
  
  // Safe access to today's emotion with fallback
  const todayEmotion = (days.length > 0 ? days[days.length - 1]?.emotion : null) as EmotionState | null;
  const todayCfg = todayEmotion && EMOTION[todayEmotion] ? EMOTION[todayEmotion] : EMOTION.engaged;

  // Generate consistent day labels for heatmap (always 7 items)
  const heatmapDays = days.length === 7 ? days : [];
  
  // Show error state if needed
  if (error && !loading) {
    return (
      <SidebarLayout navItems={navItems} pageTitle="Skill Coach">
        <div className="text-center py-12">
          <div className="mb-4">
            <i className="fas fa-exclamation-triangle text-4xl mb-3" style={{ color: '#F87171' }} />
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg transition-all"
            style={{ background: 'rgba(79,142,247,0.2)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.3)' }}
          >
            Try Again
          </button>
        </div>
      </SidebarLayout>
    );
  }

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
            <div className="grid grid-cols-7 gap-2">
              {[0,1,2,3,4,5,6].map(i => <Sk key={i} h="h-20" />)}
            </div>
          ) : heatmapDays.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Not enough learning data yet. Complete some courses to see your emotional heatmap.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {heatmapDays.map((day: any, i: number) => {
                  const emotion = day.emotion as EmotionState;
                  const cfg = EMOTION[emotion] ?? EMOTION.engaged;
                  const signals = day.signals ?? [];
                  return (
                    <div key={day.date || i} 
                      title={signals.length > 0 ? signals.join(' · ') : 'No activity recorded'}
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

        {/* Coach intervention - only show if intervention exists and not loading */}
        {!loading && intervention && intervention.message && (
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
            {intervention.actions && intervention.actions.length > 0 && (
              <div className="space-y-2 mb-4">
                {intervention.actions.map((action: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <i className="fas fa-circle-check mt-0.5 text-[11px]" style={{ color: '#00E5A0' }} />
                    <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{action}</span>
                  </div>
                ))}
              </div>
            )}
            {intervention.sessionMinutes && (
              <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <i className="fas fa-clock text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Recommended today:{' '}
                  <strong className="text-white/70">{intervention.sessionMinutes} minutes</strong>
                </span>
              </div>
            )}
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