import { useEffect } from 'react'
import { useCommerce } from './commerceStore'

/** Layer 03 consumes the existing session and commands, without starting bay
 * simulation. The isolated landscape/architecture previews make no API calls. */
export function useCommercialSession() {
  useEffect(()=>{
    let disposed=false,events:EventSource|null=null
    void useCommerce.getState().refresh().then(()=>{
      if(disposed)return
      events=new EventSource('/api/demo/events')
      events.onmessage=event=>{try{useCommerce.getState().receive(JSON.parse(event.data));void useCommerce.getState().refresh(true)}catch{/* Refresh recovers an incomplete stream event. */}}
      events.onerror=()=>useCommerce.setState({connected:false})
    })
    const timer=setInterval(()=>{if(!document.hidden)void useCommerce.getState().refresh(true)},5000)
    return()=>{disposed=true;events?.close();clearInterval(timer)}
  },[])
}
