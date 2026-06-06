'use client';
import { useState, useEffect, useCallback } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/components/employer/EmployerAccessGuard';

function Sk({h='h-4',w='w-full',r='rounded'}:any){return <div className={`${h} ${w} ${r} bg-[#f0f0f8] animate-pulse`}/>;}

const STATUS_STYLE:Record<string,[string,string]>={
  active:['#f0fdf4','#15803d'],closed:['#f5f5fb','#6b6b8a'],draft:['#fffbeb','#92400e'],
};

const TIERS:Record<string,{label:string;icon:string;color:string;bg:string}>={
  platinum:{label:'Platinum',icon:'💎',color:'#7c3aed',bg:'#f4f2ff'},
  gold:    {label:'Gold',    icon:'🥇',color:'#d97706',bg:'#fffbeb'},
  silver:  {label:'Silver',  icon:'🥈',color:'#6b7280',bg:'#f5f5fb'},
  bronze:  {label:'Bronze',  icon:'🥉',color:'#92400e',bg:'#fef3c7'},
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-syne font-bold text-[17px]">Post a New Job</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#f5f5fb] border-0 cursor-pointer text-[#6b6b8a] grid place-items-center"><i className="fas fa-times text-xs"/></button>
        </div>
        {err&&<div className="mb-4 p-3 bg-[#fef2f2] text-[#ef4444] text-sm rounded-xl">{err}</div>}
        <div className="flex flex-col gap-3">
          {[{label:'Job Title *',key:'title',ph:'e.g. Senior Frontend Developer'},{label:'Location *',key:'location',ph:'e.g. Lagos or Remote'},{label:'Salary Range',key:'salary',ph:'e.g. ₦400k–₦600k/mo'},{label:'Required Skills (comma-separated)',key:'skills',ph:'React, TypeScript, Node.js'}].map(f=>(
            <div key={f.key}>
              <label className="block text-xs font-semibold text-[#6b6b8a] mb-1">{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.ph} className="w-full px-3.5 py-2.5 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] transition-all"/>
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
                <option value="bronze">🥉 Bronze+ (0+)</option>
                <option value="silver">🥈 Silver+ (500+)</option>
                <option value="gold">🥇 Gold+ (2,000+)</option>
                <option value="platinum">💎 Platinum only (5,000+)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6b6b8a] mb-1">Job Description *</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={5} placeholder="Describe the role, responsibilities and requirements…" className="w-full px-3.5 py-2.5 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] transition-all resize-none"/>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5fb] cursor-pointer">
            <input type="checkbox" checked={form.isPremium} onChange={e=>set('isPremium',e.target.checked)} className="w-4 h-4 accent-[#5b4cf5]"/>
            <div><div className="text-sm font-semibold">Mark as Featured / Sponsored</div><div className="text-[11px] text-[#6b6b8a]">Featured jobs appear as opportunity ads on student dashboards</div></div>
          </label>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e8e8f0] rounded-xl text-sm font-semibold text-[#6b6b8a] bg-white cursor-pointer hover:bg-[#f5f5fb] transition-all">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all disabled:opacity-60">{saving?'Posting…':'Post Job'}</button>
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

  return (
    <SidebarLayout navItems={employerNavItems} pageTitle="Job Management">
      {toast&&<div className="fixed top-5 right-5 z-50 bg-[#0a0a0f] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2"><i className="fas fa-check-circle text-[#22c55e]"/>{toast}</div>}
      {showPost&&<PostJobModal onClose={()=>setShowPost(false)} onPosted={()=>{showToast('Job posted!');load();}}/>}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><h1 className="font-syne font-bold text-[21px] tracking-tight">Job Management</h1><p className="text-[13px] text-[#6b6b8a]">Create, manage and track all your job postings.</p></div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm text-[#6b6b8a] border border-[#e8e8f0] rounded-lg px-3 py-2 bg-white outline-none font-[inherit] cursor-pointer">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
          <button onClick={()=>setShowPost(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5b4cf5] text-white text-sm font-semibold rounded-xl border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all"><i className="fas fa-plus"/>Post Job</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
        {jobs===null?<div className="flex flex-col gap-3">{[1,2,3,4].map(i=><Sk key={i} h="h-16" r="rounded-xl"/>)}</div>
        :jobs.length===0?(
          <div className="py-16 text-center">
            <i className="fas fa-briefcase text-5xl text-[#e8e8f0] mb-4 block"/>
            <h3 className="font-syne font-bold text-[16px] mb-2">No jobs posted yet</h3>
            <p className="text-sm text-[#9898b8] mb-4">Post your first job to start receiving applications.</p>
            <button onClick={()=>setShowPost(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all"><i className="fas fa-plus"/>Post a Job</button>
          </div>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr>{['Job Title','Type','Location','Min. Tier','Applicants','Featured','Status','Posted'].map(h=><th key={h} className="py-2.5 px-4 text-left text-[11px] font-semibold text-[#6b6b8a] border-b border-[#e8e8f0] uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{jobs.map((job:any)=>{
                const [sbg,sc]=STATUS_STYLE[job.status]||['#f5f5fb','#6b6b8a'];
                const tier=job.minTier?TIERS[job.minTier]:null;
                return (
                  <tr key={job.id} className="hover:bg-[#fafafd] transition-colors">
                    <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                      <div className="font-semibold text-[13px]">{job.title}</div>
                      {job.salary&&<div className="text-[11px] text-[#9898b8]">{job.salary}</div>}
                    </td>
                    <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[12px]">{job.type}</td>
                    <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#6b6b8a] text-[12px]">{job.location}</td>
                    <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                      {tier?<span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{background:tier.bg,color:tier.color}}>{tier.icon} {tier.label}+</span>:<span className="text-[11px] text-[#9898b8]">Any</span>}
                    </td>
                    <td className="py-3.5 px-4 border-b border-[#f0f0f8] font-semibold text-[#5b4cf5] text-[13px]">{job.applicantCount??0}</td>
                    <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                      {job.isPremium?<span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-[#5b4cf5]">⭐ Featured</span>:<span className="text-[11px] text-[#9898b8]">—</span>}
                    </td>
                    <td className="py-3.5 px-4 border-b border-[#f0f0f8]">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize" style={{background:sbg,color:sc}}>{job.status}</span>
                    </td>
                    <td className="py-3.5 px-4 border-b border-[#f0f0f8] text-[#9898b8] text-[11px]">{job.createdAt?new Date(job.createdAt).toLocaleDateString():'—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}