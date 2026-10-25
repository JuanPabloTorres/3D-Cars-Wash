import type { WorldViewModel, TaskStatus } from './contracts.ts'
import { estimateServiceTime } from './ServiceTimeEstimator.ts'
import { stageDuration } from './DemoOperationSource.ts'
import configuration from '../../server/business-config.json' with { type: 'json' }
import type { VehicleType } from './commerce.ts'
import type { PricingConfiguration } from './businessContent.ts'

/** Entirely synthetic order, owned only inside this DEMO. Never an auth fallback. */
export const demoOrder = {
  id: 'F-0104',
  mode: 'demo' as const,
  worldEntityId: 'demo-vehicle-01',
  vehicle: 'Automóvil conceptual · Plata',
  currency: 'USD',
  services: [
    { id: 'exterior', label: 'Lavado exterior', cents: 3500, duration: { min: 12, max: 18 } },
    { id: 'interior', label: 'Cuidado interior', cents: 2000, duration: { min: 18, max: 25 } },
    { id: 'lights', label: 'Cuidado de focos', cents: 1000, duration: { min: 8, max: 12 } },
  ],
  discountCents: 500,
  taxBasisPoints: 1150,
}

export function orderTotals(order = demoOrder) {
  const subtotal = order.services.reduce((s, i) => s + i.cents, 0),
    taxable = Math.max(0, subtotal - order.discountCents),
    tax = Math.round((taxable * order.taxBasisPoints) / 10000)

  return { subtotal, discount: order.discountCents, tax, total: taxable + tax }
}

export function quoteDemoServices(
  ids: string[],
  type: VehicleType = 'car',
  config: PricingConfiguration = configuration,
) {
  const catalogue = config.services || demoOrder.services

  if (
    ids.some(
      (id) => !catalogue.some((s) => s.id === id && (!('available' in s) || s.available !== false)),
    )
  )
    throw new Error('Uno de los servicios ya no está disponible. Revisa el catálogo vigente.')

  const services = catalogue
    .filter((s) => ids.includes(s.id))
    .map((s) => {
      const cents = config.prices[type]?.[s.id]

      if (typeof cents !== 'number' || !Number.isSafeInteger(cents) || cents < 0)
        throw new Error(
          'Requiere cotización: no hay una tarifa configurada para estos servicios y este tipo de vehículo.',
        )

      return { ...s, cents, durationMinutes: config.durations?.[type]?.[s.id] ?? null }
    })
  const subtotal = services.reduce((sum, s) => sum + s.cents, 0),
    discount = ['exterior', 'interior', 'lights'].every((id) => ids.includes(id))
      ? Math.min(subtotal, config.allServicesDiscountCents)
      : 0,
    tax = Math.round(((subtotal - discount) * config.taxBasisPoints) / 10000)

  return {
    services,
    estimatedMinutes: services.every((s) => s.durationMinutes !== null)
      ? services.reduce((sum, s) => sum + s.durationMinutes!, 0)
      : null,
    subtotal,
    discount,
    tax,
    total: subtotal - discount + tax,
    pricingVersion: config.version,
    taxBasisPoints: config.taxBasisPoints,
  }
}

export function ownDemoOrder(world: WorldViewModel) {
  const vehicle = world.vehicles.find(
    (v) => v.worldEntityId === demoOrder.worldEntityId && v.visibility === 'own',
  )

  if (!vehicle) return null

  const tasks = demoOrder.services.map((s) => ({
    ...s,
    status: (vehicle.tasks.find((t) => t.id === s.id)?.status || 'unknown') as TaskStatus,
  }))
  const queued = vehicle.stage === 'queued' || vehicle.stage === 'arriving',
    bays = world.bays.filter((b) => b.occupancy !== 'out-of-service')
  const planning = [...demoOrder.services, { id: 'inspection', duration: { min: 4, max: 6 } }]
  const durations = (v: typeof vehicle) =>
    planning
      .filter((s) => v.tasks.find((t) => t.id === s.id)?.status !== 'done')
      .map((s) => {
        const active = v.tasks.find((t) => t.id === s.id)?.status === 'active',
          seconds = stageDuration[v.stage]
        const fraction =
          active && seconds
            ? Math.max(0, Math.min(1, 1 - (world.clockSeconds - v.phaseStarted) / seconds))
            : 1

        return { min: s.duration.min * fraction, max: s.duration.max * fraction }
      })
  const workloads = bays.map((b) => {
    const v = world.vehicles.find((v) => v.worldEntityId === b.vehicleId)

    return v
      ? durations(v).reduce((a, d) => ({ min: a.min + d.min, max: a.max + d.max }), {
          min: 0,
          max: 0,
        })
      : { min: 0, max: 0 }
  })

  return {
    ...demoOrder,
    entity: vehicle,
    tasks,
    totals: orderTotals(),
    bay: vehicle.bayId,
    estimate: estimateServiceTime({
      mode: 'demo',
      serviceDurations: planning.map((s) => s.duration),
      pendingDurations: durations(vehicle),
      bayWorkloads: queued ? workloads : [{ min: 0, max: 0 }],
      ahead: queued
        ? world.vehicles
            .filter((v) => v.queueIndex !== null && v.queueIndex < (vehicle.queueIndex ?? 0))
            .map(durations)
        : [],
    }),
  }
}

/** Allow-list projection: never pass private order fields into public cards. */
export function publicVehicleCard(vehicle: {
  operationalState: string
  locationConfidence: string
}) {
  return {
    state: vehicle.operationalState,
    illustrative: vehicle.locationConfidence !== 'confirmed',
  }
}
