import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, weld, simplifyPrimitive, compactPrimitive, join, prune, quantize, textureCompress, getBounds } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import validator from 'gltf-validator'
import sharp from 'sharp'

// Isolated staging pipeline. Originals and existing candidates are immutable;
// active public assets must be promoted separately by the integrator.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [assetId, sourceArgument, outputArgument, ...flags] = process.argv.slice(2)
const recipes = {
  tree_small_02: { alphaKey: 'leaves_alpha', leafMaterial: /leaves/, foliageRatio: .08, woodyRatio: .12, error: .003 },
  jacaranda_tree: { alphaKey: 'leaves_alpha', leafMaterial: /leaves/, foliageRatio: .08, woodyRatio: .12, error: .003 },
  shrub_01: { alphaKey: 'Alpha', leafMaterial: /shrub_01/, foliageRatio: .2, woodyRatio: .4, error: .0015 },
}
if (!recipes[assetId] || !sourceArgument || !outputArgument) {
  throw new Error('Usage: node scripts/prepare-urban-vegetation.mjs <tree_small_02|jacaranda_tree|shrub_01> <external-source-root> <new-external-candidate.glb> [--far] [--preview] [--coherence]')
}
const sourceRoot = path.resolve(sourceArgument, assetId)
const output = path.resolve(outputArgument)
for (const destination of [sourceRoot, output]) {
  const compared = process.platform === 'win32' ? destination.toLowerCase() : destination
  const repositoryCompared = process.platform === 'win32' ? repository.toLowerCase() : repository
  if (compared === repositoryCompared || compared.startsWith(repositoryCompared + path.sep)) throw new Error('Sources and candidates must remain outside the repository')
}
await assertAbsent(output)
const startedAt = new Date().toISOString()
const far = flags.includes('--far') && assetId === 'tree_small_02'
const recipe = { ...recipes[assetId], ...(far ? { foliageRatio: .012, woodyRatio: .025, error: .025 } : {}) }
const sourceFiles = await downloadSource()
await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const document = await io.read(path.join(sourceRoot, `${assetId}_1k.gltf`))
const original = inspect(document)
if (original.skins || original.animations) throw new Error('Expected static vegetation without rigs or clips')
await document.transform(dedup(), weld())
const primitives = []
for (const mesh of document.getRoot().listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    const material = primitive.getMaterial()
    const foliage = recipe.leafMaterial.test(material?.getName() ?? '')
    if (assetId === 'tree_small_02') {
      // The source duplicates UV sets. Retain precisely the set referenced by
      // each material, including branch KHR_texture_transform on TEXCOORD_1.
      primitive.setAttribute(/branches/.test(material.getName()) ? 'TEXCOORD_0' : 'TEXCOORD_1', null)
    }
    const before = primitiveStats(primitive)
    simplifyPrimitive(primitive, {
      simplifier: foliage ? protectedFoliageSimplifier(primitive) : MeshoptSimplifier,
      ratio: foliage ? recipe.foliageRatio : recipe.woodyRatio,
      error: recipe.error,
    })
    const after = primitiveStats(primitive)
    // Disconnected foliage islands must survive. Triangle count alone cannot
    // distinguish reduced leaf tessellation from a stripped crown.
    if (foliage && after.components < before.components * .99) {
      throw new Error(`Foliage island loss: ${before.components} -> ${after.components}`)
    }
    primitives.push({ material: material?.getName(), foliage, before, after })
  }
}
await restoreOfficialAlpha(document, sourceFiles.alpha.path)
if (assetId === 'shrub_01') { clusterShrubVariants(document); await document.transform(join()) }
await document.transform(prune(), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 90 }))
const alphaValidation = await verifyFoliageAlpha(document)
const optimized = inspect(document)
const bytes = await io.writeBinary(document)
const validation = await validator.validateBytes(bytes, { uri: path.basename(output), maxIssues: 100 })
if (validation.issues.numErrors) throw new Error(JSON.stringify(validation.issues))
await fs.mkdir(path.dirname(output), { recursive: true })
await fs.writeFile(output, bytes, { flag: 'wx' })
const manifest = {
  startedAt, finishedAt: new Date().toISOString(),
  assetId, sourcePage: `https://polyhaven.com/a/${assetId}`,
  author: Object.keys(sourceFiles.info.authors), license: 'CC0-1.0', licenseURL: 'https://polyhaven.com/license',
  output, sha256: digest(bytes, 'sha256'), bytes: bytes.length,
  sources: sourceFiles.records,
  original, optimized, primitives,
  alphaValidation,
  adaptation: { ...recipe, far, leafMaterial: recipe.leafMaterial.source, alpha: 'Official separate alpha map combined with diffuse; alpha MASK 0.5, original UVs and texture transforms retained', geometry: `Tree: lock ${far ? 'longest-axis endpoints and maximum leaf width' : 'all six axis extrema'} per disconnected foliage island, then simplify with UV-aware meshoptimizer; >=99% disconnected foliage islands required; no foliage primitive removed. Shrub: nine source variants clustered in a 3x3 footprint; no invented geometry.`, textures: '1K WebP PBR embedded', units: 'metres; glTF Y-up; tree source transform preserved; shrub source variants repositioned' },
  validation: validation.issues,
  versions: { node: process.version, gltfTransform: JSON.parse(await fs.readFile(path.join(repository, 'node_modules/@gltf-transform/core/package.json'), 'utf8')).version, sharp: sharp.versions.sharp },
  command: `node scripts/prepare-urban-vegetation.mjs ${process.argv.slice(2).map(value => JSON.stringify(value)).join(' ')}`,
  artisticAcceptance: 'pending full entrance comparison and human review',
}
if (flags.includes('--preview')) manifest.preview = await renderPreviews(output)
await fs.writeFile(output + '.json', JSON.stringify(manifest, null, 2), { flag: 'wx' })
console.log(JSON.stringify({ output, triangles: optimized.triangles, bytes: bytes.length, bounds: optimized.bounds, errors: validation.issues.numErrors, warnings: validation.issues.numWarnings, preview: manifest.preview }, null, 2))

function digest(bytes, algorithm) { return crypto.createHash(algorithm).update(bytes).digest('hex') }

async function assertAbsent(destination) {
  try { await fs.access(destination) } catch (error) { if (error.code === 'ENOENT') return; throw error }
  throw new Error(`Destination already exists: ${destination}`)
}

async function fetchJSON(url, destination) {
  try { return JSON.parse(await fs.readFile(destination, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status}: ${url}`)
  const data = await response.json()
  await fs.writeFile(destination, JSON.stringify(data, null, 2), { flag: 'wx' })
  return data
}

async function downloadFile(entry, destination) {
  let bytes
  try { bytes = await fs.readFile(destination) } catch (error) {
    if (error.code !== 'ENOENT') throw error
    const response = await fetch(entry.url)
    if (!response.ok) throw new Error(`${response.status}: ${entry.url}`)
    bytes = Buffer.from(await response.arrayBuffer())
    if (digest(bytes, 'md5') !== entry.md5) throw new Error(`Download MD5 mismatch: ${entry.url}`)
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.writeFile(destination, bytes, { flag: 'wx' })
  }
  if (digest(bytes, 'md5') !== entry.md5) throw new Error(`Cached source MD5 mismatch: ${destination}`)
  return { path: destination, url: entry.url, md5: entry.md5, sha256: digest(bytes, 'sha256'), bytes: bytes.length }
}

async function downloadSource() {
  await fs.mkdir(sourceRoot, { recursive: true })
  const info = await fetchJSON(`https://api.polyhaven.com/info/${assetId}`, path.join(sourceRoot, 'api-info.json'))
  const files = await fetchJSON(`https://api.polyhaven.com/files/${assetId}`, path.join(sourceRoot, 'api-files.json'))
  const descriptor = files.gltf['1k'].gltf
  const records = [await downloadFile(descriptor, path.join(sourceRoot, `${assetId}_1k.gltf`))]
  // Bounded sequential requests avoid bulk concurrency against the public API.
  for (const [relative, entry] of Object.entries(descriptor.include)) records.push(await downloadFile(entry, path.join(sourceRoot, relative)))
  const alpha = await downloadFile(files[recipe.alphaKey]['1k'].png, path.join(sourceRoot, 'textures', `${assetId}_official-alpha_1k.png`))
  records.push(alpha)
  return { records, info, alpha }
}

async function restoreOfficialAlpha(document, alphaPath) {
  const alpha = await sharp(alphaPath).removeAlpha().extractChannel(0).raw({ depth: 'uchar' }).toBuffer()
  for (const material of document.getRoot().listMaterials()) {
    if (!recipe.leafMaterial.test(material.getName())) continue
    const texture = material.getBaseColorTexture()
    if (!texture) throw new Error(`Missing diffuse: ${material.getName()}`)
    // Sharp schedules removeAlpha after joinChannel regardless of call order.
    // Materialize RGB first so the subsequently joined official mask survives.
    const rgb = await sharp(texture.getImage()).removeAlpha().raw({ depth: 'uchar' }).toBuffer()
    const rgba = await sharp(rgb, { raw: { width: 1024, height: 1024, channels: 3 } }).joinChannel(alpha, { raw: { width: 1024, height: 1024, channels: 1 } }).png().toBuffer()
    texture.setImage(rgba).setMimeType('image/png')
    material.setAlphaMode('MASK').setAlphaCutoff(.5)
  }
}

async function verifyFoliageAlpha(document) {
  const results = []
  for (const material of document.getRoot().listMaterials()) {
    if (!recipe.leafMaterial.test(material.getName())) continue
    const texture = material.getBaseColorTexture()
    const metadata = await sharp(texture.getImage()).metadata()
    if (!metadata.hasAlpha) throw new Error(`Foliage alpha lost after compression: ${material.getName()}`)
    const alpha = await sharp(texture.getImage()).extractChannel(3).raw({ depth: 'uchar' }).toBuffer()
    let transparent = 0, visible = 0
    for (const value of alpha) { if (value < 128) transparent++; else visible++ }
    if (!transparent || !visible) throw new Error(`Invalid foliage mask: ${material.getName()}`)
    results.push({ material: material.getName(), hasAlpha: true, transparentPixels: transparent, visiblePixels: visible, threshold: 128 })
  }
  return results
}

function primitiveStats(primitive) {
  const indices = primitive.getIndices()?.getArray()
  const count = primitive.getAttribute('POSITION').getCount()
  const parents = new Int32Array(count).fill(-1)
  function find(value) {
    let root = value
    while (parents[root] !== root) root = parents[root]
    while (parents[value] !== value) { const next = parents[value]; parents[value] = root; value = next }
    return root
  }
  function unite(a, b) { const ar = find(a); const br = find(b); if (ar !== br) parents[br] = ar }
  for (let i = 0; i < indices.length; i++) if (parents[indices[i]] === -1) parents[indices[i]] = indices[i]
  for (let i = 0; i < indices.length; i += 3) { unite(indices[i], indices[i + 1]); unite(indices[i], indices[i + 2]) }
  let components = 0
  for (let i = 0; i < count; i++) if (parents[i] === i) components++
  return { triangles: indices.length / 3, vertices: count, components, uv: primitive.listSemantics().filter(value => value.startsWith('TEXCOORD')) }
}

/** Lock each leaf island's silhouette extrema so no island can collapse away. */
function protectedFoliageSimplifier(primitive) {
  const uv = primitive.getAttribute('TEXCOORD_0').getArray()
  return { simplify(indices, positions, stride, target, error, flags) {
    const count = positions.length / stride
    const parents = Int32Array.from({ length: count }, (_, index) => index)
    function find(value) {
      while (parents[value] !== value) { parents[value] = parents[parents[value]]; value = parents[value] }
      return value
    }
    for (let i = 0; i < indices.length; i += 3) {
      const root = find(indices[i])
      parents[find(indices[i + 1])] = root
      parents[find(indices[i + 2])] = root
    }
    const extrema = new Map()
    for (const vertex of indices) {
      const root = find(vertex)
      let limits = extrema.get(root)
      if (!limits) { limits = [vertex, vertex, vertex, vertex, vertex, vertex]; extrema.set(root, limits) }
      for (let axis = 0; axis < 3; axis++) {
        if (positions[vertex * 3 + axis] < positions[limits[axis * 2] * 3 + axis]) limits[axis * 2] = vertex
        if (positions[vertex * 3 + axis] > positions[limits[axis * 2 + 1] * 3 + axis]) limits[axis * 2 + 1] = vertex
      }
    }
    const locks = new Uint8Array(count)
    if (far) {
      const anchors = new Map()
      for (const [root, limits] of extrema) {
        let axis = 0
        for (let candidate = 1; candidate < 3; candidate++) if (positions[limits[candidate * 2 + 1] * 3 + candidate] - positions[limits[candidate * 2] * 3 + candidate] > positions[limits[axis * 2 + 1] * 3 + axis] - positions[limits[axis * 2] * 3 + axis]) axis = candidate
        const a = limits[axis * 2], b = limits[axis * 2 + 1]
        locks[a] = locks[b] = 1
        anchors.set(root, { a, b, width: -1, vertex: a })
      }
      for (const vertex of indices) {
        const entry = anchors.get(find(vertex))
        const line = [0, 1, 2].map(axis => positions[entry.b * 3 + axis] - positions[entry.a * 3 + axis])
        const offset = [0, 1, 2].map(axis => positions[vertex * 3 + axis] - positions[entry.a * 3 + axis])
        const lengthSquared = line.reduce((sum, value) => sum + value * value, 0)
        const dot = line.reduce((sum, value, axis) => sum + value * offset[axis], 0)
        const width = offset.reduce((sum, value) => sum + value * value, 0) - dot * dot / Math.max(lengthSquared, 1e-20)
        if (width > entry.width) { entry.width = width; entry.vertex = vertex }
      }
      for (const entry of anchors.values()) locks[entry.vertex] = 1
    } else {
      for (const limits of extrema.values()) for (const vertex of limits) locks[vertex] = 1
    }
    return MeshoptSimplifier.simplifyWithAttributes(indices, positions, stride, uv, 2, far ? [.001, .001] : [.01, .01], locks, target, error, flags)
  } }
}

/** The official shrub source is nine variants in a row, not a planted bush. */
function clusterShrubVariants(document) {
  const root = document.getRoot()
  const sourceNode = root.listNodes().find(node => node.getMesh())
  const sourceMesh = sourceNode.getMesh()
  const sourcePrimitive = sourceMesh.listPrimitives()[0]
  const positions = sourcePrimitive.getAttribute('POSITION').getArray()
  const sourceIndices = sourcePrimitive.getIndices().getArray()
  const groups = Array.from({ length: 9 }, () => [])
  // Observed local stem centres in this specific professional source. Assign
  // complete triangles by nearest stem; preserve all variants/materials/UVs.
  const stems = [-2.38, -2, -1.6, -1.3, -1.1, -.9, -.6, -.3, 0]
  for (let index = 0; index < sourceIndices.length; index += 3) {
    const centre = (positions[sourceIndices[index] * 3] + positions[sourceIndices[index + 1] * 3] + positions[sourceIndices[index + 2] * 3]) / 3
    let group = 0
    for (let candidate = 1; candidate < stems.length; candidate++) if (Math.abs(centre - stems[candidate]) < Math.abs(centre - stems[group])) group = candidate
    groups[group].push(sourceIndices[index], sourceIndices[index + 1], sourceIndices[index + 2])
  }
  sourceNode.setMesh(null)
  for (let variant = 0; variant < groups.length; variant++) {
    if (!groups[variant].length) throw new Error(`Empty source shrub variant ${variant + 1}`)
    const primitive = document.createPrimitive().setMaterial(sourcePrimitive.getMaterial())
    for (const semantic of sourcePrimitive.listSemantics()) primitive.setAttribute(semantic, sourcePrimitive.getAttribute(semantic))
    primitive.setIndices(document.createAccessor().setType('SCALAR').setArray(new Uint32Array(groups[variant])))
    compactPrimitive(primitive)
    const mesh = document.createMesh(`shrub_01_variant_${variant + 1}`).addPrimitive(primitive)
    const row = Math.floor(variant / 3)
    const column = variant % 3
    const x = (column - 1) * .10
    const z = (row - 1) * .10
    const originalStem = stems[variant]
    const positionAttribute = primitive.getAttribute('POSITION')
    const centeredPositions = new Float32Array(positionAttribute.getArray())
    const minY = positionAttribute.getMin([])[1]
    for (let index = 0; index < centeredPositions.length; index += 3) { centeredPositions[index] -= originalStem; centeredPositions[index + 1] -= minY }
    positionAttribute.setArray(centeredPositions)
    const angle = variant * 2.399963229728653
    const scale = .92 + .04 * (variant % 4)
    const node = document.createNode(`shrub_01_compact_${variant + 1}`).setMesh(mesh).setTranslation([x, 0, z]).setRotation([0, Math.sin(angle / 2), 0, Math.cos(angle / 2)]).setScale([scale, scale, scale])
    root.listScenes()[0].addChild(node)
  }
}

function inspect(document) {
  const root = document.getRoot()
  const bounds = getBounds(root.listScenes()[0])
  const triangles = root.listMeshes().reduce((total, mesh) => total + mesh.listPrimitives().reduce((sum, primitive) => sum + primitive.getIndices().getCount() / 3, 0), 0)
  return { triangles, bounds, dimensions: bounds.max.map((value, index) => value - bounds.min[index]), nodes: root.listNodes().map(node => node.getName()), skins: root.listSkins().length, animations: root.listAnimations().length, materials: root.listMaterials().map(material => ({ name: material.getName(), alphaMode: material.getAlphaMode(), doubleSided: material.getDoubleSided() })), textures: root.listTextures().map(texture => ({ name: texture.getName(), mimeType: texture.getMimeType(), size: texture.getSize() })) }
}

/** Render candidates in a separate headless browser and ephemeral preview server. */
async function renderPreviews(candidate) {
  const { chromium } = await import('@playwright/test')
  const coherence = flags.includes('--coherence') || assetId === 'jacaranda_tree'
  const evidenceRoot = path.join(repository, coherence ? 'docs/evidence/vegetation-coherence' : 'docs/evidence/entrance-urban')
  const threeRoot = path.join(repository, 'node_modules/three')
  await fs.mkdir(evidenceRoot, { recursive: true })
  const html = `<!doctype html><html><head><style>body{margin:0}canvas{display:block}</style><script type="importmap">{"imports":{"three":"/three/build/three.module.js"}}</script></head><body><script type="module">
    import * as THREE from 'three'; import {GLTFLoader} from '/three/examples/jsm/loaders/GLTFLoader.js';
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(900,900);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;document.body.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color('#c8dce6');scene.add(new THREE.HemisphereLight(0xcce7ff,0x65634a,2));const sun=new THREE.DirectionalLight(0xffefd1,3.5);sun.position.set(-5,8,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-5;scene.add(sun);
    const gltf=await new GLTFLoader().loadAsync('/candidate.glb'); const model=gltf.scene;scene.add(model);model.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true}}); const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());model.position.set(-center.x,-bounds.min.y,-center.z);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(50,50),new THREE.MeshStandardMaterial({color:'#b0ac9d',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.001;ground.receiveShadow=true;scene.add(ground);
    const frame=Math.max(size.x,size.y,size.z)*1.15;const camera=new THREE.OrthographicCamera(-frame/2,frame/2,frame/2,-frame/2,.05,100);const target=new THREE.Vector3(0,size.y/2,0);
    window.renderView=(view)=>{camera.position.copy(target).add(view==='front'?new THREE.Vector3(0,.15,15):new THREE.Vector3(15,.15,0));camera.lookAt(target);renderer.render(scene,camera);return {triangles:renderer.info.render.triangles,calls:renderer.info.render.calls}};window.renderView('front');window.ready=true;
  </script></body></html>`
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1')
      if (url.pathname === '/') { response.setHeader('Content-Type', 'text/html'); response.end(html); return }
      let filename
      if (url.pathname === '/candidate.glb') filename = candidate
      else if (url.pathname.startsWith('/three/')) {
        filename = path.resolve(threeRoot, url.pathname.slice(7))
        if (!filename.startsWith(threeRoot + path.sep)) throw new Error('Invalid preview path')
        response.setHeader('Content-Type', 'text/javascript')
      } else { response.statusCode = 404; response.end(); return }
      response.end(await fs.readFile(filename))
    } catch { response.statusCode = 500; response.end('Preview resource unavailable') }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  let browser
  const errors = []
  const views = []
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true })
    const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 })
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.ready, { timeout: 60000 })
    for (const view of ['front', 'side']) {
      const metrics = await page.evaluate(view => window.renderView(view), view)
      const destination = path.join(evidenceRoot, `vegetation-${path.basename(candidate, '.glb')}-${view}.png`)
      await assertAbsent(destination)
      await page.screenshot({ path: destination })
      views.push({ view, path: destination, metrics })
    }
  } finally {
    if (browser) await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
  return { conditions: 'Isolated 900x900 orthographic inspection, same sun/material settings; not entrance composition acceptance', errors, views }
}
