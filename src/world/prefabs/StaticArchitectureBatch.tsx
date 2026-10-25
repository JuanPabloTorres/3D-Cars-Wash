import { useEffect, type RefObject } from 'react'
import { Group, Matrix4, Mesh, type Material } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/** One draw per material, retaining authored bevels, normals and metre-scaled UVs.
 * Only static Block meshes participate; interactive props and imported assets keep
 * their ownership. A failed merge leaves its original meshes visible. */
export function batchArchitecture(owner: Group) {
  owner.updateWorldMatrix(true, true)

  const byMaterial = new Map<Material, Mesh[]>()

  owner.traverse((object) => {
    if (
      !(object instanceof Mesh) ||
      object.userData.staticArchitecture !== true ||
      Array.isArray(object.material)
    )
      return

    const objects = byMaterial.get(object.material) || []

    objects.push(object)
    byMaterial.set(object.material, objects)
  })

  const batch = new Group()
  const inverse = new Matrix4().copy(owner.matrixWorld).invert()
  const originals: Array<{ mesh: Mesh; visible: boolean }> = []

  for (const [material, objects] of byMaterial) {
    const parts = objects.map((object) => {
      const geometry = object.geometry.index
        ? object.geometry.toNonIndexed()
        : object.geometry.clone()

      return geometry.applyMatrix4(new Matrix4().multiplyMatrices(inverse, object.matrixWorld))
    })
    const geometry = mergeGeometries(parts, false)

    parts.forEach((part) => part.dispose())
    if (!geometry) continue

    const mesh = new Mesh(geometry, material)

    mesh.castShadow = true
    mesh.receiveShadow = true
    geometry.computeBoundingSphere()
    batch.add(mesh)
    objects.forEach((object) => {
      originals.push({ mesh: object, visible: object.visible })
      object.visible = false
    })
  }
  batch.name = 'static-architecture'
  owner.add(batch)

  return () => {
    owner.remove(batch)
    batch.traverse((object) => {
      if (object instanceof Mesh) object.geometry.dispose()
    })
    originals.forEach(({ mesh, visible }) => {
      mesh.visible = visible
    })
  }
}

export function StaticArchitectureBatch({ root }: { root: RefObject<Group | null> }) {
  useEffect(() => (root.current ? batchArchitecture(root.current) : undefined), [root])

  return null
}
