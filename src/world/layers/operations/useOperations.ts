import { useEffect, useState } from 'react'
import { DemoOperationTransport } from '../../../domain/DemoOperationTransport'
import { initialWorld, projectOperation } from '../../../domain/OperationProjection'

/** Read-only observer: only existing admin commands may advance business stages. */
export function useOperations() {
  const [world, setWorld] = useState(initialWorld),
    [connection, setConnection] = useState<'connecting' | 'connected' | 'stale'>('connecting'),
    [paused, setPaused] = useState(false)

  useEffect(() => {
    const source = new DemoOperationTransport('operation', 1, setConnection)
    const unsubscribe = source.subscribe((event) => {
      setWorld((current) => projectOperation(current, event))
      setPaused(!!event.frame.paused)
    })

    source.start()

    return () => {
      unsubscribe()
      source.dispose()
    }
  }, [])

  return { world, connection, paused }
}
