import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const directory = 'docs/evidence/surface-polish'

await fs.mkdir(directory, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const checks = []

async function visit(page, label) {
  await page.getByRole('button', { name: 'Visitar', exact: true }).click()
  await page
    .getByRole('navigation', { name: 'Visitar un área' })
    .getByRole('button', { name: label })
    .click()
  await page.waitForFunction(() => !window.__FEBLES__.snapshot().destination)
  // Camera arrival starts the greeting; allow the CSS panel entrance to finish.
  await page.waitForTimeout(500)
}

async function capture(page, file) {
  await page.screenshot({ path: `${directory}/${file}.png`, scale: 'css', animations: 'disabled' })

  const result = await page.evaluate(() => {
    const snapshot = window.__FEBLES__.snapshot()
    const frames = snapshot.frames.slice(-120).sort((a, b) => a - b)
    const panel = document.querySelector('.world-panel')

    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      view: snapshot.activeView,
      weather: snapshot.weather,
      drawCalls: snapshot.drawCalls,
      triangles: snapshot.triangles,
      frameMsP50: frames[Math.floor(frames.length / 2)],
      contextLost: snapshot.contextLost,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      panelRadius: panel ? getComputedStyle(panel).borderRadius : null,
    }
  })

  checks.push({ file, ...result })
}

try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 650, height: 900 },
    { width: 390, height: 844 },
    { width: 375, height: 812 },
  ]) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const errors = []

    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.goto('http://127.0.0.1:4173/')
    await page.locator('[data-ready=true]').waitFor({ timeout: 60000 })
    await page.waitForTimeout(700)
    await capture(page, `after-${viewport.width}-entry`)
    await visit(page, 'Recepción')
    await capture(page, `after-${viewport.width}-reception`)
    await page.getByRole('button', { name: /Conocer servicios/ }).click()
    await page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true }).click()
    await capture(page, `after-${viewport.width}-catalogue`)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Abrir Servicios del mostrador', exact: true }).focus()

    const focus = await page.evaluate(() => {
      const element = document.activeElement
      const style = getComputedStyle(element)

      return {
        label: element.getAttribute('aria-label'),
        outline: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      }
    })

    await page.keyboard.press('Enter')

    const selectionPreserved = await page
      .getByRole('button', { name: 'Quitar Lavado exterior', exact: true })
      .isVisible()

    if (!selectionPreserved || focus.outline === 'none')
      throw new Error(`Selection/focus regression at ${viewport.width}px`)
    await page.keyboard.press('Escape')
    await visit(page, 'El local')
    await page.getByText('Consultar otra zona del local', { exact: true }).click()
    await page.getByRole('button', { name: 'Espera y mi orden' }).click()
    await page.waitForFunction(() => !window.__FEBLES__.snapshot().destination)
    await page.waitForTimeout(500)
    await capture(page, `after-${viewport.width}-lounge`)
    if (viewport.width === 1440) {
      await visit(page, 'El local')
      await capture(page, 'after-1440-bay')
    }
    checks.push({ viewport, errors, selectionPreserved, focus })
    if (errors.length) throw new Error(`Browser errors at ${viewport.width}px`)
    await context.close()
  }
} finally {
  await fs.writeFile(
    `${directory}/browser-checks.json`,
    JSON.stringify(
      {
        observedAt: new Date().toISOString(),
        scenario: 'operation; anonymous, empty, default simulated sunny weather',
        comparison:
          'Entry/reception baseline 1440x900; greeting phase is approximate, CSS motion disabled for final captures. Frame timings are single-run observations, not a before/after benchmark.',
        checks,
      },
      null,
      2,
    ),
  )
  await browser.close()
}
if (checks.some((check) => check.horizontalOverflow || check.contextLost))
  throw new Error('Overflow or WebGL context loss')
console.log(
  JSON.stringify({
    captures: checks.filter((check) => check.file).length,
    verifiedWidths: checks
      .filter((check) => check.viewport && !check.file)
      .map((check) => check.viewport.width),
    errors: 0,
  }),
)
