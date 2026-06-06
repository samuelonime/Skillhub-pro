'use client';
import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { apiFetch } from '@/lib/api';
import { employerNavItems } from '@/lib/employerNav';
import { EmployerAccessGuard } from '@/components/employer/EmployerAccessGuard';

function Sk({h='h-4',w='w-full',r='rounded'}:any){return <div className={`${h} ${w} ${r} bg-[#f0f0f8] animate-pulse`}/>;}

function BarChart({data,color='#5b4cf5',label}:{data:{label:string;value:number}[];color?:string;label:string}){
  const max=Math.max(...data.map(d=>d.value),1);
  return (
    <div>
      <div className="text-[11px] font-semibold text-[#6b6b8a] uppercase tracking-wide mb-3">{label}</div>
      <div className="flex items-end gap-2 h-32">
        {data.map(d=>(
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold" style={{color}}>{d.value||''}</span>
            <div className="w-full rounded-t-md transition-all" style={{height:`${Math.max((d.value/max)*100,4)}%`,background:color,opacity:d.value===0?0.2:1}}/>
            <span className="text-[10px] text-[#9898b8]">{d.label}</span>
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
    <SidebarLayout navItems={employerNavItems} pageTitle="Analytics">
      <div className="mb-5">
        <h1 className="font-syne font-bold text-[21px] tracking-tight">Analytics</h1>
        <p className="text-[13px] text-[#6b6b8a]">Last 6 months of hiring activity.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5 max-md:grid-cols-1">
        {[
          {icon:'fa-briefcase',  bg:'#f4f2ff',color:'#5b4cf5',value:loading?null:totalJobs,     label:'Jobs Posted (6mo)'},
          {icon:'fa-users',      bg:'#f0fdf4',color:'#22c55e',value:loading?null:totalApplicants,label:'Total Applicants (6mo)'},
          {icon:'fa-chart-line', bg:'#fffbeb',color:'#f59e0b',value:loading?null:avgPerJob,     label:'Avg Applicants / Job'},
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#e8e8f0] flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl grid place-items-center text-[17px] flex-shrink-0" style={{background:s.bg,color:s.color}}>
              <i className={`fas ${s.icon}`}/>
            </div>
            <div>
              {s.value===null?<Sk h="h-7" w="w-10" r="rounded"/>:<div className="font-syne font-bold text-[22px]">{s.value}</div>}
              <div className="text-xs text-[#6b6b8a]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
        {/* Jobs posted chart */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <span className="font-syne font-bold text-[15px] block mb-4">Jobs Posted</span>
          {loading?<Sk h="h-36" r="rounded-xl"/>
          :<BarChart data={months.map((m:any)=>({label:m.label,value:m.jobs}))} color="#5b4cf5" label="Jobs per month"/>}
        </div>

        {/* Applicants chart */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
          <span className="font-syne font-bold text-[15px] block mb-4">Applicants Received</span>
          {loading?<Sk h="h-36" r="rounded-xl"/>
          :<BarChart data={months.map((m:any)=>({label:m.label,value:m.applicants}))} color="#22c55e" label="Applicants per month"/>}
        </div>
      </div>

      {/* Top jobs */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e8f0]">
        <span className="font-syne font-bold text-[15px] block mb-4">Top Jobs by Applicants</span>
        {loading?<div className="flex flex-col gap-3">{[1,2,3,4,5].map(i=><Sk key={i} h="h-10" r="rounded-xl"/>)}</div>
        :topJobs.length===0?<p className="text-sm text-[#9898b8] py-4 text-center">No jobs data yet.</p>
        :topJobs.map((job:any,i:number)=>{
          const max=topJobs[0]?.applicants||1;
          return (
            <div key={job.id} className="flex items-center gap-3 py-3 border-b border-[#f0f0f8] last:border-0">
              <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold flex-shrink-0 ${i===0?'bg-[#f59e0b] text-white':i===1?'bg-[#9898b8] text-white':i===2?'bg-[#cd7f32] text-white':'bg-[#f5f5fb] text-[#6b6b8a]'}`}>{i+1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#0a0a0f] mb-1 truncate">{job.title}</div>
                <div className="h-2 bg-[#f0f0f8] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#5b4cf5]" style={{width:`${(job.applicants/max)*100}%`}}/>
                </div>
              </div>
              <span className="font-syne font-bold text-[#5b4cf5] flex-shrink-0">{job.applicants}</span>
            </div>
          );
        })}
      </div>
    </SidebarLayout>
  );
}