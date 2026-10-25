/** Staff login and first-install bootstrap share server authentication; the selected screen does not grant a role. */
import { useEffect, useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { demoRequest, useCommerce } from '../../app/commerceStore'

export function StaffLogin({
  employee,
  busy,
  error,
  login,
}: {
  employee: boolean
  busy: boolean
  error: string
  login: (username: string, password: string) => Promise<boolean>
}) {
  const [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [name, setName] = useState(''),
    [key, setKey] = useState('')
  const [setup, setSetup] = useState(false),
    [loading, setLoading] = useState(true),
    [localError, setLocalError] = useState('')

  useEffect(() => {
    let active = true

    void useCommerce
      .getState()
      .refresh()
      .then(() => demoRequest('session'))
      .then((s) => {
        if (active) setSetup(s.setupRequired)
      })
      .catch(() => {
        if (active) setLocalError('No se pudo conectar con el servidor.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function submit() {
    setLocalError('')
    setLoading(true)
    try {
      if (setup) {
        await demoRequest('admin/setup', { key, username, name, password })
        setSetup(false)
        setKey('')
      }
      if (await login(username, password)) setPassword('')
    } catch (e) {
      setLocalError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login">
      <aside className="staff-login-story">
        <small>CAR WASH · EQUIPO</small>
        <h1>Cada detalle cuenta.</h1>
        <p>Coordina la atención, cuida cada servicio y mantén al cliente informado.</p>
      </aside>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <div className="admin-symbol">
          <LockKeyhole />
        </div>
        <small>{employee ? 'PERSONAL' : 'ADMINISTRACIÓN'} · ACCESO LOCAL</small>
        <h2>{setup ? 'Configura tu administrador' : 'Bienvenido de nuevo'}</h2>
        <p>
          {setup
            ? 'Crea la primera cuenta del establecimiento. La clave de instalación está en el archivo local server/.local-admin-token.'
            : 'Entra con tu cuenta de trabajo para continuar.'}
        </p>
        {setup && (
          <>
            <label className="field">
              Clave de instalación
              <input
                type="password"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="off"
                maxLength={200}
              />
            </label>
            <label className="field">
              Nombre completo
              <input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
          </>
        )}
        <label className="field">
          Usuario
          <input
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={60}
            pattern="[a-zA-Z0-9._-]{3,60}"
          />
        </label>
        <label className="field">
          Contraseña
          <input
            type="password"
            required
            autoComplete={setup ? 'new-password' : 'current-password'}
            minLength={setup ? 12 : 1}
            maxLength={200}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {setup && <small>Mínimo 12 caracteres.</small>}
        <button className="primary wide" disabled={busy || loading}>
          {busy || loading ? 'Conectando…' : setup ? 'Crear cuenta y entrar' : 'Iniciar sesión'}
        </button>
        {(localError || error) && (
          <p role="alert" className="form-error">
            {localError || error}
          </p>
        )}
        <a href="/?layer=reception">Volver a la visita</a>
        <p className="staff-login-note">
          <ShieldCheck size={15} /> Datos conservados en este equipo · SQLite
        </p>
      </form>
    </main>
  )
}
