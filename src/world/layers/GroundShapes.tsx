import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, MeshStandardMaterial, Path, Shape, ShapeGeometry, Vector2 } from 'three'

/** Direction of travel painted on asphalt, in the site's X/Z coordinate system. */
export function RoadArrow({
  x,
  z,
  yaw = 0,
  mat,
}: {
  x: number
  z: number
  yaw?: number
  mat: MeshStandardMaterial
}) {
  const shape = useMemo(() => {
    const result = new Shape()

    result.moveTo(-0.24, -1.5)
    result.lineTo(0.24, -1.5)
    result.lineTo(0.24, 0.25)
    result.lineTo(0.9, 0.25)
    result.lineTo(0, 1.5)
    result.lineTo(-0.9, 0.25)
    result.lineTo(-0.24, 0.25)
    result.closePath()

    return result
  }, [])

  return (
    <group position={[x, -0.018, z]} rotation-y={yaw}>
      <mesh rotation-x={-Math.PI / 2} material={mat}>
        <shapeGeometry args={[shape]} />
      </mesh>
    </group>
  )
}

/** Rounded footprint in metre units. Radius affects the plan, not the slab height. */
export function roundedFootprint(width: number, depth: number, radius: number) {
  const w = width / 2,
    d = depth / 2,
    r = Math.min(radius, w, d)
  const shape = new Shape()

  shape.moveTo(-w + r, -d)
  shape.lineTo(w - r, -d)
  shape.quadraticCurveTo(w, -d, w, -d + r)
  shape.lineTo(w, d - r)
  shape.quadraticCurveTo(w, d, w - r, d)
  shape.lineTo(-w + r, d)
  shape.quadraticCurveTo(-w, d, -w, d - r)
  shape.lineTo(-w, -d + r)
  shape.quadraticCurveTo(-w, -d, -w + r, -d)
  shape.closePath()

  return shape
}

/** Continuous concrete walk, with a wider reception landing and a flush-topped
 * road-side curb. Coordinates and texture UVs are metres; no routing changes. */
export function PedestrianWalk({
  mat,
  curb,
  joint,
}: {
  mat: MeshStandardMaterial
  curb: MeshStandardMaterial
  joint: MeshStandardMaterial
}) {
  const geometries = useMemo(() => {
    const vertices = [
      [-12.4, 4],
      [39.6, 4],
      [39.6, 5.8],
      [-4.5, 5.8],
      [-7.15, 9.2],
      [-7.15, 40],
      [-10.05, 40],
      [-10.05, 5.8],
      [-12.4, 5.8],
    ]
    const shape = new Shape()

    vertices.forEach(([x, z], i) => {
      const prev = vertices[(i + vertices.length - 1) % vertices.length],
        next = vertices[(i + 1) % vertices.length]
      const a = Math.hypot(prev[0] - x, prev[1] - z),
        b = Math.hypot(next[0] - x, next[1] - z)
      // Small radii at the straight ends; generous transitions at the landing.
      const radius = Math.min(i === 3 || i === 4 ? 1.2 : 0.18, a * 0.35, b * 0.35)
      const before = [x + ((prev[0] - x) / a) * radius, -z - ((prev[1] - z) / a) * radius]
      const after = [x + ((next[0] - x) / b) * radius, -z - ((next[1] - z) / b) * radius]

      if (i === 0) shape.moveTo(before[0], before[1])
      else shape.lineTo(before[0], before[1])
      shape.quadraticCurveTo(x, -z, after[0], after[1])
    })
    shape.closePath()

    // Follow the road-facing edge, leaving the entrance and deck connection open.
    const border = new Shape()

    border.moveTo(-7.15, -40)
    border.lineTo(-7.15, -10.4)
    border.quadraticCurveTo(-7.15, -9.2, -6.41, -8.25)
    border.lineTo(-5.24, -6.75)
    border.quadraticCurveTo(-4.5, -5.8, -3.3, -5.8)
    border.lineTo(39.42, -5.8)
    border.lineTo(39.42, -5.56)
    border.lineTo(-3.3, -5.56)
    border.quadraticCurveTo(-4.62, -5.56, -5.43, -6.6)
    border.lineTo(-6.6, -8.1)
    border.quadraticCurveTo(-7.39, -9.12, -7.39, -10.4)
    border.lineTo(-7.39, -40)
    border.closePath()

    return {
      slab: new ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false, curveSegments: 16 }),
      curb: new ExtrudeGeometry(border, { depth: 0.18, bevelEnabled: false, curveSegments: 16 }),
    }
  }, [])

  useEffect(
    () => () => Object.values(geometries).forEach((geometry) => geometry.dispose()),
    [geometries],
  )

  return (
    <group name="pedestrian-sidewalk">
      <mesh
        position-y={-0.025}
        rotation-x={-Math.PI / 2}
        geometry={geometries.slab}
        material={mat}
        receiveShadow
        castShadow
      />
      {/* A 12 mm projection keeps the curb face clear of the slab's side faces. */}
      <mesh
        position={[0.012, -0.03, 0.012]}
        rotation-x={-Math.PI / 2}
        geometry={geometries.curb}
        material={curb}
        receiveShadow
        castShadow
      />
      {/* Broad concrete panels, with restrained joints confined to the walk. */}
      {Array.from({ length: 13 }, (_, i) => (
        <PaintStroke
          key={`slab-${i}`}
          points={[
            [-10.03, 10.5 + i * 2.4],
            [-7.41, 10.5 + i * 2.4],
          ]}
          y={0.137}
          width={0.018}
          mat={joint}
        />
      ))}
      <PaintStroke
        points={[
          [-8.72, 9.5],
          [-8.72, 39.96],
        ]}
        y={0.137}
        width={0.012}
        mat={joint}
      />
      {Array.from({ length: 18 }, (_, i) => (
        <PaintStroke
          key={`front-${i}`}
          points={[
            [-3 + i * 2.4, 4.04],
            [-3 + i * 2.4, 5.54],
          ]}
          y={0.137}
          width={0.014}
          mat={joint}
        />
      ))}
      {Array.from({ length: 29 }, (_, i) => (
        <PaintStroke
          key={`curb-${i}`}
          points={[
            [-7.38, 10.7 + i],
            [-7.16, 10.7 + i],
          ]}
          y={0.152}
          width={0.012}
          mat={joint}
        />
      ))}
    </group>
  )
}

type SurfaceProps = {
  x: number
  z: number
  width: number
  depth: number
  bottom?: number
  height?: number
  radius?: number
  rim?: number
  mat: MeshStandardMaterial
}

/** Filled slab or hollow curb. Extruded UV coordinates remain in metres so all
 * existing material densities survive rounding without stretching the textures. */
export function RoundedSurface({
  x,
  z,
  width,
  depth,
  bottom = -0.03,
  height = 0.12,
  radius = 0.65,
  rim = 0,
  mat,
}: SurfaceProps) {
  const geometry = useMemo(() => {
    const shape = roundedFootprint(width, depth, radius)

    if (rim > 0) {
      const inner = roundedFootprint(width - 2 * rim, depth - 2 * rim, Math.max(0.02, radius - rim))

      shape.holes.push(new Path(inner.getPoints(12).reverse()))
    }

    return new ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 12,
      steps: 1,
    })
  }, [width, depth, height, radius, rim])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh
      position={[x, bottom, z]}
      rotation-x={-Math.PI / 2}
      geometry={geometry}
      material={mat}
      receiveShadow
      castShadow
    />
  )
}

/** A painted ribbon on the ground. The path uses X/Z coordinates; it is not a
 * raised barrier and has no effect on operational routing or collision data. */
export function PaintStroke({
  points,
  width = 0.1,
  y = -0.017,
  mat,
}: {
  points: [number, number][]
  width?: number
  y?: number
  mat: MeshStandardMaterial
}) {
  const geometry = useMemo(() => {
    const edges = [-1, 1].map((side) =>
      points.map(([x, z], i) => {
        const previous = points[Math.max(0, i - 1)],
          next = points[Math.min(points.length - 1, i + 1)]
        const length = Math.hypot(next[0] - previous[0], next[1] - previous[1]) || 1

        return new Vector2(
          x + (((side * (next[1] - previous[1])) / length) * width) / 2,
          -z + (((side * (next[0] - previous[0])) / length) * width) / 2,
        )
      }),
    )

    return new ShapeGeometry(new Shape([...edges[0], ...edges[1].reverse()]))
  }, [points, width])

  useEffect(() => () => geometry.dispose(), [geometry])

  return <mesh position-y={y} rotation-x={-Math.PI / 2} geometry={geometry} material={mat} />
}

/** Open corner marks identify a bay without boxing its entire perimeter. */
export function CornerMarks({
  x,
  z,
  width,
  depth,
  mat,
  y = 0.105,
}: {
  x: number
  z: number
  width: number
  depth: number
  mat: MeshStandardMaterial
  y?: number
}) {
  const marks = useMemo(
    () =>
      [-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => {
          const cx = x + sx * (width / 2 - 0.15),
            cz = z + sz * (depth / 2 - 0.15)
          const r = 0.35
          const points: [number, number][] = [
            [cx - sx * 1.05, cz],
            [cx - sx * r, cz],
          ]

          for (let i = 1; i <= 8; i++) {
            const angle = ((i / 8) * Math.PI) / 2

            points.push([
              cx - sx * r + sx * r * Math.sin(angle),
              cz - sz * r + sz * r * Math.cos(angle),
            ])
          }
          points.push([cx, cz - sz * 1.05])

          return points
        }),
      ),
    [x, z, width, depth],
  )

  return (
    <group>
      {marks.map((points, i) => (
        <PaintStroke key={i} points={points} mat={mat} y={y} width={0.09} />
      ))}
    </group>
  )
}
