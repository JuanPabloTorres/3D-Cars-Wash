import { useEffect, useMemo } from 'react'
import {useFrame} from '@react-three/fiber'
import {useApp} from '../../app/store'
import { MeshStandardMaterial, Vector2 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { Block, Lettering, type usePalette } from './Architecture'
import { Model } from './Model'
import { createBlockGeometry } from './surfaceGeometry'

type V3 = [number, number, number]
type Palette = ReturnType<typeof usePalette>
type Piece = { at: V3; size: V3 }
type Availability = 'free' | 'occupied' | 'out-of-service'

/** Repeated static trims share one draw call per finish; no per-frame rebuilding. */
function FinishBatch({ pieces, material, radius = .008 }: {
  pieces: Piece[]; material: MeshStandardMaterial; radius?: number
}) {
  const geometry = useMemo(() => {
    const parts = pieces.map(({ at, size }) => {
      const part = createBlockGeometry(size, radius)
      part.translate(...at)
      return part
    })
    const merged = mergeGeometries(parts)
    parts.forEach(part => part.dispose())
    return merged
  }, [pieces, radius])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} material={material} castShadow receiveShadow userData={{ staticArchitecture: true }}/>
}

const columns: V3[] = [-.35, 7.15].flatMap(x => [-.2, -8.9].map(z => [x, 1.85, z] as V3))
const basePlates: Piece[] = columns.map(([x, , z]) => ({ at: [x, .025, z], size: [.39, .04, .39] }))
const baseBolts: Piece[] = columns.flatMap(([x, , z]) => [-.14, .14].flatMap(dx => [-.14, .14].map(dz => ({
  at: [x + dx, .051, z + dz] as V3, size: [.032, .016, .032] as V3,
}))))
const roofRibs: Piece[] = Array.from({ length: 11 }, (_, i) => ({
  at: [-.25 + i * .73, 3.57, -4.5], size: [.045, .035, 9.5],
}))
const purlins: Piece[] = [-7, -4, -1].map(z => ({ at: [3.4, 3.42, z], size: [7.35, .13, .13] }))
const lightBars: Piece[] = [-7, -4, -1].map(z => ({ at: [3.4, 3.34, z], size: [4.7, .025, .085] }))
const drainSlats: Piece[] = Array.from({ length: 51 }, (_, i) => ({
  at: [.45 + i * .118, -.0025, -.1], size: [.034, .015, .26],
}))
const drainFrame: Piece[] = [-.24, .04].map(z => ({ at: [3.4, -.0025, z], size: [6.2, .015, .02] }))

function useBayFinishes(palette: Palette) {
  const finishes = useMemo(() => {
    // These are local material copies. Texture ownership stays with usePalette.
    const floor = palette.bayFloor.clone()
    floor.color.set('#9ca5a3')
    floor.normalScale = new Vector2(.16, .16)
    floor.roughness = .78
    floor.metalness = 0
    // Mineral wash slab keeps its aggregate without inheriting the source scan's
    // very dark albedo; normal and roughness maps retain the surface variation.
    floor.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
      diffuseColor *= mix(vec4(1.0), texture2D(map, vMapUv), .55);
      #endif`)}
    floor.customProgramCacheKey=()=> 'bay-mineral-floor-v1'
    const steel = palette.graphite.clone()
    steel.color.set('#353f44')
    steel.metalness = .4
    steel.roughness = .5
    steel.normalScale = new Vector2(.02, .02)
    const red = palette.red.clone()
    red.color.set('#b82330')
    red.roughness = .64
    red.metalness = .18
    const lining = new MeshStandardMaterial({ color: '#a7aaa6', roughness: .86, metalness: .12 })
    const drain = new MeshStandardMaterial({ color: '#737c7e', roughness: .56, metalness: .65 })
    const recess = new MeshStandardMaterial({ color: '#20282a', roughness: .98 })
    const lamp = new MeshStandardMaterial({ color: '#fff1d4', emissive: '#ffe0a7', emissiveIntensity: .7, roughness: .65 })
    return { floor, steel, red, lining, drain, recess, lamp }
  }, [palette])
  useEffect(() => () => Object.values(finishes).forEach(material => material.dispose()), [finishes])
  useFrame((_,delta)=>{
    const target=useApp.getState().weather.kind==='rain'?.38:.78
    finishes.floor.roughness+=(target-finishes.floor.roughness)*(1-Math.exp(-Math.min(delta,.05)))
  })
  return finishes
}

/** Visual finish only: the operational provider remains authoritative for occupancy.
 * Local coordinates, rear vehicle opening and floor contact height match WashBayPrefab.
 */
export function FinishedWashBay({ mat, bayId = '01', availability = 'free' }: {
  mat: Palette; bayId?: string; availability?: Availability
}) {
  const finish = useBayFinishes(mat)
  const status = availability === 'out-of-service' ? 'FUERA DE SERVICIO' : availability === 'occupied' ? 'SERVICIO DEMO' : 'DISPONIBLE'
  return <group position={[(Number(bayId) - 1) * 8, 0, 0]} name={`bay:${bayId}`} userData={{ bayId, availability }}>
    {/* Top y=.005 throughout. The channel cuts the slab; the grate is never a speed bump. */}
    <Block at={[3.4, -.025, -4.8]} size={[7.5, .06, 9.1]} mat={finish.floor} radius={0}/>
    <Block at={[3.4, -.025, .1]} size={[7.5, .06, .1]} mat={finish.floor} radius={0}/>
    {[-.025, 6.825].map(x => <Block key={x} at={[x, -.025, -.1]} size={[.65, .06, .3]} mat={finish.floor} radius={0}/>)}
    <Block at={[3.4, -.041, -.1]} size={[6.2, .015, .3]} mat={finish.recess} radius={0}/>
    <FinishBatch pieces={drainSlats} material={finish.drain} radius={0}/>
    <FinishBatch pieces={drainFrame} material={finish.drain} radius={0}/>

    {[.8, 6].map(x => <group key={x}>
      <Block at={[x, 1.6, -9.25]} size={[2.25, 3.2, .24]} mat={mat.plaster} occluder/>
      <Block at={[x, 1.05, -9.08]} size={[2.2, .24, .1]} mat={finish.red}/>
      <Block at={[x, .27, -9.06]} size={[2.2, .5, .12]} mat={finish.steel}/>
      <Block at={[x, .55, -9.06]} size={[2.2, .025, .13]} mat={finish.drain}/>
    </group>)}
    {columns.map(at => <Block key={at.join(':')} at={at} size={[.24, 3.7, .24]} mat={finish.steel} occluder radius={.012}/>)}
    <FinishBatch pieces={basePlates} material={finish.steel}/>
    <FinishBatch pieces={baseBolts} material={finish.drain}/>
    <Block at={[3.4, 3.72, -4.5]} size={[8.1, .15, 10.1]} mat={finish.red} rotation={[-.035, 0, 0]}/>
    <Block at={[3.4, 3.6, -4.5]} size={[7.6, .04, 9.5]} mat={finish.lining}/>
    <FinishBatch pieces={roofRibs} material={finish.steel}/>
    <FinishBatch pieces={purlins} material={finish.steel}/>
    <FinishBatch pieces={lightBars} material={finish.lamp}/>
    <Block at={[3.4, 3.47, .58]} size={[8.1, .55, .22]} mat={finish.red}/>
    <Block at={[3.4, 3.05, .6]} size={[7.9, .24, .19]} mat={finish.steel}/>
    <Lettering at={[3.4, 3.47, .72]} size={.4}>{bayId}</Lettering>
    <Lettering at={[3.4, 3.05, .72]} size={.115}>{status}</Lettering>
    <rectAreaLight position={[3.4, 3.28, -4]} rotation={[-Math.PI / 2, 0, 0]} width={4.7} height={.35} color="#fff0d5" intensity={1.3}/>

    {[.55, 6.25].map(x => <Block key={x} at={[x, .007, -4]} size={[.075, .004, 7.5]} mat={mat.yellow} radius={0}/>)}
    {/* The original professional hose now has a wall-mounted bracket, not a floating reel. */}
    <Block at={[6.45, 1.18, -9.045]} size={[.5, .7, .09]} mat={finish.steel}/>
    <Block at={[6.45, .74, -8.87]} size={[.5, .08, .44]} mat={finish.steel}/>
    <Model id="hose" height={1.05} position={[6.45, .78, -8.7]} rotation={-Math.PI / 2}/>
    <Model id="cart" height={.9} position={[.7, .005, -7.3]} rotation={Math.PI / 2}/>
    {[.15, 6.65].map(x => <group key={x}>
      <Block at={[x, .025, .45]} size={[.25, .04, .25]} mat={finish.steel}/>
      <Block at={[x, .5, .45]} size={[.12, 1, .12]} mat={mat.yellow}/>
      <Block at={[x, .72, .45]} size={[.125, .11, .125]} mat={finish.steel}/>
    </group>)}
  </group>
}
