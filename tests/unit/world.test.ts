import {describe,it,expect} from 'vitest'
import {destinations,distance,isWalkable,moveSafely,segmentClear,SPAWN} from '../../src/world/navigation/layout'
import {WaypointPathPlanner} from '../../src/world/navigation/WaypointPathPlanner'
import {initialWorld,projectOperation} from '../../src/domain/OperationProjection'
import {DemoOperationSource,scenarioFrame} from '../../src/domain/DemoOperationSource'
import type{OperationEvent}from '../../src/domain/contracts'
import {sampleVehicleMovement}from '../../src/domain/vehicleMotion'
const planner=new WaypointPathPlanner()
describe('physical pedestrian navigation',()=>{
 for(const[name,d]of Object.entries(destinations))it(`walkable route to ${name}`,()=>{const path=planner.findPath(SPAWN,d.point);expect(path).not.toBeNull();let previous=SPAWN;for(const step of path!){expect(segmentClear(previous,step)).toBe(true);previous=step}expect(distance(previous,d.point)).toBe(0)})
 it('cannot route into bays, counter, bench, rear planter or vehicle lanes',()=>{for(const p of [[3.4,-4.2],[-6,.2],[-14.6,8],[-11.5,3.4],[46,4],[3.4,12]])expect(planner.findPath(SPAWN,p as[number,number])).toBeNull()})
 it('stops at pedestrian limits and counter without tunneling',()=>{const end=moveSafely([38,3],[20,0]);expect(isWalkable(end)).toBe(true);expect(end[0]).toBeLessThan(39.4);expect(moveSafely([-6,3],[0,-20])[1]).toBeGreaterThan(1.9)})
 it('routes between every destination pair',()=>{for(const a of Object.values(destinations))for(const b of Object.values(destinations))expect(planner.findPath(a.point,b.point)).not.toBeNull()})
})
describe('event-owned demo operation and traffic',()=>{
 const event:OperationEvent={eventId:'e1',revision:1,occurredAt:'2026-10-23T12:00:00Z',mode:'demo',frame:scenarioFrame('quiet')}
 it('ignores duplicates, stale and inconsistent occupancy',()=>{const s=projectOperation(initialWorld,event);expect(projectOperation(s,event)).toBe(s);expect(projectOperation(s,{...event,revision:0})).toBe(s);const bad=scenarioFrame();bad.bays[0].vehicleId='missing';expect(projectOperation(initialWorld,{...event,frame:bad})).toBe(initialWorld)})
 it('supports five independent configurations without bay01 always active',()=>{const quiet=scenarioFrame('quiet');expect(quiet.bays[0].occupancy).toBe('free');expect(quiet.bays[2].occupancy).toBe('occupied');expect(scenarioFrame('mixed').bays[3].occupancy).toBe('out-of-service');expect(scenarioFrame('busy').bays.every(b=>b.occupancy==='occupied')).toBe(true)})
 it('serializes traffic, maintains spacing, continuity and pedestrian separation for a complete cycle',()=>{
  const source=new DemoOperationSource('arrival');let previous=new Map<string,readonly[number,number]>(),stages=new Set<string>(),count=0
  source.subscribe(e=>{const f=e.frame;expect(f.vehicles.filter(v=>v.movement).length).toBeLessThanOrEqual(1);expect(new Set(f.vehicles.map(v=>v.worldEntityId)).size).toBe(f.vehicles.length)
   const poses=f.vehicles.map(v=>{stages.add(v.stage);const p=v.movement?sampleVehicleMovement(v.movement,f.clockSeconds).position:v.position
    const old=previous.get(v.worldEntityId);if(old)expect(distance(old,p)).toBeLessThanOrEqual(.72);previous.set(v.worldEntityId,p)
    expect(p[0]>-12.4&&p[0]<39.6&&p[1]>1.7&&p[1]<6.6).toBe(false);return p})
   for(let i=0;i<poses.length;i++)for(let j=i+1;j<poses.length;j++)expect(distance(poses[i],poses[j])).toBeGreaterThan(4.7)
   for(const b of f.bays)if(b.occupancy==='occupied')expect(f.vehicles.find(v=>v.worldEntityId===b.vehicleId)?.bayId).toBe(b.bayId)
   count++
  })
  for(let i=0;i<2600;i++)source.tick(.25)
  for(const s of ['arriving','queued','assigned','washing','interior','lights','inspection','ready','handover','departing'])expect(stages.has(s)).toBe(true)
  expect(count).toBe(2600);source.dispose()
 })
 it('manual demo events publish coherent bay tasks even while paused',()=>{
  const source=new DemoOperationSource();let state=initialWorld;source.subscribe(e=>{state=projectOperation(state,e)});source.paused=true
  for(let i=0;i<4;i++)source.advance()
  expect(state.stage).toBe('ready');expect(state.bay.tasks.every(t=>t.status==='done')).toBe(true);source.dispose()
 })
})
