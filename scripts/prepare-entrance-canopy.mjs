import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import {
  dedup,
  weld,
  simplifyPrimitive,
  textureCompress,
  prune,
  quantize,
} from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import validator from 'gltf-validator'
import sharp from 'sharp'

// Isolated candidate only. This script never replaces existing public models.
const source = process.argv[2]
const output = process.argv[3]

if (!source || !output)
  throw new Error('Usage: node prepare-entrance-canopy.mjs <source.gltf> <new-candidate.glb>')

const destination = path.resolve(output)

if (destination.startsWith(path.resolve('public') + path.sep))
  throw new Error('Choose a staging directory outside public')
try {
  await fs.access(destination)
  throw new Error('Candidate already exists; choose another attempt')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
await MeshoptSimplifier.ready

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const document = await io.read(source)

await document.transform(dedup(), weld())
for (const mesh of document.getRoot().listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    const leaf = /leaves/.test(primitive.getMaterial()?.getName() || '')

    simplifyPrimitive(primitive, {
      simplifier: MeshoptSimplifier,
      ratio: leaf ? 0.3 : 0.025,
      error: leaf ? 0.0005 : 0.003,
    })
    if (leaf)
      primitive
        .getMaterial()
        .setAlphaMode('MASK')
        .setAlphaCutoff(0.24)
        .setBaseColorFactor([1, 1, 1, 1])
  }
}
await document.transform(
  prune(),
  quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 87 }),
)

const bytes = await io.writeBinary(document)
const report = await validator.validateBytes(bytes, {
  uri: path.basename(destination),
  maxIssues: 100,
})

if (report.issues.numErrors) throw new Error(JSON.stringify(report.issues))
await fs.mkdir(path.dirname(destination), { recursive: true })
await fs.writeFile(destination, bytes, { flag: 'wx' })

const metadata = {
  source,
  sourceHash: crypto
    .createHash('sha256')
    .update(await fs.readFile(source))
    .digest('hex'),
  sourceLicense: 'CC0; Poly Haven island_tree_02; see public/ASSET_LICENSES.txt',
  sourceAuthorRecord: 'docs/refinement-asset-provenance.json',
  output: destination,
  sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  bytes: bytes.length,
  triangles: document
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() || 0) / 3, 0),
  adaptation: 'Preserve 30% foliage, 2.5% woody geometry; portable 1K PBR; original unchanged',
  validation: report.issues,
  artisticAcceptance: 'pending browser comparison',
}

await fs.writeFile(destination + '.json', JSON.stringify(metadata, null, 2), { flag: 'wx' })
console.log(
  JSON.stringify({
    candidate: destination,
    triangles: metadata.triangles,
    bytes: bytes.length,
    errors: report.issues.numErrors,
    warnings: report.issues.numWarnings,
  }),
)
