import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { Matrix4, Vector3 } from 'three'
import fs from 'node:fs/promises'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const result = []

for (const root of [
  'docs/evidence/phase03/recovery',
  'C:/Projects/Assets/CarWash-Botany-Connected-20261024',
]) {
  for (const asset of ['warmShadeTree', 'warmShrub']) {
    const doc = await io.read(`${root}/${asset}.glb`),
      wood = [],
      anchors = new Map()

    for (const node of doc.getRoot().listNodes())
      for (const prim of node.getMesh()?.listPrimitives() || []) {
        const pos = prim.getAttribute('POSITION'),
          uv = prim.getAttribute('TEXCOORD_0'),
          matrix = new Matrix4().fromArray(node.getWorldMatrix())
        const leaf = prim.getMaterial()?.getName().startsWith('leaf-')

        for (let i = 0; i < pos.getCount(); i++) {
          const p = new Vector3().fromArray(pos.getElement(i, [])).applyMatrix4(matrix)

          if (!leaf) wood.push(p)
          else if (Math.abs(uv.getElement(i, [])[1] - 1) < 0.00001)
            anchors.set(
              p
                .toArray()
                .map((n) => n.toFixed(5))
                .join(','),
              p,
            )
        }
      }

    const tolerance = 0.02,
      grid = new Map(),
      key = (x, y, z) => `${x},${y},${z}`

    for (const p of wood) {
      const k = key(...p.toArray().map((n) => Math.floor(n / tolerance)))

      if (!grid.has(k)) grid.set(k, [])
      grid.get(k).push(p)
    }

    let unsupported = 0

    for (const p of anchors.values()) {
      const [x, y, z] = p.toArray().map((n) => Math.floor(n / tolerance))
      let supported = false

      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
          for (let dz = -1; dz <= 1; dz++)
            if (
              (grid.get(key(x + dx, y + dy, z + dz)) || []).some(
                (w) => w.distanceTo(p) <= tolerance,
              )
            )
              supported = true
      if (!supported) unsupported++
    }
    result.push({ root, asset, anchors: anchors.size, unsupported, toleranceMetres: tolerance })
  }
}
await fs.writeFile('docs/evidence/phase03/leaf-support.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result))
if (result.slice(2).some((r) => !r.anchors || r.unsupported)) process.exitCode = 1
