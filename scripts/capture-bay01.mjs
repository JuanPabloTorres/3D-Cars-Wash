import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'

const phase = process.argv[2]

if (!/^[a-z0-9-]+$/.test(phase || '')) throw new Error('Supply a new evidence phase')

const directory = `docs/evidence/bay01-refinement/${phase}`,
  base = 'http://127.0.0.1:4173'

await fs.mkdir(directory, { recursive: true })

async function identity() {
  const files = [
    'dist/index.html',
    ...(await fs.readdir('dist/assets'))
      .filter((x) => /\.(js|css)$/.test(x))
      .map((x) => `dist/assets/${x}`),
    ...(await fs.readdir('dist/models'))
      .filter((x) => x.endsWith('.glb'))
      .map((x) => `dist/models/${x}`),
  ]

  return Object.fromEntries(
    await Promise.all(
      files.map(async (x) => [
        x,
        createHash('sha256')
          .update(await fs.readFile(x))
          .digest('hex'),
      ]),
    ),
  )
}

const before = await identity(),
  html = await (await fetch(base)).text(),
  entry = html.match(/src="([^"]+\.js)"/)?.[1]

if (!entry || !before[`dist${entry}`] || html.includes('/@vite/client'))
  throw new Error('Expected stable compiled preview')

const browser = await chromium.launch({ channel: 'msedge', headless: true }),
  results = []

try {
  for (const width of [1855, 390])
    for (const scenario of ['operation', 'mixed']) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 848 },
        isMobile: width === 390,
        hasTouch: width === 390,
        recordVideo: { dir: `${directory}/video` },
      })
      const page = await context.newPage(),
        errors = []

      page.on('pageerror', (e) => errors.push(e.message))
      page.on('response', (r) => {
        if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
      })
      await page.goto(`${base}/?scenario=${scenario}`)
      await page.locator('[data-ready=true]').waitFor({ timeout: 120000 })
      if (scenario === 'mixed') {
        const session = await (await page.request.get(`${base}/api/demo/session`)).json()

        for (const data of [{ action: 'reset' }, { action: 'pause', paused: true }]) {
          const response = await page.request.post(
            `${base}/api/demo/tools?scenario=mixed&speed=1`,
            {
              headers: { Origin: base, 'X-Demo-Nonce': session.nonce },
              data: { ...data, sandbox: true },
            },
          )

          if (!response.ok()) throw new Error('Isolated fixture command rejected')
        }
        await page.waitForFunction(() => window.__FEBLES__.snapshot().world.paused)
      }
      await page.getByRole('button', { name: /^Visitar/ }).click()
      await page
        .getByRole('navigation')
        .getByRole('button', { name: /El local/ })
        .click()
      await page.getByRole('button', { name: /Bahía 01/ }).click()
      await page.getByRole('dialog', { name: 'Bahía 01', exact: true }).waitFor()
      await page.waitForFunction(() => !window.__FEBLES__.snapshot().destination)
      await page.locator('.world-panel').evaluate(async (p) => {
        await Promise.allSettled(p.getAnimations().map((a) => a.finished))
      })
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            let n = 0

            function tick() {
              if (++n >= 150) resolve()
              else requestAnimationFrame(tick)
            }

            requestAnimationFrame(tick)
          }),
      )

      const snapshot = await page.evaluate(() => window.__FEBLES__.snapshot()),
        panel = await page.getByRole('dialog').innerText()

      if (scenario === 'operation' && snapshot.world.vehicles.length)
        throw new Error('Empty scene unexpectedly occupied')
      if (scenario === 'mixed' && !panel.includes('En proceso'))
        throw new Error('Active task not represented in panel')
      await page.screenshot({ path: `${directory}/${width}-${scenario}-panel.png` })
      await page.keyboard.press('Escape')
      await page.screenshot({ path: `${directory}/${width}-${scenario}-scene.png` })

      const frames = snapshot.frames.slice(-120),
        sorted = [...frames].sort((a, b) => a - b)
      const video = await page.video().path()

      results.push({
        width,
        scenario,
        entry,
        position: snapshot.position,
        yaw: snapshot.yaw,
        pitch: snapshot.pitch,
        weather: snapshot.weather,
        renderer: snapshot.renderer,
        drawCalls: snapshot.drawCalls,
        triangles: snapshot.triangles,
        meanFrameMs: frames.reduce((a, b) => a + b, 0) / frames.length,
        p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
        world: snapshot.world,
        panel,
        errors,
        video,
      })
      await context.close()
    }
} finally {
  await browser.close()
}

const stable = JSON.stringify(before) === JSON.stringify(await identity())

await fs.writeFile(
  `${directory}/capture.json`,
  JSON.stringify({ observedAt: new Date().toISOString(), entry, stable, before, results }, null, 2),
)
if (!stable || results.some((r) => r.errors.length))
  throw new Error('Capture failed stability/error checks')
console.log(JSON.stringify({ phase, stable, views: results.length, entry }))
