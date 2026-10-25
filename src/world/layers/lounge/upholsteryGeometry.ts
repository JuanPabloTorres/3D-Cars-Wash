import { BufferGeometry, Float32BufferAttribute } from 'three'

/** Puffed textile form with continuous normals and UVs, rather than a rigid box.
 * Dimensions are metres. Exponents control the softened seams and broad faces. */
export function upholsteryGeometry(width: number, height: number, depth: number) {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = []
  const rings = 24,
    segments = 48,
    power = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e)

  for (let y = 0; y <= rings; y++) {
    const latitude = -Math.PI / 2 + (y / rings) * Math.PI

    for (let x = 0; x <= segments; x++) {
      const longitude = (x / segments) * Math.PI * 2,
        radial = power(Math.cos(latitude), 0.52)

      positions.push(
        (width / 2) * radial * power(Math.cos(longitude), 0.38),
        (height / 2) * power(Math.sin(latitude), 0.52),
        (depth / 2) * radial * power(Math.sin(longitude), 0.38),
      )
      uvs.push(x / segments, y / rings)
      if (y < rings && x < segments) {
        const a = y * (segments + 1) + x,
          b = a + segments + 1

        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  }

  const geometry = new BufferGeometry()

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}
