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

const TIER: Record<string, { icon: string; accent: string }> = {
  platinum: { icon: '💎', accent: '#A78BFA' },
  gold:     { icon: '🥇', accent: '#F59E0B' },
  silver:   { icon: '🥈', accent: '#94A3B8' },
  bronze:   { icon: '🥉', accent: '#CD7C54' },
};

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

interface Peer {
  alias: string; location: string; title: string; tier: string;
  progressed: boolean; outcome: string; keyMoves: string[]; skills: string[]; matchScore: number;
}

export default function PeerGenomePage() {
  const [peers, setPeers]     = useState<Peer[]>([]);
  const [myTier, setMyTier]   = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    apiFetch('/peer-genome')
      .then(r => {
        if (r.success) {
          setPeers(r.data.peers || []);
          setMyTier(r.data.requesterTier || '');
          if (r.data.message) setMsg(r.data.message);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myTierCfg = myTier ? TIER[myTier] : null;

  return (
    <SidebarLayout navItems={navItems} pageTitle="Peer Genome">
      <div style={{ color: '#E2E8F0' }}>

        {/* Hero */}
        <div className="relative rounded-2xl p-7 mb-5 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0A1628 0%,#0D1F3C 50%,#0A1628 100%)', border: '1px solid rgba(0,229,160,0.2)' }}>
          <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 320, height: 320, background: 'radial-gradient(circle,rgba(0,229,160,0.15) 0%,transparent 65%)', borderRadius: '50%' }} />
          <div className="relative z-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'rgba(0,229,160,0.8)' }}>
                Proof by Example
              </div>
              <h1 className="font-jakarta font-bold text-[1.8rem] text-white leading-tight mb-2">Peer Genome</h1>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Anonymised learners who were exactly where you are 6–18 months ago. See what worked — and what didn't.
              </p>
            </div>
            {myTierCfg && (
              <div className="flex flex-col items-end gap-1">
                <div className="font-jakarta font-bold text-[2rem] leading-none">{myTierCfg.icon}</div>
                <div className="font-semibold text-[14px] capitalize" style={{ color: myTierCfg.accent }}>{myTier} Tier</div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Your current level</div>
              </div>
            )}
          </div>
        </div>

        {/* Privacy notice */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-5"
          style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)' }}>
          <i className="fas fa-shield-halved mt-0.5" style={{ color: '#00E5A0' }} />
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            All peer profiles are fully anonymised. No names, emails, or identifiable information are ever shared.
            Matching uses skills, location region, role level, and learning velocity only.
          </p>
        </div>

        {/* Peer cards */}
        {loading ? (
          <div className="space-y-4">{[0,1,2].map(i => <Sk key={i} h="h-44" />)}</div>
        ) : msg ? (
          <Card>
            <div className="py-8 text-center">
              <i className="fas fa-users-slash text-[40px] block mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{msg}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {peers.map((peer, i) => {
              const tierCfg = TIER[peer.tier] ?? TIER.bronze;
              return (
                <Card key={i}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl grid place-items-center"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <i className="fas fa-user-circle text-[20px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                      <div>
                        <div className="font-jakarta font-semibold text-[14px] text-white/90">{peer.alias}</div>
                        <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{peer.title} · {peer.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize"
                        style={{ background: `${tierCfg.accent}18`, color: tierCfg.accent, border: `1px solid ${tierCfg.accent}30` }}>
                        {tierCfg.icon} {peer.tier}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.2)' }}>
                        {peer.matchScore}% match
                      </span>
                    </div>
                  </div>

                  {/* Outcome */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-4"
                    style={{
                      background: peer.progressed ? 'rgba(0,229,160,0.1)' : 'rgba(248,113,113,0.1)',
                      color: peer.progressed ? '#00E5A0' : '#F87171',
                      border: `1px solid ${peer.progressed ? 'rgba(0,229,160,0.2)' : 'rgba(248,113,113,0.2)'}`,
                    }}>
                    <i className={`fas ${peer.progressed ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-[10px]`} />
                    {peer.outcome}
                  </div>

                  {/* Key moves */}
                  <div className="mb-4">
                    <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>What they did</div>
                    <div className="space-y-1.5">
                      {peer.keyMoves.map((move, j) => (
                        <div key={j} className="flex items-start gap-2.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                          <i className={`fas ${peer.progressed ? 'fa-circle-check' : 'fa-circle-xmark'} mt-0.5 text-[11px]`}
                            style={{ color: peer.progressed ? '#00E5A0' : '#F87171' }} />
                          {move}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  {peer.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                      {peer.skills.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{ background: 'rgba(79,142,247,0.1)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.15)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </SidebarLayout>
  );
}