import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { MeshStandardMaterial, NoColorSpace, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'

const root = '/textures/ground-v2/'

/** Map density is in metres, matching createBlockGeometry's UVs. Own clones
 * prevent this construction layer from changing textures in the full scene. */
export function useSurface(files: string[], metres: [number, number], color: string, relief: number, minimumRoughness = 0) {
  const sources = useTexture(files.map(file => root + file))
  const surface = useMemo(() => {
    const maps = sources.map((source, index) => {
      const texture = source.clone()
      texture.wrapS = texture.wrapT = RepeatWrapping
      texture.repeat.set(1 / metres[0], 1 / metres[1])
      texture.colorSpace = index === 0 ? SRGBColorSpace : NoColorSpace
      texture.anisotropy = 8
      texture.needsUpdate = true
      return texture
    })
    const material = new MeshStandardMaterial({
      map: maps[0], normalMap: maps[1], roughnessMap: maps[2],
      normalScale: new Vector2(relief, relief), color, roughness: 1, metalness: 0,
    })
    // Some scanned surfaces contain wet/polished patches. Retain their variation
    // but bound gloss for the dry soil and outdoor deck in this layer.
    if (minimumRoughness > 0) {
      material.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>\nroughnessFactor = max(roughnessFactor, ${minimumRoughness.toFixed(2)});`)
      }
      material.customProgramCacheKey = () => `ground-matte-${minimumRoughness}`
    }
    return material
  }, [sources, metres[0], metres[1], color, relief, minimumRoughness])
  useEffect(() => () => {
    surface.map?.dispose(); surface.normalMap?.dispose(); surface.roughnessMap?.dispose()
    surface.dispose()
  }, [surface])
  return surface
}

/** Ground-only finishes; no dependency on operational state or weather. */
export function useGroundMaterials() {
  const ground = useSurface(['Asphalt010-Color.jpg', 'Asphalt010-NormalGL.jpg', 'Asphalt010-Roughness.jpg'], [2, 2], '#b8b9bb', .32)
  const pavement = useSurface(['Concrete034-Color.jpg', 'Concrete034-NormalGL.jpg', 'Concrete034-Roughness.jpg'], [1.1, .55], '#e1dacb', .14)
  const soil = useSurface(['mud-Diffuse.jpg', 'mud-nor_gl.jpg', 'mud-Rough.jpg'], [1.3, 1.3], '#a28a70', .85, .82)
  const wood = useSurface(['WoodFloor051-Color.jpg', 'WoodFloor051-NormalGL.jpg', 'WoodFloor051-Roughness.jpg'], [1.8, 1.8], '#b88b60', .35, .65)
  const paint = useMemo(() => ({
    red: new MeshStandardMaterial({ color: '#b85b4c', roughness: 1 }),
    yellow: new MeshStandardMaterial({ color: '#d8ab37', roughness: .95 }),
    marking: new MeshStandardMaterial({ color: '#ece8dc', roughness: .95 }),
    joint: new MeshStandardMaterial({ color: '#8f897d', roughness: 1 }),
    curb: new MeshStandardMaterial({ color: '#c6bca8', roughness: .92 }),
  }), [])
  useEffect(() => () => Object.values(paint).forEach(material => material.dispose()), [paint])
  return { ...paint, ground, pavement, plaster: pavement, bayFloor: pavement, soil, wood }
}
