import type { OperationEvent } from './contracts'
import { demoRequest } from '../app/commerceStore'

/** Local sandbox SSE. The renderer consumes events; it does not own the clock. */
export class DemoOperationTransport {
  private events: EventSource | null = null
  private listeners = new Set<(event: OperationEvent) => void>()
  private pausedValue = false
  private offline = () => {
    this.events?.close()
    this.events = null
    this.connection('stale')
  }
  private online = () => this.open()
  private started = false

  constructor(
    private scenario: string,
    private speed: number,
    private connection: (status: 'connecting' | 'connected' | 'stale') => void,
  ) {}

  private query() {
    return `scenario=${this.scenario}&speed=${this.speed}`
  }

  get paused() {
    return this.pausedValue
  }
  set paused(value: boolean) {
    void this.control('pause', { paused: value })
      .then(() => {
        this.pausedValue = value
      })
      .catch(() => this.connection('stale'))
  }

  async control(action: string, extra: Record<string, unknown> = {}) {
    return demoRequest(`tools?${this.query()}`, { sandbox: true, action, ...extra })
  }

  initialize() {
    this.start()
  }

  start() {
    if (!this.started) {
      this.started = true
      window.addEventListener('offline', this.offline)
      window.addEventListener('online', this.online)
    }
    this.open()
  }

  private open() {
    if (this.events) return
    if (!navigator.onLine) {
      this.connection('stale')

      return
    }
    this.connection('connecting')
    this.events = new EventSource(`/api/demo/operation?${this.query()}`)
    this.events.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as OperationEvent

        this.pausedValue = event.frame.paused ?? false
        this.listeners.forEach((l) => l(event))
        this.connection('connected')
      } catch {
        this.connection('stale')
      }
    }
    this.events.onerror = () => this.connection('stale')
  }

  advance() {
    void this.control('advance').catch(() => this.connection('stale'))
  }

  reset() {
    void this.control('reset').catch(() => this.connection('stale'))
  }

  subscribe(listener: (event: OperationEvent) => void) {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  dispose() {
    this.events?.close()
    this.events = null
    this.listeners.clear()
    window.removeEventListener('offline', this.offline)
    window.removeEventListener('online', this.online)
    this.started = false
  }
}
