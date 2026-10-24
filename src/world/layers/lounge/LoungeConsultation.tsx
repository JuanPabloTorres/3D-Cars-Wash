import { SERVICE_COMPLETED_MESSAGE } from '../../../domain/commerce'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Car, Clock3, Info, X } from 'lucide-react'
import type { CommercialOrder } from '../../../domain/commerce'
import type { WorldViewModel } from '../../../domain/contracts'
import { LoungeContent } from '../../../reception/BusinessInformation'
import { elapsed, operationGroups } from '../operations/operationPresentation'
import { ServiceBadge, VehicleStatusBadge } from '../operations/VehicleStatusBadge'
import { loungeStatus } from './loungeStatus'
import './lounge.css'

type Props={world:WorldViewModel;order:CommercialOrder|null;connected:boolean;loaded:boolean;paused:boolean;open:boolean;onOpen:(open:boolean)=>void;onNavigate:(view:'reception'|'vehicle'|'service')=>void}
export function LoungeConsultation({world,order,connected,loaded,paused,open,onOpen,onNavigate}:Props) {
 const groups=operationGroups(world)
 const state=loungeStatus(world,order),[tab,setTab]=useState<'order'|'local'>('order')
 const close=useRef<HTMLButtonElement>(null)
 useEffect(()=>{if(open)close.current?.focus()},[open])
 const dismiss=()=>{onOpen(false);document.querySelector<HTMLButtonElement>('.lounge-terminal')?.focus()}
 const status=!loaded?'Consultando tu sesión…':!connected?'Conexión interrumpida · mostrando el último estado confirmado':state.title
 if(!open)return null
 return <aside className="lounge-consultation" aria-label="Tu espera">
  {open&&<section id="lounge-detail" className="lounge-detail" aria-label="Consulta de espera" onKeyDown={e=>{if(e.key==='Escape')dismiss()}}>
   <header><div><small>ATENCIÓN · DEMO</small><h2>Relájate, estás en tu espacio.</h2></div><button ref={close} onClick={dismiss} aria-label="Cerrar consulta de espera"><X size={19}/></button></header>
   <div className="lounge-tabs"><button aria-pressed={tab==='order'} onClick={()=>setTab('order')}><Car size={16}/> Mi turno</button><button aria-pressed={tab==='local'} onClick={()=>setTab('local')}><Info size={16}/> Servicios y local</button></div>
   {tab==='local'?<LoungeContent/>:<>
    <p role="status" className="lounge-state">{status}</p>
    {order&&<small className="lounge-order-id">Orden {order.id}</small>}
    <p className="lounge-public-count">{groups.available} bahías disponibles · {state.total} en espera</p>
    {state.vehicle&&<>
     {state.position!==null&&<div className="lounge-queue"><b>Tu posición: {state.position}</b><span>{state.ahead} delante de ti</span><small>{state.total} vehículos en espera</small></div>}
     {state.vehicle.bayId&&<p>Bahía {state.vehicle.bayId}</p>}
     {elapsed(state.vehicle,world.clockSeconds)&&<p className="lounge-time"><Clock3 size={16}/> Tiempo de servicio: {elapsed(state.vehicle,world.clockSeconds)}{paused?' · Pausado':''}</p>}
     <div className="service-badges">{state.vehicle.tasks.map(task=><ServiceBadge key={task.id} task={task} paused={paused||!connected}/>)}</div>
     {state.vehicle.serviceCompleted!==undefined&&!state.pickup&&!state.delivered&&<p>Servicios terminados. Espera la confirmación de llegada a la zona de entrega.</p>}
    </>}
    <details><summary>Explorar cola y bahías</summary>{groups.queue.length?groups.queue.map(v=><VehicleStatusBadge key={v.worldEntityId} vehicle={v} clock={world.clockSeconds} own={v.worldEntityId===order?.worldEntityId} compact paused={paused||!connected} onSelect={()=>onNavigate(v.worldEntityId===order?.worldEntityId?'vehicle':'service')}/>):<p>No hay vehículos en la fila.</p>}<button onClick={()=>onNavigate('service')}>Consultar bahías en el mapa</button></details>
    {order&&<details><summary>Resumen de mis servicios</summary>{order.quote.services.map(s=><p key={s.id}>{s.label}</p>)}<small>Los servicios adicionales se gestionan en recepción.</small></details>}
    {state.pickup&&<button className="primary" onClick={()=>onNavigate('vehicle')}>Ver ubicación de entrega</button>}
    {order?.completionNotice&&<details><summary>Aviso de finalización</summary><p>{SERVICE_COMPLETED_MESSAGE}</p><small>Aviso privado en esta aplicación · DEMO</small></details>}
    {order&&<details><summary>Pago y comprobante</summary><p>Pago pendiente. El establecimiento aún no ha emitido un comprobante.</p><button disabled>Comprobante no disponible</button></details>}
    {!order&&loaded&&connected&&<button className="primary" onClick={()=>onNavigate('reception')}>Preparar mi orden <ArrowRight size={17}/></button>}
   </>}
   <footer><button onClick={()=>onNavigate('reception')}>Ir a recepción</button><button onClick={()=>onNavigate(order?'vehicle':'service')}>{order?'Ver mi vehículo':'Ver bahías'}</button></footer>
  </section>}
 </aside>
}
