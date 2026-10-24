import { CalendarDays, CarFront, CheckCircle2, ClipboardList, CreditCard, X } from 'lucide-react'
import { useApp } from '../app/store'
import {useEffect,useRef} from 'react'
const steps=[['1','Elige servicios','Selecciona los servicios disponibles y revisa sus inclusiones.','Servicios'],['2','Registra tu vehículo','Define categoría, color y un contacto opcional.','Vehículo'],['3','Revisa la cotización','Comprueba tarifas vigentes, impuestos y condiciones.','Cotización'],['4','Confirma la solicitud','Conserva tu orden. El personal registra tu llegada al local.','Llegada'],['5','Sigue la atención','Mi orden muestra tu turno, bahía y tarea. Puedes consultar el lounge durante la espera.','Seguimiento'],['6','Revisa y retira tu vehículo','El personal confirma inspección y entrega. El pago sigue pendiente si no se ha registrado un cobro.','Entrega']]
/** Shared service guide, also read inside the single global Help entry. */
export function ServiceFlowSteps(){return <ol className="service-timeline">{steps.map(([number,title,copy,label],index)=><li key={number}><span className="timeline-marker">{index===0?<ClipboardList size={14}/>:index===1?<CarFront size={14}/>:index===2?<CreditCard size={14}/>:<CheckCircle2 size={14}/>}</span><div><time>Paso {number} · {label}</time><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>}
export function ServiceFlowModal(){
  const ref=useRef<HTMLElement>(null)
  useEffect(()=>{const previous=document.activeElement as HTMLElement;ref.current?.focus();return()=>{if(previous?.isConnected)previous.focus()}},[])
  const close=()=>useApp.getState().set({flowOpen:false})
  return <div className="flow-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section ref={ref} tabIndex={-1} className="flow-modal" role="dialog" aria-modal="true" aria-labelledby="flow-title" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close()}if(e.key==='Tab'){e.preventDefault();ref.current?.querySelector<HTMLButtonElement>('button')?.focus()}}}><header><div><small>GUÍA DE VISITA</small><h2 id="flow-title">Cómo completar el servicio</h2></div><button className="icon-button" aria-label="Cerrar cómo funciona" onClick={close}><X size={18}/></button></header><ServiceFlowSteps/><footer><CalendarDays size={16}/><span>La llegada, el pago y la entrega requieren confirmación del establecimiento.</span></footer></section></div>
}

