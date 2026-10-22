import type { OrderStatus, ServiceDefinition } from './domain';
export interface VehicleInput { kind:'Sedán'|'SUV'|'Pickup'|'Compacto'; color:'Plata'|'Rojo'|'Azul'|'Negro'|'Blanco'; plate:string; }
export interface CreateOrderInput { vehicle:VehicleInput; services:string[]; }
export interface Quotation { items:ServiceDefinition[]; total:number; tasks:string[]; }
export interface PersistOrderInput { vehicle:VehicleInput; quote:Quotation; }
export interface Actor { userId:string; email:string; displayName:string; }
export interface OrderSummary { id:string; owner_id:string; vehicle_id:string; status:OrderStatus; total:number; payment_status:'pending'|'paid'; bay:number|null; version:number; created_at:number; updated_at:number; kind:string; color:string; plate:string; }
export interface OrderLine { id:string; order_id:string; service_id:string; name:string; price:number; }
export interface OrderTask { id:string; order_id:string; name:string; sequence:number; status:'pending'|'done'; }
export interface OrderEvent { action:string; created_at:number; }
export interface OrderDetail extends OrderSummary { items:OrderLine[]; tasks:OrderTask[]; events:OrderEvent[]; }
export interface OrderAction { action:'arrive'|'start'|'task'|'ready'|'pay'|'deliver'|'cancel'; version:number; bay?:number; taskId?:string; method?:'cash'|'external-card'|'other'; }
