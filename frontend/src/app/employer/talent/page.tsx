'use client';
import { useState, useEffect, useCallback } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/app/employer/EmployerAccessGuard';
import { BrandIcon } from '@/components/ui/BrandIcon';

const TIERS: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  platinum: { label: 'Platinum', icon: '💎', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: '#A78BFA' },
  gold: { label: 'Gold', icon: '🥇', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: '#F59E0B' },
  silver: { label: 'Silver', icon: '🥈', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', border: '#94A3B8' },
  bronze: { label: 'Bronze', icon: '🥉', color: '#CD7C54', bg: 'rgba(205,124,84,0.12)', border: '#CD7C54' },
};
function getTier(c: number) { return c >= 5000 ? 'platinum' : c >= 2000 ? 'gold' : c >= 500 ? 'silver' : 'bronze'; }
function MeritBadge({ coins }: { coins: number }) { const t = TIERS[getTier(coins)]; return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}20` }}>{t.icon} {t.label} · {coins.toLocaleString()}</span>; }
function Sk({ h = 'h-4', w = 'w-full', r = 'rounded' }: any) { return <div className={`${h} ${w} ${r} animate-pulse`} style={{ background: 'rgba(255,255,255,0.06)' }} />; }
function Avatar({ name, avatar, size = 8 }: { name: string; avatar?: string; size?: number }) {
  const initials = (name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#4F8EF7', '#00E5A0', '#F59E0B', '#A78BFA', '#EF4444', '#38BDF8'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  if (avatar) return <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover shrink-0 border border-[rgba(255,255,255,0.1)]`} />;
  return <div className={`w-${size} h-${size} rounded-full shrink-0 grid place-items-center font-jakarta font-bold text-white text-xs`} style={{ background: color }}>{initials}</div>;
}

function ProfileDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!userId) return;
    setProfile(null); setLoading(true);
    apiFetch(`/employer/talent/${userId}`).then(r => { if (r.success) setProfile(r.data); }).catch(() => { }).finally(() => setLoading(false));
  }, [userId]);
  if (!userId) return null;
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/60 backdrop-blur-sm" />
      <div className="w-full max-w-md h-full overflow-y-auto shadow-2xl" style={{ background: '#0F1521' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 sticky top-0 z-10" style={{ background: '#0F1521', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="font-jakarta font-bold text-[15px]" style={{ color: 'rgba(255,255,255,0.85)' }}>Candidate Profile</span>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border-0 cursor-pointer grid place-items-center transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}><BrandIcon name="fa-times" className="text-xs" /></button>
        </div>
        {loading ? <div className="p-5 flex flex-col gap-3"><Sk h="h-20" r="rounded-2xl" />{[1, 2, 3, 4].map(i => <Sk key={i} h="h-12" r="rounded-xl" />)}</div>
          : profile ? (
            <div className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <Avatar name={profile.name} avatar={profile.avatar} size={14} />
                <div><h2 className="font-jakarta font-bold text-[17px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{profile.name}</h2><p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{profile.title}</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{profile.location}</p><div className="mt-1.5"><MeritBadge coins={profile.meritCoins || 0} /></div></div>
              </div>
              {profile.bio && <p className="text-sm leading-relaxed mb-5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>{profile.bio}</p>}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[{ l: 'Skills', v: profile.skills?.length || 0, c: '#4F8EF7', bg: 'rgba(79,142,247,0.12)' }, { l: 'Certs', v: profile.certificates?.length || 0, c: '#00E5A0', bg: 'rgba(0,229,160,0.12)' }, { l: 'Projects', v: profile.projects?.length || 0, c: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }].map(s => (
                  <div key={s.l} className="rounded-xl p-3 text-center" style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.06)' }}><div className="font-jakarta font-bold text-[18px]" style={{ color: s.c }}>{s.v}</div><div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.l}</div></div>
                ))}
              </div>
              {profile.skills?.length > 0 && <div className="mb-5"><div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Skills</div><div className="flex flex-wrap gap-1.5">{profile.skills.map((s: any) => <span key={s.name} className="text-xs font-semibold px-2.5 py-1 rounded-lg inline-flex items-center" style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.2)' }}>{s.verified && <BrandIcon name="fa-check-circle" className="mr-1 text-[10px]" style={{ color: '#00E5A0' }} />}{s.name}</span>)}</div></div>}
              {profile.certificates?.length > 0 && <div className="mb-5"><div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Certificates</div>{profile.certificates.map((c: any) => <div key={c.id} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}><div className="w-7 h-7 rounded-lg grid place-items-center text-sm shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>🏆</div><div className="flex-1 min-w-0"><div className="text-[13px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{c.title}</div><div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{c.provider}</div></div>{c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold no-underline" style={{ color: '#4F8EF7' }}>View ↗</a>}</div>)}</div>}
              {profile.projects?.length > 0 && <div className="mb-5"><div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Projects</div>{profile.projects.map((p: any) => <div key={p.id} className="p-3 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}><div className="font-semibold text-[13px] mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{p.title}</div><p className="text-[11px] mb-2 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{p.description}</p><div className="flex gap-1 flex-wrap">{(p.techStack || []).slice(0, 4).map((t: string) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>{t}</span>)}</div><div className="flex gap-2 mt-2">{p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold no-underline" style={{ color: '#4F8EF7' }}>Live ↗</a>}{p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold no-underline" style={{ color: 'rgba(255,255,255,0.6)' }}>GitHub ↗</a>}</div></div>)}</div>}
              {profile.platforms?.length > 0 && <div className="mb-5"><div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Learning Platforms</div><div className="flex flex-wrap gap-1.5">{profile.platforms.map((p: string) => <span key={p} className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center" style={{ background: 'rgba(0,229,160,0.12)', color: '#00E5A0', border: '1px solid rgba(0,229,160,0.2)' }}><BrandIcon name="fa-check-circle" className="mr-1" />{p}</span>)}</div></div>}
              {profile.resume?.fileUrl && <a href={profile.resume.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 rounded-xl no-underline transition-all group" style={{ background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.2)' }}><BrandIcon name="fa-file-pdf" style={{ color: '#4F8EF7' }} /><span className="text-sm font-semibold" style={{ color: '#4F8EF7' }}>Download Resume</span></a>}
            </div>
          ) : <div className="p-10 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Profile not available</div>}
      </div>
    </div>
  );
}

export default function TalentPage() {
  const [talent, setTalent] = useState<any[] | null>(null);
  const [total, setTotal] = useState(0);
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      if (tierFilter !== 'all') p.set('tier', tierFilter);
      if (search) p.set('search', search);
      const r = await apiFetch(`/employer/talent?${p}`);
      if (r.success) { setTalent(r.data.users); setTotal(r.data.total); } else setTalent([]);
    } catch { setTalent([]); }
  }, [tierFilter, search]);

  useEffect(() => { load(); }, [load]);

  const headers = ['#', 'Candidate', 'Merit Tier', 'Skills', 'Certs', 'Projects', 'Platforms', 'Action'];

  return (
    <EmployerAccessGuard>
      <SidebarLayout navItems={employerNavItems} pageTitle="Talent Search">
        <ProfileDrawer userId={selectedUser} onClose={() => setSelectedUser(null)} />
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div><h1 className="font-jakarta font-bold text-[21px] tracking-tight" style={{ color: '#FFFFFF' }}>Talent Search</h1><p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{total.toLocaleString()} verified candidates ranked by Merit Coins.</p></div>
          <div className="flex gap-2 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search by name or title…"
              className="px-3 py-2 rounded-xl text-sm font-[inherit] outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            />
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {(['all', 'platinum', 'gold', 'silver', 'bronze'] as const).map(t => (
                <button key={t} onClick={() => setTierFilter(t)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-0 cursor-pointer transition-all ${tierFilter === t ? 'shadow-[0_1px_4px_rgba(0,0,0,0.08)]' : 'bg-transparent'}`}
                  style={tierFilter === t ? { background: '#0F1521', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.09)' } : { color: 'rgba(255,255,255,0.45)' }}>
                  {t === 'all' ? 'All' : `${TIERS[t].icon} ${TIERS[t].label}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Platinum featured */}
        {tierFilter === 'all' && talent && talent.some(u => u.meritCoins >= 5000) && (
          <div className="mb-5">
            <div className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full w-fit mb-3" style={{ background: 'linear-gradient(90deg,#4F8EF7,#A78BFA)' }}>💎 PLATINUM — TOP TALENT</div>
            <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
              {talent.filter(u => u.meritCoins >= 5000).slice(0, 3).map((u: any) => (
                <div key={u.id} className="rounded-2xl p-5 relative overflow-hidden hover:-translate-y-0.5 transition-all cursor-pointer" style={{ background: '#0F1521', border: '2px solid rgba(167,139,250,0.25)' }} onClick={() => setSelectedUser(u.id)}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg,#4F8EF7,#A78BFA)' }} />
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={u.name} avatar={u.avatar} size={12} />
                    <div><div className="font-jakarta font-bold text-[14px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{u.name}</div><div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{u.title || u.location}</div><MeritBadge coins={u.meritCoins} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[{ v: u.skills?.length || 0, l: 'Skills', c: '#4F8EF7', bg: 'rgba(79,142,247,0.12)' }, { v: u.certCount, l: 'Certs', c: '#00E5A0', bg: 'rgba(0,229,160,0.12)' }, { v: u.projectCount, l: 'Projects', c: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }].map(s => (
                      <div key={s.l} className="text-center rounded-xl p-2" style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.06)' }}><div className="font-jakarta font-bold text-sm" style={{ color: s.c }}>{s.v}</div><div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.l}</div></div>
                    ))}
                  </div>
                  {u.platforms?.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{u.platforms.map((p: string) => <span key={p} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,229,160,0.12)', color: '#00E5A0', border: '1px solid rgba(0,229,160,0.2)' }}>{p}</span>)}</div>}
                  <button onClick={e => { e.stopPropagation(); setSelectedUser(u.id); }} className="w-full py-2 text-xs font-semibold text-white rounded-xl border-0 cursor-pointer transition-all" style={{ background: '#4F8EF7' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#6BA0FF'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; }}>View Full Profile</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl p-5" style={{ background: '#0F1521', border: '1px solid rgba(255,255,255,0.07)' }}>
          {talent === null ? <div className="flex flex-col gap-3">{[1, 2, 3, 4, 5].map(i => <Sk key={i} h="h-14" r="rounded-xl" />)}</div>
            : talent.length === 0 ? <p className="text-sm py-8 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>No candidates found.</p>
              : <div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    {headers.map(h => (
                      <th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.45)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {talent.map((u: any, idx: number) => (
                    <tr key={u.id} className="transition-colors" style={u.meritCoins >= 5000 ? { background: 'rgba(167,139,250,0.05)' } : {}}>
                      <td className="py-3 px-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${idx === 0 ? 'text-white' : idx === 1 ? 'text-white' : idx === 2 ? 'text-white' : ''}`}
                          style={idx === 0 ? { background: '#F59E0B' } : idx === 1 ? { background: '#94A3B8' } : idx === 2 ? { background: '#CD7C54' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>{idx + 1}</span>
                        </td>
                      <td className="py-3 px-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-2.5"><Avatar name={u.name} avatar={u.avatar} /><div><div className="font-semibold text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}>{u.name}</div>{u.title && <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{u.title}</div>}</div></div>
                        </td>
                      <td className="py-3 px-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><MeritBadge coins={u.meritCoins} />  </td>
                      <td className="py-3 px-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex flex-wrap gap-1 max-w-35">{u.skills?.slice(0, 3).map((s: any) => <span key={s.name} className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>{s.name}</span>)}{u.skills?.length > 3 && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>+{u.skills.length - 3}</span>}</div>
                        </td>
                      <td className="py-3 px-3 font-semibold text-[13px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>{u.certCount}  </td>
                      <td className="py-3 px-3 font-semibold text-[13px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: u.projectCount > 0 ? '#00E5A0' : 'rgba(255,255,255,0.3)' }}>{u.projectCount}  </td>
                      <td className="py-3 px-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{u.platforms?.length > 0 ? <span className="text-[11px]" style={{ color: '#4F8EF7' }}>{u.platforms.slice(0, 2).join(', ')}{u.platforms.length > 2 ? ` +${u.platforms.length - 2}` : ''}</span> : <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>—</span>}  </td>
                      <td className="py-3 px-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setSelectedUser(u.id)} className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all" style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4F8EF7'; (e.currentTarget as HTMLElement).style.color = 'white'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(79,142,247,0.12)'; (e.currentTarget as HTMLElement).style.color = '#4F8EF7'; }}>Profile</button>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>}
        </div>
      </SidebarLayout>
    </EmployerAccessGuard>
  );
}