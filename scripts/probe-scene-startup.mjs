/** Isolated, read-only startup probe. Shader timings are synchronous CPU calls,
 * not GPU timings; artifacts never include session responses or credentials. */
import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const tag = process.argv[2] || 'baseline'

if (!/^[a-z0-9-]+$/.test(tag)) throw new Error('Invalid evidence tag')

const output = `docs/evidence/studio-closure/${tag}`

await fs.mkdir(output, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []

try {
  for (const scenario of ['empty', 'mixed']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

    await context.addInitScript(() => {
      const probe = (window.__STARTUP_PROBE__ = {
        calls: [],
        frames: [],
        started: performance.now(),
      })

      for (const name of [
        'compileShader',
        'linkProgram',
        'getProgramParameter',
        'drawElements',
        'drawElementsInstanced',
      ]) {
        const original = WebGL2RenderingContext.prototype[name]

        WebGL2RenderingContext.prototype[name] = function (...args) {
          const start = performance.now()
          const result = original.apply(this, args)
          const ms = performance.now() - start

          if (ms > 10 && probe.calls.length < 100) probe.calls.push({ name, start, ms })

          return result
        }
      }

      let last = 0
      const frame = (now) => {
        if (now - probe.started < 65000) {
          if (now - last > 100 || probe.frames.length < 3)
            probe.frames.push({ at: now, gap: now - last })
          last = now
          requestAnimationFrame(frame)
        }
      }

      requestAnimationFrame(frame)
    })

    const page = await context.newPage(),
      errors = [],
      warnings = []

    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      if (m.type() === 'warning') warnings.push(m.text().slice(0, 500))
    })

    const start = Date.now()
    let failure = null

    await page.goto(`http://127.0.0.1:4173/?scenario=${scenario}`)
    try {
      await page.locator('[data-ready=true]').waitFor({ timeout: 60000 })
    } catch (e) {
      failure = e.message
    }

    const readyMs = Date.now() - start
    const data = await page.evaluate(() => {
      const s = window.__FEBLES__?.snapshot()

      return {
        probe: window.__STARTUP_PROBE__,
        ready: document.querySelector('[data-ready=true]') !== null,
        renderer: s?.renderer,
        drawCalls: s?.drawCalls,
        frameMs: s?.frames?.slice(-60),
        vehicles: s?.world?.vehicles?.length,
      }
    })

    await page
      .screenshot({ path: `${output}/${scenario}.png`, timeout: 15000 })
      .catch((e) => errors.push(e.message))
    results.push({ scenario, readyMs, failure, errors, warnings: [...new Set(warnings)], ...data })
    await context.close()
  }
} finally {
  await browser.close()
  await fs.writeFile(`${output}/startup.json`, JSON.stringify({ tag, results }, null, 2))
}
console.log(
  results.map(({ scenario, readyMs, ready, errors }) => ({ scenario, readyMs, ready, errors })),
)
if (results.some((r) => !r.ready || r.errors.length)) process.exitCode = 1
