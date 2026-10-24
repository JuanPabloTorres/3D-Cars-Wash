# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lounge.spec.ts >> Preparar desde el lounge recupera el borrador sin crear una orden
- Location: tests\e2e\lounge.spec.ts:67:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: getByLabel('Color', { exact: true })
Expected: "Azul"
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" getByLabel('Color', { exact: true }) with timeout 15000ms
  - waiting for getByLabel('Color', { exact: true })

```

```yaml
- 'main "CarWash Studio: visita tridimensional"':
  - text: CarWash Studio · DEMO Simulación conectada
  - button "Visitar":
    - img
    - text: Visitar
  - button "Estado de mi orden":
    - img
    - text: Mi orden
  - button "Cómo funciona":
    - img
    - text: Cómo funciona
  - button "Abrir cuenta de Visitante":
    - text: VI
    - img
  - button "Ayuda de la visita":
    - img
  - button "Entrada · Recepción":
    - img
    - text: Entrada · Recepción
  - dialog "Ana · Recepción":
    - text: ATENCIÓN · ENTORNO DEMO
    - heading "Ana · Recepción" [level=2]
    - button "Cerrar Ana · Recepción":
      - img
    - paragraph: Cuéntame sobre tu vehículo.
    - text: Tipo de vehículo
    - combobox "Tipo de vehículo":
      - option "Carro" [selected]
      - option "Pickup"
      - option "Truck"
      - option "SUV"
    - text: Color
    - combobox "Color":
      - option "Plata"
      - option "Rojo"
      - option "Azul" [selected]
      - option "Negro"
      - option "Blanco"
    - text: Correo o teléfono Opcional en DEMO
    - textbox "Correo o teléfono Opcional en DEMO":
      - /placeholder: Usa datos de ejemplo
    - paragraph:
      - img
      - text: Registro virtual. La llegada presencial sigue pendiente.
    - paragraph: "Modelo ilustrativo de categoría: Carro. Conservaremos el tipo y color en la orden."
    - button "Revisar cotización":
      - text: Revisar cotización
      - img
    - button "Volver":
      - img
      - text: Volver
  - text: Recepción abierta.
```

# Test source

```ts
  1   | import {test,expect,type Page} from '@playwright/test'
  2   | import fs from 'node:fs/promises'
  3   | 
  4   | const base='http://127.0.0.1:4173',evidence='docs/evidence/lounge'
  5   | async function visit(page:Page,label:string){
  6   |  await page.getByRole('button',{name:'Visitar',exact:true}).click()
  7   |  await page.getByRole('navigation',{name:'Visitar un área'}).getByRole('button',{name:label}).click()
  8   |  await page.waitForFunction(()=>!(window.__FEBLES__.snapshot() as any).destination)
  9   | }
  10  | async function openLounge(page:Page,url='/'){
  11  |  await page.goto(url)
  12  |  await page.locator('[data-ready=true]').waitFor({timeout:60000})
  13  |  await visit(page,'El local')
  14  |  await page.getByText('Consultar otra zona del local',{exact:true}).click()
  15  |  await page.getByRole('button',{name:'Espera y mi orden'}).click()
  16  |  await expect(page.getByRole('dialog',{name:'Tu espera'})).toBeVisible()
  17  |  await page.waitForFunction(()=>!(window.__FEBLES__.snapshot() as any).destination)
  18  | }
  19  | async function command(page:Page,path:string,data:unknown){
  20  |  const session=await(await page.request.get('/api/demo/session')).json()
  21  |  const response=await page.request.post(`/api/demo/${path}`,{headers:{Origin:base,'X-Demo-Nonce':session.nonce},data})
  22  |  expect(response.ok()).toBe(true)
  23  |  return response.json()
  24  | }
  25  | async function capture(page:Page,name:string){
  26  |  await fs.mkdir(evidence,{recursive:true})
  27  |  await page.screenshot({path:`${evidence}/${name}.png`,animations:'disabled'})
  28  | }
  29  | 
  30  | test('Lounge de referencia: vacío honesto, tarjetas iguales y vistas internas con datos configurados',async({page})=>{
  31  |  await page.setViewportSize({width:1855,height:848})
  32  |  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message))
  33  |  await openLounge(page)
  34  |  const panel=page.getByRole('dialog',{name:'Tu espera'})
  35  |  await expect(panel).toContainText('Conoce el local y prepara tu visita.')
  36  |  await expect(panel).toContainText('Aún no tienes una orden activa.')
  37  |  await expect(panel).not.toContainText('cuidamos tu auto')
  38  |  await expect.poll(async()=>Math.round((await panel.boundingBox())!.y*100)/100).toBe(84)
  39  |  const box=(await panel.boundingBox())!
  40  |  expect(box.x).toBeGreaterThan(1250);expect(box.y).toBeCloseTo(84,1)
  41  |  expect(box.width).toBeGreaterThanOrEqual(555);expect(box.width).toBeLessThan(565)
  42  |  expect(848-box.y-box.height).toBe(24)
  43  |  const cards=panel.locator('.lounge-card'),cardBoxes=await cards.evaluateAll(nodes=>nodes.map(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height})))
  44  |  expect(cardBoxes).toHaveLength(3)
  45  |  expect(Math.max(...cardBoxes.map(box=>box.width))-Math.min(...cardBoxes.map(box=>box.width))).toBeLessThan(1)
  46  |  expect(new Set(cardBoxes.map(box=>box.height)).size).toBe(1)
  47  |  for(const image of await cards.locator('img').all())expect(await image.evaluate(node=>(node as HTMLImageElement).complete&&(node as HTMLImageElement).naturalWidth>0)).toBe(true)
  48  |  await capture(page,'desktop-empty-reference')
  49  |  await panel.getByRole('button',{name:'Ofertas vigentes'}).click()
  50  |  await expect(panel.getByRole('heading',{name:'Ofertas vigentes'})).toBeVisible()
  51  |  await expect(panel).toContainText('Sin ofertas publicadas.')
  52  |  await expect(page.getByRole('dialog')).toHaveCount(1)
  53  |  await panel.getByRole('button',{name:'Volver al lounge'}).click()
  54  |  await panel.getByRole('button',{name:'Servicios y cuidados',exact:true}).click()
  55  |  await expect(panel.getByRole('heading',{name:'Cuidado de focos',exact:true})).toBeVisible()
  56  |  await expect(panel).toContainText('Incluye:')
  57  |  await panel.getByRole('button',{name:'Volver al lounge'}).click()
  58  |  await panel.getByRole('button',{name:'Información del local',exact:true}).click()
  59  |  await expect(panel.getByRole('heading',{name:'Información del establecimiento'})).toBeVisible()
  60  |  await expect(panel).toContainText('Horario pendiente de configuración.')
  61  |  await expect(page.getByRole('dialog')).toHaveCount(1)
  62  |  await page.keyboard.press('Escape')
  63  |  await expect(panel).toHaveCount(0)
  64  |  expect(errors).toEqual([])
  65  | })
  66  | 
  67  | test('Preparar desde el lounge recupera el borrador sin crear una orden',async({page})=>{
  68  |  await page.addInitScript(()=>sessionStorage.setItem('febles.demo.draft.v1',JSON.stringify({services:['exterior'],vehicle:{type:'car',color:'Azul',contact:''},step:'vehicle'})))
  69  |  await openLounge(page)
  70  |  await page.getByRole('dialog',{name:'Tu espera'}).getByRole('button',{name:'Preparar mi orden',exact:true}).click()
  71  |  await expect(page.getByRole('dialog',{name:'Ana · Recepción'})).toBeVisible()
> 72  |  await expect(page.getByLabel('Color',{exact:true})).toHaveValue('Azul')
      |                                                      ^ Error: expect(locator).toHaveValue(expected) failed
  73  |  expect((await(await page.request.get('/api/demo/session')).json()).order).toBeNull()
  74  |  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('febles.demo.draft.v1')!).services)).toEqual(['exterior'])
  75  |  await expect(page.getByRole('dialog')).toHaveCount(1)
  76  | })
  77  | 
  78  | test('Orden de la sesión: llegada pendiente, atención real, lista y último estado al reconectar',async({page,context})=>{
  79  |  // Explicit paused synthetic scenario; commands never stand in for live staff authorization.
  80  |  const toolPath='tools?scenario=quiet&speed=1'
  81  |  await command(page,toolPath,{sandbox:true,action:'reset'})
  82  |  const quote=await command(page,'quote',{services:['exterior'],vehicle:{type:'car',color:'Azul',contact:''}})
  83  |  await command(page,'confirm',{quoteId:quote.id,key:quote.id})
  84  |  await openLounge(page,'/?scenario=quiet');await command(page,toolPath,{sandbox:true,action:'pause',paused:true})
  85  |  const panel=page.getByRole('dialog',{name:'Tu espera'})
  86  |  await expect(panel).toContainText('Tu orden está confirmada. La llegada sigue pendiente.')
  87  |  await expect(panel.locator('.lounge-order')).not.toContainText('Bahía 03')
  88  |  await expect(panel.locator('.lounge-order')).not.toContainText('Turno')
  89  |  await command(page,toolPath,{sandbox:true,action:'start-order'})
  90  |  await expect(panel).toContainText('Consulta cómo va el cuidado de tu vehículo.')
  91  |  await expect(panel.locator('.lounge-order')).toContainText('Carro · Azul')
  92  |  await expect(panel.locator('.lounge-order-facts')).toContainText('Lavado exterior en curso')
  93  |  await expect(panel.locator('.lounge-order-facts')).toContainText('Bahía 03')
  94  |  await capture(page,'desktop-active-order')
  95  |  await command(page,toolPath,{sandbox:true,action:'advance'})
  96  |  await command(page,toolPath,{sandbox:true,action:'advance'})
  97  |  await expect(panel).toContainText('Tu vehículo está listo. Revisa los siguientes pasos.')
  98  |  await expect(panel).toContainText('Listo para entrega')
  99  |  await context.setOffline(true)
  100 |  await expect(panel.getByRole('status')).toContainText('Actualizando el estado de tu orden…')
  101 |  await expect(panel.getByRole('status')).toContainText('Último estado recibido')
  102 |  await expect(panel).toContainText('Carro · Azul')
  103 |  await expect(panel).toContainText('Listo para entrega')
  104 |  await context.setOffline(false)
  105 |  await expect(panel.getByRole('status')).toHaveCount(0);await command(page,toolPath,{sandbox:true,action:'pause',paused:true})
  106 |  await panel.getByRole('button',{name:'Ver mi orden',exact:true}).click()
  107 |  await expect(page.getByRole('dialog',{name:'Mi orden'})).toBeVisible()
  108 |  await expect(page.getByRole('dialog')).toHaveCount(1)
  109 | })
  110 | 
  111 | test('Lounge móvil: hoja de 58%, contenido legible y vehículo ajeno nunca seleccionado',async({browser})=>{
  112 |  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage()
  113 |  await openLounge(page,'/?scenario=mixed')
  114 |  const panel=page.getByRole('dialog',{name:'Tu espera'}),box=(await panel.boundingBox())!
  115 |  expect(box.height/844).toBeGreaterThanOrEqual(.55);expect(box.height/844).toBeLessThanOrEqual(.60)
  116 |  expect(await panel.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true)
  117 |  const cards=panel.locator('.lounge-card'),boxes=await cards.evaluateAll(nodes=>nodes.map(node=>({y:node.getBoundingClientRect().y,width:node.getBoundingClientRect().width})))
  118 |  expect(boxes[1].y).toBeGreaterThan(boxes[0].y);expect(boxes[0].width).toBeGreaterThan(300)
  119 |  await panel.getByRole('button',{name:'Ampliar detalles'}).click()
  120 |  expect((await panel.boundingBox())!.height).toBeGreaterThan(box.height)
  121 |  await panel.getByRole('button',{name:'Reducir detalles'}).click()
  122 |  await panel.getByRole('button',{name:'Ver mi vehículo',exact:true}).scrollIntoViewIfNeeded()
  123 |  await capture(page,'mobile-lounge-actions')
  124 |  await panel.getByRole('button',{name:'Ver mi vehículo',exact:true}).click()
  125 |  await expect(page.getByRole('dialog',{name:'Mi vehículo'})).toContainText('Aún no tienes una orden')
  126 |  await page.waitForFunction(()=>!(window.__FEBLES__.snapshot() as any).destination)
  127 |  expect((await page.evaluate(()=>window.__FEBLES__.snapshot()) as any).activeView).toBe('reception')
  128 |  await expect(page.getByRole('dialog')).toHaveCount(1)
  129 |  await context.close()
  130 | })
  131 | 
```