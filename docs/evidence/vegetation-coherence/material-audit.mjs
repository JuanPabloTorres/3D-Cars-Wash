import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import sharp from 'sharp'
import { chromium } from '@playwright/test'

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const output = path.join(repository, 'docs/evidence/vegetation-coherence/material-audit.json')
const modelIds = ['urbanTree', 'urbanShrub', 'urbanCalathea']
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const audit = { observedAt: new Date().toISOString(), palette: { medium: '#46733A', deep: '#24452C', light: '#76A449', accent: '#A7BD55', proportions: [60, 30, 10], use: 'Orientative for untextured surfaces; preserve texture variation' }, files: [], runtime: [], errors: [] }
for (const id of modelIds) {
  const filename = path.join(repository, 'public/models', id + '.glb')
  const bytes = await fs.readFile(filename)
  const document = await io.read(filename)
  const materials = []
  for (const material of document.getRoot().listMaterials()) {
    const diffuse = material.getBaseColorTexture()
    const rgba = await sharp(diffuse.getImage()).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let visible = 0, transparent = 0, intermediate = 0
    const rgb = [0, 0, 0]
    for (let offset = 0; offset < rgba.data.length; offset += 4) {
      const alpha = rgba.data[offset + 3]
      if (alpha < 255 && alpha > 0) intermediate++
      if (alpha < 128) { transparent++; continue }
      visible++
      for (let channel = 0; channel < 3; channel++) rgb[channel] += rgba.data[offset + channel]
    }
    const arm = material.getMetallicRoughnessTexture()
    const armStats = arm ? await sharp(arm.getImage()).stats() : null
    materials.push({ name: material.getName(), baseColorFactor: material.getBaseColorFactor(), alphaMode: material.getAlphaMode(), alphaCutoff: material.getAlphaCutoff(), doubleSided: material.getDoubleSided(), metallicFactor: material.getMetallicFactor(), roughnessFactor: material.getRoughnessFactor(), baseColorMap: { name: diffuse.getName(), mimeType: diffuse.getMimeType(), size: diffuse.getSize(), hasAlpha: (await sharp(diffuse.getImage()).metadata()).hasAlpha, visibleRGBMean: rgb.map(value => value / visible), visiblePixels: visible, transparentPixels: transparent, intermediateAlphaPixels: intermediate }, armMap: arm ? { name: arm.getName(), meanRoughnessG: armStats.channels[1].mean / 255, meanMetalnessB: armStats.channels[2].mean / 255, effectiveMeanMetalness: material.getMetallicFactor() * armStats.channels[2].mean / 255 } : null })
  }
  audit.files.push({ id, filename, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, materials })
}
const threeRoot = path.join(repository, 'node_modules/three')
const html = `<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js"}}</script><script type="module">
import {GLTFLoader} from '/three/examples/jsm/loaders/GLTFLoader.js';
window.audit=[];const loader=new GLTFLoader();for(const id of ${JSON.stringify(modelIds)}) {const gltf=await loader.loadAsync('/models/'+id+'.glb');const result=[];gltf.scene.traverse(node=>{if(node.isMesh){const materials=Array.isArray(node.material)?node.material:[node.material];for(const material of materials)result.push({name:material.name,color:material.color.toArray(),metalness:material.metalness,roughness:material.roughness,transparent:material.transparent,alphaTest:material.alphaTest,alphaToCoverage:material.alphaToCoverage,depthWrite:material.depthWrite,side:material.side,mapColorSpace:material.map?.colorSpace,normalColorSpace:material.normalMap?.colorSpace,roughnessColorSpace:material.roughnessMap?.colorSpace,metalnessColorSpace:material.metalnessMap?.colorSpace,flipY:material.map?.flipY})}});window.audit.push({id,materials:result})};window.ready=true;</script>`
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname
    if (pathname === '/') { response.setHeader('Content-Type', 'text/html'); response.end(html); return }
    const root = pathname.startsWith('/three/') ? threeRoot : path.join(repository, 'public/models')
    const filename = path.resolve(root, pathname.replace(/^\/(three|models)\//, ''))
    if (!filename.startsWith(root + path.sep)) throw new Error('Outside preview path')
    if (filename.endsWith('.js')) response.setHeader('Content-Type', 'text/javascript')
    response.end(await fs.readFile(filename))
  } catch { response.statusCode = 404; response.end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage()
  page.on('pageerror', error => audit.errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.ready, { timeout: 60000 })
  audit.runtime = await page.evaluate(() => window.audit)
} finally {
  if (browser) await browser.close()
  await new Promise(resolve => server.close(resolve))
}
await fs.writeFile(output, JSON.stringify(audit, null, 2), { flag: 'wx' })
console.log(JSON.stringify(audit, null, 2))
