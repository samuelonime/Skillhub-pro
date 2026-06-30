'use client';
import { useState, useEffect, useCallback } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/app/employer/EmployerAccessGuard';
import { BrandIcon } from '@/components/ui/BrandIcon';

const TIERS: Record<string,{label:string;icon:string;color:string;bg:string}> = {
  platinum:{label:'Platinum',icon:'💎',color:'#A78BFA',bg:'rgba(167,139,250,0.12)'},
  gold:    {label:'Gold',    icon:'🥇',color:'#F59E0B',bg:'rgba(245,158,11,0.12)'},
  silver:  {label:'Silver',  icon:'🥈',color:'#94A3B8',bg:'rgba(148,163,184,0.12)'},
  bronze:  {label:'Bronze',  icon:'🥉',color:'#CD7C54',bg:'rgba(205,124,84,0.12)'},
};
function MeritBadge({coins}:{coins:number}) {
  const tier = coins>=5000?'platinum':coins>=2000?'gold':coins>=500?'silver':'bronze';
  const t = TIERS[tier];
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{background:t.bg,color:t.color, border:`1px solid ${t.color}20`}}>{t.icon} {t.label} · {coins.toLocaleString()}</span>;
}
const STATUS_STYLE:Record<string,[string,string]> = {
  applied:['rgba(59,130,246,0.12)','#3B82F6'],
  reviewing:['rgba(245,158,11,0.12)','#F59E0B'],
  shortlisted:['rgba(0,229,160,0.12)','#00E5A0'],
  interviewing:['rgba(79,142,247,0.12)','#4F8EF7'],
  hired:['rgba(0,229,160,0.15)','#00E5A0'],
  rejected:['rgba(239,68,68,0.12)','#EF4444'],
};
function Sk({h='h-4',w='w-full',r='rounded'}:any){ return <div className={`${h} ${w} ${r} animate-pulse`} style={{background:'rgba(255,255,255,0.06)'}}/>; }
function Avatar({name,avatar,size=8}:{name:string;avatar?:string;size?:number}) {
  const initials=(name||'U').split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
  const colors=['#4F8EF7','#00E5A0','#F59E0B','#A78BFA','#EF4444','#38BDF8'];
  const color=colors[initials.charCodeAt(0)%colors.length];
  if(avatar) return <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover shrink-0 border border-[rgba(255,255,255,0.1)]`}/>;
  return <div className={`w-${size} h-${size} rounded-full shrink-0 grid place-items-center font-jakarta font-bold text-white text-xs`} style={{background:color}}>{initials}</div>;
}
function StatusSelect({appId,current,onChange}:any) {
  const [loading,setLoading]=useState(false);
  async function update(status:string){ setLoading(true); try{ await apiFetch(`/employer/applicants/${appId}/status`,{method:'PATCH',body:JSON.stringify({status})}); onChange(appId,status); }catch{} finally{setLoading(false);} }
  const [sbg,sc]=STATUS_STYLE[current]||['rgba(255,255,255,0.06)','rgba(255,255,255,0.45)'];
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
    <EmployerAccessGuard>
    <SidebarLayout navItems={employerNavItems} pageTitle="Applicants">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><h1 className="font-jakarta font-bold text-[21px] tracking-tight" style={{color:'#FFFFFF'}}>Applicants</h1><p className="text-[13px]" style={{color:'rgba(255,255,255,0.45)'}}>All candidates sorted by Merit Coins — highest achievers first.</p></div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)'}}>
            {(['all','platinum','gold','silver','bronze'] as const).map(t=>(
              <button key={t} onClick={()=>setTierFilter(t)} className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold border-0 cursor-pointer transition-all ${tierFilter===t?'shadow-[0_1px_4px_rgba(0,0,0,0.08)]':'bg-transparent'}`}
                style={tierFilter===t?{background:'#0F1521',color:'#FFFFFF', border:'1px solid rgba(255,255,255,0.09)'}:{color:'rgba(255,255,255,0.45)'}}>
                {t==='all'?'All':`${TIERS[t].icon} ${TIERS[t].label}`}
              </button>
            ))}
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} 
            className="text-sm rounded-lg px-3 py-2 outline-none font-[inherit] cursor-pointer"
            style={{color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)'}}>
            <option value="">All Statuses</option>
            {['applied','reviewing','shortlisted','interviewing','hired','rejected'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 max-[1100px]:grid-cols-1">
        <div className="rounded-2xl p-5" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
          {applicants===null?<div className="flex flex-col gap-3">{[1,2,3,4,5].map(i=><Sk key={i} h="h-16" r="rounded-xl"/>)}</div>
           :applicants.length===0?<p className="text-sm py-8 text-center" style={{color:'rgba(255,255,255,0.35)'}}>No applicants match these filters.</p>
           :<div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {['#','Candidate','Applied For','Merit Tier','Skills','Certs','Projects','Status'].map(h=>(
                  <th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{color:'rgba(255,255,255,0.45)', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applicants.map((a:any,idx:number)=>(
                <tr key={a.applicationId} onClick={()=>setSelected(a)} className={`transition-colors cursor-pointer ${selected?.applicationId===a.applicationId?'bg-[rgba(79,142,247,0.08)]':''} ${a.meritCoins>=5000?'bg-[rgba(167,139,250,0.05)]':''}`} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <td className="py-3 px-3">
                    <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${idx===0?'text-white':idx===1?'text-white':idx===2?'text-white':''}`} 
                      style={idx===0?{background:'#F59E0B'}:idx===1?{background:'#94A3B8'}:idx===2?{background:'#CD7C54'}:{background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)'}}>{idx+1}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5"><Avatar name={a.name} avatar={a.avatar}/><div><div className="font-semibold text-[13px]" style={{color:'rgba(255,255,255,0.85)'}}>{a.name}</div>{a.title&&<div className="text-[10px]" style={{color:'rgba(255,255,255,0.45)'}}>{a.title}</div>}</div></div>
                  </td>
                  <td className="py-3 px-3 text-[12px]" style={{color:'rgba(255,255,255,0.45)'}}>{a.job?.title||'—'} </td>
                  <td className="py-3 px-3"><MeritBadge coins={a.meritCoins}/> </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[120px]">{a.skills?.slice(0,3).map((s:any)=><span key={s.name} className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{background:'rgba(79,142,247,0.12)',color:'#4F8EF7'}}>{s.name}</span>)}{a.skills?.length>3&&<span className="text-[10px]" style={{color:'rgba(255,255,255,0.45)'}}>+{a.skills.length-3}</span>}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-[13px]" style={{color:'rgba(255,255,255,0.7)'}}>{a.certCount} </td>
                  <td className="py-3 px-3 font-semibold text-[13px]" style={{color:a.projectCount>0?'#00E5A0':'rgba(255,255,255,0.3)'}}>{a.projectCount} </td>
                  <td className="py-3 px-3" onClick={e=>e.stopPropagation()}><StatusSelect appId={a.applicationId} current={a.status} onChange={onStatusChange}/></td>
                </tr>
              ))}
            </tbody>
          </table></div>}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="rounded-2xl p-5 h-fit sticky top-20" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-jakarta font-bold text-[14px]" style={{color:'rgba(255,255,255,0.85)'}}>Candidate Detail</span>
              <button onClick={()=>setSelected(null)} className="w-7 h-7 rounded-lg border-0 cursor-pointer grid place-items-center text-xs transition-all" style={{background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)'}}><BrandIcon name="fa-times"/></button>
            </div>
            <div className="flex items-center gap-3 mb-4"><Avatar name={selected.name} avatar={selected.avatar} size={12}/><div><div className="font-jakarta font-bold text-[15px]" style={{color:'rgba(255,255,255,0.85)'}}>{selected.name}</div><div className="text-sm" style={{color:'rgba(255,255,255,0.45)'}}>{selected.title}</div><div className="mt-1"><MeritBadge coins={selected.meritCoins}/></div></div></div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[{l:'Skills',v:selected.skills?.length||0,c:'#4F8EF7',bg:'rgba(79,142,247,0.12)'},{l:'Certs',v:selected.certCount,c:'#00E5A0',bg:'rgba(0,229,160,0.12)'},{l:'Projects',v:selected.projectCount,c:'#F59E0B',bg:'rgba(245,158,11,0.12)'}].map(s=>(
                <div key={s.l} className="text-center rounded-xl p-2" style={{background:s.bg, border:'1px solid rgba(255,255,255,0.06)'}}><div className="font-jakarta font-bold text-[17px]" style={{color:s.c}}>{s.v}</div><div className="text-[10px]" style={{color:'rgba(255,255,255,0.45)'}}>{s.l}</div></div>
              ))}
            </div>
            {selected.skills?.length>0&&<div className="mb-3"><div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{color:'rgba(255,255,255,0.45)'}}>Skills</div><div className="flex flex-wrap gap-1.5">{selected.skills.map((s:any)=><span key={s.name} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{background:'rgba(79,142,247,0.12)',color:'#4F8EF7', border:'1px solid rgba(79,142,247,0.2)'}}>{s.name}</span>)}</div></div>}
            {selected.platforms?.length>0&&<div className="mb-3"><div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{color:'rgba(255,255,255,0.45)'}}>Platforms</div><div className="flex flex-wrap gap-1.5">{selected.platforms.map((p:string)=><span key={p} className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center" style={{background:'rgba(0,229,160,0.12)',color:'#00E5A0', border:'1px solid rgba(0,229,160,0.2)'}}><BrandIcon name="fa-check-circle" className="mr-1 text-[11px]"/>{p}</span>)}</div></div>}
            {selected.projects?.length>0&&(
              <div className="mb-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{color:'rgba(255,255,255,0.45)'}}>Projects ({selected.projects.length})</div>
                <div className="flex flex-col gap-2">
                  {selected.projects.map((p:any)=>(
                    <div key={p.id} className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)'}}>
                      {p.thumbnail&&<img src={p.thumbnail} alt={p.title} className="w-full h-20 object-cover"/>}
                      <div className="p-2.5">
                        <div className="font-semibold text-[12px] mb-1" style={{color:'rgba(255,255,255,0.85)'}}>{p.title}</div>
                        {(p.techStack||[]).length>0&&<div className="flex flex-wrap gap-1 mb-1.5">{(p.techStack||[]).slice(0,4).map((t:string)=><span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{background:'rgba(79,142,247,0.12)',color:'#4F8EF7'}}>{t}</span>)}</div>}
                        <div className="flex gap-2">
                          {p.liveUrl&&<a href={p.liveUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold no-underline hover:underline inline-flex items-center" style={{color:'#4F8EF7'}}><BrandIcon name="fa-external-link-alt" className="mr-1"/>Live</a>}
                          {p.githubUrl&&<a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold no-underline hover:underline inline-flex items-center" style={{color:'rgba(255,255,255,0.6)'}}><BrandIcon name="fab fa-github" className="mr-1"/>Code</a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => {
                  if (!selected.email) { alert('This applicant has no contact email on file.'); return; }
                  const subject = encodeURIComponent(`Regarding your application${selected.job?.title ? ' for ' + selected.job.title : ''}`);
                  const body = encodeURIComponent(`Hi ${selected.name?.split(' ')[0] || ''},\n\nThank you for applying${selected.job?.title ? ' for the ' + selected.job.title + ' role' : ''}. We'd love to learn more about you.\n\nBest regards,`);
                  window.location.href = `mailto:${selected.email}?subject=${subject}&body=${body}`;
                }}
                className="w-full py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
                style={{background:'#4F8EF7'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#6BA0FF'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#4F8EF7'}}
              >Send Message</button>
              <button onClick={()=>{ onStatusChange(selected.applicationId,'shortlisted'); setSelected((p:any)=>({...p,status:'shortlisted'})); }} className="w-full py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all" style={{background:'rgba(0,229,160,0.12)', color:'#00E5A0', borderColor:'rgba(0,229,160,0.2)'}}>Shortlist</button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-10 text-center h-fit" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
            <BrandIcon name="fa-mouse-pointer" className="text-3xl mb-3 block mx-auto" style={{color:'rgba(255,255,255,0.1)'}}/>
            <p className="text-sm" style={{color:'rgba(255,255,255,0.35)'}}>Click a row to see candidate details</p>
          </div>
        )}
      </div>
    </SidebarLayout>
    </EmployerAccessGuard>
  );
}