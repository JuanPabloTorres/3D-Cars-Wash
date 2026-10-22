import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { DomainError } from '../../../lib/domain';
import { json,failure } from '../../../lib/server/http';
import { visualKey, type OperationVisit } from '../../../lib/operation-view';
type LocalRow={id:string;owner_id:string;status:OperationVisit['status'];bay:number|null;kind:string;color:string;task:string|null;services:string};
export async function GET(){
  try{
    if(!env.DB)throw new DomainError('La base de datos no está disponible.',503);
    const user=await getChatGPTUser();
    const result=await env.DB.prepare(`SELECT o.id,o.owner_id,o.status,o.bay,v.kind,v.color,
      (SELECT t.name FROM tasks t WHERE t.order_id=o.id AND t.status!='done' ORDER BY t.sequence LIMIT 1) AS task,
      (SELECT json_group_array(i.name) FROM order_items i WHERE i.order_id=o.id) AS services
      FROM orders o JOIN vehicles v ON v.id=o.vehicle_id
      WHERE o.status IN ('waiting','working','ready') ORDER BY COALESCE((SELECT MIN(e.created_at) FROM order_events e WHERE e.order_id=o.id AND e.action='Estado: waiting'),o.created_at),o.id LIMIT 200`).all<LocalRow>();
    const visits=await Promise.all(result.results.map(async row=>{
      const key=await visualKey(row.id);
      return {key,mine:user?.userId===row.owner_id,status:row.status,bay:row.bay,kind:row.kind,color:row.color,task:row.task,services:JSON.parse(row.services)} satisfies OperationVisit;
    }));
    const bays=visits.filter(v=>v.status==='working').map(({bay,kind,color,task})=>({bay:bay!,kind,color,task}));
    return json({visits,bays,observedAt:Date.now()});
  }catch(error){return failure(error);}
}
