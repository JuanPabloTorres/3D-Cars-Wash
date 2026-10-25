import { useEffect, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { MeshStandardMaterial } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { Armchair, Hand } from 'lucide-react'
import { Block, Lettering } from '../../prefabs/Architecture'
import { createBlockGeometry } from '../../prefabs/surfaceGeometry'
import { PottedPlant } from '../../prefabs/Planter'
import { WarmPendantLens } from '../WarmDiffuser'
import { loungePlan } from './loungePlan'
import { useLoungeMaterials } from './loungeMaterials'
import { LoungeFurniture } from './LoungeFurniture'

function Boards({ mat, ceiling = false }: { mat: MeshStandardMaterial; ceiling?: boolean }) {
  const geometry = useMemo(() => {
    const parts = Array.from({ length: 38 }, (_, i) => {
      const board = createBlockGeometry([0.18, 0.055, 5.2], 0.009)

      board.translate((i - 18.5) * 0.185, ceiling ? 2.95 : 0.038, 0)

      return board
    })
    const result = mergeGeometries(parts)

    parts.forEach((part) => part.dispose())

    return result
  }, [ceiling])

  useEffect(() => () => geometry.dispose(), [geometry])

  return <mesh geometry={geometry} material={mat} castShadow receiveShadow />
}

/** Additive independent layer: its boards sit on the retained deck; removing
 * this group restores the ground/landscape baseline without rebuilding it. */
export function WaitingLoungeLayer({
  active,
  onConsult,
}: {
  active: boolean
  onConsult: () => void
}) {
  const mat = useLoungeMaterials()

  return (
    <group position={loungePlan.origin} name="WaitingLoungeLayer">
      <Block at={[0, 0.006, 0]} size={[7.08, 0.009, 5.28]} mat={mat.backing} />
      <Boards mat={mat.top} />
      <Boards mat={mat.ceiling} ceiling />
      {[-1, 1].map((sign) => (
        <group key={sign}>
          <Block at={[sign * 3.5, 0.025, 0]} size={[0.1, 0.09, 5.3]} mat={mat.ceiling} />
          <Block at={[0, 0.025, sign * 2.65]} size={[7.1, 0.09, 0.1]} mat={mat.ceiling} />
          <Block at={[sign * 3.35, 2.85, 0]} size={[0.14, 0.18, 5.25]} mat={mat.metal} />
          <Block at={[0, 2.85, sign * 2.5]} size={[6.8, 0.18, 0.14]} mat={mat.metal} />
          {[-1, 1].map((z) => (
            <group key={z}>
              <Block
                at={[sign * 3.35, 1.48, z * 2.5]}
                size={[0.14, 2.96, 0.14]}
                mat={mat.metal}
                radius={0.015}
              />
              <Block at={[sign * 3.35, 0.09, z * 2.5]} size={[0.28, 0.08, 0.28]} mat={mat.metal} />
              <Block at={[sign * 3.35, 2.75, z * 2.5]} size={[0.22, 0.25, 0.22]} mat={mat.metal} />
            </group>
          ))}
        </group>
      ))}
      <Block at={[0, 3.06, 0]} size={[7.25, 0.16, 5.55]} mat={mat.metal} radius={0.025} />
      <Block at={[0, 3.14, 0]} size={[7.3, 0.065, 5.6]} mat={mat.red} radius={0.016} />
      {[-1.7, 1.7].map((x) => (
        <group key={x} position={[x, 2.915, 0]}>
          <mesh rotation-x={Math.PI / 2} material={mat.metal}>
            <torusGeometry args={[0.17, 0.025, 8, 32]} />
          </mesh>
          <group scale={0.6}>
            <WarmPendantLens />
          </group>
          <pointLight
            position={[0, -0.18, 0]}
            color="#ffe1b0"
            intensity={2}
            distance={4}
            decay={2}
          />
        </group>
      ))}
      <LoungeFurniture mat={mat} />
      <PottedPlant
        position={[
          loungePlan.table[0],
          loungePlan.table[1] + loungePlan.tableTop.center + loungePlan.tableTop.thickness / 2,
          0,
        ]}
        radius={0.12}
        height={0.2}
        plantHeight={0.25}
        asset="/models/layer02/warmShrub.glb"
        finish="landscape"
      />
      <PottedPlant
        position={[-3.1, 0.065, -0.55]}
        height={0.5}
        plantHeight={0.7}
        asset="/models/layer02/warmBroadleaf.glb"
        rotation={1.5}
        finish="landscape"
      />
      <PottedPlant
        position={[2.55, 0.065, -1.95]}
        height={0.43}
        plantHeight={0.4}
        asset="/models/layer02/warmShrub.glb"
        finish="landscape"
      />
      <group
        position={loungePlan.terminal}
        rotation-y={-1.35}
        name="lounge-information-station"
        onClick={
          active
            ? (e) => {
                e.stopPropagation()
                onConsult()
              }
            : undefined
        }
      >
        <Block at={[0, 0.035, 0]} size={[0.46, 0.07, 0.32]} mat={mat.metal} />
        <Block at={[0, 0.51, 0]} size={[0.075, 0.96, 0.075]} mat={mat.metal} />
        <Block at={[0, 1.1, 0]} size={[0.64, 0.42, 0.055]} mat={mat.metal} radius={0.04} />
        {!active && (
          <Lettering at={[0, 1.1, 0.035]} size={0.04} color="#a5dedb">
            Consulta tu servicio
          </Lettering>
        )}
        {/* Perspective-bound screen: the hit target stays inside its physical bezel. */}
        {active && (
          <Html
            transform
            distanceFactor={1}
            position={[0, 1.1, 0.036]}
            occlude
            zIndexRange={[25, 1]}
          >
            <button
              className="lounge-terminal"
              onClick={onConsult}
              aria-label="Consultar mi espera"
              aria-controls="lounge-detail"
            >
              <Armchair size={30} />
              <strong>Tu espera</strong>
              <span>
                Toca para consultar <Hand size={16} />
              </span>
            </button>
          </Html>
        )}
      </group>
    </group>
  )
}
