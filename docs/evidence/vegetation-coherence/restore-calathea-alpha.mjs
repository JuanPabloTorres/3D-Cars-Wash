import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import sharp from 'sharp'
import validator from 'gltf-validator'

const source = 'public/models/urbanCalathea.glb'
const sourceRoot = 'C:/Projects/Assets/CarWash-Vegetation-Coherence-20261023/calathea-alpha'
const output = 'C:/Projects/Assets/CarWash-Vegetation-Coherence-20261023/candidates/coherentCalathea-alpha-v1.glb'
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
try { await fs.access(output); throw new Error('Candidate already exists') } catch (error) { if (error.code !== 'ENOENT') throw error }
await fs.mkdir(sourceRoot, { recursive: true })
const apiResponse = await fetch('https://api.polyhaven.com/files/calathea_orbifolia_01')
if (!apiResponse.ok) throw new Error('Official source API unavailable')
const files = await apiResponse.json()
const alphaEntry = files.Alpha['1k'].png
const alphaPath = path.join(sourceRoot, 'calathea_orbifolia_01_alpha_1k.png')
try { await fs.access(alphaPath); throw new Error('Source already exists; do not overwrite') } catch (error) { if (error.code !== 'ENOENT') throw error }
const response = await fetch(alphaEntry.url)
if (!response.ok) throw new Error('Official alpha unavailable')
const alphaBytes = Buffer.from(await response.arrayBuffer())
if (crypto.createHash('md5').update(alphaBytes).digest('hex') !== alphaEntry.md5) throw new Error('Official mask MD5 mismatch')
await fs.writeFile(alphaPath, alphaBytes, { flag: 'wx' })
await fs.writeFile(path.join(sourceRoot, 'api-files.json'), JSON.stringify(files, null, 2), { flag: 'wx' })
const sourceBytes = await fs.readFile(source)
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const document = await io.read(source)
const root = document.getRoot()
const preservation = root.listMeshes().flatMap(mesh => mesh.listPrimitives()).map(primitive => ({ material: primitive.getMaterial().getName(), indices: sha256(primitive.getIndices().getArray()), attributes: Object.fromEntries(primitive.listSemantics().map(name => [name, sha256(primitive.getAttribute(name).getArray())])) }))
const otherTextures = root.listTextures().filter(texture => !root.listMaterials().some(material => material.getBaseColorTexture() === texture)).map(texture => ({ name: texture.getName(), sha256: sha256(texture.getImage()) }))
const alpha = await sharp(alphaBytes).removeAlpha().extractChannel(0).raw({ depth: 'uchar' }).toBuffer()
const alphaChecks = []
for (const material of root.listMaterials()) {
  const texture = material.getBaseColorTexture()
  const rgb = await sharp(texture.getImage()).removeAlpha().raw({ depth: 'uchar' }).toBuffer()
  const rgba = await sharp(rgb, { raw: { width: 1024, height: 1024, channels: 3 } }).joinChannel(alpha, { raw: { width: 1024, height: 1024, channels: 1 } }).webp({ quality: 90 }).toBuffer()
  const metadata = await sharp(rgba).metadata()
  if (!metadata.hasAlpha) throw new Error('Alpha disappeared')
  const actualAlpha = await sharp(rgba).extractChannel(3).raw().toBuffer()
  let transparent = 0
  for (const value of actualAlpha) if (value < 128) transparent++
  if (!transparent || transparent === actualAlpha.length) throw new Error('Empty/opaque official mask')
  texture.setImage(rgba).setMimeType('image/webp')
  material.setAlphaMode('MASK').setAlphaCutoff(.5)
  alphaChecks.push({ material: material.getName(), hasAlpha: true, transparentPixels: transparent, visiblePixels: actualAlpha.length - transparent })
}
const bytes = await io.writeBinary(document)
const validation = await validator.validateBytes(bytes, { uri: path.basename(output), maxIssues: 100 })
if (validation.issues.numErrors) throw new Error(JSON.stringify(validation.issues))
await fs.writeFile(output, bytes, { flag: 'wx' })
const manifest = { observedAt: new Date().toISOString(), source: path.resolve(source), sourceSha256: sha256(sourceBytes), sourceUnchanged: sha256(await fs.readFile(source)) === sha256(sourceBytes), sourcePage: 'https://polyhaven.com/a/calathea_orbifolia_01', authors: ['Rob Tuytel', 'Rico Cilliers'], license: 'CC0-1.0', licenseURL: 'https://polyhaven.com/license', alphaSource: { ...alphaEntry, path: alphaPath, sha256: sha256(alphaBytes) }, output, sha256: sha256(bytes), bytes: bytes.length, triangles: root.listMeshes().flatMap(mesh => mesh.listPrimitives()).reduce((sum, primitive) => sum + primitive.getIndices().getCount() / 3, 0), preservation, otherTextures, alphaChecks, validation: validation.issues, adaptation: 'Only restore official alpha in the existing baseColor texture; geometry, UV, PBR scalar factors, normal/roughness maps and source materials remain unchanged; no palette tint applied to texture.', command: 'node docs/evidence/vegetation-coherence/restore-calathea-alpha.mjs', artisticAcceptance: 'pending same-light sample and integrator review' }
await fs.writeFile(output + '.json', JSON.stringify(manifest, null, 2), { flag: 'wx' })
await fs.writeFile('docs/evidence/vegetation-coherence/calathea-alpha-candidate.json', JSON.stringify(manifest, null, 2), { flag: 'wx' })
console.log(JSON.stringify({ output, bytes: bytes.length, triangles: manifest.triangles, sourceUnchanged: manifest.sourceUnchanged, alphaChecks, errors: validation.issues.numErrors, warnings: validation.issues.numWarnings }, null, 2))
