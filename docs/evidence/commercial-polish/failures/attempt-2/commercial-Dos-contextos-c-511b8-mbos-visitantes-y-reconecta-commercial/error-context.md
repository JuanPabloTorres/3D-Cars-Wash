# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: commercial.spec.ts >> Dos contextos: comando DEMO del servidor llega a ambos visitantes y reconecta
- Location: tests\e2e\commercial.spec.ts:27:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Datos sin actualizar', { exact: true })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Datos sin actualizar', { exact: true }) with timeout 15000ms
  - waiting for getByText('Datos sin actualizar', { exact: true })

```

```yaml
- 'main "Febles Car Wash: visita tridimensional"':
  - text: FEBLES · DEMO Simulación conectada
  - button "Visitar":
    - img
    - text: Visitar
  - button "Ayuda de la visita":
    - img
  - text: BIENVENIDO A FEBLES
  - heading "Tu auto, en buenas manos." [level=1]
  - paragraph: Conoce nuestros servicios y prepara tu visita.
  - button "Ir a recepción":
    - text: Ir a recepción
    - img
  - text: Bienvenido a Febles
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test'
  2  | import fs from 'node:fs/promises'
  3  | const evidence='docs/evidence/commercial-polish/final'
  4  | const snap=(p:Page)=>p.evaluate(()=>window.__FEBLES__.snapshot() as any)
  5  | async function ready(p:Page,url='/?tools=demo'){await p.goto(url);await p.locator('[data-ready=true]').waitFor({timeout:60000});await expect(p.getByText('Simulación conectada',{exact:true})).toBeVisible()}
  6  | async function visit(p:Page,label:string){await p.getByRole('button',{name:'Visitar',exact:true}).click();await p.getByRole('navigation',{name:'Visitar un área'}).getByRole('button',{name:label}).click();await p.waitForFunction(()=>!(window.__FEBLES__.snapshot() as any).destination)}
  7  | async function capture(p:Page,name:string){await fs.mkdir(evidence,{recursive:true});await p.screenshot({path:`${evidence}/${name}.png`,animations:'disabled'})}
  8  | async function select(p:Page){await visit(p,'Recepción');await p.getByRole('button',{name:/Conocer servicios/}).click();await p.getByRole('button',{name:'Añadir Lavado exterior',exact:true}).click();await p.getByRole('button',{name:'Añadir Cuidado interior',exact:true}).click();await p.getByRole('button',{name:'Continuar',exact:true}).click()}
  9  | async function quote(p:Page){await select(p);await p.getByRole('button',{name:'Revisar cotización',exact:true}).click();await expect(p.getByText('$61.33',{exact:true})).toBeVisible()}
  10 | const errorsFor=(p:Page)=>{const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});return errors}
  11 | test('Área útil, cuatro opciones, transición breve y solo última selección',async({page})=>{
  12 |  const errors=errorsFor(page);await ready(page,'/');await capture(page,'desktop-entry');await page.getByRole('button',{name:'Visitar',exact:true}).click();const nav=page.getByRole('navigation',{name:'Visitar un área'});await expect(nav.getByRole('button')).toHaveCount(5);await capture(page,'desktop-menu');const started=Date.now();await nav.getByRole('button',{name:/Recepción/}).click();await page.getByRole('dialog',{name:'Ana · Recepción'}).waitFor();const arrivalMs=Date.now()-started;expect(arrivalMs).toBeLessThan(2500);await capture(page,'desktop-reception');await expect(page.locator('.joystick')).toHaveCount(0);await expect(page.getByText(/Caminar|WASD/)).toHaveCount(0)
  13 |  await page.getByRole('button',{name:'Visitar',exact:true}).click();await page.getByRole('button',{name:/El local/}).click();await page.getByRole('button',{name:'Visitar',exact:true}).click();await page.getByRole('navigation').getByRole('button',{name:/Mi orden/}).click();await page.getByRole('dialog',{name:'Mi orden',exact:true}).waitFor();await expect(page.getByText('Aún no tienes una orden')).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(1);expect((await snap(page)).activeView).toBe('reception');await page.waitForTimeout(1300);await expect(page.getByRole('dialog',{name:'Mi orden',exact:true})).toBeVisible();await fs.writeFile(`${evidence}/navigation.json`,JSON.stringify({arrivalMs,errors},null,2));expect(errors).toEqual([])
  14 | })
  15 | test('Servicios, validación, volver, confirmación, recuperación y cancelación aceptada',async({page})=>{
  16 |  const errors=errorsFor(page);await ready(page);await select(page);await page.getByRole('textbox',{name:/Correo o teléfono/}).fill('incompleto');await page.getByRole('button',{name:'Revisar cotización',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Revisa el correo');await capture(page,'desktop-registration');await page.getByRole('textbox',{name:/Correo o teléfono/}).fill('');await page.getByRole('button',{name:'Volver',exact:true}).click();await expect(page.getByRole('button',{name:'Quitar Lavado exterior'})).toBeVisible();await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Revisar cotización',exact:true}).click();await expect(page.getByText('$61.33',{exact:true})).toBeVisible();await capture(page,'desktop-quote');await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();await visit(page,'Recepción');await expect(page.getByText('$61.33',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Confirmar orden DEMO',exact:true}).dblclick();await expect(page.getByRole('dialog',{name:'Mi orden',exact:true})).toBeVisible();await expect(page.getByText('Orden confirmada',{exact:true})).toBeVisible();await expect(page.getByText('Llegada pendiente',{exact:true})).toBeVisible();await capture(page,'desktop-order');const id=await page.locator('.order-summary small').textContent();await page.reload();await page.locator('[data-ready=true]').waitFor();expect((await snap(page)).activeView).toBe('entrance');await visit(page,'Mi orden');await expect(page.locator('.order-summary small')).toHaveText(id!);await page.getByRole('button',{name:'Ampliar detalles'}).click();await page.getByRole('button',{name:'Solicitar cancelación',exact:true}).click();await page.getByRole('button',{name:'Conservar mi orden'}).click();await expect(page.getByText('Orden confirmada',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Solicitar cancelación',exact:true}).click();await page.getByRole('button',{name:'Sí, solicitar cancelación'}).click();await expect(page.getByText('Orden cancelada',{exact:true})).toBeVisible();expect(errors).toEqual([])
  17 | })
  18 | test('Fallo de red conserva borrador y no crea éxito',async({page})=>{
  19 |  await ready(page);await select(page);await page.route('**/api/demo/quote',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Proveedor temporalmente indisponible.'})}));await page.getByRole('button',{name:'Revisar cotización',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Proveedor temporalmente');await expect(page.getByText('Orden confirmada',{exact:true})).toHaveCount(0);await page.unroute('**/api/demo/quote');await page.getByRole('button',{name:'Reintentar conexión'}).click();await expect(page.getByRole('button',{name:'Revisar cotización'})).toBeEnabled();await page.getByRole('button',{name:'Volver',exact:true}).click();await expect(page.getByRole('button',{name:'Quitar Lavado exterior'})).toBeVisible()
  20 | })
  21 | test('Cancelación rechazada por proveedor tras comenzar atención',async({page})=>{
  22 |  await ready(page);await quote(page);await page.getByRole('button',{name:'Confirmar orden DEMO'}).click();await page.getByRole('button',{name:'Ayuda de la visita'}).click();await page.getByRole('button',{name:'Asignar atención DEMO'}).click();await page.getByRole('button',{name:'Cerrar Tu visita a Febles'}).click();await visit(page,'Mi orden');await page.getByRole('button',{name:'Ampliar detalles'}).click();await page.getByRole('button',{name:'Solicitar cancelación',exact:true}).click();await page.getByRole('button',{name:'Sí, solicitar cancelación'}).click();await expect(page.getByRole('alert')).toContainText('La atención ya comenzó');await expect(page.getByText('Orden cancelada',{exact:true})).toHaveCount(0)
  23 | })
  24 | test('El local contiene datos útiles en bahías, cola y espera',async({page})=>{
  25 |  const errors=errorsFor(page);await ready(page);await visit(page,'El local');await expect(page.getByRole('dialog',{name:'Bahía 01'})).toBeVisible();await capture(page,'desktop-bay');await page.getByText('Consultar otra zona del local',{exact:true}).click();await page.getByRole('button',{name:/Bahía 04/}).click();await expect(page.getByRole('dialog',{name:'Bahía 04'})).toContainText('Fuera de servicio');await page.getByText('Consultar otra zona del local',{exact:true}).click();await page.getByRole('button',{name:'Cola y turno'}).click();await expect(page.getByRole('dialog',{name:'Fila de espera'})).toContainText('posiciones físicas');await capture(page,'desktop-queue');await page.getByText('Consultar otra zona del local',{exact:true}).click();await page.getByRole('button',{name:'Espera y mi orden'}).click();await expect(page.getByRole('button',{name:'Consultar mi orden',exact:true})).toBeVisible();await capture(page,'desktop-lounge');expect(errors).toEqual([])
  26 | })
  27 | test('Dos contextos: comando DEMO del servidor llega a ambos visitantes y reconecta',async({browser})=>{
> 28 |  const admin=await browser.newContext(),visitor=await browser.newContext();const a=await admin.newPage(),v=await visitor.newPage();await ready(a,'/?tools=demo&scenario=busy');await ready(v,'/?scenario=busy');const bootstrap=await (await a.request.get('/api/demo/session')).json();const command=async(action:string,extra={})=>a.request.post('/api/demo/tools?scenario=busy&speed=1',{headers:{Origin:'http://127.0.0.1:4173','X-Demo-Nonce':bootstrap.nonce},data:{sandbox:true,action,...extra}});await command('pause',{paused:true});await command('reset');await v.waitForFunction(()=>(window.__FEBLES__.snapshot() as any).paused);const revision=(await snap(v)).world.revision;const started=Date.now();await command('advance');await v.waitForFunction(r=>(window.__FEBLES__.snapshot() as any).world.revision>r,revision);const latencyMs=Date.now()-started,s1=await snap(a),s2=await snap(v);expect(s1.world.vehicles.find((v:any)=>v.worldEntityId==='demo-vehicle-01').stage).toBe('interior');expect(s2.world.vehicles).toEqual(s1.world.vehicles);await visitor.setOffline(true);await expect(v.getByText('Datos sin actualizar',{exact:true})).toBeVisible();await command('advance');await visitor.setOffline(false);await v.waitForFunction(()=>(window.__FEBLES__.snapshot() as any).world.vehicles.find((v:any)=>v.worldEntityId==='demo-vehicle-01').stage==='lights');expect(new Set((await snap(v)).world.vehicles.map((v:any)=>v.worldEntityId)).size).toBe(7);await fs.mkdir(evidence,{recursive:true});await fs.writeFile(`${evidence}/two-context-sync.json`,JSON.stringify({latencyMs,scope:'local DEMO SSE; not production administrator',revisionBefore:revision,revisionAfter:(await snap(v)).world.revision},null,2));await admin.close();await visitor.close()
     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ^ Error: expect(locator).toBeVisible() failed
  29 | })
  30 | test('Móvil: navegación, servicios y formulario visibles sin tapar el rostro',async({browser})=>{
  31 |  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await context.newPage();const errors=errorsFor(p);await ready(p,'/');await capture(p,'mobile-entry');await visit(p,'Recepción');await capture(p,'mobile-reception');await p.getByRole('button',{name:/Conocer servicios/}).click();await capture(p,'mobile-services');const panel=await p.getByRole('dialog').boundingBox();expect(panel!.y).toBeGreaterThan(300);await p.getByRole('button',{name:'Añadir Lavado exterior'}).click();await p.getByRole('button',{name:'Continuar',exact:true}).click();await p.getByRole('textbox',{name:/Correo o teléfono/}).fill('demo@example.test');await capture(p,'mobile-registration');await p.getByRole('button',{name:'Revisar cotización'}).click();await expect(p.getByText('$39.03',{exact:true})).toBeVisible();await p.getByRole('button',{name:'Confirmar orden DEMO'}).click();await capture(p,'mobile-order');for(const b of await p.getByRole('dialog').getByRole('button').all()){if(await b.isVisible()){const box=await b.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(43);expect(box!.height).toBeGreaterThanOrEqual(43)}}expect(errors).toEqual([]);await context.close()
  32 | })
  33 | test('Movimiento reducido, foco y fallo GLB sin carga eterna',async({page,context})=>{
  34 |  await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await visit(page,'Recepción');await page.keyboard.press('Tab');expect(await page.getByRole('dialog').evaluate(e=>e.contains(document.activeElement))).toBe(true);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);const p=await context.newPage();await p.route('**/models/vehicle.glb',r=>r.fulfill({status:503,body:'unavailable'}));await p.goto('/');await expect(p.getByRole('heading',{name:'No se pudo cargar la visita'})).toBeVisible({timeout:60000});await expect(p.locator('.loading-overlay')).toHaveCount(0);await capture(p,'asset-error');await p.close()
  35 | })
  36 | 
```