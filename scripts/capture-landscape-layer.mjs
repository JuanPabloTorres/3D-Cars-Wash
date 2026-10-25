import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const sample = process.argv.includes('--sample')
const output =
  process.env.LANDSCAPE_EVIDENCE_DIR ||
  `docs/evidence/landscape-layer/${sample ? 'sample' : 'after'}`

await fs.mkdir(output, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []

try {
  for (const width of sample ? [1440] : [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
    })
    const page = await context.newPage(),
      errors = [],
      failed = [],
      assets = new Set(),
      forbidden = []

    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    page.on('response', (r) => {
      if (/\.(glb|hdr|png|jpg|webp)(\?|$)/.test(r.url())) {
        assets.add(r.url().split('/').pop())
        if (!r.ok()) failed.push(r.url())
      }
    })
    page.on('request', (r) => {
      if (/\/api\/|vehicle|receptionist|worker\.glb/.test(r.url())) forbidden.push(r.url())
    })
    await page.goto(`http://127.0.0.1:4173/?layer=landscape${sample ? '&sample=1' : ''}`)
    await page.locator('[data-ground-ready=true][data-landscape=true]').waitFor({ timeout: 120000 })
    for (const [name, id] of sample
      ? [
          ['Entrada', 'entrance'],
          ['Esperar turno', 'waiting'],
        ]
      : [
          ['Entrada', 'entrance'],
          ['General', 'general'],
          ['Desde arriba', 'plan'],
          ['Preparar visita', 'reception'],
          ['Esperar turno', 'waiting'],
          ['Seguir servicio', 'service'],
          ['Recoger vehículo', 'delivery'],
        ]) {
      await page.getByRole('button', { name: new RegExp(name) }).click()
      await page.waitForTimeout(1200)
      assert.equal(await page.locator('main').getAttribute('data-ground-view'), id)
      await page.screenshot({ path: `${output}/${width}-${id}.png` })
    }
    await page.getByRole('button', { name: 'Delimitaciones', exact: true }).click()
    assert.equal(
      await page
        .getByRole('button', { name: 'Delimitaciones', exact: true })
        .getAttribute('aria-pressed'),
      'false',
    )
    await page.getByRole('button', { name: 'Delimitaciones', exact: true }).click()
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    )
    assert.deepEqual(errors, [])
    assert.deepEqual(failed, [])
    assert.deepEqual(forbidden, [])
    assert.ok(
      [...assets]
        .filter((a) => a.endsWith('.glb'))
        .every((a) => /^warm(ShadeTree|Palm|Shrub|Broadleaf|Groundcover)\.glb$/.test(a)),
      'only new botanical assets',
    )
    for (const asset of [
      'warmShadeTree.glb',
      'warmShrub.glb',
      'warmBroadleaf.glb',
      'warmGroundcover.glb',
      'center.png',
      'left.png',
      'right.png',
    ])
      assert.ok(assets.has(asset), asset)
    if (!sample) assert.ok(assets.has('warmPalm.glb'))
    results.push({
      width,
      errors,
      failed,
      forbidden,
      assets: [...assets],
      navigation: true,
      noOverflow: true,
    })
    await context.close()
  }
  await fs.writeFile(
    `${output}/result.json`,
    JSON.stringify({ passed: true, sample, results }, null, 2),
  )
  console.log(
    `Landscape ${sample ? 'sample' : 'desktop/mobile'}: loaded, navigation, resource isolation and console checks passed`,
  )
} finally {
  await browser.close()
}
