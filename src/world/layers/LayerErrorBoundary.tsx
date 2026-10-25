import { Component, type ReactNode } from 'react'

/** Failed scene resources must leave a recoverable screen, not an endless load. */
export class LayerErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? (
      <main className="ground-layer">
        <section className="reception-invitation" role="alert">
          <h1>No se pudo cargar la recepción</h1>
          <p>Uno de los recursos no está disponible. Tu borrador se conserva.</p>
          <button className="primary" onClick={() => location.reload()}>
            Reintentar
          </button>
          <p>
            <a href="/?layer=landscape">Volver al paisaje</a>
          </p>
        </section>
      </main>
    ) : (
      this.props.children
    )
  }
}
