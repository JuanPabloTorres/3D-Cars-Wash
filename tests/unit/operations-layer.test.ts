import {describe,it,expect} from 'vitest'
import {DemoOperationSource} from '../../src/domain/DemoOperationSource'
import {initialWorld,projectOperation} from '../../src/domain/OperationProjection'
import {elapsed,operationGroups,vehiclePosition,publicCode} from '../../src/world/layers/operations/operationPresentation'
import type {OperationEvent} from '../../src/domain/contracts'

describe('operational icon layer contracts',()=>{
 it('staff completion transfers safely and assigns the next queued vehicle without confirming payment or pickup',()=>{
  const source=new DemoOperationSource('operation')
  source.addOrder('a',['exterior','interior'],'#aaa','car');source.addOrder('b',['lights'],'#aaa','suv')
  expect(()=>source.completeService('a')).toThrow()
  source.assignOrder('a','01');expect(()=>source.completeService('a')).toThrow();source.tick(100);source.tick(100)
  source.completeService('a');source.completeService('a')
  expect(source.snapshot().vehicles[0].tasks.every(t=>t.status==='done')).toBe(true)
  for(let i=0;i<5;i++)source.tick(100)
  const frame=source.snapshot()
  expect(frame.vehicles.find(v=>v.worldEntityId==='a')?.stage).toBe('handover')
  expect(frame.vehicles.find(v=>v.worldEntityId==='b')?.stage).toBe('lights')
  expect(frame.bays[0].vehicleId).toBe('b');expect(frame.completed).toHaveLength(0)
  source.completeService('b');source.tick(100)
  expect(source.snapshot().vehicles.find(v=>v.worldEntityId==='b')?.stage).toBe('ready')
  expect(source.snapshot().bays[0].occupancy).toBe('occupied')
  source.releaseVehicle('a',true)
  for(let i=0;i<4;i++)source.tick(100)
  expect(source.snapshot().completed.map(v=>v.worldEntityId)).toEqual(['a'])
  expect(source.snapshot().vehicles.find(v=>v.worldEntityId==='b')?.stage).toBe('handover')
  source.dispose()
 })
 it('preserves selected tasks, real durations, release authority and bounded completed history',()=>{
  const source=new DemoOperationSource('operation');source.addOrder('a',['interior'],'#aaa','pickup')
  expect(source.snapshot().vehicles[0].tasks.map(t=>t.id)).toEqual(['interior','inspection'])
  source.assignOrder('a','01');source.tick(100)
  source.tick(12)
  let vehicle=source.snapshot().vehicles[0]
  expect(vehicle.stage).toBe('interior');expect(elapsed(vehicle,112)).toBe('00:00:12')
  source.advanceVehicle('a');source.tick(3);source.advanceVehicle('a')
  vehicle=source.snapshot().vehicles[0];expect(vehicle.stage).toBe('ready');expect(elapsed(vehicle,500)).toBe('00:00:15')
  source.tick(600);expect(source.snapshot().bays[0].occupancy).toBe('occupied')
  const grouped=operationGroups({...initialWorld,...source.snapshot()});expect(grouped.active).toHaveLength(0);expect(grouped.completed).toHaveLength(1)
  source.releaseVehicle('a');expect(source.snapshot().bays[0].occupancy).toBe('free');source.tick(100);source.releaseVehicle('a',true);source.tick(100)
  expect(source.snapshot().vehicles).toHaveLength(0);expect(source.snapshot().completed[0].tasks.every(t=>t.status==='done')).toBe(true)
  expect(source.snapshot().completed[0].completedAt).toBeTruthy()
  source.tick(100);expect(source.snapshot().completed).toHaveLength(1)
  source.dispose()
 })
 it('supports parallel work, queue shifts, disabled bay and cancelled queue removal without inventing completion',()=>{
  const source=new DemoOperationSource('operation')
  source.addOrder('a',['exterior'],'#aaa','car');source.addOrder('b',['lights'],'#aaa','truck');source.addOrder('c',['interior'],'#aaa','suv')
  source.setBayAvailability('02',false);expect(()=>source.assignOrder('a','02')).toThrow()
  source.assignOrder('a','01');source.tick(100);source.tick(100);source.tick(100)
  source.assignOrder('b','03');source.tick(100);source.tick(100)
  const groups=operationGroups({...initialWorld,...source.snapshot()})
  expect(groups.active).toHaveLength(2);expect(groups.queue.map(v=>v.worldEntityId)).toEqual(['c']);expect(groups.queue[0].queueIndex).toBe(0)
  source.removeQueued('c');expect(source.snapshot().completed).toHaveLength(0)
  source.dispose()
 })
 it('rejects duplicate, stale and contradictory records; accepts actual configured bay count and new streams',()=>{
  const source=new DemoOperationSource('operation');const event:OperationEvent={streamId:'a',revision:1,eventId:'e1',occurredAt:new Date().toISOString(),mode:'demo',frame:source.snapshot()}
  event.frame.bays=event.frame.bays.slice(0,2)
  const first=projectOperation(initialWorld,event);expect(first.bays).toHaveLength(2)
  expect(projectOperation(first,event)).toBe(first)
  expect(projectOperation(first,{...event,revision:0})).toBe(first)
  expect(projectOperation(first,{...event,revision:2,frame:{...event.frame,bays:[event.frame.bays[0],event.frame.bays[0]]}})).toBe(first)
  expect(projectOperation(first,{...event,streamId:'b'})).not.toBe(first)
  source.dispose()
 })
 it('follows confirmed routes and uses a stable anonymous display code',()=>{
  const source=new DemoOperationSource('operation');source.addOrder('private-id',['exterior'],'#aaa','car');source.assignOrder('private-id','01')
  const vehicle=source.snapshot().vehicles[0],movement=vehicle.movement!
  expect(vehiclePosition(vehicle,movement.startedAt)).toEqual(movement.path[0]);expect(vehiclePosition(vehicle,movement.startedAt+movement.duration)).toEqual(movement.path.at(-1))
  expect(publicCode('private-id')).toBe(publicCode('private-id'));expect(publicCode('private-id')).not.toContain('private')
  source.dispose()
 })
 it('retains only the last 50 real deliveries and makes a released bay reusable',()=>{
  const source=new DemoOperationSource('operation')
  for(let index=0;index<51;index++){
   const id=`delivered-${index}`;source.addOrder(id,['lights'],'#aaa','car');source.assignOrder(id,'01');source.tick(100)
   source.advanceVehicle(id);source.advanceVehicle(id);source.releaseVehicle(id);source.tick(100);source.releaseVehicle(id,true);source.tick(100)
   expect(source.snapshot().bays[0].occupancy).toBe('free')
  }
  const history=source.snapshot().completed
  expect(history).toHaveLength(50);expect(history[0].worldEntityId).toBe('delivered-1');expect(new Set(history.map(v=>v.worldEntityId)).size).toBe(50)
  source.dispose()
 })
})
