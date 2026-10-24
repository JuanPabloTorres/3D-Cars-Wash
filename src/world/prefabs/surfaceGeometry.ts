import { BoxGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

/** Metre-sized architectural finish. Thin paint/trim stays flat; bevels never
 * enlarge the envelope used by navigation. UV density stays constant on long slabs. */
export function createBlockGeometry(size: [number, number, number], radius = .045) {
  const [width, height, depth] = size
  const shortest = Math.min(...size)
  const bevel = shortest <= .045 ? 0 : Math.min(radius, shortest * .24)
  const geometry = bevel > 0
    ? new RoundedBoxGeometry(width, height, depth, 2, bevel)
    : new BoxGeometry(width, height, depth)
  const uv = geometry.getAttribute('uv')
  // Box face order: +/-X, +/-Y, +/-Z. Preserve rounded edge mapping,
  // scaling each face to metres instead of stretching the same image over it.
  const faces = [[depth, height], [depth, height], [width, depth], [width, depth], [width, height], [width, height]]
  const verticesPerFace = uv.count / 6
  for (let i = 0; i < uv.count; i++) {
    const [u, v] = faces[Math.floor(i / verticesPerFace)]
    uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v)
  }
  return geometry
}
