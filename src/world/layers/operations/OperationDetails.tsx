import { useEffect, useRef } from 'react'
import { X, ReceiptText, ShieldCheck } from 'lucide-react'
import type { WorldVehicle } from '../../../domain/contracts'
import type { CommercialOrder } from '../../../domain/commerce'
import { VehicleStatusBadge } from './VehicleStatusBadge'
import { publicCode } from './operationPresentation'

const money=(cents:number)=>new Intl.NumberFormat('es',{style:'currency',currency:'USD'}).format(cents/100)
export function OperationDetails({vehicle,order,clock,onClose}:{vehicle:WorldVehicle;order?:CommercialOrder;clock:number;onClose:()=>void}) {
  const close=useRef<HTMLButtonElement>(null)
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;close.current?.focus()
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}
    window.addEventListener('keydown',escape);return()=>{window.removeEventListener('keydown',escape);previous?.focus()}
  },[])
  return <aside className="operation-details" role="dialog" aria-label={order?'Detalle de mi vehículo':'Detalle público del vehículo'}>
    <header><h2>{order?'Tu orden':publicCode(vehicle.worldEntityId)}</h2><button ref={close} onClick={onClose} aria-label="Cerrar detalle"><X size={22}/></button></header>
    <VehicleStatusBadge vehicle={vehicle} clock={clock} own={!!order} onSelect={()=>{}}/>
    <p className="operation-note"><ShieldCheck size={16}/>{order?'Información privada de tu sesión':'Información operativa anónima'}</p>
    {order&&<><h3>Resumen de servicios</h3><dl>{order.quote.services.map(service=><div key={service.id}><dt>{service.label}</dt><dd>{money(service.cents)}</dd></div>)}
      <div><dt>Subtotal</dt><dd>{money(order.quote.subtotal)}</dd></div><div><dt>Descuento</dt><dd>−{money(order.quote.discount)}</dd></div>
      <div><dt>Impuestos</dt><dd>{money(order.quote.tax)}</dd></div><div className="operation-total"><dt>Total</dt><dd>{money(order.quote.total)}</dd></div></dl>
      <p>Pago pendiente · {order.status==='completed'?'Entrega autorizada':order.status==='cancelled'?'Orden cancelada':'Orden confirmada'}</p>
      {vehicle.completedAt&&<p>Servicios finalizados: <time dateTime={vehicle.completedAt}>{new Date(vehicle.completedAt).toLocaleString('es')}</time></p>}
      <button className="operation-receipt" disabled><ReceiptText size={18}/>Comprobante no emitido</button><small>Este resumen no es un recibo de pago.</small>
    </>}
    {!order&&<p className="operation-note">Los precios y comprobantes están disponibles únicamente para el propietario.</p>}
  </aside>
}
