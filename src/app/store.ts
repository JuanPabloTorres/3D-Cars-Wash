/** Keeps navigation, overlays and projected world state separate from the authoritative commercial session. */
import { create } from 'zustand'
import { initialWorld, projectOperation } from '../domain/OperationProjection'
import type { OperationEvent, WorldViewModel } from '../domain/contracts'
import type { Destination } from '../world/navigation/layout'
import { fallbackWeather, type WeatherState, type Coordinates } from '../environment/weather'
import type { Point } from '../world/navigation/layout'
import { appConfig } from '../config/appConfig'
import { scenarioFrame, type DemoScenario } from '../domain/DemoOperationSource'

const requestedScenario = new URLSearchParams(location.search).get('scenario')
const initialFrame = scenarioFrame(
  ['mixed', 'quiet', 'busy', 'arrival'].includes(requestedScenario || '')
    ? (requestedScenario as DemoScenario)
    : 'operation',
)

export type Interaction = 'reception' | 'services' | 'viewing'

export type ViewIntent = 'area' | 'order' | 'vehicle'

interface AppState {
  ready: boolean
  entered: boolean
  destination: Destination | null
  interaction: Interaction | null
  sceneFailed: boolean
  navRevision: number
  activeView: Destination
  viewIntent: ViewIntent
  localOpen: boolean
  localOverview: boolean
  orderExpanded: boolean
  sync: 'connecting' | 'connected' | 'stale'
  dialogue: boolean
  menu: boolean
  help: boolean
  accountOpen: boolean
  flowOpen: boolean
  error: string | null
  announcement: string
  informationTopic: 'hours' | 'overview' | 'offers'
  world: WorldViewModel
  paused: boolean
  weather: WeatherState
  weatherEffects: boolean
  weatherCoordinates: Coordinates | null
  orderOpen: boolean
  inspectOwn: boolean
  inspectionPoint: Point | null
  focusedVehicleId: string | null
  publicCardOpen: boolean
  enter: () => void
  navigate: (d: Destination, intent?: ViewIntent) => void
  openDialogue: () => void
  set: (state: Partial<Omit<AppState, 'set'>>) => void
  receive: (e: OperationEvent) => void
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  sceneFailed: false,
  entered: true,
  destination: null,
  interaction: null,
  dialogue: false,
  menu: false,
  help: false,
  accountOpen: false,
  flowOpen: false,
  error: null,
  informationTopic: 'overview',
  navRevision: 0,
  activeView: 'entrance',
  viewIntent: 'area',
  localOpen: false,
  localOverview: false,
  orderExpanded: false,
  sync: 'connecting',
  weather: fallbackWeather,
  weatherEffects: !window.matchMedia('(max-width:600px)').matches,
  weatherCoordinates: null,
  orderOpen: false,
  inspectOwn: false,
  inspectionPoint: null,
  focusedVehicleId: null,
  publicCardOpen: false,
  announcement: `Bienvenido a ${appConfig.name}`,
  world: { ...initialWorld, ...initialFrame, bay: initialFrame.bays[0] },
  paused: false,
  enter: () => set({ entered: true }),
  navigate: (d, intent = 'area') =>
    set((s) => ({
      destination: d,
      navRevision: s.navRevision + 1,
      viewIntent: intent,
      menu: false,
      help: false,
      accountOpen: false,
      flowOpen: false,
      dialogue: false,
      error: null,
      orderOpen: false,
      orderExpanded: false,
      inspectOwn: intent === 'vehicle',
      publicCardOpen: false,
      localOpen: false,
      localOverview: false,
      focusedVehicleId: null,
    })),
  openDialogue: () => {
    const s = get()

    if (s.interaction === 'reception' || s.interaction === 'services')
      set({ dialogue: true, destination: null, orderOpen: false })
    else if (s.focusedVehicleId) {
      const v = s.world.vehicles.find((v) => v.worldEntityId === s.focusedVehicleId)

      if (v?.visibility === 'own') set({ orderOpen: !s.orderOpen })
      else set({ publicCardOpen: !s.publicCardOpen })
    }
  },
  set: (s) => set(s),
  receive: (e) =>
    set((s) => {
      const world = projectOperation(s.world, e)

      return world === s.world ? {} : { world, paused: e.frame.paused ?? s.paused }
    }),
}))
