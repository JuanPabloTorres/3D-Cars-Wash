import type { BayView, WorldVehicle, WorldViewModel } from '../../../domain/contracts'
import { routeLength, sampleRoute } from '../../../domain/sitePlan'

export type OperationArea = 'overview' | 'queue' | 'bays' | 'completed'

export function bayState(bay: BayView, vehicles: WorldVehicle[]) {
  if (bay.occupancy === 'free') return 'Disponible'
  if (bay.occupancy === 'out-of-service') return 'Fuera de servicio'

  const vehicle = vehicles.find((v) => v.worldEntityId === bay.vehicleId)

  return vehicle?.stage === 'assigned'
    ? 'Asignada · traslado'
    : vehicle?.stage === 'ready'
      ? 'Pendiente liberar'
      : 'Ocupada'
}

export const isFinished = (v: WorldVehicle) =>
  v.serviceCompleted !== undefined ||
  ['ready', 'handover', 'exited'].includes(v.stage) ||
  v.stage === 'departing'

/** Stable public alias, independent of names, plates and quote contents. */
export function publicCode(id: string) {
  let hash = 2166136261

  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)

  return `V-${(hash >>> 0).toString(36).toUpperCase().padStart(7, '0')}`
}

export function operationGroups(world: WorldViewModel) {
  const queue = world.vehicles
    .filter((v) => v.queueIndex !== null)
    .sort((a, b) => a.queueIndex! - b.queueIndex!)
  const active = world.vehicles.filter((v) => v.bayId && !isFinished(v))
  const completed = [...world.vehicles.filter(isFinished), ...(world.completed || [])].sort(
    (a, b) => (b.serviceCompleted ?? 0) - (a.serviceCompleted ?? 0),
  )

  return {
    queue,
    active,
    completed,
    available: world.bays.filter((b) => b.occupancy === 'free').length,
    occupied: world.bays.filter((b) => b.occupancy === 'occupied').length,
  }
}

export function vehicleState(v: WorldVehicle) {
  if (v.movement)
    return v.movement.purpose === 'assign'
      ? 'Hacia la bahía'
      : v.movement.purpose === 'queue-shift'
        ? 'Avanzando en la fila'
        : v.movement.purpose === 'exit'
          ? 'Salida autorizada'
          : 'Hacia entrega'
  if (v.stage === 'ready') return 'Servicios terminados · pendiente liberar'
  if (v.stage === 'handover') return 'En entrega · pendiente retiro'
  if (v.stage === 'exited') return 'Entregado'
  if (v.queueIndex !== null) return 'En espera'

  return v.tasks.find((t) => t.status === 'active')?.label || 'Asignado'
}

export function elapsed(v: WorldVehicle, clock: number) {
  if (v.serviceStarted === undefined) return null

  const seconds = Math.max(0, Math.floor((v.serviceCompleted ?? clock) - v.serviceStarted))

  return `${Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')}:${Math.floor((seconds / 60) % 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

export function vehiclePosition(v: WorldVehicle, clock: number) {
  if (!v.movement) return v.position

  const m = v.movement,
    progress = Math.max(0, Math.min(1, (clock - m.startedAt) / m.duration))

  return sampleRoute(m.path, routeLength(m.path) * progress).position
}
