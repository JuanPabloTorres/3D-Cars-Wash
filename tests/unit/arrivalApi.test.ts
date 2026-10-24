import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { demoApi } from '../../server/demoApi'

type Middleware = (request: IncomingMessage, response: ServerResponse, next: () => void) => void
const fixtureKey = 'arrival-test-only-admin-key'
let server: ReturnType<typeof createServer>, base: string

/** Real HTTP and SQLite boundary, isolated per fixture from the project database. */
async function client(admin = false) {
    let cookie = '', nonce = ''
    const request = async (path: string, data?: unknown, headers: Record<string, string> = {}) => {
        const response = await fetch(`${base}/api/demo/${path}`, {
            method: data === undefined ? 'GET' : 'POST',
            headers: { Cookie: cookie, ...(data === undefined ? {} : { Origin: base, 'Content-Type': 'application/json', 'X-Demo-Nonce': nonce }), ...headers },
            body: data === undefined ? undefined : JSON.stringify(data),
        })
        if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie')!.split(';')[0]
        if(response.ok&&(path==='auth/register'||path==='auth/login'||path==='session'))nonce=(await response.clone().json()).nonce
        return response
    }
    const session = async () => (await request('session')).json()
    nonce = (await session()).nonce
    if (admin) expect((await request('admin/login', { key: fixtureKey })).status).toBe(200)
    return { request, session, cookie:()=>cookie }
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
    const plugin = demoApi({ databasePath: ':memory:' }) as { configureServer: (context: unknown) => void }
    plugin.configureServer({ middlewares: { use: (handler: Middleware) => { middleware = handler } }, httpServer: server })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    vi.unstubAllEnvs()
})

describe('private arrival review request', () => {
    it('uses signed JWT for login and rejects tampering, raw session IDs and logout replay',async()=>{
        const customer=await client()
        const registered=await customer.request('auth/register',{username:'jwt.customer',name:'JWT customer',password:'test-password-only-123'})
        expect(registered.status).toBe(200)
        const header=registered.headers.get('set-cookie')!
        expect(header.includes('HttpOnly')).toBe(true);expect(header.includes('SameSite=Strict')).toBe(true)
        const original=customer.cookie(),separator=original.indexOf('='),name=original.slice(0,separator),token=original.slice(separator+1)
        const pieces=token.split('.');expect(pieces.length).toBe(3)
        const claims=JSON.parse(Buffer.from(pieces[1],'base64url').toString())
        expect(claims).not.toHaveProperty('role');expect(claims).not.toHaveProperty('password')
        const probe=async(value:string)=>fetch(base+'/api/demo/session',{headers:{Cookie:name+'='+value}}).then(r=>r.json())
        const tampered=[pieces[0],Buffer.from(JSON.stringify({...claims,sub:'another-user'})).toString('base64url'),pieces[2]].join('.')
        expect((await probe(tampered)).role).toBe('visitor')
        expect((await probe(claims.jti)).role).toBe('visitor')
        expect((await customer.session()).role).toBe('customer')
        expect((await customer.request('logout',{})).status).toBe(200)
        expect((await probe(token)).role).toBe('visitor')
        const privileged=await fetch(base+'/api/demo/admin/snapshot',{headers:{Cookie:original}})
        expect(privileged.status).toBe(403)
    })
    it('revokes customer access without exposing or duplicating their order and restores ownership after reactivation',async()=>{
        const customer=await client(),admin=await client(true)
        const registered=await customer.request('auth/register',{username:'customer',name:'Customer',password:'test-password-only-123',role:'admin'})
        expect(registered.status).toBe(200)
        const account=await registered.json();expect(account.role).toBe('customer')
        const order=await confirm(customer),id=account.profile.account.id
        expect((await customer.request('admin/snapshot')).status).toBe(403)
        expect((await admin.request('admin/users',{id,enabled:false})).status).toBe(200)
        expect((await customer.session()).order).toBeNull()
        expect((await customer.request('auth/login',{username:'customer',password:'test-password-only-123'})).status).toBe(403)
        await admin.request('admin/users',{id,enabled:true})
        const recovered=await customer.request('auth/login',{username:'customer',password:'test-password-only-123'})
        expect(recovered.status).toBe(200);expect((await recovered.json()).order.id).toBe(order.id)
        const snapshot=await(await admin.request('admin/snapshot')).json()
        expect(snapshot.orders.filter((o:{id:string})=>o.id===order.id)).toHaveLength(1)
    })
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
