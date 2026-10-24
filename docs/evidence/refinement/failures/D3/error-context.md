# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: refinement-d.spec.ts >> D: actual accelerated lifecycle stays continuous from arrival through exit
- Location: tests\e2e\refinement-d.spec.ts:21:1

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 16.396
Received:   16.569279999983554
```

# Page snapshot

```yaml
- 'main "Febles Car Wash: visita tridimensional" [ref=e3]':
  - generic:
    - text: Visita DEMO
    - generic: Ambiente simulado
  - generic [ref=e7]:
    - button "Destinos" [ref=e8] [cursor=pointer]
    - button "Ayuda de controles" [ref=e13] [cursor=pointer]
  - generic [ref=e17]: Bienvenido a Febles
```

# Test source

```ts
  1  | import{test,expect}from '@playwright/test'
  2  | import{enter,navigate,snapshot,watchErrors}from './helpers'
  3  | import fs from 'node:fs/promises'
  4  | test('D: five independent bays, anonymous cards, lounge and configurable scenarios',async({page})=>{
  5  |  test.setTimeout(150000)
  6  |  const log=watchErrors(page),dir='docs/evidence/refinement/d';await fs.mkdir(dir,{recursive:true});await enter(page)
  7  |  expect((await snapshot(page)).world.bays).toHaveLength(5)
  8  |  await navigate(page,'Ver la bahía');await page.getByRole('button',{name:'Pausar DEMO'}).click();await page.screenshot({path:`${dir}/bay-01.png`})
  9  |  await navigate(page,'Ver bahía 02');await expect(page.getByRole('button',{name:'Ver estado',exact:true})).toBeVisible();await page.getByRole('button',{name:'Ver estado',exact:true}).click();await expect(page.getByText('Datos de otros clientes protegidos')).toBeVisible()
  10 |  const publicCard=page.locator('.world-card');expect(await publicCard.innerText()).not.toMatch(/F-0104|\$|Matrícula|Orden/);await page.screenshot({path:`${dir}/anonymous-card.png`})
  11 |  await navigate(page,'Ver bahía 03');await page.screenshot({path:`${dir}/bay-03-free.png`})
  12 |  await navigate(page,'Ver bahía 04');await page.screenshot({path:`${dir}/bay-04-unavailable.png`})
  13 |  await navigate(page,'Ver bahía 05');await page.screenshot({path:`${dir}/bay-05.png`})
  14 |  await navigate(page,'Lounge');await page.screenshot({path:`${dir}/lounge.png`})
  15 |  await navigate(page,'Ver fila de espera');await page.screenshot({path:`${dir}/queue.png`})
  16 |  await page.goto('/?scenario=quiet');await page.locator('[data-ready="true"]').waitFor();const quiet=(await snapshot(page)).world;expect(quiet.bays[0].occupancy).toBe('free');expect(quiet.bays[2].occupancy).toBe('occupied')
  17 |  await page.getByRole('button',{name:'Destinos',exact:true}).click();await page.getByRole('button',{name:'Ver mi auto',exact:true}).click();await expect(page.getByRole('dialog',{name:'Mi orden DEMO'})).toBeVisible({timeout:45000});await expect(page.getByText('Bahía 03',{exact:true})).toBeVisible();await page.screenshot({path:`${dir}/own-bay-03.png`})
  18 |  await page.goto('/?scenario=busy');await page.locator('[data-ready="true"]').waitFor();expect((await snapshot(page)).world.bays.every((b:any)=>b.occupancy==='occupied')).toBe(true);await page.screenshot({path:`${dir}/five-occupied.png`})
  19 |  expect(log.errors).toEqual([]);expect(log.failed).toEqual([])
  20 | })
  21 | test('D: actual accelerated lifecycle stays continuous from arrival through exit',async({page})=>{
  22 |  test.setTimeout(150000)
  23 |  const log=watchErrors(page),dir='docs/evidence/refinement/d';await fs.mkdir(dir,{recursive:true});await page.goto('/?scenario=arrival&demoSpeed=8');await page.locator('[data-ready="true"]').waitFor({timeout:60000})
  24 |  const stages=new Set<string>(),samples:any[]=[];let last:any=null,lastTime=Date.now(),captured=0
  25 |  while(Date.now()-lastTime<115000){
  26 |   const s=await snapshot(page),own=s.world.vehicles.find((v:any)=>v.visibility==='own'),pose=own&&s.vehicles?.[own.worldEntityId]
  27 |   stages.add(s.world.stage);samples.push({time:Date.now(),stage:s.world.stage,pose,world:s.world.vehicles.map((v:any)=>({id:v.worldEntityId,stage:v.stage,bay:v.bayId}))})
  28 |   expect(new Set(s.world.vehicles.map((v:any)=>v.worldEntityId)).size).toBe(s.world.vehicles.length)
> 29 |   if(pose&&last){const dt=(Date.now()-last.at)/1000;expect(Math.hypot(pose.position[0]-last.p[0],pose.position[1]-last.p[1])).toBeLessThan(2.8*8*dt+1.5)}
     |                                                                                                                               ^ Error: expect(received).toBeLessThan(expected)
  30 |   if(pose)last={p:pose.position,at:Date.now()}
  31 |   if(s.world.stage==='exited')break
  32 |   if(stages.size>captured){await page.screenshot({path:`${dir}/lifecycle-${s.world.stage}.png`});captured=stages.size}
  33 |   await page.waitForTimeout(250)
  34 |  }
  35 |  await fs.writeFile(`${dir}/lifecycle.json`,JSON.stringify(samples,null,2))
  36 |  for(const stage of ['arriving','queued','assigned','washing','interior','lights','inspection','ready','handover','departing','exited'])expect(stages.has(stage),`observed ${stage}`).toBe(true)
  37 |  expect(log.errors).toEqual([]);expect(log.failed).toEqual([])
  38 | })
  39 | 
```