'use client';
import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/app/employer/EmployerAccessGuard';

function Sk({h='h-4',w='w-full',r='rounded'}:any){return <div className={`${h} ${w} ${r} animate-pulse`} style={{background:'rgba(255,255,255,0.06)'}}/>;}

function BarChart({data,color='#4F8EF7',label}:{data:{label:string;value:number}[];color?:string;label:string}){
  const max=Math.max(...data.map(d=>d.value),1);
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{color:'rgba(255,255,255,0.45)'}}>{label}</div>
      <div className="flex items-end gap-2 h-32">
        {data.map(d=>(
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold" style={{color}}>{d.value||''}</span>
            <div className="w-full rounded-t-md transition-all" style={{height:`${Math.max((d.value/max)*100,4)}%`,background:color,opacity:d.value===0?0.2:1}}/>
            <span className="text-[10px]" style={{color:'rgba(255,255,255,0.45)'}}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage(){
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    apiFetch('/employer/analytics').then(r=>{if(r.success)setData(r.data);}).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const months   = data?.months || [];
  const topJobs  = data?.topJobs || [];

  const totalJobs       = months.reduce((s:number,m:any)=>s+m.jobs,0);
  const totalApplicants = months.reduce((s:number,m:any)=>s+m.applicants,0);
  const avgPerJob       = totalJobs>0?Math.round(totalApplicants/totalJobs):0;

  return (
    <EmployerAccessGuard>
    <SidebarLayout navItems={employerNavItems} pageTitle="Analytics">
      <div className="mb-5">
        <h1 className="font-jakarta font-bold text-[21px] tracking-tight" style={{color:'#FFFFFF'}}>Analytics</h1>
        <p className="text-[13px]" style={{color:'rgba(255,255,255,0.45)'}}>Last 6 months of hiring activity.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5 max-md:grid-cols-1">
        {[
          {icon:'fa-briefcase',  color:'#4F8EF7', value:loading?null:totalJobs,     label:'Jobs Posted (6mo)'},
          {icon:'fa-users',      color:'#00E5A0', value:loading?null:totalApplicants,label:'Total Applicants (6mo)'},
          {icon:'fa-chart-line', color:'#F59E0B', value:loading?null:avgPerJob,     label:'Avg Applicants / Job'},
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-5 flex items-center gap-3" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="w-11 h-11 rounded-xl grid place-items-center text-[17px] flex-shrink-0" style={{background:s.color + '18', color:s.color}}>
              <i className={`fas ${s.icon}`}/>
            </div>
            <div>
              {s.value===null?<Sk h="h-7" w="w-10" r="rounded"/>:<div className="font-jakarta font-bold text-[22px]" style={{color:'rgba(255,255,255,0.85)'}}>{s.value}</div>}
              <div className="text-xs" style={{color:'rgba(255,255,255,0.45)'}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
        {/* Jobs posted chart */}
        <div className="rounded-2xl p-5" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
          <span className="font-jakarta font-bold text-[15px] block mb-4" style={{color:'rgba(255,255,255,0.85)'}}>Jobs Posted</span>
          {loading?<Sk h="h-36" r="rounded-xl"/>
          :<BarChart data={months.map((m:any)=>({label:m.label,value:m.jobs}))} color="#4F8EF7" label="Jobs per month"/>}
        </div>

        {/* Applicants chart */}
        <div className="rounded-2xl p-5" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
          <span className="font-jakarta font-bold text-[15px] block mb-4" style={{color:'rgba(255,255,255,0.85)'}}>Applicants Received</span>
          {loading?<Sk h="h-36" r="rounded-xl"/>
          :<BarChart data={months.map((m:any)=>({label:m.label,value:m.applicants}))} color="#00E5A0" label="Applicants per month"/>}
        </div>
      </div>

      {/* Top jobs */}
      <div className="rounded-2xl p-5" style={{background:'#0F1521', border:'1px solid rgba(255,255,255,0.07)'}}>
        <span className="font-jakarta font-bold text-[15px] block mb-4" style={{color:'rgba(255,255,255,0.85)'}}>Top Jobs by Applicants</span>
        {loading?<div className="flex flex-col gap-3">{[1,2,3,4,5].map(i=><Sk key={i} h="h-10" r="rounded-xl"/>)}</div>
        :topJobs.length===0?<p className="text-sm py-4 text-center" style={{color:'rgba(255,255,255,0.35)'}}>No jobs data yet.</p>
        :topJobs.map((job:any,i:number)=>{
          const max=topJobs[0]?.applicants||1;
          return (
            <div key={job.id} className="flex items-center gap-3 py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold flex-shrink-0 ${i===0?'text-white':i===1?'text-white':i===2?'text-white':''}`} 
                style={i===0?{background:'#F59E0B'}:i===1?{background:'#94A3B8'}:i===2?{background:'#CD7C54'}:{background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)'}}>{i+1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold mb-1 truncate" style={{color:'rgba(255,255,255,0.85)'}}>{job.title}</div>
                <div className="h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.08)'}}>
                  <div className="h-full rounded-full transition-all" style={{width:`${(job.applicants/max)*100}%`, background:'#4F8EF7'}}/>
                </div>
              </div>
              <span className="font-jakarta font-bold flex-shrink-0" style={{color:'#4F8EF7'}}>{job.applicants}</span>
            </div>
          );
        })}
      </div>
    </SidebarLayout>
    </EmployerAccessGuard>
  );
}