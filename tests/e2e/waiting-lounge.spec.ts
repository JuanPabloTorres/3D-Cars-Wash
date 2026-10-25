import { test, expect, type BrowserContext } from '@playwright/test'
import fs from 'node:fs/promises'
const base = 'http://127.0.0.1:4174',
  out = 'docs/evidence/phase05'
async function session(c: BrowserContext) {
  return (await c.request.get(base + '/api/demo/session')).json()
}
async function post(c: BrowserContext, path: string, data: unknown) {
  const s = await session(c)
  return c.request.post(base + '/api/demo/' + path, {
    headers: { Origin: base, 'X-Demo-Nonce': s.nonce },
    data,
  })
}
async function state(c: BrowserContext) {
  return (await c.request.get(base + '/api/demo/admin/snapshot')).json()
}
async function command(c: BrowserContext, id: string, action: string, extra = {}) {
  const order = (await state(c)).orders.find((o: any) => o.id === id),
    r = await post(c, 'admin/command', {
      orderId: id,
      expectedRevision: order.revision,
      action,
      ...extra,
    })
  expect(r.ok(), await r.text()).toBe(true)
  return r.json()
}
async function create(c: BrowserContext, color: string) {
  const q = await (
    await post(c, 'quote', {
      services: ['exterior', 'interior'],
      vehicle: { type: 'car', color, contact: '' },
    })
  ).json()
  return (await (await post(c, 'confirm', { quoteId: q.id, key: crypto.randomUUID() })).json())
    .order
}
async function clearLane(c: BrowserContext) {
  await expect
    .poll(async () => (await state(c)).operation.frame.vehicles.some((v: any) => v.movement), {
      timeout: 90000,
    })
    .toBe(false)
}

test('terraza: nueve estados reales, privacidad, navegación y consulta móvil', async ({
  browser,
}) => {
  const staff = await browser.newContext({ baseURL: base }),
    owner = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 900 } }),
    first = await browser.newContext({ baseURL: base }),
    second = await browser.newContext({ baseURL: base })
  const page = await owner.newPage(),
    errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  try {
    expect(
      (
        await post(staff, 'admin/login', {
          key: (await fs.readFile('server/.local-admin-token', 'utf8')).trim(),
          role: 'employee',
        })
      ).ok(),
    ).toBe(true)
    await page.goto('/?layer=reception')
    await page.locator('[data-ground-ready=true]').waitFor({ timeout: 90000 })
    await page.getByRole('button', { name: 'Área de espera', exact: true }).click()
    await expect(page.locator('.ground-layer')).toHaveAttribute('data-ground-view', 'waiting')
    await page.waitForFunction(() => !(window as any).__RECEPTION__?.transition)
    await expect(page.locator('#lounge-detail')).toHaveCount(0)
    await page.screenshot({ path: out + '/lounge-desktop.png' })
    await page.getByRole('button', { name: 'Consultar mi espera', exact: true }).click()
    await expect(page.locator('#lounge-detail')).toContainText('Aún no tienes una orden activa')
    await expect(page.locator('.lounge-queue')).toHaveCount(0)
    await page.getByRole('button', { name: 'Servicios y local' }).click()
    await page.getByText('Ofertas vigentes', { exact: true }).click()
    await expect(page.locator('#lounge-detail')).toContainText('No hay ofertas vigentes')
    await page.getByRole('button', { name: 'Mi turno', exact: true }).click()
    const a = await create(first, 'Rojo'),
      b = await create(second, 'Plata'),
      mine = await create(owner, 'Azul')
    await expect(page.locator('.lounge-state')).toContainText('Llegada pendiente')
    for (const order of [a, b, mine]) await command(staff, order.id, 'arrive')
    await expect(page.locator('.lounge-queue')).toContainText('2 delante de ti')
    await page.getByText('Explorar cola y bahías', { exact: true }).click()
    await expect(page.locator('#lounge-detail .vehicle-status-badge')).toHaveCount(3)
    await expect(page.locator('#lounge-detail')).not.toContainText(a.id)
    await page.screenshot({ path: out + '/lounge-queue.png' })
    for (const [order, bay, remaining] of [
      [a, '01', 1],
      [b, '02', 0],
    ] as const) {
      await command(staff, order.id, 'assign', { bayId: bay })
      await clearLane(staff)
      await expect(page.locator('.lounge-queue')).toContainText(`${remaining} delante de ti`)
    }
    await command(staff, mine.id, 'assign', { bayId: '03' })
    await clearLane(staff)
    await expect(page.locator('#lounge-detail')).toContainText('Bahía 03')
    await expect(page.locator('.lounge-time')).toContainText('Tiempo de servicio')
    await command(staff, mine.id, 'task')
    await expect(
      page
        .locator('#lounge-detail')
        .getByLabel(`${mine.quote.services[0].label}: Terminado`, { exact: true }),
    ).toBeVisible()
    await command(staff, mine.id, 'task')
    await command(staff, mine.id, 'task')
    await expect(page.locator('.lounge-state')).toContainText('pendiente liberar')
    await expect(page.locator('.lounge-state')).not.toContainText('listo para recoger')
    await expect(page.locator('.completion-notice')).toBeVisible()
    expect((await session(first)).order.completionNotice).toBeUndefined()
    await page.getByRole('button', { name: 'Cerrar aviso' }).click()
    await page.screenshot({ path: out + '/lounge-completed-waiting-release.png' })
    await command(staff, mine.id, 'handover')
    await clearLane(staff)
    await expect(page.locator('.lounge-state')).toContainText('listo para recoger')
    await page.getByText('Pago y comprobante', { exact: true }).click()
    await expect(page.getByRole('button', { name: 'Comprobante no disponible' })).toBeDisabled()
    await owner.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await expect(page.locator('.lounge-state')).toContainText('Conexión interrumpida')
    await owner.setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect(page.locator('.lounge-state')).toContainText('listo para recoger')
    await page.reload()
    await page.locator('[data-ground-ready=true]').waitFor({ timeout: 90000 })
    await page.getByRole('button', { name: 'Área de espera', exact: true }).click()
    await page.getByRole('button', { name: 'Consultar mi espera', exact: true }).click()
    await expect(page.locator('.completion-notice')).toHaveCount(0)
    await expect(page.locator('#lounge-detail')).toContainText('listo para recoger')
    await page.getByText('Aviso de finalización', { exact: true }).click()
    await expect(page.locator('#lounge-detail')).toContainText('Aviso privado')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(3000)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect((await page.locator('#lounge-detail').boundingBox())!.height).toBeLessThanOrEqual(
      844 * 0.41,
    )
    await page.screenshot({ path: out + '/lounge-mobile.png' })
    await page.getByRole('button', { name: 'Cerrar consulta de espera' }).click()
    await expect(page.locator('#lounge-detail')).toHaveCount(0)
    await page.getByRole('button', { name: 'Ver mi auto', exact: true }).click()
    await expect(page.locator('.ground-layer')).toHaveAttribute('data-ground-view', 'vehicle')
    await expect(page).toHaveURL(/layer=reception/)
    await page.getByRole('button', { name: 'Bahías', exact: true }).click()
    await expect(page.locator('.ground-layer')).toHaveAttribute('data-ground-view', 'service')
    await page.getByRole('button', { name: 'Recepción', exact: true }).click()
    await expect(page.locator('.ground-layer')).toHaveAttribute('data-ground-view', 'reception')
    expect(errors).toEqual([])
    await fs.writeFile(
      out + '/acceptance.json',
      JSON.stringify(
        {
          states: [
            'no-order',
            'pending-arrival',
            'two-ahead',
            'queue-advances',
            'in-service',
            'task-updates',
            'completed-not-pickup',
            'ready-unissued-receipt',
            'reconnect-private-notice',
            'mobile-map-navigation',
          ],
          pageErrors: errors,
        },
        null,
        2,
      ),
    )
  } finally {
    await staff.close()
    await owner.close()
    await first.close()
    await second.close()
  }
})

test('Mi orden reutiliza el estado operativo y Ver mi vehículo permanece en el mapa', async ({
  browser,
}) => {
  const owner = await browser.newContext({ baseURL: base }),
    staff = await browser.newContext({ baseURL: base }),
    page = await owner.newPage()
  try {
    expect(
      (
        await post(staff, 'admin/login', {
          key: (await fs.readFile('server/.local-admin-token', 'utf8')).trim(),
          role: 'employee',
        })
      ).ok(),
    ).toBe(true)
    const mine = await create(owner, 'Blanco')
    await command(staff, mine.id, 'arrive')
    await page.goto('/?layer=lounge')
    await page.locator('[data-ground-ready=true]').waitFor({ timeout: 90000 })
    await page.getByRole('button', { name: 'Mi orden', exact: true }).click()
    await expect(page.locator('.order-state')).toContainText('En espera')
    await expect(page.locator('.order-state')).toContainText('Turno')
    await page.getByRole('button', { name: 'Ver mi vehículo', exact: true }).click()
    await expect(page.locator('.ground-layer')).toHaveAttribute('data-ground-view', 'vehicle')
    await expect(page).toHaveURL(/layer=lounge/)
    await expect(page.locator('.admin-layout')).toHaveCount(0)
    const freeBay = (await state(staff)).operation.frame.bays.find(
      (bay: any) => bay.occupancy === 'free',
    )
    expect(freeBay).toBeDefined()
    await command(staff, mine.id, 'assign', { bayId: freeBay.bayId })
    await clearLane(staff)
    await command(staff, mine.id, 'task')
    await command(staff, mine.id, 'task')
    await command(staff, mine.id, 'task')
    await expect(page.locator('.completion-notice')).toContainText('espera la confirmación')
    await expect(page.locator('.completion-notice')).not.toContainText('está listo')
    expect((await session(owner)).order.completionNotice.message).toContain(
      'espera la confirmación',
    )
    await page.getByRole('button', { name: 'Cerrar aviso' }).click()
    await page.getByRole('button', { name: 'Mi orden', exact: true }).click()
    await expect(page.locator('.order-state')).toContainText('pendiente liberar')
    await page.getByText('Aviso de finalización', { exact: true }).click()
    await expect(page.locator('.world-panel')).toContainText('espera la confirmación')
  } finally {
    await owner.close()
    await staff.close()
  }
})
