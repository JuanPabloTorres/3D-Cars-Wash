import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { useApp } from '../../../app/store'
import { diagnostics } from '../../diagnostics'
import { receptionPlan as plan } from './receptionPlan'
import { loungePlan } from '../lounge/loungePlan'
import { cameraFlight } from './cameraFlight'
import type { CameraFocus } from '../GroundLayer'

/** Continuous, cancellable area navigation with rounded lounge access.
 * Camera arrival opens attention only; it never creates a commercial order. */
export function ReceptionCamera({
  view,
  onReady,
  interactive,
  focus,
  onTransitionChange,
}: {
  view: string
  onReady: () => void
  interactive: boolean
  focus?: CameraFocus
  onTransitionChange?: (moving: boolean) => void
}) {
  const { camera, size, gl } = useThree()
  const revision = useApp((s) => s.navRevision)
  const motion = useRef({
    from: new Vector3(),
    to: new Vector3(),
    aim: new Vector3(),
    startAim: new Vector3(),
    elapsed: 0,
    duration: 0,
    done: false,
    fromFov: 48,
    toFov: 48,
  })
  const lastAim = useRef(new Vector3(-6, 1.3, 0)),
    initialized = useRef(false)
  const previousView = useRef(view)
  const rotation = useRef({ from: new Quaternion(), to: new Quaternion() })
  const flight = useRef<ReturnType<typeof cameraFlight> | null>(null)

  useEffect(() => {
    const mobile = size.width <= 700 || size.width / size.height < 1.1,
      attention = view === 'reception'
    const to = new Vector3(
      ...((focus
        ? focus.position
        : attention
          ? plan.attention
          : view === 'waiting'
            ? loungePlan.observation.position
            : view === 'service'
              ? [19.4, 5.8, mobile ? 42 : 28]
              : view === 'plan'
                ? [17, 115, 5.1]
                : view === 'general'
                  ? [44, 38, 58]
                  : [-5, 3.5, mobile ? 20 : 18]) as [number, number, number]),
    )

    // Fit the full 41 m bay frontage to the viewport; portrait must not crop
    // the first/last bay. Selecting a bay uses its separate close-up target.
    if (view === 'service' && !focus)
      to.z = Math.max(28, 23 / (Math.tan((24 * Math.PI) / 180) * (size.width / size.height)) - 2)
    // Fit the complete reception wall in portrait, including both information signs.
    if (attention && mobile)
      to.z = Math.max(
        7.1,
        plan.origin[2] - 2.45 + 3.3 / (Math.tan((55 * Math.PI) / 360) * (size.width / size.height)),
      )

    const aim = new Vector3(
      ...((focus
        ? focus.target
        : attention
          ? plan.lookAt
          : view === 'waiting'
            ? loungePlan.observation.target
            : view === 'service'
              ? [19.4, 1, -2]
              : view === 'general' || view === 'plan'
                ? [12, 0, 2]
                : [-4.5, 0.6, 0]) as [number, number, number]),
    )
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const m = motion.current

    m.from.copy(initialized.current ? camera.position : to)
    m.to.copy(to)
    m.aim.copy(aim)
    m.startAim.copy(initialized.current ? lastAim.current : aim)
    m.elapsed = 0
    m.done = false
    // Replace the destination without flying through furniture or walls.
    flight.current = cameraFlight(m.from, m.to, previousView.current, view)
    m.duration =
      reduced || !initialized.current ? 0 : Math.min(1.65, 0.85 + flight.current.length * 0.015)
    rotation.current.to.setFromRotationMatrix(new Matrix4().lookAt(to, aim, camera.up))
    rotation.current.from.copy(initialized.current ? camera.quaternion : rotation.current.to)
    previousView.current = view
    m.toFov = attention ? (mobile ? 55 : 48) : view === 'waiting' ? 58 : 48
    m.fromFov = initialized.current ? (camera as PerspectiveCamera).fov : m.toFov
    onTransitionChange?.(m.duration > 0)
    initialized.current = true
    useApp.getState().set({ interaction: null, dialogue: false })
  }, [
    view,
    revision,
    size.width,
    size.height,
    camera,
    focus?.position.join(','),
    focus?.target.join(','),
  ])
  useFrame((_, dt) => {
    const m = motion.current

    m.elapsed += Math.min(dt, 0.1)

    const t = m.duration ? Math.min(1, m.elapsed / m.duration) : 1
    const eased = t * t * t * (t * (t * 6 - 15) + 10)

    if (flight.current) flight.current.sample(t, camera.position)
    else camera.position.copy(m.to)
    lastAim.current.lerpVectors(m.startAim, m.aim, eased)
    // Shortest-arc rotation stays stable even when the old and new targets cross the path.
    camera.quaternion.slerpQuaternions(rotation.current.from, rotation.current.to, eased)

    const c = camera as PerspectiveCamera

    c.fov = m.fromFov + (m.toFov - m.fromFov) * eased
    if (gl.domElement.parentElement) gl.domElement.parentElement.style.opacity = '1'
    // Opening a panel does not initiate a second, unrelated camera movement.
    c.clearViewOffset()
    c.updateProjectionMatrix()
    diagnostics.position = [camera.position.x, camera.position.z]
    diagnostics.route =
      t < 1
        ? [
            [m.from.x, m.from.z],
            [m.to.x, m.to.z],
          ]
        : []
    if (t === 1 && !m.done) {
      m.done = true
      onTransitionChange?.(false)
      onReady()
      useApp.getState().set({
        destination: null,
        activeView: view === 'reception' ? 'reception' : 'entrance',
        interaction: view === 'reception' ? 'reception' : null,
        dialogue: interactive && view === 'reception',
      })
    }

    const data = {
      view,
      transition: t < 1,
      fov: c.fov,
      camera: camera.position.toArray(),
      target: lastAim.current.toArray(),
      animations: diagnostics.animations,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
    }
    ;(window as Window & { __RECEPTION__?: unknown }).__RECEPTION__ = data
  })

  return null
}
