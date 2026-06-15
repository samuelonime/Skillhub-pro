'use client';
import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/app/employer/EmployerAccessGuard';

function Sk({h='h-4',w='w-full',r='rounded'}:any){return <div className={`${h} ${w} ${r} animate-pulse`} style={{background:'rgba(255,255,255,0.06)'}}/>;}

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
      {toast&&<div className="fixed top-5 right-5 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2" style={{background:'#0F1521', border:'1px solid rgba(79,142,247,0.3)'}}><i className="fas fa-check-circle" style={{color:'#00E5A0'}}/>{toast}</div>}

      <div className="flex items-center justify-between mb-5">
        <div><h1 className="font-jakarta font-bold text-[21px] tracking-tight" style={{color:'#FFFFFF'}}>Company Profile</h1><p className="text-[13px]" style={{color:'rgba(255,255,255,0.45)'}}>This information is shown to students viewing your job posts.</p></div>
        {!editing&&<button onClick={()=>setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all" style={{background:'#4F8EF7'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#6BA0FF'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#4F8EF7'}}><i className="fas fa-pen"/>Edit Profile</button>}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 max-[1100px]:grid-cols-1">
        <div className="rounded-2xl p-6" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
          {!profile?<div className="flex flex-col gap-4">{[1,2,3,4,5].map(i=><Sk key={i} h="h-12" r="rounded-xl"/>)}</div>:(
            editing?(
              <div className="flex flex-col gap-4">
                {fields.map(f=>(
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{color:'rgba(255,255,255,0.45)'}}>{f.label}</label>
                    <input value={form?.[f.key]||''} onChange={e=>set(f.key,e.target.value)} placeholder={f.ph}
                      className="w-full px-3.5 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all"
                      style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.85)'}}
                      onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
                      onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{color:'rgba(255,255,255,0.45)'}}>Company Description</label>
                  <textarea value={form?.bio||''} onChange={e=>set('bio',e.target.value)} rows={4} placeholder="Tell candidates about your company, culture and mission…"
                    className="w-full px-3.5 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all resize-none"
                    style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.85)'}}
                    onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
                    onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                  />
                </div>
                <div className="flex gap-2.5 mt-2">
                  <button onClick={()=>{setEditing(false);setForm(profile);}} className="flex-1 py-3 rounded-xl text-sm font-semibold border cursor-pointer transition-all" style={{background:'transparent', color:'rgba(255,255,255,0.6)', borderColor:'rgba(255,255,255,0.08)'}}>Cancel</button>
                  <button onClick={save} disabled={saving} className="flex-1 py-3 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all disabled:opacity-60" style={{background:'#4F8EF7'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#6BA0FF'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#4F8EF7'}}>{saving?'Saving…':'Save Changes'}</button>
                </div>
              </div>
            ):(
              <div>
                <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)'}}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-jakarta font-bold text-2xl text-white flex-shrink-0" style={{background:'linear-gradient(135deg, #4F8EF7 0%, #A78BFA 100%)'}}>
                    {(profile.company||profile.firstName||'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-jakarta font-bold text-[18px]" style={{color:'rgba(255,255,255,0.85)'}}>{profile.company||'Your Company'}</h2>
                    <p className="text-sm" style={{color:'rgba(255,255,255,0.45)'}}>{profile.industry||'Industry not set'}</p>
                    {profile.companyWebsite&&<a href={profile.companyWebsite} target="_blank" rel="noreferrer" className="text-xs font-semibold no-underline hover:underline" style={{color:'#4F8EF7'}}>{profile.companyWebsite} ↗</a>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  {[
                    {label:'Location',     value:profile.location,    icon:'fa-map-marker-alt'},
                    {label:'Company Size', value:profile.companySize,  icon:'fa-users'},
                    {label:'Industry',     value:profile.industry,     icon:'fa-industry'},
                    {label:'Website',      value:profile.companyWebsite,icon:'fa-globe'},
                  ].map(f=>(
                    <div key={f.label} className="flex items-start gap-2.5 p-3 rounded-xl" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)'}}>
                      <i className={`fas ${f.icon} text-sm mt-0.5 flex-shrink-0`} style={{color:'#4F8EF7'}}/>
                      <div><div className="text-[10px] uppercase tracking-wide font-semibold" style={{color:'rgba(255,255,255,0.45)'}}>{f.label}</div><div className="text-[13px] font-semibold mt-0.5" style={{color:'rgba(255,255,255,0.85)'}}>{f.value||<span style={{color:'rgba(255,255,255,0.35)'}}>Not set</span>}</div></div>
                    </div>
                  ))}
                </div>
                {profile.bio&&<div><div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{color:'rgba(255,255,255,0.45)'}}>About</div><p className="text-[13.5px] leading-relaxed" style={{color:'rgba(255,255,255,0.7)'}}>{profile.bio}</p></div>}
              </div>
            )
          )}
        </div>

        {/* Contact info */}
        <div className="rounded-2xl p-5 h-fit" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
          <span className="font-jakarta font-bold text-[15px] block mb-4" style={{color:'rgba(255,255,255,0.85)'}}>Contact Information</span>
          {!profile?<div className="flex flex-col gap-3">{[1,2,3].map(i=><Sk key={i} h="h-12" r="rounded-xl"/>)}</div>:(
            <div className="flex flex-col gap-3">
              {[
                {icon:'fa-user',      label:'Name',  value:`${profile.firstName} ${profile.lastName}`},
                {icon:'fa-envelope',  label:'Email', value:profile.email},
                {icon:'fa-phone',     label:'Phone', value:profile.phone},
              ].map(f=>(
                <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)'}}>
                  <div className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0" style={{background:'rgba(79,142,247,0.12)'}}><i className={`fas ${f.icon} text-xs`} style={{color:'#4F8EF7'}}/></div>
                  <div><div className="text-[10px] font-semibold" style={{color:'rgba(255,255,255,0.45)'}}>{f.label}</div><div className="text-[13px] font-semibold" style={{color:'rgba(255,255,255,0.85)'}}>{f.value||<span style={{color:'rgba(255,255,255,0.35)'}}>Not set</span>}</div></div>
                </div>
              ))}
              <p className="text-[11px] mt-1" style={{color:'rgba(255,255,255,0.35)'}}>To update contact details, go to <a href="/employer/settings" className="font-semibold no-underline hover:underline" style={{color:'#4F8EF7'}}>Settings</a>.</p>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
    </EmployerAccessGuard>
  );
}