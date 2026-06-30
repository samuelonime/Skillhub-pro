'use client';
import { useState, useEffect, useCallback } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/app/employer/EmployerAccessGuard';
import { BrandIcon } from '@/components/ui/BrandIcon';

function Sk({h='h-4',w='w-full',r='rounded'}:any){return <div className={`${h} ${w} ${r} animate-pulse`} style={{background:'rgba(255,255,255,0.06)'}}/>;}

const STATUS_STYLE:Record<string,[string,string]>={
  active:['rgba(0,229,160,0.12)','#00E5A0'],
  closed:['rgba(255,255,255,0.06)','rgba(255,255,255,0.45)'],
  draft:['rgba(245,158,11,0.12)','#F59E0B'],
};

const TIERS:Record<string,{label:string;icon:string;color:string;bg:string}>={
  platinum:{label:'Platinum',icon:'💎',color:'#A78BFA',bg:'rgba(167,139,250,0.12)'},
  gold:    {label:'Gold',    icon:'🥇',color:'#F59E0B',bg:'rgba(245,158,11,0.12)'},
  silver:  {label:'Silver',  icon:'🥈',color:'#94A3B8',bg:'rgba(148,163,184,0.12)'},
  bronze:  {label:'Bronze',  icon:'🥉',color:'#CD7C54',bg:'rgba(205,124,84,0.12)'},
};

function PostJobModal({onClose,onPosted}:{onClose:()=>void;onPosted:()=>void}){
  const [form,setForm]=useState({title:'',description:'',type:'Full-time',location:'',salary:'',skills:'',minTier:'',isPremium:false});
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState('');
  function set(k:string,v:any){setForm(p=>({...p,[k]:v}));}
  async function submit(){
    if(!form.title||!form.description||!form.location){setErr('Title, description and location are required');return;}
    setSaving(true);setErr('');
    try{
      const res=await apiFetch('/jobs',{method:'POST',body:JSON.stringify({...form,skills:form.skills.split(',').map(s=>s.trim()).filter(Boolean)})});
      if(res.success){onPosted();onClose();}else setErr(res.message||'Failed');
    }catch(e:any){setErr(e.message||'Failed');}finally{setSaving(false);}
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.09)'}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-jakarta font-bold text-[17px]" style={{color:'rgba(255,255,255,0.85)'}}>Post a New Job</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border-0 cursor-pointer grid place-items-center transition-all" style={{background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)'}}>
            <BrandIcon name="fa-times" className="text-xs"/>
          </button>
        </div>
        {err&&<div className="mb-4 p-3 rounded-xl text-sm" style={{background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.2)'}}>{err}</div>}
        <div className="flex flex-col gap-3">
          {[{label:'Job Title *',key:'title',ph:'e.g. Senior Frontend Developer'},{label:'Location *',key:'location',ph:'e.g. Lagos or Remote'},{label:'Salary Range',key:'salary',ph:'e.g. ₦400k–₦600k/mo'},{label:'Required Skills (comma-separated)',key:'skills',ph:'React, TypeScript, Node.js'}].map(f=>(
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1" style={{color:'rgba(255,255,255,0.45)'}}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.ph} 
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none transition-all"
                style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.85)'}}
                onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{color:'rgba(255,255,255,0.45)'}}>Job Type</label>
              <select value={form.type} onChange={e=>set('type',e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none cursor-pointer"
                style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.85)'}}>
                {['Full-time','Part-time','Contract','Remote','Internship'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{color:'rgba(255,255,255,0.45)'}}>Min. Merit Tier</label>
              <select value={form.minTier} onChange={e=>set('minTier',e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none cursor-pointer"
                style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.85)'}}>
                <option value="">Any (visible to all)</option>
                <option value="bronze">🥉 Bronze+ (0+)</option>
                <option value="silver">🥈 Silver+ (500+)</option>
                <option value="gold">🥇 Gold+ (2,000+)</option>
                <option value="platinum">💎 Platinum only (5,000+)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{color:'rgba(255,255,255,0.45)'}}>Job Description *</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={5} placeholder="Describe the role, responsibilities and requirements…" 
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-[inherit] outline-none transition-all resize-none"
              style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.85)'}}
              onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)'}}>
            <input type="checkbox" checked={form.isPremium} onChange={e=>set('isPremium',e.target.checked)} className="w-4 h-4 accent-[#4F8EF7]"/>
            <div><div className="text-sm font-semibold" style={{color:'rgba(255,255,255,0.85)'}}>Mark as Featured / Sponsored</div><div className="text-[11px]" style={{color:'rgba(255,255,255,0.45)'}}>Featured jobs appear as opportunity ads on student dashboards</div></div>
          </label>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all" style={{background:'transparent', color:'rgba(255,255,255,0.6)', borderColor:'rgba(255,255,255,0.08)'}}>Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all disabled:opacity-60"
            style={{background:'#4F8EF7'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#6BA0FF'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#4F8EF7'}}>{saving?'Posting…':'Post Job'}</button>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage(){
  const [jobs,setJobs]=useState<any[]|null>(null);
  const [statusFilter,setStatusFilter]=useState('');
  const [showPost,setShowPost]=useState(false);
  const [toast,setToast]=useState('');

  function showToast(msg:string){setToast(msg);setTimeout(()=>setToast(''),3000);}

  const load=useCallback(async()=>{
    try{
      const p=new URLSearchParams();
      if(statusFilter) p.set('status',statusFilter);
      const r=await apiFetch(`/employer/jobs?${p}`);
      if(r.success) setJobs(r.data); else setJobs([]);
    }catch{setJobs([]);}
  },[statusFilter]);

  useEffect(()=>{load();},[load]);

  const headers = ['Job Title','Type','Location','Min. Tier','Applicants','Featured','Status','Posted'];

  return (
    <EmployerAccessGuard>
    <SidebarLayout navItems={employerNavItems} pageTitle="Job Management">
      {toast&&<div className="fixed top-5 right-5 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2" style={{background:'#0F1521', border:'1px solid rgba(79,142,247,0.3)'}}><BrandIcon name="fa-check-circle" className="text-sm" style={{color:'#2563eb'}}/>{toast}</div>}
      {showPost&&<PostJobModal onClose={()=>setShowPost(false)} onPosted={()=>{showToast('Job posted!');load();}}/>}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><h1 className="font-jakarta font-bold text-[21px] tracking-tight" style={{color:'#FFFFFF'}}>Job Management</h1><p className="text-[13px]" style={{color:'rgba(255,255,255,0.45)'}}>Create, manage and track all your job postings.</p></div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} 
            className="text-sm rounded-lg px-3 py-2 outline-none font-[inherit] cursor-pointer"
            style={{color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)'}}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
          <button onClick={()=>setShowPost(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl border-0 cursor-pointer transition-all"
            style={{background:'#4F8EF7'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#6BA0FF'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#4F8EF7'}}>
            <BrandIcon name="fa-plus" className="text-sm"/>Post Job
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
        {jobs===null?<div className="flex flex-col gap-3">{[1,2,3,4].map(i=><Sk key={i} h="h-16" r="rounded-xl"/>)}</div>
        :jobs.length===0?(
          <div className="py-16 text-center">
            <BrandIcon name="fa-briefcase" className="text-5xl mb-4 block mx-auto" style={{color:'rgba(255,255,255,0.1)'}}/>
            <h3 className="font-jakarta font-bold text-[16px] mb-2" style={{color:'rgba(255,255,255,0.85)'}}>No jobs posted yet</h3>
            <p className="text-sm mb-4" style={{color:'rgba(255,255,255,0.45)'}}>Post your first job to start receiving applications.</p>
            <button onClick={()=>setShowPost(true)} className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
              style={{background:'#4F8EF7'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#6BA0FF'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#4F8EF7'}}>
              <BrandIcon name="fa-plus" className="text-sm"/>Post a Job
            </button>
          </div>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {headers.map(h=>(
                    <th key={h} className="py-2.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{color:'rgba(255,255,255,0.45)', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job:any)=>{
                  const [sbg,sc]=STATUS_STYLE[job.status]||['rgba(255,255,255,0.06)','rgba(255,255,255,0.45)'];
                  const tier=job.minTier?TIERS[job.minTier]:null;
                  return (
                    <tr key={job.id} className="transition-colors" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[13px]" style={{color:'rgba(255,255,255,0.85)'}}>{job.title}</div>
                        {job.salary&&<div className="text-[11px]" style={{color:'rgba(255,255,255,0.45)'}}>{job.salary}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-[12px]" style={{color:'rgba(255,255,255,0.45)'}}>{job.type} </td>
                      <td className="py-3.5 px-4 text-[12px]" style={{color:'rgba(255,255,255,0.45)'}}>{job.location} </td>
                      <td className="py-3.5 px-4">
                        {tier?<span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{background:tier.bg,color:tier.color, border:`1px solid ${tier.color}20`}}>{tier.icon} {tier.label}+</span>:<span className="text-[11px]" style={{color:'rgba(255,255,255,0.35)'}}>Any</span>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[13px]" style={{color:'#4F8EF7'}}>{job.applicantCount??0}</td>
                      <td className="py-3.5 px-4">
                        {job.isPremium?<span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{background:'#4F8EF7'}}>⭐ Featured</span>:<span className="text-[11px]" style={{color:'rgba(255,255,255,0.35)'}}>—</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize" style={{background:sbg,color:sc}}>{job.status}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px]" style={{color:'rgba(255,255,255,0.35)'}}>{job.createdAt?new Date(job.createdAt).toLocaleDateString():'—'} </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SidebarLayout>
    </EmployerAccessGuard>
  );
}