/** Applies vehicle appearance for the supplied visual state without changing the cached source model. */
import { useEffect, useMemo } from 'react'
import { Box3, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import type { WheelMotion } from '../../domain/wheelKinematics'
import { useModel } from './Model'
import type { VehicleType } from '../../domain/commerce'

export function VehicleAppearance({
  color = '#b5c1c5',
  motion,
  type = 'car',
  interiorActive = false,
}: {
  color?: string
  motion?: { current: WheelMotion }
  type?: VehicleType
  interiorActive?: boolean
}) {
  const { model } = useModel(type)
  const fitScale = useMemo(() => {
    model.updateMatrixWorld(true)

    const size = new Box3().setFromObject(model, true).getSize(new Vector3())

    return Math.min(
      1,
      6.15 / Math.max(size.z, 0.01),
      2.52 / Math.max(size.x, 0.01),
      2.35 / Math.max(size.y, 0.01),
    )
  }, [model])
  const window = model.getObjectByName('WindowFrontL')

  useFrame((_, delta) => {
    if (window)
      window.position.y +=
        ((interiorActive ? -0.5 : 0) - window.position.y) *
        (1 - Math.exp(-5 * Math.min(delta, 0.05)))
  })

  const wheels = useMemo(() => {
    model.updateMatrixWorld(true)

    return [
      'WheelFrontL',
      'WheelFrontR',
      'WheelRearL',
      'WheelRearR',
      ...(type === 'truck' ? ['WheelRearL2', 'WheelRearR2'] : []),
    ].flatMap((name) => {
      const wheel = model.getObjectByName(name)

      if (!wheel) return []

      const bounds = new Box3().setFromObject(wheel, true),
        center = bounds.getCenter(new Vector3()),
        pivot = new Group(),
        steer = new Group()

      if (motion) motion.current.radius = (bounds.getSize(new Vector3()).y / 2) * fitScale
      model.worldToLocal(center)
      pivot.position.copy(center)
      model.add(pivot)
      pivot.add(steer)
      steer.attach(wheel)

      return [{ pivot, steer, front: name.includes('Front') }]
    })
  }, [model, fitScale])

  useFrame(() => {
    if (motion) {
      motion.current.count = wheels.length
      for (const wheel of wheels) {
        wheel.pivot.rotation.y = wheel.front ? motion.current.steering : 0
        wheel.steer.rotation.x = motion.current.wheelAngle
      }
    }
  })

  const owned = useMemo(() => {
    const materials = new Map<MeshStandardMaterial, MeshStandardMaterial>()

    model.traverse((o) => {
      if (!(o instanceof Mesh)) return

      const adapt = (source: MeshStandardMaterial) => {
        if (materials.has(source)) return materials.get(source)!

        let m: MeshStandardMaterial = source.clone()

        if (/Paint|body (grey|dark)/i.test(source.name)) {
          const physical = new MeshPhysicalMaterial({
            map: source.map,
            normalMap: source.normalMap,
            roughnessMap: source.roughnessMap,
            metalnessMap: source.metalnessMap,
            aoMap: source.aoMap,
          })

          physical.name = source.name
          physical.normalScale.copy(source.normalScale)
          physical.map = null
          physical.color.set(color)
          physical.metalness = 0.65
          physical.roughness = 0.23
          physical.clearcoat = 0.8
          physical.clearcoatRoughness = 0.2
          m = physical
        }
        if (/Glass|windows/i.test(source.name)) {
          m.color.set('#234654')
          m.metalness = 0.25
          m.roughness = 0.22
        }
        if (/Tire|rubber/i.test(source.name)) {
          m.color.set('#171c20')
          m.metalness = 0
          m.roughness = 0.88
        }
        if (/Headlight/i.test(source.name)) {
          m.emissive.set('#fff5dc')
          m.emissiveIntensity = 0.45
        }
        if (/Brakelight|rear lights/i.test(source.name)) {
          m.emissive.set('#c62020')
          m.emissiveIntensity = 0.4
        }
        materials.set(source, m)

        return m
      }

      o.material = Array.isArray(o.material)
        ? o.material.map((m) => adapt(m as MeshStandardMaterial))
        : adapt(o.material as MeshStandardMaterial)
    })

    return [...materials.values()]
  }, [model, color])

  useEffect(() => () => owned.forEach((m) => m.dispose()), [owned])

  return (
    <group scale={fitScale} userData={{ vehicleFitScale: fitScale }}>
      <primitive object={model} dispose={null} />
    </group>
  )
}
