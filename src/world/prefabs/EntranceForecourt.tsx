import { useMemo } from 'react'
import { Shape } from 'three'
import { Block, type usePalette } from './Architecture'
import { plantingBeds } from '../siteLandscape'

type Palette = ReturnType<typeof usePalette>

/** Presentation only: clear pedestrian paving and planting outside live lanes.
 * Queue/car routes still belong to sitePlan; no obstacle or order is added here. */
export function EntranceForecourt({ mat }: { mat: Palette }) {
  const arrow = useMemo(() => {
    const shape = new Shape()

    shape.moveTo(-0.16, -1)
    shape.lineTo(0.16, -1)
    shape.lineTo(0.16, 0.38)
    shape.lineTo(0.55, 0.38)
    shape.lineTo(0, 1)
    shape.lineTo(-0.55, 0.38)
    shape.lineTo(-0.16, 0.38)
    shape.closePath()

    return shape
  }, [])

  return (
    <group name="entrance-forecourt">
      <Block at={[-8.85, 0.035, 10.2]} size={[2.1, 0.12, 12.6]} mat={mat.pavement} />
      <Block at={[13.6, 0.035, 4.9]} size={[52, 0.12, 1.8]} mat={mat.pavement} />
      {/* Reference: continuous dark asphalt in front, pale sidewalk only at left.
        Keep subtle transverse joints on that sidewalk, never a forecourt grid. */}
      {Array.from({ length: 8 }, (_, i) => (
        <Block
          key={`slab-${i}`}
          at={[-8.85, 0.098, 5 + i * 1.6]}
          size={[2.06, 0.003, 0.008]}
          mat={mat.joint}
        />
      ))}
      {[-7.72, -9.98].map((x) => (
        <Block
          key={`curb-${x}`}
          at={[x, 0.065, 10.2]}
          size={[0.16, 0.19, 12.7]}
          mat={mat.plaster}
        />
      ))}
      <Block at={[19.7, 0.065, 5.88]} size={[39.5, 0.19, 0.16]} mat={mat.plaster} />
      {/* Soil and every in-ground plant are owned together by Landscape. */}
      {[-12.6, -10.5].map((x, i) => (
        <group key={`lamp-${x}`}>
          <Block at={[x, 0.46, 11.5 + i * 3]} size={[0.16, 0.86, 0.16]} mat={mat.graphite} />
          <Block at={[x, 0.83, 11.5 + i * 3]} size={[0.19, 0.16, 0.19]} mat={mat.light} />
        </group>
      ))}
      {[8.1, 12.6].map((z) => (
        <group key={`light-${z}`}>
          <Block
            at={[plantingBeds.forecourt.x - 0.5, 0.46, z]}
            size={[0.16, 0.86, 0.16]}
            mat={mat.graphite}
          />
          <Block
            at={[plantingBeds.forecourt.x - 0.5, 0.83, z]}
            size={[0.19, 0.16, 0.19]}
            mat={mat.light}
          />
        </group>
      ))}
      {/* Painted directional arrow on the vehicle lane, never on the footpath. */}
      <Block at={[3.4, -0.017, 29.5]} size={[0.3, 0.015, 1.6]} mat={mat.marking} />
      {[-1, 1].map((sign) => (
        <Block
          key={`arrow-${sign}`}
          at={[3.4 + sign * 0.29, -0.017, 28.65]}
          size={[0.24, 0.015, 0.85]}
          rotation={[0, (sign * Math.PI) / 4, 0]}
          mat={mat.marking}
        />
      ))}
      <mesh position={[-5.2, -0.014, 8.5]} rotation-x={-Math.PI / 2} material={mat.marking}>
        <shapeGeometry args={[arrow]} />
      </mesh>
      <Block
        at={[plantingBeds.forecourt.x + plantingBeds.forecourt.width / 2 + 0.24, -0.014, 10.4]}
        size={[0.08, 0.018, 6.4]}
        mat={mat.yellow}
      />
      {[8.9, 10.35, 11.8].map((z) => (
        <Block
          key={`stop-${z}`}
          at={[plantingBeds.forecourt.x + plantingBeds.forecourt.width / 2 + 0.17, 0.025, z]}
          size={[0.19, 0.11, 0.85]}
          mat={mat.yellow}
        />
      ))}
    </group>
  )
}
