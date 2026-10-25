import { Component, Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { WeatherEnvironmentController } from '../environment/WeatherEnvironmentController'
import { EnvironmentBoundary } from '../environment/EnvironmentBoundary'
import { ACESFilmicToneMapping, PCFShadowMap } from 'three'
import { useApp } from '../app/store'
import { WorldLayout } from './WorldLayout'
import { CameraController } from './navigation/CameraController'
import { WorldBadges } from './badges/WorldBadges'
import { diagnostics } from './diagnostics'

function Ready() {
  const { gl } = useThree(),
    last = useRef(0),
    painted = useRef(0),
    readyFrame = useRef(0)

  useEffect(() => {
    const context = gl.getContext(),
      extension = context.getExtension('WEBGL_debug_renderer_info')

    diagnostics.renderer = extension
      ? context.getParameter(extension.UNMASKED_RENDERER_WEBGL)
      : context.getParameter(context.RENDERER)

    const lost = (event: Event) => {
      event.preventDefault()
      diagnostics.contextLost = true
      useApp
        .getState()
        .set({ error: 'Se interrumpió la conexión gráfica. Recarga la visita para continuar.' })
    }

    gl.domElement.addEventListener('webglcontextlost', lost)

    return () => {
      cancelAnimationFrame(readyFrame.current)
      gl.domElement.removeEventListener('webglcontextlost', lost)
    }
  }, [gl])
  useFrame((_, delta) => {
    // Readiness follows actual rendered world frames, not asset resolution alone.
    if (++painted.current === 2)
      readyFrame.current = requestAnimationFrame(() => useApp.getState().set({ ready: true }))
    if (delta > 0 && delta < 1) {
      diagnostics.frames.push(delta * 1000)
      if (diagnostics.frames.length > 900) diagnostics.frames.shift()
    }
    if (++last.current % 30 === 0) {
      diagnostics.drawCalls = gl.info.render.calls
      diagnostics.triangles = gl.info.render.triangles
      diagnostics.geometries = gl.info.memory.geometries
      diagnostics.textures = gl.info.memory.textures
    }
  })

  return null
}

class SceneErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch() {
    useApp.getState().set({ sceneFailed: true })
  }

  render() {
    if (this.state.error)
      return (
        <div className="scene-error" role="alert">
          <h1>No se pudo cargar la visita</h1>
          <p>Comprueba tu conexión y vuelve a intentar.</p>
          <button className="primary" onClick={() => location.reload()}>
            Reintentar carga
          </button>
        </div>
      )

    return this.props.children
  }
}

export function WorldScene() {
  const mobile = window.matchMedia('(max-width:600px)').matches

  return (
    <SceneErrorBoundary>
      <Canvas
        shadows={{ type: PCFShadowMap }}
        dpr={[1, mobile ? 1.25 : 1.5]}
        camera={{ fov: 65, near: 0.08, far: 500, position: [-7, 1.66, 14.5] }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.05
        }}
      >
        <Suspense fallback={null}>
          <WeatherEnvironmentController />
          <EnvironmentBoundary />
          <WorldLayout />
          <WorldBadges />
          <Ready />
        </Suspense>
        <CameraController />
      </Canvas>
    </SceneErrorBoundary>
  )
}
