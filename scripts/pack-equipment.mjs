import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, resample } from '@gltf-transform/functions'
import fs from 'node:fs/promises'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)

for (const [source, target] of [
  ['garden_hose_wall_mounted_01', 'hose'],
  ['tool_cart', 'cart'],
]) {
  const doc = await io.read(`C:/Projects/Assets/Febles-G1-20261023/${source}/${source}.gltf`)

  await doc.transform(dedup(), prune())
  await io.write(`public/models/${target}.glb`, doc)
  console.log('PACKED', target)
}
