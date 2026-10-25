/* Owns local operational state, FIFO assignment and service transitions. Rendering consumes frames; it cannot authorize these changes. */
import type {
  DemoStage,
  OperationEvent,
  OperationSource,
  WorldVehicle,
  BayView,
} from './contracts.ts'
import {
  BAY_IDS,
  bayCenter,
  queueCenter,
  ENTRY,
  EXIT,
  handover,
  bayEntryRoute,
  bayExitRoute,
  bayExitReverseMeters,
  roundedRoute,
  type BayId,
  type XZ,
} from './sitePlan.ts'
import { motionDuration } from './vehicleMotion.ts'

export type DemoScenario = 'mixed' | 'quiet' | 'busy' | 'arrival' | 'operation'

const colors = ['#b5c1c5', '#b2293c', '#215d85', '#e2a846', '#4f7068', '#d4d2c8', '#353e4b']
export const stageDuration: Partial<Record<DemoStage, number>> = {
  washing: 40,
  interior: 30,
  lights: 22,
  inspection: 18,
  ready: 12,
  handover: 20,
}

export function tasksFor(stage: DemoStage): WorldVehicle['tasks'] {
  const stages: DemoStage[] = [
      'washing',
      'interior',
      'lights',
      'inspection',
      'ready',
      'handover',
      'departing',
      'exited',
    ],
    index = stages.indexOf(stage)

  return ['exterior', 'interior', 'lights', 'inspection'].map((id, i) => ({
    id,
    label: ['Exterior', 'Interior', 'Focos', 'Inspección'][i],
    status: index < 0 ? 'pending' : i < index ? 'done' : i === index ? 'active' : 'pending',
  }))
}

export function scenarioFrame(scenario: DemoScenario = 'mixed') {
  const bays: BayView[] = BAY_IDS.map((bayId) => ({
    bayId,
    occupancy: 'free',
    vehicleId: null,
    tasks: [],
  }))
  const vehicles: WorldVehicle[] = []
  const add = (id: number, stage: DemoStage, bayId: BayId | null, queueIndex: number | null) => {
    const position = bayId
      ? bayCenter(bayId)
      : stage === 'arriving'
        ? ENTRY
        : queueCenter(queueIndex || 0)
    const v: WorldVehicle = {
      worldEntityId: `demo-vehicle-${String(id).padStart(2, '0')}`,
      type: (['car', 'suv', 'pickup', 'truck'] as const)[(id - 1) % 4],
      visibility: id === 1 ? 'own' : 'anonymous',
      operationalState: bayId ? 'in-service' : 'queued',
      visualLocation: bayId ? `bay:${bayId}` : stage === 'arriving' ? 'entry' : 'queue',
      locationConfidence: 'demo',
      stage,
      bayId,
      queueIndex,
      color: colors[(id - 1) % colors.length],
      position,
      yaw: bayId ? 0 : Math.PI,
      phaseStarted: 0,
      tasks: tasksFor(stage),
    }

    if (stage === 'arriving') {
      const path = [ENTRY, queueCenter(queueIndex || 0)]

      v.movement = { path, startedAt: 0, duration: motionDuration(path), purpose: 'entry' }
    }
    vehicles.push(v)
    if (bayId) {
      const b = bays.find((b) => b.bayId === bayId)!

      b.occupancy = 'occupied'
      b.vehicleId = v.worldEntityId
      b.tasks = v.tasks
    }
  }

  if (scenario === 'mixed') {
    add(1, 'washing', '01', null)
    add(2, 'interior', '02', null)
    add(3, 'inspection', '05', null)
    bays[3].occupancy = 'out-of-service'
    add(4, 'queued', null, 0)
    add(5, 'queued', null, 1)
    add(6, 'arriving', null, 2)
  }
  if (scenario === 'quiet') {
    add(1, 'washing', '03', null)
  }
  if (scenario === 'busy') {
    BAY_IDS.forEach((id, i) =>
      add(
        i + 1,
        ['washing', 'interior', 'lights', 'inspection', 'washing'][i] as DemoStage,
        id,
        null,
      ),
    )
    add(6, 'queued', null, 0)
    add(7, 'queued', null, 1)
  }
  if (scenario === 'arrival') {
    add(1, 'arriving', null, 2)
    add(2, 'queued', null, 0)
    add(3, 'queued', null, 1)
    add(4, 'interior', '02', null)
  }

  return { clockSeconds: 0, speed: 1, scenario, vehicles, bays, completed: [] as WorldVehicle[] }
}

/** Scenario clock and transport schedule are independent of animation/render completion.
 * Only synthetic records; never writes to a business service. One transport lane lock. */
export class DemoOperationSource implements OperationSource {
  readonly mode = 'demo' as const
  private listeners = new Set<(event: OperationEvent) => void>()
  private revision = 0
  private timer: ReturnType<typeof setInterval> | undefined
  private frame: ReturnType<typeof scenarioFrame>
  private last = 0
  private pausedValue = false
  private selectedServices = new Map<string, Set<string>>()
  private completionTransfers = new Set<string>()
  private nextTurnBays = new Set<BayId>()
  private contractedTasks = new Map<string, { id: string; label: string }[]>()

  snapshot() {
    return structuredClone(this.frame)
  }

  /** Complete local checkpoint, including safe-transfer queues and contracted tasks. */
  checkpoint() {
    return {
      frame: this.snapshot(),
      revision: this.revision,
      selected: [...this.selectedServices].map(([id, ids]) => [id, [...ids]] as [string, string[]]),
      transfers: [...this.completionTransfers],
      nextBays: [...this.nextTurnBays],
      tasks: [...this.contractedTasks],
    }
  }

  restore(saved: ReturnType<DemoOperationSource['checkpoint']>) {
    this.frame = structuredClone(saved.frame)
    this.revision = saved.revision
    this.selectedServices = new Map(saved.selected.map(([id, ids]) => [id, new Set(ids)]))
    this.completionTransfers = new Set(saved.transfers)
    this.nextTurnBays = new Set(saved.nextBays)
    this.contractedTasks = new Map(saved.tasks || [])
  }

  addOrder(
    id: string,
    services: string[],
    color: string,
    type: import('./commerce').VehicleType,
    labels?: { id: string; label: string }[],
  ) {
    if (this.frame.vehicles.some((v) => v.worldEntityId === id)) return

    const used = new Set(
      this.frame.vehicles.filter((v) => v.queueIndex !== null).map((v) => v.queueIndex),
    )
    const index = [0, 1, 2].find((i) => !used.has(i))

    if (index === undefined)
      throw new Error('La fila está completa. Espera una posición disponible.')
    this.selectedServices.set(id, new Set(services))
    this.contractedTasks.set(id, [
      ...services.map((id) => ({
        id,
        label:
          labels?.find((s) => s.id === id)?.label ||
          tasksFor('queued').find((t) => t.id === id)?.label ||
          id,
      })),
      { id: 'inspection', label: 'Inspección' },
    ])

    const v: WorldVehicle = {
      worldEntityId: id,
      type,
      visibility: 'anonymous',
      operationalState: 'queued',
      visualLocation: 'queue',
      locationConfidence: 'demo',
      stage: 'queued',
      bayId: null,
      queueIndex: index,
      color,
      position: queueCenter(index),
      yaw: Math.PI,
      phaseStarted: this.frame.clockSeconds,
      tasks: tasksFor('queued').filter((t) => services.includes(t.id) || t.id === 'inspection'),
    }

    v.tasks = this.contractedTasks.get(id)!.map((task) => ({ ...task, status: 'pending' }))
    this.frame.vehicles.push(v)
    this.emit()
  }

  assignOrder(id: string, bayId: BayId) {
    const v = this.frame.vehicles.find((v) => v.worldEntityId === id),
      bay = this.frame.bays.find((b) => b.bayId === bayId)

    if (!v || v.stage !== 'queued' || v.queueIndex !== 0)
      throw new Error('Sólo el primer vehículo de la fila puede asignarse.')
    if (!bay || bay.occupancy !== 'free') throw new Error('La bahía no está disponible.')
    if (this.frame.vehicles.some((v) => v.movement))
      throw new Error('El carril está ocupado. Espera a que termine el traslado.')

    const slot = v.queueIndex

    v.queueIndex = null
    v.bayId = bayId
    this.setStage(v, 'assigned')
    this.move(v, bayEntryRoute(slot, bayId), 'assign')
    bay.occupancy = 'occupied'
    bay.vehicleId = id
    this.emit()
  }

  advanceVehicle(id: string) {
    const v = this.frame.vehicles.find((v) => v.worldEntityId === id)

    if (!v || v.movement) throw new Error('El vehículo no está disponible para cambiar de tarea.')

    const contracted = this.contractedTasks.get(id)

    if (contracted) {
      const active = v.tasks.findIndex((task) => task.status === 'active')

      if (active < 0) throw new Error('Esta etapa no permite avanzar una tarea.')

      const next = active + 1

      this.setStage(
        v,
        next === contracted.length ? 'ready' : this.taskStage(contracted[next].id),
        next,
      )
      this.emit()

      return
    }

    const chain = this.sequence(v),
      index = chain.indexOf(v.stage)

    if (index < 0 || index >= chain.length - 1)
      throw new Error('Esta etapa no permite avanzar una tarea.')
    this.setStage(v, chain[index + 1])
    this.emit()
  }

  /** Explicit staff authorization for the local mock. Finishes actual contracted
   * tasks, then waits for a safe transfer; browser animations have no authority. */
  completeService(id: string) {
    const v = this.frame.vehicles.find((v) => v.worldEntityId === id)

    if (this.completionTransfers.has(id)) return
    if (
      !v?.bayId ||
      v.movement ||
      !['washing', 'interior', 'lights', 'inspection', 'ready'].includes(v.stage)
    )
      throw new Error('El vehículo debe estar atendido en una bahía, sin traslado.')
    this.setStage(v, 'ready')
    this.completionTransfers.add(id)
    this.emit()
  }

  releaseVehicle(id: string, exit = false) {
    const v = this.frame.vehicles.find((v) => v.worldEntityId === id)

    if (!v || v.movement || this.frame.vehicles.some((v) => v.movement))
      throw new Error('El carril está ocupado o el vehículo está en traslado.')
    if (exit) {
      if (v.stage !== 'handover') throw new Error('El vehículo debe estar en entrega.')
      this.setStage(v, 'departing')
      this.move(v, roundedRoute([handover, [handover[0], EXIT[1]], EXIT]), 'exit')
    } else {
      if (v.stage !== 'ready' || !v.bayId) throw new Error('Primero debe terminar la inspección.')
      if (this.frame.vehicles.some((v) => v.visualLocation === 'handover'))
        throw new Error('La posición de entrega está ocupada.')

      const bay = this.frame.bays.find((b) => b.bayId === v.bayId)!

      this.move(v, bayExitRoute(v.bayId), 'handover', bayExitReverseMeters(v.bayId))
      v.bayId = null
      this.setStage(v, 'departing')
      bay.occupancy = 'free'
      bay.vehicleId = null
    }
    this.emit()
  }

  removeQueued(id: string) {
    const v = this.frame.vehicles.find((v) => v.worldEntityId === id)

    if (v && (v.stage !== 'queued' || v.movement))
      throw new Error('La atención ya comenzó. Consulta con recepción para revisar alternativas.')
    this.frame.vehicles = this.frame.vehicles.filter((v) => v.worldEntityId !== id)
    this.selectedServices.delete(id)
    this.contractedTasks.delete(id)
    this.emit()
  }

  setBayAvailability(id: BayId, available: boolean) {
    const bay = this.frame.bays.find((b) => b.bayId === id)

    if (!bay || bay.vehicleId) throw new Error('No puede desactivarse una bahía ocupada.')
    bay.occupancy = available ? 'free' : 'out-of-service'
    this.emit()
  }

  private taskStage(id: string): DemoStage {
    return id === 'inspection'
      ? 'inspection'
      : id === 'interior'
        ? 'interior'
        : id === 'lights'
          ? 'lights'
          : 'washing'
  }

  private sequence(v: WorldVehicle): DemoStage[] {
    const plan = this.contractedTasks.get(v.worldEntityId)

    if (plan) return [...plan.map((t) => this.taskStage(t.id)), 'ready']

    const selected = this.selectedServices.get(v.worldEntityId)

    return [
      ...(['washing', 'interior', 'lights'] as DemoStage[]).filter(
        (stage) => !selected || selected.has(stage === 'washing' ? 'exterior' : stage),
      ),
      'inspection',
      'ready',
    ]
  }

  configureOrder(
    id: string,
    services: string[],
    color: string,
    type: import('./commerce').VehicleType = 'car',
  ) {
    const v = this.frame.vehicles.find((v) => v.worldEntityId === id)

    if (!v?.bayId || v.movement) return false
    this.selectedServices.set(id, new Set(services))
    v.color = color
    v.type = type
    this.setStage(v, this.sequence(v)[0])
    this.emit()

    return true
  }

  get paused() {
    return this.pausedValue
  }
  set paused(value: boolean) {
    this.pausedValue = value
    this.emit()
  }

  constructor(
    private scenario: DemoScenario = 'mixed',
    private speed = 1,
  ) {
    this.frame = scenarioFrame(scenario)
    this.frame.speed = speed
  }

  initialize() {
    this.emit()
  }

  start() {
    if (this.timer) return
    this.last = performance.now()
    this.timer = setInterval(() => {
      const now = performance.now(),
        dt = Math.min((now - this.last) / 1000, 1)

      this.last = now
      if (!this.paused) this.tick(dt * this.speed)
    }, 250)
  }

  private emit() {
    for (const v of this.frame.vehicles)
      v.assignedWorkerId =
        v.bayId && !v.movement && v.tasks.some((t) => t.status === 'active')
          ? `demo-worker-${v.bayId}`
          : null
    for (const b of this.frame.bays)
      b.tasks = this.frame.vehicles.find((v) => v.worldEntityId === b.vehicleId)?.tasks || []

    const revision = ++this.revision
    const event: OperationEvent = {
      eventId: `demo-event-${revision}`,
      revision,
      occurredAt: new Date().toISOString(),
      mode: 'demo',
      frame: { ...structuredClone(this.frame), paused: this.paused },
    }

    this.listeners.forEach((l) => l(event))
  }

  private setStage(v: WorldVehicle, stage: DemoStage, taskIndex?: number) {
    if (
      ['washing', 'interior', 'lights', 'inspection'].includes(stage) &&
      v.serviceStarted === undefined
    )
      v.serviceStarted = this.frame.clockSeconds
    if (stage === 'ready' && v.serviceCompleted === undefined) {
      v.serviceCompleted = this.frame.clockSeconds
      v.completedAt = new Date().toISOString()
    }
    v.stage = stage
    v.phaseStarted = this.frame.clockSeconds

    const selected = this.selectedServices.get(v.worldEntityId)

    v.tasks = tasksFor(stage).filter(
      (t) => !selected || selected.has(t.id) || t.id === 'inspection',
    )
    v.operationalState =
      stage === 'inspection'
        ? 'inspection'
        : stage === 'ready'
          ? 'ready'
          : ['washing', 'interior', 'lights'].includes(stage)
            ? 'in-service'
            : stage === 'queued'
              ? 'queued'
              : 'transit'

    const plan = this.contractedTasks.get(v.worldEntityId)

    if (plan) {
      const index =
        v.serviceCompleted !== undefined
          ? plan.length
          : (taskIndex ??
            (['washing', 'interior', 'lights', 'inspection'].includes(stage)
              ? plan.findIndex((t) => this.taskStage(t.id) === stage)
              : -1))

      v.tasks = plan.map((task, i) => ({
        ...task,
        status: index < 0 ? 'pending' : i < index ? 'done' : i === index ? 'active' : 'pending',
      }))
    }
  }

  private move(
    v: WorldVehicle,
    path: XZ[],
    purpose: NonNullable<WorldVehicle['movement']>['purpose'],
    reverseMeters = 0,
  ) {
    v.movement = {
      path,
      startedAt: this.frame.clockSeconds,
      duration: motionDuration(path, reverseMeters),
      reverseMeters,
      purpose,
    }
  }

  tick(dt: number) {
    this.frame.clockSeconds += dt

    const time = this.frame.clockSeconds

    for (const v of this.frame.vehicles) {
      const m = v.movement

      if (m && time >= m.startedAt + m.duration) {
        v.position = m.path[m.path.length - 1]
        v.movement = undefined
        if (m.purpose === 'entry' || m.purpose === 'queue-shift') {
          v.visualLocation = 'queue'
          this.setStage(v, 'queued')
          v.yaw = Math.PI
        }
        if (m.purpose === 'assign') {
          v.visualLocation = `bay:${v.bayId!}`
          this.setStage(v, this.sequence(v)[0])
          v.yaw = 0
        }
        if (m.purpose === 'handover') {
          v.visualLocation = 'handover'
          this.setStage(v, 'handover')
          v.yaw = 0
        }
        if (m.purpose === 'exit') {
          this.setStage(v, 'exited')
          v.visualLocation = 'exit'
        }
      } else if (
        this.scenario !== 'operation' &&
        !m &&
        stageDuration[v.stage] &&
        time - v.phaseStarted >= stageDuration[v.stage]!
      ) {
        const chain = this.sequence(v)
        const index = chain.indexOf(v.stage)

        if (index >= 0 && index < chain.length - 1) this.setStage(v, chain[index + 1])
      }
    }
    // Public operational history: last 50 physically exited records, server lifetime.
    // No commercial/contact data is stored here; cancellation is never completion.
    for (const v of this.frame.vehicles.filter((v) => v.stage === 'exited')) {
      this.frame.completed.push(structuredClone(v))
      this.selectedServices.delete(v.worldEntityId)
      this.contractedTasks.delete(v.worldEntityId)
    }
    this.frame.completed = this.frame.completed.slice(-50)
    this.frame.vehicles = this.frame.vehicles.filter((v) => v.stage !== 'exited')
    if (!this.frame.vehicles.some((v) => v.movement)) {
      // Only an explicit completeService command enables automatic succession.
      // Keep a full collection area and the single transport lane protected.
      const completed = this.frame.vehicles.find(
        (v) => this.completionTransfers.has(v.worldEntityId) && v.stage === 'ready' && v.bayId,
      )

      if (completed && !this.frame.vehicles.some((v) => v.visualLocation === 'handover')) {
        const freed = completed.bayId!

        this.releaseVehicle(completed.worldEntityId)
        this.completionTransfers.delete(completed.worldEntityId)
        this.nextTurnBays.add(freed)
      } else {
        const queue = this.frame.vehicles
          .filter((v) => v.stage === 'queued')
          .sort((a, b) => a.queueIndex! - b.queueIndex!)
        const available = this.frame.bays.find(
          (b) => this.nextTurnBays.has(b.bayId) && b.occupancy === 'free',
        )

        if (available && queue[0]?.queueIndex === 0) {
          this.assignOrder(queue[0].worldEntityId, available.bayId)
          this.nextTurnBays.delete(available.bayId)
        }
      }
    }
    if (!this.frame.vehicles.some((v) => v.movement)) {
      const ready = this.frame.vehicles.find(
        (v) => v.stage === 'ready' && time - v.phaseStarted >= 12,
      )
      const deliver = this.frame.vehicles.find(
        (v) => v.stage === 'handover' && time - v.phaseStarted >= stageDuration.handover!,
      )

      if (this.scenario !== 'operation' && deliver) {
        this.setStage(deliver, 'departing')
        this.move(deliver, roundedRoute([handover, [handover[0], EXIT[1]], EXIT]), 'exit')
      } else if (
        this.scenario !== 'operation' &&
        ready &&
        !this.frame.vehicles.some((v) => v.stage === 'handover')
      ) {
        const id = ready.bayId!

        ready.bayId = null
        this.setStage(ready, 'departing')
        this.move(ready, bayExitRoute(id), 'handover', bayExitReverseMeters(id))

        const b = this.frame.bays.find((b) => b.bayId === id)!

        b.occupancy = 'free'
        b.vehicleId = null
        b.tasks = []
      } else {
        const queue = this.frame.vehicles
          .filter((v) => v.stage === 'queued')
          .sort((a, b) => a.queueIndex! - b.queueIndex!)
        const free = this.frame.bays.find((b) => b.occupancy === 'free'),
          front = queue[0]

        if (this.scenario !== 'operation' && front && free && front.queueIndex === 0) {
          const slot = front.queueIndex

          front.queueIndex = null
          front.bayId = free.bayId
          this.setStage(front, 'assigned')
          this.move(front, bayEntryRoute(slot, free.bayId), 'assign')
          free.occupancy = 'occupied'
          free.vehicleId = front.worldEntityId
        } else if (front) {
          const shift = queue.find((v, i) => v.queueIndex !== i)

          if (shift) {
            const old = shift.queueIndex!,
              index = queue.indexOf(shift)

            shift.queueIndex = index
            this.move(shift, [queueCenter(old), queueCenter(index)], 'queue-shift')
          }
        }
      }
    }
    this.emit()
  }

  advance() {
    const v = this.frame.vehicles.find((v) => v.visibility === 'own' && !v.movement)

    if (v) {
      const chain = this.sequence(v)
      const i = chain.indexOf(v.stage)

      if (i >= 0 && i < chain.length - 1) this.setStage(v, chain[i + 1])
      else if (v.stage === 'ready') v.phaseStarted = this.frame.clockSeconds - 12
      this.emit()
    }
  }

  reset() {
    this.contractedTasks.clear()
    this.selectedServices.clear()
    this.completionTransfers.clear()
    this.nextTurnBays.clear()
    this.frame = scenarioFrame(this.scenario)
    this.frame.speed = this.speed
    this.emit()
  }

  subscribe(listener: (event: OperationEvent) => void) {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  dispose() {
    clearInterval(this.timer)
    this.listeners.clear()
  }
}
