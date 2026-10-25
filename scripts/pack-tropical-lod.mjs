import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, weld, simplifyPrimitive, textureCompress, prune } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)

await MeshoptSimplifier.ready
for (const [name, leafRatio, branchRatio, error] of [
  ['islandTree', 0.09, 0.025, 0.003],
  ['islandTreeFar', 0.01, 0.001, 0.05],
]) {
  const doc = await io.read(
    'C:/Projects/Assets/Febles-Refinement-20261023/island_tree_02/island_tree_02.gltf',
  )

  await doc.transform(dedup(), weld())
  for (const m of doc.getRoot().listMeshes())
    for (const p of m.listPrimitives()) {
      const leaf = /leaves/.test(p.getMaterial()?.getName() || '')

      simplifyPrimitive(p, {
        simplifier: MeshoptSimplifier,
        ratio: leaf ? leafRatio : branchRatio,
        error,
      })
      if (leaf)
        p.getMaterial()
          .setAlphaMode('MASK')
          .setAlphaCutoff(0.32)
          .setBaseColorFactor([0.72, 0.92, 0.52, 1])
    }
  await doc.transform(
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 87 }),
  )
  await io.write(`public/models/${name}.glb`, doc)
  console.log(
    name,
    doc
      .getRoot()
      .listMeshes()
      .flatMap((m) =>
        m.listPrimitives().map((p) => ({
          material: p.getMaterial()?.getName(),
          tri: p.getIndices().getCount() / 3,
        })),
      ),
  )
}
