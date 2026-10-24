export type TaskStatus = 'pending'|'active'|'done'|'unknown'
import type { BayId,XZ } from './sitePlan'
export type DemoStage = 'arriving'|'queued'|'assigned'|'washing'|'interior'|'lights'|'inspection'|'ready'|'handover'|'departing'|'exited'
export interface WorldVehicle {
  worldEntityId: string
  visibility: 'anonymous'|'own'
  operationalState: 'unknown'|'in-service'|'inspection'|'ready'|'queued'|'transit'
  visualLocation: 'entry'|`bay:${BayId}`|'handover'|'queue'|'exit'
  locationConfidence: 'demo'|'confirmed'|'representational'
  stage:DemoStage;bayId:BayId|null;queueIndex:number|null;color:string;position:XZ;yaw:number
  phaseStarted:number;movement?:{path:XZ[];startedAt:number;duration:number;reverseMeters?:number;purpose:'entry'|'assign'|'queue-shift'|'handover'|'exit'}
  assignedWorkerId?:string|null
  type?:import('./commerce').VehicleType
  tasks:{id:string;label:string;status:TaskStatus}[]
}
export interface BayView {bayId:BayId;occupancy:'free'|'occupied'|'out-of-service';vehicleId:string|null;tasks:{id:string;label:string;status:TaskStatus}[]}
export interface OperationEvent { streamId?:string;eventId: string; revision: number; occurredAt: string; mode: 'demo'; frame:{clockSeconds:number;speed:number;scenario:string;paused?:boolean;vehicles:WorldVehicle[];bays:BayView[]} }
export interface WorldViewModel {
  streamId?:string
  revision: number; eventIds: string[]; stage: DemoStage
  vehicles: WorldVehicle[]
  bay:BayView; bays:BayView[];clockSeconds:number;speed:number;scenario:string
}
export interface OperationSource { readonly mode: 'demo'|'live'; subscribe(listener:(event:OperationEvent)=>void):()=>void; dispose():void }
export interface Service { id: string; label: string; description: string; priceDemo: number }
