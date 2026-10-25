import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import {
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  type Material,
} from 'three'
import { vegetationFrame } from './vegetationGeometry'
import type { PlantPlacement } from '../siteLandscape'

type Props = {
  url: string
  placements: PlantPlacement[]
  height: number
  canopy?: boolean
  foliageTint?: string
  castShadow?: boolean
  finish?: 'landscape'
}

// Original baked leaf albedos → warmer olive albedos calibrated against the
// approved background-box photographs. These are surface colors, not the
// already-lit photograph pixels. Preserve each texture's veins and mottling.
const landscapeLeafPalette: Record<string, readonly [string, string]> = {
  'leaf-depth': ['#263f20', '#34421d'],
  'leaf-medium': ['#466326', '#606825'],
  'leaf-sunlit': ['#718d35', '#909833'],
  'leaf-new-growth': ['#99af4b', '#b0b550'],
}

function matchLandscapeLeafColor(material: MeshStandardMaterial) {
  const palette = landscapeLeafPalette[material.name]

  if (!palette) return

  const from = new Color(palette[0]),
    to = new Color(palette[1])

  // Ratios are computed in linear light. Apply only to owned material clones;
  // the shared GLB maps, trunks and the preserved full scene stay untouched.
  material.color.multiply(new Color().setRGB(to.r / from.r, to.g / from.g, to.b / from.b))
}

/** Shared GLB geometry and textures remain immutable. Only owned material clones
 * receive foliage finishing; one draw per source mesh, not per planted instance. */
export function InstancedAsset({
  url,
  placements,
  height,
  canopy = false,
  foliageTint,
  castShadow = false,
  finish: profile,
}: Props) {
  const { scene } = useGLTF(url)
  const parts = useMemo(() => {
    const frame = vegetationFrame(scene, height)
    const result: Array<{
      geometry: Mesh['geometry']
      material: Material | Material[]
      matrix: Matrix4
    }> = []
    const finish = (source: Material) => {
      const material = source.clone()

      if (material instanceof MeshStandardMaterial) {
        const foliage = material.alphaTest > 0 || /foliage|leaf/i.test(material.name)

        material.metalness = 0
        material.envMapIntensity = foliage ? 0.35 : 0.6
        if (foliage) {
          material.side = DoubleSide
          material.alphaToCoverage = true
          material.transparent = false
          material.depthWrite = true
          material.roughness = Math.max(profile === 'landscape' ? 0.74 : 0.88, material.roughness)
          material.normalScale.multiplyScalar(0.5)
          if (foliageTint) material.color.multiply(new Color(foliageTint))
          // Small distant leaves lose alpha coverage in filtered mip levels.
          // MSAA coverage keeps their edges soft while preserving visible canopy.
          if (canopy) material.alphaTest = Math.min(material.alphaTest, 0.2)
        }
        if (profile === 'landscape') {
          material.roughness = Math.max(foliage ? 0.74 : 0.92, material.roughness)
          material.envMapIntensity = 0.4
          if (!foliage) material.normalScale.multiplyScalar(0.65)
          // Subtle leaf fill, shared by foreground and background specimens.
          // Preserve scanned color/alpha variations instead of painting the crown.
          if (foliage) {
            matchLandscapeLeafColor(material)
            material.emissive.set('#536b35')
            material.emissiveIntensity = 0.025
            material.emissiveMap = material.map
          }
        }
      }

      return material
    }

    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return
      result.push({
        geometry: object.geometry,
        material: Array.isArray(object.material)
          ? object.material.map(finish)
          : finish(object.material),
        matrix: frame.matrix.clone().multiply(object.matrixWorld),
      })
    })

    return result
  }, [scene, height, canopy, foliageTint, profile])

  useEffect(
    () => () =>
      parts.forEach((part) => {
        const materials = Array.isArray(part.material) ? part.material : [part.material]

        materials.forEach((material) => material.dispose())
      }),
    [parts],
  )

  return (
    <group dispose={null} name="instanced-vegetation">
      {parts.map((part, i) => (
        <VegetationInstances
          key={i}
          {...part}
          placements={placements}
          castShadow={castShadow}
          asset={url}
        />
      ))}
    </group>
  )
}

function VegetationInstances({
  geometry,
  material,
  matrix,
  placements,
  castShadow,
  asset,
}: {
  geometry: Mesh['geometry']
  material: Material | Material[]
  matrix: Matrix4
  placements: PlantPlacement[]
  castShadow: boolean
  asset: string
}) {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const object = new Object3D(),
      tint = new Color()

    placements.forEach(([x, y, z, rotation, scale], i) => {
      object.position.set(x, y, z)
      object.rotation.set(0, rotation, 0)
      object.scale.setScalar(scale)
      object.updateMatrix()
      ref.current!.setMatrixAt(i, object.matrix.clone().multiply(matrix))

      const brightness = 0.94 + ((i * 7) % 11) * 0.006

      ref.current!.setColorAt(i, tint.setRGB(brightness, brightness, brightness))
    })
    ref.current!.instanceMatrix.needsUpdate = true
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [placements, matrix])
  useEffect(() => {
    const instance = ref.current

    return () => instance?.dispose()
  }, [])

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, placements.length]}
      castShadow={castShadow}
      receiveShadow
      userData={{ assetId: asset, planted: true }}
    />
  )
}
