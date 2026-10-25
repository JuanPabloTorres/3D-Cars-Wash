/** Metres in the shared site's X/Z plane. A bed owns both visible soil and roots.
 * Canopies may overhang; planted bases must remain inside the soil inset. */
export const plantingBeds = {
  // Leave room for the truck's rear swing as it turns out of the queue.
  forecourt: { x: -1.6, z: 13, width: 1.8, depth: 6.4, height: 0.3 },
  entranceWest: { x: -11.4, z: 13.5, width: 1.8, depth: 5.2, height: 0.3 },
  loungeRear: { x: -13.85, z: 3.25, width: 6.1, depth: 1.4, height: 0.4 },
  loungeWest: { x: -18.4, z: 7.5, width: 2.6, depth: 8.4, height: 0.4 },
  receptionWest: { x: -11.6, z: -3.8, width: 1.7, depth: 2, height: 0.4 },
  receptionRear: { x: -6, z: -8, width: 1.7, depth: 2, height: 0.4 },
  east: { x: 55.8, z: -0.5, width: 2.8, depth: 14, height: 0.3 },
  // The truck manoeuvres behind the bays at z=-14. Soil begins at -18.5,
  // beyond its swept body, instead of putting a tree in that service lane.
  rear: { x: 18, z: -23.5, width: 74, depth: 10, height: 0.3 },
} as const

export type PlantingZone = keyof typeof plantingBeds

export type PlantKind = 'oak' | 'shrub' | 'calathea' | 'fern'

export type Plant = {
  zone: PlantingZone
  kind: PlantKind
  x: number
  z: number
  yaw: number
  scale: number
}

export type PlantPlacement = [number, number, number, number, number]

/** One geometry/height contract shared by rendering and actual-root validation. */
export const vegetationModels = {
  oak: { id: 'naturalTree', height: 5.8 },
  shrub: { id: 'coherentShrub', height: 0.64 },
  calathea: { id: 'coherentCalathea', height: 0.62 },
  fern: { id: 'naturalFern', height: 0.44 },
} as const
export const nearTreeModel = { id: 'naturalTreeDense', height: 5.8 } as const

export function vegetationModel(plant: Pick<Plant, 'kind' | 'zone'>) {
  return plant.kind === 'oak' && plant.zone !== 'rear'
    ? nearTreeModel
    : vegetationModels[plant.kind]
}

const SOIL_INSET = 0.12
export const LANDSCAPE_BASE = -0.03

/** Soil top is also the GLB base: no independent placement height can float. */
export function soilHeight(zone: PlantingZone) {
  return LANDSCAPE_BASE + plantingBeds[zone].height - 0.015
}

type PlantingSurface = {
  material: 'plaster' | 'soil'
  at: [number, number, number]
  size: [number, number, number]
}

/** Hollow planter walls: the soil must be the first surface below a root,
 * rather than a concealed plane underneath a solid concrete box. */
export function plantingSurfaces(zone: PlantingZone): PlantingSurface[] {
  const bed = plantingBeds[zone],
    y = LANDSCAPE_BASE + bed.height / 2

  return [
    ...[-1, 1].flatMap<PlantingSurface>((sign) => [
      {
        material: 'plaster',
        at: [bed.x + sign * (bed.width / 2 - 0.06), y, bed.z],
        size: [0.12, bed.height, bed.depth],
      },
      {
        material: 'plaster',
        at: [bed.x, y, bed.z + sign * (bed.depth / 2 - 0.06)],
        size: [bed.width - 0.24, bed.height, 0.12],
      },
    ]),
    {
      material: 'soil',
      at: [bed.x, soilHeight(zone) - 0.01, bed.z],
      size: [bed.width - 0.24, 0.02, bed.depth - 0.24],
    },
  ]
}

export function isOnSoil(zone: PlantingZone, x: number, z: number, margin = 0) {
  const bed = plantingBeds[zone]

  return (
    Math.abs(x - bed.x) + margin <= bed.width / 2 - SOIL_INSET &&
    Math.abs(z - bed.z) + margin <= bed.depth / 2 - SOIL_INSET
  )
}

/** Reject unsupported roots rather than silently spawning them on paving. */
export function plantPlacement(plant: Plant): PlantPlacement {
  if (!isOnSoil(plant.zone, plant.x, plant.z, plant.kind === 'oak' ? 0.28 : 0.12)) {
    throw new Error(`Plant base outside soil: ${plant.zone} (${plant.x}, ${plant.z})`)
  }

  return [plant.x, soilHeight(plant.zone), plant.z, plant.yaw, plant.scale]
}

/** Stable, staggered drifts. Variations stay within the bed; no random reseeding
 * on render and no movement of functional planter boundaries or circulation. */
function drift(
  zone: PlantingZone,
  kind: PlantKind,
  centres: [number, number][],
  count: number,
  spread: [number, number],
  scale = 1,
): Plant[] {
  return centres.flatMap(([x, z], group) =>
    Array.from({ length: count }, (_, i) => {
      const angle = i * 2.399963 + group * 1.1
      const radius = count === 1 ? 0 : Math.sqrt((i + 0.4) / count)

      return {
        zone,
        kind,
        x: x + Math.cos(angle) * spread[0] * radius,
        z: z + Math.sin(angle) * spread[1] * radius,
        yaw: angle + 0.45,
        scale: scale * (0.88 + ((i * 3 + group * 5) % 9) * 0.025),
      }
    }),
  )
}

const forecourt = plantingBeds.forecourt
export const landscapePlants: Plant[] = [
  ...drift(
    'forecourt',
    'shrub',
    [
      [forecourt.x, forecourt.z - 1.1],
      [forecourt.x, forecourt.z + 1.1],
    ],
    3,
    [0.3, 0.4],
    0.94,
  ),
  ...drift(
    'entranceWest',
    'shrub',
    [
      [-11.4, 12.5],
      [-11.4, 14.4],
    ],
    3,
    [0.3, 0.38],
    0.91,
  ),
  ...drift(
    'forecourt',
    'calathea',
    [
      [forecourt.x, forecourt.z - 2.2],
      [forecourt.x, forecourt.z - 0.05],
      [forecourt.x, forecourt.z + 2.1],
    ],
    5,
    [0.24, 0.4],
    0.94,
  ),
  ...drift(
    'entranceWest',
    'calathea',
    [
      [-11.4, 11.7],
      [-11.4, 13.35],
      [-11.4, 15.15],
    ],
    5,
    [0.23, 0.34],
    0.9,
  ),
  ...drift(
    'loungeRear',
    'shrub',
    [
      [-15.8, 3.25],
      [-14.3, 3.25],
      [-12.4, 3.25],
    ],
    2,
    [0.46, 0.22],
  ),
  ...drift(
    'loungeRear',
    'calathea',
    [
      [-15.4, 3.25],
      [-13.2, 3.25],
    ],
    5,
    [0.3, 0.15],
    0.8,
  ),
  ...drift(
    'loungeWest',
    'shrub',
    [
      [-18.4, 4.3],
      [-18.4, 6],
      [-18.4, 7.8],
      [-18.4, 10.1],
    ],
    2,
    [0.65, 0.45],
  ),
  ...drift(
    'loungeWest',
    'calathea',
    [
      [-17.9, 4.4],
      [-17.9, 6.2],
      [-17.9, 8],
      [-17.9, 10.2],
    ],
    5,
    [0.22, 0.35],
    0.96,
  ),
  // Low-cost fern understory closes visible soil gaps without multiplying the
  // 30k-triangle shrubs or 472k-triangle near trees. Ornamental leaves stay higher.
  ...drift(
    'forecourt',
    'fern',
    [
      [forecourt.x, forecourt.z - 2.5],
      [forecourt.x, forecourt.z - 0.8],
      [forecourt.x, forecourt.z + 0.9],
      [forecourt.x, forecourt.z + 2.5],
    ],
    3,
    [0.25, 0.25],
    0.9,
  ),
  ...drift(
    'entranceWest',
    'fern',
    [
      [-11.4, 11.8],
      [-11.4, 13.1],
      [-11.4, 14.5],
      [-11.4, 15.3],
    ],
    3,
    [0.25, 0.25],
    0.9,
  ),
  ...drift(
    'loungeRear',
    'fern',
    [
      [-16, 3.25],
      [-14.6, 3.25],
      [-13.3, 3.25],
      [-11.7, 3.25],
    ],
    3,
    [0.24, 0.08],
    0.78,
  ),
  ...drift(
    'loungeWest',
    'fern',
    [
      [-18.7, 5],
      [-18.7, 6.9],
      [-18.7, 8.8],
      [-18.7, 10.9],
    ],
    3,
    [0.35, 0.3],
    1.05,
  ),
  ...drift('receptionWest', 'fern', [[-11.6, -3.5]], 3, [0.25, 0.28], 0.72),
  ...drift('receptionRear', 'fern', [[-6, -7.7]], 3, [0.26, 0.2], 0.72),
  ...drift(
    'east',
    'shrub',
    [
      [55.8, -5.5],
      [55.8, -2.2],
      [55.8, 1],
      [55.8, 4.7],
    ],
    3,
    [0.55, 0.55],
  ),
  ...drift(
    'east',
    'fern',
    [
      [55.8, -4.1],
      [55.8, 3.1],
    ],
    3,
    [0.32, 0.3],
    0.8,
  ),
  { zone: 'loungeRear', kind: 'oak', x: -14.5, z: 3.25, yaw: 0.7, scale: 1.04 },
  { zone: 'receptionWest', kind: 'oak', x: -11.6, z: -3.8, yaw: 2.1, scale: 1.02 },
  ...drift(
    'rear',
    'oak',
    [
      [-4, -23],
      [12, -23],
      [34, -23],
    ],
    1,
    [0, 0],
    1.2,
  ),
  ...drift(
    'rear',
    'shrub',
    [
      [-13, -20.2],
      [-7, -20.2],
      [0, -20.2],
      [7, -20.2],
      [14, -20.2],
      [21, -20.2],
      [28, -20.2],
      [35, -20.2],
      [42, -20.2],
      [49, -20.2],
    ],
    1,
    [0, 0],
    1.2,
  ),
]
