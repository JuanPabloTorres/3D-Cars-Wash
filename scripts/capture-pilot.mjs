import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

// Anonymous, empty operation; this harness never creates orders or changes business data.
const directory = path.resolve(process.argv[2] || 'docs/evidence/pilot-20261023/after')
const baseURL = process.env.CARWASH_BASE_URL || 'http://127.0.0.1:4173'
const buildDirectory = path.resolve(process.env.CARWASH_DIST_DIR || 'dist')
await fs.mkdir(directory, { recursive: true })
const expectedEntry = (await fs.readFile(path.join(buildDirectory,'index.html'),'utf8')).match(/src="([^"]+\.js)"/)?.[1]
const servedIndex = await (await fetch(`${baseURL}/?experience=pilot`)).text()
if (!expectedEntry || !servedIndex.includes(expectedEntry) || servedIndex.includes('/@vite/client')) {
  throw new Error('Preview does not serve the expected dist entry; no capture started')
}
async function resourceHashes() {
  const files = [path.join(buildDirectory,'index.html'), ...(await fs.readdir(path.join(buildDirectory,'assets'))).filter(f=>/\.(js|css)$/.test(f)).map(f=>path.join(buildDirectory,'assets',f)), ...(await fs.readdir(path.join(buildDirectory,'models'))).filter(f=>f.endsWith('.glb')).map(f=>path.join(buildDirectory,'models',f))].sort()
  return Object.fromEntries(await Promise.all(files.map(async file=>[file,createHash('sha256').update(await fs.readFile(file)).digest('hex')])))
}
const resourcesBefore = await resourceHashes()
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []
try {
  for (const viewport of [{width:1855,height:848},{width:1440,height:900},{width:650,height:900},{width:390,height:844}]) {
    const mobile = viewport.width === 390
    const context = await browser.newContext({ viewport, isMobile:mobile, hasTouch:mobile, recordVideo:{dir:path.join(directory,'video'),size:viewport} })
    const page = await context.newPage(), errors = []
    page.on('pageerror',error=>errors.push(error.message))
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
    await page.goto(`${baseURL}/?experience=pilot`)
    await page.locator('[data-ready=true]').waitFor({timeout:90000})
    const loadedScripts = await page.evaluate(()=>[...document.scripts].map(s=>new URL(s.src).pathname))
    if(!loadedScripts.includes(expectedEntry)) throw new Error(`Loaded entry differs from dist: ${loadedScripts}`)
    await page.waitForFunction(()=>window.__FEBLES__.snapshot().frames.length>100)
    const prefix = String(viewport.width)
    await page.screenshot({path:path.join(directory,`${prefix}-entrance.png`)})
    const entrance = await page.evaluate(()=>window.__FEBLES__.snapshot())
    await page.getByRole('button',{name:'Ir a recepción',exact:true}).click()
    await page.waitForFunction(()=>!window.__FEBLES__.snapshot().destination && window.__FEBLES__.snapshot().activeView==='reception')
    await page.waitForFunction(()=>window.__FEBLES__.snapshot().animations.receptionist?.active==='Idle',{},{timeout:30000})
    await page.screenshot({path:path.join(directory,`${prefix}-reception.png`)})
    const reception = await page.evaluate(()=>window.__FEBLES__.snapshot())
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    await page.screenshot({path:path.join(directory,`${prefix}-counter.png`)})
    const controls = await page.locator('.counter-display').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return {label:node.getAttribute('aria-label'),x:b.x,y:b.y,width:b.width,height:b.height}}))
    await page.getByRole('button',{name:'Visitar',exact:true}).click()
    await page.getByRole('navigation',{name:'Visitar un área'}).getByRole('button',{name:/El local/}).click()
    await page.waitForFunction(()=>!window.__FEBLES__.snapshot().destination)
    await page.getByRole('button',{name:'Lounge · Sala de espera',exact:true}).click()
    await page.waitForFunction(()=>!window.__FEBLES__.snapshot().destination)
    await page.locator('.world-panel').evaluate(async panel=>{await Promise.allSettled(panel.getAnimations().map(animation=>animation.finished))})
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
    await page.screenshot({path:path.join(directory,`${prefix}-lounge.png`)})
    const lounge = await page.evaluate(()=>window.__FEBLES__.snapshot())
    const recording = page.video()
    const video = recording ? path.relative(directory,await recording.path()).replaceAll('\\','/') : null
    results.push({viewport,errors,entrance,reception,lounge,controls,loadedScripts,video,lighting:'sunny simulation; captured after 100 frames; cloud/Idle phases not frozen'})
    await context.close()
  }
} finally { await browser.close() }
const resourcesAfter = await resourceHashes()
const resourcesStable = JSON.stringify(resourcesBefore)===JSON.stringify(resourcesAfter)
await fs.writeFile(path.join(directory,'capture.json'),JSON.stringify({observedAt:new Date().toISOString(),actualBrowser:true,baseURL,buildDirectory,expectedEntry,resourcesBefore,resourcesAfter,resourcesStable,results},null,2))
if(!resourcesStable) throw new Error('Build or models changed during capture: see capture.json')
if(results.some(r=>r.errors.length)) throw new Error('Browser errors: see capture.json')
console.log(`Pilot captured at ${directory}`)
