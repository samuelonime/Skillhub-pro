'use client';
import { useState, useEffect, useCallback } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/components/employer/EmployerAccessGuard';

const TIERS:Record<string,{label:string;icon:string;color:string;bg:string;border:string}> = {
  platinum:{label:'Platinum',icon:'💎',color:'#7c3aed',bg:'#f4f2ff',border:'#c4b5fd'},
  gold:    {label:'Gold',    icon:'🥇',color:'#d97706',bg:'#fffbeb',border:'#fcd34d'},
  silver:  {label:'Silver',  icon:'🥈',color:'#6b7280',bg:'#f5f5fb',border:'#d1d5db'},
  bronze:  {label:'Bronze',  icon:'🥉',color:'#92400e',bg:'#fef3c7',border:'#d97706'},
};
function getTier(c:number){return c>=5000?'platinum':c>=2000?'gold':c>=500?'silver':'bronze';}
function MeritBadge({coins}:{coins:number}){const t=TIERS[getTier(coins)];return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{background:t.bg,color:t.color}}>{t.icon} {t.label} · {coins.toLocaleString()}</span>;}
function Sk({h='h-4',w='w-full',r='rounded'}:any){return <div className={`${h} ${w} ${r} bg-[#f0f0f8] animate-pulse`}/>;}
function Avatar({name,avatar,size=8}:{name:string;avatar?:string;size?:number}){
  const initials=(name||'U').split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
  const colors=['#5b4cf5','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6'];
  const color=colors[initials.charCodeAt(0)%colors.length];
  if(avatar) return <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`}/>;
  return <div className={`w-${size} h-${size} rounded-full flex-shrink-0 grid place-items-center font-syne font-bold text-white text-xs`} style={{background:color}}>{initials}</div>;
}

function ProfileDrawer({userId,onClose}:{userId:string|null;onClose:()=>void}){
  const [profile,setProfile]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{
    if(!userId) return;
    setProfile(null);setLoading(true);
    apiFetch(`/employer/talent/${userId}`).then(r=>{if(r.success)setProfile(r.data);}).catch(()=>{}).finally(()=>setLoading(false));
  },[userId]);
  if(!userId) return null;
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40 backdrop-blur-sm"/>
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#e8e8f0] sticky top-0 bg-white z-10">
          <span className="font-syne font-bold text-[15px]">Candidate Profile</span>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] grid place-items-center"><i className="fas fa-times text-xs"/></button>
        </div>
        {loading?<div className="p-5 flex flex-col gap-3"><Sk h="h-20" r="rounded-2xl"/>{[1,2,3,4].map(i=><Sk key={i} h="h-12" r="rounded-xl"/>)}</div>
        :profile?(
          <div className="p-5">
            <div className="flex items-center gap-4 mb-5">
              <Avatar name={profile.name} avatar={profile.avatar} size={14}/>
              <div><h2 className="font-syne font-bold text-[17px]">{profile.name}</h2><p className="text-sm text-[#6b6b8a]">{profile.title}</p><p className="text-xs text-[#9898b8]">{profile.location}</p><div className="mt-1.5"><MeritBadge coins={profile.meritCoins||0}/></div></div>
            </div>
            {profile.bio&&<p className="text-sm text-[#6b6b8a] leading-relaxed mb-5 p-3 bg-[#f5f5fb] rounded-xl">{profile.bio}</p>}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[{l:'Skills',v:profile.skills?.length||0,c:'#5b4cf5',bg:'#f4f2ff'},{l:'Certs',v:profile.certificates?.length||0,c:'#22c55e',bg:'#f0fdf4'},{l:'Projects',v:profile.projects?.length||0,c:'#f59e0b',bg:'#fffbeb'}].map(s=>(
                <div key={s.l} className="rounded-xl p-3 text-center" style={{background:s.bg}}><div className="font-syne font-bold text-[18px]" style={{color:s.c}}>{s.v}</div><div className="text-[10px] text-[#6b6b8a]">{s.l}</div></div>
              ))}
            </div>
            {profile.skills?.length>0&&<div className="mb-5"><div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Skills</div><div className="flex flex-wrap gap-1.5">{profile.skills.map((s:any)=><span key={s.name} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#f4f2ff] text-[#5b4cf5]">{s.verified&&<i className="fas fa-check-circle mr-1 text-[10px]"/>}{s.name}</span>)}</div></div>}
            {profile.certificates?.length>0&&<div className="mb-5"><div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Certificates</div>{profile.certificates.map((c:any)=><div key={c.id} className="flex items-center gap-2.5 py-2.5 border-b border-[#f0f0f8] last:border-0"><div className="w-7 h-7 rounded-lg bg-[#fffbeb] grid place-items-center text-sm flex-shrink-0">🏆</div><div className="flex-1 min-w-0"><div className="text-[13px] font-semibold truncate">{c.title}</div><div className="text-[11px] text-[#9898b8]">{c.provider}</div></div>{c.credentialUrl&&<a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#5b4cf5] font-semibold no-underline">View ↗</a>}</div>)}</div>}
            {profile.projects?.length>0&&<div className="mb-5"><div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Projects</div>{profile.projects.map((p:any)=><div key={p.id} className="p-3 rounded-xl bg-[#f5f5fb] mb-2"><div className="font-semibold text-[13px] mb-1">{p.title}</div><p className="text-[11px] text-[#6b6b8a] line-clamp-2 mb-2">{p.description}</p><div className="flex gap-1 flex-wrap">{(p.techStack||[]).slice(0,4).map((t:string)=><span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#6b6b8a] border border-[#e8e8f0]">{t}</span>)}</div><div className="flex gap-2 mt-2">{p.liveUrl&&<a href={p.liveUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#5b4cf5] font-semibold no-underline">Live ↗</a>}{p.githubUrl&&<a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#6b6b8a] font-semibold no-underline">GitHub ↗</a>}</div></div>)}</div>}
            {profile.platforms?.length>0&&<div className="mb-5"><div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">Learning Platforms</div><div className="flex flex-wrap gap-1.5">{profile.platforms.map((p:string)=><span key={p} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f0fdf4] text-[#22c55e]"><i className="fas fa-check-circle mr-1"/>{p}</span>)}</div></div>}
            {profile.resume?.fileUrl&&<a href={profile.resume.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-[#f4f2ff] no-underline hover:bg-[#5b4cf5] hover:text-white transition-all group"><i className="fas fa-file-pdf text-[#5b4cf5] group-hover:text-white"/><span className="text-sm font-semibold text-[#5b4cf5] group-hover:text-white">Download Resume</span></a>}
          </div>
        ):<div className="p-10 text-center text-[#9898b8]">Profile not available</div>}
      </div>
    </div>
  );
}

export default function TalentPage(){
  const [talent,setTalent]=useState<any[]|null>(null);
  const [total,setTotal]=useState(0);
  const [tierFilter,setTierFilter]=useState('all');
  const [search,setSearch]=useState('');
  const [selectedUser,setSelectedUser]=useState<string|null>(null);

  const load=useCallback(async()=>{
    try{
      const p=new URLSearchParams();
      if(tierFilter!=='all') p.set('tier',tierFilter);
      if(search) p.set('search',search);
      const r=await apiFetch(`/employer/talent?${p}`);
      if(r.success){setTalent(r.data.users);setTotal(r.data.total);}else setTalent([]);
    }catch{setTalent([]);}
  },[tierFilter,search]);

  useEffect(()=>{load();},[load]);

  return (
    <SidebarLayout navItems={employerNavItems} pageTitle="Talent Search">
      <ProfileDrawer userId={selectedUser} onClose={()=>setSelectedUser(null)}/>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><h1 className="font-syne font-bold text-[21px] tracking-tight">Talent Search</h1><p className="text-[13px] text-[#6b6b8a]">{total.toLocaleString()} verified candidates ranked by Merit Coins.</p></div>
        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Search by name or title…" className="px-3 py-2 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] transition-all"/>
          <div className="flex gap-1 bg-[#f5f5fb] p-1 rounded-xl border border-[#e8e8f0]">
            {(['all','platinum','gold','silver','bronze'] as const).map(t=>(
              <button key={t} onClick={()=>setTierFilter(t)} className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold border-0 cursor-pointer transition-all ${tierFilter===t?'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-[#0a0a0f]':'bg-transparent text-[#6b6b8a]'}`}>
                {t==='all'?'All':`${TIERS[t].icon} ${TIERS[t].label}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Platinum featured */}
      {tierFilter==='all'&&talent&&talent.some(u=>u.meritCoins>=5000)&&(
        <div className="mb-5">
          <div className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full w-fit mb-3" style={{background:'linear-gradient(90deg,#5b4cf5,#7c3aed)'}}>💎 PLATINUM — TOP TALENT</div>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            {talent.filter(u=>u.meritCoins>=5000).slice(0,3).map((u:any)=>(
              <div key={u.id} className="bg-white rounded-2xl p-5 border-2 border-[#7c3aed]/25 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(124,58,237,0.12)] transition-all cursor-pointer" onClick={()=>setSelectedUser(u.id)}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5b4cf5] to-[#7c3aed]"/>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={u.name} avatar={u.avatar} size={12}/>
                  <div><div className="font-syne font-bold text-[14px]">{u.name}</div><div className="text-xs text-[#6b6b8a]">{u.title||u.location}</div><MeritBadge coins={u.meritCoins}/></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[{v:u.skills?.length||0,l:'Skills',c:'#5b4cf5',bg:'#f4f2ff'},{v:u.certCount,l:'Certs',c:'#22c55e',bg:'#f0fdf4'},{v:u.projectCount,l:'Projects',c:'#f59e0b',bg:'#fffbeb'}].map(s=>(
                    <div key={s.l} className="text-center rounded-xl p-2" style={{background:s.bg}}><div className="font-syne font-bold text-sm" style={{color:s.c}}>{s.v}</div><div className="text-[9px] text-[#9898b8]">{s.l}</div></div>
                  ))}
                </div>
                {u.platforms?.length>0&&<div className="flex flex-wrap gap-1 mb-3">{u.platforms.map((p:string)=><span key={p} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#22c55e]">{p}</span>)}</div>}
                <button onClick={e=>{e.stopPropagation();setSelectedUser(u.id);}} className="w-full py-2 text-xs font-semibold text-white bg-[#5b4cf5] rounded-xl border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all">View Full Profile</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
        {talent===null?<div className="flex flex-col gap-3">{[1,2,3,4,5].map(i=><Sk key={i} h="h-14" r="rounded-xl"/>)}</div>
        :talent.length===0?<p className="text-sm text-[#9898b8] py-8 text-center">No candidates found.</p>
        :<div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
          <thead><tr>{['#','Candidate','Merit Tier','Skills','Certs','Projects','Platforms','Action'].map(h=><th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>{talent.map((u:any,idx:number)=>(
            <tr key={u.id} className={`hover:bg-[#fafafd] transition-colors ${u.meritCoins>=5000?'bg-[#fafaff]':''}`}>
              <td className="py-3 px-3 border-b border-[#f0f0f8]"><span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${idx===0?'bg-[#f59e0b] text-white':idx===1?'bg-[#9898b8] text-white':idx===2?'bg-[#cd7f32] text-white':'bg-[#f5f5fb] text-[#6b6b8a]'}`}>{idx+1}</span></td>
              <td className="py-3 px-3 border-b border-[#f0f0f8]"><div className="flex items-center gap-2.5"><Avatar name={u.name} avatar={u.avatar}/><div><div className="font-semibold text-[13px]">{u.name}</div>{u.title&&<div className="text-[10px] text-[#9898b8]">{u.title}</div>}</div></div></td>
              <td className="py-3 px-3 border-b border-[#f0f0f8]"><MeritBadge coins={u.meritCoins}/></td>
              <td className="py-3 px-3 border-b border-[#f0f0f8]"><div className="flex flex-wrap gap-1 max-w-[140px]">{u.skills?.slice(0,3).map((s:any)=><span key={s.name} className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f2ff] text-[#5b4cf5] font-semibold">{s.name}</span>)}{u.skills?.length>3&&<span className="text-[10px] text-[#9898b8]">+{u.skills.length-3}</span>}</div></td>
              <td className="py-3 px-3 border-b border-[#f0f0f8] font-semibold text-[13px]">{u.certCount}</td>
              <td className="py-3 px-3 border-b border-[#f0f0f8] font-semibold text-[13px]" style={{color:u.projectCount>0?'#22c55e':'#9898b8'}}>{u.projectCount}</td>
              <td className="py-3 px-3 border-b border-[#f0f0f8]">{u.platforms?.length>0?<span className="text-[11px] text-[#5b4cf5]">{u.platforms.slice(0,2).join(', ')}{u.platforms.length>2?` +${u.platforms.length-2}`:''}</span>:<span className="text-[11px] text-[#9898b8]">—</span>}</td>
              <td className="py-3 px-3 border-b border-[#f0f0f8]"><button onClick={()=>setSelectedUser(u.id)} className="text-[12px] font-semibold text-[#5b4cf5] bg-[#f4f2ff] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-[#5b4cf5] hover:text-white transition-all">Profile</button></td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>
    </SidebarLayout>
  );
}