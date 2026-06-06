'use client';
import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/app/employer/EmployerAccessGuard';

function Sk({h='h-4',w='w-full',r='rounded'}:any){return <div className={`${h} ${w} ${r} bg-[#f0f0f8] animate-pulse`}/>;}

export default function CompanyPage(){
  const [profile,setProfile]=useState<any>(null);
  const [form,setForm]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState('');
  const [editing,setEditing]=useState(false);

  function showToast(msg:string){setToast(msg);setTimeout(()=>setToast(''),3000);}

  useEffect(()=>{
    apiFetch('/employer/profile').then(r=>{
      if(r.success){setProfile(r.data);setForm(r.data);}
    }).catch(()=>{});
  },[]);

  function set(k:string,v:string){setForm((p:any)=>({...p,[k]:v}));}

  async function save(){
    setSaving(true);
    try{
      const res=await apiFetch('/employer/profile',{method:'PUT',body:JSON.stringify(form)});
      if(res.success){setProfile(res.data);setForm(res.data);showToast('Company profile updated!');setEditing(false);}
      else showToast(res.message||'Failed to save');
    }catch{showToast('Failed to save');}
    finally{setSaving(false);}
  }

  const fields=[
    {label:'Company Name',   key:'company',          ph:'e.g. TechVision Africa'},
    {label:'Website',        key:'companyWebsite',    ph:'https://yourcompany.com'},
    {label:'Industry',       key:'industry',          ph:'e.g. Technology, Finance'},
    {label:'Company Size',   key:'companySize',       ph:'e.g. 10–50 employees'},
    {label:'Location',       key:'location',          ph:'e.g. Lagos, Nigeria'},
  ];

  return (
    <EmployerAccessGuard>
    <SidebarLayout navItems={employerNavItems} pageTitle="Company Profile">
      {toast&&<div className="fixed top-5 right-5 z-50 bg-[#0a0a0f] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2"><i className="fas fa-check-circle text-[#22c55e]"/>{toast}</div>}

      <div className="flex items-center justify-between mb-5">
        <div><h1 className="font-syne font-bold text-[21px] tracking-tight">Company Profile</h1><p className="text-[13px] text-[#6b6b8a]">This information is shown to students viewing your job posts.</p></div>
        {!editing&&<button onClick={()=>setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all"><i className="fas fa-pen"/>Edit Profile</button>}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 max-[1100px]:grid-cols-1">
        <div className="bg-white rounded-2xl p-6 border border-[#e8e8f0]">
          {!profile?<div className="flex flex-col gap-4">{[1,2,3,4,5].map(i=><Sk key={i} h="h-12" r="rounded-xl"/>)}</div>:(
            editing?(
              <div className="flex flex-col gap-4">
                {fields.map(f=>(
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-[#6b6b8a] mb-1.5">{f.label}</label>
                    <input value={form?.[f.key]||''} onChange={e=>set(f.key,e.target.value)} placeholder={f.ph}
                      className="w-full px-3.5 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all"/>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#6b6b8a] mb-1.5">Company Description</label>
                  <textarea value={form?.bio||''} onChange={e=>set('bio',e.target.value)} rows={4} placeholder="Tell candidates about your company, culture and mission…"
                    className="w-full px-3.5 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all resize-none"/>
                </div>
                <div className="flex gap-2.5 mt-2">
                  <button onClick={()=>{setEditing(false);setForm(profile);}} className="flex-1 py-3 border border-[#e8e8f0] rounded-xl text-sm font-semibold text-[#6b6b8a] bg-white cursor-pointer hover:bg-[#f5f5fb] transition-all">Cancel</button>
                  <button onClick={save} disabled={saving} className="flex-1 py-3 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all disabled:opacity-60">{saving?'Saving…':'Save Changes'}</button>
                </div>
              </div>
            ):(
              <div>
                <div className="flex items-center gap-4 mb-6 p-4 bg-[#f5f5fb] rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-[#5b4cf5] grid place-items-center font-syne font-bold text-2xl text-white flex-shrink-0">
                    {(profile.company||profile.firstName||'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-syne font-bold text-[18px]">{profile.company||'Your Company'}</h2>
                    <p className="text-sm text-[#6b6b8a]">{profile.industry||'Industry not set'}</p>
                    {profile.companyWebsite&&<a href={profile.companyWebsite} target="_blank" rel="noreferrer" className="text-xs text-[#5b4cf5] font-semibold no-underline hover:underline">{profile.companyWebsite} ↗</a>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  {[
                    {label:'Location',     value:profile.location,    icon:'fa-map-marker-alt'},
                    {label:'Company Size', value:profile.companySize,  icon:'fa-users'},
                    {label:'Industry',     value:profile.industry,     icon:'fa-industry'},
                    {label:'Website',      value:profile.companyWebsite,icon:'fa-globe'},
                  ].map(f=>(
                    <div key={f.label} className="flex items-start gap-2.5 p-3 bg-[#f5f5fb] rounded-xl">
                      <i className={`fas ${f.icon} text-[#5b4cf5] text-sm mt-0.5 flex-shrink-0`}/>
                      <div><div className="text-[10px] text-[#9898b8] uppercase tracking-wide font-semibold">{f.label}</div><div className="text-[13px] font-semibold text-[#0a0a0f] mt-0.5">{f.value||<span className="text-[#9898b8] font-normal">Not set</span>}</div></div>
                    </div>
                  ))}
                </div>
                {profile.bio&&<div><div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-2">About</div><p className="text-[13.5px] text-[#2d2d42] leading-relaxed">{profile.bio}</p></div>}
              </div>
            )
          )}
        </div>

        {/* Contact info */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0] h-fit">
          <span className="font-syne font-bold text-[15px] block mb-4">Contact Information</span>
          {!profile?<div className="flex flex-col gap-3">{[1,2,3].map(i=><Sk key={i} h="h-12" r="rounded-xl"/>)}</div>:(
            <div className="flex flex-col gap-3">
              {[
                {icon:'fa-user',      label:'Name',  value:`${profile.firstName} ${profile.lastName}`},
                {icon:'fa-envelope',  label:'Email', value:profile.email},
                {icon:'fa-phone',     label:'Phone', value:profile.phone},
              ].map(f=>(
                <div key={f.label} className="flex items-center gap-3 p-3 bg-[#f5f5fb] rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-[#f4f2ff] grid place-items-center flex-shrink-0"><i className={`fas ${f.icon} text-[#5b4cf5] text-xs`}/></div>
                  <div><div className="text-[10px] text-[#9898b8] font-semibold">{f.label}</div><div className="text-[13px] font-semibold">{f.value||<span className="text-[#9898b8] font-normal">Not set</span>}</div></div>
                </div>
              ))}
              <p className="text-[11px] text-[#9898b8] mt-1">To update contact details, go to <a href="/employer/settings" className="text-[#5b4cf5] font-semibold no-underline hover:underline">Settings</a>.</p>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
    </EmployerAccessGuard>
  );
}