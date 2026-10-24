# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sow.spec.ts >> Ana saluda, señala servicios y explica vehículo, revisión e información antes de escuchar
- Location: tests\e2e\sow.spec.ts:309:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Información del establecimiento', exact: true })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Información del establecimiento', exact: true }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Información del establecimiento', exact: true })

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
  - dialog "Horarios e información":
    - text: ANA · RECEPCIÓN · ENTORNO DEMO
    - heading "Horarios e información" [level=2]
    - button "Cerrar Horarios e información":
      - img
    - heading "Horarios" [level=3]
    - paragraph:
      - img
      - text: Horario pendiente de configuración. Consulta al personal antes de planificar tu visita.
    - paragraph: Prepara los servicios y el vehículo, revisa la cotización y confirma tu solicitud. El personal debe confirmar llegada, atención, pago y entrega.
    - paragraph: El alcance se revisa con el personal. La visita virtual no confirma presencia física, pagos ni garantías.
    - heading "Contacto y redes" [level=3]
    - paragraph: El negocio todavía no ha configurado un medio de contacto o redes oficiales.
    - text: Contenido administrativo revisado el 2026-10-24 · DEMO.
    - button "Volver":
      - img
      - text: Volver
  - text: Recepción abierta.
```

# Test source

```ts
  242 |     await login(ap);
  243 |     await load(cp);
  244 |     const original = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
  245 |     try {
  246 |         const denied = await post(client, 'contact', { question: 'Consulta de prueba', contact: 'test@example.test', confirmed: true, key: 'not-enabled' });
  247 |         expect(denied.status()).toBe(409);
  248 |         const enabled = structuredClone(original);
  249 |         enabled.business.contactRequestsAvailable = true;
  250 |         await post(admin, 'admin/configuration', { expectedVersion: original.version, configuration: enabled });
  251 |         await visit(cp, 'Recepción');
  252 |         await cp.getByRole('button', { name: /Preguntar a Ana/ }).click();
  253 |         await cp.getByRole('button', { name: 'Tengo otra pregunta' }).click();
  254 |         await cp.getByLabel('Tu pregunta').fill('Consulta de prueba sobre cuidado especial');
  255 |         await cp.getByRole('button', { name: 'Revisar mi consulta' }).click();
  256 |         await cp.getByLabel('Contacto para responder').fill('test@example.test');
  257 |         await cp.getByRole('button', { name: 'Confirmar y enviar solicitud' }).click();
  258 |         await expect(cp.getByText(/Solicitud recibida por recepción local/)).toBeVisible();
  259 |         await capture(cp, 'desktop-contact-receipt');
  260 |         const receiptText = await cp.getByRole('status').filter({ hasText: 'Solicitud recibida por recepción local' }).textContent(), requestId = receiptText!.match(/C-[a-f0-9]+/)![0];
  261 |         await ap.getByRole('button', { name: 'Contenido y atención', exact: true }).click();
  262 |         const request = ap.locator('.admin-contact').filter({ hasText: requestId });
  263 |         await expect(request.getByText('Consulta de prueba sobre cuidado especial', { exact: true })).toBeVisible();
  264 |         await capture(ap, 'desktop-admin-contact');
  265 |         await request.getByRole('button', { name: 'Marcar revisada', exact: true }).click();
  266 |         await expect(request.getByText(/· Revisada/)).toBeVisible();
  267 |     }
  268 |     finally {
  269 |         const current = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
  270 |         await post(admin, 'admin/configuration', { expectedVersion: current.version, configuration: original });
  271 |         await admin.close();
  272 |         await client.close();
  273 |     }
  274 | });
  275 | test('Móvil: recepción, cuatro objetos accesibles, navegación, cuenta y administración', async ({ browser }) => {
  276 |     const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), page = await context.newPage(), errors = errorsFor(page);
  277 |     await load(page);
  278 |     await capture(page, 'mobile-entry');
  279 |     await visit(page, 'Recepción');
  280 |     await capture(page, 'mobile-reception');
  281 |     await expect(page.locator('.counter-display')).toHaveCount(4);
  282 |     await page.keyboard.press('Escape');
  283 |     for (const display of await page.locator('.counter-display').all()) {
  284 |         const box = await display.boundingBox();
  285 |         expect(box!.x).toBeGreaterThanOrEqual(0);
  286 |         expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  287 |         expect(box!.width).toBeGreaterThanOrEqual(44);
  288 |         expect(box!.height).toBeGreaterThanOrEqual(44);
  289 |     }
  290 |     await page.getByRole('button', { name: 'Abrir Servicios del mostrador', exact: true }).click();
  291 |     await expect(page.getByText('El cuidado que tu auto necesita.', { exact: true })).toBeVisible();
  292 |     await page.getByRole('button', { name: 'Volver', exact: true }).click();
  293 |     await page.getByRole('button', { name: 'Conocer servicios', exact: false }).click();
  294 |     await capture(page, 'mobile-services');
  295 |     await page.keyboard.press('Escape');
  296 |     await page.getByRole('button', { name: 'Abrir cuenta de Visitante', exact: true }).click();
  297 |     await capture(page, 'mobile-account');
  298 |     await page.getByRole('button', { name: 'Cerrar Cuenta', exact: true }).click();
  299 |     await page.getByRole('button', { name: 'Cómo funciona', exact: true }).click();
  300 |     await capture(page, 'mobile-flow');
  301 |     await page.getByRole('button', { name: 'Cerrar cómo funciona', exact: true }).click();
  302 |     await login(page);
  303 |     await capture(page, 'mobile-admin-operation');
  304 |     await page.getByRole('button', { name: 'Servicios y precios', exact: true }).click();
  305 |     await capture(page, 'mobile-admin-prices');
  306 |     expect(errors).toEqual([]);
  307 |     await context.close();
  308 | });
  309 | test('Ana saluda, señala servicios y explica vehículo, revisión e información antes de escuchar', async ({ page }) => {
  310 |     test.setTimeout(150000);
  311 |     const explanations: Array<{ step: string; active: string; time: number }> = [];
  312 |     const explanation = async (step: string) => {
  313 |         const observed = await page.waitForFunction(() => {
  314 |             const animation = (window.__FEBLES__.snapshot() as any).animations.receptionist;
  315 |             return animation?.active === 'Talk' && animation.time > .2 ? { active: animation.active, time: animation.time } : null;
  316 |         });
  317 |         const animation = await observed.jsonValue();
  318 |         expect(animation).not.toBeNull();
  319 |         explanations.push({ step, ...animation! });
  320 |         await capture(page, `desktop-reception-${step}-explanation`);
  321 |         await page.waitForFunction(() => (window.__FEBLES__.snapshot() as any).animations.receptionist?.active === 'Idle');
  322 |     };
  323 |     await load(page);
  324 |     await visit(page, 'Recepción');
  325 |     await page.waitForFunction(() => (window.__FEBLES__.snapshot() as any).animations.receptionist?.active === 'Greet');
  326 |     await capture(page, 'desktop-reception-greeting');
  327 |     await page.waitForFunction(() => (window.__FEBLES__.snapshot() as any).animations.receptionist?.active === 'Idle');
  328 |     await page.getByRole('button', { name: /Conocer servicios/ }).click();
  329 |     await page.waitForFunction(() => { const a = (window.__FEBLES__.snapshot() as any).animations.receptionist; return a?.active === 'PointServices' && a.time > .8 && a.time < 2.5; });
  330 |     await capture(page, 'desktop-reception-pointing');
  331 |     await page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true }).click();
  332 |     await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  333 |     await expect(page.getByLabel('Tipo de vehículo')).toBeVisible();
  334 |     await explanation('vehicle');
  335 |     await page.getByRole('button', { name: 'Revisar cotización', exact: true }).click();
  336 |     await expect(page.getByRole('heading', { name: 'Revisar cotización', exact: true })).toBeVisible();
  337 |     await explanation('review');
  338 |     await expect(page.getByRole('button', { name: 'Confirmar orden DEMO', exact: true })).toBeVisible();
  339 |     expect((await (await page.request.get('/api/demo/session')).json()).order).toBeNull();
  340 |     await page.keyboard.press('Escape');
  341 |     await page.getByRole('button', { name: 'Abrir Horarios del mostrador', exact: true }).click();
> 342 |     await expect(page.getByRole('heading', { name: 'Información del establecimiento', exact: true })).toBeVisible();
      |                                                                                                       ^ Error: expect(locator).toBeVisible() failed
  343 |     await explanation('information');
  344 |     await capture(page, 'desktop-reception-listening');
  345 |     await fs.writeFile(`${evidence}/reception-explanations.json`, JSON.stringify({ explanations, screenshotPhase: 'Approximate: Three.js animation continues while capturing.' }, null, 2));
  346 | });
  347 | 
```