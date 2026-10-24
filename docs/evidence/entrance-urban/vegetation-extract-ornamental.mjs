import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune, getBounds, listTextureInfoByMaterial } from '@gltf-transform/functions'
import validator from 'gltf-validator'

// Exact extraction of complete pre-existing professional plant variants.
// No new geometry, simplification, texture edits or active-asset writes.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const candidates = 'C:/Projects/Assets/CarWash-Entrance-Urban-20261023/candidates'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const results = []
for (const [sourceId, selectedName, outputName, officialId] of [
  ['calathea', 'calathea_orbifolia_01_a', 'urbanCalathea-single-v1', 'calathea_orbifolia_01'],
  ['fern', 'fern_02_b', 'urbanFern-single-v1', 'fern_02'],
]) {
  const source = path.join(repository, 'public/models', `${sourceId}.glb`)
  const sourceBytes = await fs.readFile(source)
  const sourceHash = sha256(sourceBytes)
  const destination = path.join(candidates, `${outputName}.glb`)
  try { await fs.access(destination); throw new Error(`Candidate exists: ${destination}`) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  const document = await io.read(source)
  const root = document.getRoot()
  const observedNodes = root.listNodes().map(node => ({ name: node.getName(), translation: node.getTranslation(), bounds: getBounds(node) }))
  const selected = root.listNodes().find(node => node.getName() === selectedName)
  if (!selected?.getMesh()) throw new Error(`Missing complete plant node ${selectedName}`)
  for (const node of root.listNodes()) if (node !== selected) node.dispose()
  selected.setTranslation([0, 0, 0])
  const local = getBounds(selected)
  selected.setTranslation([-(local.min[0] + local.max[0]) / 2, -local.min[1], -(local.min[2] + local.max[2]) / 2])
  await document.transform(prune())
  let uvReferencesValid = true
  const primitives = selected.getMesh().listPrimitives().map(primitive => {
    for (const info of listTextureInfoByMaterial(primitive.getMaterial())) if (!primitive.getAttribute(`TEXCOORD_${info.getTexCoord()}`)) uvReferencesValid = false
    return { triangles: primitive.getIndices().getCount() / 3, vertices: primitive.getAttribute('POSITION').getCount(), semantics: primitive.listSemantics(), material: primitive.getMaterial().getName() }
  })
  if (!uvReferencesValid || root.listSkins().length || root.listAnimations().length) throw new Error('Unexpected UV/rig contract')
  const bytes = await io.writeBinary(document)
  const validation = await validator.validateBytes(bytes, { uri: path.basename(destination), maxIssues: 100 })
  if (validation.issues.numErrors) throw new Error(JSON.stringify(validation.issues))
  await fs.writeFile(destination, bytes, { flag: 'wx' })
  if (sha256(await fs.readFile(source)) !== sourceHash) throw new Error('Source changed during extraction')
  const bounds = getBounds(selected)
  const manifest = {
    observedAt: new Date().toISOString(), source, sourceHash, observedNodes,
    selectedName, destination, sha256: sha256(bytes), bytes: bytes.length,
    sourcePage: `https://polyhaven.com/a/${officialId}`, license: 'CC0-1.0', licenseURL: 'https://polyhaven.com/license',
    authors: { 'Rob Tuytel': 'scanning', 'Rico Cilliers': 'modeling' },
    provenance: 'Existing repository docs/refinement-asset-provenance.json and public/ASSET_LICENSES.txt; no new source download',
    adaptation: 'Retain one complete named source node, its mesh/UV/PBR/texture bytes; remove other sample variants; centre X/Z and place minimum Y at zero',
    primitives, bounds, dimensions: bounds.max.map((value, index) => value - bounds.min[index]),
    textures: root.listTextures().map(texture => ({ name: texture.getName(), mimeType: texture.getMimeType(), sha256: sha256(texture.getImage()), size: texture.getSize() })),
    uvReferencesValid, skins: root.listSkins().length, clips: root.listAnimations().length,
    validation: validation.issues, artisticAcceptance: 'pending entrance runtime inspection',
    command: 'node docs/evidence/entrance-urban/vegetation-extract-ornamental.mjs',
  }
  await fs.writeFile(destination + '.json', JSON.stringify(manifest, null, 2), { flag: 'wx' })
  results.push(manifest)
}
await fs.writeFile(path.join(repository, 'docs/evidence/entrance-urban/vegetation-ornamental-candidates.json'), JSON.stringify(results, null, 2), { flag: 'wx' })
console.log(JSON.stringify(results.map(({ selectedName, destination, bytes, dimensions, primitives, validation }) => ({ selectedName, destination, bytes, dimensions, primitives, errors: validation.numErrors, warnings: validation.numWarnings })), null, 2))
