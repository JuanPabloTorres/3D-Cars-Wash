import { describe, it, expect } from 'vitest'
import { estimateServiceTime } from '../../src/domain/ServiceTimeEstimator'
import {
  demoOrder,
  orderTotals,
  publicVehicleCard,
  ownDemoOrder,
  quoteDemoServices,
} from '../../src/domain/DemoOrderSource'
import { initialWorld as emptyWorld } from '../../src/domain/OperationProjection'
import { scenarioFrame } from '../../src/domain/DemoOperationSource'
import { weatherFromForecast, validCoordinates } from '../../src/environment/weather'
import { motionDuration, sampleVehicleMovement } from '../../src/domain/vehicleMotion'
import { bayExitRoute, bayExitReverseMeters } from '../../src/domain/sitePlan'
// Estimates below deliberately exercise a synthetic fixture. The actual initial
// operation is empty and must never acquire these vehicles implicitly.
const initialWorld = { ...emptyWorld, ...scenarioFrame('mixed') }
describe('honest estimates and privacy', () => {
  it('prices use integer cents and configured DEMO tax', () => {
    expect(orderTotals()).toEqual({ subtotal: 6500, discount: 500, tax: 690, total: 6690 })
  })
  it('quotes recalculate without mutating the illustrative order', () => {
    const before = JSON.stringify(demoOrder)
    expect(quoteDemoServices(['exterior', 'interior']).total).toBe(6133)
    expect(JSON.stringify(demoOrder)).toBe(before)
  })
  it('estimates missing workloads are unavailable, not inferred from car count', () => {
    expect(
      estimateServiceTime({
        mode: 'live',
        serviceDurations: null,
        pendingDurations: null,
        bayWorkloads: null,
        ahead: null,
      }),
    ).toBeNull()
    const e = estimateServiceTime({
      mode: 'demo',
      serviceDurations: [{ min: 10, max: 20 }],
      pendingDurations: [{ min: 5, max: 8 }],
      bayWorkloads: [
        { min: 10, max: 12 },
        { min: 5, max: 7 },
      ],
      ahead: [[{ min: 6, max: 8 }]],
    })!
    expect(e.queue).toEqual({ min: 10, max: 12 })
    expect(e.totalRemaining).toEqual({ min: 15, max: 20 })
    expect(e.historicalAverageMinutes).toBeNull()
  })
  it('anonymous projection drops everything private', () => {
    const card = publicVehicleCard({
      ...initialWorld.vehicles[0],
      name: 'PRIVATE',
      plate: 'SECRET',
      order: demoOrder,
      total: 6690,
    } as any)
    expect(Object.keys(card)).toEqual(['state', 'illustrative'])
    expect(JSON.stringify(card)).not.toMatch(/SECRET|PRIVATE|F-0104|6690/)
  })
  it('own order requires own visibility', () => {
    expect(ownDemoOrder(initialWorld)?.id).toBe('F-0104')
    expect(
      ownDemoOrder({
        ...initialWorld,
        vehicles: initialWorld.vehicles.map((v) => ({ ...v, visibility: 'anonymous' })),
      }),
    ).toBeNull()
  })
  it('remaining duration includes inspection and discounts elapsed active work', () => {
    const order = ownDemoOrder({ ...initialWorld, clockSeconds: 20 })!
    expect(order.estimate?.configuredService).toEqual({ min: 42, max: 61 })
    expect(order.estimate?.totalRemaining).toEqual({ min: 36, max: 52 })
  })
})
describe('vehicle acceleration and gear change', () => {
  it('starts smoothly, brakes, and preserves front orientation across reverse and drive', () => {
    const path = bayExitRoute('01'),
      reverse = bayExitReverseMeters('01'),
      m = {
        path,
        reverseMeters: reverse,
        startedAt: 0,
        duration: motionDuration(path, reverse),
        purpose: 'handover' as const,
      },
      gearAt = reverse / 2.8 + 1
    expect(sampleVehicleMovement(m, 0.1).meters).toBeLessThan(0.03)
    expect(sampleVehicleMovement(m, gearAt + 0.2).meters).toBeCloseTo(reverse)
    const a = sampleVehicleMovement(m, gearAt + 0.6),
      b = sampleVehicleMovement(m, gearAt + 0.8)
    expect(Math.abs(Math.atan2(Math.sin(a.yaw - b.yaw), Math.cos(a.yaw - b.yaw)))).toBeLessThan(
      0.02,
    )
    expect(sampleVehicleMovement(m, m.duration).position[0]).toBeCloseTo(50)
  })
})
describe('weather adaptation', () => {
  it('validates location and distinguishes forecast conditions', () => {
    expect(validCoordinates({ latitude: 91, longitude: 0 })).toBe(false)
    expect(weatherFromForecast({ shortForecast: 'Scattered Showers', isDaytime: true })).toBe(
      'rain',
    )
    expect(weatherFromForecast({ shortForecast: 'Partly Cloudy', isDaytime: true })).toBe(
      'partly-cloudy',
    )
    expect(weatherFromForecast({ shortForecast: 'Clear', isDaytime: false })).toBe('night')
  })
})
