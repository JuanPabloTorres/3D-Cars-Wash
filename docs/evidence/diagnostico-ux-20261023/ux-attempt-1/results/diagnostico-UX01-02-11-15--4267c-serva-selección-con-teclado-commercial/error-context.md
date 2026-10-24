# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: diagnostico.spec.ts >> UX01/02/11/15: el recorrido móvil reinicia lectura y conserva selección con teclado
- Location: tests\e2e\diagnostico.spec.ts:20:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByLabel('Color', { exact: true })

```

# Page snapshot

```yaml
- 'main "CarWash Studio: visita tridimensional" [ref=e3]':
  - generic:
    - generic:
      - generic "CarWash Studio"
      - generic: · DEMO
      - generic: Simulación conectada
  - generic [ref=e11]:
    - button "Visitar" [ref=e12] [cursor=pointer]
    - button "Abrir cuenta de Visitante" [ref=e16] [cursor=pointer]
    - button "Ayuda de la visita" [ref=e20] [cursor=pointer]
  - dialog "Tu vehículo" [ref=e24]:
    - generic [ref=e26]:
      - generic [ref=e27]:
        - text: ANA · RECEPCIÓN · ENTORNO DEMO
        - heading "Tu vehículo" [active] [level=2] [ref=e28]
      - button "Cerrar Tu vehículo" [ref=e29] [cursor=pointer]
    - generic [ref=e33]:
      - list "Preparar solicitud" [ref=e34]:
        - listitem [ref=e35]:
          - generic [aria-hidden] [ref=e36]: "1"
          - text: Servicios
        - listitem [ref=e37]:
          - generic [aria-hidden] [ref=e38]: "2"
          - text: Vehículo
        - listitem [ref=e39]:
          - generic [aria-hidden] [ref=e40]: "3"
          - text: Revisión
      - paragraph [ref=e41]: Cuéntame sobre tu vehículo.
      - generic [ref=e42]:
        - generic [ref=e43]:
          - text: Tipo de vehículo
          - combobox "Tipo de vehículo" [ref=e44]:
            - option "Carro" [selected]
            - option "Pickup"
            - option "Truck"
            - option "SUV"
        - generic [ref=e45]:
          - text: Color
          - combobox "Color" [ref=e46]:
            - option "Plata" [selected]
            - option "Rojo"
            - option "Azul"
            - option "Negro"
            - option "Blanco"
        - generic [ref=e47]:
          - text: Correo o teléfono
          - generic [ref=e48]: Opcional en DEMO
          - textbox "Correo o teléfono Opcional en DEMO" [ref=e49]:
            - /placeholder: Usa datos de ejemplo
        - paragraph [ref=e50]: Registro virtual. La llegada presencial sigue pendiente.
        - paragraph [ref=e53]: "Modelo ilustrativo de categoría: Carro. Conservaremos el tipo y color en la orden."
        - button "Revisar cotización" [ref=e54] [cursor=pointer]
      - button "Volver" [ref=e57] [cursor=pointer]
  - generic [ref=e60]: Recepción abierta.
```

# Test source

```ts
  1   | import {test,expect,type Page} from '@playwright/test'
  2   | 
  3   | async function load(page:Page){
  4   |  await page.goto('/')
  5   |  await page.locator('[data-ready=true]').waitFor({timeout:60000})
  6   | }
  7   | async function visit(page:Page,label:string){
  8   |  await page.getByRole('button',{name:'Visitar',exact:true}).click()
  9   |  await page.getByRole('navigation',{name:'Visitar un área'}).getByRole('button',{name:label}).click()
  10  |  await page.waitForFunction(()=>!(window.__FEBLES__.snapshot() as any).destination)
  11  | }
  12  | async function stepAtStart(page:Page,title:string){
  13  |  const panel=page.getByRole('dialog',{name:title,exact:true})
  14  |  await expect(panel.getByRole('heading',{name:title,exact:true})).toBeFocused()
  15  |  await expect.poll(()=>panel.locator('.panel-content').evaluate(el=>el.scrollTop)).toBe(0)
  16  |  await expect(panel.locator('[aria-current=step]')).toHaveCount(1)
  17  |  return panel
  18  | }
  19  | 
  20  | test('UX01/02/11/15: el recorrido móvil reinicia lectura y conserva selección con teclado',async({page})=>{
  21  |  await page.setViewportSize({width:390,height:844})
  22  |  await load(page);await visit(page,'Recepción')
  23  |  await page.getByRole('button',{name:/Conocer servicios/}).click()
  24  |  await stepAtStart(page,'Servicios')
  25  |  await expect(page.getByText('0 servicios seleccionados',{exact:true})).toBeVisible()
  26  |  await page.getByRole('button',{name:'Añadir Lavado exterior',exact:true}).click()
  27  |  await expect(page.getByText('1 servicio seleccionado',{exact:true})).toBeVisible()
  28  |  await page.getByRole('button',{name:'Añadir Cuidado interior',exact:true}).click()
  29  |  await expect(page.getByText('2 servicios seleccionados',{exact:true})).toBeVisible()
  30  |  await page.getByRole('button',{name:'Continuar',exact:true}).focus()
  31  |  await page.keyboard.press('Enter')
  32  |  await stepAtStart(page,'Tu vehículo')
> 33  |  await page.getByLabel('Color',{exact:true}).selectOption('Azul')
      |                                              ^ Error: locator.selectOption: Test timeout of 90000ms exceeded.
  34  |  await page.getByRole('button',{name:'Revisar cotización',exact:true}).focus()
  35  |  await page.keyboard.press('Enter')
  36  |  const review=await stepAtStart(page,'Revisar cotización')
  37  |  await expect(review).toContainText('Carro · Azul')
  38  |  await expect(review.locator('.quote-services')).toContainText('Lavado exterior')
  39  |  await expect(review.locator('.quote-services')).toContainText('Cuidado interior')
  40  |  await page.keyboard.press('Tab')
  41  |  expect(await review.evaluate(el=>el.contains(document.activeElement))).toBe(true)
  42  |  await review.getByRole('button',{name:'Volver',exact:true}).click()
  43  |  await stepAtStart(page,'Tu vehículo')
  44  |  await page.getByRole('button',{name:'Volver',exact:true}).click()
  45  |  await stepAtStart(page,'Servicios')
  46  |  await expect(page.getByRole('button',{name:'Quitar Lavado exterior',exact:true})).toBeVisible()
  47  |  expect((await(await page.request.get('/api/demo/session')).json()).order).toBeNull()
  48  | })
  49  | 
  50  | for(const width of [320,390,650,768])test(`UX03/09/18/19: cabecera y paneles sin solapes a ${width}px`,async({page})=>{
  51  |  await page.setViewportSize({width,height:844})
  52  |  await load(page);await visit(page,'Recepción')
  53  |  await page.getByRole('button',{name:'Abrir cuenta de Visitante',exact:true}).click()
  54  |  await expect(page.getByRole('dialog',{name:'Cuenta',exact:true})).toBeVisible()
  55  |  await expect(page.locator('.back-to-entry')).toHaveCount(0)
  56  |  const boxes=await page.locator('.utility-controls button').evaluateAll(nodes=>nodes.map(el=>{
  57  |   const box=el.getBoundingClientRect()
  58  |   return {x:box.x,y:box.y,width:box.width,height:box.height,hit:el.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2))}
  59  |  }))
  60  |  for(const box of boxes){expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);expect(box.hit).toBe(true);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width)}
  61  |  const brand=await page.locator('.demo-mark').boundingBox(),controls=await page.locator('.utility-controls').boundingBox()
  62  |  expect(brand!.x+brand!.width).toBeLessThanOrEqual(controls!.x)
  63  |  await page.keyboard.press('Escape')
  64  |  await expect(page.getByRole('button',{name:'Abrir cuenta de Visitante',exact:true})).toBeFocused()
  65  |  await page.getByRole('button',{name:'Ayuda de la visita',exact:true}).click()
  66  |  await expect(page.getByRole('button',{name:'Cómo funciona',exact:true})).toHaveCount(0)
  67  |  await expect(page.getByRole('heading',{name:'Moverme por el local',exact:true})).toBeVisible()
  68  |  await page.getByText('Completar el servicio',{exact:true}).click()
  69  |  await expect(page.getByRole('heading',{name:'Elige servicios',exact:true})).toBeVisible()
  70  |  await page.keyboard.press('Escape')
  71  |  await expect(page.getByRole('button',{name:'Ayuda de la visita',exact:true})).toBeFocused()
  72  |  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  73  | })
  74  | 
  75  | test('UX04/05/07/08: consulta sin canal es honesta y lounge se descubre directamente',async({page})=>{
  76  |  await load(page);await visit(page,'Recepción')
  77  |  await page.getByRole('button',{name:/Preguntar a Ana/}).click()
  78  |  await page.getByRole('button',{name:'Tengo otra pregunta',exact:true}).click()
  79  |  await expect(page.getByText('Las consultas escritas no están habilitadas.',{exact:false})).toBeVisible()
  80  |  await expect(page.getByLabel('Tu pregunta',{exact:true})).toHaveCount(0)
  81  |  await expect(page.getByText(/No tengo información autorizada/)).toHaveCount(0)
  82  |  const before=await page.evaluate(()=>(window.__FEBLES__.snapshot() as any).activeView)
  83  |  await visit(page,'El local')
  84  |  await expect(page.getByRole('dialog',{name:'El local',exact:true})).toBeVisible()
  85  |  expect(await page.evaluate(()=>(window.__FEBLES__.snapshot() as any).activeView)).toBe(before)
  86  |  await page.getByRole('button',{name:'Lounge · Sala de espera',exact:true}).click()
  87  |  const lounge=page.getByRole('dialog',{name:'Lounge · Sala de espera',exact:true})
  88  |  await expect(lounge).toBeVisible()
  89  |  await expect(lounge.getByRole('button',{name:'Servicios y cuidados',exact:true})).toBeVisible()
  90  |  const card=await lounge.getByRole('button',{name:'Servicios y cuidados',exact:true}).boundingBox()
  91  |  expect(card!.y+card!.height).toBeLessThanOrEqual(900)
  92  | })
  93  | 
  94  | test('UX06/14/21: llegada pendiente no busca un auto; nueva solicitud respeta orden activa',async({page})=>{
  95  |  await load(page)
  96  |  const session=await(await page.request.get('/api/demo/session')).json()
  97  |  const command=async(path:string,data:unknown)=>{
  98  |   const response=await page.request.post(`/api/demo/${path}`,{headers:{Origin:'http://127.0.0.1:4173','X-Demo-Nonce':session.nonce},data})
  99  |   expect(response.ok()).toBe(true);return response.json()
  100 |  }
  101 |  const quote=await command('quote',{services:['exterior'],vehicle:{type:'car',color:'Azul',contact:''}})
  102 |  const confirmed=await command('confirm',{quoteId:quote.id,key:quote.id})
  103 |  await page.reload();await page.locator('[data-ready=true]').waitFor({timeout:60000})
  104 |  const before=await page.evaluate(()=>(window.__FEBLES__.snapshot() as any).activeView)
  105 |  await visit(page,'Mi vehículo')
  106 |  await expect(page.getByRole('dialog',{name:'Mi vehículo',exact:true})).toContainText('Tu vehículo aparecerá cuando el personal confirme la llegada.')
  107 |  expect(await page.evaluate(()=>(window.__FEBLES__.snapshot() as any).activeView)).toBe(before)
  108 |  await expect(page.getByText('Buscando tu vehículo…',{exact:true})).toHaveCount(0)
  109 |  await visit(page,'Recepción')
  110 |  await expect(page.getByText('Tu solicitud está confirmada. Falta confirmar tu llegada.',{exact:true})).toBeVisible()
  111 |  await page.getByRole('button',{name:/Conocer servicios/}).click()
  112 |  await page.getByRole('button',{name:'Añadir Lavado exterior',exact:true}).click()
  113 |  await page.getByRole('button',{name:'Continuar',exact:true}).click()
  114 |  await page.getByRole('button',{name:'Revisar cotización',exact:true}).click()
  115 |  await expect(page.getByText(/Este borrador no la modifica/)).toBeVisible()
  116 |  await expect(page.getByRole('button',{name:'Confirmar orden DEMO',exact:true})).toBeDisabled()
  117 |  expect((await(await page.request.get('/api/demo/session')).json()).order.id).toBe(confirmed.order.id)
  118 | })
  119 | 
```