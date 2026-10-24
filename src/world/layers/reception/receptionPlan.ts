/** Metres, aligned to the existing 6.9 × 6.1 reception footprint. +Z is public. */
export const receptionPlan = {
  origin: [-6, .14, 1] as [number, number, number],
  width: 6.7, depth: 5.8, height: 3.22,
  counter: { width: 4.4, height: 1.05, depth: .86, z: 1.05 },
  ana: [-6, .14, 1.25] as [number, number, number],
  attention: [-6, 1.78, 6.6] as [number, number, number],
  approach: [-6.6, 1.85, 11] as [number, number, number],
  lookAt: [-6, 1.55, .8] as [number, number, number],
}
