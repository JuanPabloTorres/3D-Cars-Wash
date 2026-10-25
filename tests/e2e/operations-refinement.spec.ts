import { test, expect, type BrowserContext } from '@playwright/test'
import fs from 'node:fs/promises'
const base = 'http://127.0.0.1:4174',
  out = 'docs/evidence/phase04/refinement'
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
  expect(r.ok()).toBe(true)
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

test('Personal completa por dashboard, el servidor avisa sólo al dueño y asigna el siguiente turno', async ({
  browser,
}) => {
  const staff = await browser.newContext({ baseURL: base }),
    owner = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 900 } }),
    other = await browser.newContext({ baseURL: base })
  const dashboard = await staff.newPage(),
    page = await owner.newPage(),
    errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await fs.mkdir(out, { recursive: true })
  try {
    await dashboard.goto('/employee')
    await dashboard
      .getByLabel('Clave local de administración')
      .fill((await fs.readFile('server/.local-admin-token', 'utf8')).trim())
    await dashboard.getByRole('button', { name: 'Entrar al panel local' }).click()
    await expect(
      dashboard.getByRole('heading', { name: 'Fila, bahías y próximas acciones' }),
    ).toBeVisible()
    await expect(dashboard.locator('canvas')).toHaveCount(0)
    await expect(
      dashboard.getByRole('button', { name: 'Servicios y precios', exact: true }),
    ).toHaveCount(0)
    expect((await post(staff, 'admin/configuration', {})).status()).toBe(403)
    expect(
      (
        await post(staff, 'admin/command', { action: 'bay', bayId: '01', available: false })
      ).status(),
    ).toBe(403)
    expect((await post(owner, 'admin/command', { action: 'complete-service' })).status()).toBe(403)
    const a = await create(owner, 'Azul'),
      b = await create(other, 'Rojo')
    await command(staff, a.id, 'arrive')
    await command(staff, b.id, 'arrive')
    await command(staff, a.id, 'assign', { bayId: '01' })
    await page.goto('/?layer=reception', { waitUntil: 'domcontentloaded' })
    await page.locator('[data-ground-ready=true]').waitFor({ timeout: 60000 })
    const invitation = await page.locator('.reception-invitation').boundingBox()
    expect(invitation!.width).toBeLessThanOrEqual(290)
    expect(invitation!.height).toBeLessThan(200)
    await page.screenshot({ path: out + '/reception-shared-site.png' })
    await expect
      .poll(
        async () => (await state(staff)).operation.frame.vehicles.some((v: any) => v.movement),
        { timeout: 90000 },
      )
      .toBe(false)
    await page.getByRole('button', { name: 'Ver mi auto', exact: true }).click()
    await expect(page.locator('.ground-layer')).toHaveAttribute('data-ground-view', 'vehicle')
    await expect(page).toHaveURL(/layer=reception/)
    await expect(page.locator('.operations-ui,.admin-layout')).toHaveCount(0)
    await expect(page.locator('.bay-service-indicator.expanded')).toBeVisible()
    await expect(page.locator('.bay-service-indicator button')).toHaveCount(0)
    await expect(page.locator('.satellite-service')).toHaveCount(3)
    await page.waitForTimeout(1800)
    expect(
      (await page.locator('.bay-service-indicator.expanded').boundingBox())!.width,
    ).toBeLessThan(300)
    await page.screenshot({ path: out + '/bay-medallions.png' })
    await page.getByRole('button', { name: 'Bahías', exact: true }).click()
    await expect(page.locator('.ground-layer')).toHaveAttribute('data-ground-view', 'service')
    await page.getByRole('button', { name: 'Ver bahía 01', exact: true }).click()
    await expect(page.locator('.site-operation-controls')).toContainText('Bahía 01')
    await page.getByRole('button', { name: 'Ver mi auto', exact: true }).click()
    await dashboard.locator('.admin-order-row').filter({ hasText: a.id }).click()
    await dashboard.getByRole('button', { name: 'Simular finalización del servicio' }).click()
    await expect(page.locator('.completion-notice')).toBeVisible()
    expect((await session(owner)).order.completionNotice.channel).toBe('in-app-mock')
    expect((await session(other)).order.completionNotice).toBeUndefined()
    await expect
      .poll(
        async () =>
          (await state(staff)).operation.frame.vehicles.find(
            (v: any) => v.worldEntityId === `order-${b.id}`,
          )?.stage,
        { timeout: 120000 },
      )
      .toBe('washing')
    const current = await state(staff)
    expect(current.operation.frame.bays[0].vehicleId).toBe(`order-${b.id}`)
    expect(
      current.operation.frame.vehicles.find((v: any) => v.worldEntityId === `order-${a.id}`).stage,
    ).toBe('handover')
    expect((await session(owner)).order.payment).toBe('pending')
    await dashboard.screenshot({ path: out + '/employee-dashboard.png', fullPage: true })
    await page.getByRole('button', { name: 'Cerrar aviso' }).click()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.completion-notice')).toHaveCount(0)
    await dashboard.getByRole('button', { name: 'Confirmar entrega' }).click()
    await expect
      .poll(
        async () =>
          (await state(staff)).operation.frame.completed.some(
            (v: any) => v.worldEntityId === `order-${a.id}`,
          ),
        { timeout: 60000 },
      )
      .toBe(true)
    await dashboard.setViewportSize({ width: 390, height: 844 })
    expect(await dashboard.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    )
    await dashboard.screenshot({ path: out + '/employee-mobile.png', fullPage: true })
    expect(errors).toEqual([])
  } finally {
    await staff.close()
    await owner.close()
    await other.close()
  }
})
