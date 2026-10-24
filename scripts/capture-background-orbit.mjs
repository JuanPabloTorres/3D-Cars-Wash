import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import sharp from 'sharp'

// Exercise the real OrbitControls with pointer drags, including all four joins.
const output = 'docs/evidence/background-box/orbit'
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []
try {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } })
    const errors = [], failed = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('response', response => { if (!response.ok()) failed.push(response.url()) })
    await page.goto('http://127.0.0.1:4173/?layer=landscape')
    await page.locator('[data-ground-ready=true]').waitFor({ timeout: 120000 })
    await page.waitForTimeout(1800)
    const canvas = await page.locator('canvas').boundingBox()
    assert.ok(canvas)
    const step = canvas.height / 8 // OrbitControls: 2π × horizontal delta / height.
    const captures = []
    for (let direction = 0; direction <= 8; direction++) {
      const path = `${output}/${width}-${direction * 45}.png`
      await page.screenshot({ path })
      captures.push(path)
      if (direction === 8) break
      const x = canvas.x + canvas.width * .76, y = canvas.y + canvas.height * .36
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x - step, y, { steps: 12 })
      await page.mouse.up()
      await page.waitForTimeout(900)
    }
    const first = await sharp(captures[0]).raw().toBuffer()
    const opposite = await sharp(captures[4]).raw().toBuffer()
    const last = await sharp(captures[8]).raw().toBuffer()
    const difference = (a, b) => a.reduce((sum, value, index) => sum + Math.abs(value - b[index]), 0) / a.length
    const fullTurnDifference = difference(first, last)
    const oppositeDifference = difference(first, opposite)
    assert.ok(oppositeDifference > 5, 'camera must show a different direction')
    assert.ok(fullTurnDifference < 2, `full orbit returns to the initial view: ${fullTurnDifference}`)
    assert.deepEqual(errors, [])
    assert.deepEqual(failed, [])
    results.push({ width, height, errors, failed, fullTurnDifference, oppositeDifference, captures })
    await page.close()
  }
  await fs.writeFile(`${output}/result.json`, JSON.stringify({ passed: true, results }, null, 2))
  console.log('Full 360-degree pointer orbit passed at both viewports; screenshots retain corner evidence.')
} finally {
  await browser.close()
}
