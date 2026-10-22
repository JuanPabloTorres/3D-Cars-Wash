import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
// Geometry construction uses Canvas only for signs; no renderer or browser needed.
globalThis.document={createElement:()=>({width:1024,height:512,getContext:()=>({fillStyle:'',font:'',textAlign:'',textBaseline:'',lineWidth:0,strokeStyle:'',fillRect(){},fillText(){},strokeRect(){}})})};
const output=new URL('../.world-test/',import.meta.url);fs.mkdirSync(output,{recursive:true});
for(const name of ['primitives','entities','environment']){const file=new URL('../lib/world/'+name+'.ts',import.meta.url);let code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;code=code.replaceAll("'./primitives'","'./primitives.js'");fs.writeFileSync(new URL(name+'.js',output),code);}
try{
 const T=await import('three');const {Car,Person,WaterEffect}=await import(new URL('entities.js',output));const {buildEnvironment}=await import(new URL('environment.js',output));let checks=0;
 function test(name,fn){fn();checks++;console.log('PASS',name);}
 test('Carro recorre entrada, cubículo y salida sin teletransporte',()=>{const car=new Car(-17,25);car.route=[new T.Vector3(-17,.1,2),new T.Vector3(6,.1,2),new T.Vector3(6,.1,-6)];let prev=car.group.position.clone();for(let i=0;i<1800;i++){car.update(1/60);assert.ok(car.group.position.distanceTo(prev)<=car.speed/60+.001);prev.copy(car.group.position);}assert.equal(car.route.length,0);assert.ok(car.group.position.distanceTo(new T.Vector3(6,.1,-6))<.13);});
 test('Avatar camina hasta recepción sin oscilación final',()=>{const actor=new Person(0,18);actor.target.set(8,.08,13.3);for(let i=0;i<600;i++)actor.update(i/60,1/60);assert.ok(actor.group.position.clone().setY(.08).distanceTo(actor.target)<.07);});
 test('La puerta responde a tarea interior y vuelve a cerrarse',()=>{const car=new Car(0,0);car.setDoorOpen(true);for(let i=0;i<120;i++)car.update(1/60);assert.ok(car.door.rotation.y< -1);car.setDoorOpen(false);for(let i=0;i<120;i++)car.update(1/60);assert.ok(Math.abs(car.door.rotation.y)<.01);});
 test('Las partículas de agua cambian durante la simulación',()=>{const water=new WaterEffect(0,0);water.update(0);const before=water.points.geometry.attributes.position.array.slice();water.update(.2);assert.notDeepEqual(water.points.geometry.attributes.position.array,before);});
 test('Cambiar tipo y color afecta el vehículo del cliente',()=>{const car=new Car(0,0);car.setKind('Sedán');assert.equal(car.kind,'Sedán');car.paint.color.set('#aa2222');assert.equal(car.paint.color.getHexString(),'aa2222');assert.equal(car.wheels.length,4);});
 test('El local completo tiene geometría finita y objetos seleccionables',()=>{const scene=new T.Scene();const env=buildEnvironment(scene,true);assert.equal(env.serviceObjects.length,3);assert.ok(env.palms.length>=10);let count=0;scene.traverse(o=>{if(o instanceof T.Mesh){count++;const p=o.geometry.getAttribute('position');for(let i=0;i<p.array.length;i++)assert.ok(Number.isFinite(p.array[i]));}});assert.ok(count>50);console.log('Meshes del entorno:',count);env.reflector.getRenderTarget().dispose();});
 console.log(checks+' pruebas de mundo 3D verificadas.');
}finally{fs.rmSync(output,{recursive:true,force:true});}
