import React,{lazy,Suspense} from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import './ui/world.css'
import './ui/sow.css'
const App=lazy(()=>import('./app/App').then(module=>({default:module.App})))
const AdminApp=lazy(()=>import('./admin/AdminApp').then(module=>({default:module.AdminApp})))
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Suspense fallback={<div className="loading-overlay" role="status">Preparando el establecimiento…</div>}>{location.pathname==='/admin'?<AdminApp/>:<App/>}</Suspense></React.StrictMode>)

