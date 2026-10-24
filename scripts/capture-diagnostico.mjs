import {chromium} from '@playwright/test'
import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'

const phase=process.argv[2]||'after'
if(!/^[a-z0-9-]+$/.test(phase))throw new Error('Expected a safe capture phase')
const output=`docs/evidence/diagnostico-ux-20261023/${phase}`
await fs.mkdir(output,{recursive:true})
async function fingerprint(){
 const walk=async directory=>(await Promise.all((await fs.readdir(directory,{withFileTypes:true})).map(entry=>entry.isDirectory()?walk(`${directory}/${entry.name}`):`${directory}/${entry.name}`))).flat()
 const files=['dist/index.html',...(await walk('dist/assets')).filter(name=>/\.(js|css)$/.test(name)),...await walk('dist/models'),...await walk('dist/textures')]
 return Object.fromEntries(await Promise.all(files.map(async file=>[file,createHash('sha256').update(await fs.readFile(file)).digest('hex')])) )
}
const before=await fingerprint()
const browser=await chromium.launch({channel:'msedge',headless:true})
const observations=[],http=[]
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900}})
  const page=await context.newPage(),errors=[],warnings=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.on('console',message=>{if(message.type()==='warning')warnings.push(message.text())})
  const response=await page.goto('http://127.0.0.1:4173/'),html=await response.text()
  if(html.includes('/@vite/client'))throw new Error('Expected compiled preview; development server detected')
  const entry=html.match(/src="([^"]+\.js)"/)?.[1]
  if(!entry||!before[`dist${entry}`])throw new Error('Preview entry is not in this build')
  const served=await page.request.get(`http://127.0.0.1:4173${entry}`)
  if(createHash('sha256').update(await served.body()).digest('hex')!==before[`dist${entry}`])throw new Error('Served entry differs from build')
  http.push({width,entry,verified:true})
  await page.locator('[data-ready=true]').waitFor({timeout:60000})
  const capture=async(view)=>{
   await page.waitForFunction(()=>!(window.__FEBLES__.snapshot()).destination)
   await page.screenshot({path:`${output}/${width}-${view}.png`,animations:'disabled'})
   if(width===1440&&view==='entry'){
    await page.screenshot({path:`${output}/1440-planter-detail.png`,clip:{x:950,y:450,width:450,height:400},animations:'disabled'})
    await page.screenshot({path:`${output}/1440-tree-detail.png`,clip:{x:200,y:80,width:600,height:420},animations:'disabled'})
   }
   const snapshot=await page.evaluate(()=>window.__FEBLES__.snapshot())
   const frames=snapshot.frames.slice(-120).sort((a,b)=>a-b)
   observations.push({width,view,position:snapshot.position,weather:snapshot.weather,vehicles:snapshot.world.vehicles.length,animation:snapshot.animations.receptionist,renderer:snapshot.renderer,drawCalls:snapshot.drawCalls,triangles:snapshot.triangles,frameMsP95:frames[Math.floor((frames.length-1)*.95)],errors:[...errors],warnings:[...new Set(warnings)]})
  }
  await capture('entry')
  await page.getByRole('button',{name:'Ir a recepción',exact:true}).click()
  await page.getByRole('dialog').waitFor()
  await capture('reception')
  await page.keyboard.press('Escape')
  await capture('counter')
  await page.getByRole('button',{name:'Abrir Servicios del mostrador',exact:true}).click()
  await capture('catalog')
  const local=async()=>{
   await page.getByRole('button',{name:'Visitar',exact:true}).click()
   await page.getByRole('navigation').getByRole('button',{name:/El local/}).click()
  }
  await local()
  await page.getByRole('button',{name:'Lounge · Sala de espera',exact:true}).click()
  await page.getByRole('dialog',{name:'Lounge · Sala de espera'}).waitFor()
  await capture('lounge')
  await page.keyboard.press('Escape')
  await capture('lounge-closed')
  await local()
  await page.getByRole('button',{name:'Fila de espera',exact:true}).click()
  await page.getByRole('dialog',{name:'Fila de espera'}).waitFor()
  await capture('queue')
  await context.close()
 }
 const after=await fingerprint(),resourcesStable=JSON.stringify(before)===JSON.stringify(after)
 await fs.writeFile(`${output}/observations.json`,JSON.stringify({phase,resourcesStable,before,after,http,comparison:'Same viewport, empty isolated session and default weather. Three.js gestures continue; captures are not exact animation-phase comparisons. Frame timings are observations on this renderer, not a hardware-independent performance guarantee.',observations},null,2))
 if(!resourcesStable||observations.some(item=>item.errors.length))throw new Error('Capture has changing resources or page errors; inspect observations')
}finally{await browser.close()}
console.log(`Captured ${observations.length} views in ${output}`)
