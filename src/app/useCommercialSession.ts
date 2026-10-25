import { useEffect } from 'react'
import { useCommerce } from './commerceStore'

/** Shares private-session updates between the full world and interactive layers.
 * Owns SSE, fallback polling and cleanup; it never starts the bay simulation.
 * refreshOnVisible preserves the full-world shell's immediate tab-return refresh.
 */
export function useCommercialSession({
  refreshOnVisible = false,
}: { refreshOnVisible?: boolean } = {}) {
  useEffect(() => {
    let disposed = false,
      events: EventSource | null = null

    void useCommerce
      .getState()
      .refresh()
      .then(() => {
        if (disposed) return
        events = new EventSource('/api/demo/events')
        events.onmessage = (event) => {
          try {
            useCommerce.getState().receive(JSON.parse(event.data))
            void useCommerce.getState().refresh(true)
          } catch {
            /* Refresh recovers an incomplete stream event. */
          }
        }
        events.onerror = () => useCommerce.setState({ connected: false })
      })

    const refresh = () => {
      if (!document.hidden) void useCommerce.getState().refresh(true)
    }
    const timer = setInterval(refresh, 5000)

    // The full-world shell also refreshes immediately when returning to the tab.
    if (refreshOnVisible) document.addEventListener('visibilitychange', refresh)

    return () => {
      disposed = true
      events?.close()
      clearInterval(timer)
      if (refreshOnVisible) document.removeEventListener('visibilitychange', refresh)
    }
  }, [refreshOnVisible])
}
