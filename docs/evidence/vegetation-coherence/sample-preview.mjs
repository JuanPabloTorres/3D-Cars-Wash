import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

// Read-only sample inspector. It does not connect to the product's server.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const [label, filenameArgument, heightArgument = '7', frameArgument = '12'] = process.argv.slice(2)
if (!label || !filenameArgument || !/^[a-zA-Z0-9_-]+$/.test(label)) throw new Error('Usage: node sample-preview.mjs <unique-label> <glb> [height=7] [frame=12]')
const filename = path.resolve(filenameArgument)
const evidence = path.join(repository, 'docs/evidence/vegetation-coherence')
const three = path.join(repository, 'node_modules/three')
const height = Number(heightArgument), frame = Number(frameArgument)
if (!(height > 0 && frame > 0)) throw new Error('Expected positive height/frame')
const html = `<!doctype html><style>body{margin:0}canvas{display:block}</style><script type="importmap">{"imports":{"three":"/three/build/three.module.js"}}</script><script type="module">
import * as THREE from 'three';import {GLTFLoader} from '/three/examples/jsm/loaders/GLTFLoader.js';import {HDRLoader} from '/three/examples/jsm/loaders/HDRLoader.js';
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1000,1000);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#78b7df');const environment=await new HDRLoader().loadAsync('/daylight.hdr');environment.mapping=THREE.EquirectangularReflectionMapping;scene.environment=environment;scene.environmentIntensity=.6;scene.add(new THREE.HemisphereLight('#d9eaff','#89917a',.7));const sun=new THREE.DirectionalLight('#fff0d4',2.6);sun.position.set(-22,30,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-10,right:10,top:12,bottom:-10,near:1,far:100});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:'#c9c6bc',roughness:.94}));ground.rotation.x=-Math.PI/2;ground.position.y=-.001;ground.receiveShadow=true;scene.add(ground);
const {scene:model}=await new GLTFLoader().loadAsync('/sample.glb');model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model,true),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=${height}/size.y;model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);model.scale.setScalar(scale);model.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true}});scene.add(model);
const camera=new THREE.OrthographicCamera(-${frame}/2,${frame}/2,${frame}/2,-${frame}/2,.05,100);const target=new THREE.Vector3(0,${height}/2,0);window.renderView=view=>{camera.position.copy(target).add(view==='front'?new THREE.Vector3(0,.15,20):new THREE.Vector3(20,.15,0));camera.lookAt(target);renderer.render(scene,camera);return {triangles:renderer.info.render.triangles,calls:renderer.info.render.calls}};window.renderView('front');window.ready=true;
</script>`
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname
    if (pathname === '/') { response.setHeader('Content-Type', 'text/html'); response.end(html); return }
    let resource
    if (pathname === '/sample.glb') resource = filename
    else if (pathname === '/daylight.hdr') resource = path.join(repository, 'public/textures/daylight.hdr')
    else if (pathname.startsWith('/three/')) { resource = path.resolve(three, pathname.slice(7)); if (!resource.startsWith(three + path.sep)) throw new Error('Invalid preview path'); response.setHeader('Content-Type', 'text/javascript') }
    else { response.statusCode = 404; response.end(); return }
    response.end(await fs.readFile(resource))
  } catch { response.statusCode = 404; response.end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
const errors = [], views = []
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1 })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.ready, { timeout: 60000 })
  for (const view of ['front', 'side']) {
    const screenshot = path.join(evidence, `${label}-${view}.png`)
    try { await fs.access(screenshot); throw new Error('Evidence already exists') } catch (error) { if (error.code !== 'ENOENT') throw error }
    const metrics = await page.evaluate(view => window.renderView(view), view)
    await page.screenshot({ path: screenshot })
    views.push({ view, screenshot, metrics })
  }
} finally {
  if (browser) await browser.close()
  await new Promise(resolve => server.close(resolve))
}
const report = { observedAt: new Date().toISOString(), filename, sha256: crypto.createHash('sha256').update(await fs.readFile(filename)).digest('hex'), height, frame, sunlight: { color: '#fff0d4', position: [-22,30,18], intensity: 2.6 }, hemisphere: { sky: '#d9eaff', ground: '#89917a', intensity: .7 }, HDRI: 'public/textures/daylight.hdr', environmentIntensity: .6, exposure: 1.05, toneMapping: 'ACESFilmicToneMapping', errors, views, limitation: 'Same sunny lighting/exposure/HDRI parameters and sample camera; excludes building occlusion and other plants' }
await fs.writeFile(path.join(evidence, label + '.json'), JSON.stringify(report, null, 2), { flag: 'wx' })
console.log(JSON.stringify(report, null, 2))
