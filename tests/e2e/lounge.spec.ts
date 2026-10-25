import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'

const base = 'http://127.0.0.1:4173',
  evidence = `${process.env.CARWASH_EVIDENCE_DIR || 'docs/evidence/pilot-20261023/after'}/e2e-lounge`
async function visit(page: Page, label: string) {
  await page.getByRole('button', { name: /^Visitar(?: Orden activa)?$/ }).click()
  await page
    .getByRole('navigation', { name: 'Visitar un área' })
    .getByRole('button', { name: label })
    .click()
  await page.waitForFunction(() => !(window.__FEBLES__.snapshot() as any).destination)
}
async function openLounge(page: Page, url = '/') {
  await page.goto(url)
  await page.locator('[data-ready=true]').waitFor({ timeout: 60000 })
  await visit(page, 'El local')
  await page
    .getByRole('dialog', { name: 'El local', exact: true })
    .getByRole('button', { name: 'Lounge · Sala de espera', exact: true })
    .click()
  await expect(
    page.getByRole('dialog', { name: 'Lounge · Sala de espera', exact: true }),
  ).toBeVisible()
  await page.waitForFunction(() => !(window.__FEBLES__.snapshot() as any).destination)
}
async function command(page: Page, path: string, data: unknown) {
  const session = await (await page.request.get('/api/demo/session')).json()
  const response = await page.request.post(`/api/demo/${path}`, {
    headers: { Origin: base, 'X-Demo-Nonce': session.nonce },
    data,
  })
  expect(response.ok()).toBe(true)
  return response.json()
}
async function capture(page: Page, name: string) {
  await fs.mkdir(evidence, { recursive: true })
  await page.screenshot({ path: `${evidence}/${name}.png`, animations: 'disabled' })
}

test('Lounge de referencia: vacío honesto, tarjetas iguales y vistas internas con datos configurados', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1855, height: 848 })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openLounge(page)
  const panel = page.getByRole('dialog', { name: 'Lounge · Sala de espera', exact: true })
  await expect(panel).toContainText('Conoce el local y prepara tu visita.')
  await expect(panel).toContainText('Aún no tienes una orden activa.')
  await expect(panel).not.toContainText('cuidamos tu auto')
  await expect.poll(async () => Math.round((await panel.boundingBox())!.y * 100) / 100).toBe(84)
  const box = (await panel.boundingBox())!
  expect(box.x).toBeGreaterThan(1250)
  expect(box.y).toBeCloseTo(84, 1)
  expect(box.width).toBeGreaterThanOrEqual(555)
  expect(box.width).toBeLessThan(565)
  expect(848 - box.y - box.height).toBe(24)
  const cards = panel.locator('.lounge-card'),
    cardBoxes = await cards.evaluateAll((nodes) =>
      nodes.map((node) => ({
        width: node.getBoundingClientRect().width,
        height: node.getBoundingClientRect().height,
      })),
    )
  expect(cardBoxes).toHaveLength(3)
  expect(
    Math.max(...cardBoxes.map((box) => box.width)) - Math.min(...cardBoxes.map((box) => box.width)),
  ).toBeLessThan(1)
  expect(new Set(cardBoxes.map((box) => box.height)).size).toBe(1)
  for (const image of await cards.locator('img').all())
    expect(
      await image.evaluate(
        (node) =>
          (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0,
      ),
    ).toBe(true)
  await capture(page, 'desktop-empty-reference')
  await panel.getByRole('button', { name: 'Ofertas vigentes' }).click()
  await expect(panel.getByRole('heading', { name: 'Ofertas vigentes' })).toBeVisible()
  await expect(panel).toContainText('Sin ofertas publicadas.')
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await panel.getByRole('button', { name: 'Volver al lounge' }).click()
  await panel.getByRole('button', { name: 'Servicios y cuidados', exact: true }).click()
  await expect(panel.getByRole('heading', { name: 'Cuidado de focos', exact: true })).toBeVisible()
  await panel.locator('.care-card summary').first().click()
  await expect(
    panel
      .locator('.care-card')
      .first()
      .getByText(/Incluye:/),
  ).toBeVisible()
  const care = panel
    .locator('.care-card')
    .filter({ has: page.getByRole('heading', { name: 'Cuidado de focos', exact: true }) })
  await care.locator('summary').click()
  await expect(care.getByText('Incluye:', { exact: true })).toBeVisible()
  await panel.getByRole('button', { name: 'Volver al lounge' }).click()
  await panel.getByRole('button', { name: 'Información del local', exact: true }).click()
  await expect(
    panel.getByRole('heading', { name: 'Información del establecimiento' }),
  ).toBeVisible()
  await expect(panel).toContainText('Horario pendiente de configuración.')
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  expect(errors).toEqual([])
})

test('Preparar desde el lounge recupera el borrador sin crear una orden', async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'febles.demo.draft.v1',
      JSON.stringify({
        services: ['exterior'],
        vehicle: { type: 'car', color: 'Azul', contact: '' },
        step: 'vehicle',
      }),
    ),
  )
  await openLounge(page)
  await page
    .getByRole('dialog', { name: 'Lounge · Sala de espera', exact: true })
    .getByRole('button', { name: 'Preparar mi orden', exact: true })
    .click()
  await expect(page.getByRole('dialog', { name: 'Tu vehículo', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Color', exact: true })).toHaveValue('Azul')
  expect((await (await page.request.get('/api/demo/session')).json()).order).toBeNull()
  expect(
    await page.evaluate(() => JSON.parse(sessionStorage.getItem('febles.demo.draft.v1')!).services),
  ).toEqual(['exterior'])
  await expect(page.getByRole('dialog')).toHaveCount(1)
})

test('Orden de la sesión: llegada pendiente, atención real, lista y último estado al reconectar', async ({
  page,
  context,
}) => {
  // Explicit paused synthetic scenario; commands never stand in for live staff authorization.
  const toolPath = 'tools?scenario=quiet&speed=1'
  await command(page, toolPath, { sandbox: true, action: 'reset' })
  const quote = await command(page, 'quote', {
    services: ['exterior'],
    vehicle: { type: 'car', color: 'Azul', contact: '' },
  })
  await command(page, 'confirm', { quoteId: quote.id, key: quote.id })
  await openLounge(page, '/?scenario=quiet')
  await command(page, toolPath, { sandbox: true, action: 'pause', paused: true })
  const panel = page.getByRole('dialog', { name: 'Lounge · Sala de espera', exact: true })
  await expect(panel).toContainText('Tu solicitud está confirmada.')
  await expect(panel.locator('.lounge-order-facts')).toContainText('Llegada pendiente')
  await expect(panel.locator('.lounge-order')).not.toContainText('Bahía 03')
  await expect(panel.locator('.lounge-order')).not.toContainText('Turno')
  await command(page, toolPath, { sandbox: true, action: 'start-order' })
  await expect(panel).toContainText('Consulta cómo va el cuidado de tu vehículo.')
  await expect(panel.locator('.lounge-order')).toContainText('Carro · Azul')
  await expect(panel.locator('.lounge-order-facts')).toContainText('Lavado exterior en curso')
  await expect(panel.locator('.lounge-order-facts')).toContainText('Bahía 03')
  await capture(page, 'desktop-active-order')
  await command(page, toolPath, { sandbox: true, action: 'advance' })
  await command(page, toolPath, { sandbox: true, action: 'advance' })
  await expect(panel).toContainText('Tu vehículo está listo.')
  await expect(panel).toContainText('Listo para entrega')
  await context.setOffline(true)
  await expect(panel.getByRole('status')).toContainText('Actualizando el estado de tu orden…')
  await expect(panel.getByRole('status')).toContainText('Último estado recibido')
  await expect(panel).toContainText('Carro · Azul')
  await expect(panel).toContainText('Listo para entrega')
  await context.setOffline(false)
  await expect(panel.getByRole('status')).toHaveCount(0)
  await command(page, toolPath, { sandbox: true, action: 'pause', paused: true })
  await panel.getByRole('button', { name: 'Ver mi orden', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Mi orden' })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)
})

test('Lounge móvil: hoja de 58%, contenido legible y vehículo ajeno nunca seleccionado', async ({
  browser,
}) => {
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
    page = await context.newPage()
  await openLounge(page, '/?scenario=mixed')
  const panel = page.getByRole('dialog', { name: 'Lounge · Sala de espera', exact: true }),
    box = (await panel.boundingBox())!
  expect(box.height / 844).toBeGreaterThanOrEqual(0.55)
  expect(box.height / 844).toBeLessThanOrEqual(0.6)
  expect(await panel.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  const cards = panel.locator('.lounge-card'),
    boxes = await cards.evaluateAll((nodes) =>
      nodes.map((node) => ({
        y: node.getBoundingClientRect().y,
        width: node.getBoundingClientRect().width,
      })),
    )
  expect(boxes[1].y).toBeGreaterThan(boxes[0].y)
  expect(boxes[0].width).toBeGreaterThan(300)
  await panel.getByRole('button', { name: 'Ampliar detalles' }).click()
  expect((await panel.boundingBox())!.height).toBeGreaterThan(box.height)
  await panel.getByRole('button', { name: 'Reducir detalles' }).click()
  await panel.getByRole('button', { name: 'Ver mi vehículo', exact: true }).scrollIntoViewIfNeeded()
  await capture(page, 'mobile-lounge-actions')
  const beforeInspection = (await page.evaluate(() => window.__FEBLES__.snapshot())) as any
  await panel.getByRole('button', { name: 'Ver mi vehículo', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Mi vehículo' })).toContainText(
    'Aún no tienes una orden',
  )
  await page.waitForFunction(() => !(window.__FEBLES__.snapshot() as any).destination)
  const afterInspection = (await page.evaluate(() => window.__FEBLES__.snapshot())) as any
  expect(afterInspection.activeView).toBe('lounge')
  expect(afterInspection.navRevision).toBe(beforeInspection.navRevision)
  expect((await (await page.request.get('/api/demo/session')).json()).order).toBeNull()
  expect(afterInspection.world.vehicles.map((vehicle: any) => vehicle.worldEntityId)).toEqual(
    beforeInspection.world.vehicles.map((vehicle: any) => vehicle.worldEntityId),
  )
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await context.close()
})
