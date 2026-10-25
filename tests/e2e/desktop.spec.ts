import { test, expect } from '@playwright/test'
import { capture, enter, navigate, saveMetrics, snapshot, watchErrors } from './helpers'
test('desktop: preserved walking, collisions, reception, quote, own order and projected operation', async ({
  page,
}) => {
  test.setTimeout(150000)
  const log = watchErrors(page)
  await enter(page)
  await capture(page, 'desktop-entry')
  expect((await snapshot(page)).interaction).toBeNull()
  await page.getByRole('button', { name: 'Destinos', exact: true }).click()
  await page.getByRole('button', { name: 'Recepción', exact: true }).click()
  const a = (await snapshot(page)).position
  await expect
    .poll(async () =>
      Math.hypot(...(await snapshot(page)).position.map((n: number, i: number) => n - a[i])),
    )
    .toBeGreaterThan(0.2)
  const b = (await snapshot(page)).position
  expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeLessThan(2)
  await page.keyboard.down('KeyW')
  await expect.poll(async () => (await snapshot(page)).destination).toBeNull()
  await page.keyboard.up('KeyW')
  await navigate(page, 'Recepción')
  await expect.poll(async () => (await snapshot(page)).interaction).toBe('reception')
  await capture(page, 'desktop-reception')
  await expect.poll(async () => (await snapshot(page)).animations.receptionist.active).toBe('Idle')
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(800)
  await page.keyboard.up('KeyW')
  expect((await snapshot(page)).position[1]).toBeGreaterThan(1.9)
  await page.keyboard.press('KeyE')
  await expect(page.getByRole('dialog', { name: 'Ana · Recepción' })).toBeVisible()
  await expect.poll(async () => (await snapshot(page)).animations.receptionist.active).toBe('Talk')
  await page.getByRole('button', { name: 'Es mi primera visita' }).click()
  await expect(page.getByText('Esta visita es una DEMO.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Muéstrame los servicios' }).click()
  for (const name of ['Lavado exterior', 'Cuidado interior', 'Cuidado de focos']) {
    await page.getByRole('button', { name, exact: true }).click()
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Volver', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Volver', exact: true }).click()
  await page.getByRole('button', { name: 'Solicitar cotización DEMO' }).click()
  await expect(page.getByText('$66.90', { exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: 'Cuidado de focos' }).uncheck()
  await expect(page.getByText('$61.33', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar ejemplo', exact: true }).click()
  await expect(
    page.getByText('No genera órdenes ni cobros reales.', { exact: false }),
  ).toBeVisible()
  await capture(page, 'desktop-quote')
  await page.getByRole('button', { name: 'Volver', exact: true }).click()
  await page.getByRole('button', { name: 'Consultar mi vehículo' }).click()
  await page.getByRole('button', { name: 'Ver mi auto', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Mi orden DEMO' })).toBeVisible({ timeout: 30000 })
  await capture(page, 'desktop-own-order')
  await page.getByRole('button', { name: 'Cerrar mi orden' }).click()
  await expect.poll(async () => (await snapshot(page)).sightLines.service).toBe(true)
  await expect.poll(async () => (await snapshot(page)).sightLines.worker).toBe(true)
  await page.getByRole('button', { name: 'Reiniciar DEMO' }).click()
  await page.getByRole('button', { name: 'Pausar DEMO' }).click()
  await capture(page, 'desktop-bay')
  const paused = await snapshot(page)
  await page.waitForTimeout(600)
  expect((await snapshot(page)).vehiclePosition).toEqual(paused.vehiclePosition)
  expect((await snapshot(page)).world.revision).toBe(paused.world.revision)
  for (const stage of ['interior', 'lights', 'inspection', 'ready']) {
    await page.getByRole('button', { name: 'Siguiente etapa DEMO' }).click()
    await expect.poll(async () => (await snapshot(page)).world.stage).toBe(stage)
  }
  expect((await snapshot(page)).world.bay.tasks.every((t: any) => t.status === 'done')).toBe(true)
  await page.getByRole('button', { name: 'Siguiente etapa DEMO' }).click()
  await page.getByRole('button', { name: 'Reanudar DEMO' }).click()
  const p = (await snapshot(page)).vehiclePosition
  await expect
    .poll(
      async () =>
        Math.hypot(
          ...(await snapshot(page)).vehiclePosition.map((n: number, i: number) => n - p[i]),
        ),
      { timeout: 20000 },
    )
    .toBeGreaterThan(0.5)
  await capture(page, 'desktop-vehicle-moving')
  await navigate(page, 'Servicios')
  await expect.poll(async () => (await snapshot(page)).interaction).toBe('services')
  await capture(page, 'desktop-service-station')
  await navigate(page, 'Ver fila de espera')
  await capture(page, 'desktop-queue')
  await navigate(page, 'Ver llegada de autos')
  await capture(page, 'desktop-car-entry')
  await navigate(page, 'Lounge')
  await capture(page, 'desktop-lounge')
  await saveMetrics(page, 'desktop-metrics')
  expect(log.errors).toEqual([])
  expect(log.failed).toEqual([])
})
test('missing GLB gives recoverable error and resumes immediate entrance', async ({ page }) => {
  await page.route('**/models/receptionist.glb', (r) =>
    r.fulfill({ status: 503, body: 'asset unavailable' }),
  )
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'No se pudo cargar la visita' })).toBeVisible()
  await capture(page, 'desktop-load-error')
  await page.unroute('**/models/receptionist.glb')
  await page.getByRole('button', { name: 'Reintentar carga' }).click()
  await page.locator('[data-ready="true"]').waitFor({ timeout: 60000 })
  expect((await snapshot(page)).entered).toBe(true)
})
