import { CarFront, Check, Clock, Droplets } from 'lucide-react'
import type { BayView, WorldVehicle } from '../domain/contracts'
import { stageLabels } from '../world/badges/WorldBadges'
import { inspectOwnVehicle } from '../world/interactions/VehicleInspectionExperience'
import './bay-operation.css'

/** Public operational projection only: never displays another client's identity. */
export function BayOperationSummary({ bay, vehicle }: { bay: BayView; vehicle?: WorldVehicle }) {
  const active = vehicle?.tasks.find((task) => task.status === 'active')
  const state =
    bay.occupancy === 'free'
      ? 'Disponible'
      : bay.occupancy === 'out-of-service'
        ? 'Fuera de servicio'
        : vehicle
          ? stageLabels[vehicle.stage]
          : 'Asignada'

  return (
    <div className="bay-operation-summary">
      <div className={`bay-state ${active ? 'is-working' : ''}`} role="status">
        {active ? <Droplets size={24} /> : <CarFront size={24} />}
        <div>
          <small>{active ? 'ATENCIÓN EN CURSO' : 'ESTADO DE LA BAHÍA'}</small>
          <strong>{active ? `${active.label} · En proceso` : state}</strong>
        </div>
      </div>
      {vehicle ? (
        <ol className="bay-task-list" aria-label="Etapas del servicio">
          {vehicle.tasks.map((task) => (
            <li key={task.id} data-state={task.status}>
              {task.status === 'done' ? <Check size={18} /> : <Clock size={18} />}
              <span>{task.label}</span>
              <b>
                {task.status === 'active'
                  ? 'En proceso'
                  : task.status === 'done'
                    ? 'Completado'
                    : 'Pendiente'}
              </b>
            </li>
          ))}
        </ol>
      ) : (
        <p className="bay-empty-note">
          {bay.occupancy === 'out-of-service'
            ? 'El personal debe habilitar este espacio antes de asignarlo.'
            : 'Espacio libre. El vehículo aparecerá cuando el personal lo asigne a esta bahía.'}
        </p>
      )}
      <button className="primary wide" onClick={inspectOwnVehicle}>
        Consultar mi vehículo <CarFront size={18} />
      </button>
      <p className="bay-authority-note">El personal confirma el avance del servicio.</p>
    </div>
  )
}
