import {
  queueCenter,
  handover,
  roundedRoute,
  routeLength,
  sampleRoute,
  type XZ,
} from '../../domain/sitePlan'
import { useMemo } from 'react'
import { Path } from 'three'
import { Lettering } from '../prefabs/Architecture'
import { CornerMarks, PaintStroke, RoadArrow } from './GroundShapes'
import type { useGroundMaterials } from './groundMaterials'

/** Equal metre spacing follows bends as well as straight segments. */
function DashedRoute({
  points,
  mat,
}: {
  points: XZ[]
  mat: ReturnType<typeof useGroundMaterials>['marking']
}) {
  const dashes = useMemo(() => {
    const route = roundedRoute(points),
      length = routeLength(route)

    return Array.from({ length: Math.floor(length / 3.6) }, (_, i) =>
      [0, 0.8, 1.6].map(
        (step) => [...sampleRoute(route, i * 3.6 + step).position] as [number, number],
      ),
    )
  }, [points])

  return (
    <>
      {dashes.map((points, i) => (
        <PaintStroke key={i} points={points} width={0.13} mat={mat} />
      ))}
    </>
  )
}

/** Permanent paint follows the existing queue and handover coordinates. It does
 * not create parking capacity or change the provider's vehicle routes. */
export function ServiceGroundMarkings({ mat }: { mat: ReturnType<typeof useGroundMaterials> }) {
  const entryEdges = useMemo(() => {
    const walkSide = new Path()

    walkSide.moveTo(-6.7, 36)
    walkSide.lineTo(-6.7, 11)
    walkSide.quadraticCurveTo(-6.7, 6.65, -2.4, 6.65)
    walkSide.lineTo(39, 6.65)

    const bedSide = new Path()

    bedSide.moveTo(-2.85, 36)
    bedSide.lineTo(-2.85, 12)
    bedSide.quadraticCurveTo(-2.85, 9.35, 0.6, 9.35)

    return [walkSide, bedSide].map((path) =>
      path.getPoints(40).map((p) => [p.x, p.y] as [number, number]),
    )
  }, [])

  return (
    <group name="service-ground-markings">
      <group name="entrance-road-edges">
        {entryEdges.map((points, i) => (
          <PaintStroke key={i} points={points} width={0.13} mat={mat.marking} />
        ))}
      </group>
      {/* Complete the road circuit: frontage, rear service aisle and delivery exit. */}
      <group name="site-road-circuit">
        <DashedRoute
          points={[
            [8, 9.5],
            [42, 9.5],
            [46, 5.5],
            [46, -11],
            [42, -14],
            [-18, -14],
          ]}
          mat={mat.marking}
        />
        <PaintStroke
          points={[
            [-20, -17.6],
            [49, -17.6],
            [53.2, -13.4],
            [53.2, 38],
          ]}
          width={0.13}
          mat={mat.marking}
        />
        <PaintStroke
          points={[
            [-20, -10.8],
            [39.7, -10.8],
          ]}
          width={0.13}
          mat={mat.marking}
        />
        <PaintStroke
          points={[
            [48.2, 23],
            [48.2, 38],
          ]}
          width={0.13}
          mat={mat.marking}
        />
        <PaintStroke
          points={[
            [7, 37.5],
            [46.5, 37.5],
          ]}
          width={0.13}
          mat={mat.marking}
        />
        <DashedRoute
          points={[
            [8, 33.5],
            [43, 33.5],
            [46, 30],
          ]}
          mat={mat.marking}
        />
        <DashedRoute
          points={[
            [-21, 35],
            [-21, -14],
            [-17, -14],
          ]}
          mat={mat.marking}
        />
        <RoadArrow x={-4.4} z={12.8} mat={mat.marking} />
        {[8, 27].map((x) => (
          <RoadArrow key={`front-${x}`} x={x} z={8.2} yaw={-Math.PI / 2} mat={mat.marking} />
        ))}
        <RoadArrow x={46} z={0} mat={mat.marking} />
        <RoadArrow x={26} z={-12.5} yaw={Math.PI / 2} mat={mat.marking} />
        <RoadArrow x={12} z={-15.6} yaw={-Math.PI / 2} mat={mat.marking} />
        <RoadArrow x={51} z={29} yaw={Math.PI} mat={mat.marking} />
        <RoadArrow x={28} z={33.5} yaw={-Math.PI / 2} mat={mat.marking} />
      </group>
      {[0, 1, 2].map((index) => {
        const [x, z] = queueCenter(index)

        return (
          <group key={index} name={`queue-paint-${index + 1}`}>
            <CornerMarks x={x} z={z} width={3.2} depth={7.1} mat={mat.marking} y={-0.017} />
            <Lettering
              at={[x, -0.014, z + 2.45]}
              rotation={[-Math.PI / 2, 0, 0]}
              size={0.42}
              color="#d5d8d3"
            >{`ESPERA 0${index + 1}`}</Lettering>
          </group>
        )
      })}
      <CornerMarks
        x={handover[0]}
        z={handover[1]}
        width={5}
        depth={9}
        mat={mat.yellow}
        y={-0.017}
      />
      <Lettering
        at={[handover[0], -0.014, handover[1] + 3.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={0.52}
        color="#e6cf7c"
      >
        ENTREGA
      </Lettering>
      {/* Short dashed lane edges leave access to every bay and the queue open. */}
      {Array.from({ length: 5 }, (_, i) => (
        <PaintStroke
          key={`arrival-${i}`}
          points={[
            [-4.4, 34 - i * 3.8],
            [-4.4, 32.2 - i * 3.8],
          ]}
          width={0.13}
          mat={mat.marking}
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <PaintStroke
          key={`cross-${i}`}
          points={[
            [9 + i * 4, 11.8],
            [11 + i * 4, 11.8],
          ]}
          width={0.12}
          mat={mat.marking}
        />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <PaintStroke
          key={`approach-${i}`}
          points={[
            [44.2, 7 - i * 4],
            [44.2, 5 - i * 4],
          ]}
          width={0.12}
          mat={mat.marking}
        />
      ))}
    </group>
  )
}
