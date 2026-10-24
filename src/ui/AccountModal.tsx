import { CarFront, Clock3, LogOut, X } from 'lucide-react'
import { appConfig } from '../config/appConfig'
import { useApp } from '../app/store'
import {useState} from 'react'
import {useCommerce} from '../app/commerceStore'
import {vehicleTypeLabels} from '../domain/commerce'
import {WorldPanel} from './WorldOverlayManager'

export function AccountModal(){
  const commerce=useCommerce(),[name,setName]=useState(commerce.profile.name),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const close=()=>useApp.getState().set({accountOpen:false})
  const vehicles=[...commerce.history,...(commerce.order?[commerce.order]:[])].map(o=>o.quote.vehicle),unique=vehicles.filter((v,i)=>vehicles.findIndex(other=>other.type===v.type&&other.color===v.color)===i)
  return <WorldPanel title="Cuenta" subtitle="TU SESIÓN LOCAL · DEMO" className="account-panel" onClose={close}>
    <div className="account-heading"><div className="avatar-large">{commerce.profile.name.slice(0,2).toUpperCase()}</div><div><strong>{commerce.profile.name}</strong><small>Visitante · sesión privada</small></div></div>
    <form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await commerce.saveProfile(name)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}><label className="field">Nombre para esta visita<input maxLength={80} required value={name} onChange={e=>setName(e.target.value)}/></label><button className="primary wide" disabled={busy}>{busy?'Guardando…':'Guardar perfil'}</button></form>
    <section><h3><CarFront size={16}/> Vehículos registrados</h3>{unique.length?unique.map((v,i)=><div className="account-row" key={i}><span>{vehicleTypeLabels[v.type]} · {v.color}</span><small>Registrado en una orden de esta sesión</small></div>):<p className="muted">Sin vehículos confirmados. El borrador actual es {vehicleTypeLabels[commerce.draft.vehicle.type]} · {commerce.draft.vehicle.color}.</p>}<button className="text-button" onClick={()=>{commerce.updateDraft({step:'vehicle'});close();useApp.getState().navigate('reception')}}>Gestionar mi vehículo</button></section>
    <section><h3><Clock3 size={16}/> Historial</h3>{[...commerce.history,...(commerce.order?[commerce.order]:[])].filter(o=>o.status!=='confirmed').map(o=><div className="account-row" key={o.id}><span>{o.id}</span><small>{o.status==='completed'?'Entregado':'Cancelado'} · Pago {o.payment==='pending'?'pendiente':''}</small></div>)}{!commerce.history.length&&commerce.order?.status!=='completed'&&commerce.order?.status!=='cancelled'&&<p className="muted">Sin órdenes finalizadas en esta sesión.</p>}</section>
    {error&&<p role="alert" className="form-error">{error}</p>}
    <button className="account-logout" disabled={busy} onClick={async()=>{setBusy(true);try{await commerce.logout();close();useApp.getState().set({announcement:'La sesión DEMO se cerró.'})}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}><LogOut size={16}/> Cerrar sesión DEMO</button>
  </WorldPanel>
}

