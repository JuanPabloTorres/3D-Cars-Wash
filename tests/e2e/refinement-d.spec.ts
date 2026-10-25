import { test, expect } from '@playwright/test'
import { enter, navigate, snapshot, watchErrors } from './helpers'
import fs from 'node:fs/promises'
test('D: five independent bays, anonymous cards, lounge and configurable scenarios', async ({
  page,
}) => {
  test.setTimeout(150000)
  const log = watchErrors(page),
    dir = 'docs/evidence/refinement/d'
  await fs.mkdir(dir, { recursive: true })
  await enter(page)
  expect((await snapshot(page)).world.bays).toHaveLength(5)
  await navigate(page, 'Ver la bahía')
  await page.getByRole('button', { name: 'Pausar DEMO' }).click()
  await page.screenshot({ path: `${dir}/bay-01.png` })
  await navigate(page, 'Ver bahía 02')
  await expect(page.getByRole('button', { name: 'Ver estado', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ver estado', exact: true }).click()
  await expect(page.getByText('Datos de otros clientes protegidos')).toBeVisible()
  const publicCard = page.locator('.world-card')
  expect(await publicCard.innerText()).not.toMatch(/F-0104|\$|Matrícula|Orden/)
  await page.screenshot({ path: `${dir}/anonymous-card.png` })
  await navigate(page, 'Ver bahía 03')
  await page.screenshot({ path: `${dir}/bay-03-free.png` })
  await navigate(page, 'Ver bahía 04')
  await page.screenshot({ path: `${dir}/bay-04-unavailable.png` })
  await navigate(page, 'Ver bahía 05')
  await page.screenshot({ path: `${dir}/bay-05.png` })
  await navigate(page, 'Lounge')
  await page.screenshot({ path: `${dir}/lounge.png` })
  await navigate(page, 'Ver fila de espera')
  await page.screenshot({ path: `${dir}/queue.png` })
  await page.goto('/?scenario=quiet')
  await page.locator('[data-ready="true"]').waitFor()
  const quiet = (await snapshot(page)).world
  expect(quiet.bays[0].occupancy).toBe('free')
  expect(quiet.bays[2].occupancy).toBe('occupied')
  await page.getByRole('button', { name: 'Destinos', exact: true }).click()
  await page.getByRole('button', { name: 'Ver mi auto', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Mi orden DEMO' })).toBeVisible({ timeout: 45000 })
  await expect(page.getByText('Bahía 03', { exact: true })).toBeVisible()
  await page.screenshot({ path: `${dir}/own-bay-03.png` })
  await page.goto('/?scenario=busy')
  await page.locator('[data-ready="true"]').waitFor()
  expect((await snapshot(page)).world.bays.every((b: any) => b.occupancy === 'occupied')).toBe(true)
  await page.screenshot({ path: `${dir}/five-occupied.png` })
  expect(log.errors).toEqual([])
  expect(log.failed).toEqual([])
})
test('D: actual accelerated lifecycle stays continuous from arrival through exit', async ({
  page,
}) => {
  test.setTimeout(150000)
  const log = watchErrors(page),
    dir = 'docs/evidence/refinement/d'
  await fs.mkdir(dir, { recursive: true })
  await page.goto('/?scenario=arrival&demoSpeed=8')
  await page.locator('[data-ready="true"]').waitFor({ timeout: 60000 })
  const stages = new Set<string>(),
    samples: any[] = []
  let last: any = null,
    lastTime = Date.now(),
    captured = 0
  try {
    while (Date.now() - lastTime < 115000) {
      const s = await snapshot(page),
        own = s.world.vehicles.find((v: any) => v.visibility === 'own'),
        pose = own && s.vehicles?.[own.worldEntityId]
      stages.add(s.world.stage)
      samples.push({
        time: Date.now(),
        stage: s.world.stage,
        pose,
        world: s.world.vehicles.map((v: any) => ({
          id: v.worldEntityId,
          stage: v.stage,
          bay: v.bayId,
        })),
      })
      expect(new Set(s.world.vehicles.map((v: any) => v.worldEntityId)).size).toBe(
        s.world.vehicles.length,
      )
      if (pose && last) {
        const dt = (pose.observedAt - last.at) / 1000
        expect(
          Math.hypot(pose.position[0] - last.p[0], pose.position[1] - last.p[1]),
        ).toBeLessThanOrEqual(2.8 * 8 * dt + 0.05)
      }
      if (pose) last = { p: pose.position, at: pose.observedAt }
      if (s.world.stage === 'exited') break
      if (stages.size > captured) {
        await page.screenshot({ path: `${dir}/lifecycle-${s.world.stage}.png` })
        captured = stages.size
      }
      await page.waitForTimeout(250)
    }
  } finally {
    await fs.writeFile(`${dir}/lifecycle.json`, JSON.stringify(samples, null, 2))
  }
  for (const stage of [
    'arriving',
    'queued',
    'assigned',
    'washing',
    'interior',
    'lights',
    'inspection',
    'ready',
    'handover',
    'departing',
    'exited',
  ])
    expect(stages.has(stage), `observed ${stage}`).toBe(true)
  expect(log.errors).toEqual([])
  expect(log.failed).toEqual([])
})
