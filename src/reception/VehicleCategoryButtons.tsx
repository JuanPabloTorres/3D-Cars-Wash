import { VehicleIcon } from '../ui/VehicleIcon'
import { vehicleTypeLabels, type VehicleType } from '../domain/commerce'
import { useCommerce } from '../app/commerceStore'

/** Only categories supplied by the active catalogue are selectable. Prices and
 * unavailable rates remain owned by the provider, including quotation-only rows. */
export function VehicleCategoryButtons() {
  const { pricing, draft, updateDraft } = useCommerce()
  const categories = Object.keys(pricing?.prices || {}).filter(
    (id) => id in vehicleTypeLabels,
  ) as VehicleType[]

  return (
    <fieldset className="vehicle-category-buttons">
      <legend>Tarifas por vehículo</legend>
      <div>
        {categories.map((id) => {
          return (
            <button
              key={id}
              type="button"
              aria-pressed={draft.vehicle.type === id}
              onClick={() => updateDraft({ vehicle: { ...draft.vehicle, type: id } })}
            >
              <VehicleIcon type={id} size={25} />
              {vehicleTypeLabels[id]}
            </button>
          )
        })}
      </div>
      {!categories.length && <p className="muted">Esperando el catálogo del establecimiento…</p>}
    </fieldset>
  )
}
