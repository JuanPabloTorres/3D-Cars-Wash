import {describe,it,expect} from 'vitest'
import {DatabaseSync} from 'node:sqlite'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Vector3} from 'three'
import {createLocalServices} from '../../server/services'
import {quoteDemoServices} from '../../src/domain/DemoOrderSource'
import {cameraFlight} from '../../src/world/layers/reception/cameraFlight'
import {localTransportAllowed} from '../../server/localTransport'

describe('MVP identity, pricing and navigation contracts',()=>{
 it('keeps the lounge camera still when resizing or selecting the same area',()=>{
  const position=new Vector3(-16.1,1.6,9.9),out=new Vector3()
  const flight=cameraFlight(position,position,'waiting','waiting')
  expect(flight.length).toBe(0)
  for(const t of [0,.25,.5,.75,1])expect(flight.sample(t,out).distanceTo(position)).toBe(0)
 })
 it('migrates legacy accounts without replacing IDs or password hashes',()=>{
  const path=join(mkdtempSync(join(tmpdir(),'cw-migration-')),'legacy.sqlite')
  const old=new DatabaseSync(path)
  old.exec("CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','employee')),password_hash TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL) STRICT")
  old.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run('existing','owner','Owner','admin','preserved-hash',1,'2026-01-01');old.close()
  const app=createLocalServices(path)
  const customer=app.auth.create({username:'customer',name:'Customer',role:'customer',password:'test-only-password-123'})
  expect(app.auth.authenticate('customer','test-only-password-123')?.id).toBe(customer.id)
  expect(app.users.byId('existing')?.role).toBe('admin');app.close()
  const db=new DatabaseSync(path);expect(db.prepare('SELECT password_hash FROM users WHERE id=?').get('existing')?.password_hash).toBe('preserved-hash');expect(db.prepare('PRAGMA user_version').get()?.user_version).toBe(2);db.close()
 })
 it('quotes configured price and duration for all vehicle categories and preserves the quote',()=>{
  const app=createLocalServices(':memory:'),config=app.catalog.load(),id=config.services![0].id
  config.durations={car:{[id]:20},pickup:{[id]:30},truck:{[id]:50},suv:{[id]:35}}
  for(const [i,type] of (['car','pickup','truck','suv'] as const).entries())config.prices[type][id]=2000+i*1000
  const published=app.catalog.update(config,config.version)
  for(const type of ['car','pickup','truck','suv'] as const){const quote=quoteDemoServices([id],type,published);expect(quote.estimatedMinutes).toBe(config.durations[type][id]);expect(quote.services[0].cents).toBe(config.prices[type][id])}
  const frozen=quoteDemoServices([id],'car',published)
  published.durations!.car[id]=99;app.catalog.update(published,published.version)
  expect(frozen.estimatedMinutes).toBe(20)
  const invalid=app.catalog.load();invalid.durations!.car[id]=-2
  expect(()=>app.catalog.update(invalid,invalid.version)).toThrow();app.close()
 })
 it('keeps camera paths continuous, finite and restartable at the rendered position',()=>{
  const a=new Vector3(-6,2,8),b=new Vector3(-17,1.5,7),out=new Vector3(),flight=cameraFlight(a,b,'reception','waiting')
  expect(flight.sample(0,out).distanceTo(a)).toBeLessThan(.00001)
  let previous=a.clone()
  for(let i=1;i<=100;i++){flight.sample(i/100,out);expect(out.toArray().every(Number.isFinite)).toBe(true);expect(out.distanceTo(previous)).toBeLessThan(2);previous.copy(out)}
  expect(out.distanceTo(b)).toBeLessThan(.00001)
  const actual=flight.sample(.42,out).clone(),next=cameraFlight(actual,a,'waiting','reception')
  expect(next.sample(0,out).distanceTo(actual)).toBeLessThan(.00001)
 })
 it('keeps local host validation in container mode and rejects nonlocal sockets by default',()=>{
  const request=(host:string,remoteAddress:string)=>({headers:{host},socket:{remoteAddress}}) as Parameters<typeof localTransportAllowed>[0]
  expect(localTransportAllowed(request('127.0.0.1:4173','127.0.0.1'))).toBe(true)
  expect(localTransportAllowed(request('127.0.0.1:4173','172.18.0.1'))).toBe(false)
  expect(localTransportAllowed(request('127.0.0.1:4173','172.18.0.1'),true)).toBe(true)
  expect(localTransportAllowed(request('attacker.example','127.0.0.1'),true)).toBe(false)
 })
})
