import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { Color, DoubleSide, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Object3D, type Material } from 'three'
import { vegetationFrame } from './vegetationGeometry'
import type { PlantPlacement } from '../siteLandscape'

type Props = {
  url: string; placements: PlantPlacement[]; height: number
  canopy?: boolean; foliageTint?: string; castShadow?: boolean
}

/** Shared GLB geometry and textures remain immutable. Only owned material clones
 * receive foliage finishing; one draw per source mesh, not per planted instance. */
export function InstancedAsset({ url, placements, height, canopy = false, foliageTint, castShadow = false }: Props) {
  const { scene } = useGLTF(url)
  const parts = useMemo(() => {
    const frame = vegetationFrame(scene, height)
    const result: Array<{ geometry: Mesh['geometry']; material: Material | Material[]; matrix: Matrix4 }> = []
    const finish = (source: Material) => {
      const material = source.clone()
      if (material instanceof MeshStandardMaterial) {
        const foliage = material.alphaTest > 0
        material.metalness = 0
        material.envMapIntensity = foliage ? .35 : .6
        if (foliage) {
          material.side = DoubleSide
          material.alphaToCoverage = true
          material.transparent = false
          material.depthWrite = true
          material.roughness = Math.max(.88, material.roughness)
          material.normalScale.multiplyScalar(.5)
          if (foliageTint) material.color.multiply(new Color(foliageTint))
          // Small distant leaves lose alpha coverage in filtered mip levels.
          // MSAA coverage keeps their edges soft while preserving visible canopy.
          if (canopy) material.alphaTest = Math.min(material.alphaTest, .2)
        }
      }
      return material
    }
    scene.traverse(object => {
      if (!(object instanceof Mesh)) return
      result.push({ geometry: object.geometry,
        material: Array.isArray(object.material) ? object.material.map(finish) : finish(object.material),
        matrix: frame.matrix.clone().multiply(object.matrixWorld) })
    })
    return result
  }, [scene, height, canopy, foliageTint])
  useEffect(() => () => parts.forEach(part => {
    const materials = Array.isArray(part.material) ? part.material : [part.material]
    materials.forEach(material => material.dispose())
  }), [parts])
  return <group dispose={null} name="instanced-vegetation">{parts.map((part, i) =>
    <VegetationInstances key={i} {...part} placements={placements} castShadow={castShadow} asset={url}/>)}</group>
}

function VegetationInstances({ geometry, material, matrix, placements, castShadow, asset }: {
  geometry: Mesh['geometry']; material: Material | Material[]; matrix: Matrix4
  placements: PlantPlacement[]; castShadow: boolean; asset: string
}) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const object = new Object3D(), tint = new Color()
    placements.forEach(([x, y, z, rotation, scale], i) => {
      object.position.set(x, y, z)
      object.rotation.set(0, rotation, 0)
      object.scale.setScalar(scale)
      object.updateMatrix()
      ref.current!.setMatrixAt(i, object.matrix.clone().multiply(matrix))
      const brightness = .94 + ((i * 7) % 11) * .006
      ref.current!.setColorAt(i, tint.setRGB(brightness, brightness, brightness))
    })
    ref.current!.instanceMatrix.needsUpdate = true
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [placements, matrix])
  useEffect(() => { const instance = ref.current; return () => instance?.dispose() }, [])
  return <instancedMesh ref={ref} args={[geometry, material, placements.length]} castShadow={castShadow} receiveShadow userData={{ assetId: asset, planted: true }}/>
}
