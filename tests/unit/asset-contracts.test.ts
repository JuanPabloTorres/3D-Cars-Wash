import { describe, it, expect } from 'vitest'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
describe('actual exported assets', () => {
  it('contains four distinct bodies with independently addressable wheel assemblies', async () => {
    const sizes = []
    for (const type of ['car', 'pickup', 'suv', 'truck']) {
      const d = await io.read(`public/models/vehicle-${type}.glb`),
        nodes = d.getRoot().listNodes()
      expect(nodes.some((n) => n.getName() === 'Body')).toBe(true)
      expect(nodes.filter((n) => /^Wheel/.test(n.getName())).length).toBe(type === 'truck' ? 6 : 4)
      const positions = d
        .getRoot()
        .listMeshes()
        .flatMap((m) => m.listPrimitives().map((p) => p.getAttribute('POSITION')!))
      const lo = [0, 1, 2].map((axis) => Math.min(...positions.map((p) => p.getMin([])[axis]))),
        hi = [0, 1, 2].map((axis) => Math.max(...positions.map((p) => p.getMax([])[axis])))
      const size = hi.map((n, i) => n - lo[i])
      sizes.push(size)
      expect(size[0]).toBeLessThan(2.95)
      expect(size[2]).toBeLessThan(8.4)
      expect(size[1]).toBeLessThan(3.5)
    }
    expect(new Set(sizes.map((s) => s.map((n) => n.toFixed(2)).join(','))).size).toBe(4)
  })
  it('bakes work poses into the actual Snow UpperArm controls rather than bind pose', async () => {
    const d = await io.read('public/models/worker.glb')
    const rotation = (clip: string) =>
      Array.from(
        d
          .getRoot()
          .listAnimations()
          .find((a) => a.getName() === clip)!
          .listChannels()
          .find(
            (c) =>
              c.getTargetNode()?.getName() === 'UpperArm.R' && c.getTargetPath() === 'rotation',
          )!
          .getSampler()!
          .getOutput()!
          .getArray()! as Float32Array,
      ).slice(0, 4)
    const idle = rotation('Idle')
    for (const name of ['Service', 'ServiceInterior', 'ServiceLights', 'ServiceInspect']) {
      const q = rotation(name)
      expect(q.every(Number.isFinite)).toBe(true)
      expect(q.reduce((n, v, i) => n + Math.abs(v - idle[i]), 0)).toBeGreaterThan(0.02)
      expect(Math.abs(q[3])).toBeLessThan(0.99)
    }
  })
  it('retains segmented deformation and the original separate eye material regions', async () => {
    const d = await io.read('public/models/worker.glb'),
      root = d.getRoot()
    expect(root.listNodes().filter((n) => n.getName().startsWith('SEG-')).length).toBeGreaterThan(
      1000,
    )
    const eye = root.listMeshes().find((m) => m.getName().includes('eye_anim'))!
    expect(eye).toBeDefined()
    const materials = eye.listPrimitives().map((p) => p.getMaterial()!.getName())
    for (const region of ['eyes_white', 'eyes_iris', 'eyes_pupil'])
      expect(materials.some((n) => n.includes(region))).toBe(true)
  })
})
