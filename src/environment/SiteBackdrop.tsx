import {useEffect,useMemo,useRef} from 'react'
import {useTexture} from '@react-three/drei'
import {useFrame} from '@react-three/fiber'
import {BackSide,Color,MeshBasicMaterial,SRGBColorSpace} from 'three'
import {useApp} from '../app/store'
import type {WeatherKind} from './weather'

const weatherTint:Record<WeatherKind,string>={sunny:'#ffffff','partly-cloudy':'#e6edf0',overcast:'#adb9c1',rain:'#859aa9',sunset:'#d89870',night:'#182c48'}
/** Distant 360 degree surround derived from the supplied neighborhood reference.
 * Scenery only: the traversable site and all interactions remain 3D.
 * One inward sphere avoids the former half-screen plane and placeholder blocks. */
export function SiteBackdrop(){
 const source=useTexture('/textures/site-panorama-v2.png'),material=useRef<MeshBasicMaterial>(null)
 const map=useMemo(()=>{const texture=source.clone();texture.colorSpace=SRGBColorSpace;
  // Compress the reference's skyline into distant angular scale instead of
  // enlarging its mountains above the architecture. Clamp poles to sky/ground.
  texture.repeat.y=1.5;texture.offset.y=-.28;return texture},[source])
 const tint=useMemo(()=>new Color(),[])
 useEffect(()=>()=>map.dispose(),[map])
 useFrame((_,dt)=>{material.current?.color.lerp(tint.set(weatherTint[useApp.getState().weather.kind]),1-Math.exp(-Math.min(dt,.05)*1.2))})
 return <mesh name="neighborhood-panorama" position={[18,1.7,7]} rotation-y={Math.PI/2} renderOrder={-2}>
  <sphereGeometry args={[210,64,32]}/>
  <meshBasicMaterial ref={material} map={map} side={BackSide} toneMapped={false} fog={false} depthWrite={false}/>
 </mesh>
}
