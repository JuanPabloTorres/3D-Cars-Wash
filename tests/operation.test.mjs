import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import * as T from 'three';
import {installDocument} from './dom-fixture.mjs';
installDocument();
const dir=new URL('../.operation-test/',import.meta.url);fs.mkdirSync(dir,{recursive:true});
const files=['lib/operation-view.ts','lib/appearance.ts','lib/domain.ts','lib/world/primitives.ts','lib/world/entities.ts','lib/world/operation-fleet.ts','app/api/local/route.ts'];
for(const file of files){
 let code=ts.transpileModule(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 code=code.replace(/import \{ env \} from ['"]cloudflare:workers['"];?/g,'const env=globalThis.opTest.env;').replace(/import \{ getChatGPTUser \} from [^;]+;/g,'const getChatGPTUser=async()=>globalThis.opTest.user;').replace(/import \{ json, failure \} from [^;]+;/g,'const json=(body)=>Response.json(body);const failure=(error)=>Response.json({error:error.message},{status:500});');
 code=code.replace(/from ['"](?:\.\.\/|\.\/)+(?:lib\/)?(operation-view|appearance|domain|entities|primitives)['"]/g,'from "./$1.js"');
 fs.writeFileSync(new URL(file.split('/').at(-1).replace('.ts','.js'),dir),code);
}
try{
 const {visitSpace,activityMode,visualKey}=await import(new URL('operation-view.js',dir));
 const {OperationFleet}=await import(new URL('operation-fleet.js',dir));
 const visit=(key,status='waiting',bay=null)=>({key,status,bay,kind:'SUV',color:'Plata',mine:false,task:'Lavado exterior',services:['Exterior']});
 const snap=visits=>({visits,bays:[],observedAt:Date.now()});
 let checks=0;const test=async(name,fn)=>{await fn();checks++;console.log('PASS',name);};
 await test('Espera y entrega usan plazas distintas y el exceso no apila carros',()=>{
  const s=snap([visit('a'),visit('b'),visit('c'),visit('overflow'),visit('r','ready')]);
  const positions=s.visits.map(v=>visitSpace(v,s));assert.equal(positions[3],null);assert.equal(new Set(positions.filter(Boolean).map(p=>p.x+','+p.z)).size,4);
 });
 await test('El cubículo real decide la ubicación, sin cubículo fijo',()=>{const a=visit('a','working',1);assert.deepEqual(visitSpace(a,snap([a])),{x:-12,z:-6});});
 await test('El agua solo corresponde al lavado y no a todos los servicios',()=>{assert.equal(activityMode('Lavado exterior'),'wash');assert.equal(activityMode('Aspirado de interior'),'interior');assert.equal(activityMode('Pulido y brillo'),'polish');assert.equal(activityMode(null),'inspect');});
 await test('Actualizar datos conserva actores y excluye solamente la orden propia activa',()=>{
  const fleet=new OperationFleet(new T.Scene());const s=snap([visit('own'),{...visit('other-own'),mine:true},visit('public')]);
  fleet.sync(s,'own');assert.equal(fleet.actors.size,2);const actor=fleet.inspect('public');fleet.sync(s,'own');assert.equal(fleet.inspect('public'),actor);fleet.dispose();
 });
 await test('Dos cambios confirmados se animan en secuencia y sin saltos de posición',()=>{
  const fleet=new OperationFleet(new T.Scene());fleet.sync(snap([visit('a'),visit('b')]));fleet.sync(snap([visit('a','working',1),visit('b','ready')]));
  let old=[...fleet.actors.values()].map(a=>a.car.group.position.clone());
  for(let i=0;i<3000;i++){fleet.update(1/60);const actors=[...fleet.actors.values()];assert.ok(actors.filter(a=>a.car.route.length).length<=1);actors.forEach((a,j)=>{assert.ok(a.car.group.position.distanceTo(old[j])<=a.car.speed/60+0.001);old[j].copy(a.car.group.position);});}
  assert.equal(fleet.inspect('a').car.route.length,0);assert.ok(fleet.inspect('a').car.group.position.distanceTo(new T.Vector3(-12,0.1,-6))<0.13);fleet.dispose();
 });
 await test('La proyección HTTP no devuelve identificadores, clientes ni tablillas',async()=>{
  globalThis.opTest={user:{userId:'u'},env:{DB:{prepare:()=>({all:async()=>({results:[{id:'private-order',owner_id:'u',status:'working',bay:2,kind:'SUV',color:'Plata',task:'Lavado exterior',services:'["Lavado completo"]'}]})})}}};
  const {GET}=await import(new URL('route.js',dir));const r=await GET();assert.equal(r.status,200);const data=await r.json();const text=JSON.stringify(data);assert.ok(!text.includes('private-order'));assert.ok(!text.includes('owner_id'));assert.ok(!text.includes('plate'));assert.equal(data.visits[0].mine,true);assert.equal(data.visits[0].key,await visualKey('private-order'));assert.equal(data.bays[0].bay,2);
 });
 console.log(checks+' pruebas de operación reflejada verificadas.');
}finally{delete globalThis.opTest;fs.rmSync(dir,{recursive:true,force:true});}
