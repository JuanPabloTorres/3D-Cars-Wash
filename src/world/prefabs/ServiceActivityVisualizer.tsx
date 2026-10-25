/** Renders service activity cues from task state; visual progress never completes a commercial task. */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, Points, BufferGeometry, Line, LineBasicMaterial } from 'three'
import { useApp } from '../../app/store'
import { diagnostics } from '../diagnostics'
import { bayCenter, type BayId } from '../../domain/sitePlan'

export function ServiceActivityVisualizer({ bayId }: { bayId: BayId }) {
  const points = useRef<Points>(null),
    positions = useMemo(() => new Float32Array(32 * 3), []),
    [x, z] = bayCenter(bayId)
  const hose = useMemo(() => {
    const geometry = new BufferGeometry()

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(18 * 3), 3))

    return new Line(geometry, new LineBasicMaterial({ color: '#273a43' }))
  }, [])

  useEffect(
    () => () => {
      hose.geometry.dispose()
      hose.material.dispose()
    },
    [hose],
  )
  useFrame(({ clock }) => {
    if (!points.current) return

    const app = useApp.getState(),
      bay = app.world.bays.find((b) => b.bayId === bayId),
      v = app.world.vehicles.find((v) => v.worldEntityId === bay?.vehicleId),
      actual = v && diagnostics.vehicles[v.worldEntityId]
    const anchor = diagnostics.toolAnchors[`worker:${bayId}`],
      working =
        !!v?.assignedWorkerId &&
        !v.movement &&
        !!actual &&
        Math.hypot(actual.position[0] - x, actual.position[1] - z) < 0.25

    points.current.visible =
      working && !!anchor?.attached && anchor.activity === 'exterior' && !app.paused
    hose.visible =
      working && !!anchor?.attached && ['exterior', 'interior'].includes(anchor.activity)
    if (hose.visible) {
      const a = hose.geometry.attributes.position as BufferAttribute

      for (let i = 0; i < 18; i++) {
        const t = i / 17,
          u = 1 - t
        const start = [x - 2.3, 0.38, z + (anchor.activity === 'exterior' ? 2.1 : 0.8)]

        a.setXYZ(
          i,
          u * start[0] + t * anchor.grip[0],
          Math.max(0.06, u * start[1] + t * anchor.grip[1] - 0.9 * 4 * t * u),
          u * start[2] + t * anchor.grip[2],
        )
      }
      a.needsUpdate = true
      hose.geometry.computeBoundingSphere()
    }
    if (app.paused) return
    if (!anchor) return
    for (let i = 0; i < 32; i++) {
      const u = (clock.elapsedTime * 1.7 + i * 0.031) % 1

      positions[i * 3] = anchor.tip[0] + u * (x - 0.9 - anchor.tip[0])
      positions[i * 3 + 1] =
        anchor.tip[1] + u * (0.95 - anchor.tip[1]) - u * u * 0.08 + Math.sin(i * 1.7) * u * 0.06
      positions[i * 3 + 2] =
        anchor.tip[2] + u * (z + 1.4 - anchor.tip[2]) + Math.sin(i * 2.3) * u * 0.1
    }
    ;(points.current.geometry.attributes.position as BufferAttribute).needsUpdate = true
  })

  return (
    <>
      <primitive object={hose} />
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#d9f4ff"
          size={0.035}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </points>
    </>
  )
}
