'use client';
import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/app/employer/EmployerAccessGuard';

function Sk({h='h-4',w='w-full',r='rounded'}:any){return <div className={`${h} ${w} ${r} animate-pulse`} style={{background:'rgba(255,255,255,0.06)'}}/>;}

function InputField({id, name, label, value, onChange, type='text', placeholder='', disabled=false}:any){
  const fieldId = id || name || label?.toLowerCase().replace(/\s/g, '-') || 'field';
  const fieldName = name || id || label?.toLowerCase().replace(/\s/g, '_') || 'field';
  
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-semibold mb-1.5" style={{color:'rgba(255,255,255,0.45)'}}>{label}</label>
      <input 
        id={fieldId}
        name={fieldName}
        type={type} 
        value={value||''} 
        onChange={e=>onChange(e.target.value)} 
        placeholder={placeholder} 
        disabled={disabled}
        className="w-full px-3.5 py-3 rounded-xl text-sm font-[inherit] outline-none transition-all disabled:opacity-50"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.85)'
        }}
        onFocus={e => { e.target.style.border = '1px solid rgba(79,142,247,0.4)'; e.target.style.background = 'rgba(79,142,247,0.06)'; }}
        onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
      />
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
        <div className={`fixed top-5 right-5 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 ${toastType==='success'?'border':'bg-[#0F1521]'}`}
          style={toastType==='success'?{background:'#0F1521', border:'1px solid rgba(0,229,160,0.3)', color:'#00E5A0'}:{background:'#0F1521', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444'}}>
          <i className={`fas ${toastType==='success'?'fa-check-circle':'fa-exclamation-circle'}`}/>{toast}
        </div>
      )}

      <div className="mb-5">
        <h1 className="font-jakarta font-bold text-[21px] tracking-tight" style={{color:'#FFFFFF'}}>Settings</h1>
        <p className="text-[13px]" style={{color:'rgba(255,255,255,0.45)'}}>Manage your account, password and preferences.</p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-5 max-[900px]:grid-cols-1">
        {/* Sidebar nav */}
        <div className="rounded-2xl p-3 h-fit" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
          {/* Profile mini card */}
          <div className="flex items-center gap-3 p-3 mb-2">
            <div className="w-10 h-10 rounded-xl grid place-items-center font-jakarta font-bold text-white flex-shrink-0" style={{background:'linear-gradient(135deg, #4F8EF7 0%, #A78BFA 100%)'}}>
              {profile?`${profile.firstName?.[0]||''}${profile.lastName?.[0]||''}`:'?'}
            </div>
            <div className="min-w-0">
              {!profile?<><Sk h="h-4" w="w-24" r="rounded"/><Sk h="h-3" w="w-16" r="rounded" /></>:<>
                <div className="font-semibold text-[13px] truncate" style={{color:'rgba(255,255,255,0.85)'}}>{profile.firstName} {profile.lastName}</div>
                <div className="text-[11px] truncate" style={{color:'rgba(255,255,255,0.45)'}}>{profile.email}</div>
              </>}
            </div>
          </div>
          <div className="h-px mb-2" style={{background:'rgba(255,255,255,0.06)'}}/>
          {sections.map(s=>(
            <button key={s.key} onClick={()=>setActiveSection(s.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium font-[inherit] cursor-pointer border-0 text-left transition-all ${
                activeSection===s.key ? 'font-semibold' : 'bg-transparent'
              }`}
              style={activeSection===s.key 
                ? {background:'rgba(79,142,247,0.12)', color:'#4F8EF7', border:'1px solid rgba(79,142,247,0.2)'}
                : {color:'rgba(255,255,255,0.45)'}
              }>
              <i className={`fas ${s.icon} text-[13px] w-4 text-center`}/>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {/* Account */}
          {activeSection==='account'&&(
            <div className="rounded-2xl p-6" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
              <h2 className="font-jakarta font-bold text-[16px] mb-1" style={{color:'rgba(255,255,255,0.85)'}}>Account Information</h2>
              <p className="text-[13px] mb-5" style={{color:'rgba(255,255,255,0.45)'}}>Your personal details. This name appears on your job postings and employer profile.</p>
              {!profile?<div className="flex flex-col gap-4">{[1,2,3,4].map(i=><Sk key={i} h="h-12" r="rounded-xl"/>)}</div>:(
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      id="first-name"
                      name="firstName"
                      label="First Name" 
                      value={form.firstName} 
                      onChange={(v:string)=>setF('firstName',v)} 
                      placeholder="First name"
                    />
                    <InputField 
                      id="last-name"
                      name="lastName"
                      label="Last Name" 
                      value={form.lastName} 
                      onChange={(v:string)=>setF('lastName',v)} 
                      placeholder="Last name"
                    />
                  </div>
                  <InputField 
                    id="email"
                    name="email"
                    label="Email Address" 
                    value={form.email} 
                    onChange={(v:string)=>setF('email',v)} 
                    type="email" 
                    placeholder="you@company.com"
                  />
                  <InputField 
                    id="phone"
                    name="phone"
                    label="Phone Number" 
                    value={form.phone} 
                    onChange={(v:string)=>setF('phone',v)} 
                    placeholder="+234 800 000 0000"
                  />
                  <InputField 
                    id="role"
                    name="role"
                    label="Role" 
                    value={profile.role} 
                    disabled
                  />
                  <div className="flex items-center justify-between pt-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                    <p className="text-[12px]" style={{color:'rgba(255,255,255,0.35)'}}>Member since {profile.createdAt?new Date(profile.createdAt).toLocaleDateString():'—'}</p>
                    <button onClick={saveProfile} disabled={savingProfile} 
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all disabled:opacity-60"
                      style={{background:'#4F8EF7'}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#6BA0FF'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#4F8EF7'}}>
                      {savingProfile?'Saving…':'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Password */}
          {activeSection==='password'&&(
            <div className="rounded-2xl p-6" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
              <h2 className="font-jakarta font-bold text-[16px] mb-1" style={{color:'rgba(255,255,255,0.85)'}}>Change Password</h2>
              <p className="text-[13px] mb-5" style={{color:'rgba(255,255,255,0.45)'}}>Use a strong password of at least 8 characters.</p>
              <div className="flex flex-col gap-4 max-w-md">
                <InputField 
                  id="current-password"
                  name="currentPassword"
                  label="Current Password" 
                  value={pwForm.currentPassword} 
                  onChange={(v:string)=>setPw('currentPassword',v)} 
                  type="password" 
                  placeholder="Enter current password"
                />
                <InputField 
                  id="new-password"
                  name="newPassword"
                  label="New Password" 
                  value={pwForm.newPassword} 
                  onChange={(v:string)=>setPw('newPassword',v)} 
                  type="password" 
                  placeholder="At least 8 characters"
                />
                <InputField 
                  id="confirm-password"
                  name="confirmPassword"
                  label="Confirm New Password" 
                  value={pwForm.confirmPassword} 
                  onChange={(v:string)=>setPw('confirmPassword',v)} 
                  type="password" 
                  placeholder="Repeat new password"
                />
                {pwForm.newPassword&&pwForm.confirmPassword&&pwForm.newPassword!==pwForm.confirmPassword&&(
                  <p className="text-xs flex items-center gap-1.5" style={{color:'#EF4444'}}><i className="fas fa-exclamation-circle"/>Passwords do not match</p>
                )}
                <div className="pt-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                  <button onClick={savePassword} disabled={savingPw||!pwForm.currentPassword||!pwForm.newPassword||!pwForm.confirmPassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all disabled:opacity-50"
                    style={{background:'#4F8EF7'}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#6BA0FF'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#4F8EF7'}}>
                    {savingPw?'Updating…':'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection==='notifications'&&(
            <div className="rounded-2xl p-6" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
              <h2 className="font-jakarta font-bold text-[16px] mb-1" style={{color:'rgba(255,255,255,0.85)'}}>Notification Preferences</h2>
              <p className="text-[13px] mb-5" style={{color:'rgba(255,255,255,0.45)'}}>Choose what alerts you receive.</p>
              <div className="flex flex-col gap-0 divide-y" style={{borderColor:'rgba(255,255,255,0.06)'}}>
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
                        <div className="text-[13.5px] font-semibold" style={{color:'rgba(255,255,255,0.85)'}}>{n.label}</div>
                        <div className="text-[12px]" style={{color:'rgba(255,255,255,0.45)'}}>{n.desc}</div>
                      </div>
                      <button 
                        id={`notification-${n.label.toLowerCase().replace(/\s/g, '-')}`}
                        name={`notification_${n.label.toLowerCase().replace(/\s/g, '_')}`}
                        onClick={()=>setOn(v=>!v)} 
                        className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 border-0 cursor-pointer ${on?'bg-[#4F8EF7]':'bg-[rgba(255,255,255,0.1)]'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-all ${on?'right-1':'left-1'}`}/>
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                <button onClick={()=>showToast('Notification preferences saved!')} 
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
                  style={{background:'#4F8EF7'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#6BA0FF'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#4F8EF7'}}>
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