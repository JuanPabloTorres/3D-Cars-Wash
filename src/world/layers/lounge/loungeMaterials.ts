import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { MeshStandardMaterial, Vector2 } from 'three'
import { cloneSurfaceMaps } from '../../materials/textureMaps'
import { useReceptionMaterials } from '../reception/receptionMaterials'

/** Independent fabric instances; never recolor a cached map shared by a layer. */
export function useLoungeMaterials() {
  const wood = useReceptionMaterials()
  const sources = useTexture([
    '/textures/lounge/fabric-col_2.jpg',
    '/textures/lounge/fabric-nor_gl.jpg',
    '/textures/lounge/fabric-rough.jpg',
  ])
  const fabrics = useMemo(() => {
    const maps = cloneSurfaceMaps(sources, { repeat: [3.5, 3.5] })
    const material = (color: string) =>
      new MeshStandardMaterial({
        normalMap: maps[1],
        roughnessMap: maps[2],
        normalScale: new Vector2(0.15, 0.15),
        color,
        roughness: 1,
        metalness: 0,
      })

    return {
      maps,
      linen: material('#e5dccf'),
      secondary: material('#b9b6a9'),
      olive: material('#777d59'),
      wine: material('#bd765d'),
      rope: new MeshStandardMaterial({ color: '#514c40', roughness: 0.95 }),
    }
  }, [sources])

  useEffect(
    () => () => {
      fabrics.maps.forEach((map) => map.dispose())
      ;[fabrics.linen, fabrics.secondary, fabrics.olive, fabrics.wine, fabrics.rope].forEach(
        (mat) => mat.dispose(),
      )
    },
    [fabrics],
  )

  return { ...wood, ...fabrics }
}

export type LoungeMaterials = ReturnType<typeof useLoungeMaterials>
