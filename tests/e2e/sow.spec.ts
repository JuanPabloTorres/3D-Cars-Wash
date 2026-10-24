import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'node:fs/promises';
// Login secrets must never enter traces or videos. Screenshots show only UI.
test.use({ trace: 'off', video: 'off' });
const base = 'http://127.0.0.1:4173', evidence = `${process.env.CARWASH_EVIDENCE_DIR || 'docs/evidence/pilot-20261023/after'}/e2e-sow`;
async function capture(page: Page, name: string) { await fs.mkdir(evidence, { recursive: true }); if (page.url().endsWith('/admin'))
    await page.locator('.admin-shell').evaluate(el => el.scrollTop = 0); await page.screenshot({ path: `${evidence}/${name}.png`, animations: 'disabled' }); }
async function load(page: Page) { await page.goto('/'); await page.locator('[data-ready=true]').waitFor({ timeout: 60000 }); }
async function visit(page: Page, label: string) { await page.getByRole('button', { name: /^Visitar(?: Orden activa)?$/ }).click(); await page.getByRole('navigation', { name: 'Visitar un área' }).getByRole('button', { name: label }).click(); await page.waitForFunction(() => !(window.__FEBLES__.snapshot() as any).destination); }
async function login(page: Page) { await page.goto('/admin'); await page.getByLabel('Clave local de administración').fill((await fs.readFile('server/.local-admin-token', 'utf8')).trim()); await page.getByRole('button', { name: 'Entrar al panel local' }).click(); await page.getByRole('heading', { name: 'Fila, bahías y próximas acciones' }).waitFor(); }
async function session(context: BrowserContext) { return (await context.request.get(base + '/api/demo/session')).json(); }
async function post(context: BrowserContext, path: string, data: unknown) { const s = await session(context); return context.request.post(base + '/api/demo/' + path, { headers: { Origin: base, 'X-Demo-Nonce': s.nonce }, data }); }
async function quote(context: BrowserContext) { return (await post(context, 'quote', { services: ['exterior'], vehicle: { type: 'car', color: 'Azul', contact: 'test@example.test' } })).json(); }
const errorsFor = (page: Page) => { const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); return errors; };

const counterLabels = ['Servicios', 'Horarios', 'El local', 'Preguntas'] as const;
/** Measure transformed DOM targets in viewport pixels, rather than local 3D scale. */
async function counterTargets(page: Page) {
    await expect(page.locator('.counter-display')).toHaveCount(counterLabels.length);
    const viewport = page.viewportSize()!;
    const targets = [];
    for (const label of counterLabels) {
        const control = page.getByRole('button', { name: `Abrir ${label} del mostrador`, exact: true });
        await expect(control).toBeVisible();
        const box = await control.boundingBox();
        expect(box, label).not.toBeNull();
        // DOMRect can round 44px to 43.999969px under projected HTML placement.
        // Allow only 0.01px measurement error; CSS must still require at least 44px.
        const measurementTolerance = .01;
        expect(box!.width + measurementTolerance, `${label}: ancho táctil real`).toBeGreaterThanOrEqual(44);
        expect(box!.height + measurementTolerance, `${label}: alto táctil real`).toBeGreaterThanOrEqual(44);
        const css = await control.evaluate(el => {
            const style = getComputedStyle(el);
            return { minWidth: parseFloat(style.minWidth), minHeight: parseFloat(style.minHeight) };
        });
        expect(css.minWidth, `${label}: mínimo CSS de ancho`).toBeGreaterThanOrEqual(44);
        expect(css.minHeight, `${label}: mínimo CSS de alto`).toBeGreaterThanOrEqual(44);
        expect(box!.x, label).toBeGreaterThanOrEqual(0);
        expect(box!.y, label).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width, label).toBeLessThanOrEqual(viewport.width);
        expect(box!.y + box!.height, label).toBeLessThanOrEqual(viewport.height);
        // A visible rectangle alone does not prove that an overlay leaves it clickable.
        expect(await control.evaluate(el => {
            const b = el.getBoundingClientRect();
            return el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2));
        }), `${label}: centro accesible`).toBe(true);
        targets.push({ label, ...box!, css });
    }
    for (let i = 0; i < targets.length; i++) {
        for (let j = i + 1; j < targets.length; j++) {
            const a = targets[i], b = targets[j];
            const overlaps = Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x)
                && Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y);
            expect(overlaps, `${a.label} y ${b.label}: targets sin solapamiento`).toBe(false);
        }
    }
    return targets;
}

for (const viewport of [{ width: 1855, height: 848 }, { width: 1440, height: 900 }, { width: 650, height: 900 }, { width: 390, height: 844 }]) {
    test(`Piloto: cuatro objetos completos y utilizables a ${viewport.width}×${viewport.height}`, async ({ page }) => {
        const errors = errorsFor(page);
        await page.setViewportSize(viewport);
        await load(page);
        await visit(page, 'Recepción');
        // Preparing an order is still reachable through Ana's dialogue, without a fifth prop.
        await page.getByRole('button', { name: /Preparar mi orden/ }).click();
        await expect(page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        const targets = await counterTargets(page);
        await capture(page, `pilot-counter-${viewport.width}`);
        await fs.writeFile(`${evidence}/pilot-targets-${viewport.width}.json`, JSON.stringify({ viewport, targets, errors }, null, 2));
        expect(errors).toEqual([]);
    });
}

test('Piloto: Tab, Enter y Escape conservan foco y selección entre objetos y diálogo', async ({ page }) => {
    await load(page);
    await visit(page, 'Recepción');
    await page.keyboard.press('Escape');
    const reached = new Set<string>();
    await page.getByRole('button', { name: 'Abrir cuenta de Visitante', exact: true }).focus();
    for (let step = 0; step < 30 && reached.size < counterLabels.length; step++) {
        await page.keyboard.press('Tab');
        const label = await page.evaluate(() => document.activeElement?.matches('.counter-display') ? document.activeElement.getAttribute('aria-label') : null);
        if (label) reached.add(label);
    }
    expect([...reached].sort()).toEqual(counterLabels.map(label => `Abrir ${label} del mostrador`).sort());
    await capture(page, 'pilot-counter-keyboard-focus');
    const services = page.getByRole('button', { name: 'Abrir Servicios del mostrador', exact: true });
    await services.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Servicios', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(services).toBeFocused();
    const questions = page.getByRole('button', { name: 'Abrir Preguntas del mostrador', exact: true });
    await questions.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Servicios disponibles', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(questions).toBeFocused();
    await services.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Quitar Lavado exterior', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await page.getByRole('button', { name: /Retomar mi solicitud/ }).click();
    await expect(page.getByLabel('Tipo de vehículo')).toBeVisible();
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Quitar Lavado exterior', exact: true })).toBeVisible();
});
test('Operación vacía, cuenta de sesión, logout real y permisos administrativos', async ({ browser }) => {
    const context = await browser.newContext(), page = await context.newPage(), errors = errorsFor(page);
    await load(page);
    expect((await page.evaluate(() => window.__FEBLES__.snapshot()) as any).world.vehicles).toHaveLength(0);
    const denied = await context.request.get(base + '/api/demo/admin/snapshot');
    expect(denied.status()).toBe(403);
    await page.getByRole('button', { name: 'Abrir cuenta de Visitante' }).click();
    await page.getByLabel('Nombre para esta visita').fill('Visitante prueba');
    await page.getByRole('button', { name: 'Guardar perfil' }).click();
    await expect(page.getByRole('button', { name: 'Abrir cuenta de Visitante prueba' })).toBeVisible();
    await capture(page, 'desktop-account');
    await page.getByRole('button', { name: 'Cerrar sesión DEMO' }).click();
    await expect(page.getByRole('button', { name: 'Abrir cuenta de Visitante', exact: true })).toBeVisible();
    expect((await session(context)).profile.name).toBe('Visitante');
    expect(errors).toEqual([]);
    await context.close();
});
test('Administración publica contenido y precios; cotización obsoleta se rechaza sin alterar precio aceptado', async ({ browser }) => {
    const admin = await browser.newContext(), client = await browser.newContext(), ap = await admin.newPage(), cp = await client.newPage();
    await login(ap);
    await load(cp);
    const original = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
    try {
        const q = await quote(client), config = structuredClone(original);
        config.business.hours = 'Horario de prueba · 09:00 a 18:00';
        config.prices.car.exterior = 3600;
        expect((await post(admin, 'admin/configuration', { expectedVersion: original.version, configuration: config })).ok()).toBe(true);
        expect((await post(client, 'confirm', { quoteId: q.id, key: q.id })).status()).toBe(409);
        await visit(cp, 'Recepción');
        await cp.getByRole('button', { name: 'Horarios', exact: true }).click();
        await expect(cp.getByText('Horario de prueba · 09:00 a 18:00', { exact: true })).toBeVisible();
        await capture(cp, 'desktop-shared-hours');
        const fresh = await quote(client), confirmed = await (await post(client, 'confirm', { quoteId: fresh.id, key: fresh.id })).json();
        expect(confirmed.order.quote.total).toBe(4014);
        const current = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
        current.prices.car.exterior = 3700;
        expect((await post(admin, 'admin/configuration', { expectedVersion: current.version, configuration: current })).ok()).toBe(true);
        expect((await session(client)).order.quote.total).toBe(4014);
        const stale = await post(admin, 'admin/configuration', { expectedVersion: original.version, configuration: original });
        expect(stale.status()).toBe(409);
        await ap.getByRole('button', { name: 'Servicios y precios', exact: true }).click();
        await capture(ap, 'desktop-admin-prices');
        // Load the newest server revision explicitly, then exercise the real
        // editor. Background synchronization must not discard an editing draft.
        await Promise.all([ap.waitForResponse(r => r.url().endsWith('/api/demo/admin/snapshot')), ap.getByRole('button', { name: 'Actualizar administración' }).click()]);
        await ap.getByRole('button', { name: 'Configuración', exact: true }).click();
        await ap.getByRole('button', { name: 'Descartar edición y recargar', exact: true }).click();
        await ap.getByRole('button', { name: 'Servicios y precios', exact: true }).click();
        await ap.getByLabel('Carro · USD', { exact: true }).first().fill('37.50');
        await ap.getByRole('button', { name: 'Guardar catálogo y tarifas', exact: true }).click();
        await expect(ap.getByRole('status').filter({ hasText: 'Configuración guardada y publicada.' })).toBeVisible();
        expect((await (await client.request.get(base + '/api/demo/catalog')).json()).prices.car.exterior).toBe(3750);
        expect((await session(client)).order.quote.total).toBe(4014);
        await capture(ap, 'desktop-admin-editor-saved');
    }
    finally {
        const current = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
        await post(admin, 'admin/configuration', { expectedVersion: current.version, configuration: original });
        await admin.close();
        await client.close();
    }
});
test('Cliente y administrador comparten llegada, fila, bahía, tarea, entrega e historial', async ({ browser }) => {
    test.setTimeout(240000);
    const admin = await browser.newContext(), client = await browser.newContext(), ap = await admin.newPage(), cp = await client.newPage(), errors = errorsFor(cp);
    await login(ap);
    await load(cp);
    const q = await quote(client), confirmed = await (await post(client, 'confirm', { quoteId: q.id, key: q.id })).json(), id = confirmed.order.id;
    await visit(cp, 'Mi vehículo');
    await expect(cp.getByRole('button', { name: 'Solicitar revisión de llegada', exact: true })).toBeVisible();
    expect((await cp.evaluate(() => window.__FEBLES__.snapshot()) as any).world.vehicles).toHaveLength(0);
    await visit(cp, 'Mi orden');
    await expect(cp.getByText('Orden confirmada', { exact: true })).toBeVisible();
    await cp.getByRole('button', { name: 'Solicitar revisión de llegada', exact: true }).click();
    await expect(cp.getByRole('status').filter({ hasText: 'Revisión de llegada solicitada.' })).toBeVisible();
    const requested = await session(client);
    expect(requested.order.attention).toBe('not-arrived');
    expect(requested.order.worldEntityId).toBeNull();
    expect(requested.order.payment).toBe('pending');
    expect(requested.order.arrivalRequestedAt).toBeTruthy();
    expect((await cp.evaluate(() => window.__FEBLES__.snapshot()) as any).world.vehicles).toHaveLength(0);
    const repeated = await (await post(client, 'arrival-request', { orderId: id })).json();
    expect(repeated.order).toEqual(requested.order);
    await capture(cp, 'desktop-arrival-requested');
    await cp.reload();
    await cp.locator('[data-ready=true]').waitFor();
    await visit(cp, 'Mi orden');
    await expect(cp.getByRole('status').filter({ hasText: 'Revisión de llegada solicitada.' })).toBeVisible();
    await expect(cp.getByRole('button', { name: 'Solicitar revisión de llegada', exact: true })).toHaveCount(0);
    await ap.getByRole('button', { name: new RegExp(id) }).click();
    await expect(ap.getByText('Revisión de llegada solicitada. Verifica la presencia del visitante antes de confirmar.', { exact: true })).toBeVisible();
    await capture(ap, 'desktop-admin-arrival-request');
    await ap.getByRole('button', { name: 'Confirmar llegada', exact: true }).click();
    await cp.waitForFunction(() => { const s = window.__FEBLES__.snapshot() as any; return s.world.vehicles.length === 1 && s.world.vehicles[0].stage === 'queued'; });
    await expect(cp.getByText('Turno 1', { exact: true })).toBeVisible();
    await expect(cp.getByRole('status').filter({ hasText: 'Revisión de llegada solicitada.' })).toHaveCount(0);
    await capture(cp, 'desktop-order-queue');
    await ap.getByRole('button', { name: 'Asignar atención', exact: true }).click();
    await cp.waitForFunction(() => { const s = window.__FEBLES__.snapshot() as any; return s.world.vehicles[0]?.stage === 'washing' && !s.world.vehicles[0]?.movement; }, null, { timeout: 100000 });
    await visit(cp, 'Mi vehículo');
    await expect(cp.getByText('Bahía 01', { exact: true })).toBeVisible();
    await capture(cp, 'desktop-active-bay');
    await capture(ap, 'desktop-admin-operation');
    const world = await cp.evaluate(() => window.__FEBLES__.snapshot()) as any;
    expect(world.world.vehicles[0].worldEntityId).toBe(confirmed.order.worldEntityId || 'order-' + id);
    expect(world.world.vehicles[0].type).toBe('car');
    expect(JSON.stringify(world.world)).not.toContain('test@example.test');
    const unauthorized = await post(client, 'admin/command', { action: 'task', orderId: id, expectedRevision: (await session(client)).order.revision });
    expect(unauthorized.status()).toBe(403);
    await ap.getByRole('button', { name: 'Completar tarea activa', exact: true }).click();
    await cp.waitForFunction(() => (window.__FEBLES__.snapshot() as any).world.vehicles[0]?.stage === 'inspection');
    await ap.getByRole('button', { name: 'Completar tarea activa', exact: true }).click();
    await expect(cp.getByText('Listo para entrega', { exact: true })).toBeVisible();
    await capture(cp, 'desktop-ready');
    await ap.getByRole('button', { name: 'Mover a entrega', exact: true }).click();
    await cp.waitForFunction(() => (window.__FEBLES__.snapshot() as any).world.vehicles[0]?.stage === 'handover', null, { timeout: 100000 });
    await ap.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
    await expect(cp.getByText('Servicio entregado', { exact: true })).toBeVisible();
    expect((await session(client)).order.payment).toBe('pending');
    await cp.reload();
    await cp.locator('[data-ready=true]').waitFor();
    await visit(cp, 'Mi orden');
    await expect(cp.getByText('Servicio entregado', { exact: true })).toBeVisible();
    await capture(cp, 'desktop-delivered');
    expect(errors).toEqual([]);
    await admin.close();
    await client.close();
});
test('Solicitud de contacto confirmada llega a administración; sin permiso no se recibe', async ({ browser }) => {
    const admin = await browser.newContext(), client = await browser.newContext(), ap = await admin.newPage(), cp = await client.newPage();
    await login(ap);
    await load(cp);
    const original = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
    try {
        const denied = await post(client, 'contact', { question: 'Consulta de prueba', contact: 'test@example.test', confirmed: true, key: 'not-enabled' });
        expect(denied.status()).toBe(409);
        const enabled = structuredClone(original);
        enabled.business.contactRequestsAvailable = true;
        await post(admin, 'admin/configuration', { expectedVersion: original.version, configuration: enabled });
        await visit(cp, 'Recepción');
        await cp.getByRole('button', { name: /Preguntar a Ana/ }).click();
        await cp.getByRole('button', { name: 'Tengo otra pregunta' }).click();
        await cp.getByLabel('Tu pregunta').fill('Consulta de prueba sobre cuidado especial');
        await cp.getByRole('button', { name: 'Revisar mi consulta' }).click();
        await cp.getByLabel('Contacto para responder').fill('test@example.test');
        await cp.getByRole('button', { name: 'Confirmar y enviar solicitud' }).click();
        await expect(cp.getByText(/Solicitud recibida por recepción local/)).toBeVisible();
        await capture(cp, 'desktop-contact-receipt');
        const receiptText = await cp.getByRole('status').filter({ hasText: 'Solicitud recibida por recepción local' }).textContent(), requestId = receiptText!.match(/C-[a-f0-9]+/)![0];
        await ap.getByRole('button', { name: 'Contenido y atención', exact: true }).click();
        const request = ap.locator('.admin-contact').filter({ hasText: requestId });
        await expect(request.getByText('Consulta de prueba sobre cuidado especial', { exact: true })).toBeVisible();
        await capture(ap, 'desktop-admin-contact');
        await request.getByRole('button', { name: 'Marcar revisada', exact: true }).click();
        await expect(request.getByText(/· Revisada/)).toBeVisible();
    }
    finally {
        const current = (await (await admin.request.get(base + '/api/demo/admin/snapshot')).json()).configuration;
        await post(admin, 'admin/configuration', { expectedVersion: current.version, configuration: original });
        await admin.close();
        await client.close();
    }
});
test('Móvil: recepción, cuatro objetos accesibles, navegación, cuenta y administración', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), page = await context.newPage(), errors = errorsFor(page);
    await load(page);
    await capture(page, 'mobile-entry');
    await visit(page, 'Recepción');
    await capture(page, 'mobile-reception');
    await expect(page.locator('.counter-display')).toHaveCount(4);
    await page.keyboard.press('Escape');
    for (const display of await page.locator('.counter-display').all()) {
        const box = await display.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(390);
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('button', { name: 'Abrir Servicios del mostrador', exact: true }).click();
    await expect(page.getByText('El cuidado que tu auto necesita.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await page.getByRole('button', { name: 'Conocer servicios', exact: false }).click();
    await capture(page, 'mobile-services');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Abrir cuenta de Visitante', exact: true }).click();
    await capture(page, 'mobile-account');
    await page.getByRole('button', { name: 'Cerrar Cuenta', exact: true }).click();
    await page.getByRole('button', { name: 'Ayuda de la visita', exact: true }).click();
    await page.getByText('Completar el servicio', { exact: true }).click();
    await capture(page, 'mobile-flow');
    await page.keyboard.press('Escape');
    await login(page);
    await capture(page, 'mobile-admin-operation');
    await page.getByRole('button', { name: 'Servicios y precios', exact: true }).click();
    await capture(page, 'mobile-admin-prices');
    expect(errors).toEqual([]);
    await context.close();
});
test('Ana saluda, señala servicios y explica vehículo, revisión e información antes de escuchar', async ({ page }) => {
    test.setTimeout(150000);
    const explanations: Array<{ step: string; active: string; time: number }> = [];
    const explanation = async (step: string) => {
        const observed = await page.waitForFunction(() => {
            const animation = (window.__FEBLES__.snapshot() as any).animations.receptionist;
            return animation?.active === 'Talk' && animation.time > .2 ? { active: animation.active, time: animation.time } : null;
        });
        const animation = await observed.jsonValue();
        expect(animation).not.toBeNull();
        explanations.push({ step, ...animation! });
        await capture(page, `desktop-reception-${step}-explanation`);
        await page.waitForFunction(() => (window.__FEBLES__.snapshot() as any).animations.receptionist?.active === 'Idle');
    };
    await load(page);
    await visit(page, 'Recepción');
    await page.waitForFunction(() => (window.__FEBLES__.snapshot() as any).animations.receptionist?.active === 'Greet');
    await capture(page, 'desktop-reception-greeting');
    await page.waitForFunction(() => (window.__FEBLES__.snapshot() as any).animations.receptionist?.active === 'Idle');
    await page.getByRole('button', { name: /Conocer servicios/ }).click();
    await page.waitForFunction(() => { const a = (window.__FEBLES__.snapshot() as any).animations.receptionist; return a?.active === 'PointServices' && a.time > .8 && a.time < 2.5; });
    await capture(page, 'desktop-reception-pointing');
    await page.getByRole('button', { name: 'Añadir Lavado exterior', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await expect(page.getByLabel('Tipo de vehículo')).toBeVisible();
    await explanation('vehicle');
    await page.getByRole('button', { name: 'Revisar cotización', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Revisar cotización', exact: true })).toBeVisible();
    await explanation('review');
    await expect(page.getByRole('button', { name: 'Confirmar orden DEMO', exact: true })).toBeVisible();
    expect((await (await page.request.get('/api/demo/session')).json()).order).toBeNull();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Abrir Horarios del mostrador', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Horarios', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Horarios', exact: true })).toBeVisible();
    await explanation('information');
    await capture(page, 'desktop-reception-listening');
    await fs.writeFile(`${evidence}/reception-explanations.json`, JSON.stringify({ explanations, screenshotPhase: 'Approximate: Three.js animation continues while capturing.' }, null, 2));
});
