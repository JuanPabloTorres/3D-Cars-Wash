import { useEffect, useMemo, useLayoutEffect, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import { DoubleSide, SRGBColorSpace, Vector2, InstancedMesh, Object3D, Color } from 'three'
import { InstancedAsset } from './InstancedVegetation'
import type { PlantPlacement } from '../siteLandscape'

/** Open ceramic vessel: a real inner wall, rolled lip and recessed soil. */
export function Planter({x=0,z=0,height=.58,radius=.292}:{x?:number;z?:number;height?:number;radius?:number}){
 const [source,normal]=useTexture(['/textures/ground-v2/mud-Diffuse.jpg','/textures/ground-v2/mud-nor_gl.jpg'])
 const soil=useMemo(()=>{const map=source.clone();map.colorSpace=SRGBColorSpace;return map},[source])
 useEffect(()=>()=>soil.dispose(),[soil])
 const profile=useMemo(()=>[[.215,.025],[.23,.035],[.29,height-.035],[.292,height-.012],[.283,height],[.263,height],[.252,height-.022],[.246,height-.11]].map(([r,y])=>new Vector2(r,y)),[height])
 return <group position={[x,0,z]} scale={[radius/.292,1,radius/.292]} name="Planter">
  <mesh castShadow receiveShadow><latheGeometry args={[profile,64]}/><meshStandardMaterial color="#c4bdae" roughness={.86} side={DoubleSide}/></mesh>
  <mesh position-y={planterSoilHeight(height)} rotation-x={-Math.PI/2} receiveShadow><circleGeometry args={[.253,48]}/><meshStandardMaterial map={soil} normalMap={normal} normalScale={new Vector2(.35,.35)} color="#73604a" roughness={1}/></mesh>
  <SoilAggregate height={height}/>
  <mesh position-y={.026}><cylinderGeometry args={[.222,.21,.034,48]}/><meshStandardMaterial color="#6d6b61" roughness={.9}/></mesh>
 </group>
}

/** Identical soil detail, batched in one draw per vessel instead of 22. */
function SoilAggregate({height}:{height:number}){
 const mesh=useRef<InstancedMesh>(null)
 useLayoutEffect(()=>{const object=new Object3D(),color=new Color();for(let i=0;i<22;i++){
  const angle=i*2.399,r=.09+(i%5)*.029;object.position.set(Math.cos(angle)*r,height-.052,Math.sin(angle)*r)
  object.scale.set(.012+(i%3)*.004,.006,.009);object.updateMatrix();mesh.current!.setMatrixAt(i,object.matrix)
  mesh.current!.setColorAt(i,color.set(i%3?'#544332':'#8a7962'))
 }mesh.current!.instanceMatrix.needsUpdate=true;mesh.current!.instanceColor!.needsUpdate=true;mesh.current!.computeBoundingSphere()},[height])
 return <instancedMesh ref={mesh} args={[undefined,undefined,22]}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial roughness={1}/></instancedMesh>
}

/** The same recessed soil plane anchors every species, independently of area. */
export const planterSoilHeight=(height:number)=>height-.055
export type PottedPlantProps={position:[number,number,number];height?:number;radius?:number;plantHeight:number;asset:string;rotation?:number;finish?:'landscape'}
export function PottedPlant({position,height=.58,radius=.292,plantHeight,asset,rotation=0,finish}:PottedPlantProps){
 const placements=useMemo<PlantPlacement[]>(()=>[[0,planterSoilHeight(height),0,rotation,1]],[height,rotation])
 return <group position={position} name="potted-plant"><Planter height={height} radius={radius}/><InstancedAsset url={asset} height={plantHeight} placements={placements} finish={finish} castShadow/></group>
}
