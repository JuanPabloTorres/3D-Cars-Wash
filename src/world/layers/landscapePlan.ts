import { plantingBeds, type PlantPlacement } from '../siteLandscape'

/** Layer 02 uses only retained beds. Ground construction geometry is immutable. */
export const landscapeBeds = Object.entries(plantingBeds).filter(([id]) => id !== 'receptionWest' && id !== 'receptionRear')
export const landscapeGroups = {
  trees: true, palms: true, shrubs: true, accents: true,
  planterFill: true, groundCover: true, lights: true,
} as const

/** Same species and finish at both depths: distance changes scale/detail only. */
export const landscapeAssets = {
  tree: { url: '/models/layer02/warmShadeTree.glb', height: 7.2 },
  palm: { url: '/models/layer02/warmPalm.glb', height: 9 },
  shrub: { url: '/models/layer02/warmShrub.glb', height: .85 },
  accent: { url: '/models/layer02/warmBroadleaf.glb', height: .86 },
  fern: { url: '/models/layer02/warmGroundcover.glb', height: .14 },
} as const

// Roots sit exactly on GroundLayer's existing soil top (height - .045 m).
export const trees: PlantPlacement[] = [
  [-18.4, .355, 5.2, .6, 1],
  [-13, .255, -24, 1.8, 1.1], [1, .255, -23, .4, .95],
  [22, .255, -24, 2.6, 1.18], [42, .255, -23.5, 4.2, 1.06],
  [55.8, .255, -2.5, 2.1, .9],
]
export const palms: PlantPlacement[] = [
  [-18, .255, -24.5, 1.8, 1.08], [11, .255, -25, .6, .95],
  [50, .255, -24.5, 3.1, 1.12],
]

/** Staggered masses; keep full low foliage inside the rounded planter inset.
 * Bounds reserve room for the new Blender foliage silhouettes. */
function fillBeds(kind: 'shrub' | 'accent' | 'fern'): PlantPlacement[] {
  return landscapeBeds.flatMap(([id, bed], bedIndex) => {
    const rear = id === 'rear'
    const longX = bed.width > bed.depth
    const length = longX ? bed.width : bed.depth
    const short = longX ? bed.depth : bed.width
    const spacing = kind === 'shrub' ? (rear ? 1.65 : .85) : kind === 'accent' ? 1.05 : .72
    const count = Math.max(1, Math.floor((length - .9) / spacing))
    const rows = kind === 'shrub' && short > 2.2 ? 2 : 1
    return Array.from({ length: count * rows }, (_, i): PlantPlacement => {
      const n = i % count, row = Math.floor(i / count)
      const along = (n - (count - 1) / 2) * spacing + (row === 1 ? .18 : 0)
      const across = rear ? (kind === 'shrub' ? -1.7 + row * 3 : kind === 'accent' ? 3.4 : 4.05) :
        (rows === 2 ? (row === 0 ? -.48 : .48) : kind === 'accent' ? .12 : kind === 'fern' ? -.15 : 0)
      const jitter = Math.sin(i * 2.4 + bedIndex) * .09
      const x = bed.x + (longX ? along : across + jitter)
      const z = bed.z + (longX ? across + jitter : along)
      const scale = (kind === 'shrub' && rear ? 1.35 : 1) * (.85 + ((n * 5 + bedIndex * 3) % 7) * .035)
      // All compact beds are >=1.4 m wide; cap leaf spread to their interior.
      const radius = kind === 'shrub' ? .8 : kind === 'accent' ? .9 : .4
      const fit = Math.min(scale, (short / 2 - .25 - Math.abs(across + jitter)) / radius)
      return [x, bed.height - .045, z, i * 2.399 + bedIndex * .75, fit]
    })
  })
}
export const shrubs = fillBeds('shrub')
export const accents = fillBeds('accent')
export const groundCover = fillBeds('fern')
export const landscapeLights: [number, number, number][] = [
  [-11.4, .255, 11.5], [-11.4, .255, 15.4], [plantingBeds.forecourt.x, .255, plantingBeds.forecourt.z-2.3],
  [plantingBeds.forecourt.x, .255, plantingBeds.forecourt.z+2.4], [-17.8, .355, 9.2], [55.3, .255, 1.8],
]

// Supported by retained soil, with heads pointing inward toward useful routes.
// The fourth coordinate is yaw; no fixture base occupies pedestrian/car paving.
export const landscapePoles = [
  { id: 'waiting-walk', position: [-19.1, .355, 10.2], yaw: Math.PI / 2 },
  { id: 'delivery-approach', position: [56.3, .255, 5.2], yaw: -Math.PI / 2 },
] as const
