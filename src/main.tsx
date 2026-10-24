import React,{lazy,Suspense} from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import './ui/world.css'
import './ui/sow.css'
import { LayerErrorBoundary } from './world/layers/LayerErrorBoundary'
const App=lazy(()=>import('./app/App').then(module=>({default:module.App})))
const AdminApp=lazy(()=>import('./admin/AdminApp').then(module=>({default:module.AdminApp})))
const CustomerLogin=lazy(()=>import('./ui/CustomerLogin').then(module=>({default:module.CustomerLogin})))
const GroundLayer=lazy(()=>import('./world/layers/GroundLayer').then(module=>({default:module.GroundLayer})))
const OperationsExperience=lazy(()=>import('./world/layers/operations/OperationsExperience').then(module=>({default:module.OperationsExperience})))
const ReceptionSiteExperience=lazy(()=>import('./world/layers/operations/ReceptionSiteExperience').then(module=>({default:module.ReceptionSiteExperience})))
const layer=new URLSearchParams(location.search).get('layer')
const reception=(layer==='reception'||layer==='lounge')||location.pathname==='/world3d'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Suspense fallback={<div className="loading-overlay" role="status">Preparando el establecimiento…</div>}>{location.pathname==='/login'?<CustomerLogin/>:['/admin','/employee'].includes(location.pathname)?<AdminApp employee={location.pathname==='/employee'}/>:layer==='operations'?<LayerErrorBoundary><OperationsExperience/></LayerErrorBoundary>:reception&&!new URLSearchParams(location.search).has('stage')?<LayerErrorBoundary><ReceptionSiteExperience/></LayerErrorBoundary>:layer==='ground'||layer==='landscape'||reception?<LayerErrorBoundary><GroundLayer landscape={layer!=='ground'} reception={reception}/></LayerErrorBoundary>:<App/>}</Suspense></React.StrictMode>)

