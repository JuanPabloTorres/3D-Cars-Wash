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
  .replace(/from ['"][^'"]*\/profile-repository['"]/g,'from "./repository.js"')
  .replace(/from ['"][^'"]*\/http['"]/g,'from "./http.js"');
 fs.writeFileSync(new URL(name+'.js',dir),code);
};
for(const [path,name]of [['lib/domain.ts','domain'],['lib/appearance.ts','appearance'],['lib/server/http.ts','http'],['lib/server/profile-repository.ts','repository'],['app/api/profile/route.ts','route']])compile(path,name);
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
 console.log(checks+' pruebas de acceso al perfil verificadas.');
}finally{delete globalThis.profileTest;fs.rmSync(dir,{recursive:true,force:true});}
