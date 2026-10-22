import { env } from 'cloudflare:workers';
import type { Actor } from '../contracts';
import type { AvatarSex } from '../appearance';
import { DomainError } from '../domain';
export interface ProfileRepository {
  avatar(userId:string): Promise<AvatarSex|null>;
  saveAvatar(actor:Actor, sex:AvatarSex): Promise<void>;
}
export class D1ProfileRepository implements ProfileRepository {
  private db:D1Database;
  constructor(){if(!env.DB) throw new DomainError('La base de datos no está disponible.',503);this.db=env.DB;}
  async avatar(userId:string){
    const row=await this.db.prepare('SELECT avatar_sex FROM profiles WHERE id=?').bind(userId).first<{avatar_sex:AvatarSex|null}>();
    return row?.avatar_sex??null;
  }
  async saveAvatar(actor:Actor,sex:AvatarSex){
    await this.db.prepare('INSERT INTO profiles(id,email,name,created_at,avatar_sex) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,avatar_sex=excluded.avatar_sex')
      .bind(actor.userId,actor.email,actor.displayName,Date.now(),sex).run();
  }
}
