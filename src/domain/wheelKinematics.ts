import type { XZ } from './sitePlan'

export interface WheelMotion {
  wheelAngle: number
  steering: number
  radius: number
  count: number
}

/** World +Z is vehicle forward; rotations about local X roll the contact patch. */
export function rollWheels(angle: number, from: XZ, to: XZ, yaw: number, radius: number) {
  if (!Number.isFinite(radius) || radius <= 0) return angle

  const dx = to[0] - from[0],
    dz = to[1] - from[1],
    forward = dx * Math.sin(yaw) + dz * Math.cos(yaw)

  return angle + (Math.sign(forward) * Math.hypot(dx, dz)) / radius
}
