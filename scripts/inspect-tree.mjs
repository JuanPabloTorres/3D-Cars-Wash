import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)

for (const f of [
  'public/models/islandTree.glb',
  'public/models/islandTreeFar.glb',
  'C:/Projects/Assets/Febles-Refinement-20261023/island_tree_02/island_tree_02.gltf',
]) {
  const d = await io.read(f)

  console.log(
    f,
    d
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
