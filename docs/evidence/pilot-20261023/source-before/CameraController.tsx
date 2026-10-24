import {useEffect,useRef} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import {Euler,PerspectiveCamera,Quaternion,Vector3} from 'three'
import {useApp} from '../../app/store'
import {useCommerce} from '../../app/commerceStore'
import {destinations,distance,EYE_HEIGHT,SPAWN,ENTRANCE_SIDEWALK,type Point,type Destination} from './layout'
import {WaypointPathPlanner} from './WaypointPathPlanner'
import {diagnostics} from '../diagnostics'
const planner=new WaypointPathPlanner()
const aim=new Vector3(),rotation=new Euler(),orientation=new Quaternion()
export function vehicleDestination():Destination|null{
 const order=useCommerce.getState().order
 if(!order?.worldEntityId)return null
 const own=useApp.getState().world.vehicles.find(v=>v.worldEntityId===order.worldEntityId)
 if(!own)return null
 return own.bayId?(own.bayId==='01'?'viewing':`bay${own.bayId}` as Destination):['handover','departing'].includes(own.stage)?'delivery':own.visualLocation==='entry'?'arrival':'queue'
}
/** The camera owns view transitions only. No avatar or business commands. */
export function CameraController(){
 const {camera,size}=useThree(),position=useRef<Point>(SPAWN)
 const transition=useRef<{revision:number;destination:Destination;points:Point[];length:number;elapsed:number;duration:number;start:Quaternion}|null>(null)
 const navRevision=useApp(s=>s.navRevision),destination=useApp(s=>s.destination)
 useEffect(()=>{
  if(!destination){transition.current=null;return}
  // The initial observation frames the driveway; departure joins the sidewalk
  // before approaching reception instead of cutting across the asphalt.
  const joining=useApp.getState().activeView==='entrance'&&destination!=='entrance'
  const access=joining?ENTRANCE_SIDEWALK:[]
  const route=planner.findPath(access.at(-1)||position.current,destinations[destination].point)
  if(!route){useApp.getState().set({destination:null,error:'Esta vista no está disponible. Selecciona otra área.'});return}
  const points=[position.current,...access,...route],length=points.slice(1).reduce((n,p,i)=>n+distance(points[i],p),0)
  transition.current={revision:navRevision,destination,points,length,elapsed:0,duration:window.matchMedia('(prefers-reduced-motion:reduce)').matches?.08:Math.min(1.15,.55+length*.008),start:camera.quaternion.clone()}
 },[destination,navRevision,camera])
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{
   if((e.target as HTMLElement)?.closest('input,textarea,select,[role=dialog]'))return
   if(e.code==='KeyM')useApp.getState().set({menu:!useApp.getState().menu})
   if(e.code==='Escape')useApp.getState().set({dialogue:false,menu:false,help:false,orderOpen:false,localOpen:false,accountOpen:false,flowOpen:false,destination:null})
  };document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)
 },[])
 useFrame((_,delta)=>{
  const app=useApp.getState(),t=transition.current
  if(t&&app.ready){
   if(t.revision!==app.navRevision)return
   // An assignment update during transit invalidates the old observation point.
   if(app.viewIntent==='vehicle'){
    const latest=vehicleDestination()
    if(latest&&latest!==t.destination){app.navigate(latest,'vehicle');return}
   }
   t.elapsed+=Math.min(delta,.1);const progress=Math.min(1,t.elapsed/t.duration),ease=progress*progress*(3-2*progress)
   let remaining=ease*t.length
   for(let i=1;i<t.points.length;i++){
    const segment=distance(t.points[i-1],t.points[i])
    if(remaining<=segment||i===t.points.length-1){const f=segment?Math.min(1,remaining/segment):1;position.current=[t.points[i-1][0]+(t.points[i][0]-t.points[i-1][0])*f,t.points[i-1][1]+(t.points[i][1]-t.points[i-1][1])*f];break}remaining-=segment
   }
   if(progress===1){transition.current=null;app.set({destination:null,activeView:t.destination,dialogue:app.viewIntent==='area'&&['reception','services'].includes(t.destination),orderOpen:app.viewIntent!=='area',localOpen:app.viewIntent==='area'&&!['reception','services','entrance'].includes(t.destination),announcement:`${destinations[t.destination].label} abierta.`})}
  }
  const current=useApp.getState(),view=t?.destination||current.activeView,target=destinations[view].lookAt
  const own=current.viewIntent==='vehicle'&&useCommerce.getState().order?.worldEntityId
  const pose=own&&diagnostics.vehicles[own]
  aim.set(pose?pose.position[0]:target[0],view==='reception'?(size.width>700?1.3:1.48):view==='lounge'?1.12:.95,pose?pose.position[1]:target[1])
  if(view==='queue'||view==='arrival'){const first=current.world.vehicles.filter(v=>v.stage==='queued').sort((a,b)=>(a.queueIndex??0)-(b.queueIndex??0))[0],queuePose=first&&diagnostics.vehicles[first.worldEntityId];if(queuePose)aim.set(queuePose.position[0],.85,queuePose.position[1])}
  camera.position.set(position.current[0],view==='lounge'?1.4:view==='entrance'?2.15:EYE_HEIGHT,position.current[1])
  const dx=aim.x-camera.position.x,dz=aim.z-camera.position.z
  rotation.set(Math.atan2(aim.y-camera.position.y,Math.hypot(dx,dz)),Math.atan2(-dx,-dz),0,'YXZ');orientation.setFromEuler(rotation)
  if(t)camera.quaternion.copy(t.start).slerp(orientation,Math.min(1,t.elapsed/t.duration));else camera.quaternion.slerp(orientation,1-Math.exp(-8*Math.min(delta,.1)))
  const panel=current.dialogue||current.orderOpen||current.localOpen||!!current.destination
  const c=camera as PerspectiveCamera
  c.fov=view==='entrance'?(size.width>700?66:72):view==='reception'?(size.width>700?49:61):view==='queue'||view==='arrival'?49:65
  // Reserve real scene composition space for a stable transactional panel.
  c.setViewOffset(size.width,size.height,panel&&size.width>700?Math.min(144,size.width*.10):0,panel&&size.width<=700?size.height*.16:0,size.width,size.height)
  const e=new Euler().setFromQuaternion(camera.quaternion,'YXZ')
  diagnostics.position=[...position.current];diagnostics.yaw=e.y;diagnostics.pitch=e.x;diagnostics.walking=false;diagnostics.route=t?.points||[]
  const interaction=view==='reception'?'reception':view==='services'?'services':view==='entrance'?null:'viewing'
  if(interaction!==current.interaction)current.set({interaction})
 })
 return null
}
