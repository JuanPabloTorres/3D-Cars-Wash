import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { chromium } from '@playwright/test'

// Anonymous, read-only QA. No fixture reset, order or administrator command.
const output = path.resolve(process.argv[2] || 'docs/evidence/site-zones-lounge/after')

await fs.mkdir(output, { recursive: true })

async function buildIdentity() {
  const files = [
    'dist/index.html',
    ...(await fs.readdir('dist/assets'))
      .filter((name) => name.endsWith('.js'))
      .map((name) => `dist/assets/${name}`),
  ]

  return Object.fromEntries(
    await Promise.all(
      files.map(async (file) => [
        file,
        crypto
          .createHash('sha256')
          .update(await fs.readFile(file))
          .digest('hex'),
      ]),
    ),
  )
}

async function settle(page) {
  await page.locator('.world-panel').evaluateAll(async (panels) => {
    await Promise.allSettled(
      panels.flatMap((panel) => panel.getAnimations().map((animation) => animation.finished)),
    )
  })
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
}

async function snapshot(page) {
  return page.evaluate(() => {
    const s = window.__FEBLES__.snapshot()

    return {
      ready: s.ready,
      activeView: s.activeView,
      destination: s.destination,
      position: s.position,
      yaw: s.yaw,
      pitch: s.pitch,
      weather: s.weather,
      contextLost: s.contextLost,
      vehicles: s.world.vehicles.length,
      drawCalls: s.drawCalls,
      triangles: s.triangles,
    }
  })
}

const initialBuild = await buildIdentity()
const entryBundle = (await fs.readFile('dist/index.html', 'utf8')).match(/src="([^"]+\.js)"/)?.[1]
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = [],
  errors = []
let failure

try {
  for (const viewport of [
    { width: 1855, height: 848 },
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const mobile = viewport.width === 390
    const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile })

    try {
      const page = await context.newPage()

      page.on('pageerror', (error) => errors.push({ viewport, message: error.message }))
      page.on('response', (response) => {
        if (response.status() >= 400)
          errors.push({ viewport, status: response.status(), url: response.url() })
      })
      await page.goto('http://127.0.0.1:4173/')
      await page.locator('[data-ready=true]').waitFor({ timeout: 60000 })
      await settle(page)

      const entrance = await snapshot(page)

      await page.screenshot({ path: path.join(output, `${viewport.width}-entrance.png`) })
      await page.getByRole('button', { name: 'Visitar', exact: true }).click()
      await page
        .getByRole('navigation')
        .getByRole('button', { name: /^El local/ })
        .click()
      await page.getByRole('dialog', { name: 'Bahía 01' }).waitFor()
      await page.getByText('Consultar otra zona del local', { exact: true }).click()
      await page.getByRole('button', { name: 'Espera y mi orden' }).click()
      await page.getByRole('dialog', { name: 'Tu espera' }).waitFor()
      await page.waitForFunction(
        () =>
          !window.__FEBLES__.snapshot().destination &&
          window.__FEBLES__.snapshot().activeView === 'lounge',
      )
      await settle(page)

      const lounge = await snapshot(page)

      await page.screenshot({ path: path.join(output, `${viewport.width}-lounge.png`) })
      await page.keyboard.press('Escape')
      await settle(page)
      await page.screenshot({
        path: path.join(output, `${viewport.width}-lounge-unobstructed.png`),
      })
      await page.getByRole('button', { name: 'Visitar', exact: true }).click()
      await page
        .getByRole('navigation')
        .getByRole('button', { name: /^Recepción/ })
        .click()
      await page.getByRole('dialog', { name: 'Ana · Recepción' }).waitFor()
      await page.waitForFunction(
        () =>
          !window.__FEBLES__.snapshot().destination &&
          window.__FEBLES__.snapshot().activeView === 'reception',
      )

      const scripts = await page
        .locator('script[src]')
        .evaluateAll((nodes) => nodes.map((node) => new URL(node.src).pathname))

      if (!scripts.includes(entryBundle)) throw new Error('Browser loaded a different build')
      if (entrance.contextLost || lounge.contextLost) throw new Error('WebGL context lost')
      results.push({ viewport, entrance, lounge, returnToReception: true, scripts })
    } finally {
      await context.close()
    }
  }
  if (JSON.stringify(initialBuild) !== JSON.stringify(await buildIdentity()))
    throw new Error('Build changed during capture; comparison invalid')
  if (errors.length) throw new Error('Browser/asset errors; inspect capture.json')
} catch (error) {
  failure = error.message
} finally {
  await browser.close()
  await fs.writeFile(
    path.join(output, 'capture.json'),
    JSON.stringify(
      {
        observedAt: new Date().toISOString(),
        actualBrowser: true,
        entryBundle,
        initialBuild,
        results,
        errors,
        failure: failure || null,
      },
      null,
      2,
    ),
  )
}
if (failure) throw new Error(failure)
console.log(
  JSON.stringify({ output, viewports: results.length, errors: errors.length, entryBundle }),
)
