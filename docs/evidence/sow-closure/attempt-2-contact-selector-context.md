# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sow.spec.ts >> Solicitud de contacto confirmada llega a administración; sin permiso no se recibe
- Location: tests\e2e\sow.spec.ts:63:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/· Revisada/)
Expected: visible
Error: strict mode violation: getByText(/· Revisada/) resolved to 2 elements:
    1) <small>C-c7934467 · Revisada</small> aka getByText('C-c7934467 · Revisada')
    2) <small>C-546fbce1 · Revisada</small> aka getByText('C-546fbce1 · Revisada')

Call log:
  - Expect "toBeVisible" getByText(/· Revisada/) with timeout 15000ms
  - waiting for getByText(/· Revisada/)

```

# Test source

```ts
  1  | import {test,expect,type Page,type BrowserContext} from '@playwright/test'
  2  | import fs from 'node:fs/promises'
  3  | // Login secrets must never enter traces or videos. Screenshots show only UI.
  4  | test.use({trace:'off',video:'off'})
  5  | const base='http://127.0.0.1:4173',evidence='docs/evidence/sow-closure'
  6  | async function capture(page:Page,name:string){await fs.mkdir(evidence,{recursive:true});if(page.url().endsWith('/admin'))await page.locator('.admin-shell').evaluate(el=>el.scrollTop=0);await page.screenshot({path:`${evidence}/${name}.png`,animations:'disabled'})}
  7  | async function load(page:Page){await page.goto('/');await page.locator('[data-ready=true]').waitFor({timeout:60000})}
  8  | async function visit(page:Page,label:string){await page.getByRole('button',{name:'Visitar',exact:true}).click();await page.getByRole('navigation',{name:'Visitar un área'}).getByRole('button',{name:label}).click();await page.waitForFunction(()=>!(window.__FEBLES__.snapshot() as any).destination)}
  9  | async function login(page:Page){await page.goto('/admin');await page.getByLabel('Clave local de administración').fill((await fs.readFile('server/.local-admin-token','utf8')).trim());await page.getByRole('button',{name:'Entrar al panel local'}).click();await page.getByRole('heading',{name:'Fila, bahías y próximas acciones'}).waitFor()}
  10 | async function session(context:BrowserContext){return (await context.request.get(base+'/api/demo/session')).json()}
  11 | async function post(context:BrowserContext,path:string,data:unknown){const s=await session(context);return context.request.post(base+'/api/demo/'+path,{headers:{Origin:base,'X-Demo-Nonce':s.nonce},data})}
  12 | async function quote(context:BrowserContext){return (await post(context,'quote',{services:['exterior'],vehicle:{type:'car',color:'Azul',contact:'test@example.test'}})).json()}
  13 | const errorsFor=(page:Page)=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));return errors}
  14 | 
  15 | test('Operación vacía, cuenta de sesión, logout real y permisos administrativos',async({browser})=>{
  16 |  const context=await browser.newContext(),page=await context.newPage(),errors=errorsFor(page)
  17 |  await load(page);expect((await page.evaluate(()=>window.__FEBLES__.snapshot()) as any).world.vehicles).toHaveLength(0)
  18 |  const denied=await context.request.get(base+'/api/demo/admin/snapshot');expect(denied.status()).toBe(403)
  19 |  await page.getByRole('button',{name:'Abrir cuenta de Visitante'}).click();await page.getByLabel('Nombre para esta visita').fill('Visitante prueba');await page.getByRole('button',{name:'Guardar perfil'}).click();await expect(page.getByRole('button',{name:'Abrir cuenta de Visitante prueba'})).toBeVisible();await capture(page,'desktop-account')
  20 |  await page.getByRole('button',{name:'Cerrar sesión DEMO'}).click();await expect(page.getByRole('button',{name:'Abrir cuenta de Visitante',exact:true})).toBeVisible()
  21 |  expect((await session(context)).profile.name).toBe('Visitante');expect(errors).toEqual([]);await context.close()
  22 | })
  23 | 
  24 | test('Administración publica contenido y precios; cotización obsoleta se rechaza sin alterar precio aceptado',async({browser})=>{
  25 |  const admin=await browser.newContext(),client=await browser.newContext(),ap=await admin.newPage(),cp=await client.newPage();await login(ap);await load(cp)
  26 |  const original=(await (await admin.request.get(base+'/api/demo/admin/snapshot')).json()).configuration
  27 |  try{
  28 |   const q=await quote(client),config=structuredClone(original);config.business.hours='Horario de prueba · 09:00 a 18:00';config.prices.car.exterior=3600
  29 |   expect((await post(admin,'admin/configuration',{expectedVersion:original.version,configuration:config})).ok()).toBe(true)
  30 |   expect((await post(client,'confirm',{quoteId:q.id,key:q.id})).status()).toBe(409)
  31 |   await visit(cp,'Recepción');await cp.getByRole('button',{name:'Horarios e información',exact:true}).click();await expect(cp.getByText('Horario de prueba · 09:00 a 18:00',{exact:true})).toBeVisible();await capture(cp,'desktop-shared-hours')
  32 |   const fresh=await quote(client),confirmed=await(await post(client,'confirm',{quoteId:fresh.id,key:fresh.id})).json();expect(confirmed.order.quote.total).toBe(4014)
  33 |   const current=(await(await admin.request.get(base+'/api/demo/admin/snapshot')).json()).configuration;current.prices.car.exterior=3700
  34 |   expect((await post(admin,'admin/configuration',{expectedVersion:current.version,configuration:current})).ok()).toBe(true)
  35 |   expect((await session(client)).order.quote.total).toBe(4014)
  36 |   const stale=await post(admin,'admin/configuration',{expectedVersion:original.version,configuration:original});expect(stale.status()).toBe(409)
  37 |   await ap.getByRole('button',{name:'Servicios y precios',exact:true}).click();await capture(ap,'desktop-admin-prices')
  38 |  }finally{const current=(await(await admin.request.get(base+'/api/demo/admin/snapshot')).json()).configuration;await post(admin,'admin/configuration',{expectedVersion:current.version,configuration:original});await admin.close();await client.close()}
  39 | })
  40 | 
  41 | test('Cliente y administrador comparten llegada, fila, bahía, tarea, entrega e historial',async({browser})=>{
  42 |  test.setTimeout(240000)
  43 |  const admin=await browser.newContext(),client=await browser.newContext(),ap=await admin.newPage(),cp=await client.newPage(),errors=errorsFor(cp)
  44 |  await login(ap);await load(cp);const q=await quote(client),confirmed=await(await post(client,'confirm',{quoteId:q.id,key:q.id})).json(),id=confirmed.order.id
  45 |  await visit(cp,'Mi orden');await expect(cp.getByText('Orden confirmada',{exact:true})).toBeVisible()
  46 |  await ap.getByRole('button',{name:new RegExp(id)}).click();await ap.getByRole('button',{name:'Confirmar llegada',exact:true}).click()
  47 |  await cp.waitForFunction(()=>{const s=window.__FEBLES__.snapshot() as any;return s.world.vehicles.length===1&&s.world.vehicles[0].stage==='queued'})
  48 |  await expect(cp.getByText('Turno 1',{exact:true})).toBeVisible();await capture(cp,'desktop-order-queue')
  49 |  await ap.getByRole('button',{name:'Asignar atención',exact:true}).click()
  50 |  await cp.waitForFunction(()=>{const s=window.__FEBLES__.snapshot() as any;return s.world.vehicles[0]?.stage==='washing'&&!s.world.vehicles[0]?.movement},null,{timeout:100000})
  51 |  await visit(cp,'Mi vehículo');await expect(cp.getByText('Bahía 01',{exact:true})).toBeVisible();await capture(cp,'desktop-active-bay');await capture(ap,'desktop-admin-operation')
  52 |  const world=await cp.evaluate(()=>window.__FEBLES__.snapshot()) as any
  53 |  expect(world.world.vehicles[0].worldEntityId).toBe(confirmed.order.worldEntityId||'order-'+id);expect(world.world.vehicles[0].type).toBe('car');expect(JSON.stringify(world.world)).not.toContain('test@example.test')
  54 |  const unauthorized=await post(client,'admin/command',{action:'task',orderId:id,expectedRevision:(await session(client)).order.revision});expect(unauthorized.status()).toBe(403)
  55 |  await ap.getByRole('button',{name:'Completar tarea activa',exact:true}).click();await cp.waitForFunction(()=>(window.__FEBLES__.snapshot() as any).world.vehicles[0]?.stage==='inspection')
  56 |  await ap.getByRole('button',{name:'Completar tarea activa',exact:true}).click();await expect(cp.getByText('Listo para entrega',{exact:true})).toBeVisible();await capture(cp,'desktop-ready')
  57 |  await ap.getByRole('button',{name:'Mover a entrega',exact:true}).click();await cp.waitForFunction(()=>(window.__FEBLES__.snapshot() as any).world.vehicles[0]?.stage==='handover',null,{timeout:100000})
  58 |  await ap.getByRole('button',{name:'Confirmar entrega',exact:true}).click();await expect(cp.getByText('Servicio entregado',{exact:true})).toBeVisible();expect((await session(client)).order.payment).toBe('pending')
  59 |  await cp.reload();await cp.locator('[data-ready=true]').waitFor();await visit(cp,'Mi orden');await expect(cp.getByText('Servicio entregado',{exact:true})).toBeVisible();await capture(cp,'desktop-delivered');expect(errors).toEqual([])
  60 |  await admin.close();await client.close()
  61 | })
  62 | 
  63 | test('Solicitud de contacto confirmada llega a administración; sin permiso no se recibe',async({browser})=>{
  64 |  const admin=await browser.newContext(),client=await browser.newContext(),ap=await admin.newPage(),cp=await client.newPage();await login(ap);await load(cp)
  65 |  const original=(await(await admin.request.get(base+'/api/demo/admin/snapshot')).json()).configuration
  66 |  try{
  67 |   const denied=await post(client,'contact',{question:'Consulta de prueba',contact:'test@example.test',confirmed:true,key:'not-enabled'});expect(denied.status()).toBe(409)
  68 |   const enabled=structuredClone(original);enabled.business.contactRequestsAvailable=true;await post(admin,'admin/configuration',{expectedVersion:original.version,configuration:enabled})
  69 |   await visit(cp,'Recepción');await cp.getByRole('button',{name:/Preguntar a Ana/}).click();await cp.getByRole('button',{name:'Tengo otra pregunta'}).click();await cp.getByLabel('Tu pregunta').fill('Consulta de prueba sobre cuidado especial');await cp.getByRole('button',{name:'Revisar mi consulta'}).click();await cp.getByLabel('Contacto para responder').fill('test@example.test');await cp.getByRole('button',{name:'Confirmar y enviar solicitud'}).click();await expect(cp.getByText(/Solicitud recibida por recepción local/)).toBeVisible();await capture(cp,'desktop-contact-receipt')
> 70 |   await ap.getByRole('button',{name:'Contenido y atención',exact:true}).click();await expect(ap.getByText('Consulta de prueba sobre cuidado especial',{exact:true})).toBeVisible();await capture(ap,'desktop-admin-contact');await ap.getByRole('button',{name:'Marcar revisada',exact:true}).click();await expect(ap.getByText(/· Revisada/)).toBeVisible()
     |                                                                                                                                                                                                                                                                                                                                                ^ Error: expect(locator).toBeVisible() failed
  71 |  }finally{const current=(await(await admin.request.get(base+'/api/demo/admin/snapshot')).json()).configuration;await post(admin,'admin/configuration',{expectedVersion:current.version,configuration:original});await admin.close();await client.close()}
  72 | })
  73 | 
  74 | test('Móvil: recepción, cinco displays accesibles, navegación, cuenta y administración',async({browser})=>{
  75 |  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=errorsFor(page)
  76 |  await load(page);await capture(page,'mobile-entry');await visit(page,'Recepción');await capture(page,'mobile-reception');await expect(page.locator('.counter-display')).toHaveCount(5)
  77 |  await page.getByRole('button',{name:'Conocer servicios',exact:false}).click();await capture(page,'mobile-services');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Abrir cuenta de Visitante',exact:true}).click();await capture(page,'mobile-account');await page.getByRole('button',{name:'Cerrar Cuenta',exact:true}).click()
  78 |  await page.getByRole('button',{name:'Cómo funciona',exact:true}).click();await capture(page,'mobile-flow');await page.getByRole('button',{name:'Cerrar cómo funciona',exact:true}).click()
  79 |  await login(page);await capture(page,'mobile-admin-operation');await page.getByRole('button',{name:'Servicios y precios',exact:true}).click();await capture(page,'mobile-admin-prices');expect(errors).toEqual([]);await context.close()
  80 | })
  81 | 
```