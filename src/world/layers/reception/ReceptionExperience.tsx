import type { WorldViewModel } from '../../../domain/contracts'
import { useEffect } from 'react'
import { useCommercialSession } from '../../../app/useCommercialSession'
import { Home, ReceiptText, ArrowLeft, ArrowRight, Car, LayoutGrid, Armchair, UserRound } from 'lucide-react'
import { AccountModal } from '../../../ui/AccountModal'
import { useCommerce } from '../../../app/commerceStore'
import { useApp } from '../../../app/store'
import { useBusiness } from '../../../app/business'
import { ReceptionDialogue } from '../../../reception/ReceptionDialogue'
import { OrderStatusCard } from '../../interactions/OrderStatusCard'
import type { CounterAction } from './ReceptionHotspot'
import './reception-layer.css'
import { ServiceCompletionNotice } from '../../../ui/ServiceCompletionNotice'

export function openReceptionAction(action:CounterAction) {
  useCommerce.getState().updateDraft({step:action==='hours'||action==='offers'?'information':action})
  useApp.getState().set({dialogue:true,orderOpen:false,informationTopic:action==='hours'?'hours':action==='offers'?'offers':'overview'})
}

export function ReceptionExperience({view,onView,world}: {world?:WorldViewModel;view:string;onView:(view:'reception'|'entrance'|'general'|'service'|'vehicle'|'waiting')=>void}) {
  useCommercialSession()
  const business=useBusiness(),dialogue=useApp(s=>s.dialogue),orderOpen=useApp(s=>s.orderOpen)
  const accountOpen=useApp(s=>s.accountOpen)
  const destination=useApp(s=>s.destination),revision=useApp(s=>s.navRevision)
  useEffect(()=>{if(destination==='reception'||destination==='services')onView('reception')},[destination,revision])
  const leave=()=>{useApp.getState().set({dialogue:false,orderOpen:false,interaction:null});onView('entrance')}
  const enter=()=>{useApp.getState().set({orderOpen:false,accountOpen:false});if(view==='reception')useApp.getState().openDialogue();else onView('reception')}
  return <>
    <ServiceCompletionNotice/>
    <header className="reception-brand"><b>{business.name}</b><span>CAR WASH</span><small>DEMO</small></header>
    {(view==='entrance'||view==='general')&&!orderOpen&&!accountOpen&&<section className="reception-invitation"><small>BIENVENIDO</small><h1>Tu auto, en buenas manos.</h1><p>Conoce los servicios y prepara tu visita.</p><button className="primary" onClick={enter}>Ir a recepción <ArrowRight size={18}/></button></section>}
    {view==='reception'&&!dialogue&&!orderOpen&&!accountOpen&&<p className="counter-guidance">Toca a Ana o los objetos del mostrador para comenzar.</p>}
    {dialogue&&<ReceptionDialogue compactWelcome/>}
    {!dialogue&&orderOpen&&<OrderStatusCard sourceWorld={world} onInspect={()=>onView('vehicle')}/>}
    {accountOpen&&<AccountModal/>}
    <nav className="reception-navigation" aria-label="Atención al cliente">
      <button onClick={leave} aria-label="Entrada" title="Entrada"><ArrowLeft size={20}/><span>Entrada</span></button>
      <button onClick={enter} aria-pressed={view==='reception'&&!orderOpen}><Home size={20}/>Recepción</button>
      <button onClick={()=>useApp.getState().set({dialogue:false,accountOpen:false,orderOpen:true,orderExpanded:true})} aria-pressed={orderOpen}><ReceiptText size={20}/>Mi orden</button>
      <button onClick={()=>onView('vehicle')} aria-pressed={view==='vehicle'}><Car size={20}/>Ver mi auto</button>
      <button onClick={()=>onView('service')} aria-pressed={view==='service'}><LayoutGrid size={20}/>Bahías</button>
      <button onClick={()=>onView('waiting')} aria-label="Área de espera" aria-pressed={view==='waiting'}><Armchair size={20}/>Espera</button>
      <button onClick={()=>useApp.getState().set({accountOpen:!accountOpen,dialogue:false,orderOpen:false})} aria-pressed={accountOpen}><UserRound size={20}/>Mi cuenta</button>
    </nav>
  </>
}
