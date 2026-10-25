import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
const base = 'http://127.0.0.1:4174',
  out = 'docs/evidence/phase04/acceptance'
async function session(context: BrowserContext) {
  return (await context.request.get(base + '/api/demo/session')).json()
}
async function post(context: BrowserContext, path: string, data: unknown) {
  const s = await session(context)
  const response = await context.request.post(base + '/api/demo/' + path, {
    headers: { Origin: base, 'X-Demo-Nonce': s.nonce },
    data,
  })
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy()
  return response.json()
}
async function snapshot(admin: BrowserContext) {
  return (await admin.request.get(base + '/api/demo/admin/snapshot')).json()
}
async function command(admin: BrowserContext, id: string, action: string, extra = {}) {
  const state = await snapshot(admin),
    order = state.orders.find((o: any) => o.id === id)
  return post(admin, 'admin/command', {
    orderId: id,
    expectedRevision: order.revision,
    action,
    ...extra,
  })
}
async function create(context: BrowserContext, services: string[], contact: string) {
  const q = await post(context, 'quote', {
    services,
    vehicle: { type: 'car', color: 'Azul', contact },
  })
  return (await post(context, 'confirm', { quoteId: q.id, key: crypto.randomUUID() })).order
}
async function capture(page: Page, name: string) {
  await fs.mkdir(out, { recursive: true })
  await page.screenshot({ path: `${out}/${name}.png`, animations: 'disabled' })
}
async function loaded(page: Page) {
  console.log('opening operations')
  await page.goto('/?layer=operations', { waitUntil: 'domcontentloaded', timeout: 30000 })
  console.log('DOM loaded')
  await page.locator('[data-ground-ready=true]').waitFor({ timeout: 45000 })
  console.log('scene ready')
  await expect(page.locator('.operations-ui')).toHaveAttribute('data-connection', 'connected')
}

test('Operación real: cola, dos bahías, privacidad, fin, liberación, entrega y reconexión', async ({
  browser,
}) => {
  const admin = await browser.newContext(),
    owner = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 900 } }),
    visitor = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 900 } })
  const page = await owner.newPage(),
    other = await visitor.newPage(),
    errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  try {
    await post(admin, 'admin/login', {
      key: (await fs.readFile('server/.local-admin-token', 'utf8')).trim(),
    })
    const a = await create(owner, ['exterior', 'interior'], 'owner-phase04@example.test'),
      b = await create(visitor, ['lights'], 'other-phase04@example.test')
    await command(admin, a.id, 'arrive')
    await command(admin, b.id, 'arrive')
    await loaded(page)
    await loaded(other)
    await page.getByRole('button', { name: 'En espera 2', exact: true }).click()
    await expect(page.locator('.own-turn')).toContainText('Tu turno: 1')
    await expect(other.locator('.own-turn')).toContainText('Tu turno: 2')
    await expect(page.locator('.operations-list .vehicle-status-badge')).toHaveCount(2)
    await capture(page, '01-queue-desktop')
    const ownEntity = (await session(owner)).order.worldEntityId,
      otherEntity = (await session(visitor)).order.worldEntityId
    await other.locator(`.operations-list [data-entity="${ownEntity}"] button`).click()
    await expect(other.getByRole('dialog', { name: 'Detalle público del vehículo' })).toBeVisible()
    await expect(other.getByText('Total', { exact: true })).toHaveCount(0)
    expect(await other.locator('body').innerText()).not.toContain('owner-phase04')
    await other.getByRole('button', { name: 'Cerrar detalle' }).click()
    await command(admin, a.id, 'assign', { bayId: '01' })
    await expect
      .poll(
        async () => {
          const s = await snapshot(admin)
          return s.operation.frame.vehicles.find((v: any) => v.worldEntityId === ownEntity)?.stage
        },
        { timeout: 90000, intervals: [1000] },
      )
      .toBe('washing')
    await expect
      .poll(
        async () => {
          const s = await snapshot(admin)
          return s.operation.frame.vehicles.some((v: any) => v.movement)
        },
        { timeout: 30000, intervals: [1000] },
      )
      .toBe(false)
    await command(admin, b.id, 'assign', { bayId: '02' })
    await expect
      .poll(
        async () => {
          const s = await snapshot(admin)
          return s.operation.frame.vehicles.find((v: any) => v.worldEntityId === otherEntity)?.stage
        },
        { timeout: 90000, intervals: [1000] },
      )
      .toBe('lights')
    await page.getByRole('button', { name: 'En servicio 2', exact: true }).click()
    await expect(page.locator('.operations-list .service-badge.active')).toHaveCount(2)
    await capture(page, '02-parallel-bays')
    await page.locator('.operations-list .own button').click()
    await expect(page.getByRole('dialog', { name: 'Detalle de mi vehículo' })).toContainText(
      'Total',
    )
    await expect(page.getByRole('button', { name: 'Comprobante no emitido' })).toBeDisabled()
    await capture(page, '03-own-detail')
    await page.keyboard.press('Escape')
    await command(admin, a.id, 'task')
    await command(admin, a.id, 'task')
    await command(admin, a.id, 'task')
    await expect(page.locator('.completion-notice')).toBeVisible()
    await expect(other.locator('.completion-notice')).toHaveCount(0)
    expect((await snapshot(admin)).operation.frame.bays[0].occupancy).toBe('occupied')
    await page.getByRole('button', { name: 'Completados 1', exact: true }).click()
    await capture(page, '04-complete-awaiting-release')
    await page.getByRole('button', { name: 'Cerrar aviso' }).click()
    await owner.setOffline(true)
    await expect(page.locator('.operations-ui')).toHaveAttribute('data-connection', 'stale')
    await owner.setOffline(false)
    await expect(page.locator('.operations-ui')).toHaveAttribute('data-connection', 'connected')
    await expect(page.locator('.completion-notice')).toHaveCount(0)
    await command(admin, a.id, 'handover')
    expect((await snapshot(admin)).operation.frame.bays[0].occupancy).toBe('free')
    await expect
      .poll(
        async () => {
          const s = await snapshot(admin)
          return s.operation.frame.vehicles.find((v: any) => v.worldEntityId === ownEntity)?.stage
        },
        { timeout: 90000, intervals: [1000] },
      )
      .toBe('handover')
    await command(admin, a.id, 'deliver')
    await expect
      .poll(
        async () => {
          const s = await snapshot(admin)
          return s.operation.frame.completed?.some((v: any) => v.worldEntityId === ownEntity)
        },
        { timeout: 40000, intervals: [1000] },
      )
      .toBe(true)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.completion-notice')).toHaveCount(0)
    await page.getByRole('button', { name: 'Completados 1', exact: true }).click()
    await expect(page.locator('.operations-list .own')).toContainText('Entregado')
    await capture(page, '05-delivered-history')
    const stats = await page.evaluate(() => (window as any).__OPERATIONS_RENDER__)
    await fs.writeFile(
      `${out}/observed-render.json`,
      JSON.stringify(
        {
          stats,
          errors,
          checks: [
            'real admin transitions',
            'two private sessions',
            'no foreign totals',
            'no receipt invented',
            'completion before release',
            'archive after exit',
            'offline reconnect no duplicate alert',
          ],
        },
        null,
        2,
      ),
    )
    expect(errors).toEqual([])
  } finally {
    await owner.close()
    await visitor.close()
    await admin.close()
  }
})

test('Móvil: iconos accesibles, sin desbordamiento y movimiento reducido', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await loaded(page)
  await page.getByRole('button', { name: /En servicio/ }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const button of await page
    .locator('.operations-navigation button,.operations-navigation a')
    .all()) {
    const box = await button.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)
  }
  await expect(page.locator('.operations-list .vehicle-status-badge')).toHaveCount(1)
  const animation = await page
    .locator('.service-badge.active')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName)
  expect(animation).toBe('none')
  await capture(page, '06-mobile-reduced-motion')
  await page.locator('.operations-list .vehicle-select').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('Cancelar la orden seleccionada cierra el detalle móvil y recupera la lista', async ({
  browser,
  page,
  context,
}) => {
  const admin = await browser.newContext()
  try {
    await post(admin, 'admin/login', {
      key: (await fs.readFile('server/.local-admin-token', 'utf8')).trim(),
    })
    const order = await create(context, ['exterior'], 'cancel-phase04@example.test')
    await command(admin, order.id, 'arrive')
    await page.setViewportSize({ width: 390, height: 844 })
    await loaded(page)
    await page.getByRole('button', { name: /En espera/ }).click()
    await page.locator('.operations-list .own button').click()
    await expect(page.getByRole('dialog', { name: 'Detalle de mi vehículo' })).toBeVisible()
    await command(admin, order.id, 'cancel')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('.operations-list')).toBeVisible()
    await expect(page.locator('.operations-list .own')).toHaveCount(0)
    await capture(page, '07-cancellation-recovers-list')
  } finally {
    await admin.close()
  }
})
