import {useRef,type ReactNode} from 'react'
import { Html } from '@react-three/drei'
import {useFrame}from '@react-three/fiber'
import {Group}from 'three'
import {diagnostics}from '../diagnostics'
export function WorldInteractionCard({position,children,vehicleId}:{position:[number,number,number];children:ReactNode;vehicleId?:string}){
 const group=useRef<Group>(null)
 useFrame(()=>{const p=vehicleId&&diagnostics.vehicles[vehicleId]?.position;if(p&&group.current)group.current.position.set(p[0],position[1],p[1])})
 return <group ref={group} position={position}><Html center occlude zIndexRange={[20,0]}><div className="world-card">{children}</div></Html></group>
}
