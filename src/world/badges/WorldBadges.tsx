export const stageLabels: Record<string, string> = {
  arriving: 'Llegando al establecimiento',
  queued: 'En fila de espera',
  assigned: 'Camino a su bahía',
  washing: 'Lavado exterior en curso',
  interior: 'Interior en proceso',
  lights: 'Cuidado de focos',
  inspection: 'Inspección',
  ready: 'Listo para entrega',
  handover: 'Entrega del vehículo',
  departing: 'En circulación',
  exited: 'Servicio completado',
}

/** Operational labels live on the bay fascia. Transactions use WorldPanel. */
export function WorldBadges() {
  return null
}
