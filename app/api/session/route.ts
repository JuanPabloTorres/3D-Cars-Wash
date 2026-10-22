import { D1ProfileRepository } from '../../../lib/server/profile-repository';
import { getChatGPTUser } from '../../chatgpt-auth';
import { env } from 'cloudflare:workers';
export async function GET(){const u=await getChatGPTUser();const admin=u?((env as any).ADMIN_EMAILS??'').split(',').map((s:string)=>s.trim().toLowerCase()).includes(u.email.toLowerCase()):false;return Response.json({user:u?{name:u.displayName,email:u.email,isAdmin:admin,avatarSex:await new D1ProfileRepository().avatar(u.userId)}:null,authMode:'platform',emailOtpAvailable:false},{headers:{'Cache-Control':'no-store'}});}
