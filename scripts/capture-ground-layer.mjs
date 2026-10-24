import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const output = process.env.GROUND_EVIDENCE_DIR || 'docs/evidence/ground-materials/after'
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } })
    const page = await context.newPage(), errors = [], forbidden = [], textures = new Set(), failedAssets = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (/\.glb(?:\?|$)|\/api\/demo\/|\/textures\/(concrete|wood)-/.test(request.url())) forbidden.push(request.url()) })
    page.on('response', response => {
      if (response.url().includes('/textures/ground-v2/')) {
        textures.add(response.url().split('/').pop())
        if (!response.ok()) failedAssets.push(response.url())
      }
    })
    await page.goto('http://127.0.0.1:4173/?layer=ground')
    await page.locator('[data-ground-ready=true]').waitFor({ timeout: 60000 })
    for (const [name, id] of [['General', 'general'], ['Desde arriba', 'plan'], ['Entrada', 'entrance']]) {
      await page.getByRole('button', { name, exact: true }).click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: `${output}/${width}-${id}.png` })
    }
    await page.getByRole('button', { name: 'Delimitaciones', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Delimitaciones', exact: true }).getAttribute('aria-pressed'), 'false')
    await page.getByRole('button', { name: 'Delimitaciones', exact: true }).click()
    await page.locator('summary').click()
    assert.equal(await page.locator('details').getAttribute('open'), '')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    const background = await page.evaluate(async () => {
      const style = getComputedStyle(document.querySelector('.ground-backdrop'))
      const image = new Image(); image.src = '/textures/site-background.png'; await image.decode()
      return { size: style.backgroundSize, width: image.naturalWidth, height: image.naturalHeight }
    })
    assert.equal(background.size, 'cover')
    assert.ok(background.width >= 1600)
    await page.locator('summary').click()
    for (const [name, id] of [['Preparar visita', 'reception'], ['Esperar turno', 'waiting'], ['Seguir servicio', 'service'], ['Recoger vehículo', 'delivery']]) {
      await page.getByRole('button', { name: new RegExp(name) }).click()
      assert.equal(await page.locator('main').getAttribute('data-ground-view'), id)
      await page.locator('.ground-purpose').waitFor()
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${output}/${width}-${id}.png` })
    }
    assert.equal(textures.size, 12, 'All four PBR material sets must load')
    if (width === 1440) {
      await page.getByRole('button', { name: 'Desde arriba', exact: true }).click()
      await page.waitForTimeout(500)
      // Observed reception footprint centre in the fixed 1440×900 plan camera.
      await page.mouse.click(520, 414)
      await page.waitForFunction(() => document.querySelector('main').dataset.groundView === 'reception')
    }
    assert.deepEqual(failedAssets, [])
    assert.deepEqual(errors, []); assert.deepEqual(forbidden, [])
    results.push({ width, background, errors, forbidden, textures: [...textures], failedAssets, views: 7, guidesToggle: true, noOverflow: true })
    await context.close()
  }
  await fs.writeFile(`${output}/result.json`, JSON.stringify({ passed: true, results }, null, 2))
  console.log('Ground layer: desktop/mobile views, guides, aspect-preserving background, no GLB or business requests — passed')
} finally { await browser.close() }
