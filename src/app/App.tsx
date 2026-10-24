import { useEffect, useState } from 'react'
import { WorldScene } from '../world/WorldScene'
import { WorldHUD } from '../ui/WorldHUD'
import { DemoOperationTransport } from '../domain/DemoOperationTransport'
import {useCommerce} from './commerceStore'
import { useApp } from './store'
import { diagnostics } from '../world/diagnostics'
import { VehicleInspectionExperience } from '../world/interactions/VehicleInspectionExperience'
import {WeatherDataController}from '../environment/WeatherDataController'
import { appConfig } from '../config/appConfig'
import {useBusiness} from './business'
import {ServiceCompletionNotice} from '../ui/ServiceCompletionNotice'
declare global { interface Window { __FEBLES__: {snapshot:()=>unknown} } }
export function App(){
  const business=useBusiness()
  useEffect(()=>{document.title=`${business.name} · 3D`},[business.name])
  const [source,setSource]=useState<DemoOperationTransport|null>(null)
  const ready=useApp(s=>s.ready),sceneFailed=useApp(s=>s.sceneFailed)
  useEffect(()=>{
    const params=new URLSearchParams(location.search),requested=params.get('scenario'),scenario=['mixed','quiet','busy','arrival'].includes(requested||'')?requested!:'operation'
    const speed=Math.max(.5,Math.min(8,Number(params.get('demoSpeed'))||1))
    const demo=new DemoOperationTransport(scenario,speed,sync=>useApp.getState().set({sync})),unsubscribe=demo.subscribe(event=>useApp.getState().receive(event))
    let disposed=false,events:EventSource|null=null
    void useCommerce.getState().refresh().then(()=>{if(disposed)return;events=new EventSource('/api/demo/events');events.onmessage=event=>{try{useCommerce.getState().receive(JSON.parse(event.data));void useCommerce.getState().refresh(true)}catch{}};events.onerror=()=>useCommerce.setState({connected:false})});setSource(demo)
    const refresh=()=>{if(!document.hidden)void useCommerce.getState().refresh(true)},timer=setInterval(refresh,5000);document.addEventListener('visibilitychange',refresh)
    window.__FEBLES__={snapshot:()=>structuredClone({ready:useApp.getState().ready,entered:useApp.getState().entered,destination:useApp.getState().destination,navRevision:useApp.getState().navRevision,activeView:useApp.getState().activeView,sync:useApp.getState().sync,interaction:useApp.getState().interaction,dialogue:useApp.getState().dialogue,paused:useApp.getState().paused,world:useApp.getState().world,...diagnostics})}
    return()=>{disposed=true;events?.close();unsubscribe();demo.dispose();clearInterval(timer);document.removeEventListener('visibilitychange',refresh)}
  },[])
  useEffect(()=>{if(ready&&source)source.start()},[ready,source])
  return <main className="world" data-ready={ready} aria-label={`${business.name}: visita tridimensional`}><WeatherDataController/><WorldScene/><VehicleInspectionExperience/>{!ready&&!sceneFailed&&<div className="loading-overlay"><div className="loading" role="status"><b>{business.name}</b><span>Preparando tu visita…</span></div></div>}<WorldHUD source={source}/><ServiceCompletionNotice/></main>
}

