import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'

const out = 'docs/evidence/reception-information'
test.beforeAll(() => fs.mkdir(out, { recursive: true }))
async function arrive(page: Page) {
  await page.goto('/?layer=reception')
  await page.locator('[data-ground-ready=true]').waitFor({ timeout: 120000 })
  await page.getByRole('button', { name: 'Ir a recepción', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30000 })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.waitForTimeout(1100)
}
async function catalogFixture(page: Page, hours: string | null) {
  await page.route('**/api/demo/catalog', async (route) => {
    const response = await route.fetch(),
      catalog = await response.json()
    await route.fulfill({
      json: {
        ...catalog,
        business: {
          ...catalog.business,
          hours,
          offers: hours
            ? [
                {
                  id: 'visible',
                  title: 'Cuidado exterior de temporada',
                  description: 'Consulta las condiciones con recepción.',
                  expiresAt: '2099-01-01T00:00:00Z',
                },
                {
                  id: 'expired',
                  title: 'Oferta vencida',
                  description: 'No mostrar',
                  expiresAt: '2000-01-01T00:00:00Z',
                },
              ]
            : [],
        },
      },
    })
  })
}

test('Pared configurable: horarios y ofertas abren detalles, borrador se conserva y bahía no es botón', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await catalogFixture(page, 'Lunes a sábado · 8:00–18:00\nDomingo · cerrado')
  await arrive(page)
  const hours = page.getByRole('button', { name: 'Consultar horarios en la pared' }),
    offers = page.getByRole('button', { name: 'Consultar ofertas en la pared' })
  await expect(hours).toHaveAttribute('aria-description', /Lunes a sábado/)
  await expect(offers).toHaveAttribute('aria-description', 'Cuidado exterior de temporada')
  await expect(page.getByText('Oferta vencida')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Consultar horarios', exact: true })).toHaveCount(0)
  await page.screenshot({ path: `${out}/desktop-wall-fixture.png` })
  await hours.click()
  await expect(page.getByRole('dialog', { name: 'Horarios', exact: true })).toContainText(
    'Domingo · cerrado',
  )
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  await offers.click()
  await expect(page.getByRole('dialog', { name: 'Ofertas vigentes', exact: true })).toContainText(
    'Consulta las condiciones',
  )
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Consultar servicios', exact: true }).click()
  await page.getByRole('button', { name: 'Añadir Lavado exterior' }).click()
  const draft = await page.evaluate(() => sessionStorage.getItem('febles.demo.draft.v1'))
  await page.getByRole('button', { name: 'Bahías', exact: true }).click()
  await expect(page.locator('[data-camera-moving=true]')).toHaveCount(1)
  await expect(page.locator('[data-camera-moving=false]')).toHaveCount(1, { timeout: 30000 })
  const badge = page.locator('.operation-bay-status').first()
  await expect(badge).toBeVisible()
  await expect(badge).toContainText('BAHÍA')
  expect(
    await badge.evaluate((el) => ({
      button: !!el.closest('button'),
      cursor: getComputedStyle(el).cursor,
    })),
  ).toEqual({ button: false, cursor: 'default' })
  await page.screenshot({ path: `${out}/bay-signals.png` })
  expect(await page.evaluate(() => sessionStorage.getItem('febles.demo.draft.v1'))).toBe(draft)
  await page.getByRole('button', { name: 'Área de espera', exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = (window as any).__RECEPTION__
        return state?.view === 'waiting' && !state.transition && state.fov === 58
      }),
    )
    .toBe(true)
  await expect(page.locator('[data-camera-moving=false]')).toHaveCount(1, { timeout: 30000 })
  await page.getByRole('button', { name: 'Recepción', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Quitar Lavado exterior' })).toBeVisible({
    timeout: 30000,
  })
  expect(errors).toEqual([])
})

test('Móvil: pared sin datos, interacción y movimiento reducido', async ({ browser }) => {
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    }),
    page = await context.newPage()
  await catalogFixture(page, null)
  await arrive(page)
  const hours = page.getByRole('button', { name: 'Consultar horarios en la pared' })
  await expect(hours).toHaveAttribute('aria-description', 'Horario por confirmar')
  await expect(page.getByRole('button', { name: 'Consultar ofertas en la pared' })).toHaveAttribute(
    'aria-description',
    'Sin ofertas publicadas',
  )
  await page.screenshot({ path: `${out}/mobile-wall-empty.png` })
  await hours.click()
  await expect(page.getByRole('dialog', { name: 'Horarios', exact: true })).toContainText(
    'pendiente de configuración',
  )
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Área de espera', exact: true }).click()
  await expect(page.locator('[data-camera-moving=false]')).toHaveCount(1)
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = (window as any).__RECEPTION__
        return state?.view === 'waiting' && !state.transition && state.fov === 58
      }),
    )
    .toBe(true)
  const terminal = page.getByRole('button', { name: 'Consultar mi espera', exact: true })
  const bounds = (await terminal.boundingBox())!
  expect(bounds.width).toBeLessThan(250)
  expect(bounds.height).toBeGreaterThanOrEqual(44)
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390)
  await expect(page.locator('.lounge-summary')).toHaveCount(0)
  await terminal.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#lounge-detail')).toContainText('Aún no tienes una orden activa')
  await page.getByRole('button', { name: 'Cerrar consulta de espera' }).click()
  await expect(terminal).toBeFocused()
  await page.getByRole('button', { name: 'Bahías', exact: true }).click()
  await expect(page.locator('.operation-bay-status').first()).toBeVisible()
  expect(await page.locator('.operation-space-signal.queue').count()).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await context.close()
})
