import {useApp} from '../app/store'
import {Block,Lettering,PavementMarkings,ReceptionPrefab,usePalette} from './prefabs/Architecture'
import {Landscape} from './prefabs/Landscape'
import {FinishedWashBay} from './prefabs/FinishedWashBay'
import {VehiclePrefab} from './prefabs/VehiclePrefab'
import {StaffPrefab} from './prefabs/StaffPrefab'
import {ServiceActivityVisualizer} from './prefabs/ServiceActivityVisualizer'
import {BAY_IDS,bayCenter,queueCenter} from '../domain/sitePlan'
import {Model} from './prefabs/Model'
import {useRef} from 'react'
import {Group} from 'three'
import {StaticArchitectureBatch} from './prefabs/StaticArchitectureBatch'
import {EntranceForecourt} from './prefabs/EntranceForecourt'
import {LoungePrefab} from './prefabs/LoungePrefab'
export function WorldLayout(){
 const mat=usePalette(),bays=useApp(s=>s.world.bays),vehicles=useApp(s=>s.world.vehicles)
 const root=useRef<Group>(null)
 return <group ref={root}>
  <Block at={[18,-.13,7]} size={[72,.2,58]} mat={mat.ground}/>
  <EntranceForecourt mat={mat}/>
  <Block at={[39.8,.76,4.1]} size={[.08,.08,5]} mat={mat.graphite}/>
  {[2,6.2].map(z=><Block key={z} at={[39.8,.4,z]} size={[.08,.8,.08]} mat={mat.graphite}/>)}
  <PavementMarkings mat={mat}/>
  <ReceptionPrefab mat={mat}/><Landscape mat={mat}/>
  <StaffPrefab role="receptionist" position={[-6,.2,2.18]}/>
  {BAY_IDS.map(id=>{
   const [x,z]=bayCenter(id),bay=bays.find(b=>b.bayId===id)!,v=vehicles.find(v=>v.worldEntityId===bay.vehicleId)
   return <group key={id}>
    <FinishedWashBay mat={mat} bayId={id} availability={bay.occupancy}/>
    {v?.assignedWorkerId&&!v.movement&&<StaffPrefab role="worker" staffId={`worker:${id}`} position={v.stage==='lights'?[x-.9,0,z+2.75]:v.stage==='interior'?[x-1.8,0,z-.15]:[x-1.9,0,z+1.7]} rotation={v.stage==='lights'?Math.PI:Math.PI/2} serviceActive={v.tasks.some(t=>t.status==='active')} activity={v.tasks.find(t=>t.status==='active')?.id}/>}
    <ServiceActivityVisualizer bayId={id}/>
    {v?.assignedWorkerId&&!v.movement&&v.tasks.some(t=>t.id==='interior'&&t.status==='active')&&<Model id="vacuum" height={.55} position={[x-2.3,.02,z+.8]}/>}
    {v?.assignedWorkerId&&!v.movement&&v.tasks.some(t=>t.id==='exterior'&&t.status==='active')&&<Model id="sprayer" height={.49} position={[x-2.3,.02,z+2.1]}/>}
    <Block at={[x,.76,1.45]} size={[6.8,.07,.07]} mat={mat.graphite}/>
    {[x-3.2,x+3.2].map(px=><Block key={px} at={[px,.4,1.45]} size={[.07,.8,.07]} mat={mat.graphite}/>)}
   </group>
  })}
  {vehicles.map(v=><VehiclePrefab key={v.worldEntityId} vehicle={v}/>)}
  <Block at={[-8.2,1.4,16.4]} size={[.2,2.8,.2]} mat={mat.graphite}/><Block at={[-5.7,1.4,16.4]} size={[.2,2.8,.2]} mat={mat.graphite}/><Block at={[-6.95,2.8,16.4]} size={[2.8,.2,.2]} mat={mat.red}/>
  {[0,1,2].map((index)=>{const [x,z]=queueCenter(index);return <group key={index}>
   <Block at={[x-1.45,.012,z]} size={[.05,.02,8]} mat={mat.yellow}/><Block at={[x+1.45,.012,z]} size={[.05,.02,8]} mat={mat.yellow}/><Block at={[x,.012,z+4]} size={[2.95,.02,.06]} mat={mat.yellow}/>
   <Lettering at={[x+1.7,.035,z]} size={.24} rotation={[-Math.PI/2,0,-Math.PI/2]} color="#e6bd56">Q{index+1}</Lettering>
  </group>})}
  <Lettering at={[3.4,.04,32]} size={.35} rotation={[-Math.PI/2,0,0]} color="#e6bd56">ENTRADA AUTOS ↑</Lettering>
  <Lettering at={[50,.04,25]} size={.4} rotation={[-Math.PI/2,0,Math.PI]} color="#e6bd56">SALIDA →</Lettering>
  <Block at={[52,.015,17]} size={[.075,.03,6.3]} mat={mat.yellow}/><Block at={[48,.015,17]} size={[.075,.03,6.3]} mat={mat.yellow}/>
  <Block at={[54.3,1.4,17]} size={[.12,1,3.6]} mat={mat.graphite}/><Block at={[54.3,.5,17]} size={[.12,1,.12]} mat={mat.graphite}/>
  <Lettering at={[54.2,1.4,17]} size={.3} rotation={[0,-Math.PI/2,0]} color="#e6bd56">ENTREGA DEMO</Lettering>
  <Block at={[-9.55,.85,16.4]} size={[.12,1.4,2]} mat={mat.graphite}/><Lettering at={[-9.48,1.1,16.4]} size={.18} rotation={[0,Math.PI/2,0]}>Fila de espera</Lettering><Lettering at={[-9.48,.7,16.4]} size={.13} rotation={[0,Math.PI/2,0]} color="#e6bd56">Q1 · Q2 · Q3</Lettering>
  <LoungePrefab mat={mat}/>
  <StaticArchitectureBatch root={root}/>
 </group>
}


