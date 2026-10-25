/** Composes the isolated operations view with shared session, operation observer and customer navigation. */
import {
  Home,
  Car,
  CircleCheck,
  Rows3,
  LayoutGrid,
  ArrowLeft,
  Radio,
  WifiOff,
  Clock3,
} from 'lucide-react'
import { GroundLayer } from '../GroundLayer'
import { useCommerce } from '../../../app/commerceStore'
import { useBusiness } from '../../../app/business'
import { useCommercialSession } from '../../../app/useCommercialSession'
import { useOperations } from './useOperations'
import { OperationsWorldLayer } from './OperationsWorldLayer'
import { VehicleStatusBadge } from './VehicleStatusBadge'
import { OperationDetails } from './OperationDetails'
import { bayState, operationGroups } from './operationPresentation'
import { useOperationNavigation } from './useOperationNavigation'
import './operations.css'
import { ServiceCompletionNotice } from '../../../ui/ServiceCompletionNotice'

export function OperationsExperience() {
  useCommercialSession()

  const { world, connection, paused } = useOperations()
  const order = useCommerce((s) => s.order),
    history = useCommerce((s) => s.history),
    business = useBusiness()
  const navigation = useOperationNavigation(world, order, history)
  const { area, selected, vehicle, followingOwn, personalOrder, select } = navigation
  const loaded = useCommerce((s) => s.loaded),
    sessionConnected = useCommerce((s) => s.connected)
  const groups = operationGroups(world)
  const privateOrder = [...(order ? [order] : []), ...history].find(
    (o) => o.worldEntityId === selected,
  )
  const own = groups.queue.find((v) => v.worldEntityId === order?.worldEntityId)
  const items =
    area === 'queue'
      ? groups.queue
      : area === 'completed'
        ? groups.completed
        : area === 'bays'
          ? world.vehicles.filter((v) => v.bayId)
          : world.vehicles
  const views = [
    { id: 'overview' as const, label: 'El local', Icon: LayoutGrid, count: null },
    { id: 'queue' as const, label: 'En espera', Icon: Rows3, count: groups.queue.length },
    { id: 'bays' as const, label: 'En servicio', Icon: Car, count: groups.active.length },
    {
      id: 'completed' as const,
      label: 'Completados',
      Icon: CircleCheck,
      count: groups.completed.length,
    },
  ]
  const overlay = (
    <div
      className="operations-ui"
      data-connection={connection}
      data-revision={world.revision}
      data-operation-area={area}
    >
      <header className="operations-header">
        <a href="/?layer=reception" aria-label="Volver a recepción">
          <ArrowLeft size={18} />
          <strong>{business.name}</strong>
          <small>CAR WASH</small>
        </a>
        <div className="operations-header-actions">
          <button onClick={navigation.showOwn} aria-pressed={followingOwn}>
            <Car size={18} />
            Ver mi auto
          </button>
          <span className={`operations-connection ${connection}`}>
            {connection === 'connected' ? <Radio size={16} /> : <WifiOff size={16} />}{' '}
            {connection === 'connected'
              ? 'Operación DEMO'
              : connection === 'stale'
                ? 'Sin conexión · última información'
                : 'Conectando…'}
          </span>
        </div>
      </header>
      <section className="operations-summary">
        <small>EL ESTADO DE TU SERVICIO</small>
        <h1>
          {area === 'queue'
            ? 'Cada turno, a la vista.'
            : area === 'bays'
              ? 'Cuidando cada detalle.'
              : area === 'completed'
                ? 'Servicios finalizados.'
                : 'Tu visita, paso a paso.'}
        </h1>
        <p>
          {groups.queue.length} en espera <span>·</span> {groups.active.length} en servicio{' '}
          <span>·</span> {groups.available} bahías disponibles
        </p>
        {own && (
          <p className="own-turn" key={own.queueIndex}>
            <Clock3 size={17} />
            Tu turno: {own.queueIndex! + 1} ·{' '}
            {groups.queue.filter((v) => v.queueIndex! < own.queueIndex!).length} por delante
          </p>
        )}
        {paused && <p role="status">Operación pausada</p>}
      </section>
      {followingOwn && !vehicle ? (
        <section
          className="operations-list own-vehicle-empty"
          aria-label="Mi vehículo"
          role="status"
        >
          <Car size={32} />
          <h2>
            {!loaded
              ? 'Consultando tu sesión'
              : !sessionConnected
                ? 'No podemos consultar tu orden'
                : personalOrder
                  ? 'Tu vehículo aún no aparece en las bahías'
                  : 'Aún no tienes una orden activa'}
          </h2>
          <p>
            {!loaded
              ? 'Espera mientras recuperamos tu información.'
              : !sessionConnected
                ? 'Recuperaremos el estado al reconectar.'
                : personalOrder?.attention === 'not-arrived'
                  ? 'Tu orden está confirmada. Recepción debe registrar tu llegada antes de asignarte un turno.'
                  : personalOrder
                    ? 'Estamos consultando el estado operativo de tu orden.'
                    : 'Prepara tu orden en recepción para seguir aquí el servicio de tu auto.'}
          </p>
          <a href="/?layer=reception">Ir a recepción</a>
          <button onClick={() => navigation.openArea('bays')}>Consultar bahías</button>
        </section>
      ) : (
        <section
          className={`operations-list ${selected ? 'detail-open' : ''}`}
          aria-label="Estado de vehículos"
        >
          <header>
            <h2>{views.find((v) => v.id === area)?.label}</h2>
            <small>
              {area === 'bays'
                ? `${groups.occupied} ocupadas / ${world.bays.length}`
                : `${items.length} vehículos`}
            </small>
          </header>
          {area === 'completed' && (
            <p className="operation-note">
              Servicios terminados y últimas 50 entregas de esta sesión del servidor. La liberación
              física se muestra por separado.
            </p>
          )}
          {items.map((v) => (
            <VehicleStatusBadge
              key={v.worldEntityId}
              vehicle={v}
              clock={world.clockSeconds}
              own={
                v.worldEntityId === order?.worldEntityId ||
                history.some((o) => o.worldEntityId === v.worldEntityId)
              }
              paused={paused || connection !== 'connected'}
              onSelect={() => select(v.worldEntityId)}
            />
          ))}
          {!items.length && (
            <div className="operation-empty">
              <CircleCheck size={34} />
              <h3>
                {area === 'completed'
                  ? 'Aún no hay servicios finalizados'
                  : 'Todo preparado para tu visita'}
              </h3>
              <p>
                {area === 'queue'
                  ? 'No hay vehículos esperando.'
                  : area === 'bays'
                    ? 'Las bahías libres están listas para atender.'
                    : 'Las fichas aparecen cuando recepción registra una llegada.'}
              </p>
              <a href="/?layer=reception">Ir a recepción</a>
            </div>
          )}
          {(area === 'bays' || area === 'overview') && (
            <div className="bay-availability">
              {world.bays.map((b) => (
                <div key={b.bayId} data-bay={b.bayId} data-occupancy={b.occupancy}>
                  <span>Bahía {b.bayId}</span>
                  <b>{bayState(b, world.vehicles)}</b>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {vehicle && (
        <OperationDetails
          vehicle={vehicle}
          order={privateOrder}
          clock={world.clockSeconds}
          onClose={navigation.close}
        />
      )}
      <ServiceCompletionNotice />
      <nav className="operations-navigation" aria-label="Áreas de operación">
        <a href="/?layer=reception">
          <Home size={21} />
          Recepción
        </a>
        {views.map(({ id, label, Icon, count }) => (
          <button
            key={id}
            aria-label={`${label}${count !== null ? ` ${count}` : ''}`}
            aria-pressed={area === id}
            onClick={() => navigation.openArea(id)}
          >
            <Icon size={21} />
            <span>
              {label}
              {count !== null && <b>{count}</b>}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )

  return (
    <GroundLayer
      landscape
      reception
      operations={
        <OperationsWorldLayer
          world={world}
          area={area}
          ownId={order?.worldEntityId}
          selected={selected}
          onSelect={select}
          paused={paused || connection !== 'connected'}
        />
      }
      operationsOverlay={overlay}
    />
  )
}
