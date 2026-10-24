import {ValidationError} from './errors.ts'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { SqliteRepository } from './persistence.ts'

export interface StaffUser {id:string;username:string;name:string;role:'admin'|'employee'|'customer';enabled:boolean;createdAt:string}
type UserRecord=StaffUser&{passwordHash:string}
const project=(row:Record<string,unknown>):UserRecord=>({id:String(row.id),username:String(row.username),name:String(row.name),role:row.role as StaffUser['role'],enabled:row.enabled===1,createdAt:String(row.created_at),passwordHash:String(row.password_hash)})
const publicUser=({passwordHash:_,...user}:UserRecord)=>user
function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex')}
function passwordValid(password:string,encoded:string){const [salt,hash]=encoded.split(':');const actual=scryptSync(password,salt,64),expected=Buffer.from(hash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected)}
export class UserRepository extends SqliteRepository {
  list():StaffUser[]{return this.db.prepare('SELECT * FROM users ORDER BY created_at').all().map(row=>publicUser(project(row)))}
  find(username:string){const row=this.db.prepare('SELECT * FROM users WHERE username=?').get(username);return row?project(row):null}
  byId(id:string){const row=this.db.prepare('SELECT * FROM users WHERE id=?').get(id);return row?publicUser(project(row)):null}
  insert(user:StaffUser,passwordHash:string){this.db.prepare('INSERT INTO users(id,username,name,role,password_hash,enabled,created_at) VALUES(?,?,?,?,?,?,?)').run(user.id,user.username,user.name,user.role,passwordHash,Number(user.enabled),user.createdAt)}
  update(id:string,enabled:boolean,passwordHash?:string){this.transaction(()=>{
    const current=this.byId(id);if(!current)throw new ValidationError('Usuario no encontrado.')
    if(!enabled&&current.role==='admin'&&this.list().filter(u=>u.enabled&&u.role==='admin').length<=1)throw new ValidationError('Debe permanecer al menos un administrador activo.')
    this.db.prepare('UPDATE users SET enabled=?, password_hash=COALESCE(?,password_hash) WHERE id=?').run(Number(enabled),passwordHash??null,id)
  })}
}
/** Credentials never enter snapshots. The database owns roles, not the login form. */
export class AuthenticationService {
  private readonly dummy=hashPassword(randomBytes(24).toString('hex'))
  constructor(private readonly users:UserRepository){}
  authenticate(username:unknown,password:unknown):StaffUser|null {
    if(typeof username!=='string'||typeof password!=='string'||password.length>200||username.length>80)return null
    const user=this.users.find(username.trim().toLowerCase()),valid=passwordValid(password,user?.passwordHash??this.dummy)
    return user?.enabled&&valid?publicUser(user):null
  }
  create(input:{username:unknown;name:unknown;role:unknown;password:unknown}){
    const username=typeof input.username==='string'?input.username.trim().toLowerCase():''
    const name=typeof input.name==='string'?input.name.trim():''
    if(!/^[a-z0-9._-]{3,60}$/.test(username)||!name||name.length>80||!['admin','employee','customer'].includes(String(input.role)))throw new ValidationError('Revisa usuario, nombre y rol.')
    this.validatePassword(input.password)
    if(this.users.find(username))throw new ValidationError('Ese usuario ya existe.')
    const user:StaffUser={id:randomUUID(),username,name,role:input.role as StaffUser['role'],enabled:true,createdAt:new Date().toISOString()}
    this.users.insert(user,hashPassword(input.password as string));return user
  }
  update(id:string,enabled:boolean,password:unknown){
    if(password!==undefined&&password!=='')this.validatePassword(password)
    this.users.update(id,enabled,typeof password==='string'&&password?hashPassword(password):undefined)
  }
  private validatePassword(password:unknown){if(typeof password!=='string'||password.length<12||password.length>200)throw new ValidationError('La contraseña debe tener entre 12 y 200 caracteres.')}
}
