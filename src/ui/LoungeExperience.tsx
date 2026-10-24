import {useEffect,useRef,useState} from 'react'
import {ArrowLeft,ArrowRight,CarFront,Droplets,MapPin,ReceiptText,Tag} from 'lucide-react'
import {useApp} from '../app/store'
import {useCommerce} from '../app/commerceStore'
import {useBusiness,useServices} from '../app/business'
import {vehicleTypeLabels} from '../domain/commerce'
import type {BusinessContent} from '../domain/businessContent'
import {BusinessInformation} from '../reception/BusinessInformation'
import {stageLabels} from '../world/badges/WorldBadges'
import {inspectOwnVehicle} from '../world/interactions/VehicleInspectionExperience'
import {WorldPanel} from './WorldOverlayManager'
import './lounge.css'

type LoungeView='lounge'|'services'|'offers'|'information'
const contentCards=[
 {id:'services',title:'Servicios y cuidados',image:'exterior',Icon:Droplets},
 {id:'offers',title:'Ofertas vigentes',image:'lights',Icon:Tag},
 {id:'information',title:'Información del local',image:'interior',Icon:MapPin},
] as const

/** Read-only lounge: commercial actions stay with reception and the own-vehicle inspector. */
export function LoungeExperience(){
 const app=useApp(),commerce=useCommerce(),business=useBusiness(),services=useServices()
 const [view,setView]=useState<LoungeView>('lounge'),[expanded,setExpanded]=useState(false)
 const [readingOffers,setReadingOffers]=useState<BusinessContent['offers']>([])
 const contentHeading=useRef<HTMLHeadingElement>(null)
 const order=commerce.order?.status==='confirmed'?commerce.order:null
 // A registration does not prove arrival. Never borrow a scenario vehicle or another order's entity.
 const vehicle=order?.worldEntityId&&order.attention!=='not-arrived'?app.world.vehicles.find(v=>v.worldEntityId===order.worldEntityId):undefined
 const pendingArrival=order?.attention==='not-arrived'
 const ready=order?.attention==='ready'||!!vehicle&&['ready','handover'].includes(vehicle.stage)
 const updating=!commerce.connected||app.sync==='stale'
 const offers=business.offers.filter(offer=>Date.parse(offer.expiresAt)>Date.now())
 const currentTask=vehicle?.tasks.find(task=>task.status==='active')
 const message=!order?'Conoce el local y prepara tu visita.':pendingArrival?'Tu solicitud está confirmada.':ready?'Tu vehículo está listo.':'Consulta cómo va el cuidado de tu vehículo.'
 const status=pendingArrival?'Llegada pendiente':ready?'Listo para entrega':vehicle?stageLabels[vehicle.stage]:order?.attention==='queued'?'En fila de espera':'En atención'
 const openOrder=()=>app.set({localOpen:false,orderOpen:true,orderExpanded:true,inspectOwn:false})
 const openContent=(target:LoungeView)=>{
  // Snapshot on entry so a configuration refresh cannot replace an offer mid-reading.
  if(target==='offers')setReadingOffers(offers)
  setView(target)
 }
 const prepare=()=>{
  if(commerce.draft.step==='welcome')commerce.updateDraft({step:commerce.draft.services.length?'vehicle':'services'})
  app.navigate('reception')
 }
 useEffect(()=>{if(view!=='lounge')contentHeading.current?.focus()},[view])

 return <WorldPanel title="Lounge · Sala de espera" subtitle="OPERACIÓN ILUSTRATIVA · DEMO" contextKey={view} className={`lounge-panel ${expanded?'lounge-expanded':''}`} onClose={()=>app.set({localOpen:false})} onToggle={()=>setExpanded(!expanded)} compact={!expanded}>
  {view==='lounge'?<>
   <p className="lounge-message">{message}</p>
   {updating&&<p className="lounge-connection" role="status">Actualizando el estado de tu orden… {order?'Último estado recibido; puede haber cambiado.':'Esperando conexión con el proveedor DEMO.'}</p>}
   <section className="lounge-order" aria-label="Resumen de mi orden">
    <div className="lounge-order-heading"><span className="lounge-car-icon"><CarFront size={30} aria-hidden="true"/></span><div><h3>{order?`${vehicleTypeLabels[order.quote.vehicle.type]} · ${order.quote.vehicle.color}`:'Aún no tienes una orden activa.'}</h3>{!pendingArrival&&<p>{order?ready?'Coordina la revisión final, el pago y el retiro con el personal.':'El personal actualiza el estado de atención.':'Prepara tu solicitud con recepción.'}</p>}</div></div>
    {order&&<><dl className="lounge-order-facts"><div><dt>Estado</dt><dd>{status}</dd></div>{!pendingArrival&&<div><dt>Tarea actual</dt><dd>{currentTask?.label||(ready?'Atención finalizada':vehicle?'Sin tarea activa informada':'Pendiente de actualización')}</dd></div>}{vehicle?.bayId&&<div><dt>Ubicación</dt><dd>Bahía {vehicle.bayId}</dd></div>}{vehicle?.queueIndex!=null&&<div><dt>Posición en fila</dt><dd>Turno {vehicle.queueIndex+1}</dd></div>}</dl>{pendingArrival&&<p className="lounge-arrival-note">{order.arrivalRequestedAt?'Revisión de llegada solicitada. El personal debe confirmar tu presencia y asignar el turno.':'Preséntate en recepción con tu número de orden para que el personal confirme tu llegada.'}</p>}</>}
    <button className="primary wide lounge-primary" onClick={order?openOrder:prepare}><ReceiptText size={20} aria-hidden="true"/>{order?'Ver mi orden':'Preparar mi orden'}<ArrowRight size={18} aria-hidden="true"/></button>
   </section>
   <div className="lounge-cards" aria-label="Información durante tu espera">{contentCards.map(({id,title,image,Icon})=><button className="lounge-card" key={id} onClick={()=>openContent(id)}><img src={`/textures/services/${image}.webp`} alt="" width="240" height="135"/><span className="lounge-card-body"><Icon size={21} aria-hidden="true"/><span className="lounge-card-title">{title}</span>{id==='offers'&&<small>{offers.length?`${offers.length} ${offers.length===1?'oferta publicada':'ofertas publicadas'}`:'Sin ofertas publicadas.'}</small>}<ArrowRight className="lounge-card-arrow" size={17} aria-hidden="true"/></span></button>)}</div>
   <p className="lounge-image-note">Imágenes ilustrativas de servicios.</p>
  </>:<div className="lounge-detail">
   <button className="lounge-back" onClick={()=>setView('lounge')}><ArrowLeft size={17} aria-hidden="true"/>Volver al lounge</button>
   <h3 ref={contentHeading} tabIndex={-1}>{contentCards.find(card=>card.id===view)?.title}</h3>
   {view==='services'&&<>{services.filter(service=>service.available!==false).map(service=><article className="care-card" key={service.id}><img src={`/textures/services/${service.id}.webp`} width="320" height="180" alt={`Ilustración de ${service.label}`}/><details><summary><h4>{service.label}</h4><span>Consejos y condiciones</span></summary><p>{service.description}</p><p><b>Incluye:</b> {service.includes}</p><p>{service.care}</p><p className="lounge-conditions">{service.conditions}</p></details></article>)}{!services.some(service=>service.available!==false)&&<p>Consulta los servicios disponibles con recepción.</p>}<p className="lounge-content-note">Imágenes ilustrativas. Para elegir o modificar servicios, continúa con recepción.</p></>}
   {view==='offers'&&(readingOffers.length?readingOffers.map(offer=><article key={offer.id}><h4>{offer.title}</h4><p>{offer.description}</p><p className="lounge-conditions">Vigente hasta el <time dateTime={offer.expiresAt}>{new Date(offer.expiresAt).toLocaleDateString('es')}</time>. Consulta su aplicación con recepción.</p></article>):<p>Sin ofertas publicadas.</p>)}
   {view==='information'&&<BusinessInformation/>}
  </div>}
  <div className="lounge-actions"><button onClick={()=>app.navigate('reception')}><MapPin size={18} aria-hidden="true"/>Ir a recepción<ArrowRight size={17} aria-hidden="true"/></button><button onClick={inspectOwnVehicle}><CarFront size={18} aria-hidden="true"/>Ver mi vehículo<ArrowRight size={17} aria-hidden="true"/></button></div>
  <small className="lounge-privacy">Solo tu orden y contenido del establecimiento. Datos de otros clientes protegidos.</small>
 </WorldPanel>
}
