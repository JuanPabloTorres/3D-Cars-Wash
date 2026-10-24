import { useState } from 'react';
import { Activity, ClipboardList, Tags, Users, MessagesSquare, Settings, LogOut, ArrowUpRight, RefreshCw, LockKeyhole, CheckCircle2 } from 'lucide-react';
import { vehicleTypeLabels } from '../domain/commerce';
import { useAdminSession } from './useAdminSession';
import { AdminOperation } from './AdminOperation';
import { AdminEditors } from './AdminEditors';
import './admin.css';
import {StaffLogin} from './StaffLogin';
import {StaffUsers} from './StaffUsers';
const areas = [['operation', 'Operación', Activity], ['orders', 'Órdenes', ClipboardList], ['services', 'Servicios y precios', Tags], ['clients', 'Clientes y vehículos', Users], ['content', 'Contenido y atención', MessagesSquare], ['users', 'Usuarios del equipo', Users], ['settings', 'Configuración', Settings]] as const;
type Area = typeof areas[number][0];
/** Composes the six administrative areas; session effects and editing are separate. */
export function AdminApp({employee=false}:{employee?:boolean}) {
    const session = useAdminSession(employee), { data, config, authorized, busy, error, notice, connected } = session;
    const [area, setArea] = useState<Area>('operation'), [selected, setSelected] = useState<string | null>(null);
    if (!authorized) return <StaffLogin employee={employee} busy={busy} error={error} login={session.login}/>;
    return <main className="admin-shell"><header className="admin-top"><div><small>{employee?'PERSONAL · SANDBOX LOCAL':'ADMINISTRACIÓN · SANDBOX LOCAL'}</small><h1>{data?.configuration.business?.name || 'CarWash Studio'}</h1></div><div className="admin-top-actions"><span className={`connection ${connected ? 'online' : ''}`} role="status">{connected ? 'Conectado' : 'Datos sin actualizar'}</span><a href={employee?"/admin":"/employee"}>{employee?"Administración":"Panel de empleados"}<ArrowUpRight size={16}/></a><button aria-label="Actualizar administración" onClick={session.refresh}><RefreshCw size={17}/></button><button onClick={session.logout}><LogOut size={16}/>Salir</button></div></header><nav className="admin-nav" aria-label="Áreas administrativas">{areas.filter(([id])=>!employee||['operation','orders'].includes(id)).map(([id, label, Icon]) => <button key={id} aria-current={area === id ? 'page' : undefined} onClick={() => { setArea(id); session.clearMessages(); }}><Icon size={18}/>{label}</button>)}</nav>
 {error && <div className="admin-message form-error" role="alert">{error}<button onClick={() => { void session.refresh(); session.clearMessages(); }}>Recargar estado</button></div>}{notice && <div className="admin-message success" role="status"><CheckCircle2 size={17}/>{notice}</div>}
 {!data || !config ? <p>Cargando estado…</p> : <div className="admin-content">
 {(area === 'operation' || area === 'orders') && <AdminOperation data={data} area={area as 'operation' | 'orders'} busy={busy} selected={selected} setSelected={setSelected} action={session.action} employee={employee}/>}
 {area === 'clients' && <><div className="admin-page-title"><div><small>SESIONES DEL SANDBOX</small><h2>Clientes y vehículos</h2></div></div><p className="muted">No existe un directorio de cuentas de producción. Estos registros proceden de perfiles y órdenes de sesiones locales.</p><section className="admin-card">{!data.clients.length ? <p>Sin registros en esta sesión del servidor.</p> : data.clients.map((c, i) => <div className="admin-client-row" key={i}><Users size={20}/><strong>{c.name}</strong><span>{c.vehicle ? `${vehicleTypeLabels[c.vehicle.type]} · ${c.vehicle.color}` : 'Sin vehículo registrado'}</span><small>{c.orderId}</small></div>)}</section></>}
 {area==='users'&&<StaffUsers users={data.users||[]} busy={busy} action={session.action}/>}
 {(area === 'services' || area === 'content' || area === 'settings') && <AdminEditors area={area} data={data} config={config} setConfig={session.setConfig} busy={busy} save={session.save} action={session.action}/>}

 </div>}
 </main>;
}
