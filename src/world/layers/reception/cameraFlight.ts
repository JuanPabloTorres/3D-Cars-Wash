import {Vector3} from 'three'
import {loungeCameraRoute,roundLoungeRoute} from '../lounge/loungePlan'

/** Sample a rounded, metre-paced route. New navigation starts at the current
 * rendered position, so a second click cancels without teleporting or fading. */
export function cameraFlight(from:Vector3,to:Vector3,fromView:string,toView:string) {
 const a=from.toArray() as [number,number,number],b=to.toArray() as [number,number,number]
 // A resize or repeated selection must not replay an entrance/exit loop.
 const route=fromView===toView?[a,b]:toView==='waiting'?loungeCameraRoute(a,b,true):fromView==='waiting'?loungeCameraRoute(a,b,false):[a,b]
 const points=roundLoungeRoute(route),lengths=[0]
 for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+points[i].distanceTo(points[i-1]))
 const length=lengths.at(-1)!
 return {length,sample(progress:number,out:Vector3){
  const t=Math.max(0,Math.min(1,progress)),eased=t*t*t*(t*(t*6-15)+10),distance=eased*length
  const index=lengths.findIndex((value,i)=>i>0&&value>=distance)
  if(index<1)return out.copy(points.at(-1)!)
  const span=lengths[index]-lengths[index-1]
  return out.lerpVectors(points[index-1],points[index],span?(distance-lengths[index-1])/span:1)
 }}
}
