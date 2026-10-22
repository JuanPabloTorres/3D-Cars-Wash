import { z } from 'zod';
import { OrderService } from '../../../../lib/server/order-service';
import { identity,sameOrigin,json,failure,readBody } from '../../../../lib/server/http';
const action=z.object({action:z.enum(['arrive','start','task','ready','pay','deliver','cancel']),version:z.number().int().positive(),bay:z.number().int().min(1).max(5).optional(),taskId:z.string().uuid().optional(),method:z.enum(['cash','external-card','other']).optional()});
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){try{const u=await identity();const {id}=await ctx.params;return json({order:await new OrderService().repository.find(id,u.isAdmin?undefined:u.userId)});}catch(e){return failure(e);}}
export async function PATCH(req:Request,ctx:{params:Promise<{id:string}>}){try{sameOrigin(req);const u=await identity(true);const {id}=await ctx.params;const b=action.parse(await readBody(req));if(b.action==='task'&&!b.taskId)return json({error:'Selecciona una tarea.'},400);if(b.action==='pay'&&!b.method)return json({error:'Selecciona el medio de cobro.'},400);return json({order:await new OrderService().act(id,b,u.userId)});}catch(e){return failure(e);}}
