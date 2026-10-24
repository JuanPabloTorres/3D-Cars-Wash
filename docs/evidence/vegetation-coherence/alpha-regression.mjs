import fs from 'node:fs/promises'
import sharp from 'sharp'

// Regression uses the real official source mask, not a mocked image.
const base = 'C:/Projects/Assets/CarWash-Entrance-Urban-20261023/tree_small_02/textures/'
const diffuse = base + 'tree_small_02_leaves_diff_1k.jpg'
const mask = base + 'tree_small_02_official-alpha_1k.png'
const alpha = await sharp(mask).removeAlpha().extractChannel(0).raw({ depth: 'uchar' }).toBuffer()
const previous = await sharp(diffuse).removeAlpha().joinChannel(alpha, { raw: { width: 1024, height: 1024, channels: 1 } }).png().toBuffer()
const rgb = await sharp(diffuse).removeAlpha().raw({ depth: 'uchar' }).toBuffer()
const corrected = await sharp(rgb, { raw: { width: 1024, height: 1024, channels: 3 } }).joinChannel(alpha, { raw: { width: 1024, height: 1024, channels: 1 } }).webp({ quality: 90 }).toBuffer()
const oldMetadata = await sharp(previous).metadata()
const correctedMetadata = await sharp(corrected).metadata()
let transparent = 0
for (const value of await sharp(corrected).extractChannel(3).raw().toBuffer()) if (value < 128) transparent++
const result = { observedAt: new Date().toISOString(), diffuse, mask, previous: { channels: oldMetadata.channels, hasAlpha: oldMetadata.hasAlpha }, correctedWebP: { channels: correctedMetadata.channels, hasAlpha: correctedMetadata.hasAlpha, transparentPixels: transparent }, assertions: { previousFailureReproduced: !oldMetadata.hasAlpha, alphaSurvivesWebP: correctedMetadata.hasAlpha && transparent > 0 && transparent < 1024 * 1024 } }
if (!Object.values(result.assertions).every(Boolean)) throw new Error(JSON.stringify(result))
await fs.writeFile('docs/evidence/vegetation-coherence/alpha-regression.json', JSON.stringify(result, null, 2), { flag: 'wx' })
console.log(JSON.stringify(result, null, 2))
