import {describe,it,expect} from 'vitest'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createLocalServices} from '../../server/services'
import {DemoOperationSource} from '../../src/domain/DemoOperationSource'
import {quoteDemoServices} from '../../src/domain/DemoOrderSource'

describe('SQLite services and operational persistence',()=>{
 it('reopens catalog, password accounts and operational checkpoint without completing work on restart',()=>{
  const path=join(mkdtempSync(join(tmpdir(),'carwash-db-test-')),'test.sqlite')
  let app=createLocalServices(path)
  const admin=app.auth.create({username:'owner',name:'Owner',role:'admin',password:'test-only-password-123'})
  expect(app.auth.authenticate('owner','wrong')).toBeNull()
  expect(app.auth.authenticate('OWNER','test-only-password-123')?.role).toBe('admin')
  expect(app.users.list()[0]).not.toHaveProperty('passwordHash')
  expect(()=>app.auth.update(admin.id,false,undefined)).toThrow(/administrador activo/)
  const config=app.catalog.load(),original=config.version
  config.services!.push({id:'ceramic',label:'Protección cerámica',description:'',includes:'',conditions:'',care:''})
  for(const prices of Object.values(config.prices))prices.ceramic=4200
  const published=app.catalog.update(config,original)
  expect(()=>app.catalog.update(config,original)).toThrow(/cambió/)
  expect(quoteDemoServices(['ceramic'],'car',published).services[0].label).toBe('Protección cerámica')
  const operation=new DemoOperationSource('operation')
  operation.addOrder('a',['ceramic','exterior'],'#ddd','car',published.services)
  operation.assignOrder('a','01');operation.tick(100)
  operation.advanceVehicle('a')
  expect(operation.snapshot().vehicles[0].tasks.map(t=>t.status)).toEqual(['done','active','pending'])
  app.runtime.save(operation.checkpoint());app.close()
  app=createLocalServices(path)
  expect(app.catalog.load().services!.some(s=>s.id==='ceramic')).toBe(true)
  expect(app.auth.authenticate('owner','test-only-password-123')?.id).toBe(admin.id)
  const resumed=new DemoOperationSource('operation');resumed.restore(app.runtime.load<ReturnType<DemoOperationSource['checkpoint']>>()!)
  expect(resumed.snapshot()).toEqual(operation.snapshot())
  resumed.advanceVehicle('a');expect(resumed.snapshot().vehicles[0].tasks.at(-1)?.status).toBe('active')
  resumed.completeService('a');resumed.tick(100);resumed.tick(100)
  expect(resumed.snapshot().vehicles[0].stage).toBe('handover')
  expect(resumed.snapshot().vehicles[0].tasks.every(t=>t.status==='done')).toBe(true)
  app.close();operation.dispose();resumed.dispose()
 })
 it('runs with an independent in-memory repository and validates roles and credentials',()=>{
  const app=createLocalServices(':memory:')
  expect(app.users.list()).toHaveLength(0)
  expect(()=>app.auth.create({username:'root',name:'Bad',role:'superuser',password:'test-password-123'})).toThrow()
  expect(()=>app.auth.create({username:'staff',name:'Staff',role:'employee',password:'short'})).toThrow()
  const staff=app.auth.create({username:'staff',name:'Staff',role:'employee',password:'test-password-123'})
  app.auth.update(staff.id,false,undefined)
  expect(app.auth.authenticate('staff','test-password-123')).toBeNull();app.close()
 })
})
