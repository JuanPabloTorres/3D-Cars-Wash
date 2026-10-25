import { useState } from 'react'
import { Car, Clock3, LayoutGrid } from 'lucide-react'
import { GroundLayer, type GroundView, type CameraFocus } from '../GroundLayer'
import { useOperations } from './useOperations'
import { OperationsWorldLayer } from './OperationsWorldLayer'
import { useCommerce } from '../../../app/commerceStore'
import { useApp } from '../../../app/store'
import { bayCenter, queueCenter, handover, type BayId } from '../../../domain/sitePlan'
import { bayState, elapsed, vehicleState } from './operationPresentation'
import { useOperationNavigation } from './useOperationNavigation'
import { ServiceBadge } from './VehicleStatusBadge'
import { WaitingLoungeLayer } from '../lounge/WaitingLoungeLayer'
import { LoungeConsultation } from '../lounge/LoungeConsultation'
import './operations.css'
import './site-operation-navigation.css'

/** Reception and operation share the same buildings and provider. The reception
 * camera and commercial controls retain ownership of their existing flow. */
export function ReceptionSiteExperience() {
  const { world, connection, paused } = useOperations(),
    order = useCommerce((s) => s.order),
    history = useCommerce((s) => s.history)
  const loaded = useCommerce((s) => s.loaded),
    connected = useCommerce((s) => s.connected),
    panel = useApp((s) => s.dialogue || s.orderOpen || s.accountOpen || s.help || s.localOpen)
  const [view, setView] = useState<GroundView>(
      new URLSearchParams(location.search).get('layer') === 'lounge' ? 'waiting' : 'entrance',
    ),
    [bay, setBay] = useState<BayId | null>(null)
  const [consult, setConsult] = useState(false)
  const loungeEnabled = new URLSearchParams(location.search).get('lounge') !== 'off'
  const navigation = useOperationNavigation(world, order, history),
    vehicle = navigation.vehicle
  const navigate = (next: GroundView) => {
    useApp
      .getState()
      .set({ dialogue: false, orderOpen: false, interaction: null, accountOpen: false })
    setConsult(false)
    setBay(null)
    setView(next)
    if (next === 'vehicle') navigation.showOwn()
    else navigation.close()
  }
  const selectBay = (id: BayId) => {
    setBay(id)

    const entity = world.vehicles.find((v) => v.bayId === id)

    if (entity) navigation.select(entity.worldEntityId)
    else navigation.close()
  }
  // Camera destinations come from the same site coordinates as the operation.
  // A moving entity focuses its confirmed destination, not every animation tick.
  let focus: CameraFocus | undefined

  if (view === 'service' && bay) {
    const [x, z] = bayCenter(bay)

    focus = { position: [x, 3.7, 13], target: [x, 1.3, z] }
  }
  if (view === 'vehicle' && vehicle) {
    const [x, z] = vehicle.bayId
      ? bayCenter(vehicle.bayId)
      : vehicle.queueIndex !== null
        ? queueCenter(vehicle.queueIndex)
        : handover

    focus = { position: [x - 2, 4.2, z + 15], target: [x, 1.3, z] }
  }

  const inspecting = view === 'service' || view === 'vehicle'
  const overlay = inspecting && !panel && (
    <section
      className="site-operation-controls"
      aria-label={view === 'service' ? 'Bahías en el mapa' : 'Mi auto en el mapa'}
    >
      <header>
        {view === 'service' ? <LayoutGrid size={18} /> : <Car size={18} />}
        <strong>
          {view === 'service' ? (bay ? `Bahía ${bay}` : 'Bahías de servicio') : 'Mi auto'}
        </strong>
        <small>{connection === 'connected' ? 'DEMO en vivo' : 'Reconectando…'}</small>
      </header>
      {view === 'service' ? (
        <div className="site-bay-picker">
          <button
            aria-pressed={!bay}
            onClick={() => {
              setBay(null)
              navigation.close()
            }}
          >
            Todas
          </button>
          {world.bays.map((b) => (
            <button
              key={b.bayId}
              aria-label={`Ver bahía ${b.bayId}`}
              aria-pressed={bay === b.bayId}
              title={bayState(b, world.vehicles)}
              onClick={() => selectBay(b.bayId)}
            >
              <span>{b.bayId}</span>
              <i className={b.occupancy} />
            </button>
          ))}
        </div>
      ) : (
        !vehicle && (
          <p role="status">
            {!loaded
              ? 'Consultando tu sesión…'
              : !connected
                ? 'No podemos consultar tu orden. Reconectando…'
                : !navigation.personalOrder
                  ? 'Aún no tienes una orden activa. Prepárala en recepción.'
                  : navigation.personalOrder.attention === 'not-arrived'
                    ? 'Tu orden está confirmada. Recepción debe registrar tu llegada.'
                    : 'Recuperando la ubicación de tu vehículo…'}
          </p>
        )
      )}
      {vehicle && (
        <>
          <p className="site-vehicle-state">
            {vehicle.bayId
              ? `Bahía ${vehicle.bayId} · `
              : vehicle.queueIndex !== null
                ? `Turno ${vehicle.queueIndex + 1} · `
                : ''}
            {vehicleState(vehicle)}
            {elapsed(vehicle, world.clockSeconds) && (
              <span>
                <Clock3 size={13} />
                {elapsed(vehicle, world.clockSeconds)}
              </span>
            )}
          </p>
          <details>
            <summary>Servicios y progreso</summary>
            <div className="service-badges">
              {vehicle.tasks.map((task) => (
                <ServiceBadge
                  key={task.id}
                  task={task}
                  paused={paused || connection !== 'connected'}
                />
              ))}
            </div>
          </details>
        </>
      )}
      {view === 'service' && bay && !vehicle && (
        <p>
          {bayState(
            world.bays.find((b) => b.bayId === bay)!,
            world.vehicles,
          )}
        </p>
      )}
    </section>
  )

  return (
    <GroundLayer
      landscape
      reception
      customerWorld={world}
      siteView={view}
      onSiteView={navigate}
      vehicleFocus={focus}
      customerOverlay={
        <>
          {overlay}
          {view === 'waiting' && !panel && (
            <LoungeConsultation
              world={world}
              order={order ?? history.find((item) => item.attention === 'delivered') ?? null}
              connected={connected && connection === 'connected'}
              loaded={loaded}
              paused={paused}
              open={consult}
              onOpen={setConsult}
              onNavigate={navigate}
            />
          )}
        </>
      }
      sceneContent={
        <>
          {loungeEnabled && (
            <WaitingLoungeLayer
              active={view === 'waiting' && !panel}
              onConsult={() => setConsult(true)}
            />
          )}
          <OperationsWorldLayer
            world={world}
            area="overview"
            ownId={order?.worldEntityId}
            selected={inspecting ? navigation.selected : null}
            paused={paused || connection !== 'connected'}
            onSelect={(id) => {
              setView('service')
              navigation.select(id)

              const entity = world.vehicles.find((v) => v.worldEntityId === id)

              setBay(entity?.bayId ?? null)
            }}
            controlCamera={false}
          />
        </>
      }
    />
  )
}
