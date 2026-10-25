import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const directory = 'docs/evidence/phase04/refinement/final-views'

await fs.mkdir(directory, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }),
  errors = []

page.on('pageerror', (error) => errors.push(error.message))
await page.goto('http://127.0.0.1:4174/?layer=operations', { waitUntil: 'domcontentloaded' })
await page.locator('[data-ground-ready=true]').waitFor({ timeout: 90000 })
for (const [name, label] of [
  ['overview', 'El local'],
  ['queue', 'En espera'],
  ['bays', 'En servicio'],
  ['completed', 'Completados'],
]) {
  await page
    .getByRole('navigation', { name: 'Áreas de operación' })
    .getByRole('button', { name: new RegExp(`^${label}`) })
    .click()
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${directory}/${name}.png` })
}

const stats = await page.evaluate(() => window.__OPERATIONS_RENDER__)

await page.getByRole('button', { name: /^En servicio/ }).click()
await page.waitForTimeout(1800)

const active = page.locator('.operations-list .service-badge.active').first()
const animationBefore = await active.evaluate((el) => ({
  name: getComputedStyle(el).animationName,
  filter: getComputedStyle(el).filter,
}))

await page.waitForTimeout(700)

const animationAfter = await active.evaluate((el) => ({
  name: getComputedStyle(el).animationName,
  filter: getComputedStyle(el).filter,
}))
const frameTiming = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const times = []
      let previous = performance.now()
      const start = previous

      function frame(now) {
        times.push(now - previous)
        previous = now
        if (now - start < 3000) requestAnimationFrame(frame)
        else
          resolve({
            frames: times.length,
            durationMs: now - start,
            averageFrameMs: times.reduce((a, b) => a + b, 0) / times.length,
          })
      }

      requestAnimationFrame(frame)
    }),
)

await page.locator('.operations-list .vehicle-select').first().click()
await page.waitForTimeout(1800)

const selectedBadge = await page.locator('.bay-service-indicator.expanded').boundingBox()

if (!selectedBadge || selectedBadge.width > 400)
  throw new Error('The selected world badge exceeds the 400px visual budget')
if (await page.locator('.operations-list').isVisible())
  throw new Error('The underlying list must be hidden while details are open')
await page.screenshot({ path: `${directory}/selected-bay.png` })
await page.getByRole('button', { name: 'Cerrar detalle' }).click()
await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${directory}/mobile.png` })
await fs.writeFile(
  `${directory}/render.json`,
  JSON.stringify(
    { stats, frameTiming, animationBefore, animationAfter, selectedBadge, errors },
    null,
    2,
  ),
)
await browser.close()
