import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, resample } from '@gltf-transform/functions'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const source = 'C:/Projects/Assets/Febles-G1-20261023'

for (const [file, target] of [
  ['nature/Models/GLTF format/tree_palmDetailedTall.glb', 'palm'],
  ['nature/Models/GLTF format/plant_bushDetailed.glb', 'shrub'],
  ['nature/Models/GLTF format/plant_flatTall.glb', 'plant'],
]) {
  const doc = await io.read(`${source}/${file}`)

  await doc.transform(dedup(), prune())
  await io.write(`public/models/${target}.glb`, doc)
  console.log('SELF_CONTAINED', target)
}
for (const target of ['worker', 'receptionist']) {
  const doc = await io.read(`public/models/${target}.glb`)

  await doc.transform(resample(), dedup(), prune())
  await io.write(`public/models/${target}.glb`, doc)
  console.log(
    'OPTIMIZED',
    target,
    doc
      .getRoot()
      .listAnimations()
      .map((a) => a.getName()),
  )
}
