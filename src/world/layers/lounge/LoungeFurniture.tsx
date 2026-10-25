import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, Shape } from 'three'
import { Block } from '../../prefabs/Architecture'
import type { LoungeMaterials } from './loungeMaterials'
import { loungePlan } from './loungePlan'
import { upholsteryGeometry } from './upholsteryGeometry'

/** One upholstered family shared by sofa and chairs, with puffed cushions,
 * curved arm/back shell, fine metal feet and independent textile finishes. */
function Seat({ width, mat }: { width: number; mat: LoungeMaterials }) {
  const count = width > 2 ? 3 : 1,
    seatWidth = (width - 0.15) / count
  const geometry = useMemo(() => {
    const half = width / 2 + 0.06,
      inside = half - 0.1,
      shape = new Shape()

    shape.moveTo(-half, -0.3)
    shape.lineTo(-half, 0.24)
    shape.quadraticCurveTo(-half, 0.49, -half + 0.24, 0.49)
    shape.lineTo(half - 0.24, 0.49)
    shape.quadraticCurveTo(half, 0.49, half, 0.24)
    shape.lineTo(half, -0.3)
    shape.lineTo(inside, -0.3)
    shape.lineTo(inside, 0.22)
    shape.quadraticCurveTo(inside, 0.38, inside - 0.18, 0.38)
    shape.lineTo(-inside + 0.18, 0.38)
    shape.quadraticCurveTo(-inside, 0.38, -inside, 0.22)
    shape.lineTo(-inside, -0.3)
    shape.closePath()

    return {
      shell: new ExtrudeGeometry(shape, {
        depth: 0.33,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.035,
        bevelSegments: 4,
        curveSegments: 16,
      }),
      seat: upholsteryGeometry(seatWidth - 0.025, 0.21, 0.77),
      back: upholsteryGeometry(seatWidth - 0.02, 0.43, 0.19),
      pillow: upholsteryGeometry(0.35, 0.35, 0.14),
    }
  }, [width, seatWidth])

  useEffect(() => () => Object.values(geometry).forEach((g) => g.dispose()), [geometry])

  return (
    <group>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh
            key={`${x}:${z}`}
            position={[x * (width / 2 - 0.1), 0.16, z * 0.33]}
            rotation={[z * 0.07, 0, -x * 0.07]}
            material={mat.metal}
            castShadow
          >
            <cylinderGeometry args={[0.025, 0.017, 0.3, 20]} />
          </mesh>
        )),
      )}
      <Block at={[0, 0.31, 0]} size={[width + 0.08, 0.075, 0.87]} mat={mat.metal} radius={0.035} />
      <mesh
        geometry={geometry.shell}
        material={mat.secondary}
        position-y={0.35}
        rotation-x={-Math.PI / 2}
        castShadow
        receiveShadow
      />
      {Array.from({ length: count }, (_, i) => {
        const x = (i - (count - 1) / 2) * seatWidth

        return (
          <group key={i}>
            <mesh
              geometry={geometry.seat}
              material={mat.linen}
              position={[x, 0.47, 0.055]}
              castShadow
              receiveShadow
            />
            <mesh
              geometry={geometry.back}
              material={mat.linen}
              position={[x, 0.76, -0.25]}
              rotation-x={-0.16}
              castShadow
              receiveShadow
            />
            <Block
              at={[x, 0.465, 0.425]}
              size={[seatWidth - 0.17, 0.005, 0.005]}
              mat={mat.secondary}
              radius={0.002}
            />
          </group>
        )
      })}
      <mesh
        geometry={geometry.pillow}
        material={width > 2 ? mat.wine : mat.olive}
        position={[width > 2 ? -0.75 : 0.16, 0.74, -0.045]}
        rotation={[-0.18, 0, width > 2 ? -0.15 : 0.16]}
        castShadow
      />
    </group>
  )
}

export function LoungeFurniture({ mat }: { mat: LoungeMaterials }) {
  return (
    <group name="lounge-furniture">
      {loungePlan.seats.map((seat) => (
        <group key={seat.id} name={seat.id} position={[...seat.position]} rotation-y={seat.yaw}>
          <Seat width={seat.width} mat={mat} />
        </group>
      ))}
      <group position={loungePlan.table} name="lounge-coffee-table">
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((z) => (
            <mesh
              key={`${x}:${z}`}
              position={[x * 0.51, 0.22, z * 0.29]}
              material={mat.metal}
              castShadow
            >
              <cylinderGeometry args={[0.027, 0.02, 0.44, 20]} />
            </mesh>
          )),
        )}
        <Block
          at={[0, loungePlan.tableTop.center, 0]}
          size={[1.43, loungePlan.tableTop.thickness, 0.83]}
          mat={mat.top}
          radius={0.035}
        />
        <Block at={[0, 0.43, 0]} size={[1.3, 0.035, 0.73]} mat={mat.metal} radius={0.015} />
      </group>
    </group>
  )
}
