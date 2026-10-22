import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import * as T from 'three';
const dir=new URL('../.fleet-test/',import.meta.url);fs.mkdirSync(dir,{recursive:true});
for(const [source,name] of [['lib/world/operation-fleet.ts','operation-fleet'],['lib/world/entities.ts','entities'],['lib/world/primitives.ts','primitives'],['lib/operation-view.ts','operation-view'],['lib/appearance.ts','appearance']]){
 let code=ts.transpileModule(fs.readFileSync(new URL('../'+source,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 code=code.replace(/from ["'](?:\.\.\/|\.\/)(appearance|operation-view|entities|primitives)["']/g,'from "./$1.js"');
 fs.writeFileSync(new URL(name+'.js',dir),code);
}
try{
 const {OperationFleet}=await import(new URL('operation-fleet.js',dir));
 const {visitSpace}=await import(new URL('operation-view.js',dir));
 const scene=new T.Scene(),fleet=new OperationFleet(scene);
 const visit=(key,status='waiting',extra={})=>({key,mine:false,status,kind:'SUV',color:'Plata',bay:null,task:'Lavado exterior',services:['Lavado completo'],...extra});
 const snapshot=visits=>({visits,bays:[],observedAt:1});
 let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS',name);};
 test('Un local vacío no inventa vehículos ni ocupación',()=>{fleet.sync(snapshot([]));assert.equal(fleet.actors.size,0);});
 test('La visita propia se representa una sola vez',()=>{fleet.sync(snapshot([visit('mine','working',{mine:true,bay:4})]));assert.equal(fleet.actors.size,0);});
 test('Los espacios tienen capacidad y no apilan vehículos adicionales',()=>{const visits=Array.from({length:7},(_,i)=>visit('q'+i));const s=snapshot(visits);const slots=visits.map(v=>visitSpace(v,s));assert.equal(slots.filter(Boolean).length,4);assert.equal(new Set(slots.filter(Boolean).map(p=>p.x+':'+p.z)).size,4);});
 test('Las nuevas llegadas reciben una ruta automática por la entrada',()=>{fleet.sync(snapshot([visit('a')]));assert.equal(fleet.actors.get('a').car.group.position.z,27);fleet.update(1/60);assert.ok(fleet.actors.get('a').car.route.length);});
 test('Las animaciones no cambian estados comerciales ni teletransportan el carro',()=>{const s=snapshot([visit('a')]),before=JSON.stringify(s);fleet.sync(s);const actor=fleet.actors.get('a');let previous=actor.car.group.position.clone();for(let i=0;i<2500;i++){fleet.update(1/60);assert.ok(actor.car.group.position.distanceTo(previous)<=actor.car.speed/60+0.001);previous.copy(actor.car.group.position);}assert.ok(actor.car.group.position.distanceTo(new T.Vector3(-3,0.1,7))<0.13);assert.equal(JSON.stringify(s),before);});
 test('Cambiar a servicio conserva actor y modelo y lo dirige al cubículo confirmado',()=>{const car=fleet.actors.get('a').car;fleet.sync(snapshot([visit('a','working',{bay:2})]));assert.equal(fleet.actors.get('a').car,car);for(let i=0;i<2000;i++)fleet.update(1/60);assert.ok(car.group.position.distanceTo(new T.Vector3(-6,0.1,-6))<0.13);});
 test('Solo un vehículo utiliza el corredor compartido a la vez',()=>{fleet.sync(snapshot([visit('a','working',{bay:2}),visit('b'),visit('c')]));for(let i=0;i<3000;i++){fleet.update(1/60);assert.ok([...fleet.actors.values()].filter(a=>a.car.route.length).length<=1);}});
 test('La salida termina antes de retirar el vehículo del mapa',()=>{fleet.sync(snapshot([]));assert.ok(fleet.actors.size>0);for(let i=0;i<9000;i++)fleet.update(1/60);assert.equal(fleet.actors.size,0);});
 fleet.dispose();console.log(checks+' pruebas de operación virtual verificadas.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
