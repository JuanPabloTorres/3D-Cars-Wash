import { Block, Lettering } from '../../prefabs/Architecture'
import { useBusiness } from '../../../app/business'
import { receptionPlan as plan } from './receptionPlan'
import { useReceptionMaterials } from './receptionMaterials'
import { WarmPendantLens } from '../WarmDiffuser'
import type { CounterAction } from './ReceptionHotspot'
import { ReceptionProps } from './ReceptionProps'
import { ReceptionWallInformation } from './ReceptionWallInformation'
import { useMemo } from 'react'
import { Object3D } from 'three'

/** Physical architecture only. No business state mutations or navigation rules. */
export function ReceptionStructure({ lights = false, onAction }: { lights?: boolean; onAction?: (action: CounterAction) => void }) {
  const mat = useReceptionMaterials(), business = useBusiness()
  const lightTargets = useMemo(()=>[-1.48,1.48].map(x=>{const target=new Object3D();target.position.set(x,1.05,.92);return target}),[])
  const c = plan.counter
  return <group name="ReceptionStructure" position={plan.origin}>
    <Block at={[0,1.52,-2.58]} size={[6.5,3.04,.18]} mat={mat.wall} radius={.035}/>
    {[-3.12,3.12].flatMap(x => [-2.52,2.56].map(z => <group key={`${x}:${z}`}>
      <Block at={[x,1.56,z]} size={[.16,3.12,.16]} mat={mat.metal} radius={.015}/>
      <Block at={[x,.025,z]} size={[.28,.05,.28]} mat={mat.metal} radius={.02}/>
    </group>))}
    {/* A folded red fascia encloses the steel frame and separate timber soffit. */}
    <Block at={[0,3.15,0]} size={[6.7,.16,5.8]} mat={mat.red} radius={.035}/>
    <Block at={[0,3.04,0]} size={[6.48,.065,5.58]} mat={mat.ceiling} radius={.015}/>
    {[-2.64,2.64].map(z => <Block key={z} at={[0,2.97,z]} size={[6.5,.16,.12]} mat={mat.metal} radius={.015}/>)}
    {[-3.1,3.1].map(x => <Block key={x} at={[x,2.97,0]} size={[.12,.16,5.4]} mat={mat.metal} radius={.015}/>)}
    <Block at={[0,3.07,2.86]} size={[6.7,.31,.12]} mat={mat.red} radius={.025}/>
    <Block at={[0,2.88,2.87]} size={[6.7,.15,.14]} mat={mat.metal} radius={.015}/>
    <Lettering at={[0,2.89,2.95]} size={.13}>RECEPCIÓN</Lettering>
    <Lettering at={[0,2.4,-2.465]} size={.5} maxWidth={5.5}>{business.name.toUpperCase()}</Lettering>
    <Lettering at={[0,1.98,-2.465]} size={.21} color="#e43142">CAR WASH</Lettering>
    <Block at={[-.94,1.98,-2.42]} size={[.32,.06,.035]} mat={mat.red} radius={.01}/>
    <group name="ReceptionCounter">
      <Block at={[0,.48,c.z]} size={[c.width-.14,.88,c.depth-.12]} mat={mat.backing} radius={.045}/>
      <Block at={[0,.065,c.z]} size={[c.width-.24,.13,c.depth-.17]} mat={mat.metal} radius={.025}/>
      <Block at={[0,c.height-.055,c.z+.02]} size={[c.width+.18,.11,c.depth+.16]} mat={mat.top} radius={.035}/>
      {Array.from({length:43},(_,i) => <Block key={i} at={[-2.1+i*.1,.53,c.z+c.depth/2-.035]} size={[.068,.85,.06]} mat={mat.slats[i%3]} radius={.009}/>)}
      {[-1,1].map(side => Array.from({length:7},(_,i) => <Block key={`${side}:${i}`} at={[side*(c.width/2-.055),.53,c.z-.3+i*.1]} size={[.06,.85,.068]} mat={mat.slats[i%3]} radius={.009}/>))}
      <Lettering at={[0,.59,c.z+c.depth/2+.006]} size={.23} maxWidth={2.9}>{business.name.toUpperCase()}</Lettering>
      <Lettering at={[0,.36,c.z+c.depth/2+.006]} size={.095} color="#ef6566">CAR WASH</Lettering>
      <Block at={[-.48,.36,c.z+c.depth/2+.01]} size={[.25,.028,.018]} mat={mat.red}/>
    </group>
    {lights && <group name="ReceptionLighting">
      {lightTargets.map(target=><primitive key={target.uuid} object={target}/>)}
      {[-1.48,1.48].map((x,i) => <group key={x} position={[x,2.45,.72]}>
        <mesh position-y={.56} castShadow><cylinderGeometry args={[.105,.105,.055,40]}/><primitive object={mat.metal} attach="material"/></mesh>
        <mesh position-y={.515}><cylinderGeometry args={[.03,.03,.06,24]}/><primitive object={mat.metal} attach="material"/></mesh>
        <mesh position-y={.27}><cylinderGeometry args={[.012,.012,.54,12]}/><primitive object={mat.metal} attach="material"/></mesh>
        <mesh castShadow><cylinderGeometry args={[.09,.28,.22,48,1,true]}/><primitive object={mat.metal} attach="material"/></mesh>
        <group position-y={-.115}><WarmPendantLens/></group>
        <spotLight position={[0,-.13,0]} target={lightTargets[i]} color="#ffe1b2" intensity={6} distance={3.2} decay={2} angle={.8} penumbra={.8}/>
      </group>)}
    </group>}
    {lights && <><ReceptionWallInformation onAction={onAction}/><ReceptionProps onAction={onAction}/></>}
  </group>
}
