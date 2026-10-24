import {useState} from 'react'
import {useCommerce} from '../app/commerceStore'

/** Customer identity uses the existing private commercial session, not another
 * order store. Registration never accepts a role from this form. */
export function CustomerAccess({disabled=false,onAuthenticated}:{disabled?:boolean;onAuthenticated?:()=>void}={}){
 const [register,setRegister]=useState(false),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const authenticate=useCommerce(s=>s.authenticate)
 return <section className="customer-access"><h3>{register?'Crea tu cuenta':'Accede a tu cuenta'}</h3><p className="muted">Recupera tu orden y tu historial cuando vuelvas.</p>
  <form onSubmit={async e=>{e.preventDefault();if(busy||disabled)return;setBusy(true);setError('');try{await authenticate(register,{username,password,name});setPassword('');onAuthenticated?.()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>
   {register&&<label className="field">Nombre completo<input required maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label>}
   <label className="field">Usuario<input required minLength={3} maxLength={60} pattern="[a-zA-Z0-9._-]{3,60}" autoComplete="username" value={username} onChange={e=>{setUsername(e.target.value);setError('')}}/></label>
   <label className="field">Contraseña<input type="password" required minLength={register?12:1} maxLength={200} autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>{setPassword(e.target.value);setError('')}}/></label>
   {register&&<small>Mínimo 12 caracteres.</small>}
   {error&&<p role="alert" className="form-error">{error}</p>}
   <button className="primary wide" disabled={busy||disabled}>{busy?'Conectando…':register?'Crear cuenta de cliente':'Iniciar sesión de cliente'}</button>
   <button type="button" className="text-button" disabled={busy} onClick={()=>{setRegister(!register);setError('')}}>{register?'Ya tengo una cuenta':'Registrarme como cliente'}</button>
  </form><p className="muted">Equipo: <a href="/employee">Empleados</a> · <a href="/admin">Administración</a></p>
 </section>
}
