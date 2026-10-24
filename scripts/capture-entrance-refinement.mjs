import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

// Fresh anonymous contexts: captures never create orders or change operation.
const directory = path.resolve(process.argv[2] || 'docs/evidence/entrance-refinement/final')
await fs.mkdir(directory, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []
async function settle(page) {
  const panel=page.locator('.world-panel');
  if(await panel.count()) await panel.evaluate(async element=>{await Promise.allSettled(element.getAnimations().map(animation=>animation.finished))});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function capture(page,options){await settle(page);return page.screenshot(options)}
const build = await fs.readFile('dist/index.html', 'utf8')
const entryBundle = build.match(/src="([^"]+\.js)"/)?.[1]
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1855, height: 848 },
      isMobile: mobile, hasTouch: mobile,
    })
    const page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('http://127.0.0.1:4173/?experience=entrance-refinement')
    await page.locator('[data-ready=true]').waitFor({ timeout: 60000 })
    await page.waitForFunction(() => window.__FEBLES__.snapshot().frames.length > 70)
    const prefix = mobile ? 'mobile' : 'desktop'
    await settle(page)
    await capture(page, { path: path.join(directory, `${prefix}-entrance.png`) })
    const entry = await page.evaluate(() => window.__FEBLES__.snapshot())
    await page.getByRole('button', { name: 'Ir a recepción', exact: true }).click()
    await page.waitForFunction(() => !window.__FEBLES__.snapshot().destination && window.__FEBLES__.snapshot().activeView === 'reception')
    await page.getByRole('dialog').waitFor()
    await capture(page, { path: path.join(directory, `${prefix}-reception.png`) })
    const reception = await page.evaluate(() => window.__FEBLES__.snapshot())
    if (!mobile) {
      await page.getByRole('button', { name: 'Visitar', exact: true }).click()
      await page.getByRole('navigation').getByRole('button', { name: /^El local/ }).click()
      await page.waitForFunction(() => !window.__FEBLES__.snapshot().destination)
      await capture(page, { path: path.join(directory, 'desktop-bays.png') })
      for (const [name, shot] of [['Cola y turno', 'queue'], ['Espera y mi orden', 'lounge']]) {
        const details = page.locator('details.local-views')
        if (!(await details.evaluate(node => node.open))) await details.locator('summary').click()
        await page.getByRole('button', { name }).click()
        await page.waitForFunction(() => !window.__FEBLES__.snapshot().destination)
        await capture(page, { path: path.join(directory, `desktop-${shot}.png`) })
      }
    }
    const loadedBundles = await page.evaluate(() => [...document.scripts].map(script => new URL(script.src).pathname))
    if (!loadedBundles.includes(entryBundle)) throw new Error('Capture did not load the expected completed build')
    results.push({ viewport: page.viewportSize(), mobile, errors, entryBundle, loadedBundles, entry, reception })
    await context.close()
  }
} finally {
  await browser.close()
}
await fs.writeFile(path.join(directory, 'capture.json'), JSON.stringify({ actualBrowser: true, observedAt: new Date().toISOString(), results }, null, 2))
if (results.some(result => result.errors.length)) throw new Error('Browser errors; inspect capture.json')
console.log(`Captured entrance and reception on desktop/mobile: ${directory}`)
