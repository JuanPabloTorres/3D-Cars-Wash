import { useEffect, useMemo } from 'react'
import { Text, useTexture } from '@react-three/drei'
import { MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'
import { useApp } from '../../app/store'
import type { Destination } from '../navigation/layout'
import { Model } from './Model'
import { useFrame,useThree } from '@react-three/fiber'
import { InstancedAsset } from '../../environment/EnvironmentBoundary'
import {useCommerce} from '../../app/commerceStore'
import {appConfig} from '../../config/appConfig'
import {useBusiness} from '../../app/business'
import {CounterObjects} from './CounterObjects'
type V3=[number,number,number]
type Palette=ReturnType<typeof usePalette>
function useMapSet(prefix:string,repeat:number){
  const source=useTexture([`/textures/${prefix}-color.jpg`,`/textures/${prefix}-normal.jpg`,`/textures/${prefix}-roughness.jpg`])
  const maps=useMemo(()=>source.map((s,i)=>{const t=s.clone();t.wrapS=t.wrapT=RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=4;if(i===0)t.colorSpace=SRGBColorSpace;return t}),[source,repeat])
  useEffect(()=>()=>maps.forEach(t=>t.dispose()),[maps])
  return maps
}
export function usePalette(){
  const concrete=useMapSet('concrete',9),road=useMapSet('concrete',38),walk=useMapSet('concrete',3),wood=useMapSet('wood',1),deck=useMapSet('wood',3)
  const materials=useMemo(()=>{const palette={
    ground:new MeshStandardMaterial({normalMap:road[1],normalScale:new Vector2(.1,.1),color:'#363b40',roughness:.97}),
    wood:new MeshStandardMaterial({map:wood[0],normalMap:wood[1],roughnessMap:wood[2],color:'#ba956e',roughness:.62}),
    deck:new MeshStandardMaterial({map:deck[0],normalMap:deck[1],roughnessMap:deck[2],color:'#c3a17a',roughness:.76}),
    red:new MeshStandardMaterial({color:'#bb202d',metalness:.4,roughness:.43}),
    graphite:new MeshStandardMaterial({color:'#262c32',metalness:.3,roughness:.55}),
    plaster:new MeshStandardMaterial({color:'#bfc1b8',roughness:.92}),
    pavement:new MeshStandardMaterial({normalMap:walk[1],roughnessMap:walk[2],normalScale:new Vector2(.16,.16),color:'#c9c6bc',roughness:.94}),
    bayFloor:new MeshStandardMaterial({map:concrete[0],normalMap:concrete[1],roughnessMap:concrete[2],color:'#828b89',roughness:.8}),
    joint:new MeshStandardMaterial({color:'#85867e',roughness:1}),
    marking:new MeshStandardMaterial({color:'#e4e2d5',roughness:.95}),
    yellow:new MeshStandardMaterial({color:'#e6bd56',roughness:.6}),
    light:new MeshStandardMaterial({color:'#ffdb9a',emissive:'#ffc06e',emissiveIntensity:2}),
    soil:new MeshStandardMaterial({color:'#403c27',roughness:1}),
  };palette.ground.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 asphaltPosition;').replace('#include <begin_vertex>',`#include <begin_vertex>
      vec4 asphaltWorld=vec4(transformed,1.);
      #ifdef USE_INSTANCING
      asphaltWorld=instanceMatrix*asphaltWorld;
      #endif
      asphaltPosition=(modelMatrix*asphaltWorld).xz;`)
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 asphaltPosition;').replace('#include <color_fragment>',`#include <color_fragment>
      float grain=fract(sin(dot(floor(asphaltPosition*140.),vec2(12.9898,78.233)))*43758.5453);
      diffuseColor.rgb*=mix(.94,1.035,grain);`)
  };palette.ground.customProgramCacheKey=()=> 'fine-matte-asphalt-v1';return palette},[concrete,road,walk,wood,deck])
  useEffect(()=>()=>Object.values(materials).forEach(m=>m.dispose()),[materials])
  useFrame((_,dt)=>{const wet=useApp.getState().weather.kind==='rain';materials.bayFloor.roughness+=((wet?.3:.8)-materials.bayFloor.roughness)*(1-Math.exp(-Math.min(dt,.05)))})
  return materials
}
export function Block({at,size,mat,rotation=[0,0,0],occluder=false}:{at:V3;size:V3;mat:MeshStandardMaterial;rotation?:V3;occluder?:boolean}){
  return <mesh position={at} rotation={rotation} castShadow receiveShadow material={mat} userData={{occluder,staticArchitecture:true}}><boxGeometry args={size}/></mesh>
}
export function Lettering({children,at,size=.24,color='#f3f3f0',rotation=[0,0,0],maxWidth=10}:{children:React.ReactNode;at:V3;size?:number;color?:string;rotation?:V3;maxWidth?:number}){
  return <Text font="/fonts/manrope-medium.ttf" position={at} rotation={rotation} fontSize={size} color={color} anchorX="center" anchorY="middle" maxWidth={maxWidth} lineHeight={1.15}>{children}</Text>
}
export function Wayfinding({at,destination,label,mat}:{at:V3;destination:Destination;label:string;mat:Palette}){
  return <group position={at} onClick={e=>{e.stopPropagation();useApp.getState().navigate(destination)}} onPointerOver={()=>{document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor=''}}>
    <Block at={[0,.65,0]} size={[.12,1.3,.12]} mat={mat.graphite}/>
    <Block at={[0,1.45,0]} size={[1.95,.85,.13]} mat={mat.graphite}/>
    <Lettering at={[0,1.53,.075]} size={.2}>{label}</Lettering>
    <Lettering at={[0,1.24,.075]} size={.13} color="#e6bd56">Toca para abrir →</Lettering>
  </group>
}
export function ReceptionPrefab({mat}:{mat:Palette}){
  const mobile=useThree(s=>s.size.width<=700)
  const business=useBusiness()
  return <group position-z={3.2}>
    <Block at={[-6,.1,-2.2]} size={[6.9,.2,6.1]} mat={mat.pavement}/>
    <Block at={[-6,1.5,-4.8]} size={[6.9,3,.2]} mat={mat.graphite} occluder/>
    <Block at={[-9.35,1.4,-3.4]} size={[.18,2.8,2.7]} mat={mat.plaster} occluder/>
    {[-9.15,-2.85].map(x=><Block key={x} at={[x,1.65,.55]} size={[.2,3.3,.2]} mat={mat.graphite} occluder/>)}
    <Block at={[-6,3.37,-2.1]} size={[7.5,.18,6.35]} mat={mat.red} rotation={[-.04,0,0]}/>
    <Block at={[-6,3.17,.98]} size={[7.5,.38,.18]} mat={mat.graphite}/>
    <Block at={[-6,2.94,.99]} size={[7.25,.035,.08]} mat={mat.light}/>
    <Lettering at={[-6,3.17,1.09]} size={.24}>RECEPCIÓN</Lettering>
    <Lettering at={[-6,2.5,-4.67]} size={mobile?.26:.32} maxWidth={5.1}>{business.name.toUpperCase()}</Lettering>
    <Lettering at={[mobile?-6:-7.05,mobile?2.34:1.93,-4.67]} size={.12} color="#ed7979">CAR WASH</Lettering>
    <Block at={[-6,.62,.3]} size={[4.3,1.04,.7]} mat={mat.graphite} occluder/>
    <Block at={[-6,1.16,.35]} size={[4.5,.12,.92]} mat={mat.wood} occluder/>
    {Array.from({length:41},(_,i)=><Block key={i} at={[-8+i*.1,.62,.685]} size={[.047,.98,.055]} mat={mat.wood}/>)}
    <Block at={[-6,.16,.73]} size={[4.2,.035,.055]} mat={mat.light}/>
    <Lettering at={[-6,1.015,.73]} size={.055} maxWidth={2.8}>{business.name.toUpperCase()}</Lettering>
    {[-7.5,-4.5].map(x=><group key={x}><Block at={[x,2.78,-.5]} size={[.035,.7,.035]} mat={mat.graphite}/><mesh position={[x,2.4,-.5]} castShadow><cylinderGeometry args={[.18,.3,.18,16]}/><meshStandardMaterial color="#27292b" roughness={.6}/></mesh><Block at={[x,2.29,-.5]} size={[.19,.035,.19]} mat={mat.light}/></group>)}
    <Model id="pottedPlant" height={1.05} position={[-9.03,.2,.05]}/>
    <Model id="pottedPlant" height={1.05} position={[-2.97,.2,.05]}/>
    <CounterObjects/>
    {business.contact&&<Lettering at={[-6,2.08,-4.66]} size={.12}>{business.contact.label}</Lettering>}
  </group>
}
export function PavementMarkings({mat}:{mat:Palette}){
  return <group>
    <Block at={[3.4,.02,8.3]} size={[.12,.025,21]} mat={mat.yellow}/><Block at={[6.7,.02,8.3]} size={[.12,.025,21]} mat={mat.yellow}/>
    {[-.3,1.2,2.7,4.2].map((z,i)=><group key={`bay-${i}`}><Block at={[3.4,.025,z]} size={[6.6,.025,.06]} mat={mat.graphite}/><Block at={[.55,.025,z]} size={[.08,.03,.42]} mat={mat.yellow}/><Block at={[6.25,.025,z]} size={[.08,.03,.42]} mat={mat.yellow}/></group>)}
  </group>
}
export function WashBayPrefab({mat,bayId='01',availability='free'}:{mat:Palette;bayId?:string;availability?:'free'|'occupied'|'out-of-service'}){
  return <group position={[(Number(bayId)-1)*8,0,0]} name={`bay:${bayId}`} userData={{bayId,availability}}>
    <Block at={[3.4,-.025,-4.6]} size={[7.5,.06,9.5]} mat={mat.bayFloor}/>
    {[.8,6].map(x=><Block key={x} at={[x,1.6,-9.25]} size={[2.25,3.2,.24]} mat={mat.plaster} occluder/>)}
    {[.8,6].map(x=><Block key={x} at={[x,1.05,-9.08]} size={[2.2,.24,.1]} mat={mat.red}/>)}
    {[.8,6].map(x=><Block key={x} at={[x,.27,-9.06]} size={[2.2,.5,.12]} mat={mat.graphite}/>)}
    {[-.35,7.15].flatMap(x=>[-.2,-8.9].map(z=><Block key={`${x}-${z}`} at={[x,1.85,z]} size={[.24,3.7,.24]} mat={mat.graphite} occluder/>))}
    <Block at={[3.4,3.72,-4.5]} size={[8.1,.15,10.1]} mat={mat.red} rotation={[-.035,0,0]}/>
    <Block at={[3.4,3.47,.58]} size={[8.1,.55,.22]} mat={mat.red}/>
    <Block at={[3.4,3.05,.6]} size={[7.9,.24,.19]} mat={mat.graphite}/>
    <Lettering at={[3.4,3.47,.72]} size={.4}>{bayId}</Lettering>
    <Lettering at={[3.4,3.05,.72]} size={.115}>{availability==='out-of-service'?'FUERA DE SERVICIO':availability==='occupied'?'SERVICIO DEMO':'DISPONIBLE'}</Lettering>
    {[-7,-4,-1].map(z=><group key={z}><Block at={[3.4,3.42,z]} size={[7.35,.13,.13]} mat={mat.graphite}/><Block at={[3.4,3.33,z]} size={[4.7,.035,.065]} mat={mat.light}/></group>)}
    {[.55,6.25].map(x=><Block key={x} at={[x,.012,-4]} size={[.075,.02,7.5]} mat={mat.yellow}/>)}
    <Block at={[3.4,.018,.1]} size={[6.2,.035,.3]} mat={mat.graphite}/>
    {Array.from({length:30},(_,i)=><Block key={i} at={[.5+i*.2,.04,.1]} size={[.045,.015,.26]} mat={mat.plaster}/>)}
    <Model id="hose" height={1.05} position={[6.6,.8,-7.4]} rotation={-Math.PI/2}/>
    <Model id="cart" height={.9} position={[.7,.01,-7.3]} rotation={Math.PI/2}/>
    <Block at={[.15,.5,.45]} size={[.12,1,.12]} mat={mat.yellow}/>
    <Block at={[6.65,.5,.45]} size={[.12,1,.12]} mat={mat.yellow}/>
  </group>
}
export function ServiceDisplay({mat}:{mat:Palette}){
  return <group position={[-9.9,0,2.05]} onClick={e=>{e.stopPropagation();useCommerce.getState().updateDraft({step:'services'});useApp.getState().navigate('reception')}}>
    <Block at={[0,.5,0]} size={[1.45,1,.65]} mat={mat.wood} occluder/>
    <Block at={[0,1.18,-.15]} size={[1.55,1.1,.13]} mat={mat.graphite}/>
    <Lettering at={[0,1.51,-.075]} size={.15}>Cuidado para tu auto</Lettering>
    <Lettering at={[0,1.15,-.075]} size={.12}>Exterior · Interior · Focos</Lettering>
    <Lettering at={[0,.84,-.075]} size={.09} color="#e6bd56">Consulta los servicios en recepción</Lettering>
  </group>
}
export function Landscape({mat}:{mat:Palette}){
  const beds:V3[]=[[-11.6,0,-3.8],[-16.8,0,12],[55,0,-5],[55,0,4],[-6,0,-8],[3,0,-24]]
  const trees=useMemo(()=>[[-14.5,.42,3,.7,1],[-11.6,.42,-3.8,2.1,.95],[17,.02,-11,1.2,1.8]] as [number,number,number,number,number][],[])
  const shrubs=useMemo(()=>[[-16,.42,3.2,0,1],[-15.1,.42,3.3,1,.95],[-14.2,.42,3.4,2,.9],[-13.3,.42,3.3,.8,1],[-12.4,.42,3.2,2,1],[-11.5,.42,3.3,1.2,.95],[-17,.02,6.1,1,1],[-17,.02,7.1,2,1],[-17,.02,8.1,3,1]] as [number,number,number,number,number][],[])
  const ferns=useMemo(()=>beds.map(([x,y,z],i)=>[x,y+.42,z+.3,i,.6] as [number,number,number,number,number]),[])
  return <group>
    {beds.map((p,i)=><group key={i} position={p}>
      <Block at={[0,.2,0]} size={[1.7,.4,2]} mat={mat.plaster}/>
      <Block at={[0,.405,0]} size={[1.55,.03,1.85]} mat={mat.soil}/>
    </group>)}
    <InstancedAsset url="/models/coherentOak.glb" placements={[trees[0]]} height={7} castShadow/>
    <InstancedAsset url="/models/urbanTree.glb" placements={trees.slice(1)} height={7} castShadow/>
    <InstancedAsset url="/models/urbanShrub.glb" placements={shrubs} height={.68} castShadow/>
    <InstancedAsset url="/models/urbanFern.glb" placements={ferns} height={.48}/>
    {Array.from({length:4},(_,i)=><group key={i}><Block at={[-16.8,.2,6+i*1.3]} size={[.8,.4,.9]} mat={mat.plaster}/><Model id="urbanCalathea" height={.5+(i%3)*.04} position={[-16.8,.4,6+i*1.3]} rotation={i}/></group>)}
  </group>
}




