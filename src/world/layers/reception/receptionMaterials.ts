import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { MeshStandardMaterial, Vector2 } from 'three'
import { cloneSurfaceMaps } from '../../materials/textureMaps'

/** Owned textures sample individual boards of the existing wood scan. Metre UVs
 * keep grain density consistent; offsets vary across slats without stretching. */
export function useReceptionMaterials() {
  const maps = useTexture([
    '/textures/wood-color.jpg',
    '/textures/wood-normal.jpg',
    '/textures/wood-roughness.jpg',
  ])
  const palette = useMemo(() => {
    function wood(vertical: boolean, variant = 0) {
      const textures = cloneSurfaceMaps(maps, {
        repeat: [0.28, 0.065],
        offset: [variant * 0.13, 0.023 + variant * 0.002],
        rotation: vertical ? Math.PI / 2 : 0,
      })

      return new MeshStandardMaterial({
        map: textures[0],
        normalMap: textures[1],
        roughnessMap: textures[2],
        normalScale: new Vector2(0.16, 0.16),
        color: ['#d1b99d', '#bfa88d', '#ddc7aa'][variant % 3],
        roughness: 0.74,
      })
    }

    return {
      top: wood(false),
      slats: [wood(true, 0), wood(true, 1), wood(true, 2)],
      ceiling: wood(false, 1),
      metal: new MeshStandardMaterial({ color: '#273138', roughness: 0.55, metalness: 0.48 }),
      wall: new MeshStandardMaterial({ color: '#17242c', roughness: 0.9 }),
      red: new MeshStandardMaterial({ color: '#d92535', roughness: 0.56, metalness: 0.15 }),
      backing: new MeshStandardMaterial({ color: '#392a23', roughness: 0.95 }),
      opal: new MeshStandardMaterial({
        color: '#fff0ce',
        emissive: '#ffe0a5',
        emissiveIntensity: 1.3,
        toneMapped: false,
      }),
    }
  }, [maps])

  useEffect(
    () => () => {
      for (const mat of [palette.top, ...palette.slats, palette.ceiling]) {
        mat.map?.dispose()
        mat.normalMap?.dispose()
        mat.roughnessMap?.dispose()
      }
      for (const mat of Object.values(palette).flat()) mat.dispose()
    },
    [palette],
  )

  return palette
}
