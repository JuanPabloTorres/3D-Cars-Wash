# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sow.spec.ts >> Piloto: cuatro objetos completos y utilizables a 1440×900
- Location: tests\e2e\sow.spec.ts:52:5

# Error details

```
Error: Preguntas: alto táctil real

expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 44
Received:    43.999969482421875
```

# Page snapshot

```yaml
- 'main "CarWash Studio: visita tridimensional" [ref=e3]':
  - generic [ref=e4]:
    - button "Abrir Servicios del mostrador" [ref=e8] [cursor=pointer]:
      - generic [ref=e11]: Servicios
    - button "Abrir Horarios del mostrador" [ref=e13] [cursor=pointer]:
      - generic [ref=e17]: Horarios
    - button "Abrir El local del mostrador" [ref=e19] [cursor=pointer]:
      - generic [ref=e23]: El local
    - button "Abrir Preguntas del mostrador" [ref=e25] [cursor=pointer]:
      - generic [ref=e28]: Preguntas
  - generic:
    - generic:
      - text: CarWash Studio · DEMO
      - generic: Simulación conectada
  - generic [ref=e29]:
    - button "Visitar" [ref=e30] [cursor=pointer]
    - button "Estado de mi orden" [ref=e34] [cursor=pointer]:
      - generic [ref=e38]: Mi orden
    - button "Cómo funciona" [ref=e39] [cursor=pointer]
    - button "Abrir cuenta de Visitante" [ref=e45] [cursor=pointer]:
      - generic [ref=e46]: VI
    - button "Ayuda de la visita" [ref=e50] [cursor=pointer]
  - button "Entrada · Recepción" [ref=e54] [cursor=pointer]:
    - text: Entrada
    - generic [ref=e57]: · Recepción
  - button "Abrir esta área" [ref=e58] [cursor=pointer]
  - generic [ref=e61]: Recepción abierta.
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
  27  |         expect(box!.width, `${label}: ancho táctil real`).toBeGreaterThanOrEqual(44);
> 28  |         expect(box!.height, `${label}: alto táctil real`).toBeGreaterThanOrEqual(44);
      |                                                           ^ Error: Preguntas: alto táctil real
  29  |         expect(box!.x, label).toBeGreaterThanOrEqual(0);
  30  |         expect(box!.y, label).toBeGreaterThanOrEqual(0);
  31  |         expect(box!.x + box!.width, label).toBeLessThanOrEqual(viewport.width);
  32  |         expect(box!.y + box!.height, label).toBeLessThanOrEqual(viewport.height);
  33  |         // A visible rectangle alone does not prove that an overlay leaves it clickable.
  34  |         expect(await control.evaluate(el => {
  35  |             const b = el.getBoundingClientRect();
  36  |             return el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2));
  37  |         }), `${label}: centro accesible`).toBe(true);
  38  |         targets.push({ label, ...box! });
  39  |     }
  40  |     for (let i = 0; i < targets.length; i++) {
  41  |         for (let j = i + 1; j < targets.length; j++) {
  42  |             const a = targets[i], b = targets[j];
  43  |             const overlaps = Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x)
  44  |                 && Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y);
  45  |             expect(overlaps, `${a.label} y ${b.label}: targets sin solapamiento`).toBe(false);
  46  |         }
  47  |     }
  48  |     return targets;
  49  | }
  50  | 
  51  | for (const viewport of [{ width: 1855, height: 848 }, { width: 1440, height: 900 }, { width: 650, height: 900 }, { width: 390, height: 844 }]) {
  52  |     test(`Piloto: cuatro objetos completos y utilizables a ${viewport.width}×${viewport.height}`, async ({ page }) => {
  53  |         const errors = errorsFor(page);
  54  |         await page.setViewportSize(viewport);
  55  |         await load(page);
  56  |         await visit(page, 'Recepción');
  57  |         // Preparing an order is still reachable through Ana's dialogue, without a fifth prop.
  58  |         await page.getByRole('button', { name: /Preparar mi orden/ }).click();
  59  |         await expect(page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true })).toBeVisible();
  60  |         await page.keyboard.press('Escape');
  61  |         const targets = await counterTargets(page);
  62  |         await capture(page, `pilot-counter-${viewport.width}`);
  63  |         await fs.writeFile(`${evidence}/pilot-targets-${viewport.width}.json`, JSON.stringify({ viewport, targets, errors }, null, 2));
  64  |         expect(errors).toEqual([]);
  65  |     });
  66  | }
  67  | 
  68  | test('Piloto: Tab, Enter y Escape conservan foco y selección entre objetos y diálogo', async ({ page }) => {
  69  |     await load(page);
  70  |     await visit(page, 'Recepción');
  71  |     await page.keyboard.press('Escape');
  72  |     const reached = new Set<string>();
  73  |     await page.getByRole('button', { name: 'Abrir cuenta de Visitante', exact: true }).focus();
  74  |     for (let step = 0; step < 30 && reached.size < counterLabels.length; step++) {
  75  |         await page.keyboard.press('Tab');
  76  |         const label = await page.evaluate(() => document.activeElement?.matches('.counter-display') ? document.activeElement.getAttribute('aria-label') : null);
  77  |         if (label) reached.add(label);
  78  |     }
  79  |     expect([...reached].sort()).toEqual(counterLabels.map(label => `Abrir ${label} del mostrador`).sort());
  80  |     await capture(page, 'pilot-counter-keyboard-focus');
  81  |     const services = page.getByRole('button', { name: 'Abrir Servicios del mostrador', exact: true });
  82  |     await services.focus();
  83  |     await page.keyboard.press('Enter');
  84  |     await expect(page.getByRole('dialog', { name: 'Ana · Recepción' })).toBeVisible();
  85  |     await page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true }).click();
  86  |     await page.keyboard.press('Escape');
  87  |     await expect(services).toBeFocused();
  88  |     const questions = page.getByRole('button', { name: 'Abrir Preguntas del mostrador', exact: true });
  89  |     await questions.focus();
  90  |     await page.keyboard.press('Enter');
  91  |     await expect(page.getByRole('button', { name: 'Servicios disponibles', exact: true })).toBeVisible();
  92  |     await page.keyboard.press('Escape');
  93  |     await expect(questions).toBeFocused();
  94  |     await services.focus();
  95  |     await page.keyboard.press('Enter');
  96  |     await expect(page.getByRole('button', { name: 'Quitar Lavado exterior', exact: true })).toBeVisible();
  97  |     await page.getByRole('button', { name: 'Volver', exact: true }).click();
  98  |     await page.getByRole('button', { name: /Retomar mi solicitud/ }).click();
  99  |     await expect(page.getByLabel('Tipo de vehículo')).toBeVisible();
  100 |     await page.getByRole('button', { name: 'Volver', exact: true }).click();
  101 |     await expect(page.getByRole('button', { name: 'Quitar Lavado exterior', exact: true })).toBeVisible();
  102 | });
  103 | test('Operación vacía, cuenta de sesión, logout real y permisos administrativos', async ({ browser }) => {
  104 |     const context = await browser.newContext(), page = await context.newPage(), errors = errorsFor(page);
  105 |     await load(page);
  106 |     expect((await page.evaluate(() => window.__FEBLES__.snapshot()) as any).world.vehicles).toHaveLength(0);
  107 |     const denied = await context.request.get(base + '/api/demo/admin/snapshot');
  108 |     expect(denied.status()).toBe(403);
  109 |     await page.getByRole('button', { name: 'Abrir cuenta de Visitante' }).click();
  110 |     await page.getByLabel('Nombre para esta visita').fill('Visitante prueba');
  111 |     await page.getByRole('button', { name: 'Guardar perfil' }).click();
  112 |     await expect(page.getByRole('button', { name: 'Abrir cuenta de Visitante prueba' })).toBeVisible();
  113 |     await capture(page, 'desktop-account');
  114 |     await page.getByRole('button', { name: 'Cerrar sesión DEMO' }).click();
  115 |     await expect(page.getByRole('button', { name: 'Abrir cuenta de Visitante', exact: true })).toBeVisible();
  116 |     expect((await session(context)).profile.name).toBe('Visitante');
  117 |     expect(errors).toEqual([]);
  118 |     await context.close();
  119 | });
  120 | test('Administración publica contenido y precios; cotización obsoleta se rechaza sin alterar precio aceptado', async ({ browser }) => {
  121 |     const admin = await browser.newContext(), client = await browser.newContext(), ap = await admin.newPage(), cp = await client.newPage();
  122 |     await login(ap);
  123 |     await load(cp);
  124 |     const original = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
  125 |     try {
  126 |         const q = await quote(client), config = structuredClone(original);
  127 |         config.business.hours = 'Horario de prueba · 09:00 a 18:00';
  128 |         config.prices.car.exterior = 3600;
```