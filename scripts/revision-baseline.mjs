import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const dir = 'docs/evidence/visual-revision/before'

await fs.mkdir(dir, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })

for (const mobile of [false, true]) {
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    isMobile: mobile,
    hasTouch: mobile,
  })
  const page = await context.newPage()

  await page.goto('http://127.0.0.1:4173/?tools=demo')
  await page.locator('[data-ready=true]').waitFor({ timeout: 60000 })
  await page.waitForFunction(() => window.__FEBLES__.snapshot().frames.length > 12)

  const visit = async (name) => {
    await page.getByRole('button', { name: 'Visitar', exact: true }).click()
    await page.getByRole('navigation').getByRole('button', { name }).click()
    await page.waitForFunction(() => !window.__FEBLES__.snapshot().destination)
  }

  await page.screenshot({ path: `${dir}/${mobile ? 'mobile' : 'desktop'}-entry.png` })
  await visit('Recepción')
  await page.screenshot({ path: `${dir}/${mobile ? 'mobile' : 'desktop'}-reception.png` })
  await page.getByRole('button', { name: /Conocer servicios/ }).click()
  await page.screenshot({ path: `${dir}/${mobile ? 'mobile' : 'desktop'}-services.png` })
  await visit('El local')
  await page.screenshot({ path: `${dir}/${mobile ? 'mobile' : 'desktop'}-bay.png` })
  await page.getByText('Consultar otra zona del local', { exact: true }).click()
  await page.getByRole('button', { name: 'Espera y mi orden' }).click()
  await page.waitForFunction(() => !window.__FEBLES__.snapshot().destination)
  await page.screenshot({ path: `${dir}/${mobile ? 'mobile' : 'desktop'}-lounge.png` })
  await context.close()
}
await browser.close()
