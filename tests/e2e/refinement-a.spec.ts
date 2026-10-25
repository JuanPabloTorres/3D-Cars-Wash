import { test, expect } from '@playwright/test'
import { navigate, snapshot, watchErrors } from './helpers'
import fs from 'node:fs/promises'
test('A: immediate entrance, greeting and refresh from reception and queue', async ({ page }) => {
  const log = watchErrors(page),
    dir = 'docs/evidence/refinement/a'
  await fs.mkdir(dir, { recursive: true })
  await page.goto('/')
  await page.locator('[data-ready="true"]').waitFor({ timeout: 60000 })
  expect((await snapshot(page)).position).toEqual([-7, 14.5])
  expect((await snapshot(page)).destination).toBeNull()
  await expect(page.getByRole('button', { name: 'Entrar al car wash' })).toHaveCount(0)
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(250)
  await page.keyboard.up('KeyW')
  expect((await snapshot(page)).position[1]).toBeLessThan(14.4)
  await page.screenshot({ path: `${dir}/entrance.png` })
  await page.getByRole('button', { name: 'Destinos', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Entrada', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Cerrar destinos' }).click()
  await navigate(page, 'Recepción')
  for (let i = 0; i < 5; i++) {
    await page.screenshot({ path: `${dir}/greeting-${i}.png` })
    await page.waitForTimeout(400)
  }
  await expect.poll(async () => (await snapshot(page)).animations.receptionist.active).toBe('Idle')
  await page.keyboard.press('KeyE')
  await expect(page.getByRole('dialog', { name: 'Ana · Recepción' })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar conversación' }).click()
  await page.reload()
  await page.locator('[data-ready="true"]').waitFor()
  expect((await snapshot(page)).position).toEqual([-7, 14.5])
  await navigate(page, 'Ver fila de espera')
  await page.reload()
  await page.locator('[data-ready="true"]').waitFor()
  expect((await snapshot(page)).position).toEqual([-7, 14.5])
  expect(log.errors).toEqual([])
})

test('A: weather previews, provider failure, valid forecast fixture and cache', async ({
  page,
  context,
}) => {
  const log = watchErrors(page),
    dir = 'docs/evidence/refinement/a'
  await fs.mkdir(dir, { recursive: true })
  await page.goto('/')
  await page.locator('[data-ready="true"]').waitFor({ timeout: 60000 })
  await page.getByRole('button', { name: 'Ayuda de controles' }).click()
  for (const [label, kind] of [
    ['Lluvia', 'rain'],
    ['Noche', 'night'],
    ['Atardecer', 'sunset'],
    ['Nublado', 'overcast'],
    ['Parcialmente nublado', 'partly-cloudy'],
    ['Soleado', 'sunny'],
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click()
    await expect.poll(async () => (await snapshot(page)).weather.kind).toBe(kind)
    await page.getByRole('button', { name: 'Cerrar ayuda' }).click()
    await page.waitForTimeout(2800)
    await page.screenshot({ path: `${dir}/weather-${kind}.png` })
    await page.getByRole('button', { name: 'Ayuda de controles' }).click()
  }
  // Explicit browser permission and a synthetic location; never a real visitor location.
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 18.465, longitude: -66.105 })
  await page.route('https://api.weather.gov/**', (route) =>
    route.fulfill({ status: 503, body: 'provider unavailable' }),
  )
  await page.getByRole('button', { name: 'Usar mi ubicación temporal' }).click()
  await expect(page.getByText('Sin cobertura o conexión.', { exact: false })).toBeVisible()
  expect((await snapshot(page)).weather.source).toBe('simulation')
  await page.unroute('https://api.weather.gov/**')
  let calls = 0
  await page.route('https://api.weather.gov/**', (r) => {
    calls++
    const point = r.request().url().includes('/points/')
    return r.fulfill({
      json: point
        ? {
            properties: {
              forecastHourly: 'https://api.weather.gov/gridpoints/SJU/1,1/forecast/hourly',
            },
          }
        : {
            properties: {
              periods: [
                {
                  startTime: new Date(Date.now() - 10000).toISOString(),
                  endTime: new Date(Date.now() + 3600000).toISOString(),
                  shortForecast: 'Partly Cloudy',
                  isDaytime: true,
                },
              ],
            },
          },
    })
  })
  await page.getByRole('button', { name: 'Usar mi ubicación temporal' }).click()
  await expect.poll(async () => (await snapshot(page)).weather.source).toBe('forecast')
  expect(calls).toBe(2)
  await page.getByRole('button', { name: 'Usar mi ubicación temporal' }).click()
  await expect(page.getByText('Consultando pronóstico…')).toHaveCount(0)
  expect(calls).toBe(2)
  await page.getByRole('button', { name: 'Continuar visita', exact: true }).click()

  expect(log.errors.filter((e) => !e.includes('503'))).toEqual([])
})
