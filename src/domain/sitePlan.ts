export type XZ = readonly [number,number]
export const BAY_IDS=['01','02','03','04','05'] as const
export type BayId=typeof BAY_IDS[number]
export const bayCenter=(id:BayId):XZ=>[3.4+BAY_IDS.indexOf(id)*8,-4.2]
export const queueCenter=(index:number):XZ=>[3.4,10.8+index*7.4]
export const ENTRY:XZ=[3.4,34]
export const EXIT:XZ=[51,34]
export const handover:XZ=[50,17]
export function roundedRoute(points:XZ[],radius=2.5):XZ[]{
 const result:XZ[]=[points[0]]
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]),r=Math.min(radius,ab*.4,bc*.4)
  if(!ab||!bc)continue
  const p:XZ=[b[0]+(a[0]-b[0])*r/ab,b[1]+(a[1]-b[1])*r/ab],q:XZ=[b[0]+(c[0]-b[0])*r/bc,b[1]+(c[1]-b[1])*r/bc]
  result.push(p)
  for(let j=1;j<=8;j++){const t=j/8,u=1-t;result.push([u*u*p[0]+2*u*t*b[0]+t*t*q[0],u*u*p[1]+2*u*t*b[1]+t*t*q[1]])}
 }
 result.push(points[points.length-1]);return result
}
export const routeLength=(path:XZ[])=>path.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0)
export function sampleRoute(path:XZ[],meters:number):{position:XZ;yaw:number}{
 let remaining=Math.max(0,meters)
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],d=Math.hypot(b[0]-a[0],b[1]-a[1])
  if(remaining<=d||i===path.length-1){const t=d?Math.min(1,remaining/d):1;return {position:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],yaw:Math.atan2(b[0]-a[0],b[1]-a[1])}}
  remaining-=d
 }
 return {position:path[0],yaw:0}
}
export function bayEntryRoute(slot:number,id:BayId){const [x,z]=bayCenter(id);return roundedRoute([queueCenter(slot),[3.4,9.5],[46,9.5],[46,-14],[x,-14],[x,z]])}
// Reverse straight until the whole visible body clears the rear wall before turning.
function reverseRoute(id:BayId){const [x,z]=bayCenter(id);return roundedRoute([[x,z],[x,-14],[x-3.2,-15],[x-4.5,-15]],1.5)}
export const bayExitReverseMeters=(id:BayId)=>routeLength(reverseRoute(id))
export function bayExitRoute(id:BayId){const reverse=reverseRoute(id),end=reverse[reverse.length-1];return [...reverse,...roundedRoute([end,[48,end[1]],[50,-10],handover]).slice(1)]}
