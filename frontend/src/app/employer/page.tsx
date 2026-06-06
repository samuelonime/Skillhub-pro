'use client';

import { useState, useEffect, useCallback } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/components/employer/EmployerAccessGuard';

/* ─── Tier helpers ─────────────────────────────────────────────────────── */
const TIERS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  platinum: { label:'Platinum', icon:'💎', color:'#7c3aed', bg:'#f4f2ff' },
  gold:     { label:'Gold',     icon:'🥇', color:'#d97706', bg:'#fffbeb' },
  silver:   { label:'Silver',   icon:'🥈', color:'#6b7280', bg:'#f5f5fb' },
  bronze:   { label:'Bronze',   icon:'🥉', color:'#92400e', bg:'#fef3c7' },
};
function getTier(c: number) { return c>=5000?'platinum':c>=2000?'gold':c>=500?'silver':'bronze'; }
function MeritBadge({ coins }: { coins: number }) {
  const t = TIERS[getTier(coins)];
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background:t.bg, color:t.color }}>{t.icon} {t.label} · {coins.toLocaleString()}</span>;
}

const STATUS_STYLE: Record<string, [string,string]> = {
  applied:['#eff6ff','#1d4ed8'], reviewing:['#fffbeb','#92400e'], shortlisted:['#f0fdf4','#15803d'],
  interviewing:['#f4f2ff','#5b4cf5'], hired:['#dcfce7','#15803d'], rejected:['#fef2f2','#dc2626'],
};

function Sk({ h='h-4', w='w-full', r='rounded' }: any) { return <div className={`${h} ${w} ${r} bg-[#f0f0f8] animate-pulse`} />; }

function Avatar({ name, avatar, size=8 }: { name:string; avatar?:string; size?:number }) {
  const initials = (name||'U').split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
  const colors = ['#5b4cf5','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#06b6d4'];
  const color = colors[initials.charCodeAt(0)%colors.length];
  if (avatar) return <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`}/>;
  return <div className={`w-${size} h-${size} rounded-full flex-shrink-0 grid place-items-center font-syne font-bold text-white text-xs`} style={{background:color}}>{initials}</div>;
}

/* ─── Post Job Modal ───────────────────────────────────────────────────── */
function PostJobModal({ onClose, onPosted }: { onClose:()=>void; onPosted:()=>void }) {
  const [form, setForm] = useState({ title:'', description:'', type:'Full-time', location:'', salary:'', skills:'', minTier:'', isPremium:false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  function set(k:string,v:any){ setForm(p=>({...p,[k]:v})); }
  async function submit() {
    if (!form.title||!form.description||!form.location){ setErr('Title, description and location are required'); return; }
    setSaving(true); setErr('');
    try {
      const res = await apiFetch('/jobs',{ method:'POST', body:JSON.stringify({...form, skills:form.skills.split(',').map(s=>s.trim()).filter(Boolean)}) });
      if (res.success){ onPosted(); onClose(); } else setErr(res.message||'Failed');
    } catch(e:any){ setErr(e.message||'Failed'); } finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-syne font-bold text-[17px]">Post a New Job</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] grid place-items-center"><i className="fas fa-times text-xs"/></button>
        </div>
        {err && <div className="mb-4 p-3 bg-[#fef2f2] text-[#ef4444] text-sm rounded-xl">{err}</div>}
        <div className="flex flex-col gap-3">
          {[{label:'Job Title *',key:'title',ph:'e.g. Senior Frontend Developer'},{label:'Location *',key:'location',ph:'e.g. Lagos or Remote'},{label:'Salary Range',key:'salary',ph:'e.g. ₦400k–₦600k/mo'},{label:'Skills (comma-separated)',key:'skills',ph:'React, TypeScript, Node.js'}].map(f=>(
            <div key={f.key}>
              <label className="block text-xs font-semibold text-[#6b6b8a] mb-1">{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.ph}
                className="w-full px-3.5 py-2.5 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] transition-all"/>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] mb-1">Job Type</label>
              <select value={form.type} onChange={e=>set('type',e.target.value)} className="w-full px-3.5 py-2.5 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none bg-white cursor-pointer">
                {['Full-time','Part-time','Contract','Remote','Internship'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6b8a] mb-1">Min. Merit Tier</label>
              <select value={form.minTier} onChange={e=>set('minTier',e.target.value)} className="w-full px-3.5 py-2.5 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none bg-white cursor-pointer">
                <option value="">Any (visible to all)</option>
                <option value="bronze">🥉 Bronze+ (0+ coins)</option>
                <option value="silver">🥈 Silver+ (500+ coins)</option>
                <option value="gold">🥇 Gold+ (2,000+ coins)</option>
                <option value="platinum">💎 Platinum only (5,000+)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6b6b8a] mb-1">Job Description *</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={5} placeholder="Describe the role, responsibilities and requirements…"
              className="w-full px-3.5 py-2.5 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] transition-all resize-none"/>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5fb] cursor-pointer">
            <input type="checkbox" checked={form.isPremium} onChange={e=>set('isPremium',e.target.checked)} className="w-4 h-4 accent-[#5b4cf5]"/>
            <div>
              <div className="text-sm font-semibold">Mark as Featured / Sponsored</div>
              <div className="text-[11px] text-[#6b6b8a]">Featured jobs appear as opportunity ads on student dashboards</div>
            </div>
          </label>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e8e8f0] rounded-xl text-sm font-semibold text-[#6b6b8a] bg-white cursor-pointer hover:bg-[#f5f5fb] transition-all">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all disabled:opacity-60">
            {saving?'Posting…':'Post Job'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployerDashboardPage() {
  const [overview, setOverview]   = useState<any>(null);
  const [employer, setEmployer]   = useState<any>(null);
  const [showPostJob, setShowPostJob] = useState(false);
  const [toast, setToast]         = useState('');

  function showToast(msg:string){ setToast(msg); setTimeout(()=>setToast(''),3500); }

  const loadOverview = useCallback(async()=>{
    try {
      const [dash, profile] = await Promise.all([
        apiFetch('/employer/dashboard'),
        apiFetch('/employer/profile'),
      ]);
      if (dash.success) setOverview(dash.data);
      if (profile.success) setEmployer(profile.data);
    } catch {}
  },[]);

  useEffect(()=>{ loadOverview(); },[loadOverview]);

  /* Real-time greeting */
  const greeting = (()=>{ const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; })();
  const fullName = employer ? `${employer.firstName} ${employer.lastName}` : '';
  const company  = employer?.company || '';

  const stats    = overview?.stats;
  const pipeline = overview?.pipeline || [];
  const tierBreak = overview?.tierBreakdown || {};
  const recent   = overview?.recentApplicants || [];

  const PIPE_COLORS: Record<string,string> = { applied:'#e8e8f0', reviewing:'#3b82f6', shortlisted:'#f59e0b', interviewing:'#5b4cf5', hired:'#22c55e' };

  return (
    <SidebarLayout navItems={employerNavItems} pageTitle="Dashboard">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0a0a0f] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <i className="fas fa-check-circle text-[#22c55e]"/>{toast}
        </div>
      )}
      {showPostJob && <PostJobModal onClose={()=>setShowPostJob(false)} onPosted={()=>{ showToast('Job posted successfully!'); loadOverview(); }}/>}

      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-4 flex-wrap relative overflow-hidden"
        style={{ background:'linear-gradient(135deg,#0a0a0f,#1a1a2e)' }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top:-50,right:-50,width:200,height:200,background:'rgba(91,76,245,0.15)' }}/>
        <div className="absolute rounded-full pointer-events-none" style={{ bottom:-40,right:100,width:130,height:130,background:'rgba(91,76,245,0.08)' }}/>
        <div className="relative z-[1]">
          {employer ? (
            <>
              <p className="text-white/60 text-sm mb-1">{greeting} 👋</p>
              <h2 className="font-syne font-bold text-[22px] text-white mb-0.5">{fullName}</h2>
              {company && <p className="text-white/50 text-[13px]">{company}</p>}
            </>
          ) : (
            <div className="flex flex-col gap-2"><Sk h="h-4" w="w-32" r="rounded"/><Sk h="h-7" w="w-48" r="rounded-lg"/><Sk h="h-3" w="w-24" r="rounded"/></div>
          )}
        </div>
        <button onClick={()=>setShowPostJob(true)}
          className="relative z-[1] inline-flex items-center gap-2 px-5 py-3 text-white text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(91,76,245,0.4)]"
          style={{ background:'#5b4cf5' }}>
          <i className="fas fa-plus"/> Post a Job
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mb-4 max-md:grid-cols-2">
        {[
          { icon:'fa-briefcase',  bg:'#f4f2ff', color:'#5b4cf5', value:stats?.activeJobs,     label:'Active Jobs' },
          { icon:'fa-users',      bg:'#f0fdf4', color:'#22c55e', value:stats?.totalApplicants, label:'Total Applicants' },
          { icon:'fa-user-check', bg:'#fffbeb', color:'#f59e0b', value:stats?.shortlisted,     label:'Shortlisted' },
          { icon:'fa-handshake',  bg:'#eff6ff', color:'#3b82f6', value:stats?.hiredThisMonth,  label:'Hired This Month' },
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#e8e8f0] flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-all">
            <div className="w-11 h-11 rounded-xl grid place-items-center text-[17px] flex-shrink-0" style={{background:s.bg,color:s.color}}>
              <i className={`fas ${s.icon}`}/>
            </div>
            <div>
              {s.value===undefined?<Sk h="h-7" w="w-10" r="rounded"/>:<div className="font-syne font-bold text-[22px]">{s.value??0}</div>}
              <div className="text-xs text-[#6b6b8a]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pipeline + Tier Breakdown ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <span className="font-syne font-bold text-[15px] block mb-4">Hiring Pipeline</span>
          {pipeline.length===0?<div className="flex flex-col gap-3">{[1,2,3,4,5].map(i=><Sk key={i} h="h-7" r="rounded-xl"/>)}</div>
           :pipeline.map((s:any)=>(
            <div key={s.stage} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-[12px] text-[#6b6b8a] capitalize w-24 flex-shrink-0">{s.stage}</span>
              <div className="flex-1 h-2.5 bg-[#f0f0f8] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${Math.max(s.pct,2)}%`,background:PIPE_COLORS[s.stage]||'#e8e8f0'}}/>
              </div>
              <span className="text-[12px] font-semibold w-6 text-right" style={{color:PIPE_COLORS[s.stage]||'#6b6b8a'}}>{s.count}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <span className="font-syne font-bold text-[15px] block mb-1">Applicant Merit Tiers</span>
          <p className="text-xs text-[#6b6b8a] mb-4">Learning achievement breakdown across all applicants.</p>
          {!stats?<div className="flex flex-col gap-3">{[1,2,3,4].map(i=><Sk key={i} h="h-12" r="rounded-xl"/>)}</div>
           :<div className="grid grid-cols-2 gap-2">
            {Object.entries(TIERS).map(([key,t])=>(
              <div key={key} className="p-3 rounded-xl border border-[#e8e8f0]" style={{background:t.bg+'60'}}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm">{t.icon}</span>
                  <span className="font-syne font-bold text-[18px]" style={{color:t.color}}>{(tierBreak as any)[key]||0}</span>
                </div>
                <div className="text-[11px] font-semibold" style={{color:t.color}}>{t.label}</div>
              </div>
            ))}
          </div>}
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mb-4 max-md:grid-cols-2">
        {[
          { icon:'fa-plus',         label:'Post Job',        bg:'#f4f2ff', color:'#5b4cf5', action:()=>setShowPostJob(true) },
          { icon:'fa-users',        label:'Applicants',      bg:'#f0fdf4', color:'#22c55e', href:'/employer/applicants' },
          { icon:'fa-search',       label:'Find Talent',     bg:'#fffbeb', color:'#f59e0b', href:'/employer/talent' },
          { icon:'fa-chart-bar',    label:'Analytics',       bg:'#eff6ff', color:'#3b82f6', href:'/employer/analytics' },
        ].map(a=>(
          a.action
            ? <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-[#e8e8f0] bg-white cursor-pointer hover:scale-105 transition-all border-0">
                <i className={`fas ${a.icon} text-xl`} style={{color:a.color}}/>
                <span className="text-xs font-semibold" style={{color:a.color}}>{a.label}</span>
              </button>
            : <a key={a.label} href={a.href} className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-[#e8e8f0] bg-white no-underline hover:scale-105 transition-all">
                <i className={`fas ${a.icon} text-xl`} style={{color:a.color}}/>
                <span className="text-xs font-semibold" style={{color:a.color}}>{a.label}</span>
              </a>
        ))}
      </div>

      {/* ── Recent Applicants ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
        <div className="flex items-center justify-between mb-4">
          <span className="font-syne font-bold text-[15px]">Recent Applicants</span>
          <a href="/employer/applicants" className="text-xs font-semibold text-[#5b4cf5] bg-[#f5f5fb] px-3 py-1.5 rounded-lg no-underline hover:bg-[#f4f2ff] transition-all">View all →</a>
        </div>
        {!overview?<div className="flex flex-col gap-3">{[1,2,3,4,5].map(i=><Sk key={i} h="h-14" r="rounded-xl"/>)}</div>
         :recent.length===0?(
          <div className="py-10 text-center">
            <i className="fas fa-users text-4xl text-[#e8e8f0] mb-3 block"/>
            <p className="text-sm text-[#9898b8] mb-3">No applicants yet.</p>
            <button onClick={()=>setShowPostJob(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all">
              Post your first job
            </button>
          </div>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr>{['Candidate','Applied For','Merit Tier','Certs','Projects','Status'].map(h=>(
                <th key={h} className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr></thead>
              <tbody>{recent.map((a:any)=>(
                <tr key={a.applicationId} className="hover:bg-[#fafafd] transition-colors">
                  <td className="py-3 px-4 border-b border-[#f0f0f8]">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={a.name} avatar={a.avatar}/>
                      <span className="font-semibold text-[#0a0a0f] text-[13px]">{a.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[12px]">{a.job?.title||'—'}</td>
                  <td className="py-3 px-4 border-b border-[#f0f0f8]"><MeritBadge coins={a.meritCoins}/></td>
                  <td className="py-3 px-4 border-b border-[#f0f0f8] font-semibold text-[13px]">{a.certCount}</td>
                  <td className="py-3 px-4 border-b border-[#f0f0f8] font-semibold text-[13px]" style={{color:a.projectCount>0?'#22c55e':'#9898b8'}}>{a.projectCount}</td>
                  <td className="py-3 px-4 border-b border-[#f0f0f8]">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{background:(STATUS_STYLE[a.status]||['#f5f5fb','#6b6b8a'])[0],color:(STATUS_STYLE[a.status]||['#f5f5fb','#6b6b8a'])[1]}}>{a.status}</span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}