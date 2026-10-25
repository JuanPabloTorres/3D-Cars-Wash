import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'

const directory = 'docs/evidence/visual-revision/final'
const browser = await chromium.launch({ channel: 'msedge', headless: true })

try {
  for (const scenario of ['quiet', 'busy']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage(),
      errors = []

    page.on('pageerror', (error) => errors.push(error.message))

    const began = Date.now()

    await page.goto(`http://127.0.0.1:4173/?tools=demo&scenario=${scenario}`)
    await page.locator('[data-ready=true]').waitFor({ timeout: 60000 })

    const loadedMs = Date.now() - began
    const session = await (await page.request.get('http://127.0.0.1:4173/api/demo/session')).json()
    const response = await page.request.post(
      `http://127.0.0.1:4173/api/demo/tools?scenario=${scenario}&speed=1`,
      {
        headers: { Origin: 'http://127.0.0.1:4173', 'X-Demo-Nonce': session.nonce },
        data: { sandbox: true, action: 'pause', paused: false },
      },
    )

    assert.ok(response.ok())
    await page.waitForFunction(() => window.__FEBLES__.snapshot().frames.length >= 240)

    const snapshot = await page.evaluate(() => window.__FEBLES__.snapshot())
    const frames = snapshot.frames.slice(-180).sort((a, b) => a - b)
    const result = {
      actualBrowser: true,
      observedAt: new Date().toISOString(),
      hardware: snapshot.renderer,
      viewport: { width: 1440, height: 900 },
      scenario,
      loadedMs,
      samples: frames.length,
      meanFPS: 1000 / (frames.reduce((a, b) => a + b, 0) / frames.length),
      frameMsP95: frames[Math.floor(frames.length * 0.95)],
      drawCalls: snapshot.drawCalls,
      triangles: snapshot.triangles,
      textures: snapshot.textures,
      gpuMemoryBytes: null,
      errors,
    }

    await fs.writeFile(`${directory}/metrics-${scenario}.json`, JSON.stringify(result, null, 2))
    console.log(result)
    assert.deepEqual(errors, [])
    await context.close()
  }
} finally {
  await browser.close()
}
