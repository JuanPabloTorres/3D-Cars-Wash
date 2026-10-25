import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'

const stage = process.argv[2] || 'architecture'
const output = `docs/evidence/phase03/${stage}`

await fs.mkdir(output, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []

try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
    })
    const page = await context.newPage(),
      errors = []

    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })

    const start = Date.now()

    await page.goto(
      `http://127.0.0.1:4173/?layer=${stage === 'baseline' ? 'landscape' : 'reception'}&stage=${stage}`,
    )
    await page.locator('[data-ground-ready=true]').waitFor({ timeout: 120000 })

    const loadMs = Date.now() - start

    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${output}/${width}-entrance.png` })
    await page
      .getByRole('button', { name: /Preparar visita|Ir a recepción/ })
      .first()
      .click()
    await page.waitForTimeout(1800)
    await page.screenshot({ path: `${output}/${width}-counter.png` })

    const frames = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const gaps = []
          let prior = performance.now()
          const tick = (now) => {
            gaps.push(now - prior)
            prior = now
            if (gaps.length < 90) requestAnimationFrame(tick)
            else resolve({ medianFrameMs: gaps.sort((a, b) => a - b)[45], p95FrameMs: gaps[85] })
          }

          requestAnimationFrame(tick)
        }),
    )

    assert.deepEqual(errors, [])
    results.push({ width, loadMs, frames, errors })
    await context.close()
  }
  await fs.writeFile(`${output}/result.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results))
} finally {
  await browser.close()
}
