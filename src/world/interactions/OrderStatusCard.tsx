import {useState} from 'react'
import {CarFront,Info,ReceiptText} from 'lucide-react'
import {useApp} from '../../app/store'
import {useCommerce} from '../../app/commerceStore'
import {vehicleTypeLabels} from '../../domain/commerce'
import {WorldPanel} from '../../ui/WorldOverlayManager'
import {inspectOwnVehicle} from './VehicleInspectionExperience'
import {stageLabels} from '../badges/WorldBadges'
import {money} from '../../domain/money'
export {money}
export function OrderStatusCard(){
 const commerce=useCommerce(),order=commerce.order,world=useApp(s=>s.world),expanded=useApp(s=>s.orderExpanded),intent=useApp(s=>s.viewIntent),[cancelRequested,setCancelRequested]=useState(false)
 const entity=world.vehicles.find(v=>v.worldEntityId===order?.worldEntityId),close=()=>useApp.getState().set({orderOpen:false,inspectOwn:false})
 const status=order?.status==='cancelled'?'Orden cancelada':order?.status==='completed'?'Servicio entregado':order?.attention==='not-arrived'?'Orden confirmada':entity?stageLabels[entity.stage]:order?.attention==='ready'?'Listo para entrega':order?.attention==='queued'?'En fila de espera':'En atención'
 const start=()=>{commerce.updateDraft({step:'services'});useApp.getState().navigate('reception')}
 return <WorldPanel title={intent==='vehicle'?'Mi vehículo':'Mi orden'} subtitle="TU SOLICITUD · DEMO" onClose={close} compact={!expanded} onToggle={()=>useApp.getState().set({orderExpanded:!expanded})}>
  {!order?<><div className="empty-icon"><ReceiptText size={26}/></div><h3>Aún no tienes una orden</h3><p className="muted">Prepara una solicitud con Ana. Elegir una vista no registra tu auto ni confirma su llegada.</p><button className="primary wide" onClick={start}>Preparar mi orden</button></>:<>
   <div className="order-summary"><CarFront size={20}/><div><b>{vehicleTypeLabels[order.quote.vehicle.type]} · {order.quote.vehicle.color}</b><small>{order.id}</small></div><strong>{money(order.quote.total)}</strong></div>
   <div className={`order-state ${order.status==='cancelled'?'cancelled':''}`}><b>{status}</b><span>{entity?.bayId?`Bahía ${entity.bayId}`:entity?.queueIndex!=null?`Turno ${entity.queueIndex+1}`:order.attention==='not-arrived'?'Llegada pendiente':order.status==='completed'?'Entrega registrada':'Sin ubicación disponible'}</span></div>
   {order.attention!=='not-arrived'&&<p className="inline-note"><Info size={15}/>{entity?'Posición ilustrativa de la operación DEMO.':'Sin modelo 3D o ubicación adecuados para este vehículo.'}</p>}
   {order.status==='confirmed'&&order.attention==='not-arrived'&&<section className="arrival-next-step" aria-label="Siguiente paso"><p className="inline-note">Tu vehículo aparecerá cuando el personal confirme la llegada.</p>{order.arrivalRequestedAt?<p className="muted" role="status">Revisión de llegada solicitada. Presenta tu número de orden en recepción; el personal confirmará tu presencia y asignará tu turno.</p>:<><p className="muted">Si ya estás en el local, presenta tu número de orden en recepción y solicita la revisión.</p><button className="primary wide" disabled={commerce.busy||!commerce.connected} onClick={()=>void commerce.requestArrival()}>{commerce.busy?'Enviando solicitud…':'Solicitar revisión de llegada'}</button></>}</section>}
   {expanded&&<div className="order-details"><h3>Servicios de tu orden</h3><ul className="order-tasks">{order.quote.services.map(s=><li key={s.id}><div><b>{s.label}</b><small>{entity?.tasks.find(t=>t.id===s.id)?.status==='done'?'Completado':entity?.tasks.find(t=>t.id===s.id)?.status==='active'?'En proceso':'Pendiente'}</small></div><span>{money(s.cents)}</span></li>)}</ul><dl className="order-costs"><div><dt>Subtotal</dt><dd>{money(order.quote.subtotal)}</dd></div><div><dt>Descuento DEMO</dt><dd>−{money(order.quote.discount)}</dd></div><div><dt>Impuesto DEMO · {(order.quote.taxBasisPoints??0)/100}%</dt><dd>{money(order.quote.tax)}</dd></div><div className="total"><dt>Total DEMO</dt><dd>{money(order.quote.total)}</dd></div></dl><p className="inline-note">Pago pendiente · No se ha realizado ningún cobro</p><p className="muted">Sin estimación fiable de finalización. Consulta al personal.</p><ol className="order-history">{order.history?.map((event,i)=><li key={i}><time>{new Date(event.at).toLocaleTimeString()}</time><span>{event.label}</span></li>)}</ol></div>}
   {!expanded&&<button className="primary wide" onClick={()=>useApp.getState().set({orderExpanded:true})}>Ver detalles</button>}
   {expanded&&entity&&order.attention!=='not-arrived'&&<button className="primary wide" onClick={inspectOwnVehicle}>Ver mi vehículo</button>}
   {order.status==='confirmed'&&expanded&&(cancelRequested?<div className="cancel-confirm"><p>¿Solicitar la cancelación de esta orden DEMO?</p><button disabled={commerce.busy} onClick={async()=>{await commerce.cancel();setCancelRequested(false)}}>Sí, solicitar cancelación</button><button onClick={()=>setCancelRequested(false)}>Conservar mi orden</button></div>:<button className="text-button" onClick={()=>setCancelRequested(true)}>Solicitar cancelación</button>)}
  </>}
  {commerce.error&&<p role="alert" className="form-error">{commerce.error}</p>}
  {!commerce.connected&&<p role="status" className="form-error">Datos sin actualizar. <button onClick={()=>void commerce.refresh()}>Reintentar</button></p>}
 </WorldPanel>
}

