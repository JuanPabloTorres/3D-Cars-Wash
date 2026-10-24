import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import sharp from 'sharp'
import { vegetationFrame } from '../../src/world/prefabs/vegetationGeometry'
import { nearTreeModel, vegetationModels } from '../../src/world/siteLandscape'

describe('natural vegetation contracts', () => {
  it('centres the actual root instead of an asymmetric crown and retains ground contact', () => {
    const root = new Group(), material = new MeshBasicMaterial()
    const trunk = new Mesh(new BoxGeometry(.2, 2, .2), material)
    trunk.position.y = 1
    const crown = new Mesh(new BoxGeometry(2, 2, 2), material)
    crown.position.set(4, 4, 0)
    root.add(trunk, crown)
    const frame = vegetationFrame(root, 10)
    expect(frame.anchor.x).toBeCloseTo(0)
    expect(frame.anchor.y).toBeCloseTo(0)
    expect(frame.scale).toBeCloseTo(2)
    expect(new Vector3(0, 0, 0).applyMatrix4(frame.matrix).length()).toBeCloseTo(0)
    expect(frame.bounds.getCenter(new Vector3()).x).toBeGreaterThan(2)
    expect(() => vegetationFrame(root, 0)).toThrow('positive measured height')
    trunk.geometry.dispose()
    crown.geometry.dispose()
    material.dispose()
  })

  it('ships photographed bark/leaves and nontrivial alpha masks for every active cutout plant', async () => {
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    const activeModels = new Set([...Object.values(vegetationModels).map(model => model.id), nearTreeModel.id])
    for (const id of activeModels) {
      const document = await io.read(`public/models/${id}.glb`)
      for (const material of document.getRoot().listMaterials()) {
        expect(material.getBaseColorTexture(), `${id}/${material.getName()} diffuse`).not.toBeNull()
        expect(material.getNormalTexture(), `${id}/${material.getName()} normal`).not.toBeNull()
        if (material.getAlphaMode() !== 'MASK') continue
        const image = material.getBaseColorTexture()!.getImage()!
        expect((await sharp(image).metadata()).hasAlpha, `${id} leaf mask`).toBe(true)
        const alpha = await sharp(image).extractChannel(3).raw().toBuffer()
        expect(alpha.some(value => value < 80)).toBe(true)
        expect(alpha.some(value => value > 200)).toBe(true)
      }
    }
  })
})
