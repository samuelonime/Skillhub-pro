'use client';
import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/app/employer/EmployerAccessGuard';

function Sk({h='h-4',w='w-full',r='rounded'}:any){return <div className={`${h} ${w} ${r} bg-[#f0f0f8] animate-pulse`}/>;}

function InputField({label,value,onChange,type='text',placeholder='',disabled=false}:any){
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6b6b8a] mb-1.5">{label}</label>
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className="w-full px-3.5 py-3 border border-[#e8e8f0] rounded-xl text-sm font-[inherit] outline-none focus:border-[#5b4cf5] focus:shadow-[0_0_0_3px_rgba(91,76,245,0.1)] transition-all disabled:bg-[#f5f5fb] disabled:text-[#9898b8]"/>
    </div>
  );
}

export default function SettingsPage(){
  const [profile,setProfile]=useState<any>(null);
  const [form,setForm]=useState<any>({});
  const [pwForm,setPwForm]=useState({currentPassword:'',newPassword:'',confirmPassword:''});
  const [savingProfile,setSavingProfile]=useState(false);
  const [savingPw,setSavingPw]=useState(false);
  const [toast,setToast]=useState('');
  const [toastType,setToastType]=useState<'success'|'error'>('success');
  const [activeSection,setActiveSection]=useState<'account'|'password'|'notifications'>('account');

  function showToast(msg:string,type:'success'|'error'='success'){setToast(msg);setToastType(type);setTimeout(()=>setToast(''),4000);}

  useEffect(()=>{
    apiFetch('/employer/profile').then(r=>{
      if(r.success){setProfile(r.data);setForm({firstName:r.data.firstName,lastName:r.data.lastName,email:r.data.email,phone:r.data.phone||''});}
    }).catch(()=>{});
  },[]);

  function setF(k:string,v:string){setForm((p:any)=>({...p,[k]:v}));}
  function setPw(k:string,v:string){setPwForm(p=>({...p,[k]:v}));}

  async function saveProfile(){
    setSavingProfile(true);
    try{
      const res=await apiFetch('/employer/profile',{method:'PUT',body:JSON.stringify({...profile,...form})});
      if(res.success){setProfile(res.data);showToast('Profile updated successfully!');}
      else showToast(res.message||'Failed to save','error');
    }catch{showToast('Failed to save','error');}
    finally{setSavingProfile(false);}
  }

  async function savePassword(){
    if(pwForm.newPassword!==pwForm.confirmPassword){showToast('New passwords do not match','error');return;}
    if(pwForm.newPassword.length<8){showToast('Password must be at least 8 characters','error');return;}
    setSavingPw(true);
    try{
      const res=await apiFetch('/employer/account/password',{method:'PUT',body:JSON.stringify({currentPassword:pwForm.currentPassword,newPassword:pwForm.newPassword})});
      if(res.success){showToast('Password updated!');setPwForm({currentPassword:'',newPassword:'',confirmPassword:''});}
      else showToast(res.message||'Failed to update password','error');
    }catch{showToast('Failed to update password','error');}
    finally{setSavingPw(false);}
  }

  const sections=[
    {key:'account',      icon:'fa-user-circle', label:'Account'},
    {key:'password',     icon:'fa-lock',        label:'Password'},
    {key:'notifications',icon:'fa-bell',        label:'Notifications'},
  ] as const;

  return (
    <EmployerAccessGuard>
    <SidebarLayout navItems={employerNavItems} pageTitle="Settings">
      {toast&&(
        <div className={`fixed top-5 right-5 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 ${toastType==='success'?'bg-[#0a0a0f]':'bg-[#ef4444]'}`}>
          <i className={`fas ${toastType==='success'?'fa-check-circle text-[#22c55e]':'fa-exclamation-circle'}`}/>{toast}
        </div>
      )}

      <div className="mb-5">
        <h1 className="font-syne font-bold text-[21px] tracking-tight">Settings</h1>
        <p className="text-[13px] text-[#6b6b8a]">Manage your account, password and preferences.</p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-5 max-[900px]:grid-cols-1">
        {/* Sidebar nav */}
        <div className="bg-white rounded-2xl p-3 border border-[#e8e8f0] h-fit">
          {/* Profile mini card */}
          <div className="flex items-center gap-3 p-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#5b4cf5] grid place-items-center font-syne font-bold text-white flex-shrink-0">
              {profile?`${profile.firstName?.[0]||''}${profile.lastName?.[0]||''}`:' '}
            </div>
            <div className="min-w-0">
              {!profile?<><Sk h="h-4" w="w-24" r="rounded"/><Sk h="h-3" w="w-16" r="rounded" /></>:<>
                <div className="font-semibold text-[13px] truncate">{profile.firstName} {profile.lastName}</div>
                <div className="text-[11px] text-[#9898b8] truncate">{profile.email}</div>
              </>}
            </div>
          </div>
          <div className="h-px bg-[#e8e8f0] mb-2"/>
          {sections.map(s=>(
            <button key={s.key} onClick={()=>setActiveSection(s.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium font-[inherit] cursor-pointer border-0 text-left transition-all ${activeSection===s.key?'bg-[#f4f2ff] text-[#5b4cf5] font-semibold':'bg-transparent text-[#6b6b8a] hover:bg-[#f5f5fb]'}`}>
              <i className={`fas ${s.icon} text-[13px] w-4 text-center`}/>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {/* Account */}
          {activeSection==='account'&&(
            <div className="bg-white rounded-2xl p-6 border border-[#e8e8f0]">
              <h2 className="font-syne font-bold text-[16px] mb-1">Account Information</h2>
              <p className="text-[13px] text-[#6b6b8a] mb-5">Your personal details. This name appears on your job postings and employer profile.</p>
              {!profile?<div className="flex flex-col gap-4">{[1,2,3,4].map(i=><Sk key={i} h="h-12" r="rounded-xl"/>)}</div>:(
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="First Name" value={form.firstName} onChange={(v:string)=>setF('firstName',v)} placeholder="First name"/>
                    <InputField label="Last Name" value={form.lastName} onChange={(v:string)=>setF('lastName',v)} placeholder="Last name"/>
                  </div>
                  <InputField label="Email Address" value={form.email} onChange={(v:string)=>setF('email',v)} type="email" placeholder="you@company.com"/>
                  <InputField label="Phone Number" value={form.phone} onChange={(v:string)=>setF('phone',v)} placeholder="+234 800 000 0000"/>
                  <InputField label="Role" value={profile.role} disabled/>
                  <div className="flex items-center justify-between pt-3 border-t border-[#e8e8f0]">
                    <p className="text-[12px] text-[#9898b8]">Member since {profile.createdAt?new Date(profile.createdAt).toLocaleDateString():'—'}</p>
                    <button onClick={saveProfile} disabled={savingProfile} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all disabled:opacity-60">
                      {savingProfile?'Saving…':'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Password */}
          {activeSection==='password'&&(
            <div className="bg-white rounded-2xl p-6 border border-[#e8e8f0]">
              <h2 className="font-syne font-bold text-[16px] mb-1">Change Password</h2>
              <p className="text-[13px] text-[#6b6b8a] mb-5">Use a strong password of at least 8 characters.</p>
              <div className="flex flex-col gap-4 max-w-md">
                <InputField label="Current Password" value={pwForm.currentPassword} onChange={(v:string)=>setPw('currentPassword',v)} type="password" placeholder="Enter current password"/>
                <InputField label="New Password" value={pwForm.newPassword} onChange={(v:string)=>setPw('newPassword',v)} type="password" placeholder="At least 8 characters"/>
                <InputField label="Confirm New Password" value={pwForm.confirmPassword} onChange={(v:string)=>setPw('confirmPassword',v)} type="password" placeholder="Repeat new password"/>
                {pwForm.newPassword&&pwForm.confirmPassword&&pwForm.newPassword!==pwForm.confirmPassword&&(
                  <p className="text-xs text-[#ef4444] flex items-center gap-1.5"><i className="fas fa-exclamation-circle"/>Passwords do not match</p>
                )}
                <div className="pt-3 border-t border-[#e8e8f0]">
                  <button onClick={savePassword} disabled={savingPw||!pwForm.currentPassword||!pwForm.newPassword||!pwForm.confirmPassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all disabled:opacity-50">
                    {savingPw?'Updating…':'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection==='notifications'&&(
            <div className="bg-white rounded-2xl p-6 border border-[#e8e8f0]">
              <h2 className="font-syne font-bold text-[16px] mb-1">Notification Preferences</h2>
              <p className="text-[13px] text-[#6b6b8a] mb-5">Choose what alerts you receive.</p>
              <div className="flex flex-col gap-0 divide-y divide-[#f0f0f8]">
                {[
                  {label:'New applicant',    desc:'Get notified when someone applies to your job',      default:true },
                  {label:'Status updates',   desc:'Alerts when an applicant\'s application changes',    default:true },
                  {label:'Job expiring',     desc:'Reminder when a job post is about to close',         default:true },
                  {label:'Weekly digest',    desc:'Summary of your hiring activity every Monday',       default:false},
                  {label:'Platform updates', desc:'News about new SkillHub features and improvements',  default:false},
                ].map(n=>{
                  const [on,setOn]=useState(n.default);
                  return (
                    <div key={n.label} className="flex items-center justify-between py-4">
                      <div>
                        <div className="text-[13.5px] font-semibold text-[#0a0a0f]">{n.label}</div>
                        <div className="text-[12px] text-[#6b6b8a]">{n.desc}</div>
                      </div>
                      <button onClick={()=>setOn(v=>!v)} className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 border-0 cursor-pointer ${on?'bg-[#5b4cf5]':'bg-[#e8e8f0]'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-all ${on?'right-1':'left-1'}`}/>
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 border-t border-[#e8e8f0]">
                <button onClick={()=>showToast('Notification preferences saved!')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5b4cf5] text-white rounded-xl text-sm font-semibold border-0 cursor-pointer hover:bg-[#7c6ff7] transition-all">
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
    </EmployerAccessGuard>
  );
}