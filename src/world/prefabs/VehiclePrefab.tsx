import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import type { WorldVehicle } from '../../domain/contracts'
import { sampleVehicleMovement } from '../../domain/vehicleMotion'
import { useApp } from '../../app/store'
import { diagnostics } from '../diagnostics'
import { VehicleAppearance } from './VehicleAppearance'
import { Html } from '@react-three/drei'
import { CarFront } from 'lucide-react'
import { useCommerce } from '../../app/commerceStore'
import { rollWheels } from '../../domain/wheelKinematics'

export function VehiclePrefab({ vehicle }: { vehicle: WorldVehicle }) {
  const group = useRef<Group>(null),
    visual = useRef({ time: 0, lastClock: -1, previous: vehicle.position })
  const initial = useRef({
    position: [vehicle.position[0], 0.035, vehicle.position[1]] as [number, number, number],
    yaw: vehicle.yaw,
  })
  const motion = useRef({ wheelAngle: 0, steering: 0, radius: 0.31, count: 0 })
  const ownId = useCommerce((s) => s.order?.worldEntityId)
  const highlight = useApp((s) => s.inspectOwn && s.orderOpen) && ownId === vehicle.worldEntityId

  useEffect(
    () => () => {
      delete diagnostics.vehicles[vehicle.worldEntityId]
    },
    [vehicle.worldEntityId],
  )
  useFrame((frame, raw) => {
    if (!group.current) return

    const app = useApp.getState(),
      v = app.world.vehicles.find((v) => v.worldEntityId === vehicle.worldEntityId)

    if (!v) return

    const state = visual.current,
      dt = Math.min(raw, 0.05)

    if (app.world.clockSeconds < state.lastClock) {
      state.time = app.world.clockSeconds
      group.current.position.set(v.position[0], 0.035, v.position[1])
      group.current.rotation.y = v.yaw
      state.previous = v.position
      motion.current.wheelAngle = 0
    }
    if (!app.paused)
      state.time = Math.max(
        app.world.clockSeconds,
        Math.min(app.world.clockSeconds + 0.3 * app.world.speed, state.time + dt * app.world.speed),
      )
    state.lastClock = app.world.clockSeconds

    let position = v.position,
      yaw = v.yaw

    if (v.movement) {
      const pose = sampleVehicleMovement(v.movement, state.time)

      position = pose.position
      yaw = pose.yaw
    }

    const p = group.current.position,
      dist = Math.hypot(position[0] - p.x, position[1] - p.z)
    // Interpolate snapshot boundaries too. Even accelerated DEMO transport stays continuous.
    const maxStep = 2.8 * app.world.speed * dt,
      t = dist ? Math.min(1, maxStep / dist) : 1

    if (!app.paused) p.set(p.x + (position[0] - p.x) * t, 0.035, p.z + (position[1] - p.z) * t)

    const diff = Math.atan2(
      Math.sin(yaw - group.current.rotation.y),
      Math.cos(yaw - group.current.rotation.y),
    )

    if (!app.paused) group.current.rotation.y += diff * (1 - Math.exp(-8 * dt * app.world.speed))

    const actual = [p.x, p.z] as const
    const travelled = Math.hypot(actual[0] - state.previous[0], actual[1] - state.previous[1])

    motion.current.wheelAngle = rollWheels(
      motion.current.wheelAngle,
      state.previous,
      actual,
      group.current.rotation.y,
      motion.current.radius,
    )
    motion.current.steering = travelled > 0.0001 ? Math.max(-0.4, Math.min(0.4, diff)) : 0
    diagnostics.vehicles[v.worldEntityId] = {
      position: actual,
      yaw: group.current.rotation.y,
      stage: v.stage,
      moving: !!v.movement,
      observedAt: frame.clock.elapsedTime * 1000,
      wheels: { ...motion.current },
    }
    if (v.visibility === 'own') {
      diagnostics.vehiclePosition = actual
      diagnostics.vehicleDistance += Math.hypot(
        actual[0] - state.previous[0],
        actual[1] - state.previous[1],
      )
    }
    state.previous = actual
  })

  return (
    <group
      ref={group}
      position={initial.current.position}
      rotation-y={initial.current.yaw}
      name={vehicle.worldEntityId}
      userData={{ worldEntityId: vehicle.worldEntityId }}
      onClick={(e) => {
        if (e.delta > 5) return

        const p = diagnostics.vehicles[vehicle.worldEntityId]?.position || vehicle.position,
          viewer = diagnostics.position

        if (Math.hypot(p[0] - viewer[0], p[1] - viewer[1]) > 17) return
        e.stopPropagation()

        const own = useCommerce.getState().order?.worldEntityId === vehicle.worldEntityId

        useApp.getState().set({
          focusedVehicleId: vehicle.worldEntityId,
          dialogue: false,
          localOpen: !own,
          orderOpen: own,
        })
      }}
    >
      <VehicleAppearance
        key={vehicle.type || 'car'}
        type={vehicle.type}
        color={vehicle.color}
        motion={motion}
        interiorActive={vehicle.tasks.some((t) => t.id === 'interior' && t.status === 'active')}
      />
      {highlight && (
        <Html center position={[0, 2.65, 0]} occlude zIndexRange={[18, 0]}>
          <span className="own-vehicle-marker">
            <CarFront size={13} />
            Tu auto · DEMO
          </span>
        </Html>
      )}
    </group>
  )
}
