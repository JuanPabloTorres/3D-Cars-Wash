import {describe,it,expect} from 'vitest'
import {DemoOperationSource} from '../../src/domain/DemoOperationSource'
import {initialWorld} from '../../src/domain/OperationProjection'
import {loungeStatus} from '../../src/world/layers/lounge/loungeStatus'
import {loungeCameraRoute,loungePlan,roundLoungeRoute} from '../../src/world/layers/lounge/loungePlan'
import type {CommercialOrder} from '../../src/domain/commerce'
const order=(id:string)=>({worldEntityId:id,attention:'queued',status:'confirmed'} as CommercialOrder)
describe('lounge uses authoritative shared operation',()=>{
 it('no private order never adopts a public vehicle or invents a turn',()=>{
  const source=new DemoOperationSource('busy'),state=loungeStatus({...initialWorld,...source.snapshot()},null)
  expect(state.vehicle).toBeUndefined();expect(state.position).toBeNull();expect(state.title).toContain('no tienes');source.dispose()
 })
 it('queue follows the authoritative order, task completion is not pickup, delivery is recoverable',()=>{
  const source=new DemoOperationSource('operation')
  for(const id of ['a','b','mine'])source.addOrder(id,['exterior','interior'],'#aaa','car')
  const read=()=>loungeStatus({...initialWorld,...source.snapshot()},order('mine'))
  expect(read()).toMatchObject({ahead:2,position:3,total:3,pickup:false})
  for(const [id,bay]of [['a','01'],['b','02'],['mine','03']] as const){source.assignOrder(id,bay);for(let i=0;i<4;i++)source.tick(100)}
  expect(read().position).toBeNull();expect(read().vehicle?.bayId).toBe('03')
  source.advanceVehicle('mine');expect(read().vehicle?.tasks.find(t=>t.id==='exterior')?.status).toBe('done')
  source.advanceVehicle('mine');source.advanceVehicle('mine');expect(read().pickup).toBe(false);expect(read().title).toContain('pendiente liberar')
  source.releaseVehicle('mine');expect(read().pickup).toBe(false)
  source.tick(100);expect(read().pickup).toBe(true)
  source.releaseVehicle('mine',true);source.tick(100);expect(read().delivered).toBe(true);source.dispose()
 })
 it('uses the front aisle in both directions, outside seating and entrance planting',()=>{
  const end=loungePlan.observation.position,start:[number,number,number]=[-6,1.78,6.6]
  const route=loungeCameraRoute(start,end,true),back=loungeCameraRoute(end,start,false)
  expect(back).toEqual([...route].reverse());expect(route.slice(1,-1).every(p=>p[2]<10.9&&p[2]>=5.1)).toBe(true)
  expect(end[0]).toBeGreaterThan(-16.8);expect(end[2]).toBeLessThan(10.3)
 })
 it('rounds the lounge approach without entering the seating strip or changing endpoints',()=>{
  const start:[number,number,number]=[-6,1.78,6.6],end=loungePlan.observation.position
  const points=roundLoungeRoute(loungeCameraRoute(start,end,true))
  expect(points[0].toArray()).toEqual(start);expect(points.at(-1)!.toArray()).toEqual(end)
  for(const point of points){
   expect(point.toArray().every(Number.isFinite)).toBe(true)
   expect(point.z).toBeGreaterThanOrEqual(6.6);expect(point.z).toBeLessThanOrEqual(9.9)
   if(point.x<-10)expect(point.z).toBeGreaterThanOrEqual(9.65)
  }
 })
})
