import { z } from 'zod';
import { AVATAR_SEXES } from '../../../lib/appearance';
import { D1ProfileRepository } from '../../../lib/server/profile-repository';
import { identity,sameOrigin,json,failure,readBody } from '../../../lib/server/http';
const input=z.object({avatarSex:z.enum(AVATAR_SEXES)}).strict();
export async function PATCH(req:Request){
  try{
    sameOrigin(req);
    const actor=await identity();
    const {avatarSex}=input.parse(await readBody(req));
    await new D1ProfileRepository().saveAvatar(actor,avatarSex);
    return json({avatarSex});
  }catch(e){return failure(e);}
}
