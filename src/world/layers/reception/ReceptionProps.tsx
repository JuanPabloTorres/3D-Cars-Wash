import { useTexture } from '@react-three/drei'
import { ReceptionPlanting } from './ReceptionPlanting'
import { CounterHotspot, type CounterAction } from './ReceptionHotspot'
import { Lettering } from '../../prefabs/Architecture'
import { RoundedBox } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import { useEffect, useMemo } from 'react'

type Action = CounterAction

/** Independent props emit intent; the scene controller owns the business action. */
export function ReceptionProps({ onAction }: { onAction?: (action: Action) => void }) {
  const source = useTexture('/textures/services/exterior.webp')
  const photo = useMemo(() => {
    const map = source.clone()

    map.colorSpace = SRGBColorSpace

    return map
  }, [source])

  useEffect(() => () => photo.dispose(), [photo])

  return (
    <group name="ReceptionProps">
      <ReceptionPlanting />
      <group
        position={[-1.65, 1.05, 1.13]}
        rotation-x={-0.15}
        onClick={(e) => {
          e.stopPropagation()
          onAction?.('services')
        }}
      >
        <RoundedBox args={[0.38, 0.5, 0.045]} position-y={0.25} radius={0.015}>
          <meshStandardMaterial color="#26343a" roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.3, 0.025]}>
          <planeGeometry args={[0.33, 0.31]} />
          <meshBasicMaterial map={photo} />
        </mesh>
        <Lettering at={[0, 0.085, 0.027]} size={0.038}>
          Servicios
        </Lettering>
        <CounterHotspot
          at={[0, 0.25, 0.04]}
          label="Consultar servicios"
          onActivate={onAction ? () => onAction('services') : undefined}
        />
      </group>
      <group
        position={[1.93, 1.05, 0.77]}
        onClick={(e) => {
          e.stopPropagation()
          onAction?.('questions')
        }}
      >
        <RoundedBox args={[0.34, 0.025, 0.27]} position-y={0.013} radius={0.012}>
          <meshStandardMaterial color="#56646a" metalness={0.6} roughness={0.4} />
        </RoundedBox>
        <RoundedBox
          args={[0.07, 0.22, 0.05]}
          position={[0, 0.13, -0.025]}
          rotation-x={-0.2}
          radius={0.012}
        >
          <meshStandardMaterial color="#56646a" metalness={0.6} roughness={0.4} />
        </RoundedBox>
        <group position={[0, 0.39, 0]} rotation-x={-0.16}>
          <RoundedBox args={[0.65, 0.39, 0.027]} radius={0.015}>
            <meshStandardMaterial color="#56646a" metalness={0.65} roughness={0.38} />
          </RoundedBox>
          <mesh position-z={0.015}>
            <planeGeometry args={[0.607, 0.345]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.15}
              roughness={0.42}
            />
          </mesh>
          <Lettering at={[0, 0.065, 0.017]} size={0.042} color="#152c38">
            Atención al cliente
          </Lettering>
          <Lettering at={[0, -0.013, 0.017]} size={0.028} color="#344e5a">
            Estamos para ayudarte
          </Lettering>
          <RoundedBox position={[0, -0.104, 0.017]} args={[0.27, 0.055, 0.003]} radius={0.001}>
            <meshBasicMaterial color="#d92535" />
          </RoundedBox>
          <Lettering at={[0, -0.104, 0.02]} size={0.025}>
            Preguntas
          </Lettering>
          <CounterHotspot
            at={[0, 0, 0.03]}
            label="Consultar preguntas"
            width={105}
            height={65}
            onActivate={onAction ? () => onAction('questions') : undefined}
          />
        </group>
        <RoundedBox args={[0.44, 0.012, 0.12]} position={[0, 0.009, 0.26]} radius={0.005}>
          <meshStandardMaterial color="#3f4b51" roughness={0.65} />
        </RoundedBox>
      </group>
    </group>
  )
}
