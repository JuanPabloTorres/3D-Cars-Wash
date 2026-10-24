import { test,expect } from '@playwright/test'
import { enter,navigate,snapshot,watchErrors } from './helpers'
import fs from 'node:fs/promises'
test('B: textured landscape, vehicle, semantic typography and clear viewing rays',async({page})=>{
 const log=watchErrors(page),dir='docs/evidence/refinement/b';await fs.mkdir(dir,{recursive:true});await enter(page)
 await page.screenshot({path:`${dir}/entrance.png`})
 expect(await page.locator('body').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Manrope')
 await navigate(page,'Recepción');await page.screenshot({path:`${dir}/reception.png`})
 await navigate(page,'Ver la bahía');await page.getByRole('button',{name:'Reiniciar DEMO'}).click();await page.getByRole('button',{name:'Pausar DEMO'}).click()
 await expect.poll(async()=>(await snapshot(page)).sightLines.service).toBe(true)
 await expect.poll(async()=>(await snapshot(page)).sightLines.worker).toBe(true)
 await page.screenshot({path:`${dir}/bay.png`})
 const s=await snapshot(page);await fs.writeFile(`${dir}/metrics.json`,JSON.stringify({renderer:s.renderer,triangles:s.triangles,calls:s.drawCalls,frames:s.frames.slice(-240)},null,2))
 expect(s.contextLost).toBe(false);expect(log.errors).toEqual([]);expect(log.failed).toEqual([])
})
