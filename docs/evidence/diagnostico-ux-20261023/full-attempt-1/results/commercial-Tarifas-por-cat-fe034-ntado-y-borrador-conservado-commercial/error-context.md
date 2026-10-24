# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: commercial.spec.ts >> Tarifas por categoría sin precio inventado y borrador conservado
- Location: tests\e2e\commercial.spec.ts:81:1

# Error details

```
TimeoutError: locator.waitFor: Timeout 60000ms exceeded.
Call log:
  - waiting for locator('[data-ready=true]') to be visible

```

# Test source

```ts
  1   | import {test,expect,type Page} from '@playwright/test'
  2   | import fs from 'node:fs/promises'
  3   | const evidence=`${process.env.CARWASH_EVIDENCE_DIR||'docs/evidence/pilot-20261023/after'}/e2e-commercial`
  4   | const snap=(p:Page)=>p.evaluate(()=>window.__FEBLES__.snapshot() as any)
> 5   | async function ready(p:Page,url='/?tools=demo&scenario=mixed'){await p.goto(url);await p.locator('[data-ready=true]').waitFor({timeout:60000});await expect(p.getByText('Simulación conectada',{exact:true})).toBeVisible()}
      |                                                                                                                       ^ TimeoutError: locator.waitFor: Timeout 60000ms exceeded.
  6   | async function visit(p:Page,label:string){await p.getByRole('button',{name:/^Visitar(?: Orden activa)?$/}).click();await p.getByRole('navigation',{name:'Visitar un área'}).getByRole('button',{name:label}).click();await p.waitForFunction(()=>!(window.__FEBLES__.snapshot() as any).destination)}
  7   | async function capture(p:Page,name:string){await fs.mkdir(evidence,{recursive:true});await p.screenshot({path:`${evidence}/${name}.png`,animations:'disabled'})}
  8   | async function select(p:Page){await visit(p,'Recepción');await p.getByRole('button',{name:/Conocer servicios/}).click();await p.getByRole('button',{name:'Añadir Lavado exterior',exact:true}).click();await p.getByRole('button',{name:'Añadir Cuidado interior',exact:true}).click();await p.getByRole('button',{name:'Continuar',exact:true}).click()}
  9   | async function quote(p:Page){await select(p);await p.getByRole('button',{name:'Revisar cotización',exact:true}).click();await expect(p.getByText('$61.33',{exact:true})).toBeVisible()}
  10  | const errorsFor=(p:Page)=>{const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});return errors}
  11  | 
  12  | test('Los cuatro objetos del mostrador abren funciones reales sin perder selección',async({page})=>{
  13  |  // The cold WebGL load belongs to this full four-object flow's budget.
  14  |  test.setTimeout(150000)
  15  |  const errors=errorsFor(page)
  16  |  await ready(page);await visit(page,'Recepción')
  17  |  const closePanel=async()=>{await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await page.waitForTimeout(300)}
  18  |  await closePanel()
  19  |  // Visible spatial DOM controls follow the counter in world coordinates; no fixed pixel proxies.
  20  |  await page.getByRole('button',{name:'Abrir Servicios del mostrador',exact:true}).click()
  21  |  await expect(page.getByText('El cuidado que tu auto necesita.',{exact:true})).toBeVisible()
  22  |  await page.getByRole('button',{name:'Añadir Lavado exterior',exact:true}).click()
  23  |  await closePanel();await page.getByRole('button',{name:'Abrir Horarios del mostrador',exact:true}).click()
  24  |  await expect(page.getByRole('dialog',{name:'Horarios',exact:true})).toBeVisible()
  25  |  await expect(page.getByRole('heading',{name:'Horarios',exact:true})).toBeVisible()
  26  |  await closePanel();await page.getByRole('button',{name:'Abrir El local del mostrador',exact:true}).click()
  27  |  await expect(page.getByRole('dialog',{name:'Información del establecimiento',exact:true})).toBeVisible()
  28  |  await expect(page.getByRole('heading',{name:'Información del establecimiento',exact:true})).toBeVisible()
  29  |  await closePanel();await page.getByRole('button',{name:'Abrir Preguntas del mostrador',exact:true}).click()
  30  |  await expect(page.getByRole('button',{name:'Servicios disponibles',exact:true})).toBeVisible()
  31  |  await closePanel();await page.getByRole('button',{name:'Abrir Servicios del mostrador',exact:true}).click()
  32  |  await expect(page.getByRole('button',{name:'Quitar Lavado exterior',exact:true})).toBeVisible()
  33  |  // Preparing an order remains a reception action after the fifth display is removed.
  34  |  await page.getByRole('button',{name:'Volver',exact:true}).click()
  35  |  await page.getByRole('button',{name:/Retomar mi solicitud/}).click()
  36  |  await expect(page.getByLabel('Tipo de vehículo')).toBeVisible()
  37  |  await page.getByRole('button',{name:'Volver',exact:true}).click()
  38  |  await expect(page.getByRole('button',{name:'Quitar Lavado exterior',exact:true})).toBeVisible()
  39  |  await capture(page,'desktop-counter-interaction');expect(errors).toEqual([])
  40  | })
  41  | test('Área útil, cuatro opciones, transición breve y solo última selección',async({page})=>{
  42  |  const errors=errorsFor(page);await ready(page,'/');await capture(page,'desktop-entry');await page.getByRole('button',{name:'Visitar',exact:true}).click();const nav=page.getByRole('navigation',{name:'Visitar un área'});await expect(nav.getByRole('button')).toHaveCount(5);await capture(page,'desktop-menu');const started=Date.now();await nav.getByRole('button',{name:/Recepción/}).click();await page.getByRole('dialog',{name:'Ana · Recepción'}).waitFor();const arrivalMs=Date.now()-started;expect(arrivalMs).toBeLessThan(2500);await capture(page,'desktop-reception');await expect(page.locator('.joystick')).toHaveCount(0);await expect(page.getByText(/Caminar|WASD/)).toHaveCount(0)
  43  |  await page.getByRole('button',{name:'Visitar',exact:true}).click();await page.getByRole('button',{name:/El local/}).click();await page.getByRole('button',{name:'Visitar',exact:true}).click();await page.getByRole('navigation').getByRole('button',{name:/Mi orden/}).click();await page.getByRole('dialog',{name:'Mi orden',exact:true}).waitFor();await expect(page.getByText('Aún no tienes una orden')).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(1);expect((await snap(page)).activeView).toBe('reception');await page.waitForTimeout(1300);await expect(page.getByRole('dialog',{name:'Mi orden',exact:true})).toBeVisible();await fs.writeFile(`${evidence}/navigation.json`,JSON.stringify({arrivalMs,errors},null,2));expect(errors).toEqual([])
  44  | })
  45  | test('Servicios, validación, volver, confirmación, recuperación y cancelación aceptada',async({page})=>{
  46  |  const errors=errorsFor(page);await ready(page);await select(page);await page.getByRole('textbox',{name:/Correo o teléfono/}).fill('incompleto');await page.getByRole('button',{name:'Revisar cotización',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Revisa el correo');await capture(page,'desktop-registration');await page.getByRole('textbox',{name:/Correo o teléfono/}).fill('');await page.getByRole('button',{name:'Volver',exact:true}).click();await expect(page.getByRole('button',{name:'Quitar Lavado exterior'})).toBeVisible();await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Revisar cotización',exact:true}).click();await expect(page.getByText('$61.33',{exact:true})).toBeVisible();await capture(page,'desktop-quote');await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();await visit(page,'Recepción');await expect(page.getByText('$61.33',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Confirmar orden DEMO',exact:true}).dblclick();await expect(page.getByRole('dialog',{name:'Mi orden',exact:true})).toBeVisible();await expect(page.getByText('Orden confirmada',{exact:true})).toBeVisible();await expect(page.getByText('Llegada pendiente',{exact:true})).toBeVisible();await capture(page,'desktop-order');const id=await page.locator('.order-summary small').textContent();await page.reload();await page.locator('[data-ready=true]').waitFor();expect((await snap(page)).activeView).toBe('entrance');await visit(page,'Mi orden');await expect(page.locator('.order-summary small')).toHaveText(id!);await page.getByRole('button',{name:'Ampliar detalles'}).click();await page.getByRole('button',{name:'Solicitar cancelación',exact:true}).click();await page.getByRole('button',{name:'Conservar mi orden'}).click();await expect(page.getByText('Orden confirmada',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Solicitar cancelación',exact:true}).click();await page.getByRole('button',{name:'Sí, solicitar cancelación'}).click();await expect(page.getByText('Orden cancelada',{exact:true})).toBeVisible();expect(errors).toEqual([])
  47  | })
  48  | test('Fallo de red conserva borrador y no crea éxito',async({page})=>{
  49  |  await ready(page);await select(page);await page.route('**/api/demo/quote',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Proveedor temporalmente indisponible.'})}));await page.getByRole('button',{name:'Revisar cotización',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Proveedor temporalmente');await expect(page.getByText('Orden confirmada',{exact:true})).toHaveCount(0);await page.unroute('**/api/demo/quote');await page.getByRole('button',{name:'Reintentar conexión'}).click();await expect(page.getByRole('button',{name:'Revisar cotización'})).toBeEnabled();await page.getByRole('button',{name:'Volver',exact:true}).click();await expect(page.getByRole('button',{name:'Quitar Lavado exterior'})).toBeVisible()
  50  | })
  51  | test('Cancelación rechazada por proveedor tras comenzar atención',async({page})=>{
  52  |  await ready(page);const bootstrap=await(await page.request.get('/api/demo/session')).json();for(const command of [{action:'pause',paused:true},{action:'reset'}]){const r=await page.request.post('/api/demo/tools?scenario=mixed&speed=1',{headers:{Origin:'http://127.0.0.1:4173','X-Demo-Nonce':bootstrap.nonce},data:{sandbox:true,...command}});expect(r.ok()).toBe(true)}await quote(page);await page.getByRole('button',{name:'Confirmar orden DEMO'}).click();await page.getByRole('button',{name:'Ayuda de la visita'}).click();const assigned=page.waitForResponse(r=>r.url().includes('/api/demo/tools')&&r.request().postData()?.includes('start-order')===true);await page.getByRole('button',{name:'Asignar atención DEMO'}).click();expect((await assigned).ok()).toBe(true);await page.getByRole('button',{name:/Cerrar Tu visita a/}).click();await visit(page,'Mi orden');await page.getByRole('button',{name:'Ampliar detalles'}).click();await page.getByRole('button',{name:'Solicitar cancelación',exact:true}).click();await page.getByRole('button',{name:'Sí, solicitar cancelación'}).click();await expect(page.getByRole('alert')).toContainText('La atención ya comenzó');await expect(page.getByText('Orden cancelada',{exact:true})).toHaveCount(0)
  53  | })
  54  | test('El local contiene datos útiles en bahías, cola y espera',async({page})=>{
  55  |  const errors=errorsFor(page);await ready(page);await visit(page,'El local');await page.getByRole('button',{name:/Bahía 01/}).click();await expect(page.getByRole('dialog',{name:'Bahía 01'})).toBeVisible();await capture(page,'desktop-bay');await page.getByText('Consultar otra zona del local',{exact:true}).click();await page.getByRole('button',{name:/Bahía 04/}).click();await expect(page.getByRole('dialog',{name:'Bahía 04'})).toContainText('Fuera de servicio');await page.getByText('Consultar otra zona del local',{exact:true}).click();await page.getByRole('button',{name:'Fila de espera',exact:true}).click();await expect(page.getByRole('dialog',{name:'Fila de espera'})).toContainText('posiciones físicas');await capture(page,'desktop-queue');await page.getByText('Consultar otra zona del local',{exact:true}).click();await page.getByRole('button',{name:'Lounge · Sala de espera',exact:true}).click();await expect(page.getByRole('button',{name:'Preparar mi orden',exact:true})).toBeVisible();await capture(page,'desktop-lounge');expect(errors).toEqual([])
  56  | })
  57  | test('Dos contextos: comando DEMO del servidor llega a ambos visitantes y reconecta',async({browser})=>{
  58  |  const admin=await browser.newContext(),visitor=await browser.newContext();const a=await admin.newPage(),v=await visitor.newPage();await ready(a,'/?tools=demo&scenario=busy');await ready(v,'/?scenario=busy');const bootstrap=await (await a.request.get('/api/demo/session')).json();const command=async(action:string,extra={})=>a.request.post('/api/demo/tools?scenario=busy&speed=1',{headers:{Origin:'http://127.0.0.1:4173','X-Demo-Nonce':bootstrap.nonce},data:{sandbox:true,action,...extra}});await command('pause',{paused:true});await command('reset');await v.waitForFunction(()=>(window.__FEBLES__.snapshot() as any).paused);const revision=(await snap(v)).world.revision;const started=Date.now();await command('advance');await v.waitForFunction(r=>(window.__FEBLES__.snapshot() as any).world.revision>r,revision);const latencyMs=Date.now()-started,s1=await snap(a),s2=await snap(v);expect(s1.world.vehicles.find((v:any)=>v.worldEntityId==='demo-vehicle-01').stage).toBe('interior');expect(s2.world.vehicles).toEqual(s1.world.vehicles);await visitor.setOffline(true);await expect(v.getByText('Datos sin actualizar',{exact:true})).toBeVisible();await command('advance');await visitor.setOffline(false);await v.waitForFunction(()=>(window.__FEBLES__.snapshot() as any).world.vehicles.find((v:any)=>v.worldEntityId==='demo-vehicle-01').stage==='lights');expect(new Set((await snap(v)).world.vehicles.map((v:any)=>v.worldEntityId)).size).toBe(7);await fs.mkdir(evidence,{recursive:true});await fs.writeFile(`${evidence}/two-context-sync.json`,JSON.stringify({latencyMs,scope:'local DEMO SSE; not production administrator',revisionBefore:revision,revisionAfter:(await snap(v)).world.revision},null,2));await admin.close();await visitor.close()
  59  | })
  60  | test('Móvil: navegación, servicios y formulario visibles sin tapar el rostro',async({browser})=>{
  61  |  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await context.newPage();const errors=errorsFor(p);await ready(p,'/');await capture(p,'mobile-entry');await visit(p,'Recepción');await capture(p,'mobile-reception');await p.getByRole('button',{name:/Conocer servicios/}).click();await capture(p,'mobile-services');const panel=await p.getByRole('dialog').boundingBox();expect(panel!.y).toBeGreaterThan(300);await p.getByRole('button',{name:'Añadir Lavado exterior'}).click();await p.getByRole('button',{name:'Continuar',exact:true}).click();await p.getByRole('textbox',{name:/Correo o teléfono/}).fill('demo@example.test');await capture(p,'mobile-registration');await p.getByRole('button',{name:'Revisar cotización'}).click();await expect(p.getByText('$39.03',{exact:true})).toBeVisible();await p.getByRole('button',{name:'Confirmar orden DEMO'}).click();await capture(p,'mobile-order');for(const b of await p.getByRole('dialog').getByRole('button').all()){if(await b.isVisible()){const box=await b.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(43);expect(box!.height).toBeGreaterThanOrEqual(43)}}expect(errors).toEqual([]);await context.close()
  62  | })
  63  | test('Movimiento reducido, foco y fallo GLB sin carga eterna',async({page,context})=>{
  64  |  await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await visit(page,'Recepción');await page.keyboard.press('Tab');expect(await page.getByRole('dialog').evaluate(e=>e.contains(document.activeElement))).toBe(true);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);const p=await context.newPage();await p.route('**/models/receptionist.glb',r=>r.fulfill({status:503,body:'unavailable'}));await p.goto('/');await expect(p.getByRole('heading',{name:'No se pudo cargar la visita'})).toBeVisible({timeout:60000});await expect(p.locator('.loading-overlay')).toHaveCount(0);await capture(p,'asset-error');await p.close()
  65  | })
  66  | test('API DEMO valida importes, idempotencia y aislamiento entre sesiones',async({browser})=>{
  67  |  const first=await browser.newContext(),other=await browser.newContext();const session=await (await first.request.get('http://127.0.0.1:4173/api/demo/session')).json();const base='http://127.0.0.1:4173/api/demo/',headers={Origin:'http://127.0.0.1:4173','X-Demo-Nonce':session.nonce};
  68  |  const quote=await (await first.request.post(base+'quote',{headers,data:{services:['exterior','interior'],vehicle:{type:'car',color:'Azul',contact:''},total:1}})).json();expect(quote.total).toBe(6133);expect(quote.vehicle.type).toBe('car');const commands=await Promise.all([1,2].map(()=>first.request.post(base+'confirm',{headers,data:{quoteId:quote.id,key:quote.id}})));const [a,b]=await Promise.all(commands.map(r=>r.json()));expect(a.order.id).toBe(b.order.id);expect(a.order.payment).toBe('pending');expect(a.order.attention).toBe('not-arrived');const privateSession=await(await other.request.get(base+'session')).json();expect(privateSession.order).toBeNull();const denied=await other.request.post(base+'cancel',{headers:{Origin:'http://127.0.0.1:4173','X-Demo-Nonce':privateSession.nonce},data:{orderId:a.order.id}});expect(denied.status()).toBe(404);const csrf=await first.request.post(base+'cancel',{headers:{Origin:'https://foreign.example','X-Demo-Nonce':session.nonce},data:{orderId:a.order.id}});expect(csrf.status()).toBe(403);await first.close();await other.close()
  69  | })
  70  | test('Cotización vencida se renueva y no confirma datos caducados',async({page})=>{
  71  |  await ready(page);await select(page);let first=true;await page.route('**/api/demo/quote',async route=>{const response=await route.fetch(),quote=await response.json();if(first){first=false;quote.expiresAt=Date.now()-1000}await route.fulfill({response,json:quote})});await page.getByRole('button',{name:'Revisar cotización'}).click();await expect(page.getByText(/La cotización venció/)).toBeVisible();await page.getByRole('button',{name:'Actualizar cotización'}).click();await expect(page.getByRole('button',{name:'Confirmar orden DEMO'})).toBeVisible();await expect(page.getByText('Orden confirmada',{exact:true})).toHaveCount(0)
  72  | })
  73  | test('Ruedas observables: cuatro conjuntos giran con el desplazamiento y paran',async({page})=>{
  74  |  await ready(page,'/?tools=demo&scenario=arrival');await page.getByRole('button',{name:'Ayuda de la visita'}).click();await page.getByRole('button',{name:'Reiniciar DEMO'}).click();await page.getByRole('button',{name:/Cerrar Tu visita a/}).click();await visit(page,'El local');await page.waitForFunction(()=>{const s=window.__FEBLES__.snapshot() as any;return s.vehicles['demo-vehicle-01']?.wheels?.count===4&&Math.abs(s.vehicles['demo-vehicle-01'].wheels.wheelAngle)>1});const before=(await snap(page)).vehicles['demo-vehicle-01'];await page.waitForTimeout(700);const after=(await snap(page)).vehicles['demo-vehicle-01'];const distance=Math.hypot(after.position[0]-before.position[0],after.position[1]-before.position[1]);expect(distance).toBeGreaterThan(.1);expect(Math.abs(after.wheels.wheelAngle-before.wheels.wheelAngle)).toBeCloseTo(distance/after.wheels.radius,0);await page.getByRole('button',{name:'Ayuda de la visita'}).click();await page.getByRole('button',{name:'Pausar DEMO'}).click();await page.waitForFunction(()=>(window.__FEBLES__.snapshot() as any).paused);const frozen=(await snap(page)).vehicles['demo-vehicle-01'];await page.waitForTimeout(500);expect((await snap(page)).vehicles['demo-vehicle-01'].wheels.wheelAngle).toBe(frozen.wheels.wheelAngle);await fs.writeFile(`${evidence}/wheel-motion.json`,JSON.stringify({before,after,pausedAngle:frozen.wheels.wheelAngle},null,2))
  75  | })
  76  | test('Ambientes conservados: seis climas legibles con errores de página ausentes',async({page})=>{
  77  |  const errors=errorsFor(page);await ready(page);await page.getByRole('button',{name:'Ayuda de la visita'}).click();for(const [label,kind,exposure] of [['Soleado','sunny',1.05],['Parcialmente nublado','partly-cloudy',1.04],['Nublado','overcast',.95],['Lluvia','rain',.83],['Atardecer','sunset',.92],['Noche','night',.8]] as const){await page.getByRole('button',{name:label,exact:true}).click();await page.waitForFunction(({kind,exposure})=>{const s=window.__FEBLES__.snapshot() as any;return s.weather.kind===kind&&Math.abs(s.weather.exposure-exposure)<.04},{kind,exposure});await capture(page,`weather-${kind}`)}expect(errors).toEqual([])
  78  | })
  79  | 
  80  | 
  81  | test('Tarifas por categoría sin precio inventado y borrador conservado',async({page})=>{
  82  |  await ready(page);await visit(page,'Recepción');await page.getByRole('button',{name:/Conocer servicios/}).click();
  83  |  await page.getByLabel('Tarifas por vehículo').selectOption('suv');await expect(page.getByText('Requiere cotización',{exact:false})).toHaveCount(3);
  84  |  await page.getByRole('button',{name:'Añadir Lavado exterior'}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.getByLabel('Tipo de vehículo')).toHaveValue('suv');
  85  |  await page.getByRole('button',{name:'Revisar cotización'}).click();await expect(page.getByRole('alert')).toContainText('Requiere cotización');await expect(page.getByText('Confirmar orden DEMO',{exact:true})).toHaveCount(0);await expect(page.getByText('Sin conexión con el proveedor DEMO.',{exact:false})).toHaveCount(0);
  86  |  await capture(page,'category-quotation-required');await page.getByLabel('Tipo de vehículo').selectOption('car');await page.getByRole('button',{name:'Revisar cotización'}).click();await expect(page.getByText('$39.03',{exact:true})).toBeVisible();
  87  | })
  88  | 
  89  | test('Preguntas autorizadas, horario desconocido y consulta nunca enviada sin backend',async({page})=>{
  90  |  await ready(page);await visit(page,'Recepción');await page.getByRole('button',{name:'Siguiente mensaje',exact:false}).click();await expect(page.getByText('Cuidamos el exterior, el interior y los focos de tu vehículo.',{exact:true})).toBeVisible();
  91  |  await page.getByRole('button',{name:/Preguntar a Ana/}).click();await page.getByRole('button',{name:'Horarios',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'El horario'})).toContainText('no está configurado');
  92  |  await page.getByRole('button',{name:'Tengo otra pregunta'}).click();await expect(page.getByRole('textbox',{name:'Tu pregunta'})).toHaveCount(0);await expect(page.getByText('Las consultas escritas no están habilitadas.',{exact:false})).toBeVisible();await expect(page.getByText(/No tengo información autorizada/)).toHaveCount(0);await capture(page,'question-unconfigured-contact');await expect(page.getByRole('button',{name:/Enviar/})).toHaveCount(0);
  93  |  await page.getByRole('button',{name:'Volver',exact:true}).click();await expect(page.getByText('Qué bueno verte de nuevo. ¿En qué puedo ayudarte?',{exact:true})).toBeVisible();
  94  |  await visit(page,'El local');await page.getByRole('button',{name:'Lounge · Sala de espera',exact:true}).click();await page.waitForFunction(()=>!(window.__FEBLES__.snapshot() as any).destination);await page.getByRole('button',{name:/Ofertas vigentes/}).click();await expect(page.getByText('Sin ofertas publicadas.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Volver al lounge',exact:true}).click();await page.getByRole('button',{name:'Servicios y cuidados',exact:true}).click();await expect(page.getByRole('heading',{name:'Cuidado de focos',exact:true})).toBeVisible();await capture(page,'lounge-expanded');
  95  | })
  96  | 
  97  | test('El catálogo público no sustituye la cookie de la sesión privada',async({browser})=>{
  98  |  const context=await browser.newContext();const base='http://127.0.0.1:4173/api/demo/';
  99  |  const results=await Promise.all([context.request.get(base+'session'),context.request.get(base+'catalog')]);
  100 |  expect(results[1].headers()['set-cookie']).toBeUndefined();const first=await results[0].json(),second=await(await context.request.get(base+'session')).json();expect(second.nonce).toBe(first.nonce);
  101 |  const missing=await context.request.post(base+'quote',{headers:{Origin:'http://127.0.0.1:4173','X-Demo-Nonce':first.nonce},data:{services:['exterior'],vehicle:{type:'pickup',color:'Azul',contact:''}}});expect(missing.status()).toBe(422);expect((await missing.json()).error).toContain('Requiere cotización');await context.close();
  102 | })
  103 | 
  104 | 
```