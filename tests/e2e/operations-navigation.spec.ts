import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'

const out = 'docs/evidence/phase04/navigation'

test('Recepción permite consultar bahías y mi auto en móvil sin inventar una orden', async ({
  page,
}) => {
  await fs.mkdir(out, { recursive: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?layer=reception')
  await page.locator('[data-ground-ready=true]').waitFor({ timeout: 60000 })
  const nav = page.getByRole('navigation', { name: 'Atención al cliente' })
  for (const label of ['Bahías', 'Ver mi auto']) {
    const link = nav.getByRole('button', { name: label, exact: true })
    await expect(link).toBeVisible()
    const bounds = await link.boundingBox()
    expect(bounds!.height).toBeGreaterThanOrEqual(44)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: out + '/reception-mobile.png' })
  let navigations = 0
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations++
  })
  await nav.getByRole('button', { name: 'Bahías', exact: true }).click()
  await expect(page.locator('.ground-layer')).toHaveAttribute('data-ground-view', 'service')
  await expect(page).toHaveURL(/layer=reception/)
  await expect(page.locator('.operations-ui,.admin-layout')).toHaveCount(0)
  await page.waitForFunction(() => {
    const state = (window as any).__RECEPTION__
    return state?.view === 'service' && !state.transition && Math.abs(state.camera[0] - 19.4) < 0.01
  })
  await page.screenshot({ path: out + '/bays-map-mobile.png' })
  await page.getByRole('button', { name: 'Ver bahía 01', exact: true }).click()
  await page.waitForFunction(() => {
    const state = (window as any).__RECEPTION__
    return state && !state.transition && Math.abs(state.camera[0] - 3.4) < 0.01
  })
  await page.screenshot({ path: out + '/bay01-map-mobile.png' })
  expect(navigations).toBe(0)
  await page.getByRole('button', { name: 'Ver mi auto', exact: true }).click()
  await expect(
    page.getByText('Aún no tienes una orden activa. Prepárala en recepción.'),
  ).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.screenshot({ path: out + '/my-car-empty-mobile.png' })
  await page.getByRole('button', { name: 'Entrada', exact: true }).click()
  await page.getByRole('button', { name: 'Ver mi auto', exact: true }).click()
  await expect(page.locator('.ground-layer')).toHaveAttribute('data-ground-view', 'vehicle')
  await expect(
    page.getByText('Aún no tienes una orden activa. Prepárala en recepción.'),
  ).toBeVisible()
})

test('Mi auto distingue una orden confirmada de una llegada registrada', async ({
  page,
  context,
}) => {
  const base = 'http://127.0.0.1:4174'
  const session = await (await context.request.get(base + '/api/demo/session')).json()
  const headers = { Origin: base, 'X-Demo-Nonce': session.nonce }
  const quote = await (
    await context.request.post(base + '/api/demo/quote', {
      headers,
      data: {
        services: ['exterior'],
        vehicle: { type: 'car', color: 'Azul', contact: '' },
      },
    })
  ).json()
  const confirmed = await context.request.post(base + '/api/demo/confirm', {
    headers,
    data: { quoteId: quote.id, key: crypto.randomUUID() },
  })
  expect(confirmed.ok()).toBe(true)
  await page.goto('/?layer=reception')
  await page.getByRole('button', { name: 'Ver mi auto', exact: true }).click()
  await expect(
    page.getByText('Recepción debe registrar tu llegada', { exact: false }),
  ).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Bahías', exact: true }).click()
  await expect(page.locator('.ground-layer')).toHaveAttribute('data-ground-view', 'service')
  await expect(page.getByRole('region', { name: 'Bahías en el mapa' })).toBeVisible()
})
