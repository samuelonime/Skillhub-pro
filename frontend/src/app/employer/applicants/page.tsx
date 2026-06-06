'use client';
import { useState, useEffect, useCallback } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/components/employer/EmployerAccessGuard';

const TIERS: Record<string,{label:string;icon:string;color:string;bg:string}> = {
  platinum:{label:'Platinum',icon:'💎',color:'#7c3aed',bg:'#f4f2ff'},
  gold:    {label:'Gold',    icon:'🥇',color:'#d97706',bg:'#fffbeb'},
  silver:  {label:'Silver',  icon:'🥈',color:'#6b7280',bg:'#f5f5fb'},
  bronze:  {label:'Bronze',  icon:'🥉',color:'#92400e',bg:'#fef3c7'},
};
function MeritBadge({coins}:{coins:number}) {
  const tier = coins>=5000?'platinum':coins>=2000?'gold':coins>=500?'silver':'bronze';
  const t = TIERS[tier];
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{background:t.bg,color:t.color}}>{t.icon} {t.label} · {coins.toLocaleString()}</span>;
}
const STATUS_STYLE:Record<string,[string,string]> = {
  applied:['#eff6ff','#1d4ed8'],reviewing:['#fffbeb','#92400e'],shortlisted:['#f0fdf4','#15803d'],
  interviewing:['#f4f2ff','#5b4cf5'],hired:['#dcfce7','#15803d'],rejected:['#fef2f2','#dc2626'],
};
function Sk({h='h-4',w='w-full',r='rounded'}:any){ return <div className={`${h} ${w} ${r} bg-[#f0f0f8] animate-pulse`}/>; }
function Avatar({name,avatar,size=8}:{name:string;avatar?:string;size?:number}) {
  const initials=(name||'U').split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
  const colors=['#5b4cf5','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6'];
  const color=colors[initials.charCodeAt(0)%colors.length];
  if(avatar) return <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`}/>;
  return <div className={`w-${size} h-${size} rounded-full flex-shrink-0 grid place-items-center font-syne font-bold text-white text-xs`} style={{background:color}}>{initials}</div>;
}
function StatusSelect({appId,current,onChange}:any) {
  const [loading,setLoading]=useState(false);
  async function update(status:string){ setLoading(true); try{ await apiFetch(`/employer/applicants/${appId}/status`,{method:'PATCH',body:JSON.stringify({status})}); onChange(appId,status); }catch{} finally{setLoading(false);} }
  const [sbg,sc]=STATUS_STYLE[current]||['#f5f5fb','#6b6b8a'];
  return <select value={current} disabled={loading} onChange={e=>update(e.target.value)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer outline-none appearance-none disabled:opacity-50" style={{background:sbg,color:sc}}>
    {['reviewing','shortlisted','interviewing','hired','rejected'].map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
  </select>;
}

export default function ApplicantsPage() {
  const [applicants,setApplicants]=useState<any[]|null>(null);
  const [tierFilter,setTierFilter]=useState('all');
  const [statusFilter,setStatusFilter]=useState('');
  const [selected,setSelected]=useState<any>(null);

  const load=useCallback(async()=>{
    try{
      const p=new URLSearchParams();
      if(tierFilter!=='all') p.set('tier',tierFilter);
      if(statusFilter) p.set('status',statusFilter);
      const r=await apiFetch(`/employer/applicants?${p}&sort=coins`);
      if(r.success) setApplicants(r.data); else setApplicants([]);
    }catch{setApplicants([]);}
  },[tierFilter,statusFilter]);

  useEffect(()=>{load();},[load]);

  function onStatusChange(appId:string,newStatus:string){ setApplicants(prev=>prev?prev.map(a=>a.applicationId===appId?{...a,status:newStatus}:a):prev); }

  return (
    <SidebarLayout navItems={employerNavItems} pageTitle="Applicants">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><h1 className="font-syne font-bold text-[21px] tracking-tight">Applicants</h1><p className="text-[13px] text-[#6b6b8a]">All candidates sorted by Merit Coins — highest achievers first.</p></div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl border border-[#e8e8f0]">
            {(['all','platinum','gold','silver','bronze'] as const).map(t=>(
              <button key={t} onClick={()=>setTierFilter(t)} className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold border-0 cursor-pointer transition-all ${tierFilter===t?'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-[#0a0a0f]':'bg-transparent text-[#6b6b8a]'}`}>
                {t==='all'?'All':`${TIERS[t].icon} ${TIERS[t].label}`}
              </button>
            ))}
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm text-[#6b6b8a] border border-[#e8e8f0] rounded-lg px-3 py-2 bg-white outline-none font-[inherit] cursor-pointer">
            <option value="">All Statuses</option>
            {['applied','reviewing','shortlisted','interviewing','hired','rejected'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 max-[1100px]:grid-cols-1">
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          {applicants===null?<div className="flex flex-col gap-3">{[1,2,3,4,5].map(i=><Sk key={i} h="h-16" r="rounded-xl"/>)}</div>
           :applicants.length===0?<p className="text-sm text-[#9898b8] py-8 text-center">No applicants match these filters.</p>
           :<div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
            <thead><tr>{['#','Candidate','Applied For','Merit Tier','Skills','Certs','Projects','Status'].map(h=><th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{applicants.map((a:any,idx:number)=>(
              <tr key={a.applicationId} onClick={()=>setSelected(a)} className={`hover:bg-[#fafafd] transition-colors cursor-pointer ${selected?.applicationId===a.applicationId?'bg-[#f4f2ff]':''} ${a.meritCoins>=5000?'bg-[#fafaff]':''}`}>
                <td className="py-3 px-3 border-b border-[#f0f0f8]"><span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${idx===0?'bg-[#f59e0b] text-white':idx===1?'bg-[#9898b8] text-white':idx===2?'bg-[#cd7f32] text-white':'bg-[#f5f5fb] text-[#6b6b8a]'}`}>{idx+1}</span></td>
                <td className="py-3 px-3 border-b border-[#f0f0f8]"><div className="flex items-center gap-2.5"><Avatar name={a.name} avatar={a.avatar}/><div><div className="font-semibold text-[13px]">{a.name}</div>{a.title&&<div className="text-[10px] text-[#9898b8]">{a.title}</div>}</div></div></td>
                <td className="py-3 px-3 border-b border-[#f0f0f8] text-[#6b6b8a] text-[12px]">{a.job?.title||'—'}</td>
                <td className="py-3 px-3 border-b border-[#f0f0f8]"><MeritBadge coins={a.meritCoins}/></td>
                <td className="py-3 px-3 border-b border-[#f0f0f8]"><div className="flex flex-wrap gap-1 max-w-[120px]">{a.skills?.slice(0,3).map((s:any)=><span key={s.name} className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f2ff] text-[#5b4cf5] font-semibold">{s.name}</span>)}{a.skills?.length>3&&<span className="text-[10px] text-[#9898b8]">+{a.skills.length-3}</span>}</div></td>
                <td className="py-3 px-3 border-b border-[#f0f0f8] font-semibold text-[13px]">{a.certCount}</td>
                <td className="py-3 px-3 border-b border-[#f0f0f8] font-semibold text-[13px]" style={{color:a.projectCount>0?'#22c55e':'#9898b8'}}>{a.projectCount}</td>
                <td className="py-3 px-3 border-b border-[#f0f0f8]" onClick={e=>e.stopPropagation()}><StatusSelect appId={a.applicationId} current={a.status} onChange={onStatusChange}/></td>
              </tr>
            ))}</tbody>
          </table></div>}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] h-fit sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <span className="font-syne font-bold text-[14px]">Candidate Detail</span>
              <button onClick={()=>setSelected(null)} className="w-7 h-7 rounded-lg bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] grid place-items-center text-xs"><i className="fas fa-times"/></button>
            </div>
            <div className="flex items-center gap-3 mb-4"><Avatar name={selected.name} avatar={selected.avatar} size={12}/><div><div className="font-syne font-bold text-[15px]">{selected.name}</div><div className="text-sm text-[#6b6b8a]">{selected.title}</div><div className="mt-1"><MeritBadge coins={selected.meritCoins}/></div></div></div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[{l:'Skills',v:selected.skills?.length||0,c:'#5b4cf5',bg:'#f4f2ff'},{l:'Certs',v:selected.certCount,c:'#22c55e',bg:'#f0fdf4'},{l:'Projects',v:selected.projectCount,c:'#f59e0b',bg:'#fffbeb'}].map(s=>(
                <div key={s.l} className="text-center rounded-xl p-2" style={{background:s.bg}}><div className="font-syne font-bold text-[17px]" style={{color:s.c}}>{s.v}</div><div className="text-[10px] text-[#6b6b8a]">{s.l}</div></div>
              ))}
            </div>
            {selected.skills?.length>0&&<div className="mb-3"><div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Skills</div><div className="flex flex-wrap gap-1.5">{selected.skills.map((s:any)=><span key={s.name} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#f4f2ff] text-[#5b4cf5]">{s.name}</span>)}</div></div>}
            {selected.platforms?.length>0&&<div className="mb-3"><div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Platforms</div><div className="flex flex-wrap gap-1.5">{selected.platforms.map((p:string)=><span key={p} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f0fdf4] text-[#22c55e]"><i className="fas fa-check-circle mr-1"/>{p}</span>)}</div></div>}
            <div className="flex flex-col gap-2 mt-4">
              <button className="w-full py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all">Send Message</button>
              <button onClick={()=>{ onStatusChange(selected.applicationId,'shortlisted'); setSelected((p:any)=>({...p,status:'shortlisted'})); }} className="w-full py-2.5 bg-[#f0fdf4] text-[#15803d] rounded-xl text-sm font-semibold border border-[#bbf7d0] cursor-pointer hover:bg-[#22c55e] hover:text-white transition-all">Shortlist</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 border border-[#e8e8f0] text-center h-fit">
            <i className="fas fa-mouse-pointer text-3xl text-[#e8e8f0] mb-3 block"/>
            <p className="text-sm text-[#9898b8]">Click a row to see candidate details</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}