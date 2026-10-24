import { SERVICE_COMPLETED_MESSAGE } from '../domain/commerce'
import { useEffect, useState } from 'react'
import { CircleCheck, X } from 'lucide-react'
import { useCommerce } from '../app/commerceStore'
import './service-completion.css'

/** Durable private server message, displayed once per tab. Reconnect can recover
 * a missed event; the world/public stream never carries notification contents. */
export function ServiceCompletionNotice() {
 const order=useCommerce(s=>s.order),notice=order?.completionNotice
 const [dismissed,setDismissed]=useState<string|null>(null)
 const key=notice?`carwash.notice.${notice.id}`:''
 const seen=()=>{try{return sessionStorage.getItem(key)==='seen'}catch{return false}}
 useEffect(()=>{setDismissed(seen()?notice?.id||null:null)},[notice?.id])
 if(!notice||dismissed===notice.id||seen())return null
 const dismiss=()=>{try{sessionStorage.setItem(key,'seen')}catch{/* Keep in-memory dismissal. */}setDismissed(notice.id)}
 return <section className="completion-notice private-completion-notice" role="status" aria-live="polite">
  <CircleCheck size={24}/><div><strong>¡Tus servicios han terminado!</strong><p>{SERVICE_COMPLETED_MESSAGE}</p><small>Servicios finalizados · DEMO</small></div>
  <button aria-label="Cerrar aviso" onClick={dismiss}><X size={17}/></button>
 </section>
}
