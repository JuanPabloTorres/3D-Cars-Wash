/** Composes customer navigation and overlays for the full-world entry point; each modal owns its content. */
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CarFront,
  CircleHelp,
  MapPin,
  ReceiptText,
  Store,
  X,
  Pause,
  Play,
  SkipForward,
  RotateCcw,
  UserRound,
} from 'lucide-react'
import { useApp } from '../app/store'
import { useCommerce } from '../app/commerceStore'
import { destinations } from '../world/navigation/layout'
import { ReceptionDialogue } from '../reception/ReceptionDialogue'
import type { DemoOperationTransport } from '../domain/DemoOperationTransport'
import { WeatherControls } from '../environment/WeatherControls'
import { OrderStatusCard } from '../world/interactions/OrderStatusCard'
import { inspectOwnVehicle } from '../world/interactions/VehicleInspectionExperience'
import { LocalAreaPanel } from './LocalAreaPanel'
import { WorldPanel } from './WorldOverlayManager'
import { DemoScenarioControls } from './DemoScenarioControls'
import { AccountModal } from './account/AccountModal'
import { ServiceFlowSteps } from './ServiceFlowModal'
import { appConfig } from '../config/appConfig'
import { useBusiness } from '../app/business'

const tools = new URLSearchParams(location.search).get('tools') === 'demo'

export function WorldHUD({ source }: { source: DemoOperationTransport | null }) {
  const state = useApp(),
    commerce = useCommerce(),
    business = useBusiness(),
    panel =
      state.dialogue ||
      state.orderOpen ||
      state.localOpen ||
      state.help ||
      state.accountOpen ||
      state.flowOpen

  if (!state.ready) return null

  return (
    <>
      <div className="demo-mark">
        <span />
        <div>
          <span className="business-mark-name" title={business.name}>
            {business.name}
          </span>
          <b>· DEMO</b>
          <small>
            {state.sync === 'connected'
              ? 'Simulación conectada'
              : state.sync === 'connecting'
                ? 'Conectando simulación…'
                : 'Datos sin actualizar'}
          </small>
        </div>
      </div>
      <div className="utility-controls">
        <button
          className="utility visit-toggle"
          aria-label="Visitar"
          aria-expanded={state.menu}
          onClick={() =>
            state.set({
              menu: !state.menu,
              help: false,
              accountOpen: false,
              flowOpen: false,
              dialogue: false,
              orderOpen: false,
              localOpen: false,
            })
          }
        >
          <MapPin size={18} />
          Visitar
          {commerce.order?.status === 'confirmed' && (
            <span className="order-dot" aria-label="Orden activa" />
          )}
        </button>
        <button
          className="utility avatar-button"
          aria-expanded={state.accountOpen}
          aria-label={`Abrir cuenta de ${commerce.profile.name}`}
          onClick={() =>
            state.set({
              accountOpen: !state.accountOpen,
              menu: false,
              help: false,
              flowOpen: false,
              dialogue: false,
              orderOpen: false,
              localOpen: false,
            })
          }
        >
          <UserRound size={18} />
          <span className="utility-label">Mi cuenta</span>
        </button>
        <button
          className="utility"
          aria-label="Ayuda de la visita"
          aria-expanded={state.help}
          onClick={() =>
            state.set({
              help: !state.help,
              menu: false,
              dialogue: false,
              orderOpen: false,
              localOpen: false,
              accountOpen: false,
              flowOpen: false,
            })
          }
        >
          <CircleHelp size={19} />
        </button>
      </div>
      {state.accountOpen && <AccountModal />}
      {state.menu && (
        <nav className="destinations" aria-label="Visitar un área">
          <div>
            <strong>¿Qué deseas hacer?</strong>
            <button
              className="icon-button"
              aria-label="Cerrar Visitar"
              onClick={() => state.set({ menu: false })}
            >
              <X size={18} />
            </button>
          </div>
          <button onClick={() => state.navigate('reception')}>
            <Store />
            <span>
              Recepción
              <small>
                {commerce.draft.step === 'welcome' ? 'Hablar con Ana' : 'Retomar mi solicitud'}
              </small>
            </span>
            <ArrowRight size={17} />
          </button>
          <button onClick={() => state.navigate('reception', 'order')}>
            <ReceiptText />
            <span>
              Mi orden<small>Resumen y acciones</small>
            </span>
            <ArrowRight size={17} />
          </button>
          <button onClick={inspectOwnVehicle}>
            <CarFront />
            <span>
              Mi vehículo
              <small>
                {commerce.order?.attention === 'not-arrived'
                  ? 'Consultar llegada pendiente'
                  : 'Ubicación y atención'}
              </small>
            </span>
            <ArrowRight size={17} />
          </button>
          <button
            onClick={() =>
              state.set({
                menu: false,
                dialogue: false,
                orderOpen: false,
                help: false,
                accountOpen: false,
                localOpen: true,
                localOverview: true,
                destination: null,
                viewIntent: 'area',
              })
            }
          >
            <Building2 />
            <span>
              El local<small>Elegir bahía, fila o lounge</small>
            </span>
            <ArrowRight size={17} />
          </button>
        </nav>
      )}
      {!state.destination && !panel && !state.menu && state.activeView !== 'entrance' && (
        <button className="back-to-entry" onClick={() => state.navigate('entrance')}>
          <ArrowLeft size={16} />
          Entrada <span>· {destinations[state.activeView].label}</span>
        </button>
      )}
      {state.activeView === 'entrance' && !state.destination && !panel && !state.menu && (
        <div className="arrival-invitation">
          <small>BIENVENIDO A {business.name.toUpperCase()}</small>
          <h1>{appConfig.tagline}</h1>
          <p>Conoce nuestros servicios y prepara tu visita.</p>
          <button className="primary" onClick={() => state.navigate('reception')}>
            Ir a recepción
            <ArrowRight size={18} />
          </button>
        </div>
      )}
      {state.destination && (
        <div className="view-transition" role="status">
          <span className="transition-dot" />
          Abriendo {destinations[state.destination].label.toLowerCase()}…
        </div>
      )}
      {!state.destination && !panel && !state.menu && state.activeView !== 'entrance' && (
        <button
          className="reopen-area primary"
          onClick={() => {
            if (state.viewIntent !== 'area') state.set({ orderOpen: true })
            else if (state.activeView === 'reception') state.set({ dialogue: true })
            else state.set({ localOpen: true })
          }}
        >
          {state.viewIntent === 'order'
            ? 'Abrir mi orden'
            : state.viewIntent === 'vehicle'
              ? 'Consultar mi vehículo'
              : state.activeView === 'reception'
                ? 'Hablar con Ana'
                : state.activeView === 'lounge'
                  ? 'Explorar lounge'
                  : state.activeView === 'queue'
                    ? 'Ver fila de espera'
                    : 'Ver información de bahía'}
          <ArrowRight size={17} />
        </button>
      )}
      {state.menu ? null : state.help ? (
        <WorldPanel
          title={`Tu visita a ${business.name}`}
          subtitle="AYUDA"
          onClose={() => state.set({ help: false })}
        >
          <h3>Moverme por el local</h3>
          <p>
            Selecciona <b>Visitar</b> y elige un área. En El local puedes abrir directamente una
            bahía, la fila o el lounge. No necesitas caminar ni usar un joystick.
          </p>
          <details className="help-service">
            <summary>Completar el servicio</summary>
            <ServiceFlowSteps />
          </details>
          <p className="muted">
            La DEMO usa un servidor local. No acepta pagos ni verifica presencia física. Las órdenes
            se conservan en esta sesión mientras el servidor esté activo.
          </p>
          <a href="/ASSET_LICENSES.txt" target="_blank" rel="noreferrer">
            Recursos y licencias
          </a>
          {tools && (
            <>
              <h3>Herramientas DEMO locales</h3>
              <p className="muted">
                Entorno de pruebas. No concede permisos administrativos reales.
              </p>
              <DemoScenarioControls />
              <WeatherControls />
              <div className="sandbox-controls">
                <button
                  aria-label={state.paused ? 'Reanudar DEMO' : 'Pausar DEMO'}
                  onClick={() => {
                    if (source) {
                      source.paused = !state.paused
                    }
                  }}
                >
                  {state.paused ? <Play /> : <Pause />}
                </button>
                <button aria-label="Siguiente etapa DEMO" onClick={() => source?.advance()}>
                  <SkipForward />
                </button>
                <button aria-label="Reiniciar DEMO" onClick={() => source?.reset()}>
                  <RotateCcw />
                </button>
                <button
                  disabled={!commerce.order}
                  onClick={async () => {
                    try {
                      await source?.control('start-order')
                      await commerce.refresh()
                    } catch (error) {
                      state.set({
                        error:
                          error instanceof Error
                            ? error.message
                            : 'No se pudo asignar la atención DEMO.',
                      })
                    }
                  }}
                >
                  Asignar atención DEMO
                </button>
              </div>
            </>
          )}
        </WorldPanel>
      ) : state.dialogue ? (
        <ReceptionDialogue />
      ) : state.orderOpen ? (
        <OrderStatusCard />
      ) : state.localOpen ? (
        <LocalAreaPanel />
      ) : null}
      {state.error && (
        <div className="error-notice" role="alert">
          {state.error}
          <button onClick={() => state.set({ error: null })}>Cerrar</button>
        </div>
      )}
      <div className="sr-only" aria-live="polite">
        {state.announcement}
      </div>
    </>
  )
}
