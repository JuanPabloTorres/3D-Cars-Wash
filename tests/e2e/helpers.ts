import { expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
export async function snapshot(page: Page) {
  return page.evaluate(() => window.__FEBLES__.snapshot() as any)
}
export async function enter(page: Page) {
  await page.goto('/')
  await page.locator('[data-ready="true"]').waitFor({ timeout: 60000 })
}
export async function navigate(page: Page, name: string) {
  await page.getByRole('button', { name: 'Destinos', exact: true }).click()
  await page.getByRole('button', { name, exact: true }).click()
  await page.waitForFunction(
    () => !(window.__FEBLES__.snapshot() as any).destination,
    {},
    { timeout: 30000 },
  )
}
export async function capture(page: Page, file: string) {
  await fs.mkdir('docs/evidence/refinement/final', { recursive: true })
  await page.screenshot({ path: `docs/evidence/refinement/final/${file}.png` })
}
export function watchErrors(page: Page) {
  const errors: string[] = [],
    failed: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('requestfailed', (r) => {
    if (r.failure()?.errorText !== 'net::ERR_ABORTED') failed.push(r.url())
  })
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`)
  })
  return { errors, failed }
}
export async function saveMetrics(page: Page, file: string) {
  const result = await page.evaluate(() => {
    const s = window.__FEBLES__.snapshot() as any,
      frames = s.frames.slice(-240).sort((a: number, b: number) => a - b)
    const q = (p: number) => frames[Math.floor((frames.length - 1) * p)]
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      userAgent: navigator.userAgent,
      renderer: s.renderer,
      samples: frames.length,
      meanFPS: 1000 / (frames.reduce((a: number, b: number) => a + b, 0) / frames.length),
      frameMsP50: q(0.5),
      frameMsP95: q(0.95),
      frameMsP99: q(0.99),
      drawCalls: s.drawCalls,
      triangles: s.triangles,
      geometries: s.geometries,
      textures: s.textures,
      gpuMemoryBytes: null,
      network: performance.getEntriesByType('resource').map((r: any) => ({
        name: new URL(r.name).pathname,
        bytes: r.transferSize,
        durationMs: r.duration,
      })),
      animations: s.animations,
      vehicleCount: s.world.vehicles.length,
      contextLost: s.contextLost,
    }
  })
  await fs.writeFile(`docs/evidence/refinement/final/${file}.json`, JSON.stringify(result, null, 2))
  return result
}
