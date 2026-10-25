import { describe, expect, it, vi } from 'vitest'
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, Texture } from 'three'
import { cloneSurfaceMaps } from '../../src/world/materials/textureMaps'

describe('owned PBR texture sampling', () => {
  it('shares image data while keeping reception and ground UV/color settings independent', () => {
    const sources = [new Texture(), new Texture(), new Texture()]
    sources[0].repeat.set(2, 3)
    sources[0].offset.set(0.2, 0.4)
    const reception = cloneSurfaceMaps(sources, {
      repeat: [0.28, 0.065],
      offset: [0.13, 0.025],
      rotation: Math.PI / 2,
    })
    const ground = cloneSurfaceMaps(sources, { repeat: [0.5, 0.5] })

    expect(reception[0]).not.toBe(sources[0])
    expect(reception[0].source).toBe(sources[0].source)
    expect(reception.map((map) => map.colorSpace)).toEqual([
      SRGBColorSpace,
      NoColorSpace,
      NoColorSpace,
    ])
    expect(reception[0].repeat.toArray()).toEqual([0.28, 0.065])
    expect(reception[0].rotation).toBe(Math.PI / 2)
    expect(ground[0].repeat.toArray()).toEqual([0.5, 0.5])
    expect(sources[0].repeat.toArray()).toEqual([2, 3])
    expect(sources[0].offset.toArray()).toEqual([0.2, 0.4])
    expect(sources[0].rotation).toBe(0)
    expect(
      reception.every((map) => map.wrapS === RepeatWrapping && map.wrapT === RepeatWrapping),
    ).toBe(true)

    const disposedSource = vi.fn()
    sources[0].addEventListener('dispose', disposedSource)
    reception.forEach((map) => map.dispose())
    expect(disposedSource).not.toHaveBeenCalled()
    ground.forEach((map) => map.dispose())
    sources.forEach((map) => map.dispose())
  })
})
