import type { CommercialOrder } from '../../../domain/commerce'
import type { WorldViewModel } from '../../../domain/contracts'
import { operationGroups, vehicleState } from '../operations/operationPresentation'

/** Public positions may locate only the entity linked by the private session.
 * Completion authorizes release; pickup requires arrival at the handover zone. */
export function loungeStatus(world:WorldViewModel,order:CommercialOrder|null) {
 const vehicle=order?.worldEntityId?[...world.vehicles,...(world.completed??[])].find(v=>v.worldEntityId===order.worldEntityId):undefined
 const queue=operationGroups(world).queue,index=vehicle?queue.findIndex(v=>v.worldEntityId===vehicle.worldEntityId):-1
 const pickup=vehicle?.stage==='handover'&&!vehicle.movement
 const delivered=order?.attention==='delivered'||vehicle?.stage==='exited'
 const title=!order?'Aún no tienes una orden activa.':delivered?'Vehículo entregado':pickup?'Tu vehículo está listo para recoger':order.attention==='not-arrived'?'Llegada pendiente de recepción':vehicle?vehicleState(vehicle):'Consultando la ubicación de tu vehículo…'
 return {vehicle,pickup,delivered,title,total:queue.length,ahead:index<0?null:index,position:index<0?null:index+1}
}
