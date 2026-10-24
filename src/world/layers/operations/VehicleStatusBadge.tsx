import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Droplets, Brush, ClipboardCheck, Sparkles, CircleCheck, Circle, Clock3, Layers, CircleDot } from 'lucide-react'
import { VehicleIcon } from '../../../ui/VehicleIcon'
import type { WorldVehicle } from '../../../domain/contracts'
import { elapsed, isFinished, publicCode, vehicleState } from './operationPresentation'

function Headlamp({size=19}:{size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M14 5v14c9 0 9-14 0-14Z M3 5l7 2 M2 10h8 M2 14h8 M3 19l7-2"/></svg>}
/** Stable catalog IDs, not translated label matching. Unknown services stay usable. */
export const serviceVisuals = {
  exterior:{Icon:Droplets,color:'#66d6ff'},interior:{Icon:Brush,color:'#bd9aff'},
  lights:{Icon:Headlamp,color:'#ffd076'},inspection:{Icon:ClipboardCheck,color:'#6de0b4'},
  wax:{Icon:Sparkles,color:'#f7b1dc'},glass:{Icon:Layers,color:'#8de0dc'},wheels:{Icon:CircleDot,color:'#a6b9ff'},
}
export function ServiceBadge({task,paused=false}:{task:WorldVehicle['tasks'][number];paused?:boolean}) {
  const {Icon,color}=serviceVisuals[task.id as keyof typeof serviceVisuals]||{Icon:Sparkles,color:'#c1ced6'}
  const previous=useRef(task.status),[confirmed,setConfirmed]=useState(false)
  useEffect(()=>{
    const changed=previous.current!==task.status&&task.status==='done';previous.current=task.status
    setConfirmed(changed)
    if(changed){const timer=setTimeout(()=>setConfirmed(false),600);return()=>clearTimeout(timer)}
  },[task.status])
  const status={pending:'Pendiente',active:paused?'Actividad pausada':'En proceso',done:'Terminado',unknown:'Sin confirmar'}[task.status]
  return <span className={`service-badge ${task.status} ${confirmed?'confirmed':''} ${paused?'paused':''}`} style={{'--service-color':color} as CSSProperties}
    tabIndex={0} aria-label={`${task.label}: ${status}`} title={`${task.label} · ${status}${task.id==='inspection'?' · Etapa operativa, sin cargo adicional':''}`}>
    <Icon size={19}/><span className="service-name">{task.label}</span>
    {task.status==='done'?<CircleCheck size={13}/>:task.status==='pending'?<Circle size={10}/>:<span className="service-activity"/>}
  </span>
}
export function VehicleStatusBadge({vehicle,clock,own=false,compact=false,paused=false,onSelect}:{vehicle:WorldVehicle;clock:number;own?:boolean;compact?:boolean;paused?:boolean;onSelect:()=>void}) {
  const time=elapsed(vehicle,clock),done=isFinished(vehicle)
  return <article className={`vehicle-status-badge ${own?'own':''} ${done?'finished':''} ${compact?'compact':''}`} data-entity={vehicle.worldEntityId} data-stage={vehicle.stage}>
    <button className="vehicle-select" onClick={onSelect} aria-label={`Consultar ${own?'mi vehículo':publicCode(vehicle.worldEntityId)}`}>
      <span className={`vehicle-symbol type-${vehicle.type||'car'}`}><VehicleIcon type={vehicle.type} size={compact?24:36}/>{done&&<CircleCheck className="vehicle-check" size={17}/>}</span>
      <span className="vehicle-title"><strong>{own?'Mi vehículo':publicCode(vehicle.worldEntityId)}</strong><small>{vehicle.queueIndex!==null?`Turno ${vehicle.queueIndex+1}`:vehicle.bayId?`Bahía ${vehicle.bayId}`:done?'Completados':'En traslado'}</small></span>
    </button>
    {!compact&&<><p className="vehicle-state">{vehicleState(vehicle)}</p><div className="service-badges">{vehicle.tasks.map(task=><ServiceBadge key={task.id} task={task} paused={paused}/>)}</div>
    <footer>{time?<><Clock3 size={14}/>{done?'Servicio realizado':'En servicio'} · {time}</>:<><Clock3 size={14}/>Inicio de servicio pendiente</>}</footer></>}
  </article>
}
