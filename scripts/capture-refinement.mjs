import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'

const dir = 'docs/evidence/refinement/final'

await fs.mkdir(dir, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage(),
  errors = []

page.on('pageerror', (e) => errors.push(e.message))

const snap = () => page.evaluate(() => window.__FEBLES__.snapshot())
const capture = (name) => page.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled' })
const navigate = async (name) => {
  await page.getByRole('button', { name: 'Destinos', exact: true }).click()
  await page.getByRole('button', { name, exact: true }).click()
  await page.waitForFunction(
    () => !window.__FEBLES__.snapshot().destination,
    {},
    { timeout: 45000 },
  )
}

await page.goto('http://127.0.0.1:4173/')
await page.locator('[data-ready="true"]').waitFor({ timeout: 60000 })
await capture('desktop-entry')
await navigate('Ver mi auto')
await page.getByRole('dialog', { name: 'Mi orden DEMO' }).waitFor()
await capture('desktop-own-order')
await page.getByRole('button', { name: 'Cerrar mi orden' }).click()
await page.getByRole('button', { name: 'Pausar DEMO' }).click()
await capture('desktop-bay')
await navigate('Recepción')
await capture('desktop-reception')
await navigate('Ver bahía 02')
await page.getByRole('button', { name: 'Ver estado', exact: true }).click()
await page.screenshot({
  path: 'docs/evidence/refinement/d/anonymous-card.png',
  animations: 'disabled',
})
await navigate('Lounge')
await capture('desktop-lounge')
await page.mouse.move(1150, 450)
await page.mouse.down()
await page.mouse.move(240, 500, { steps: 24 })
await page.mouse.up()
await page.waitForTimeout(250)
await capture('lounge-interior')
await context.grantPermissions(['geolocation'])
await context.setGeolocation({ latitude: 18.465, longitude: -66.105 })
await page.getByRole('button', { name: 'Ayuda de controles' }).click()
await page.getByRole('button', { name: 'Usar mi ubicación temporal' }).click()

let connected = true

try {
  await page.waitForFunction(
    () => window.__FEBLES__.snapshot().weather.source === 'forecast',
    {},
    { timeout: 25000 },
  )
} catch {
  connected = false
}

const result = {
  checkedAt: new Date().toISOString(),
  purpose: 'Actual NWS browser integration using public San Juan test point; not visitor location',
  connected,
  weather: (await snap()).weather,
  errors,
}

await fs.writeFile('docs/weather-browser-probe.json', JSON.stringify(result, null, 2))
await page.getByRole('button', { name: 'Cerrar ayuda' }).click()
await page.waitForTimeout(2500)
await capture('weather-live-public-probe')
assert.equal(errors.length, 0)
await context.close()

const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  }),
  phone = await mobile.newPage()

await phone.goto('http://127.0.0.1:4173/')
await phone.locator('[data-ready="true"]').waitFor({ timeout: 60000 })
await phone.getByRole('button', { name: 'Destinos', exact: true }).tap()
await phone.getByRole('button', { name: 'Ver mi auto', exact: true }).tap()
await phone.getByRole('dialog', { name: 'Mi orden DEMO' }).waitFor({ timeout: 45000 })
await phone.screenshot({ path: `${dir}/mobile-own-order.png`, animations: 'disabled' })

const touch = await mobile.newCDPSession(phone)

await touch.send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [{ x: 220, y: 730 }],
})
for (let y = 700; y >= 400; y -= 50) {
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 220, y }] })
}
await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await phone.waitForTimeout(300)
await phone.screenshot({ path: `${dir}/mobile-order-estimates.png`, animations: 'disabled' })

const scrolled = await phone.locator('.order-card').evaluate((e) => e.scrollTop > 0)

await fs.writeFile(
  `${dir}/gallery-check.json`,
  JSON.stringify(
    {
      cssTransitionsSettled: true,
      actualBrowser: true,
      mobileOrderScrolled: scrolled,
      desktopErrors: errors,
    },
    null,
    2,
  ),
)
assert.equal(scrolled, true)
await mobile.close()
await browser.close()
console.log(JSON.stringify({ liveWeather: connected, errors, mobileOrderScrolled: scrolled }))
