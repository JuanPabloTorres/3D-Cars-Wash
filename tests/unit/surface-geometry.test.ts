import { describe, expect, it, vi } from 'vitest'
import { Box3, BufferAttribute, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { createBlockGeometry } from '../../src/world/prefabs/surfaceGeometry'
import { batchArchitecture } from '../../src/world/prefabs/StaticArchitectureBatch'

describe('architectural surface geometry', () => {
  it('rounds corners inside the original navigation envelope and keeps paint flat', () => {
    const geometry = createBlockGeometry([4.5, .12, .92], .055)
    geometry.computeBoundingBox()
    const size = geometry.boundingBox!.getSize(new Vector3())
    expect(size.x).toBeCloseTo(4.5, 5)
    expect(size.y).toBeCloseTo(.12, 5)
    expect(size.z).toBeCloseTo(.92, 5)
    const normals = geometry.getAttribute('normal')
    expect(Array.from(normals.array).some(n => Math.abs(n) > .1 && Math.abs(n) < .9)).toBe(true)
    const paint = createBlockGeometry([6, .02, .08])
    expect(paint.type).toBe('BoxGeometry')
    geometry.dispose()
    paint.dispose()
  })

  it('keeps the texture density per metre when a slab is lengthened', () => {
    const small = createBlockGeometry([2, .2, 1])
    const large = createBlockGeometry([8, .2, 1])
    const maxU = (geometry: typeof small) => Math.max(...Array.from(geometry.getAttribute('uv').array).filter((_, i) => i % 2 === 0))
    expect(maxU(large) / maxU(small)).toBeCloseTo(4)
    small.dispose()
    large.dispose()
  })

  it('batches real bevels and UVs through nested transforms and restores anchors on cleanup', () => {
    const owner = new Group(), nested = new Group(), material = new MeshStandardMaterial()
    owner.position.set(4, 2, -3)
    owner.rotation.y = .3
    nested.position.set(2, 0, -1)
    nested.rotation.y = -.5
    owner.add(nested)
    const rounded = new Mesh(createBlockGeometry([3, .2, .9]), material)
    const paint = new Mesh(createBlockGeometry([1, .02, .1]), material)
    rounded.userData.staticArchitecture = paint.userData.staticArchitecture = true
    paint.position.set(-2, .5, 0)
    nested.add(rounded, paint)
    const prop = new Mesh(createBlockGeometry([.2, .3, .1]), material)
    owner.add(prop)
    const expectedBounds = new Box3().setFromObject(nested, true)
    const roundedUV = Array.from(rounded.geometry.getAttribute('uv').array)
    const count = rounded.geometry.getAttribute('position').count + paint.geometry.index!.count
    const release = batchArchitecture(owner)
    const batch = owner.getObjectByName('static-architecture')!
    expect(batch.children).toHaveLength(1)
    const merged = batch.children[0] as Mesh
    expect(merged.geometry.getAttribute('position').count).toBe(count)
    expect(Array.from(merged.geometry.getAttribute('uv').array).slice(0, roundedUV.length)).toEqual(roundedUV)
    const actualBounds = new Box3().setFromObject(merged, true)
    expect(actualBounds.min.distanceTo(expectedBounds.min)).toBeLessThan(.00001)
    expect(actualBounds.max.distanceTo(expectedBounds.max)).toBeLessThan(.00001)
    expect(rounded.visible).toBe(false)
    expect(prop.visible).toBe(true)
    const disposed = vi.fn()
    merged.geometry.addEventListener('dispose', disposed)
    release()
    expect(disposed).toHaveBeenCalledOnce()
    expect(owner.getObjectByName('static-architecture')).toBeUndefined()
    expect(rounded.visible).toBe(true)
    rounded.geometry.dispose()
    paint.geometry.dispose()
    prop.geometry.dispose()
    material.dispose()
  })

  it('leaves authored meshes visible if a material group cannot merge', () => {
    const owner = new Group(), material = new MeshStandardMaterial()
    const a = new Mesh(createBlockGeometry([1, 1, 1]), material)
    const b = new Mesh(createBlockGeometry([1, 1, 1]), material)
    b.geometry.setAttribute('color', new BufferAttribute(new Float32Array(b.geometry.getAttribute('position').count * 3), 3))
    a.userData.staticArchitecture = b.userData.staticArchitecture = true
    owner.add(a, b)
    const warning = vi.spyOn(console, 'error').mockImplementation(() => {})
    const release = batchArchitecture(owner)
    expect(a.visible && b.visible).toBe(true)
    expect(owner.getObjectByName('static-architecture')!.children).toHaveLength(0)
    expect(warning).toHaveBeenCalled()
    warning.mockRestore()
    release()
    a.geometry.dispose()
    b.geometry.dispose()
    material.dispose()
  })
})
