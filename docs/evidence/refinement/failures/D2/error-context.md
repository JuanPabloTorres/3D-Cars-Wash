# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: desktop.spec.ts >> desktop: preserved walking, collisions, reception, quote, own order and projected operation
- Location: tests\e2e\desktop.spec.ts:3:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- 'main "Febles Car Wash: visita tridimensional" [ref=e3]':
  - generic [ref=e8]:
    - generic [ref=e9]: MI AUTO · DEMO
    - generic [ref=e13]: Listo para entrega
    - generic [ref=e14]: Representación ilustrativa
    - button "Mi orden y servicios" [ref=e15] [cursor=pointer]
  - generic:
    - text: Visita DEMO
    - generic: Ambiente simulado
  - generic [ref=e19]:
    - button "Destinos" [ref=e20] [cursor=pointer]
    - button "Ayuda de controles" [ref=e25] [cursor=pointer]
  - generic "Controles del servicio DEMO" [ref=e29]:
    - generic [ref=e30]: Servicio DEMO
    - button "Reanudar DEMO" [ref=e31] [cursor=pointer]
    - button "Siguiente etapa DEMO" [active] [ref=e34] [cursor=pointer]
    - button "Reiniciar DEMO" [ref=e37] [cursor=pointer]
  - generic [ref=e41]: Llegaste a Ver la bahía.
```

# Test source

```ts
  1  | import{test,expect}from '@playwright/test'
  2  | import{capture,enter,navigate,saveMetrics,snapshot,watchErrors}from './helpers'
  3  | test('desktop: preserved walking, collisions, reception, quote, own order and projected operation',async({page})=>{
  4  |  test.setTimeout(150000)
  5  |  const log=watchErrors(page);await enter(page);await capture(page,'desktop-entry')
  6  |  expect((await snapshot(page)).interaction).toBeNull()
  7  |  await page.getByRole('button',{name:'Destinos',exact:true}).click();await page.getByRole('button',{name:'Recepción',exact:true}).click()
  8  |  const a=(await snapshot(page)).position
  9  |  await expect.poll(async()=>Math.hypot(...(await snapshot(page)).position.map((n:number,i:number)=>n-a[i]))).toBeGreaterThan(.2)
  10 |  const b=(await snapshot(page)).position;expect(Math.hypot(b[0]-a[0],b[1]-a[1])).toBeLessThan(2)
  11 |  await page.keyboard.down('KeyW');await expect.poll(async()=>(await snapshot(page)).destination).toBeNull();await page.keyboard.up('KeyW')
  12 |  await navigate(page,'Recepción');await expect.poll(async()=>(await snapshot(page)).interaction).toBe('reception');await capture(page,'desktop-reception')
  13 |  await expect.poll(async()=>(await snapshot(page)).animations.receptionist.active).toBe('Idle')
  14 |  await page.keyboard.down('KeyW');await page.waitForTimeout(800);await page.keyboard.up('KeyW');expect((await snapshot(page)).position[1]).toBeGreaterThan(1.9)
  15 |  await page.keyboard.press('KeyE');await expect(page.getByRole('dialog',{name:'Ana · Recepción'})).toBeVisible();await expect.poll(async()=>(await snapshot(page)).animations.receptionist.active).toBe('Talk')
  16 |  await page.getByRole('button',{name:'Es mi primera visita'}).click();await expect(page.getByText('Esta visita es una DEMO.',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Muéstrame los servicios'}).click()
  17 |  for(const name of ['Lavado exterior','Cuidado interior','Cuidado de focos']){await page.getByRole('button',{name,exact:true}).click();await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();await page.getByRole('button',{name:'Volver',exact:true}).click()}
  18 |  await page.getByRole('button',{name:'Volver',exact:true}).click();await page.getByRole('button',{name:'Solicitar cotización DEMO'}).click();await expect(page.getByText('$66.90',{exact:true})).toBeVisible()
  19 |  await page.getByRole('checkbox',{name:'Cuidado de focos'}).uncheck();await expect(page.getByText('$61.33',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Confirmar ejemplo',exact:true}).click();await expect(page.getByText('No genera órdenes ni cobros reales.',{exact:false})).toBeVisible();await capture(page,'desktop-quote')
  20 |  await page.getByRole('button',{name:'Volver',exact:true}).click();await page.getByRole('button',{name:'Consultar mi vehículo'}).click();await page.getByRole('button',{name:'Ver mi auto',exact:true}).click();await expect(page.getByRole('dialog',{name:'Mi orden DEMO'})).toBeVisible({timeout:30000});await capture(page,'desktop-own-order');await page.getByRole('button',{name:'Cerrar mi orden'}).click()
  21 |  await expect.poll(async()=>(await snapshot(page)).sightLines.service).toBe(true);await expect.poll(async()=>(await snapshot(page)).sightLines.worker).toBe(true)
  22 |  await page.getByRole('button',{name:'Reiniciar DEMO'}).click();await page.getByRole('button',{name:'Pausar DEMO'}).click();await capture(page,'desktop-bay')
  23 |  const paused=await snapshot(page);await page.waitForTimeout(600);expect((await snapshot(page)).vehiclePosition).toEqual(paused.vehiclePosition);expect((await snapshot(page)).world.revision).toBe(paused.world.revision)
  24 |  for(const stage of ['interior','lights','inspection','ready']){await page.getByRole('button',{name:'Siguiente etapa DEMO'}).click();await expect.poll(async()=>(await snapshot(page)).world.stage).toBe(stage)}
> 25 |  expect((await snapshot(page)).world.bay.tasks.every((t:any)=>t.status==='done')).toBe(true)
     |                                                                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  26 |  await page.getByRole('button',{name:'Siguiente etapa DEMO'}).click();await page.getByRole('button',{name:'Reanudar DEMO'}).click();const p=(await snapshot(page)).vehiclePosition
  27 |  await expect.poll(async()=>Math.hypot(...(await snapshot(page)).vehiclePosition.map((n:number,i:number)=>n-p[i])),{timeout:20000}).toBeGreaterThan(.5);await capture(page,'desktop-vehicle-moving')
  28 |  await navigate(page,'Servicios');await expect.poll(async()=>(await snapshot(page)).interaction).toBe('services');await capture(page,'desktop-service-station')
  29 |  await navigate(page,'Ver fila de espera');await capture(page,'desktop-queue');await navigate(page,'Ver llegada de autos');await capture(page,'desktop-car-entry');await navigate(page,'Lounge');await capture(page,'desktop-lounge');await saveMetrics(page,'desktop-metrics')
  30 |  expect(log.errors).toEqual([]);expect(log.failed).toEqual([])
  31 | })
  32 | test('missing GLB gives recoverable error and resumes immediate entrance',async({page})=>{
  33 |  await page.route('**/models/receptionist.glb',r=>r.fulfill({status:503,body:'asset unavailable'}));await page.goto('/');await expect(page.getByRole('heading',{name:'No se pudo cargar la visita'})).toBeVisible();await capture(page,'desktop-load-error')
  34 |  await page.unroute('**/models/receptionist.glb');await page.getByRole('button',{name:'Reintentar carga'}).click();await page.locator('[data-ready="true"]').waitFor({timeout:60000});expect((await snapshot(page)).entered).toBe(true)
  35 | })
  36 | 
```