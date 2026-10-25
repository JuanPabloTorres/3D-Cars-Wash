import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune, dedup, weld, simplify, join, textureCompress } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS),
  car = await io.read('C:/Projects/Assets/Febles-G1-20261023/car-concept.glb')
const materials = car.getRoot().listMaterials()

for (const mesh of car.getRoot().listMeshes())
  for (const p of mesh.listPrimitives()) {
    const m = p.getMaterial()

    if (m) {
      const pearl = materials.find((a) => a.getName() === m.getName().replace('Carmine', 'Pearl'))

      if (pearl) p.setMaterial(pearl)
    }
  }
for (const n of car.getRoot().listNodes()) if (n.getName() === 'License Plate') n.dispose()
for (const e of car.getRoot().listExtensionsUsed())
  if (
    [
      'KHR_materials_variants',
      'KHR_materials_iridescence',
      'KHR_materials_transmission',
      'KHR_materials_clearcoat',
    ].includes(e.extensionName)
  )
    e.dispose()
await MeshoptSimplifier.ready
await car.transform(
  prune(),
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.3, error: 0.001 }),
  join({
    filter: (node) => {
      for (let n = node; n; n = n.getParentNode())
        if (/^Wheel(Front|Rear)/.test(n.getName())) return false

      return true
    },
  }),
  textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [1024, 1024], quality: 88 }),
)
await io.write('public/models/vehicle.glb', car)
console.log('Professional source repacked with four wheel assemblies retained.')
