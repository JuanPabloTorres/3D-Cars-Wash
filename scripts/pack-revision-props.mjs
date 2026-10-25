import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { flatten, join, dedup, prune, textureCompress } from '@gltf-transform/functions'
import sharp from 'sharp'
import fs from 'node:fs/promises'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS),
  base = 'C:/Projects/Assets/Febles-Visual-Revision-20261023/innerscene'
const manifest = []

for (const [source, target, filter] of [
  ['tropicalPalm', 'tropicalPalm', null],
  ['datePalm', 'datePalm', null],
  ['areca', 'areca', null],
  ['sander', 'sander', null],
  ['vacuum', 'vacuum', null],
  ['sprayer', 'sprayer', null],
  ['sprayer', 'sprayWand', /Docked spray wand|Spray wand hand grip/],
  ['vacuum', 'vacuumNozzle', /Rigid hose nozzle/],
]) {
  const d = await io.read(`${base}/${source}.glb`)

  if (filter) {
    for (const node of d.getRoot().listNodes())
      if (node.getMesh() && !filter.test(node.getName())) node.setMesh(null)
    await d.transform(prune())
  }
  await d.transform(
    flatten(),
    dedup(),
    join(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024] }),
  )

  const file = `public/models/${target}.glb`

  await io.write(file, d)
  manifest.push({
    source,
    target,
    primitives: d
      .getRoot()
      .listMeshes()
      .reduce((n, m) => n + m.listPrimitives().length, 0),
    bytes: (await fs.stat(file)).size,
  })
}
await fs.writeFile(
  'docs/evidence/visual-revision/asset-review/props.json',
  JSON.stringify(manifest, null, 2),
)
console.log(manifest)
