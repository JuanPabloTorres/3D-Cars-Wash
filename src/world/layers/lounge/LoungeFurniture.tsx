import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, Shape } from 'three'
import { Block } from '../../prefabs/Architecture'
import type { LoungeMaterials } from './loungeMaterials'
import { loungePlan } from './loungePlan'
import { upholsteryGeometry } from './upholsteryGeometry'

/** One upholstered family shared by sofa and chairs, with puffed cushions,
 * curved arm/back shell, fine metal feet and independent textile finishes. */
function Seat({width,mat}:{width:number;mat:LoungeMaterials}) {
 const count=width>2?3:1,seatWidth=(width-.15)/count
 const geometry=useMemo(()=>{
  const half=width/2+.06,inside=half-.1,shape=new Shape()
  shape.moveTo(-half,-.30);shape.lineTo(-half,.24);shape.quadraticCurveTo(-half,.49,-half+.24,.49)
  shape.lineTo(half-.24,.49);shape.quadraticCurveTo(half,.49,half,.24);shape.lineTo(half,-.30)
  shape.lineTo(inside,-.30);shape.lineTo(inside,.22);shape.quadraticCurveTo(inside,.38,inside-.18,.38)
  shape.lineTo(-inside+.18,.38);shape.quadraticCurveTo(-inside,.38,-inside,.22);shape.lineTo(-inside,-.30);shape.closePath()
  return {shell:new ExtrudeGeometry(shape,{depth:.33,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:4,curveSegments:16}),seat:upholsteryGeometry(seatWidth-.025,.21,.77),back:upholsteryGeometry(seatWidth-.02,.43,.19),pillow:upholsteryGeometry(.35,.35,.14)}
 },[width,seatWidth])
 useEffect(()=>()=>Object.values(geometry).forEach(g=>g.dispose()),[geometry])
 return <group>
  {[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={`${x}:${z}`} position={[x*(width/2-.1),.16,z*.33]} rotation={[z*.07,0,-x*.07]} material={mat.metal} castShadow><cylinderGeometry args={[.025,.017,.30,20]}/></mesh>))}
  <Block at={[0,.31,0]} size={[width+.08,.075,.87]} mat={mat.metal} radius={.035}/>
  <mesh geometry={geometry.shell} material={mat.secondary} position-y={.35} rotation-x={-Math.PI/2} castShadow receiveShadow/>
  {Array.from({length:count},(_,i)=>{
   const x=(i-(count-1)/2)*seatWidth
   return <group key={i}>
    <mesh geometry={geometry.seat} material={mat.linen} position={[x,.47,.055]} castShadow receiveShadow/>
    <mesh geometry={geometry.back} material={mat.linen} position={[x,.76,-.25]} rotation-x={-.16} castShadow receiveShadow/>
    <Block at={[x,.465,.425]} size={[seatWidth-.17,.005,.005]} mat={mat.secondary} radius={.002}/>
   </group>
  })}
  <mesh geometry={geometry.pillow} material={width>2?mat.wine:mat.olive} position={[width>2?-.75:.16,.74,-.045]} rotation={[-.18,0,width>2?-.15:.16]} castShadow/>
 </group>
}
export function LoungeFurniture({mat}:{mat:LoungeMaterials}) {
 return <group name="lounge-furniture">
  {loungePlan.seats.map(seat=><group key={seat.id} name={seat.id} position={[...seat.position]} rotation-y={seat.yaw}><Seat width={seat.width} mat={mat}/></group>)}
  <group position={loungePlan.table} name="lounge-coffee-table">
   {[-1,1].flatMap(x=>[-1,1].map(z=><mesh key={`${x}:${z}`} position={[x*.51,.22,z*.29]} material={mat.metal} castShadow><cylinderGeometry args={[.027,.02,.44,20]}/></mesh>))}
   <Block at={[0,loungePlan.tableTop.center,0]} size={[1.43,loungePlan.tableTop.thickness,.83]} mat={mat.top} radius={.035}/>
   <Block at={[0,.43,0]} size={[1.3,.035,.73]} mat={mat.metal} radius={.015}/>
  </group>
 </group>
}
