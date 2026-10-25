import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
const out = 'docs/evidence/phase03/acceptance'
test.beforeAll(async () => {
  await fs.mkdir(out, { recursive: true })
})
const capture = async (p: Page, name: string) => {
  await p.waitForTimeout(900)
  await p.screenshot({ path: `${out}/${name}.png` })
}
async function arrive(page: Page) {
  await page.goto('/?layer=reception')
  await page.locator('[data-ground-ready=true]').waitFor({ timeout: 120000 })
  await page.getByRole('button', { name: 'Ir a recepción', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Ana · Recepción', exact: true })).toBeVisible()
}
test('Recepción: saludo sostenido, catálogo real, borrador, errores y orden idempotente', async ({
  page,
}) => {
  test.setTimeout(150000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  let confirms = 0
  page.on('request', (r) => {
    if (r.url().endsWith('/api/demo/confirm')) confirms++
  })
  await arrive(page)
  expect((await (await page.request.get('/api/demo/session')).json()).order).toBeNull()
  await page.waitForFunction(
    () => (window as any).__RECEPTION__?.animations.receptionist?.active === 'Greet',
  )
  await page.waitForTimeout(650)
  await capture(page, 'desktop-greeting')
  await page.waitForTimeout(3500)
  expect(
    await page.evaluate(() => (window as any).__RECEPTION__.animations.receptionist.active),
  ).toBe('Greet')
  await page.getByRole('button', { name: 'Ver servicios', exact: true }).click()
  await expect(
    page.getByRole('group', { name: 'Tarifas por vehículo' }).getByRole('button'),
  ).toHaveCount(4)
  await page.getByRole('button', { name: 'SUV', exact: true }).click()
  await expect(page.getByText('Requiere cotización DEMO', { exact: true })).toHaveCount(3)
  await page.getByRole('button', { name: 'Carro', exact: true }).click()
  await page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true }).click()
  await page.getByRole('button', { name: 'Quitar Lavado exterior', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Continuar', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true }).click()
  await capture(page, 'desktop-catalog')
  await page.getByRole('button', { name: 'Entrada', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Ir a recepción', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Quitar Lavado exterior', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await page.route(
    '**/api/demo/quote',
    (r) =>
      r.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Proveedor temporalmente no disponible' }),
      }),
    { times: 1 },
  )
  await page.getByRole('button', { name: 'Revisar cotización', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('temporalmente')
  await expect(page.getByRole('button', { name: 'Confirmar orden DEMO' })).toHaveCount(0)
  await capture(page, 'provider-error')
  await page.getByRole('button', { name: 'Reintentar conexión' }).click()
  await expect(page.getByRole('button', { name: 'Revisar cotización', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Revisar cotización', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Confirmar orden DEMO', exact: true }),
  ).toBeVisible()
  await capture(page, 'desktop-quote')
  await page.route('**/api/demo/confirm', async (r) => {
    await new Promise((resolve) => setTimeout(resolve, 450))
    await r.continue()
  })
  await page
    .getByRole('button', { name: 'Confirmar orden DEMO', exact: true })
    .evaluate((b: HTMLButtonElement) => {
      b.click()
      b.click()
    })
  await expect(page.getByText('Orden confirmada', { exact: true })).toBeVisible()
  expect(confirms).toBe(1)
  await capture(page, 'desktop-order')
  const order = (await (await page.request.get('/api/demo/session')).json()).order
  expect(order.status).toBe('confirmed')
  expect(order.payment).toBe('pending')
  expect(order.attention).toBe('not-arrived')
  await page.getByRole('button', { name: 'Solicitar cancelación', exact: true }).click()
  await page.getByRole('button', { name: 'Sí, solicitar cancelación', exact: true }).click()
  await expect(page.getByText('Orden cancelada', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('Móvil y tableta: panel único, categorías accesibles, cerrar y regresar', async ({
  browser,
}) => {
  test.setTimeout(150000)
  for (const width of [390, 650]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } }),
      page = await context.newPage()
    await arrive(page)
    await capture(page, `${width}-welcome`)
    await page.getByRole('button', { name: 'Ver servicios', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(1)
    const buttons = page.getByRole('group', { name: 'Tarifas por vehículo' }).getByRole('button')
    for (const b of await buttons.all()) {
      const box = await b.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    await page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true }).click()
    await capture(page, `${width}-catalog`)
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()
    await page.getByRole('button', { name: 'Revisar cotización', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Confirmar orden DEMO', exact: true }),
    ).toBeVisible()
    await capture(page, `${width}-quote`)
    await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: 'Hablar con Ana', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Ana · Recepción', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Ver servicios', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Quitar Lavado exterior', exact: true }),
    ).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await context.close()
  }
})

test('Movimiento reducido y recuperación de fallo del personaje', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' }),
    page = await context.newPage()
  await arrive(page)
  expect(
    await page.evaluate(() => (window as any).__RECEPTION__.animations.receptionist.active),
  ).toBe('Idle')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Consultar preguntas', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Preguntas a Ana' })).toBeVisible()
  await capture(page, 'questions')
  const failed = await context.newPage()
  await failed.route('**/models/receptionist.glb', (r) =>
    r.fulfill({ status: 503, body: 'unavailable' }),
  )
  await failed.goto('/?layer=reception')
  await expect(
    failed.getByRole('heading', { name: 'No se pudo cargar la recepción' }),
  ).toBeVisible()
  await expect(failed.getByRole('button', { name: 'Reintentar', exact: true })).toBeVisible()
  await capture(failed, 'asset-error')
  await context.close()
})

test('Objetos físicos: accesos sin barra duplicada, ofertas honestas y bienvenida al tocar a Ana', async ({
  page,
}) => {
  await arrive(page)
  await page.keyboard.press('Escape')
  await expect(page.locator('.reception-prop-actions')).toHaveCount(0)
  await expect(page.locator('.ana-speech')).toContainText('¡Hola! Soy Ana.')
  const bubble = await page.locator('.ana-speech').boundingBox()
  expect(bubble!.width).toBeLessThanOrEqual(114)
  for (const label of [
    'Consultar servicios',
    'Consultar horarios en la pared',
    'Consultar ofertas',
    'Consultar información',
    'Consultar preguntas',
  ]) {
    const box = await page.getByRole('button', { name: label, exact: true }).boundingBox()
    expect(
      bubble!.x + bubble!.width <= box!.x ||
        box!.x + box!.width <= bubble!.x ||
        bubble!.y + bubble!.height <= box!.y ||
        box!.y + box!.height <= bubble!.y,
    ).toBe(true)
  }
  await capture(page, 'physical-counter')
  for (const [label, title] of [
    ['Consultar horarios en la pared', 'Horarios'],
    ['Consultar información', 'Información del establecimiento'],
    ['Consultar ofertas', 'Ofertas vigentes'],
    ['Consultar preguntas', 'Preguntas a Ana'],
  ] as const) {
    await page.getByRole('button', { name: label, exact: true }).click()
    await expect(page.getByRole('dialog', { name: title, exact: true })).toBeVisible()
    if (label === 'Consultar ofertas')
      await expect(
        page.getByText('No hay ofertas vigentes configuradas por el establecimiento.', {
          exact: true,
        }),
      ).toBeVisible()
    await page.keyboard.press('Escape')
  }
  await page.getByRole('button', { name: 'Hablar con Ana', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Ana · Recepción', exact: true })).toBeVisible()
  await expect(page.locator('.ana-speech')).toHaveCount(0)
  await page.waitForFunction(
    () => (window as any).__RECEPTION__?.animations.receptionist.active === 'Greet',
  )
  await capture(page, 'ana-bubble')
  await page.getByRole('button', { name: 'Ver servicios', exact: true }).click()
  await page.waitForFunction(
    () => (window as any).__RECEPTION__?.animations.receptionist.active !== 'Greet',
  )
})
