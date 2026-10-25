import { useEffect, useRef, useState } from 'react'
import { demoRequest, useCommerce } from '../../app/commerceStore'
import type { AdminSnapshot } from '../../domain/administration'
import type { PricingConfiguration } from '../../domain/businessContent'

/** Owns UI transport and the unsaved configuration draft. Authorization and
 * business transitions are checked by demoApi, never by this hook. A polling
 * response updates live data but cannot overwrite an operator's unsaved edit. */
export function useAdminSession(employee = false) {
  const [data, setData] = useState<AdminSnapshot | null>(null),
    [config, setConfig] = useState<PricingConfiguration | null>(null)
  const [authorized, setAuthorized] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [connected, setConnected] = useState(false)
  const mounted = useRef(true),
    inFlight = useRef(false),
    requestRevision = useRef(0)
  const accept = (next: AdminSnapshot) => {
    if (!mounted.current) return
    setData(next)
    setConfig((old) => old || structuredClone(next.configuration))
    setConnected(true)
  }
  const refresh = async () => {
    if (inFlight.current) return

    const revision = ++requestRevision.current

    try {
      const next = await demoRequest('admin/snapshot')

      if (revision === requestRevision.current) accept(next)
    } catch (e) {
      setConnected(false)
      if (
        (
          e as {
            status?: number
          }
        ).status === 403
      )
        setAuthorized(false)
    }
  }

  useEffect(() => {
    mounted.current = true
    void useCommerce
      .getState()
      .refresh()
      .then(async () => {
        const session = await demoRequest('session')

        if (
          mounted.current &&
          (session.role === 'admin' || (employee && session.role === 'employee'))
        )
          setAuthorized(true)
      })
      .catch(() => {
        if (mounted.current) setError('No se pudo iniciar la sesión local.')
      })

    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    if (!authorized) return
    void refresh()

    const timer = setInterval(refresh, 1800)

    return () => clearInterval(timer)
  }, [authorized])

  async function action(path: string, body: unknown, success: string) {
    if (inFlight.current) return null
    inFlight.current = true
    requestRevision.current++
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const next = await demoRequest(path, body)

      if (next.configuration) accept(next)
      setNotice(success)

      return next as AdminSnapshot
    } catch (e) {
      setError((e as Error).message)

      return null
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  async function login(username: string, password: string) {
    if (inFlight.current) return false
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      await useCommerce.getState().refresh()
      await demoRequest('admin/login', {
        username,
        password,
        portal: employee ? 'employee' : 'admin',
      })
      setAuthorized(true)
      await refresh()

      return true
    } catch (e) {
      setError((e as Error).message)

      return false
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  async function logout() {
    requestRevision.current++
    try {
      await useCommerce.getState().logout()
      setAuthorized(false)
      setData(null)
      setConfig(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function save() {
    if (!config) return

    const saved = await action(
      'admin/configuration',
      { expectedVersion: config.version, configuration: config },
      'Configuración guardada y publicada.',
    )

    if (saved?.configuration) setConfig(structuredClone(saved.configuration))
  }

  return {
    data,
    config,
    setConfig,
    authorized,
    busy,
    error,
    notice,
    connected,
    refresh,
    action,
    login,
    logout,
    save,
    clearMessages: () => {
      setError('')
      setNotice('')
    },
  }
}
