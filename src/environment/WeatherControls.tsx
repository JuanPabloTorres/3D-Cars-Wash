import { useState } from 'react'
import { CloudSun, MapPin } from 'lucide-react'
import { useApp } from '../app/store'
import { fetchWeather, fallbackWeather, weatherLabels, type Coordinates, type WeatherKind } from './weather'
export function WeatherControls(){
  const weather=useApp(s=>s.weather),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
  const load=async(c:Coordinates)=>{
    setBusy(true);setMessage('Consultando pronóstico…')
    try{useApp.getState().set({weather:await fetchWeather(c),weatherCoordinates:c});setMessage('')}
    catch{useApp.getState().set({weather:fallbackWeather});setMessage('Sin cobertura o conexión. Se conserva el ambiente simulado.')}
    finally{setBusy(false)}
  }
  return <section className="weather-settings" aria-label="Ambiente y clima"><h3><CloudSun size={18}/>Ambiente</h3><p role="status">{weatherLabels[weather.kind]} · {weather.label}</p>
    <div className="weather-options">{Object.entries(weatherLabels).map(([id,label])=><button key={id} aria-pressed={weather.kind===id&&weather.source==='simulation'} onClick={()=>useApp.getState().set({weather:{kind:id as WeatherKind,source:'simulation',label:'Vista previa del ambiente · Simulación'}})}>{label}</button>)}</div>
    <button className="location-button" disabled={busy} onClick={()=>{
      if(!navigator.geolocation){setMessage('Este navegador no ofrece ubicación.');return}
      setBusy(true);setMessage('Esperando permiso del navegador…')
      navigator.geolocation.getCurrentPosition(p=>void load({latitude:p.coords.latitude,longitude:p.coords.longitude,temporary:true}),()=>{setBusy(false);setMessage('Ubicación no disponible. El ambiente sigue simulado.')},{timeout:12000,maximumAge:300000,enableHighAccuracy:false})
    }}><MapPin size={16}/>Usar mi ubicación temporal</button><small>No se guarda como ubicación del establecimiento. Cobertura NWS: Estados Unidos y Puerto Rico.</small><p role="status">{message}</p><a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer">Datos abiertos: National Weather Service</a>
  </section>
}
