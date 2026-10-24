export interface DurationRange {min:number;max:number}
export interface EstimateInput {
 mode:'demo'|'live'; serviceDurations:DurationRange[] | null; pendingDurations:DurationRange[] | null
 bayWorkloads:DurationRange[] | null; ahead:DurationRange[][] | null; historicalAverageMinutes?:number
}
const valid=(d:DurationRange)=>Number.isFinite(d.min)&&Number.isFinite(d.max)&&d.min>=0&&d.max>=d.min
const sum=(items:DurationRange[])=>items.reduce((a,b)=>({min:a.min+b.min,max:a.max+b.max}),{min:0,max:0})
/** Capacity scheduling in minutes. No time is derived from car count alone. */
export function estimateServiceTime(input:EstimateInput){
 const {serviceDurations,pendingDurations,bayWorkloads,ahead}=input
 if(!serviceDurations?.length||!pendingDurations||!bayWorkloads?.length||!ahead||![...serviceDurations,...pendingDurations,...bayWorkloads,...ahead.flat()].every(valid))return null
 const minLoads=bayWorkloads.map(d=>d.min),maxLoads=bayWorkloads.map(d=>d.max)
 for(const work of ahead){
  if(!work.length)return null
  const d=sum(work),i=minLoads.indexOf(Math.min(...minLoads)),j=maxLoads.indexOf(Math.min(...maxLoads))
  minLoads[i]+=d.min;maxLoads[j]+=d.max
 }
 const queue={min:Math.min(...minLoads),max:Math.min(...maxLoads)},pending=sum(pendingDurations)
 return {mode:input.mode,configuredService:sum(serviceDurations),historicalAverageMinutes:input.historicalAverageMinutes??null,queue,totalRemaining:{min:queue.min+pending.min,max:queue.max+pending.max}}
}
