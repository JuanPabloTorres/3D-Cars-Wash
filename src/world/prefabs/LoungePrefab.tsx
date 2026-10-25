import { RoundedBox } from '@react-three/drei'
import { Block, type usePalette } from './Architecture'
import { Model } from './Model'
import { useEffect, useMemo } from 'react'
import {
  DataTexture,
  LinearMipmapLinearFilter,
  MeshStandardMaterial,
  RepeatWrapping,
  Vector2,
} from 'three'

type Palette = ReturnType<typeof usePalette>

type Textiles = { fabric: MeshStandardMaterial; accent: MeshStandardMaterial }

/** Small tiling normal data gives upholstery a fine weave without new assets. */
function useTextiles(): Textiles {
  const finish = useMemo(() => {
    const size = 32,
      data = new Uint8Array(size * size * 4)

    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const offset = (y * size + x) * 4

        data[offset] = 128 + Math.round(Math.sin((x * Math.PI) / 2) * 12)
        data[offset + 1] = 128 + Math.round(Math.sin((y * Math.PI) / 2) * 12)
        data[offset + 2] = 254
        data[offset + 3] = 255
      }

    const normal = new DataTexture(data, size, size)

    normal.wrapS = normal.wrapT = RepeatWrapping
    normal.repeat.set(24, 24)
    normal.generateMipmaps = true
    normal.minFilter = LinearMipmapLinearFilter
    normal.needsUpdate = true

    const options = {
      normalMap: normal,
      normalScale: new Vector2(0.3, 0.3),
      roughness: 1,
      metalness: 0,
    }

    return {
      normal,
      fabric: new MeshStandardMaterial({ ...options, color: '#a8a396' }),
      accent: new MeshStandardMaterial({ ...options, color: '#89323b' }),
    }
  }, [])

  useEffect(
    () => () => {
      finish.fabric.dispose()
      finish.accent.dispose()
      finish.normal.dispose()
    },
    [finish],
  )

  return finish
}

/** One outdoor furniture family: dark frame, slatted sides and soft upholstery. */
function OutdoorSeat({
  mat,
  textiles,
  width = 1.9,
  accent = false,
}: {
  mat: Palette
  textiles: Textiles
  width?: number
  accent?: boolean
}) {
  const cushions = width > 1.5 ? 2 : 1
  const cushionWidth = (width - 0.28) / cushions

  return (
    <group>
      {[-width / 2 + 0.09, width / 2 - 0.09].flatMap((x) =>
        [-0.32, 0.32].map((z) => (
          <Block
            key={`${x}:${z}`}
            at={[x, 0.22, z]}
            size={[0.075, 0.44, 0.075]}
            mat={mat.graphite}
          />
        )),
      )}
      <Block at={[0, 0.32, 0]} size={[width, 0.075, 0.86]} mat={mat.graphite} />
      {[-1, 1].map((sign) => (
        <group key={sign}>
          <Block
            at={[sign * (width / 2 - 0.05), 0.68, 0]}
            size={[0.075, 0.075, 0.88]}
            mat={mat.graphite}
          />
          {Array.from({ length: 9 }, (_, i) => (
            <Block
              key={i}
              at={[sign * (width / 2 - 0.05), 0.5, -0.36 + i * 0.09]}
              size={[0.018, 0.33, 0.018]}
              mat={mat.graphite}
            />
          ))}
        </group>
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <Block
          key={`back-${i}`}
          at={[-width / 2 + 0.09 + (i * (width - 0.18)) / 15, 0.6, -0.38]}
          size={[0.018, 0.48, 0.018]}
          mat={mat.graphite}
        />
      ))}
      {Array.from({ length: cushions }, (_, i) => (
        <group key={i} position-x={(i - (cushions - 1) / 2) * cushionWidth}>
          <RoundedBox
            args={[cushionWidth - 0.015, 0.18, 0.75]}
            radius={0.06}
            smoothness={3}
            position={[0, 0.45, 0]}
            castShadow
            receiveShadow
            material={textiles.fabric}
          />
          <RoundedBox
            args={[cushionWidth - 0.02, 0.43, 0.17]}
            radius={0.055}
            smoothness={3}
            position={[0, 0.72, -0.28]}
            rotation-x={-0.13}
            castShadow
            receiveShadow
            material={textiles.fabric}
          />
        </group>
      ))}
      {accent && (
        <RoundedBox
          args={[0.38, 0.36, 0.13]}
          radius={0.06}
          smoothness={4}
          position={[-0.4, 0.65, -0.12]}
          rotation={[0.05, -0.15, -0.13]}
          castShadow
          receiveShadow
          material={textiles.accent}
        />
      )}
    </group>
  )
}

export function LoungePrefab({ mat }: { mat: Palette }) {
  const textiles = useTextiles()

  return (
    <group name="entrance-lounge">
      {Array.from({ length: 24 }, (_, i) => (
        <Block
          key={i}
          at={[-13.15, 0.045, 4.72 + i * 0.235]}
          size={[7.3, 0.13, 0.222]}
          mat={mat.deck}
        />
      ))}
      <Block at={[-13.15, 3.62, 7.5]} size={[7.65, 0.18, 6.3]} mat={mat.red} />
      <Block at={[-13.15, 3.48, 7.5]} size={[7.35, 0.09, 6.05]} mat={mat.deck} />
      {[-16.6, -9.65].flatMap((x) =>
        [5, 8.8].map((z) => (
          <Block
            key={`${x}:${z}`}
            at={[x, 1.8, z]}
            size={[0.2, 3.6, 0.2]}
            mat={mat.graphite}
            occluder
          />
        )),
      )}
      {[-15.4, -12.7, -10.4].map((x) => (
        <mesh key={x} rotation-x={Math.PI / 2} position={[x, 3.418, 8]}>
          <cylinderGeometry args={[0.09, 0.09, 0.025, 16]} />
          <meshStandardMaterial color="#fff0c9" emissive="#ffd39a" emissiveIntensity={0.65} />
        </mesh>
      ))}
      <group position={[-11.9, 0.12, 6.7]}>
        <OutdoorSeat mat={mat} textiles={textiles} accent />
      </group>
      <group position={[-10.5, 0.12, 9.4]} rotation-y={-Math.PI / 2}>
        <OutdoorSeat mat={mat} textiles={textiles} width={1.1} />
      </group>
      <group position={[-15.2, 0.12, 8.2]} rotation-y={Math.PI / 2}>
        <OutdoorSeat mat={mat} textiles={textiles} width={1.1} />
      </group>
      <group position={[-12.4, 0.12, 8]}>
        <Block at={[0, 0.35, 0]} size={[1.22, 0.055, 0.72]} mat={mat.graphite} />
        {Array.from({ length: 6 }, (_, i) => (
          <Block
            key={i}
            at={[0, 0.39, -0.3 + i * 0.12]}
            size={[1.2, 0.055, 0.112]}
            mat={mat.wood}
          />
        ))}
        {[-0.5, 0.5].flatMap((x) =>
          [-0.25, 0.25].map((z) => (
            <Block
              key={`${x}:${z}`}
              at={[x, 0.17, z]}
              size={[0.06, 0.34, 0.06]}
              mat={mat.graphite}
            />
          )),
        )}
        <Model id="pottedPlant" height={0.32} position={[0.05, 0.418, 0]} />
      </group>
      {/* Local bounce only; shared world exposure and other areas stay unchanged. */}
      <rectAreaLight
        position={[-13.1, 3.2, 7.6]}
        rotation-x={-Math.PI / 2}
        width={5}
        height={3.5}
        intensity={1.6}
        color="#f6ead5"
      />
    </group>
  )
}
