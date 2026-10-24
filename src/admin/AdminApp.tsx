import { useState } from 'react';
import { Activity, ClipboardList, Tags, Users, MessagesSquare, Settings, LogOut, ArrowUpRight, RefreshCw, LockKeyhole, CheckCircle2 } from 'lucide-react';
import { vehicleTypeLabels } from '../domain/commerce';
import { useAdminSession } from './useAdminSession';
import { AdminOperation } from './AdminOperation';
import { AdminEditors } from './AdminEditors';
import './admin.css';
const areas = [['operation', 'Operación', Activity], ['orders', 'Órdenes', ClipboardList], ['services', 'Servicios y precios', Tags], ['clients', 'Clientes y vehículos', Users], ['content', 'Contenido y atención', MessagesSquare], ['settings', 'Configuración', Settings]] as const;
type Area = typeof areas[number][0];
/** Composes the six administrative areas; session effects and editing are separate. */
export function AdminApp() {
    const session = useAdminSession(), { data, config, authorized, busy, error, notice, connected } = session;
    const [area, setArea] = useState<Area>('operation'), [key, setKey] = useState(''), [selected, setSelected] = useState<string | null>(null);
    if (!authorized)
        return <main className="admin-login"><form onSubmit={async (e) => { e.preventDefault(); if (await session.login(key))
            setKey(''); }}><div className="admin-symbol"><LockKeyhole /></div><small>ADMINISTRACIÓN LOCAL · DEMO</small><h1>Control del establecimiento</h1><p>Acceso al sandbox de este equipo. La clave se genera en <code>server/.local-admin-token</code>. No la compartas.</p><label className="field">Clave local de administración<input type="password" autoComplete="current-password" value={key} onChange={e => setKey(e.target.value)} required maxLength={200}/></label><button className="primary wide" disabled={busy}>{busy ? 'Verificando…' : 'Entrar al panel local'}</button>{error && <p role="alert" className="form-error">{error}</p>}<a href="/">Volver a la visita 3D</a><p className="muted">No administra cobros ni cuentas de producción. Los pedidos de esta sesión residen en memoria del servidor.</p></form></main>;
    return <main className="admin-shell"><header className="admin-top"><div><small>ADMINISTRACIÓN · SANDBOX LOCAL</small><h1>{data?.configuration.business?.name || 'CarWash Studio'}</h1></div><div className="admin-top-actions"><span className={`connection ${connected ? 'online' : ''}`} role="status">{connected ? 'Conectado' : 'Datos sin actualizar'}</span><a href="/" target="_blank" rel="noreferrer">Visita 3D<ArrowUpRight size={16}/></a><button aria-label="Actualizar administración" onClick={session.refresh}><RefreshCw size={17}/></button><button onClick={session.logout}><LogOut size={16}/>Salir</button></div></header><nav className="admin-nav" aria-label="Áreas administrativas">{areas.map(([id, label, Icon]) => <button key={id} aria-current={area === id ? 'page' : undefined} onClick={() => { setArea(id); session.clearMessages(); }}><Icon size={18}/>{label}</button>)}</nav>
 {error && <div className="admin-message form-error" role="alert">{error}<button onClick={() => { void session.refresh(); session.clearMessages(); }}>Recargar estado</button></div>}{notice && <div className="admin-message success" role="status"><CheckCircle2 size={17}/>{notice}</div>}
 {!data || !config ? <p>Cargando estado…</p> : <div className="admin-content">
 {(area === 'operation' || area === 'orders') && <AdminOperation data={data} area={area as 'operation' | 'orders'} busy={busy} selected={selected} setSelected={setSelected} action={session.action}/>}
 {area === 'clients' && <><div className="admin-page-title"><div><small>SESIONES DEL SANDBOX</small><h2>Clientes y vehículos</h2></div></div><p className="muted">No existe un directorio de cuentas de producción. Estos registros proceden de perfiles y órdenes de sesiones locales.</p><section className="admin-card">{!data.clients.length ? <p>Sin registros en esta sesión del servidor.</p> : data.clients.map((c, i) => <div className="admin-client-row" key={i}><Users size={20}/><strong>{c.name}</strong><span>{c.vehicle ? `${vehicleTypeLabels[c.vehicle.type]} · ${c.vehicle.color}` : 'Sin vehículo registrado'}</span><small>{c.orderId}</small></div>)}</section></>}
 {(area === 'services' || area === 'content' || area === 'settings') && <AdminEditors area={area} data={data} config={config} setConfig={session.setConfig} busy={busy} save={session.save} action={session.action}/>}

 </div>}
 </main>;
}
