import { Box3, Matrix4, Mesh, Vector3, type Object3D } from 'three'

/** Scale in metres and anchor at the measured stem/root, rather than the centre
 * of an asymmetric crown. The lowest rendered vertex stays on the shared soil. */
export function vegetationFrame(root: Object3D, height: number) {
  root.updateWorldMatrix(true, true)
  const bounds = new Box3().setFromObject(root, true)
  const size = bounds.getSize(new Vector3())
  if (!(size.y > 0 && height > 0)) throw new Error('Vegetation needs a positive measured height')
  const scale = height / size.y
  const base = new Box3()
  const vertex = new Vector3()
  root.traverse(object => {
    if (!(object instanceof Mesh)) return
    const positions = object.geometry.getAttribute('position')
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld)
      if ((vertex.y - bounds.min.y) * scale <= .025) base.expandByPoint(vertex)
    }
  })
  if (base.isEmpty()) throw new Error('Vegetation has no measured root vertices')
  const anchor = base.getCenter(new Vector3())
  anchor.y = bounds.min.y
  const matrix = new Matrix4().makeScale(scale, scale, scale)
    .multiply(new Matrix4().makeTranslation(-anchor.x, -anchor.y, -anchor.z))
  return { matrix, bounds, base, anchor, scale }
}
