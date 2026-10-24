import { useBusiness, useActiveOffers } from '../../../app/business'
import { useApp } from '../../../app/store'
import { WallInformationSign } from '../../prefabs/WallInformationSign'
import { CounterHotspot, type CounterAction } from './ReceptionHotspot'

/** Wall-mounted summaries share the commercial configuration and existing detail flow.
 * No inferred opening days, discounts or availability are added to missing content. */
export function ReceptionWallInformation({onAction}:{onAction?: (action:CounterAction)=>void}) {
  const business=useBusiness(),offers=useActiveOffers(),panel=useApp(s=>s.dialogue||s.orderOpen)
  const items=[
    {action:'hours' as const,x:-1.85,heading:'Días y horarios',accent:'#c3d9df',body:business.hours||'Horario por confirmar',footer:business.hours?'Consultar horario completo':'Consulta con recepción'},
    {action:'offers' as const,x:1.85,heading:'Ofertas vigentes',accent:'#e3bf78',body:offers[0]?.title||'Sin ofertas publicadas',footer:offers.length>1?`Ver las ${offers.length} ofertas`:offers.length?'Ver detalles y vigencia':'Consultar novedades'},
  ]
  return <group name="ReceptionWallInformation">{items.map(({action,x,...content})=>
    <group key={action} position={[x,1.68,-2.445]}>
      <WallInformationSign kind={action} {...content}/>
      <CounterHotspot at={[0,0,.025]} label={`Consultar ${action==='hours'?'horarios':'ofertas'} en la pared`} description={content.body} width={180} height={115} occlude onActivate={onAction&&!panel?()=>onAction(action):undefined}/>
    </group>
  )}</group>
}
