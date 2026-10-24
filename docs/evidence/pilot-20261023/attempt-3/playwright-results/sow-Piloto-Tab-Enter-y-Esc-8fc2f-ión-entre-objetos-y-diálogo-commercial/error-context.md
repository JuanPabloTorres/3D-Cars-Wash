# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sow.spec.ts >> Piloto: Tab, Enter y Escape conservan foco y selección entre objetos y diálogo
- Location: tests\e2e\sow.spec.ts:77:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: 'Ana · Recepción' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'Ana · Recepción' }) with timeout 15000ms
  - waiting for getByRole('dialog', { name: 'Ana · Recepción' })

```

```yaml
- 'main "CarWash Studio: visita tridimensional"':
  - text: CarWash Studio · DEMO Simulación conectada
  - button "Visitar":
    - img
    - text: Visitar
  - button "Abrir cuenta de Visitante":
    - img
    - text: Mi cuenta
  - button "Ayuda de la visita":
    - img
  - dialog "Servicios":
    - text: ANA · RECEPCIÓN · ENTORNO DEMO
    - heading "Servicios" [level=2]
    - button "Cerrar Servicios":
      - img
    - list "Preparar solicitud":
      - listitem: Servicios
      - listitem: Vehículo
      - listitem: Revisión
    - paragraph: El cuidado que tu auto necesita.
    - text: Tarifas por vehículo
    - combobox "Tarifas por vehículo":
      - option "Carro" [selected]
      - option "Pickup"
      - option "Truck"
      - option "SUV"
    - paragraph: Selecciona uno o varios servicios. Precios DEMO en USD para Carro. Imágenes ilustrativas del servicio.
    - article:
      - 'img "Ilustración: Cuidado de la carrocería, rines y cristales."'
      - heading "Lavado exterior" [level=3]
      - text: $35.00 DEMO
      - paragraph: Cuidado de la carrocería, rines y cristales.
      - button "Ver detalles"
      - button "Añadir Lavado exterior": + Añadir
    - article:
      - 'img "Ilustración: Aspirado y limpieza de superficies interiores."'
      - heading "Cuidado interior" [level=3]
      - text: $20.00 DEMO
      - paragraph: Aspirado y limpieza de superficies interiores.
      - button "Ver detalles"
      - button "Añadir Cuidado interior": + Añadir
    - article:
      - 'img "Ilustración: Evaluación y tratamiento de las ópticas."'
      - heading "Cuidado de focos" [level=3]
      - text: $10.00 DEMO
      - paragraph: Evaluación y tratamiento de las ópticas.
      - button "Ver detalles"
      - button "Añadir Cuidado de focos": + Añadir
    - text: 0 servicios seleccionados
    - button "Continuar" [disabled]:
      - text: Continuar
      - img
    - button "Volver":
      - img
      - text: Volver
  - text: Recepción abierta.
```

# Test source

```ts
  1   | import { test, expect, type Page, type BrowserContext } from '@playwright/test';
  2   | import fs from 'node:fs/promises';
  3   | // Login secrets must never enter traces or videos. Screenshots show only UI.
  4   | test.use({ trace: 'off', video: 'off' });
  5   | const base = 'http://127.0.0.1:4173', evidence = `${process.env.CARWASH_EVIDENCE_DIR || 'docs/evidence/pilot-20261023/after'}/e2e-sow`;
  6   | async function capture(page: Page, name: string) { await fs.mkdir(evidence, { recursive: true }); if (page.url().endsWith('/admin'))
  7   |     await page.locator('.admin-shell').evaluate(el => el.scrollTop = 0); await page.screenshot({ path: `${evidence}/${name}.png`, animations: 'disabled' }); }
  8   | async function load(page: Page) { await page.goto('/'); await page.locator('[data-ready=true]').waitFor({ timeout: 60000 }); }
  9   | async function visit(page: Page, label: string) { await page.getByRole('button', { name: 'Visitar', exact: true }).click(); await page.getByRole('navigation', { name: 'Visitar un área' }).getByRole('button', { name: label }).click(); await page.waitForFunction(() => !(window.__FEBLES__.snapshot() as any).destination); }
  10  | async function login(page: Page) { await page.goto('/admin'); await page.getByLabel('Clave local de administración').fill((await fs.readFile('server/.local-admin-token', 'utf8')).trim()); await page.getByRole('button', { name: 'Entrar al panel local' }).click(); await page.getByRole('heading', { name: 'Fila, bahías y próximas acciones' }).waitFor(); }
  11  | async function session(context: BrowserContext) { return (await context.request.get(base + '/api/demo/session')).json(); }
  12  | async function post(context: BrowserContext, path: string, data: unknown) { const s = await session(context); return context.request.post(base + '/api/demo/' + path, { headers: { Origin: base, 'X-Demo-Nonce': s.nonce }, data }); }
  13  | async function quote(context: BrowserContext) { return (await post(context, 'quote', { services: ['exterior'], vehicle: { type: 'car', color: 'Azul', contact: 'test@example.test' } })).json(); }
  14  | const errorsFor = (page: Page) => { const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); return errors; };
  15  | 
  16  | const counterLabels = ['Servicios', 'Horarios', 'El local', 'Preguntas'] as const;
  17  | /** Measure transformed DOM targets in viewport pixels, rather than local 3D scale. */
  18  | async function counterTargets(page: Page) {
  19  |     await expect(page.locator('.counter-display')).toHaveCount(counterLabels.length);
  20  |     const viewport = page.viewportSize()!;
  21  |     const targets = [];
  22  |     for (const label of counterLabels) {
  23  |         const control = page.getByRole('button', { name: `Abrir ${label} del mostrador`, exact: true });
  24  |         await expect(control).toBeVisible();
  25  |         const box = await control.boundingBox();
  26  |         expect(box, label).not.toBeNull();
  27  |         // DOMRect can round 44px to 43.999969px under projected HTML placement.
  28  |         // Allow only 0.01px measurement error; CSS must still require at least 44px.
  29  |         const measurementTolerance = .01;
  30  |         expect(box!.width + measurementTolerance, `${label}: ancho táctil real`).toBeGreaterThanOrEqual(44);
  31  |         expect(box!.height + measurementTolerance, `${label}: alto táctil real`).toBeGreaterThanOrEqual(44);
  32  |         const css = await control.evaluate(el => {
  33  |             const style = getComputedStyle(el);
  34  |             return { minWidth: parseFloat(style.minWidth), minHeight: parseFloat(style.minHeight) };
  35  |         });
  36  |         expect(css.minWidth, `${label}: mínimo CSS de ancho`).toBeGreaterThanOrEqual(44);
  37  |         expect(css.minHeight, `${label}: mínimo CSS de alto`).toBeGreaterThanOrEqual(44);
  38  |         expect(box!.x, label).toBeGreaterThanOrEqual(0);
  39  |         expect(box!.y, label).toBeGreaterThanOrEqual(0);
  40  |         expect(box!.x + box!.width, label).toBeLessThanOrEqual(viewport.width);
  41  |         expect(box!.y + box!.height, label).toBeLessThanOrEqual(viewport.height);
  42  |         // A visible rectangle alone does not prove that an overlay leaves it clickable.
  43  |         expect(await control.evaluate(el => {
  44  |             const b = el.getBoundingClientRect();
  45  |             return el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2));
  46  |         }), `${label}: centro accesible`).toBe(true);
  47  |         targets.push({ label, ...box!, css });
  48  |     }
  49  |     for (let i = 0; i < targets.length; i++) {
  50  |         for (let j = i + 1; j < targets.length; j++) {
  51  |             const a = targets[i], b = targets[j];
  52  |             const overlaps = Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x)
  53  |                 && Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y);
  54  |             expect(overlaps, `${a.label} y ${b.label}: targets sin solapamiento`).toBe(false);
  55  |         }
  56  |     }
  57  |     return targets;
  58  | }
  59  | 
  60  | for (const viewport of [{ width: 1855, height: 848 }, { width: 1440, height: 900 }, { width: 650, height: 900 }, { width: 390, height: 844 }]) {
  61  |     test(`Piloto: cuatro objetos completos y utilizables a ${viewport.width}×${viewport.height}`, async ({ page }) => {
  62  |         const errors = errorsFor(page);
  63  |         await page.setViewportSize(viewport);
  64  |         await load(page);
  65  |         await visit(page, 'Recepción');
  66  |         // Preparing an order is still reachable through Ana's dialogue, without a fifth prop.
  67  |         await page.getByRole('button', { name: /Preparar mi orden/ }).click();
  68  |         await expect(page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true })).toBeVisible();
  69  |         await page.keyboard.press('Escape');
  70  |         const targets = await counterTargets(page);
  71  |         await capture(page, `pilot-counter-${viewport.width}`);
  72  |         await fs.writeFile(`${evidence}/pilot-targets-${viewport.width}.json`, JSON.stringify({ viewport, targets, errors }, null, 2));
  73  |         expect(errors).toEqual([]);
  74  |     });
  75  | }
  76  | 
  77  | test('Piloto: Tab, Enter y Escape conservan foco y selección entre objetos y diálogo', async ({ page }) => {
  78  |     await load(page);
  79  |     await visit(page, 'Recepción');
  80  |     await page.keyboard.press('Escape');
  81  |     const reached = new Set<string>();
  82  |     await page.getByRole('button', { name: 'Abrir cuenta de Visitante', exact: true }).focus();
  83  |     for (let step = 0; step < 30 && reached.size < counterLabels.length; step++) {
  84  |         await page.keyboard.press('Tab');
  85  |         const label = await page.evaluate(() => document.activeElement?.matches('.counter-display') ? document.activeElement.getAttribute('aria-label') : null);
  86  |         if (label) reached.add(label);
  87  |     }
  88  |     expect([...reached].sort()).toEqual(counterLabels.map(label => `Abrir ${label} del mostrador`).sort());
  89  |     await capture(page, 'pilot-counter-keyboard-focus');
  90  |     const services = page.getByRole('button', { name: 'Abrir Servicios del mostrador', exact: true });
  91  |     await services.focus();
  92  |     await page.keyboard.press('Enter');
> 93  |     await expect(page.getByRole('dialog', { name: 'Ana · Recepción' })).toBeVisible();
      |                                                                         ^ Error: expect(locator).toBeVisible() failed
  94  |     await page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true }).click();
  95  |     await page.keyboard.press('Escape');
  96  |     await expect(services).toBeFocused();
  97  |     const questions = page.getByRole('button', { name: 'Abrir Preguntas del mostrador', exact: true });
  98  |     await questions.focus();
  99  |     await page.keyboard.press('Enter');
  100 |     await expect(page.getByRole('button', { name: 'Servicios disponibles', exact: true })).toBeVisible();
  101 |     await page.keyboard.press('Escape');
  102 |     await expect(questions).toBeFocused();
  103 |     await services.focus();
  104 |     await page.keyboard.press('Enter');
  105 |     await expect(page.getByRole('button', { name: 'Quitar Lavado exterior', exact: true })).toBeVisible();
  106 |     await page.getByRole('button', { name: 'Volver', exact: true }).click();
  107 |     await page.getByRole('button', { name: /Retomar mi solicitud/ }).click();
  108 |     await expect(page.getByLabel('Tipo de vehículo')).toBeVisible();
  109 |     await page.getByRole('button', { name: 'Volver', exact: true }).click();
  110 |     await expect(page.getByRole('button', { name: 'Quitar Lavado exterior', exact: true })).toBeVisible();
  111 | });
  112 | test('Operación vacía, cuenta de sesión, logout real y permisos administrativos', async ({ browser }) => {
  113 |     const context = await browser.newContext(), page = await context.newPage(), errors = errorsFor(page);
  114 |     await load(page);
  115 |     expect((await page.evaluate(() => window.__FEBLES__.snapshot()) as any).world.vehicles).toHaveLength(0);
  116 |     const denied = await context.request.get(base + '/api/demo/admin/snapshot');
  117 |     expect(denied.status()).toBe(403);
  118 |     await page.getByRole('button', { name: 'Abrir cuenta de Visitante' }).click();
  119 |     await page.getByLabel('Nombre para esta visita').fill('Visitante prueba');
  120 |     await page.getByRole('button', { name: 'Guardar perfil' }).click();
  121 |     await expect(page.getByRole('button', { name: 'Abrir cuenta de Visitante prueba' })).toBeVisible();
  122 |     await capture(page, 'desktop-account');
  123 |     await page.getByRole('button', { name: 'Cerrar sesión DEMO' }).click();
  124 |     await expect(page.getByRole('button', { name: 'Abrir cuenta de Visitante', exact: true })).toBeVisible();
  125 |     expect((await session(context)).profile.name).toBe('Visitante');
  126 |     expect(errors).toEqual([]);
  127 |     await context.close();
  128 | });
  129 | test('Administración publica contenido y precios; cotización obsoleta se rechaza sin alterar precio aceptado', async ({ browser }) => {
  130 |     const admin = await browser.newContext(), client = await browser.newContext(), ap = await admin.newPage(), cp = await client.newPage();
  131 |     await login(ap);
  132 |     await load(cp);
  133 |     const original = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
  134 |     try {
  135 |         const q = await quote(client), config = structuredClone(original);
  136 |         config.business.hours = 'Horario de prueba · 09:00 a 18:00';
  137 |         config.prices.car.exterior = 3600;
  138 |         expect((await post(admin, 'admin/configuration', { expectedVersion: original.version, configuration: config })).ok()).toBe(true);
  139 |         expect((await post(client, 'confirm', { quoteId: q.id, key: q.id })).status()).toBe(409);
  140 |         await visit(cp, 'Recepción');
  141 |         await cp.getByRole('button', { name: 'Horarios e información', exact: true }).click();
  142 |         await expect(cp.getByText('Horario de prueba · 09:00 a 18:00', { exact: true })).toBeVisible();
  143 |         await capture(cp, 'desktop-shared-hours');
  144 |         const fresh = await quote(client), confirmed = await (await post(client, 'confirm', { quoteId: fresh.id, key: fresh.id })).json();
  145 |         expect(confirmed.order.quote.total).toBe(4014);
  146 |         const current = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
  147 |         current.prices.car.exterior = 3700;
  148 |         expect((await post(admin, 'admin/configuration', { expectedVersion: current.version, configuration: current })).ok()).toBe(true);
  149 |         expect((await session(client)).order.quote.total).toBe(4014);
  150 |         const stale = await post(admin, 'admin/configuration', { expectedVersion: original.version, configuration: original });
  151 |         expect(stale.status()).toBe(409);
  152 |         await ap.getByRole('button', { name: 'Servicios y precios', exact: true }).click();
  153 |         await capture(ap, 'desktop-admin-prices');
  154 |         // Load the newest server revision explicitly, then exercise the real
  155 |         // editor. Background synchronization must not discard an editing draft.
  156 |         await Promise.all([ap.waitForResponse(r => r.url().endsWith('/api/demo/admin/snapshot')), ap.getByRole('button', { name: 'Actualizar administración' }).click()]);
  157 |         await ap.getByRole('button', { name: 'Configuración', exact: true }).click();
  158 |         await ap.getByRole('button', { name: 'Descartar edición y recargar', exact: true }).click();
  159 |         await ap.getByRole('button', { name: 'Servicios y precios', exact: true }).click();
  160 |         await ap.getByLabel('Carro · USD', { exact: true }).first().fill('37.50');
  161 |         await ap.getByRole('button', { name: 'Guardar catálogo y tarifas', exact: true }).click();
  162 |         await expect(ap.getByRole('status').filter({ hasText: 'Configuración guardada y publicada.' })).toBeVisible();
  163 |         expect((await (await client.request.get(base + '/api/demo/catalog')).json()).prices.car.exterior).toBe(3750);
  164 |         expect((await session(client)).order.quote.total).toBe(4014);
  165 |         await capture(ap, 'desktop-admin-editor-saved');
  166 |     }
  167 |     finally {
  168 |         const current = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
  169 |         await post(admin, 'admin/configuration', { expectedVersion: current.version, configuration: original });
  170 |         await admin.close();
  171 |         await client.close();
  172 |     }
  173 | });
  174 | test('Cliente y administrador comparten llegada, fila, bahía, tarea, entrega e historial', async ({ browser }) => {
  175 |     test.setTimeout(240000);
  176 |     const admin = await browser.newContext(), client = await browser.newContext(), ap = await admin.newPage(), cp = await client.newPage(), errors = errorsFor(cp);
  177 |     await login(ap);
  178 |     await load(cp);
  179 |     const q = await quote(client), confirmed = await (await post(client, 'confirm', { quoteId: q.id, key: q.id })).json(), id = confirmed.order.id;
  180 |     await visit(cp, 'Mi vehículo');
  181 |     await expect(cp.getByRole('button', { name: 'Solicitar revisión de llegada', exact: true })).toBeVisible();
  182 |     expect((await cp.evaluate(() => window.__FEBLES__.snapshot()) as any).world.vehicles).toHaveLength(0);
  183 |     await visit(cp, 'Mi orden');
  184 |     await expect(cp.getByText('Orden confirmada', { exact: true })).toBeVisible();
  185 |     await cp.getByRole('button', { name: 'Solicitar revisión de llegada', exact: true }).click();
  186 |     await expect(cp.getByRole('status').filter({ hasText: 'Revisión de llegada solicitada.' })).toBeVisible();
  187 |     const requested = await session(client);
  188 |     expect(requested.order.attention).toBe('not-arrived');
  189 |     expect(requested.order.worldEntityId).toBeNull();
  190 |     expect(requested.order.payment).toBe('pending');
  191 |     expect(requested.order.arrivalRequestedAt).toBeTruthy();
  192 |     expect((await cp.evaluate(() => window.__FEBLES__.snapshot()) as any).world.vehicles).toHaveLength(0);
  193 |     const repeated = await (await post(client, 'arrival-request', { orderId: id })).json();
```