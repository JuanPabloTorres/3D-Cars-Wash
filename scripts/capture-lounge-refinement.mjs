import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const out = 'docs/evidence/reception-information'

await fs.mkdir(out, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })

try {
  for (const width of [1440, 710, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } })
    const errors = []

    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(
      (process.env.CARWASH_CAPTURE_URL || 'http://127.0.0.1:4174') + '/?layer=reception',
    )
    await page.locator('[data-ground-ready=true]').waitFor({ timeout: 90000 })
    await page.getByRole('button', { name: 'Área de espera', exact: true }).click()
    await page.waitForTimeout(5000)
    await page.screenshot({ path: `${out}/lounge-refined-${width}.png` })
    console.log(
      JSON.stringify({
        width,
        errors,
        terminal: await page.locator('.lounge-terminal').boundingBox(),
        signals: await page.locator('.operation-bay-status').count(),
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      }),
    )
    await page.close()
  }
} finally {
  await browser.close()
}
