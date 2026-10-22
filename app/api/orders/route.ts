import { z } from 'zod';
import { VEHICLE_KINDS } from '../../../lib/appearance';
import { OrderService } from '../../../lib/server/order-service';
import { identity,sameOrigin,json,failure,readBody } from '../../../lib/server/http';
const schema=z.object({vehicle:z.object({kind:z.enum(VEHICLE_KINDS),color:z.enum(['Plata','Rojo','Azul','Negro','Blanco']),plate:z.string().trim().min(2).max(12).regex(/^[A-Za-z0-9 -]+$/)}),services:z.array(z.string().max(30)).min(1).max(6)}).strict();
export async function GET(req:Request){try{const admin=new URL(req.url).searchParams.get('scope')==='admin';const u=await identity(admin);return json({orders:await new OrderService().repository.list(admin?undefined:u.userId)});}catch(e){return failure(e);}}
export async function POST(req:Request){try{sameOrigin(req);const u=await identity();const key=req.headers.get('Idempotency-Key');if(!key||!/^[a-zA-Z0-9-]{16,80}$/.test(key))return json({error:'Falta la clave de solicitud.'},400);const input=schema.parse(await readBody(req));return json({order:await new OrderService().create(u,input,key)},201);}catch(e){return failure(e);}}
