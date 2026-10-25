/** Opens the owner's vehicle destination, or the order panel before arrival. */
import { useApp } from '../../app/store'
import { vehicleDestination } from '../navigation/CameraController'

export function inspectOwnVehicle() {
  const app = useApp.getState(),
    destination = vehicleDestination()

  if (destination) app.navigate(destination, 'vehicle')
  else
    app.set({
      menu: false,
      help: false,
      accountOpen: false,
      flowOpen: false,
      dialogue: false,
      localOpen: false,
      destination: null,
      orderOpen: true,
      viewIntent: 'vehicle',
      inspectOwn: true,
      announcement: 'Consulta el estado de llegada de tu vehículo.',
    })
}
