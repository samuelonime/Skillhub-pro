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

const TIER_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  platinum: { bg: '#f4f2ff', text: '#7c3aed', icon: '💎' },
  gold:     { bg: '#fffbeb', text: '#92400e', icon: '🥇' },
  silver:   { bg: '#f5f5fb', text: '#4b5563', icon: '🥈' },
  bronze:   { bg: '#fef3c7', text: '#92400e', icon: '🥉' },
};

function Skeleton({ h = 'h-4', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded bg-[#f0f0f8] animate-pulse`} />;
}

interface Peer {
  alias:       string;
  location:    string;
  title:       string;
  tier:        string;
  progressed:  boolean;
  outcome:     string;
  keyMoves:    string[];
  skills:      string[];
  matchScore:  number;
}

export default function PeerGenomePage() {
  const [peers, setPeers]   = useState<Peer[]>([]);
  const [myTier, setMyTier] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]       = useState('');

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

  return (
    <SidebarLayout navItems={navItems} pageTitle="Peer Genome">

      {/* Header */}
      <div className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-4 flex-wrap relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
        <div className="absolute rounded-full pointer-events-none"
          style={{ top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.08)' }} />
        <div className="relative z-[1]">
          <h2 className="font-syne font-bold text-[20px] text-white mb-1">
            <i className="fas fa-users mr-2" /> Peer Genome
          </h2>
          <p className="text-white/80 text-sm">
            Anonymised learners who were exactly where you are 6–18 months ago. See what they did — and what didn't work.
          </p>
        </div>
        {myTier && (
          <div className="relative z-[1] px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.18)' }}>
            <div className="text-[11px] text-white/70 mb-0.5">Your current tier</div>
            <div className="font-syne font-extrabold text-white text-[18px] capitalize">
              {TIER_COLORS[myTier]?.icon} {myTier}
            </div>
          </div>
        )}
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] mb-5">
        <i className="fas fa-shield-halved text-[#10b981] mt-0.5" />
        <p className="text-[12px] text-[#166534]">
          All peer profiles are fully anonymised. No names, emails, or identifiable information are ever shared.
          Matching uses skills, location region, role level, and learning velocity only.
        </p>
      </div>

      {/* Peer cards */}
      {loading ? (
        <div className="space-y-4">
          {[0,1,2].map(i => <Skeleton key={i} h="h-40" />)}
        </div>
      ) : msg ? (
        <div className="text-center py-12 text-[#6b7280]">
          <i className="fas fa-users-slash text-[40px] mb-3 block opacity-30" />
          <p className="text-[14px]">{msg}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {peers.map((peer, i) => {
            const tierCfg = TIER_COLORS[peer.tier] ?? TIER_COLORS.bronze;
            return (
              <div key={i} className="bg-white rounded-2xl border border-[#e8e8f0] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f4f2ff] flex items-center justify-center">
                      <i className="fas fa-user-circle text-[#7c3aed] text-[20px]" />
                    </div>
                    <div>
                      <div className="font-syne font-bold text-[14px]">{peer.alias}</div>
                      <div className="text-[12px] text-[#6b7280]">{peer.title} · {peer.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-1 rounded-full font-semibold capitalize"
                      style={{ background: tierCfg.bg, color: tierCfg.text }}>
                      {tierCfg.icon} {peer.tier}
                    </span>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-[#eff6ff] text-[#1d4ed8] font-semibold">
                      {peer.matchScore}% match
                    </span>
                  </div>
                </div>

                {/* Outcome badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-3 ${
                  peer.progressed
                    ? 'bg-[#f0fdf4] text-[#15803d]'
                    : 'bg-[#fef2f2] text-[#b91c1c]'
                }`}>
                  <i className={`fas ${peer.progressed ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-[10px]`} />
                  {peer.outcome}
                </div>

                {/* Key moves */}
                <div className="mb-3">
                  <div className="text-[11px] text-[#9ca3af] mb-1.5 uppercase tracking-wide">What they did</div>
                  <ul className="space-y-1">
                    {peer.keyMoves.map((move, j) => (
                      <li key={j} className="flex items-start gap-2 text-[13px] text-[#374151]">
                        <i className={`fas ${peer.progressed ? 'fa-circle-check text-[#10b981]' : 'fa-circle-xmark text-[#ef4444]'} mt-0.5 text-[11px]`} />
                        {move}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skills they had */}
                {peer.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {peer.skills.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f5f5fb] text-[#5b4cf5]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </SidebarLayout>
  );
}
