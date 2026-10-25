/** Presents public areas and navigation choices without exposing other customers' commercial details. */
import { ArrowRight, Clock, Info } from 'lucide-react'
import { useApp } from '../app/store'
import { WorldPanel } from './WorldOverlayManager'

import type { Destination } from '../world/navigation/layout'
import { inspectOwnVehicle } from '../world/interactions/VehicleInspectionExperience'
import { LoungeExperience } from './LoungeExperience'
import { BayOperationSummary } from './BayOperationSummary'

export function LocalAreaPanel() {
  const app = useApp(),
    view = app.localOverview ? 'overview' : app.activeView

  if (view === 'lounge') return <LoungeExperience />

  const bayId = view === 'viewing' ? '01' : view.startsWith('bay') ? view.slice(3) : null,
    bay = app.world.bays.find((b) => b.bayId === bayId),
    vehicle = app.world.vehicles.find(
      (v) => v.worldEntityId === (bay ? bay.vehicleId : app.focusedVehicleId),
    )
  const title = bayId
    ? `Bahía ${bayId}`
    : view === 'queue' || view === 'arrival'
      ? 'Fila de espera'
      : view === 'delivery'
        ? 'Entrega'
        : 'El local'
  const queue = app.world.vehicles.filter((v) => v.stage === 'queued').length,
    inTransit = app.world.vehicles.filter((v) => v.movement).length

  return (
    <WorldPanel
      title={title}
      subtitle="OPERACIÓN ILUSTRATIVA · DEMO"
      compact
      className={bay ? 'bay-operation-panel' : ''}
      contextKey={view}
      onClose={() => app.set({ localOpen: false })}
    >
      {view === 'overview' && <p className="speech">Elige una zona del local.</p>}
      {bay && <BayOperationSummary bay={bay} vehicle={vehicle} />}
      {(view === 'queue' || view === 'arrival') && (
        <>
          <p className="speech">
            {queue} {queue === 1 ? 'vehículo en espera' : 'vehículos en espera'}
          </p>
          <p className="inline-note">
            <Clock size={16} />
            {inTransit} en circulación · 3 posiciones físicas
          </p>
          <p className="muted">
            El personal organiza la fila. Tu turno aparece después de confirmar tu llegada.
          </p>
        </>
      )}
      {view === 'delivery' && (
        <>
          <p className="speech">Retiro con el personal</p>
          <p className="muted">
            Pago, inspección final y entrega requieren confirmación del establecimiento. Abrir esta
            vista no completa ninguno de esos pasos.
          </p>
        </>
      )}
      <div className="local-summary">
        <Info size={15} />
        <span>
          {app.world.bays.filter((b) => b.occupancy === 'free').length} disponibles · {queue} en
          espera
        </span>
      </div>
      <div className="local-destinations">
        <button onClick={() => app.navigate('lounge')}>
          Lounge · Sala de espera <ArrowRight size={15} />
        </button>
        <button onClick={() => app.navigate('queue')}>
          Fila de espera <ArrowRight size={15} />
        </button>
      </div>
      <details className="local-views" open={app.localOverview}>
        <summary>
          {app.localOverview ? 'Bahías del local' : 'Consultar otra zona del local'}
        </summary>
        <div>
          {app.world.bays.map((b) => (
            <button
              key={b.bayId}
              onClick={() => {
                app.set({ focusedVehicleId: null })
                app.navigate(b.bayId === '01' ? 'viewing' : (`bay${b.bayId}` as Destination))
              }}
            >
              <span>Bahía {b.bayId}</span>
              <small>
                {b.occupancy === 'free'
                  ? 'Disponible'
                  : b.occupancy === 'occupied'
                    ? 'En atención'
                    : 'Inactiva'}
              </small>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      </details>
      {!bay && (
        <button className="text-button" onClick={inspectOwnVehicle}>
          Consultar mi vehículo
        </button>
      )}
      <small className="privacy-note">
        Solo información operativa. Datos de otros clientes protegidos.
      </small>
    </WorldPanel>
  )
}
