import { useTexture } from '@react-three/drei'
import { ReceptionPlanting } from './ReceptionPlanting'
import { CounterHotspot, type CounterAction } from './ReceptionHotspot'
import { Lettering } from '../../prefabs/Architecture'
import { RoundedBox } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import { useEffect, useMemo } from 'react'

type Action = CounterAction
/** Independent props emit intent; the scene controller owns the business action. */
export function ReceptionProps({onAction}: {onAction?: (action: Action) => void}) {
  const source=useTexture('/textures/services/exterior.webp')
  const photo=useMemo(()=>{const map=source.clone();map.colorSpace=SRGBColorSpace;return map},[source])
  useEffect(()=>()=>photo.dispose(),[photo])
  return <group name="ReceptionProps">
    <ReceptionPlanting/>
    <group position={[-1.65,1.05,1.13]} rotation-x={-.15} onClick={e=>{e.stopPropagation();onAction?.('services')}}>
      <RoundedBox args={[.38,.5,.045]} position-y={.25} radius={.015}><meshStandardMaterial color="#26343a" roughness={.5}/></RoundedBox>
      <mesh position={[0,.3,.025]}><planeGeometry args={[.33,.31]}/><meshBasicMaterial map={photo}/></mesh>
      <Lettering at={[0,.085,.027]} size={.038}>Servicios</Lettering>
      <CounterHotspot at={[0,.25,.04]} label="Consultar servicios" onActivate={onAction?()=>onAction("services"):undefined}/>
    </group>
    <group position={[1.93,1.05,.77]} onClick={e=>{e.stopPropagation();onAction?.('questions')}}>
      <RoundedBox args={[.34,.025,.27]} position-y={.013} radius={.012}><meshStandardMaterial color="#56646a" metalness={.6} roughness={.4}/></RoundedBox>
      <RoundedBox args={[.07,.22,.05]} position={[0,.13,-.025]} rotation-x={-.2} radius={.012}><meshStandardMaterial color="#56646a" metalness={.6} roughness={.4}/></RoundedBox>
      <group position={[0,.39,0]} rotation-x={-.16}>
        <RoundedBox args={[.65,.39,.027]} radius={.015}><meshStandardMaterial color="#56646a" metalness={.65} roughness={.38}/></RoundedBox>
        <mesh position-z={.015}><planeGeometry args={[.607,.345]}/><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={.15} roughness={.42}/></mesh>
        <Lettering at={[0,.065,.017]} size={.042} color="#152c38">Atención al cliente</Lettering>
        <Lettering at={[0,-.013,.017]} size={.028} color="#344e5a">Estamos para ayudarte</Lettering>
        <RoundedBox position={[0,-.104,.017]} args={[.27,.055,.003]} radius={.001}><meshBasicMaterial color="#d92535"/></RoundedBox>
        <Lettering at={[0,-.104,.02]} size={.025}>Preguntas</Lettering>
        <CounterHotspot at={[0,0,.03]} label="Consultar preguntas" width={105} height={65} onActivate={onAction?()=>onAction("questions"):undefined}/>
      </group>
      <RoundedBox args={[.44,.012,.12]} position={[0,.009,.26]} radius={.005}><meshStandardMaterial color="#3f4b51" roughness={.65}/></RoundedBox>
    </group>
  </group>
}
