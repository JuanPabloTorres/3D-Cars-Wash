import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { resample,dedup,prune } from '@gltf-transform/functions'
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS)
for(const name of process.argv.slice(2)){
 const d=await io.read(`public/models/${name}.glb`);await d.transform(resample(),dedup(),prune());await io.write(`public/models/${name}.glb`,d)
 console.log(name,d.getRoot().listAnimations().map(a=>a.getName()))
}
