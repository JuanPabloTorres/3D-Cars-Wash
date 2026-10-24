import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { demoApi } from '../../server/demoApi'

type Middleware = (request: IncomingMessage, response: ServerResponse, next: () => void) => void
const fixtureKey = 'arrival-test-only-admin-key'
let server: ReturnType<typeof createServer>, base: string

/** Real HTTP boundary with isolated in-memory sessions and no production credentials. */
async function client(admin = false) {
    let cookie = '', nonce = ''
    const request = async (path: string, data?: unknown, headers: Record<string, string> = {}) => {
        const response = await fetch(`${base}/api/demo/${path}`, {
            method: data === undefined ? 'GET' : 'POST',
            headers: { Cookie: cookie, ...(data === undefined ? {} : { Origin: base, 'Content-Type': 'application/json', 'X-Demo-Nonce': nonce }), ...headers },
            body: data === undefined ? undefined : JSON.stringify(data),
        })
        if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie')!.split(';')[0]
        return response
    }
    const session = async () => (await request('session')).json()
    nonce = (await session()).nonce
    if (admin) expect((await request('admin/login', { key: fixtureKey })).status).toBe(200)
    return { request, session }
}
async function confirm(visitor: Awaited<ReturnType<typeof client>>) {
    const quoteResponse = await visitor.request('quote', { services: ['exterior'], vehicle: { type: 'car', color: 'Azul', contact: '' } })
    expect(quoteResponse.status).toBe(200)
    const quote = await quoteResponse.json()
    const response = await visitor.request('confirm', { quoteId: quote.id, key: quote.id })
    expect(response.status).toBe(200)
    return (await response.json()).order
}
beforeEach(async () => {
    vi.stubEnv('CARWASH_ADMIN_TOKEN', fixtureKey)
    let middleware: Middleware
    server = createServer((request, response) => middleware(request, response, () => { response.statusCode = 404; response.end() }))
    const plugin = demoApi() as { configureServer: (context: unknown) => void }
    plugin.configureServer({ middlewares: { use: (handler: Middleware) => { middleware = handler } }, httpServer: server })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    vi.unstubAllEnvs()
})

describe('private arrival review request', () => {
    it('records one private request without confirming presence; only staff creates one queue entity', async () => {
        const visitor = await client(), admin = await client(true), order = await confirm(visitor)
        const response = await visitor.request('arrival-request', { orderId: order.id }), requested = await response.json()
        expect(response.status).toBe(200)
        expect(requested.order).toMatchObject({ status: 'confirmed', attention: 'not-arrived', payment: 'pending', worldEntityId: null, revision: order.revision + 1 })
        expect(Number.isFinite(Date.parse(requested.order.arrivalRequestedAt))).toBe(true)
        const repeated = await (await visitor.request('arrival-request', { orderId: order.id })).json()
        expect(repeated).toEqual(requested)
        const pending = await (await admin.request('admin/snapshot')).json()
        expect(pending.orders.find((o: { id: string }) => o.id === order.id).arrivalRequestedAt).toBe(requested.order.arrivalRequestedAt)
        expect(pending.operation.frame.vehicles).toHaveLength(0)
        expect((await visitor.request('admin/command', { action: 'arrive', orderId: order.id, expectedRevision: requested.order.revision })).status).toBe(403)
        expect((await admin.request('admin/command', { action: 'arrive', orderId: order.id, expectedRevision: order.revision })).status).toBe(409)
        const arrivedResponse = await admin.request('admin/command', { action: 'arrive', orderId: order.id, expectedRevision: requested.order.revision })
        expect(arrivedResponse.status).toBe(200)
        const arrived = await arrivedResponse.json(), current = (await visitor.session()).order
        expect(current).toMatchObject({ attention: 'queued', worldEntityId: `order-${order.id}`, payment: 'pending', arrivalRequestedAt: requested.order.arrivalRequestedAt })
        expect(arrived.operation.frame.vehicles).toHaveLength(1)
        expect(JSON.stringify(arrived.operation.frame)).not.toContain('arrivalRequestedAt')
        expect((await visitor.request('arrival-request', { orderId: order.id })).status).toBe(409)
        expect((await admin.request('admin/command', { action: 'arrive', orderId: order.id, expectedRevision: current.revision })).status).toBe(409)
        expect((await (await admin.request('admin/snapshot')).json()).operation.frame.vehicles).toHaveLength(1)
    })
    it('rejects another session and missing or forged request authority without mutation', async () => {
        const visitor = await client(), stranger = await client(), order = await confirm(visitor)
        expect((await stranger.request('arrival-request', { orderId: order.id })).status).toBe(404)
        expect((await visitor.request('arrival-request', { orderId: order.id }, { Origin: 'http://untrusted.test' })).status).toBe(403)
        expect((await visitor.request('arrival-request', { orderId: order.id }, { Origin: '' })).status).toBe(403)
        expect((await visitor.request('arrival-request', { orderId: order.id }, { 'X-Demo-Nonce': 'invalid' })).status).toBe(403)
        expect((await visitor.request('arrival-request', { orderId: order.id }, { 'X-Demo-Nonce': '' })).status).toBe(403)
        expect((await visitor.request('arrival-request', {})).status).toBe(404)
        expect((await visitor.session()).order).toEqual(order)
        const ownRequest = await (await visitor.request('arrival-request', { orderId: order.id })).json()
        expect(ownRequest.order.arrivalRequestedAt).toBeTruthy()
        expect((await stranger.session()).order).toBeNull()
    })
    it('cannot request arrival for a cancelled order or mutate its history', async () => {
        const visitor = await client(), order = await confirm(visitor)
        const cancelled = await (await visitor.request('cancel', { orderId: order.id })).json()
        expect((await visitor.request('arrival-request', { orderId: order.id })).status).toBe(409)
        expect((await visitor.session()).order).toEqual(cancelled.order)
    })
    it('coalesces simultaneous retries and preserves cancellation after a review request', async () => {
        const visitor = await client(), order = await confirm(visitor)
        const results = await Promise.all([visitor.request('arrival-request', { orderId: order.id }), visitor.request('arrival-request', { orderId: order.id })])
        const snapshots = await Promise.all(results.map(response => response.json()))
        expect(snapshots[0]).toEqual(snapshots[1])
        expect(snapshots[0].order.revision).toBe(order.revision + 1)
        const cancelled = await (await visitor.request('cancel', { orderId: order.id })).json()
        expect(cancelled.order).toMatchObject({ status: 'cancelled', attention: 'not-arrived', worldEntityId: null, payment: 'pending' })
        expect(cancelled.order.arrivalRequestedAt).toBe(snapshots[0].order.arrivalRequestedAt)
        expect((await visitor.request('arrival-request', { orderId: order.id })).status).toBe(409)
    })
})
