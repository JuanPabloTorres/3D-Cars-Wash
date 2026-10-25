import type { CameraFocus } from '../GroundLayer'
import { Vector3 } from 'three'

/** Metres; contained by the existing 7.3 × 5.6 m deck. Front access is +Z. */
export const loungePlan = {
  origin: [-13.15, 0.07, 7.5] as [number, number, number],
  size: [7.3, 5.6] as const,
  entry: [-8.8, 1.68, 9.65] as [number, number, number],
  threshold: [-10, 1.68, 9.65] as [number, number, number],
  observation: { position: [-16.1, 1.6, 9.9], target: [-2, 0.95, 1.5] } as CameraFocus,
  seats: [
    { id: 'sofa', position: [-2.1, 0.065, -1.6], yaw: 0, width: 2.6 },
    { id: 'chair-rear', position: [0.45, 0.065, -1.8], yaw: -0.2, width: 0.94 },
    { id: 'chair-front', position: [0.8, 0.065, 1.3], yaw: Math.PI + 0.2, width: 0.94 },
  ],
  table: [-0.85, 0.065, 0] as [number, number, number],
  tableTop: { center: 0.455, thickness: 0.075 },
  terminal: [-0.7, 0, 1.2] as [number, number, number],
} as const

/** Follow the existing west sidewalk and front deck aisle. Reception connects
 * through its landing at Z=6.6; the entrance follows X=-8.8 along the sidewalk. */
export function loungeCameraRoute(
  from: [number, number, number],
  to: [number, number, number],
  entering: boolean,
): [number, number, number][] {
  const other = entering ? from : to
  // One approach to the open front aisle; the former rectangular detour
  // reversed direction at Z=6.6 before returning toward the lounge.
  const inward: [number, number, number][] = [
    other,
    loungePlan.entry,
    loungePlan.threshold,
    entering ? to : from,
  ]

  return entering ? inward : inward.reverse()
}

/** Round only inside each waypoint's adjacent segments: no spline overshoot
 * through planting or furniture. The same rounded route is reversible. */
export function roundLoungeRoute(route: [number, number, number][]) {
  const points = route.map((p) => new Vector3(...p)),
    result = [points[0]]

  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1],
      b = points[i],
      c = points[i + 1],
      ab = a.distanceTo(b),
      bc = b.distanceTo(c)

    if (ab < 0.001 || bc < 0.001) continue

    const radius = Math.min(0.45, ab * 0.35, bc * 0.35),
      start = b.clone().lerp(a, radius / ab),
      end = b.clone().lerp(c, radius / bc)

    result.push(start)
    for (let j = 1; j <= 10; j++) {
      const t = j / 10

      result.push(
        start
          .clone()
          .multiplyScalar((1 - t) ** 2)
          .addScaledVector(b, 2 * t * (1 - t))
          .addScaledVector(end, t * t),
      )
    }
  }
  result.push(points.at(-1)!)

  return result
}
