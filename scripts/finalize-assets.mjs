import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, resample, textureCompress, simplify, weld, flatten, join } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import { Color } from 'three'
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS)
for(const id of ['palm','shrub','plant']){
 const doc=await io.read(`public/models/${id}.glb`)
 for(const mat of doc.getRoot().listMaterials()){
   const color=new Color(/wood/i.test(mat.getName())?'#6b4d31':id==='palm'?'#4d8e36':id==='shrub'?'#3b7629':'#6fa338')
   mat.setBaseColorFactor([...color.toArray(),1]).setRoughnessFactor(.8)
 }
 await io.write(`public/models/${id}.glb`,doc)
}
const car=await io.read('C:/Projects/Assets/Febles-G1-20261023/car-concept.glb')
const materials=car.getRoot().listMaterials()
for(const mesh of car.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
 const mat=p.getMaterial();if(!mat)continue
 const pearl=materials.find(m=>m.getName()===mat.getName().replace('Carmine','Pearl'))
 if(pearl)p.setMaterial(pearl)
}
// The plate is a separate licensed mesh; omit sample branding from this adaptation.
for(const n of car.getRoot().listNodes())if(n.getName()==='License Plate')n.dispose()
for(const ext of car.getRoot().listExtensionsUsed()){
 if(['KHR_materials_variants','KHR_materials_iridescence','KHR_materials_transmission','KHR_materials_clearcoat'].includes(ext.extensionName))ext.dispose()
}
await MeshoptSimplifier.ready
await car.transform(prune(),dedup(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:.3,error:.001}),flatten(),join(),textureCompress({encoder:sharp,targetFormat:'jpeg',resize:[1024,1024],quality:88}))
await io.write('public/models/vehicle.glb',car)
for(const id of ['receptionist','worker']){
 const doc=await io.read(`public/models/${id}.glb`)
 await doc.transform(resample(),dedup(),prune())
 await io.write(`public/models/${id}.glb`,doc)
 console.log('CLIPS',id,doc.getRoot().listAnimations().map(a=>a.getName()))
}
