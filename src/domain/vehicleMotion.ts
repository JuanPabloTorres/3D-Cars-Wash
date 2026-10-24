import type{WorldVehicle}from './contracts.ts'
import{routeLength,sampleRoute,type XZ}from './sitePlan.ts'
type Movement=NonNullable<WorldVehicle['movement']>
const SPEED=2.8,RAMP=1,GEAR_PAUSE=.7
export const motionDuration=(path:XZ[],reverseMeters=0)=>routeLength(path)/SPEED+(reverseMeters>0?2*RAMP+GEAR_PAUSE:RAMP)
function distanceAt(time:number,length:number){
 const duration=length/SPEED+RAMP,t=Math.max(0,Math.min(duration,time))
 if(t<RAMP)return SPEED*t*t/(2*RAMP)
 if(t>duration-RAMP)return length-SPEED*(duration-t)**2/(2*RAMP)
 return SPEED*(t-RAMP/2)
}
/** Trapezoidal speed: accelerate, cruise, brake; stop before changing reverse to drive. */
export function sampleVehicleMovement(m:Movement,clockSeconds:number){
 const elapsed=Math.max(0,clockSeconds-m.startedAt),length=routeLength(m.path),reverse=m.reverseMeters||0
 let meters=0,reversing=false
 if(reverse){
  const backTime=reverse/SPEED+RAMP
  if(elapsed<=backTime+GEAR_PAUSE){meters=distanceAt(Math.min(elapsed,backTime),reverse);reversing=true}
  else meters=reverse+distanceAt(elapsed-backTime-GEAR_PAUSE,length-reverse)
 }else meters=distanceAt(elapsed,length)
 const pose=sampleRoute(m.path,reversing?Math.min(meters,reverse-.0001):meters)
 return {...pose,yaw:pose.yaw+(reversing?Math.PI:0),meters}
}
