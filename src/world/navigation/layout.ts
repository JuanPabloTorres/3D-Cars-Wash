export type Point = readonly [number, number]

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number }

export const EYE_HEIGHT = 1.66

export const WALK_SPEED = 2.2

export const PLAYER_RADIUS = 0.24

export const SPAWN: Point = [-7, 14.5]

export const pedestrianAreas: Rect[] = [
  { minX: -16.1, maxX: -9.3, minZ: 5.5, maxZ: 10.3 },

  { minX: -9.8, maxX: -4.7, minZ: 4, maxZ: 16.2 },

  { minX: -12.4, maxX: 39.6, minZ: 1.7, maxZ: 6.6 },
]

export const obstacles: Rect[] = [
  // The deck joins the sidewalk; its posts remain physical route obstacles.
  { minX: -9.75, maxX: -9.55, minZ: 4.9, maxZ: 5.1 },
  { minX: -9.75, maxX: -9.55, minZ: 8.7, maxZ: 8.9 },

  // Rear lounge planter: keep camera routes outside the physical planting bed.
  { minX: -16.9, maxX: -10.8, minZ: 2.55, maxZ: 3.95 },

  { minX: -12.9, maxX: -10.9, minZ: 6.2, maxZ: 7.2 },

  { minX: -13.03, maxX: -11.77, minZ: 7.62, maxZ: 8.38 },
  { minX: -15.7, maxX: -14.7, minZ: 7.6, maxZ: 8.8 },
  { minX: -11, maxX: -10, minZ: 8.8, maxZ: 10 },
  { minX: -8.2, maxX: -3.8, minZ: 3.1, maxZ: 4.1 },
]

export const destinations = {
  reception: { label: 'Recepción', point: [-6.45, 7.4] as Point, lookAt: [-6, 2.95] as Point },

  services: { label: 'Servicios', point: [-9.9, 3.65] as Point, lookAt: [-9.9, 2.1] as Point },

  viewing: { label: 'Bahía 01', point: [1.2, 4.3] as Point, lookAt: [3.4, -3.6] as Point },

  queue: { label: 'Fila de espera', point: [-0.4, 5.35] as Point, lookAt: [3.4, 17] as Point },

  arrival: {
    label: 'Llegada de vehículos',
    point: [-5.15, 14.5] as Point,
    lookAt: [3.4, 24.8] as Point,
  },

  bay02: { label: 'Bahía 02', point: [8.8, 5.35] as Point, lookAt: [11.4, -3.6] as Point },

  bay03: { label: 'Bahía 03', point: [16.8, 5.35] as Point, lookAt: [19.4, -3.6] as Point },

  bay04: { label: 'Bahía 04', point: [24.8, 5.35] as Point, lookAt: [27.4, -3.6] as Point },

  bay05: { label: 'Bahía 05', point: [32.8, 5.35] as Point, lookAt: [35.4, -3.6] as Point },

  lounge: {
    label: 'Lounge · Sala de espera',
    point: [-13.3, 9.95] as Point,
    lookAt: [-1, -1.5] as Point,
  },
  delivery: { label: 'Entrega y salida', point: [39.2, 6] as Point, lookAt: [50, 17] as Point },

  entrance: { label: 'Entrada', point: SPAWN, lookAt: [-4, -1] as Point },
} as const

export type Destination = keyof typeof destinations

export const ENTRANCE_SIDEWALK: Point[] = [
  [-8.65, 13.8],
  [-8.65, 6.2],
]
export const waypoints: Point[] = [
  SPAWN,
  ...ENTRANCE_SIDEWALK,
  [-8.65, 10],
  [-8.65, 5],
  [-9.9, 3.65],
  [-3.2, 3.7],
  [1.2, 4.3],
  [-5.15, 9.4],
  [-5.15, 14.5],
  [9.2, 4.3],
  [17.2, 4.3],
  [25.2, 4.3],
  [33.2, 4.3],
  [-11.3, 6],
  [-11.3, 8.3],
  [-11.5, 8.7],
  [-10.58, 7.6],
  [-11.4, 8.85],
  [-12.4, 9.8],
  [-10.58, 6.9],
  [-10.4, 6.35],
  [39.2, 6],
]

export function distance(a: Point, b: Point) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

function inside(p: Point, r: Rect) {
  return p[0] >= r.minX && p[0] <= r.maxX && p[1] >= r.minZ && p[1] <= r.maxZ
}

export function isWalkable(p: Point, radius = PLAYER_RADIUS) {
  const samples: Point[] = [
    p,
    [p[0] - radius, p[1]],
    [p[0] + radius, p[1]],
    [p[0], p[1] - radius],
    [p[0], p[1] + radius],
  ]

  return (
    samples.every((s) => pedestrianAreas.some((a) => inside(s, a))) &&
    !obstacles.some((r) =>
      inside(p, {
        minX: r.minX - radius,
        maxX: r.maxX + radius,
        minZ: r.minZ - radius,
        maxZ: r.maxZ + radius,
      }),
    )
  )
}

export function segmentClear(a: Point, b: Point) {
  const steps = Math.max(1, Math.ceil(distance(a, b) / 0.1))

  for (let i = 0; i <= steps; i++)
    if (!isWalkable([a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps]))
      return false

  return true
}

export function moveSafely(from: Point, delta: Point): Point {
  let p: Point = from

  const n = Math.max(1, Math.ceil(Math.hypot(...delta) / 0.08))

  for (let i = 0; i < n; i++) {
    const x: Point = [p[0] + delta[0] / n, p[1]]

    if (isWalkable(x)) p = x

    const z: Point = [p[0], p[1] + delta[1] / n]

    if (isWalkable(z)) p = z
  }

  return p
}
