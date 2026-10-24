import { test,expect } from '@playwright/test'
import { capture,enter,navigate,saveMetrics,snapshot,watchErrors } from './helpers'
test('mobile: touch joystick, look, guided walk, dialogue and bay at 390×844',async({page})=>{
 const log=watchErrors(page);await enter(page);await capture(page,'mobile-entry')
 const pad=page.getByTestId('joystick');await expect(pad).toBeVisible()
 const rect=(await pad.boundingBox())!,p0=(await snapshot(page)).position
 // Native browser touch events, including real pointer capture, in mobile emulation.
 const touch=await page.context().newCDPSession(page)
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+56,y:rect.y+56}]})
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rect.x+56,y:rect.y+21}]})
 await expect.poll(async()=>(await snapshot(page)).position[1]).toBeLessThan(p0[1]-.25)
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
 const yaw=(await snapshot(page)).yaw
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:290,y:350}]})
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:340,y:350}]})
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
 await expect.poll(async()=>(await snapshot(page)).yaw).not.toBe(yaw)
 await navigate(page,'Recepción');await expect(page.getByRole('button',{name:'Hablar E',exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Hablar E',exact:true}).tap();await page.getByRole('button',{name:'Conocer los servicios'}).tap();await capture(page,'mobile-dialogue')
 const dialog=(await page.getByRole('dialog').boundingBox())!;expect(dialog.x).toBeGreaterThanOrEqual(0);expect(dialog.x+dialog.width).toBeLessThanOrEqual(390);expect(dialog.y+dialog.height).toBeLessThanOrEqual(844)
 await page.getByRole('button',{name:'Lavado exterior',exact:true}).tap();await expect(page.getByRole('heading',{name:'Lavado exterior'})).toBeVisible();await page.getByRole('button',{name:'Caminar al mirador'}).tap()
 await page.waitForFunction(()=>!(window.__FEBLES__.snapshot() as any).destination,{},{timeout:30000})
 await expect.poll(async()=>(await snapshot(page)).interaction).toBe('viewing');await page.getByRole('button',{name:'Reiniciar DEMO'}).tap();await capture(page,'mobile-bay')
 expect((await snapshot(page)).world.bays).toHaveLength(5)
 await page.getByRole('button',{name:'Mi orden y servicios'}).tap();await expect(page.getByRole('dialog',{name:'Mi orden DEMO'})).toBeVisible();await capture(page,'mobile-own-order');const order=(await page.getByRole('dialog',{name:'Mi orden DEMO'}).boundingBox())!;expect(order.x+order.width).toBeLessThanOrEqual(390);expect(order.y+order.height).toBeLessThanOrEqual(844);await page.getByRole('button',{name:'Cerrar mi orden'}).tap();await saveMetrics(page,'mobile-metrics');expect(log.failed).toEqual([]);expect(log.errors).toEqual([])
})

