import {NodeIO} from '@gltf-transform/core'
import {ALL_EXTENSIONS} from '@gltf-transform/extensions'
import {resample,dedup,prune} from '@gltf-transform/functions'
import fs from 'node:fs/promises'
import validator from 'gltf-validator'
const directory='C:/Projects/Assets/Febles-SOW-20261023'
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS)
await fs.copyFile('public/models/receptionist.glb',directory+'/receptionist-before-pointing.glb')
const document=await io.read(directory+'/receptionist-candidate.glb')
const before=document.getRoot().listAnimations().map(a=>({name:a.getName(),channels:a.listChannels().length}))
await document.transform(resample(),dedup(),prune())
const bytes=await io.writeBinary(document),validation=await validator.validateBytes(bytes,{maxIssues:100})
if(validation.issues.numErrors)throw new Error('Receptionist GLB validation failed')
await fs.writeFile('public/models/receptionist.glb',bytes)
const report={source:directory+'/receptionist-candidate.glb',author:'Blender Studio / Blender Foundation; project animation adaptation',license:'CC BY 4.0',price:0,blender:'5.2.1 LTS --disable-autoexec',bytes:bytes.length,before,after:document.getRoot().listAnimations().map(a=>({name:a.getName(),channels:a.listChannels().length})),validation:validation.issues}
await fs.writeFile('docs/evidence/sow-closure/receptionist-animation-export.json',JSON.stringify(report,null,2));console.log({bytes:report.bytes,clips:report.after.map(a=>a.name),errors:validation.issues.numErrors})
