import {test,expect} from '@playwright/test'
import {enter,navigate,snapshot,watchErrors} from './helpers'
import fs from 'node:fs/promises'
test('C: own vehicle walk, priced order, progress and cancel preserve continuous scene',async({page})=>{
 const log=watchErrors(page),dir='docs/evidence/refinement/c';await fs.mkdir(dir,{recursive:true});await enter(page)
 await navigate(page,'Recepción');await page.keyboard.press('KeyE');await page.getByRole('button',{name:'Consultar mi vehículo'}).click();await page.getByRole('button',{name:'Ver mi auto',exact:true}).click()
 const start=(await snapshot(page)).position
 await expect.poll(async()=>(await snapshot(page)).walking).toBe(true)
 await expect(page.getByRole('dialog',{name:'Mi orden DEMO'})).toBeVisible({timeout:30000})
 await expect(page.getByText('Tu auto · DEMO',{exact:true})).toBeVisible()
 const end=(await snapshot(page)).position;expect(Math.hypot(end[0]-start[0],end[1]-start[1])).toBeGreaterThan(3)
 await expect(page.getByText('$66.90',{exact:true})).toBeVisible();await expect(page.getByText('Promedio histórico: no disponible')).toBeVisible();await expect(page.getByText('Representación ilustrativa · Sin seguimiento real')).toBeVisible()
 await page.screenshot({path:`${dir}/own-order.png`});expect(await page.locator('canvas').count()).toBe(1)
 await page.getByRole('button',{name:'Cerrar mi orden'}).click()
 await expect(page.getByRole('button',{name:'Mi orden y servicios'})).toBeVisible()
 await page.getByRole('button',{name:'Mi orden y servicios'}).click();await expect(page.getByRole('dialog',{name:'Mi orden DEMO'})).toBeVisible();await page.keyboard.press('Escape')
 await navigate(page,'Recepción');await page.getByRole('button',{name:'Destinos',exact:true}).click();await page.getByRole('button',{name:'Ver mi auto',exact:true}).click()
 await page.keyboard.down('KeyW');await expect.poll(async()=>(await snapshot(page)).destination).toBeNull();await page.keyboard.up('KeyW');await expect(page.getByRole('dialog',{name:'Mi orden DEMO'})).toHaveCount(0)
 expect(log.errors).toEqual([]);expect(log.failed).toEqual([])
})
