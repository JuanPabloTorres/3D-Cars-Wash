import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'

const dir = 'docs/evidence/visual-revision/final'

await fs.mkdir(dir, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })

for (const mobile of [false, true]) {
  const prefix = mobile ? 'mobile' : 'desktop',
    context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      recordVideo: {
        dir: dir + '/video',
        size: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      },
    }),
    p = await context.newPage(),
    errors = []

  p.on('pageerror', (e) => errors.push(e.message))
  await p.goto('http://127.0.0.1:4173/?tools=demo&scenario=mixed')
  await p.locator('[data-ready=true]').waitFor({ timeout: 60000 })
  await p.waitForFunction(() => window.__FEBLES__.snapshot().frames.length > 12)

  const boot = await (await p.request.get('http://127.0.0.1:4173/api/demo/session')).json()
  const command = async (action, extra = {}) => {
    const r = await p.request.post('http://127.0.0.1:4173/api/demo/tools?scenario=mixed&speed=1', {
      headers: { Origin: 'http://127.0.0.1:4173', 'X-Demo-Nonce': boot.nonce },
      data: { sandbox: true, action, ...extra },
    })

    assert.ok(r.ok(), await r.text())
  }
  const capture = async (name) => {
    await p.screenshot({ path: `${dir}/${prefix}-${name}.png`, animations: 'disabled' })
  }
  const visit = async (name) => {
    await p.getByRole('button', { name: 'Visitar', exact: true }).click()
    await p.getByRole('navigation').getByRole('button', { name }).click()
    await p.waitForFunction(() => !window.__FEBLES__.snapshot().destination)
    await p.waitForTimeout(250)
  }

  await command('pause', { paused: true })
  await command('reset')
  await capture('entry')
  await visit('Recepción')
  await p.waitForTimeout(3500)
  await capture('reception')
  await p.getByRole('button', { name: /Conocer servicios/ }).click()
  await capture('services')
  for (const name of ['Lavado exterior', 'Cuidado interior', 'Cuidado de focos'])
    await p.getByRole('button', { name: 'Añadir ' + name, exact: true }).click()
  await p.getByRole('button', { name: 'Continuar', exact: true }).click()
  await capture('registration')
  await p.getByRole('button', { name: 'Revisar cotización', exact: true }).click()
  await p.getByText('$66.90', { exact: true }).waitFor()
  await capture('quote')
  await p.getByRole('button', { name: 'Confirmar orden DEMO' }).click()
  await p.getByRole('dialog', { name: 'Mi orden', exact: true }).waitFor()
  await capture('order')
  await p.getByRole('button', { name: 'Ayuda de la visita' }).click()
  await Promise.all([
    p.waitForResponse((r) => r.url().endsWith('/api/demo/session')),
    p.getByRole('button', { name: 'Asignar atención DEMO' }).click(),
  ])
  await p.getByRole('button', { name: 'Cerrar Tu visita a Febles' }).click()
  await p.getByRole('button', { name: 'Ayuda de la visita' }).click()
  await p.getByRole('button', { name: 'Cerrar Tu visita a Febles' }).click()
  await visit('Mi vehículo')
  await p.getByRole('dialog', { name: 'Mi vehículo', exact: true }).waitFor()
  await command('pause', { paused: false })

  const stages = []

  for (const [stage, clip] of [
    ['exterior', 'Service'],
    ['interior', 'ServiceInterior'],
    ['lights', 'ServiceLights'],
    ['inspection', 'ServiceInspect'],
  ]) {
    await p.waitForFunction(
      (clip) => window.__FEBLES__.snapshot().animations['worker:01']?.active === clip,
      clip,
    )
    await p.waitForTimeout(900)
    await capture(stage + '-service')
    stages.push({
      stage,
      animation: (await p.evaluate(() => window.__FEBLES__.snapshot())).animations['worker:01'],
    })
    // Ten seconds of real browser video per task, keeping source state untouched by rendering.
    await p.waitForTimeout(mobile ? 1500 : 10000)
    if (stage !== 'inspection') await command('advance')
  }
  await command('pause', { paused: true })
  await visit('El local')
  await capture('bay')
  await p.getByText('Consultar otra zona del local', { exact: true }).click()
  await p.getByRole('button', { name: 'Cola y turno' }).click()
  await p.waitForFunction(() => !window.__FEBLES__.snapshot().destination)
  await capture('queue')
  await p.getByText('Consultar otra zona del local', { exact: true }).click()
  await p.getByRole('button', { name: 'Espera y mi orden' }).click()
  await p.waitForFunction(() => !window.__FEBLES__.snapshot().destination)
  await capture('lounge')
  await p.getByText('Servicios y cuidados del vehículo', { exact: true }).click()
  await capture('lounge-content')
  await fs.writeFile(
    `${dir}/${prefix}-gallery.json`,
    JSON.stringify(
      {
        actualBrowser: true,
        observedAt: new Date().toISOString(),
        errors,
        stages,
        snapshot: await p.evaluate(() => window.__FEBLES__.snapshot()),
        panels: await p.getByRole('dialog').boundingBox(),
      },
      null,
      2,
    ),
  )
  assert.deepEqual(errors, [])

  const video = p.video()

  await context.close()
  await video.saveAs(`${dir}/${prefix}-experience.webm`)
}
await browser.close()
