/** Selects explicitly synthetic scenarios through the URL; it is not an operational staff control. */
import { useApp } from '../app/store'

export function DemoScenarioControls() {
  const scenario = useApp((s) => s.world.scenario)

  return (
    <section className="scenario-settings">
      <h3>Escenario de demostración</h3>
      <p>Configura una visita sintética. No controla operaciones reales.</p>
      <label>
        Combinación de bahías
        <select
          value={scenario}
          onChange={(e) => {
            const url = new URL(location.href)

            url.searchParams.set('scenario', e.target.value)
            location.assign(url.toString())
          }}
        >
          <option value="mixed">Actividad mixta</option>
          <option value="quiet">Una bahía activa · 03</option>
          <option value="busy">Cinco bahías ocupadas</option>
          <option value="arrival">Llegada, cola y asignación</option>
        </select>
      </label>
    </section>
  )
}
