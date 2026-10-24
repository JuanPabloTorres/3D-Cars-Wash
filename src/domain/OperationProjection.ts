import type { OperationEvent, WorldViewModel } from './contracts'
import {scenarioFrame} from './DemoOperationSource'
export const initialWorld:WorldViewModel={revision:0,eventIds:[],stage:'exited',...scenarioFrame('operation'),bay:scenarioFrame('operation').bays[0]}
export function projectOperation(state:WorldViewModel,event:OperationEvent):WorldViewModel{
 const sameStream=!event.streamId||!state.streamId||event.streamId===state.streamId
 if(event.mode!=='demo'||!Number.isSafeInteger(event.revision)||(sameStream&&(event.revision<=state.revision||state.eventIds.includes(event.eventId))))return state
 const {frame}=event
 if(!frame||frame.bays.length!==5||new Set(frame.vehicles.map(v=>v.worldEntityId)).size!==frame.vehicles.length)return state
 if(frame.bays.some(b=>b.occupancy==='occupied'&&!frame.vehicles.some(v=>v.worldEntityId===b.vehicleId&&v.bayId===b.bayId)))return state
 const own=frame.vehicles.find(v=>v.visibility==='own')
 return {...structuredClone(frame),streamId:event.streamId,revision:event.revision,eventIds:[...(sameStream?state.eventIds.slice(-63):[]),event.eventId],stage:own?.stage||'exited',bay:frame.bays.find(b=>b.bayId===own?.bayId)||frame.bays[0]}
}
