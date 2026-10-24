import fs from 'node:fs/promises'
import crypto from 'node:crypto'

const directory='docs/evidence/visual-revision/final'
const hash=async file=>{
  const bytes=await fs.readFile(file)
  return {file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}
}
const names=(await fs.readdir('public/models')).filter(name=>name.endsWith('.glb')).sort()
const assets=await Promise.all(names.map(name=>hash('public/models/'+name)))
for(const asset of assets){
  const deployed=await hash(asset.file.replace('public/','dist/'))
  if(asset.sha256!==deployed.sha256)throw new Error('Preview asset differs: '+asset.file)
}
const bundles=await Promise.all((await fs.readdir('dist/assets')).filter(name=>/\.(js|css)$/.test(name)).map(name=>hash('dist/assets/'+name)))
const receipts=await Promise.all(['build-final.log','unit-tests-final.log','e2e-final.log','asset-validation-final.log','gallery-final.log','category-motion-final.log','benchmark-final.log'].map(name=>hash('docs/evidence/visual-revision/'+name)))
const screenshots=await Promise.all((await fs.readdir(directory)).filter(name=>/\.(png|webm)$/.test(name)).map(name=>hash(directory+'/'+name)))
const validation=JSON.parse(await fs.readFile('docs/asset-validation.json','utf8'))
await fs.writeFile(directory+'/build-manifest.json',JSON.stringify({observedAt:new Date().toISOString(),
  preview:'http://127.0.0.1:4173/',assetsMatchDist:true,assets,bundles,receipts,screenshots,
  gltfValidation:{files:validation.length,errors:validation.reduce((n,r)=>n+r.errors,0),warnings:validation.reduce((n,r)=>n+r.warnings,0)},
  artisticAcceptance:'pending',mobile:'Browser emulation on desktop GPU; no physical phone verified'},null,2))
console.log('Manifest saved; all public GLB hashes match the served build.')
