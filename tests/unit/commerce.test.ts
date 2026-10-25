import { describe, it, expect } from 'vitest'
import { validateRegistration } from '../../src/domain/commerce'
import { DemoOperationSource } from '../../src/domain/DemoOperationSource'
import { projectOperation, initialWorld } from '../../src/domain/OperationProjection'
import type { OperationEvent } from '../../src/domain/contracts'
describe('commercial and operational contracts', () => {
  it('keeps four distinct vehicle categories without requiring personal data in demo', () => {
    for (const type of ['car', 'pickup', 'truck', 'suv'] as const)
      expect(validateRegistration({ type, color: 'Plata', contact: '' })).toBeNull()
    expect(validateRegistration({ type: 'car', color: 'Plata', contact: 'incompleto' })).toMatch(
      /Revisa/,
    )
  })
  it('assigns only selected tasks, retains color and removes worker on ready', () => {
    const source = new DemoOperationSource('quiet')
    let last: OperationEvent | null = null
    source.subscribe((e) => (last = e))
    source.initialize()
    expect(source.configureOrder('demo-vehicle-01', ['lights'], '#b2293c')).toBe(true)
    let own = last!.frame.vehicles[0]
    expect(own.stage).toBe('lights')
    expect(own.tasks.map((t) => t.id)).toEqual(['lights', 'inspection'])
    expect(own.assignedWorkerId).toBe('demo-worker-03')
    expect(own.color).toBe('#b2293c')
    source.advance()
    expect(last!.frame.vehicles[0].stage).toBe('inspection')
    source.advance()
    expect(last!.frame.vehicles[0].assignedWorkerId).toBeNull()
    source.dispose()
  })
  it('propagates pause without waiting for a running animation clock', () => {
    const source = new DemoOperationSource()
    let last: OperationEvent | null = null
    source.subscribe((e) => (last = e))
    source.initialize()
    source.paused = true
    expect(last!.frame.paused).toBe(true)
    expect(last!.frame.clockSeconds).toBe(0)
    source.dispose()
  })
  it('old and duplicate snapshots cannot roll tasks back', () => {
    const source = new DemoOperationSource()
    const events: OperationEvent[] = []
    source.subscribe((e) => events.push(e))
    source.initialize()
    source.advance()
    const latest = projectOperation(projectOperation(initialWorld, events[0]), events[1])
    expect(projectOperation(latest, events[0])).toBe(latest)
    expect(projectOperation(latest, events[1])).toBe(latest)
    source.dispose()
  })
})
