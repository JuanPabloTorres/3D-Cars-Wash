import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, simplify, textureCompress } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import fs from 'node:fs/promises'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)

await MeshoptSimplifier.ready
for (const [source, name] of [
  ['potted_plant_04', 'pottedPlant'],
  ['fern_02', 'fern'],
  ['calathea_orbifolia_01', 'calathea'],
  ['island_tree_02', 'islandTree'],
  ['painted_wooden_bench', 'bench'],
]) {
  const doc = await io.read(
    `C:/Projects/Assets/Febles-Refinement-20261023/${source}/${source}.gltf`,
  )

  await doc.transform(
    dedup(),
    weld(),
    simplify({
      simplifier: MeshoptSimplifier,
      ratio: source === 'island_tree_02' ? 0.18 : 0.45,
      error: 0.0007,
    }),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 87 }),
  )
  await io.write(`public/models/${name}.glb`, doc)
  console.log(name, (await fs.stat(`public/models/${name}.glb`)).size)
}
await fs.copyFile(
  'C:/Projects/Assets/Febles-Refinement-20261023/provenance.json',
  'docs/refinement-asset-provenance.json',
)
