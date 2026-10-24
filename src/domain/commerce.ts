export type VehicleType='car'|'pickup'|'truck'|'suv'
export type ReceptionStep='welcome'|'services'|'vehicle'|'review'|'questions'|'information'
export interface VehicleRegistration {type:VehicleType;color:string;contact:string}
export interface VisitDraft {services:string[];vehicle:VehicleRegistration;step:ReceptionStep}
export interface Quote {id:string;expiresAt:number;pricingVersion?:string;taxBasisPoints?:number;services:{id:string;label:string;cents:number}[];subtotal:number;discount:number;tax:number;total:number;vehicle:VehicleRegistration}
export interface CommercialOrder {
 id:string;revision:number;status:'confirmed'|'cancelled'|'completed';attention:'not-arrived'|'queued'|'in-service'|'ready'|'delivered';payment:'pending';quote:Quote;worldEntityId:string|null;createdAt:string
 /** Visitor requests a staff review; only the administrative arrive command confirms presence. */
 arrivalRequestedAt?:string
 history?:{at:string;label:string}[]
}
export interface SessionProfile {name:string}
export interface ContactRequest {id:string;question:string;contact:string;status:'pending'|'resolved';createdAt:string}
export interface CommerceSnapshot {mode:'demo';revision:number;order:CommercialOrder|null;profile?:SessionProfile;history?:CommercialOrder[];requests?:ContactRequest[]}
export const emptyDraft=():VisitDraft=>({services:[],vehicle:{type:'car',color:'Plata',contact:''},step:'welcome'})
export const vehicleTypeLabels:Record<VehicleType,string>={car:'Carro',pickup:'Pickup',truck:'Truck',suv:'SUV'}
export const quoteIsCurrent=(quote:Quote|undefined,now=Date.now())=>!!quote&&Number.isFinite(quote.expiresAt)&&quote.expiresAt>now
export function validateRegistration(v:VehicleRegistration){
 if(!Object.keys(vehicleTypeLabels).includes(v.type))return 'Selecciona un tipo de vehículo.'
 if(!['Plata','Rojo','Azul','Negro','Blanco'].includes(v.color))return 'Selecciona un color.'
 if(v.contact&&!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.contact)||/^\+?[\d ()-]{7,20}$/.test(v.contact)))return 'Revisa el correo o teléfono. En DEMO puedes dejarlo vacío.'
 return null
}
