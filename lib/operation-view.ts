/** Public presentation IDs cannot be used to access an order or a customer account. */
export type VisibleVisitStatus = 'waiting'|'working'|'ready';
export interface OperationVisit {
  key:string;
  mine:boolean;
  status:VisibleVisitStatus;
  kind:string;
  color:string;
  bay:number|null;
  task:string|null;
  services:string[];
}
export interface BayActivity { bay:number; kind:string; color:string; task:string|null }
export interface OperationSnapshot { visits:OperationVisit[]; bays:BayActivity[]; observedAt:number; stale?:boolean }
export const QUEUE_SPACES = [{x:-3,z:7},{x:3,z:7},{x:-3,z:14},{x:3,z:14}] as const;
export const PICKUP_SPACES = [{x:17,z:8},{x:17,z:15},{x:17,z:22}] as const;
export function visitSpace(visit:OperationVisit,snapshot:OperationSnapshot){
  if(visit.status==='working')return {x:((visit.bay??4)-3)*6,z:-6};
  const siblings=snapshot.visits.filter(v=>v.status===visit.status);
  const index=siblings.findIndex(v=>v.key===visit.key);
  const slots=visit.status==='waiting'?QUEUE_SPACES:PICKUP_SPACES;
  return slots[index]??null; // Overflow is reported as a count; cars are never stacked on each other.
}

export function activityMode(task:string|null):'wash'|'interior'|'polish'|'inspect'{
  if(/lavado|shampoo|limpieza del motor/i.test(task??''))return 'wash';
  if(/interior|aspir/i.test(task??''))return 'interior';
  if(/pulido|foco|brillo/i.test(task??''))return 'polish';
  return 'inspect';
}
export async function visualKey(id:string){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('febles-public-scene-v1:'+id));
  return Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
