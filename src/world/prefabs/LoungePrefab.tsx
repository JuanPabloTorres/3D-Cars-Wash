import { RoundedBox } from '@react-three/drei'
import { Block, type usePalette } from './Architecture'
import { Model } from './Model'
import {useEffect,useMemo} from 'react'
import {DataTexture,LinearMipmapLinearFilter,MeshStandardMaterial,RepeatWrapping,Vector2} from 'three'

type Palette = ReturnType<typeof usePalette>
type Textiles={fabric:MeshStandardMaterial;accent:MeshStandardMaterial}

/** Small tiling normal data gives upholstery a fine weave without new assets. */
function useTextiles():Textiles{
 const finish=useMemo(()=>{
  const size=32,data=new Uint8Array(size*size*4)
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const offset=(y*size+x)*4
   data[offset]=128+Math.round(Math.sin(x*Math.PI/2)*12)
   data[offset+1]=128+Math.round(Math.sin(y*Math.PI/2)*12)
   data[offset+2]=254;data[offset+3]=255
  }
  const normal=new DataTexture(data,size,size)
  normal.wrapS=normal.wrapT=RepeatWrapping;normal.repeat.set(24,24)
  normal.generateMipmaps=true;normal.minFilter=LinearMipmapLinearFilter;normal.needsUpdate=true
  const options={normalMap:normal,normalScale:new Vector2(.3,.3),roughness:1,metalness:0}
  return {normal,fabric:new MeshStandardMaterial({...options,color:'#a8a396'}),accent:new MeshStandardMaterial({...options,color:'#89323b'})}
 },[])
 useEffect(()=>()=>{finish.fabric.dispose();finish.accent.dispose();finish.normal.dispose()},[finish])
 return finish
}

/** One outdoor furniture family: dark frame, slatted sides and soft upholstery. */
function OutdoorSeat({ mat, textiles, width = 1.9, accent = false }: { mat: Palette; textiles:Textiles; width?: number; accent?: boolean }) {
  const cushions = width > 1.5 ? 2 : 1
  const cushionWidth = (width - .28) / cushions
  return <group>
    {[-width / 2 + .09, width / 2 - .09].flatMap(x => [-.32, .32].map(z => <Block key={`${x}:${z}`} at={[x, .22, z]} size={[.075, .44, .075]} mat={mat.graphite} />))}
    <Block at={[0, .32, 0]} size={[width, .075, .86]} mat={mat.graphite} />
    {[-1, 1].map(sign => <group key={sign}>
      <Block at={[sign * (width / 2 - .05), .68, 0]} size={[.075, .075, .88]} mat={mat.graphite} />
      {Array.from({ length: 9 }, (_, i) => <Block key={i} at={[sign * (width / 2 - .05), .5, -.36 + i * .09]} size={[.018, .33, .018]} mat={mat.graphite} />)}
    </group>)}
    {Array.from({ length: 16 }, (_, i) => <Block key={`back-${i}`} at={[-width / 2 + .09 + i * (width - .18) / 15, .6, -.38]} size={[.018, .48, .018]} mat={mat.graphite} />)}
    {Array.from({ length: cushions }, (_, i) => <group key={i} position-x={(i - (cushions - 1) / 2) * cushionWidth}>
      <RoundedBox args={[cushionWidth - .015, .18, .75]} radius={.06} smoothness={3} position={[0, .45, 0]} castShadow receiveShadow material={textiles.fabric}/>
      <RoundedBox args={[cushionWidth - .02, .43, .17]} radius={.055} smoothness={3} position={[0, .72, -.28]} rotation-x={-.13} castShadow receiveShadow material={textiles.fabric}/>
    </group>)}
    {accent && <RoundedBox args={[.38, .36, .13]} radius={.06} smoothness={4} position={[-.4, .65, -.12]} rotation={[.05, -.15, -.13]} castShadow receiveShadow material={textiles.accent}/>}
  </group>
}

export function LoungePrefab({ mat }: { mat: Palette }) {
  const textiles=useTextiles()
  return <group name="entrance-lounge">
    {Array.from({ length: 24 }, (_, i) => <Block key={i} at={[-13.15, .045, 4.72 + i * .235]} size={[7.3, .13, .222]} mat={mat.deck} />)}
    <Block at={[-13.15, 3.62, 7.5]} size={[7.65, .18, 6.3]} mat={mat.red} />
    <Block at={[-13.15, 3.48, 7.5]} size={[7.35, .09, 6.05]} mat={mat.deck} />
    {[-16.6, -9.65].flatMap(x => [5, 8.8].map(z => <Block key={`${x}:${z}`} at={[x, 1.8, z]} size={[.2, 3.6, .2]} mat={mat.graphite} occluder />))}
    {[-15.4, -12.7, -10.4].map(x => <mesh key={x} rotation-x={Math.PI / 2} position={[x, 3.418, 8]}><cylinderGeometry args={[.09, .09, .025, 16]} /><meshStandardMaterial color="#fff0c9" emissive="#ffd39a" emissiveIntensity={.65} /></mesh>)}
    <group position={[-11.9, .12, 6.7]}><OutdoorSeat mat={mat} textiles={textiles} accent /></group>
    <group position={[-10.5, .12, 9.4]} rotation-y={-Math.PI / 2}><OutdoorSeat mat={mat} textiles={textiles} width={1.1} /></group>
    <group position={[-15.2, .12, 8.2]} rotation-y={Math.PI / 2}><OutdoorSeat mat={mat} textiles={textiles} width={1.1} /></group>
    <group position={[-12.4, .12, 8]}>
      <Block at={[0, .35, 0]} size={[1.22, .055, .72]} mat={mat.graphite} />
      {Array.from({ length: 6 }, (_, i) => <Block key={i} at={[0, .39, -.3 + i * .12]} size={[1.2, .055, .112]} mat={mat.wood} />)}
      {[-.5, .5].flatMap(x => [-.25, .25].map(z => <Block key={`${x}:${z}`} at={[x, .17, z]} size={[.06, .34, .06]} mat={mat.graphite} />))}
      <Model id="pottedPlant" height={.32} position={[.05, .418, 0]} />
    </group>
    {/* Local bounce only; shared world exposure and other areas stay unchanged. */}
    <rectAreaLight position={[-13.1, 3.2, 7.6]} rotation-x={-Math.PI / 2} width={5} height={3.5} intensity={1.6} color="#f6ead5" />
  </group>
}
