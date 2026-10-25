import { describe, it, expect } from 'vitest'
import { quoteDemoServices } from '../../src/domain/DemoOrderSource'
import {
  answerBusinessQuestion,
  businessContent,
  type PricingConfiguration,
} from '../../src/domain/businessContent'
import configuration from '../../server/business-config.json'
import { DemoOperationSource } from '../../src/domain/DemoOperationSource'
import type { OperationEvent } from '../../src/domain/contracts'
describe('category pricing and authorized information', () => {
  it('quotes existing car rates and rejects each unconfigured category', () => {
    expect(quoteDemoServices(['exterior'], 'car').total).toBe(3903)
    for (const type of ['pickup', 'suv', 'truck'] as const)
      expect(() => quoteDemoServices(['exterior'], type)).toThrow('Requiere cotización')
  })
  it('uses injected category configuration and freezes original quote values', () => {
    const config: PricingConfiguration = structuredClone(configuration),
      q = quoteDemoServices(['exterior'], 'car', config)
    config.prices.pickup.exterior = 4400
    expect(quoteDemoServices(['exterior'], 'pickup', config).subtotal).toBe(4400)
    config.prices.car.exterior = 9000
    expect(q.subtotal).toBe(3500)
    expect(quoteDemoServices(['exterior'], 'car', config).subtotal).toBe(9000)
  })
  it('does not turn missing hours or unknown questions into invented answers', () => {
    expect(answerBusinessQuestion('hours').known).toBe(false)
    expect(answerBusinessQuestion('other').known).toBe(false)
    expect(answerBusinessQuestion('process').known).toBe(true)
    expect(businessContent.contactRequestsAvailable).toBe(false)
    expect(businessContent.contact).toBeNull()
    expect(businessContent.offers).toEqual([])
  })
  it('projects all four bodies and retains identity and category after an assignment', () => {
    const source = new DemoOperationSource('mixed')
    let event: OperationEvent | null = null
    source.subscribe((e) => (event = e))
    source.initialize()
    expect(new Set(event!.frame.vehicles.map((v) => v.type)).size).toBe(4)
    expect(source.configureOrder('demo-vehicle-01', ['exterior'], '#123456', 'pickup')).toBe(true)
    source.advance()
    const own = event!.frame.vehicles.find((v) => v.worldEntityId === 'demo-vehicle-01')!
    expect(own.type).toBe('pickup')
    expect(own.color).toBe('#123456')
    expect(own.tasks.some((t) => t.id === 'interior')).toBe(false)
    source.dispose()
  })
})
