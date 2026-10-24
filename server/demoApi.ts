import type {IncomingMessage,ServerResponse} from 'node:http'
import {randomUUID,randomBytes,timingSafeEqual} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import type {Plugin} from 'vite'
import {DemoOperationSource,type DemoScenario} from '../src/domain/DemoOperationSource.ts'
import {quoteDemoServices} from '../src/domain/DemoOrderSource.ts'
import {quoteIsCurrent,validateRegistration,type CommerceSnapshot,type Quote,type VehicleRegistration,type CommercialOrder,type ContactRequest} from '../src/domain/commerce.ts'
import type {OperationEvent} from '../src/domain/contracts.ts'
import {initialConfiguration,persistConfiguration,validateConfiguration} from './configuration.ts'
import {BAY_IDS,type BayId} from '../src/domain/sitePlan.ts'

/** Local DEMO only. Physical arrival requires the explicit local staff command, never a visitor signal. */
export function demoApi():Plugin {
 type Session={nonce:string;revision:number;order:CommerceSnapshot['order'];history:CommercialOrder[];profile:{name:string};requests:ContactRequest[];role:'visitor'|'admin';events:Set<ServerResponse>;quotes:Map<string,Quote>;commands:Map<string,unknown>;expires:number}
 let configuration=initialConfiguration()
 const tokenPath=resolve('server/.local-admin-token')
 let adminKey=process.env.CARWASH_ADMIN_TOKEN||''
 if(!adminKey){try{adminKey=readFileSync(tokenPath,'utf8').trim()}catch{adminKey=randomBytes(24).toString('base64url');writeFileSync(tokenPath,adminKey,{mode:0o600})}}
 const keyMatches=(candidate:unknown)=>{if(typeof candidate!=='string')return false;const a=Buffer.from(candidate),b=Buffer.from(adminKey);return a.length===b.length&&timingSafeEqual(a,b)}
 const publish=(s:Session)=>{for(const client of s.events)client.write(`data: ${JSON.stringify(snapshot(s))}\n\n`)}
 const record=(s:Session,patch:Partial<CommercialOrder>,label:string)=>{if(!s.order)return;s.order={...s.order,...patch,revision:++s.revision,history:[...(s.order.history||[]),{at:new Date().toISOString(),label}]};publish(s)}
 const sessions=new Map<string,Session>(),streams=new Map<string,{source:DemoOperationSource;last:OperationEvent|null;clients:Set<ServerResponse>}>()
 const signedOut:Session[]=[]
 const assignments=new Map<string,{session:Session;orderId:string}>()
 const getStream=(key:string)=>{
  if(streams.has(key))return streams.get(key)!
  const [scenario,speed]=key.split(':'),source=new DemoOperationSource(scenario as DemoScenario,Number(speed)),streamId=randomUUID(),stream={source,last:null as OperationEvent|null,clients:new Set<ServerResponse>()}
  source.subscribe(e=>{const event={...e,streamId};stream.last=event;
   for(const [assignmentKey,assignment] of assignments){
    if(!assignmentKey.startsWith(key+':'))continue
    const owner=assignment.session,order=owner.order,v=e.frame.vehicles.find(v=>key+':'+v.worldEntityId===assignmentKey)
    if(!v||order?.id!==assignment.orderId||order.status!=='confirmed')continue
    const attention:CommercialOrder['attention']=v.stage==='ready'||v.stage==='handover'?'ready':v.bayId?'in-service':v.stage==='queued'||v.stage==='arriving'?'queued':order.attention
    if(attention!==order.attention)record(owner,{attention},`Estado operativo: ${attention}`)
   }
   const body=`data: ${JSON.stringify(event)}\n\n`;for(const c of stream.clients)c.write(body)})
  source.initialize();source.start();source.paused=scenario!=='operation';streams.set(key,stream);return stream
 }
 const json=(res:ServerResponse,code:number,value:unknown)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
 const snapshot=(s:Session):CommerceSnapshot=>({mode:'demo',revision:s.revision,order:s.order,profile:s.profile,history:s.history,requests:s.requests})
 const owners=()=>[...sessions.values(),...signedOut]
 const adminSnapshot=()=>({mode:'demo' as const,configuration,orders:owners().flatMap(s=>[...s.history,...(s.order?[s.order]:[])]),clients:owners().filter(s=>s.order||s.history.length||s.profile.name!=='Visitante').map(s=>({name:s.profile.name,vehicle:s.order?.quote.vehicle||s.history.at(-1)?.quote.vehicle,orderId:s.order?.id})),requests:owners().flatMap(s=>s.requests),operation:getStream('operation:1').last})
 const loginAttempts=new Map<string,{count:number;since:number}>()
 async function middleware(req:IncomingMessage,res:ServerResponse,next:()=>void){
  if(!req.url?.startsWith('/api/demo/'))return next()
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||'')||!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(req.headers.host||''))return json(res,403,{error:'El sandbox sólo admite conexiones de loopback.'})
  const url=new URL(req.url,'http://localhost'),path=url.pathname.slice('/api/demo/'.length)
  // Public configuration and operational DEMO streams must never create/replace
  // the private order cookie while the session bootstrap is in flight.
  if(req.method==='GET'&&path==='catalog')return json(res,200,configuration)
  const scenario=['mixed','quiet','busy','arrival'].includes(url.searchParams.get('scenario')||'')?url.searchParams.get('scenario')!:'operation',speed=Math.max(.5,Math.min(8,Number(url.searchParams.get('speed'))||1)),streamKey=`${scenario}:${speed}`
  if(req.method==='GET'&&path==='operation'){
   const stream=getStream(streamKey);if(!stream.clients.size)stream.source.paused=false;res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive'});res.write('retry: 1000\n\n');stream.clients.add(res);if(stream.last)res.write(`data: ${JSON.stringify(stream.last)}\n\n`)
   req.on('close',()=>{stream.clients.delete(res);if(!stream.clients.size&&scenario!=='operation')stream.source.paused=true});return
  }
  for(const [id,s] of sessions)if(s.expires<Date.now())sessions.delete(id)
  let id=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('febles-demo='))?.slice(12),session=id&&sessions.get(id)
  if(!session){if(sessions.size>=200)return json(res,503,{error:'La DEMO está ocupada. Intenta más tarde.'});id=randomUUID();session={nonce:randomUUID(),revision:0,order:null,history:[],profile:{name:'Visitante'},requests:[],role:'visitor',events:new Set(),quotes:new Map(),commands:new Map(),expires:Date.now()+86400000};sessions.set(id,session);res.setHeader('Set-Cookie',`febles-demo=${id}; HttpOnly; SameSite=Strict; Path=/api/demo; Max-Age=86400`)}
  const s=session
  if(req.method==='GET'&&path==='session')return json(res,200,{...snapshot(s),nonce:s.nonce,role:s.role})
  if(req.method==='GET'&&path==='events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive'});res.write(`retry: 1000\n\ndata: ${JSON.stringify(snapshot(s))}\n\n`);s.events.add(res);req.on('close',()=>s.events.delete(res));return}
  if(path.startsWith('admin/')&&path!=='admin/login'&&s.role!=='admin')return json(res,403,{error:'Se requiere la sesión administrativa local.'})
  if(req.method==='GET'&&path==='admin/snapshot')return json(res,200,adminSnapshot())
  if(req.method!=='POST')return json(res,405,{error:'Método no permitido.'})
  const origin=req.headers.origin
  if(!origin||origin!==`http://${req.headers.host}`||req.headers['x-demo-nonce']!==s.nonce)return json(res,403,{error:'La sesión DEMO no autoriza esta solicitud.'})
  try{
   let body='';for await(const chunk of req){body+=chunk;if(body.length>65536)return json(res,413,{error:'Solicitud demasiado grande.'})}
   const data=JSON.parse(body||'{}')
   if(path==='admin/login'){
    const address=req.socket.remoteAddress!,attempt=loginAttempts.get(address)
    if(attempt&&attempt.count>=8&&Date.now()-attempt.since<60000)return json(res,429,{error:'Demasiados intentos. Espera un minuto.'})
    if(!keyMatches(data.key)){loginAttempts.set(address,{count:Date.now()-(attempt?.since||0)<60000?(attempt?.count||0)+1:1,since:Date.now()-(attempt?.since||0)<60000?attempt!.since:Date.now()});return json(res,403,{error:'Clave local incorrecta.'})}
    loginAttempts.delete(address);s.role='admin';return json(res,200,{role:s.role})
   }
   if(path==='logout'){s.role='visitor';s.nonce=randomUUID();for(const client of s.events)client.end();s.events.clear();sessions.delete(id!);if(s.order||s.history.length||s.requests.length)signedOut.push(s);res.setHeader('Set-Cookie','febles-demo=; HttpOnly; SameSite=Strict; Path=/api/demo; Max-Age=0');return json(res,200,{closed:true})}
   if(path==='profile'){if(typeof data.name!=='string'||data.name.trim().length<1||data.name.length>80)return json(res,422,{error:'Escribe un nombre de entre 1 y 80 caracteres.'});s.profile={name:data.name.trim()};s.revision++;publish(s);return json(res,200,snapshot(s))}
   if(path==='contact'){
    if(!configuration.business?.contactRequestsAvailable)return json(res,409,{error:'La recepción de solicitudes no está habilitada por el establecimiento.'})
    if(data.confirmed!==true||typeof data.question!=='string'||data.question.trim().length<5||data.question.length>500||typeof data.contact!=='string'||!data.contact.trim()||validateRegistration({type:'car',color:'Plata',contact:data.contact}))return json(res,422,{error:'Revisa la pregunta y un correo o teléfono de contacto.'})
    if(typeof data.key!=='string'||data.key.length>100)return json(res,422,{error:'Falta la clave de la solicitud.'})
    if(s.commands.has(data.key))return json(res,200,s.commands.get(data.key))
    if(s.requests.length>=20)return json(res,429,{error:'Ya hay varias consultas en esta sesión.'})
    const request:ContactRequest={id:`C-${randomUUID().slice(0,8)}`,question:data.question.trim(),contact:data.contact.trim(),status:'pending',createdAt:new Date().toISOString()};s.requests.push(request);s.revision++;publish(s);s.commands.set(data.key,{request});return json(res,201,{request})
   }
   if(path==='admin/configuration'){
    if(data.expectedVersion!==configuration.version)return json(res,409,{error:'Otra edición cambió la configuración. Recarga antes de guardar.'})
    const candidate=validateConfiguration(data.configuration);candidate.version=randomUUID();persistConfiguration(candidate);configuration=candidate;for(const owner of sessions.values()){owner.revision++;publish(owner)}return json(res,200,adminSnapshot())
   }
   if(path==='admin/command'){
    const source=getStream('operation:1').source
    if(data.action==='bay'){if(!BAY_IDS.includes(data.bayId))return json(res,422,{error:'Bahía inválida.'});source.setBayAvailability(data.bayId,data.available===true);return json(res,200,adminSnapshot())}
    if(data.action==='resolve-contact'){const request=owners().flatMap(s=>s.requests).find(r=>r.id===data.requestId);if(!request)return json(res,404,{error:'Consulta no encontrada.'});request.status='resolved';return json(res,200,adminSnapshot())}
    const owner=owners().find(s=>s.order?.id===data.orderId),order=owner?.order
    if(!owner||!order)return json(res,404,{error:'Orden no encontrada.'})
    if(data.expectedRevision!==order.revision)return json(res,409,{error:'La orden cambió. Recarga para revisar su estado vigente.'})
    if(order.status!=='confirmed')return json(res,409,{error:'La orden ya está cerrada.'})
    const entity=order.worldEntityId
    if(data.action==='arrive'){
     if(order.attention!=='not-arrived')return json(res,409,{error:'La llegada ya está registrada.'})
     const entityId=`order-${order.id}`,colors:Record<string,string>={Plata:'#b5c1c5',Rojo:'#b2293c',Azul:'#215d85',Negro:'#353e4b',Blanco:'#d4d2c8'}
     source.addOrder(entityId,order.quote.services.map(s=>s.id),colors[order.quote.vehicle.color],order.quote.vehicle.type);assignments.set('operation:1:'+entityId,{session:owner,orderId:order.id});record(owner,{attention:'queued',worldEntityId:entityId},'Llegada registrada por administración local')
    }else if(data.action==='cancel'){
     if(!['not-arrived','queued'].includes(order.attention))return json(res,409,{error:'La atención ya comenzó. No se admite cancelación directa.'})
     if(entity)source.removeQueued(entity);record(owner,{status:'cancelled'},'Cancelación administrativa')
    }else if(!entity)return json(res,409,{error:'Primero registra la llegada.'})
    else if(data.action==='assign'){if(!BAY_IDS.includes(data.bayId))return json(res,422,{error:'Bahía inválida.'});source.assignOrder(entity,data.bayId as BayId);record(owner,{attention:'in-service'},`Asignación a bahía ${data.bayId}`)}
    else if(data.action==='task'){source.advanceVehicle(entity);record(owner,{},'Tarea avanzada por administración local')}
    else if(data.action==='handover'){source.releaseVehicle(entity);record(owner,{attention:'ready'},'Vehículo trasladado a entrega')}
    else if(data.action==='deliver'){source.releaseVehicle(entity,true);record(owner,{attention:'delivered',status:'completed'},'Entrega autorizada · pago sigue pendiente')}
    else return json(res,422,{error:'Acción desconocida.'})
    return json(res,200,adminSnapshot())
   }
   if(path==='quote'){
    const vehicle=data.vehicle as VehicleRegistration,error=vehicle&&validateRegistration(vehicle)
    if(!vehicle||error)return json(res,422,{error:error||'Falta el vehículo.'})
    const ids=data.services as string[]
    if(!Array.isArray(ids)||!ids.length||ids.some(id=>!configuration.services?.some(s=>s.id===id)))return json(res,422,{error:'Selecciona servicios del catálogo DEMO.'})
    let prices
    try{prices=quoteDemoServices([...new Set(ids)],vehicle.type,configuration)}catch(e){return json(res,422,{error:(e as Error).message})}
    const quote:Quote={...prices,id:randomUUID(),expiresAt:Date.now()+300000,vehicle:{type:vehicle.type,color:vehicle.color,contact:vehicle.contact.slice(0,100)}}
    if(s.quotes.size>20)s.quotes.clear();s.quotes.set(quote.id,quote);return json(res,200,quote)
   }
   if(path==='confirm'){
    if(typeof data.key!=='string'||data.key.length>100)return json(res,422,{error:'Falta la clave de confirmación.'})
    if(s.commands.has(data.key))return json(res,200,s.commands.get(data.key))
    const q=s.quotes.get(data.quoteId)
    if(!q||!quoteIsCurrent(q))return json(res,409,{error:'La cotización venció. Solicita una nueva antes de confirmar.'})
    const current=quoteDemoServices(q.services.map(s=>s.id),q.vehicle.type,configuration)
    if(q.pricingVersion!==current.pricingVersion||q.total!==current.total)return json(res,409,{error:'La configuración de tarifas cambió. Revisa una nueva cotización antes de confirmar.'})
    if(s.order?.status==='confirmed')return json(res,409,{error:'Ya tienes una orden activa. Consúltala antes de preparar otra.'})
    if(s.order)s.history.push(s.order)
    s.order={id:`D-${randomUUID().slice(0,8).toUpperCase()}`,revision:++s.revision,status:'confirmed',attention:'not-arrived',payment:'pending',quote:q,worldEntityId:null,createdAt:new Date().toISOString(),history:[{at:new Date().toISOString(),label:'Orden confirmada · llegada y pago pendientes'}]};const result=snapshot(s);s.commands.set(data.key,result);publish(s);return json(res,200,result)
   }
   // Naturally idempotent per order. This is a private request for staff review,
   // not permission to create an operational vehicle or confirm physical presence.
   if(path==='arrival-request'){
    if(!s.order||s.order.id!==data.orderId)return json(res,404,{error:'La orden no pertenece a esta sesión.'})
    if(s.order.status!=='confirmed'||s.order.attention!=='not-arrived')return json(res,409,{error:'La orden ya no tiene una llegada pendiente de revisión.'})
    if(!s.order.arrivalRequestedAt)record(s,{arrivalRequestedAt:new Date().toISOString()},'Revisión de llegada solicitada por visitante · pendiente de confirmación del personal')
    return json(res,200,snapshot(s))
   }
   if(path==='cancel'){
    if(!s.order||s.order.id!==data.orderId)return json(res,404,{error:'La orden no pertenece a esta sesión.'})
    if(s.order.status==='cancelled')return json(res,200,snapshot(s))
    if(s.order.status!=='confirmed'||!['not-arrived','queued'].includes(s.order.attention))return json(res,409,{error:'La atención ya comenzó. Consulta con recepción para revisar alternativas.'})
    if(s.order.worldEntityId)getStream('operation:1').source.removeQueued(s.order.worldEntityId)
    record(s,{status:'cancelled'},'Cancelación solicitada por visitante');return json(res,200,snapshot(s))
   }
   // Synthetic operator fixture: same server/projection as visitor; never production permissions.
   if(path==='tools'&&data.sandbox===true&&scenario!=='operation'){
    const stream=getStream(streamKey)
    if(data.action==='pause')stream.source.paused=!!data.paused
    else if(data.action==='advance')stream.source.advance()
    else if(data.action==='reset'){
     stream.source.reset()
     for(const [key,assignment]of assignments)if(key.startsWith(streamKey+':')){
      const owner=assignment.session
      if(owner.order?.id===assignment.orderId)owner.order={...owner.order,revision:++owner.revision,attention:'not-arrived',worldEntityId:null}
      assignments.delete(key)
     }
    }
    else if(data.action==='start-order'&&s.order?.status==='confirmed'){
     const colors:Record<string,string>={Plata:'#b5c1c5',Rojo:'#b2293c',Azul:'#215d85',Negro:'#353e4b',Blanco:'#d4d2c8'},entity='demo-vehicle-01'
     const key=streamKey+':'+entity,assigned=assignments.get(key)
     if(assigned&&assigned.orderId!==s.order.id)return json(res,409,{error:'El vehículo de este escenario DEMO ya está asignado a otra solicitud. Usa un escenario libre.'})
     if(assigned?.orderId===s.order.id)return json(res,200,snapshot(s))
     if(!stream.source.configureOrder(entity,s.order.quote.services.map(s=>s.id),colors[s.order.quote.vehicle.color],s.order.quote.vehicle.type))return json(res,409,{error:'El vehículo DEMO no está disponible en una bahía. Reinicia el escenario de pruebas.'})
     assignments.set(key,{session:s,orderId:s.order.id})
     s.order={...s.order,revision:++s.revision,attention:'in-service',worldEntityId:entity}
    }else return json(res,422,{error:'Acción DEMO desconocida.'})
    return json(res,200,snapshot(s))
   }
   return json(res,404,{error:'Acción no disponible.'})
  }catch{return json(res,400,{error:'Solicitud inválida.'})}
 }
 const dispose=()=>{for(const s of streams.values()){s.source.dispose();for(const client of s.clients)client.end()}for(const s of sessions.values())for(const client of s.events)client.end()}
 return {name:'febles-local-demo-api',configureServer(server){server.middlewares.use(middleware);server.httpServer?.on('close',dispose)},configurePreviewServer(server){server.middlewares.use(middleware);server.httpServer.on('close',dispose)}}
}

