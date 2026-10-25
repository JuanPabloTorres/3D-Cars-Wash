import { useEffect, useState } from 'react'
import { CarFront, ArrowLeft } from 'lucide-react'
import { demoRequest, useCommerce } from '../../app/commerceStore'
import { CustomerAccess } from './CustomerAccess'
import './customer-login.css'

/** Full-page access after logout. Only a server-confirmed identity may redirect;
 * a failed bootstrap keeps submission disabled until an explicit retry. */
export function CustomerLogin() {
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    setReady(false)
    setError('')
    void (async () => {
      try {
        await useCommerce.getState().refresh()
        if (!useCommerce.getState().connected)
          throw new Error('No se pudo conectar con el servidor. Inténtalo de nuevo.')

        const session = await demoRequest('session')

        if (!active) return

        const destination =
          session.role === 'admin'
            ? '/admin'
            : session.role === 'employee'
              ? '/employee'
              : session.profile?.account
                ? '/world3d'
                : null

        if (destination) window.location.replace(destination)
        else setReady(true)
      } catch (e) {
        if (active) setError((e as Error).message)
      }
    })()

    return () => {
      active = false
    }
  }, [attempt])

  return (
    <main className="customer-login">
      <aside className="customer-login-story">
        <CarFront size={40} />
        <small>CAR WASH · TU VISITA</small>
        <h1>Tu auto, en buenas manos.</h1>
        <p>Consulta tus servicios y acompaña cada paso del cuidado de tu vehículo.</p>
      </aside>
      <div className="customer-login-card">
        <CustomerAccess
          disabled={!ready}
          onAuthenticated={() => window.location.replace('/world3d')}
        />
        {!ready && !error && <p role="status">Preparando el acceso…</p>}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button onClick={() => setAttempt((value) => value + 1)}>Reintentar conexión</button>
          </div>
        )}
        <a className="customer-login-back" href="/world3d">
          <ArrowLeft size={16} /> Explorar como visitante
        </a>
      </div>
    </main>
  )
}
