import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const dir=new URL('../.profile-test/',import.meta.url);fs.mkdirSync(dir,{recursive:true});
const compile=(path,name)=>{
 let code=ts.transpileModule(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 code=code.replace(/import \{ env \} from ['"]cloudflare:workers['"];?/g,'const env=globalThis.profileTest.env;')
  .replace(/import \{ getChatGPTUser \} from [^;]+;/g,'const getChatGPTUser=async()=>globalThis.profileTest.user;')
  .replace(/from ['"][^'"]*\/domain['"]/g,'from "./domain.js"')
  .replace(/from ['"][^'"]*\/appearance['"]/g,'from "./appearance.js"')
  .replace(/from ['"][^'"]*\/operation-view['"]/g,'from "./operation-view.js"')
  .replace(/from ['"][^'"]*\/profile-repository['"]/g,'from "./repository.js"')
  .replace(/from ['"][^'"]*\/http['"]/g,'from "./http.js"');
 fs.writeFileSync(new URL(name+'.js',dir),code);
};
for(const [path,name]of [['lib/domain.ts','domain'],['lib/appearance.ts','appearance'],['lib/operation-view.ts','operation-view'],['lib/server/http.ts','http'],['lib/server/profile-repository.ts','repository'],['app/api/profile/route.ts','route'],['app/api/local/route.ts','local-route']])compile(path,name);
const calls=[];
globalThis.profileTest={user:{userId:'owner-123',displayName:'Example',email:'example@invalid.test'},env:{DB:{prepare(sql){return {bind(...params){return {async run(){calls.push({sql,params});return {success:true};}};}};}}}};
let checks=0;
try{
 const {PATCH}=await import(new URL('route.js',dir));
 const request=(body,origin='https://wash.test')=>new Request('https://wash.test/api/profile',{method:'PATCH',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const test=async(name,fn)=>{await fn();checks++;console.log('PASS',name);};
 await test('El personaje se guarda usando solo la identidad autenticada',async()=>{const r=await PATCH(request({avatarSex:'female'}));assert.equal(r.status,200);assert.equal(calls[0].params[0],'owner-123');assert.equal(calls[0].params[4],'female');});
 await test('No acepta un identificador de otra cuenta en el cuerpo',async()=>{assert.equal((await PATCH(request({avatarSex:'male',userId:'victim'}))).status,400);assert.equal(calls.length,1);});
 await test('Rechaza personajes fuera del contrato permitido',async()=>assert.equal((await PATCH(request({avatarSex:'arbitrary'}))).status,400));
 await test('Rechaza escrituras desde un origen ajeno',async()=>assert.equal((await PATCH(request({avatarSex:'male'},'https://elsewhere.test'))).status,403));
 await test('Rechaza visitantes sin sesión',async()=>{globalThis.profileTest.user=null;assert.equal((await PATCH(request({avatarSex:'male'}))).status,401);});
 assert.equal(calls.length,1);
 await test('La operación pública oculta identificadores y marca solamente la visita propia',async()=>{
  globalThis.profileTest.user={userId:'owner-123',displayName:'Example',email:'example@invalid.test'};
  globalThis.profileTest.env.DB.prepare=()=>({all:async()=>({results:[{id:'private-order-uuid',owner_id:'owner-123',status:'working',bay:2,kind:'Pickup',color:'Azul',task:'Lavado exterior',services:'["Lavado completo"]'},{id:'another-private-order',owner_id:'other-user',status:'waiting',bay:null,kind:'Van',color:'Blanco',task:'Preparación',services:'["Shampoo interior"]'}]})});
  const {GET}=await import(new URL('local-route.js',dir));
  const response=await GET(),data=await response.json();assert.equal(response.status,200);
  assert.equal(data.visits.length,2);assert.equal(data.bays.length,1);
  assert.ok(data.visits[0].mine);assert.equal(data.visits[1].mine,false);
  assert.match(data.visits[0].key,/^[0-9a-f]{64}$/);
  assert.deepEqual(data.visits[0].services,['Lavado completo']);
  const publicJson=JSON.stringify(data);
  for(const secret of ['private-order-uuid','another-private-order','owner-123','other-user','email','plate'])assert.ok(!publicJson.includes(secret));
 });
 console.log(checks+' pruebas de acceso al perfil verificadas.');
}finally{delete globalThis.profileTest;fs.rmSync(dir,{recursive:true,force:true});}
