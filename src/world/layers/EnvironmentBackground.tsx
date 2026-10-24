import { useEffect, useMemo, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, MeshStandardMaterial, SRGBColorSpace } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { createBlockGeometry } from '../prefabs/surfaceGeometry'
import { useSurface } from './groundMaterials'

/** The neighbourhood is a photographic skybox, independent of the lot geometry. */
export function EnvironmentBackground({ inspection = false }: { inspection?: boolean }) {
  return <group name="EnvironmentBackground">
    <PhotographicBackground />
    <group name="DepthAtmosphereLayer">
      {inspection && <mesh position={[18, -.27, -10]} rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[800, 800]} /><meshStandardMaterial color="#969e7b" roughness={1} /></mesh>}
    </group>
    <PerimeterWalls/>
  </group>
}

function PhotographicBackground() {
  const sources = useTexture([
    '/textures/background-box/center.png',
    '/textures/background-box/left.png',
    '/textures/background-box/right.png',
  ])
  const { gl } = useThree()
  const box = useRef<Group>(null)
  const textures = useMemo(() => sources.map(source => {
    const texture = source.clone()
    const image = source.image as HTMLImageElement
    const aspect = image.width / image.height
    // The walls are 2:1. Cover-crop any other source proportionally; never
    // interpret an ordinary photograph as a 360-degree spherical projection.
    const x = Math.min(1, 2 / aspect), y = Math.min(1, aspect / 2)
    texture.repeat.set(x, y)
    texture.offset.set((1 - x) / 2, (1 - y) / 2)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    texture.needsUpdate = true
    return texture
  }), [sources, gl])
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures])
  // An infinite-distance photographic box: follow translation, never rotation.
  // Its faces stay behind all lot geometry and inside the camera's far plane.
  useFrame(({ camera }) => box.current?.position.copy(camera.position))
  const faces = [
    { name: 'center', position: [0, 0, -50], yaw: 0, texture: textures[0] },
    { name: 'left', position: [-50, 0, 0], yaw: Math.PI / 2, texture: textures[1] },
    { name: 'right', position: [50, 0, 0], yaw: -Math.PI / 2, texture: textures[2] },
    { name: 'rear', position: [0, 0, 50], yaw: Math.PI, texture: textures[0] },
  ] as const
  return <group ref={box} name="PhotographicBackgroundBox">
    {faces.map(face => <mesh key={face.name} name={`background-${face.name}`} position={[...face.position]} rotation-y={face.yaw} renderOrder={-1000} frustumCulled={false}>
      <planeGeometry args={[100, 50]} />
      <meshBasicMaterial map={face.texture} toneMapped={false} fog={false} depthWrite={false} depthTest={false} />
    </mesh>)}
    <mesh position-y={25} rotation-x={Math.PI / 2} renderOrder={-1000} frustumCulled={false}>
      <planeGeometry args={[100, 100]} /><meshBasicMaterial color="#649bd0" toneMapped={false} fog={false} depthWrite={false} depthTest={false} />
    </mesh>
    <mesh position-y={-25} rotation-x={-Math.PI / 2} renderOrder={-1000} frustumCulled={false}>
      <planeGeometry args={[100, 100]} /><meshBasicMaterial color="#b3ae9f" toneMapped={false} fog={false} depthWrite={false} depthTest={false} />
    </mesh>
  </group>
}

/** Metre-mapped mineral render, recessed joints and bevelled coping. All detail
 * stays at the existing boundary; the photographic background is untouched. */
function PerimeterWalls() {
 const render=useSurface(['Concrete034-Color.jpg','Concrete034-NormalGL.jpg','Concrete034-Roughness.jpg'],[1.8,1.8],'#d2c9b5',.55,.86)
 const stone=useSurface(['Concrete034-Color.jpg','Concrete034-NormalGL.jpg','Concrete034-Roughness.jpg'],[.9,.9],'#8e9287',.4,.9)
 const joint=useMemo(()=>new MeshStandardMaterial({color:'#7e8177',roughness:1}),[])
 useEffect(()=>()=>joint.dispose(),[joint])
 return <group name="PerimeterWallLayer">
  {[{x:18,z:-29.5,length:84,yaw:0},{x:-23.5,z:-7,length:45,yaw:Math.PI/2},{x:59.5,z:-7,length:45,yaw:Math.PI/2}].map(w=>{
   return <group key={w.x} position={[w.x,0,w.z]} rotation-y={w.yaw}>
    <WallSection length={w.length} render={render} stone={stone} joint={joint}/>
   </group>
  })}
 </group>
}

type WallPiece={at:[number,number,number];size:[number,number,number];radius?:number}
function WallSection({length,render,stone,joint}:{length:number;render:MeshStandardMaterial;stone:MeshStandardMaterial;joint:MeshStandardMaterial}){
 const pieces=useMemo(()=>{
  const plaster:WallPiece[]=[{at:[0,.94,0],size:[length,1.88,.26],radius:.022},{at:[0,1.94,0],size:[length+.08,.12,.4],radius:.025}]
  const joints:WallPiece[]=[{at:[0,.36,.139],size:[length,.018,.012]},{at:[0,1.86,.139],size:[length,.018,.012]}]
  const count=Math.ceil(length/4.5),span=length/count
  for(let i=1;i<count;i++){
   const x=-length/2+i*span
   plaster.push({at:[x,.96,0],size:[.19,1.92,.33],radius:.018},{at:[x,2.02,0],size:[.29,.07,.44],radius:.012})
   // Shadow joints sit beside each pilaster, not hidden behind its face.
   for(const side of [-1,1])joints.push({at:[x+.11,1.1,side*.135],size:[.018,1.53,.012]})
  }
  return [plaster,[{at:[0,.16,0],size:[length,.32,.31],radius:.015}] as WallPiece[],joints]
 },[length])
 return <>{[render,stone,joint].map((mat,i)=><WallBatch key={i} material={mat} pieces={pieces[i]}/>)}</>
}
/** Three static meshes per wall, irrespective of the number of joints. */
function WallBatch({pieces,material}:{pieces:WallPiece[];material:MeshStandardMaterial}){
 const geometry=useMemo(()=>{
  const parts=pieces.map(p=>createBlockGeometry(p.size,p.radius||0).translate(...p.at)),merged=mergeGeometries(parts)
  parts.forEach(p=>p.dispose());return merged
 },[pieces])
 useEffect(()=>()=>geometry.dispose(),[geometry])
 return <mesh geometry={geometry} material={material} castShadow receiveShadow/>
}
