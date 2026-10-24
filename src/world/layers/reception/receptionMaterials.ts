import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { MeshStandardMaterial, NoColorSpace, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'

/** Owned textures sample individual boards of the existing wood scan. Metre UVs
 * keep grain density consistent; offsets vary across slats without stretching. */
export function useReceptionMaterials() {
  const maps = useTexture(['/textures/wood-color.jpg', '/textures/wood-normal.jpg', '/textures/wood-roughness.jpg'])
  const palette = useMemo(() => {
    function wood(vertical: boolean, variant = 0) {
      const textures = maps.map((source, i) => {
        const t = source.clone(); t.wrapS = t.wrapT = RepeatWrapping
        t.colorSpace = i === 0 ? SRGBColorSpace : NoColorSpace
        t.repeat.set(.28, .065); t.offset.set(variant * .13, .023 + variant * .002)
        t.rotation = vertical ? Math.PI / 2 : 0; t.anisotropy = 8
        return t
      })
      return new MeshStandardMaterial({ map: textures[0], normalMap: textures[1], roughnessMap: textures[2],
        normalScale: new Vector2(.16, .16), color: ['#d1b99d','#bfa88d','#ddc7aa'][variant % 3], roughness: .74 })
    }
    return {
      top: wood(false), slats: [wood(true, 0), wood(true, 1), wood(true, 2)], ceiling: wood(false, 1),
      metal: new MeshStandardMaterial({color:'#273138', roughness:.55, metalness:.48}),
      wall: new MeshStandardMaterial({color:'#17242c', roughness:.9}),
      red: new MeshStandardMaterial({color:'#d92535', roughness:.56, metalness:.15}),
      backing: new MeshStandardMaterial({color:'#392a23', roughness:.95}),
      opal: new MeshStandardMaterial({color:'#fff0ce', emissive:'#ffe0a5', emissiveIntensity:1.3, toneMapped:false}),
    }
  }, [maps])
  useEffect(() => () => {
    for (const mat of [palette.top,...palette.slats,palette.ceiling]) {
      mat.map?.dispose(); mat.normalMap?.dispose(); mat.roughnessMap?.dispose()
    }
    for (const mat of Object.values(palette).flat()) mat.dispose()
  }, [palette])
  return palette
}
