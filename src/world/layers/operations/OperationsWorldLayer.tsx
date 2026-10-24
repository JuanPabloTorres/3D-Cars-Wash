import { useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, PerspectiveCamera, Vector3 } from 'three'
import { CircleCheck, Ban, CarFront, Clock3, Flag } from 'lucide-react'
import type { WorldVehicle, WorldViewModel } from '../../../domain/contracts'
import { bayCenter, queueCenter, handover } from '../../../domain/sitePlan'
import { FinishedWashBay } from '../../prefabs/FinishedWashBay'
import { usePalette } from '../../prefabs/Architecture'
import { BayServiceIndicator } from './BayServiceIndicator'
import { vehiclePosition, type OperationArea } from './operationPresentation'

export interface OperationsSceneProps {world:WorldViewModel;area:OperationArea;ownId?:string|null;selected?:string|null;onSelect:(id:string)=>void;paused:boolean;controlCamera?:boolean}
function VehicleAnchor({vehicle,world,own,onSelect,paused,focused}:{vehicle:WorldVehicle;world:WorldViewModel;own:boolean;onSelect:()=>void;paused:boolean;focused:boolean}) {
  const anchor=useRef<Group>(null),point=vehiclePosition(vehicle,world.clockSeconds)
  const {size}=useThree(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
  useFrame((_,delta)=>{
    if(!anchor.current)return
    const target=new Vector3(point[0],1.5,vehicle.bayId&&!vehicle.movement?1.5:point[1])
    if(reduced)anchor.current.position.copy(target)
    else anchor.current.position.lerp(target,1-Math.exp(-Math.min(delta,.05)*14))
  })
  return <group ref={anchor} position={[point[0],1.5,point[1]]} name={`operation-icon:${vehicle.worldEntityId}`}>
    <Html center distanceFactor={focused?8:12} occlude zIndexRange={[20,1]}><div className="world-vehicle-anchor">
      <BayServiceIndicator vehicle={vehicle} clock={world.clockSeconds} own={own} focused={focused&&size.width>=760} paused={paused}/>
    </div></Html>
  </group>
}
function SpaceSignal({position,kind,number}:{position:readonly[number,number];kind:'queue'|'handover';number?:number}) {
 const Icon=kind==='queue'?Clock3:Flag,label=kind==='queue'?`Espera ${number} · Plaza libre`:'Zona de entrega'
 return <Html position={[position[0],1.1,position[1]]} center distanceFactor={10} occlude zIndexRange={[14,1]}>
  <span className={`operation-space-signal ${kind}`} role="img" aria-label={label}>
   <Icon size={23} aria-hidden="true"/><b>{kind==='queue'?`ESPERA 0${number}`:'ENTREGA'}</b><small>{kind==='queue'?'Plaza libre':'Recogida del auto'}</small>
  </span>
 </Html>
}
export function OperationsWorldLayer({world,area,ownId,selected,onSelect,paused,controlCamera=true}:OperationsSceneProps) {
  const mat=usePalette()
  return <group name="operations-world-layer">
    {world.bays.map(bay=><group key={bay.bayId}>
      <FinishedWashBay mat={mat} bayId={bay.bayId} availability={bay.occupancy}/>
      {!bay.vehicleId&&<Html position={[bayCenter(bay.bayId)[0],1.4,1.5]} center distanceFactor={10} occlude zIndexRange={[15,1]}><span className={`operation-bay-status ${bay.occupancy}`}>
        <span className="bay-vacancy-emblem" aria-hidden="true">{bay.occupancy==='free'?<CarFront size={30}/>:<Ban size={30}/>}</span>
        <span className="bay-vacancy-caption"><small>BAHÍA</small><b>{bay.bayId}</b><span><i aria-hidden="true"/>{bay.occupancy==='free'?'Disponible':'No disponible'}</span></span>
      </span></Html>}
    </group>)}
    {[0,1,2].filter(index=>!world.vehicles.some(vehicle=>vehicle.queueIndex===index)).map(index=><SpaceSignal key={index} position={queueCenter(index)} kind="queue" number={index+1}/>)}
    {!world.vehicles.some(vehicle=>vehicle.visualLocation==='handover'||vehicle.movement?.purpose==='handover')&&<SpaceSignal position={handover} kind="handover"/>}
    {world.vehicles.map(vehicle=><VehicleAnchor key={vehicle.worldEntityId} vehicle={vehicle} world={world} own={vehicle.worldEntityId===ownId} paused={paused} focused={selected===vehicle.worldEntityId} onSelect={()=>onSelect(vehicle.worldEntityId)}/>)}
    {!!world.completed?.length&&<Html position={[50,1.5,23]} center occlude zIndexRange={[20,1]}><button className="operation-history-marker" onClick={()=>onSelect(world.completed!.at(-1)!.worldEntityId)}><CircleCheck size={22}/><span>{world.completed.length} entregados<small>Consultar completados</small></span></button></Html>}
    {controlCamera&&<OperationsCamera area={area} selected={selected} world={world}/>}
  </group>
}
function OperationsCamera({area,selected,world}:{area:OperationArea;selected?:string|null;world:WorldViewModel}) {
  const {camera,size,gl}=useThree(),target=useRef(new Vector3()),eye=useRef(new Vector3()),first=useRef(true)
  const selectedBay=world.vehicles.find(v=>v.worldEntityId===selected)?.bayId
  useEffect(()=>{
    const mobile=size.width<760
    const positions:Record<OperationArea,number[]>={overview:[22,8,43],queue:[12,7,40],bays:[22,5,28],completed:[51,5,36]}
    const targets:Record<OperationArea,number[]>={overview:[20,1,2],queue:[3.4,1,12],bays:[22,1,-3],completed:[50,0,17]}
    eye.current.fromArray(positions[area]);target.current.fromArray(targets[area])
    if(selectedBay){const [x,z]=bayCenter(selectedBay);eye.current.set(x,5.3,13);target.current.set(x,1,z)}
    if(mobile)eye.current.y+=9
    const perspective=camera as PerspectiveCamera
    perspective.clearViewOffset()
    if(!mobile)perspective.setViewOffset(size.width,size.height,size.width*.13,0,size.width,size.height)
    perspective.updateProjectionMatrix()
    if(first.current){camera.position.copy(eye.current);first.current=false}
  },[area,selectedBay,camera,size.width,size.height])
  useFrame((_,delta)=>{
    camera.position.lerp(eye.current,window.matchMedia('(prefers-reduced-motion: reduce)').matches?1:1-Math.exp(-Math.min(delta,.05)*5))
    camera.lookAt(target.current)
    // Read-only diagnostics for actual rendering checks, not business commands.
    Object.assign(window,{__OPERATIONS_RENDER__:{triangles:gl.info.render.triangles,calls:gl.info.render.calls,camera:camera.position.toArray()}})
  })
  return null
}
