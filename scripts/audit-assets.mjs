import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import fs from 'node:fs/promises'
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),results=[]
for(const id of ['palm','shrub','plant','vehicle','hose','cart','receptionist','worker']){
 const file=`public/models/${id}.glb`,d=await io.read(file),r=d.getRoot()
 const info={id,bytes:(await fs.stat(file)).size,meshes:r.listMeshes().length,materials:r.listMaterials().map(m=>({name:m.getName(),base:m.getBaseColorFactor(),texture:!!m.getBaseColorTexture()})),textures:r.listTextures().map(t=>({size:t.getSize(),bytes:t.getImage()?.byteLength})),skins:r.listSkins().map(s=>s.listJoints().length),animations:r.listAnimations().map(a=>({name:a.getName(),channels:a.listChannels().length}))}
 results.push(info)
 console.log(id,JSON.stringify({bytes:info.bytes,materials:info.materials,skins:info.skins,animations:info.animations}))
}
await fs.mkdir('docs',{recursive:true});await fs.writeFile('docs/asset-inspection.json',JSON.stringify(results,null,2))
