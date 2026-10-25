import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const dir = 'docs/evidence/commercial-polish/first'

await fs.mkdir(dir, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })

for (const mobile of [false, true]) {
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    isMobile: mobile,
    hasTouch: mobile,
  })
  const page = await context.newPage()
  const errors = []

  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://127.0.0.1:4173/?tools=demo')
  await page.locator('[data-ready=true]').waitFor({ timeout: 60000 })
  await page.screenshot({
    path: `${dir}/${mobile ? 'mobile' : 'desktop'}-entry.png`,
    animations: 'disabled',
  })

  const started = Date.now()

  await page.getByRole('button', { name: 'Ir a recepción', exact: true }).click()
  await page.getByRole('dialog', { name: 'Ana · Recepción' }).waitFor()
  await page.screenshot({
    path: `${dir}/${mobile ? 'mobile' : 'desktop'}-reception.png`,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: /Conocer servicios/ }).click()
  await page.screenshot({
    path: `${dir}/${mobile ? 'mobile' : 'desktop'}-services.png`,
    animations: 'disabled',
  })
  await fs.writeFile(
    `${dir}/${mobile ? 'mobile' : 'desktop'}.json`,
    JSON.stringify(
      {
        errors,
        transitionMs: Date.now() - started,
        snapshot: await page.evaluate(() => window.__FEBLES__.snapshot()),
      },
      null,
      2,
    ),
  )
  await context.close()
}
await browser.close()
