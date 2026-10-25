import type { CSSProperties } from 'react'
import { Check, Clock3, Sparkles } from 'lucide-react'
import type { WorldVehicle } from '../../../domain/contracts'
import { VehicleIcon } from '../../../ui/VehicleIcon'
import { elapsed, isFinished, publicCode } from './operationPresentation'
import { serviceVisuals } from './VehicleStatusBadge'
import './bay-indicator.css'

/** Read-only world signage. Actions belong to the client's side panel, never to
 * these medallions. Only contracted services and inspection are represented. */
export function BayServiceIndicator({
  vehicle,
  clock,
  own,
  focused,
  paused,
}: {
  vehicle: WorldVehicle
  clock: number
  own: boolean
  focused: boolean
  paused: boolean
}) {
  const done = isFinished(vehicle),
    active = vehicle.tasks.some((t) => t.status === 'active')
  const state = done ? 'done' : active ? 'active' : 'pending'

  return (
    <div
      className={`bay-service-indicator ${focused ? 'expanded' : ''} ${paused ? 'paused' : ''}`}
      role="img"
      aria-label={`${vehicle.bayId ? `Bahía ${vehicle.bayId}` : 'En espera'} · ${own ? 'Mi vehículo' : publicCode(vehicle.worldEntityId)} · ${vehicle.tasks.map((t) => `${t.label}: ${t.status === 'done' ? 'Completado' : t.status === 'active' ? 'En proceso' : 'Pendiente'}`).join(', ')}`}
    >
      {focused && <div className="service-orbit" aria-hidden="true" />}
      <div className="bay-medallion-center">
        <span className={`status-medallion vehicle-medallion ${state}`}>
          <VehicleIcon type={vehicle.type} size={48} />
          {done && <Check className="medallion-check" size={20} />}
        </span>
        <div className="medallion-caption">
          <strong>
            {vehicle.bayId
              ? `Bahía ${vehicle.bayId}`
              : vehicle.queueIndex !== null
                ? `Turno ${vehicle.queueIndex + 1}`
                : 'Completado'}
          </strong>
          <span>{own ? 'Mi vehículo' : publicCode(vehicle.worldEntityId)}</span>
          <small>
            <Clock3 size={12} />
            {elapsed(vehicle, clock) || 'En espera'}
          </small>
        </div>
      </div>
      {focused &&
        vehicle.tasks.map((task, i) => {
          const { Icon, color } = serviceVisuals[task.id as keyof typeof serviceVisuals] || {
            Icon: Sparkles,
            color: '#c4d4dd',
          }
          const angle = -Math.PI / 2 + (i * Math.PI * 2) / vehicle.tasks.length

          return (
            <div
              className="satellite-service"
              key={task.id}
              style={
                {
                  left: `${50 + 39 * Math.cos(angle)}%`,
                  top: `${43 + 35 * Math.sin(angle)}%`,
                  '--service-color': color,
                } as CSSProperties
              }
            >
              <span className={`status-medallion ${task.status}`}>
                <Icon size={29} />
                {task.status === 'done' && <Check className="medallion-check" size={14} />}
              </span>
              <strong>{task.label}</strong>
              <small>
                {task.status === 'done'
                  ? 'Completado'
                  : task.status === 'active'
                    ? 'En proceso'
                    : 'Pendiente'}
              </small>
            </div>
          )
        })}
    </div>
  )
}
