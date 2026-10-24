import { describe, expect, it } from 'vitest'
import { getBounds, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { Box3, Matrix4, Vector3 } from 'three'
import sharp from 'sharp'
import { accents, groundCover, landscapeAssets, landscapeBeds, landscapeLights, landscapePoles, palms, shrubs, trees } from '../../src/world/layers/landscapePlan'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const sets = { tree: trees, palm: palms, shrub: shrubs, accent: accents, fern: groundCover }

describe('new botanical assets in layer 02', () => {
  it('anchors all lights inside retained beds, with inward pole heads and clear tree trunks', () => {
    const anchors = [...landscapeLights, ...landscapePoles.map(pole => pole.position)]
    for (const [x, y, z] of anchors) {
      const bed = landscapeBeds.find(([, b]) => Math.abs(x - b.x) + .24 < b.width / 2 && Math.abs(z - b.z) + .24 < b.depth / 2)?.[1]
      expect(bed, `light base supported by soil at ${x},${z}`).toBeDefined()
      expect(y).toBeCloseTo(bed!.height - .045)
      expect(trees.every(([tx, , tz]) => Math.hypot(x - tx, z - tz) > 1)).toBe(true)
    }
    for (const pole of landscapePoles) {
      const [x, , z] = pole.position
      const headX = x + Math.sin(pole.yaw) * 1.44
      expect(headX).toBeGreaterThan(-23)
      expect(headX).toBeLessThan(59)
      expect(z).toBeGreaterThan(-29)
      expect(z).toBeLessThan(40)
      expect(Math.abs(headX - 18)).toBeLessThan(Math.abs(x - 18))
    }
  })

  it('exports green leaf textures, bark relief and nonmetallic surfaces', async () => {
    for (const asset of Object.values(landscapeAssets)) {
      expect(asset.url.startsWith('/models/layer02/')).toBe(true)
      const doc = await io.read(`public${asset.url}`)
      for (const mat of doc.getRoot().listMaterials()) {
        expect(mat.getMetallicFactor()).toBe(0)
        if (!mat.getName().startsWith('leaf-') && !mat.getName().includes('bark')) continue
        expect(mat.getNormalTexture(), mat.getName()).not.toBeNull()
        const texture = mat.getBaseColorTexture()!
        expect(texture).not.toBeNull()
        if (!mat.getName().startsWith('leaf-')) continue
        const stats = await sharp(texture.getImage()!).stats()
        const [r, g, b] = stats.channels.map(c => c.mean)
        expect(g, `${asset.url}/${mat.getName()} green survives export`).toBeGreaterThan(r * 1.12)
        expect(g).toBeGreaterThan(b * 1.3)
        expect(g).toBeGreaterThan(35)
        expect(mat.getRoughnessFactor()).toBeGreaterThan(.65)
      }
    }
  })

  it('keeps actual roots and low foliage on retained soil, clear of paving', async () => {
    for (const [kind, asset] of Object.entries(landscapeAssets)) {
      const doc = await io.read(`public${asset.url}`)
      const bounds = getBounds(doc.getRoot().listScenes()[0])
      const normalScale = asset.height / (bounds.max[1] - bounds.min[1])
      const vertices: Vector3[] = []
      for (const node of doc.getRoot().listNodes()) {
        const matrix = new Matrix4().fromArray(node.getWorldMatrix())
        for (const primitive of node.getMesh()?.listPrimitives() || []) {
          const positions = primitive.getAttribute('POSITION')!
          for (let i = 0; i < positions.getCount(); i++) {
            vertices.push(new Vector3().fromArray(positions.getElement(i, [])).applyMatrix4(matrix))
          }
        }
      }
      const base = vertices.filter(v => (v.y - bounds.min[1]) * normalScale <= .025)
      const root = new Box3().setFromPoints(base).getCenter(new Vector3())
      root.y = bounds.min[1]
      const checked = (kind === 'tree' || kind === 'palm' ? base : vertices).map(v => v.clone().sub(root).multiplyScalar(normalScale))
      for (const [x, y, z, yaw, scale] of sets[kind as keyof typeof sets]) {
        const bed = landscapeBeds.find(([, b]) => Math.abs(x-b.x) < b.width/2 && Math.abs(z-b.z) < b.depth/2)?.[1]
        expect(bed, `${kind} rooted in a retained bed`).toBeDefined()
        expect(y).toBeCloseTo(bed!.height - .045)
        const outside = checked.find(v => {
          const px = x + (v.x*Math.cos(yaw)+v.z*Math.sin(yaw))*scale
          const pz = z + (-v.x*Math.sin(yaw)+v.z*Math.cos(yaw))*scale
          return Math.abs(px-bed!.x) > bed!.width/2-.14 || Math.abs(pz-bed!.z) > bed!.depth/2-.14
        })
        expect(outside, `${kind} foliage stays inside soil at ${x},${z}`).toBeUndefined()
      }
    }
  })
})
