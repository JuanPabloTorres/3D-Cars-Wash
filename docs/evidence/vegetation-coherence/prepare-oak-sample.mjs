import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, weld, flatten, join, compactPrimitive, prune, quantize, getBounds } from '@gltf-transform/functions'
import { Color } from 'three'
import validator from 'gltf-validator'

// Adapt one downloaded professional tree. All source leaf/branch triangles are
// retained. Only material grouping, palette and quantized storage are changed.
const source = 'C:/Projects/Assets/CarWash-Vegetation-Coherence-20261023/innerscene-oak/oak-detailed-original.glb'
const output = 'C:/Projects/Assets/CarWash-Vegetation-Coherence-20261023/candidates/coherentOak-sample-v1.glb'
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const sourceBytes = await fs.readFile(source)
try { await fs.access(output); throw new Error('Candidate already exists') } catch (error) { if (error.code !== 'ENOENT') throw error }
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const document = await io.read(source)
const root = document.getRoot()
const sourceTriangles = triangles(root)
await document.transform(dedup(), weld(), flatten(), join())
const foliageNodes = root.listNodes().filter(node => node.getMesh()?.listPrimitives().some(primitive => primitive.getMaterial()?.getName() !== 'bark'))
const entries = []
for (const node of foliageNodes) {
  for (const primitive of node.getMesh().listPrimitives()) {
    if (primitive.getMaterial().getName() === 'bark') throw new Error('Unexpected mixed source foliage/bark node')
    const indices = primitive.getIndices().getArray()
    const count = primitive.getAttribute('POSITION').getCount()
    const parents = Int32Array.from({ length: count }, (_, index) => index)
    function find(vertex) { while (parents[vertex] !== vertex) { parents[vertex] = parents[parents[vertex]]; vertex = parents[vertex] }; return vertex }
    for (let index = 0; index < indices.length; index += 3) { const parent = find(indices[index]); parents[find(indices[index + 1])] = parent; parents[find(indices[index + 2])] = parent }
    const components = new Map()
    for (let index = 0; index < indices.length; index += 3) {
      const parent = find(indices[index])
      if (!components.has(parent)) components.set(parent, [])
      components.get(parent).push(indices[index], indices[index + 1], indices[index + 2])
    }
    for (const component of components.values()) entries.push({ primitive, indices: component, hash: Math.imul(entries.length + 1, 2654435761) >>> 0 })
  }
}
if (entries.length !== 9450) throw new Error(`Expected all 9450 complete source leaves, found ${entries.length}`)
entries.sort((a, b) => a.hash - b.hash)
const palette = [{ name: 'foliage-medium', srgb: '#46733A', fraction: .6 }, { name: 'foliage-deep', srgb: '#24452C', fraction: .3 }, { name: 'foliage-light', srgb: '#76A449', fraction: .1 }]
let offset = 0
for (const item of palette) {
  const count = Math.round(entries.length * item.fraction)
  const selected = entries.slice(offset, offset + count)
  offset += count
  const byPrimitive = new Map()
  for (const entry of selected) { if (!byPrimitive.has(entry.primitive)) byPrimitive.set(entry.primitive, []); byPrimitive.get(entry.primitive).push(...entry.indices) }
  const material = document.createMaterial(item.name).setBaseColorFactor([...new Color(item.srgb).toArray(), 1]).setMetallicFactor(0).setRoughnessFactor(.58).setDoubleSided(true).setAlphaMode('OPAQUE')
  const mesh = document.createMesh(item.name)
  for (const [original, indices] of byPrimitive) {
    const primitive = document.createPrimitive().setMaterial(material)
    for (const semantic of original.listSemantics()) primitive.setAttribute(semantic, original.getAttribute(semantic))
    primitive.setIndices(document.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)))
    compactPrimitive(primitive)
    mesh.addPrimitive(primitive)
  }
  root.listScenes()[0].addChild(document.createNode(item.name).setMesh(mesh))
  item.leafCount = count
}
for (const node of foliageNodes) node.dispose()
for (const material of root.listMaterials()) if (material.getName() === 'bark') material.setRoughnessFactor(.84)
await document.transform(join(), prune(), quantize({ quantizePosition: 14, quantizeNormal: 10 }))
const finalTriangles = triangles(root)
if (finalTriangles !== sourceTriangles) throw new Error('Source leaf/branch triangle preservation failed')
const bytes = await io.writeBinary(document)
const validation = await validator.validateBytes(bytes, { uri: path.basename(output), maxIssues: 100 })
if (validation.issues.numErrors) throw new Error(JSON.stringify(validation.issues))
await fs.mkdir(path.dirname(output), { recursive: true })
await fs.writeFile(output, bytes, { flag: 'wx' })
if (hash(await fs.readFile(source)) !== hash(sourceBytes)) throw new Error('Source changed')
const bounds = getBounds(root.listScenes()[0])
const manifest = { observedAt: new Date().toISOString(), source, sourceSha256: hash(sourceBytes), sourceBytes: sourceBytes.length, sourcePage: 'https://www.innerscene.com/tools/library/3d-parts/oak-street-tree-detailed-leaves-a273fef9', sourceDownload: 'https://www.innerscene.com/api/library/oak-street-tree-detailed-leaves-a273fef9/download', author: 'Innerscene - original model', license: 'CC0-1.0', licenseURL: 'https://www.innerscene.com/tools/library/terms', output, sha256: hash(bytes), bytes: bytes.length, triangles: finalTriangles, sourceTriangles, leafCount: entries.length, palette, materialCount: root.listMaterials().length, nodes: root.listNodes().map(node => node.getName()), bounds, dimensions: bounds.max.map((value, index) => value - bounds.min[index]), textures: root.listTextures().length, skins: root.listSkins().length, clips: root.listAnimations().length, validation: validation.issues, adaptation: 'Preserve every original leaf/branch triangle and silhouette; merge hundreds of bark nodes by material; scatter complete original leaves across requested 60/30/10 untextured palette; foliage roughness .58 and bark .84; quantize positions/normals. No new organic geometry.', limitations: 'Original is an architectural procedural tree with geometry leaves and no texture/UV maps; less photoreal than scanned bark; human visual acceptance pending.', command: 'node docs/evidence/vegetation-coherence/prepare-oak-sample.mjs' }
await fs.writeFile(output + '.json', JSON.stringify(manifest, null, 2), { flag: 'wx' })
await fs.writeFile('docs/evidence/vegetation-coherence/oak-sample-candidate.json', JSON.stringify(manifest, null, 2), { flag: 'wx' })
console.log(JSON.stringify(manifest, null, 2))

function triangles(root) { return root.listMeshes().reduce((sum, mesh) => sum + mesh.listPrimitives().reduce((count, primitive) => count + primitive.getIndices().getCount() / 3, 0), 0) }
