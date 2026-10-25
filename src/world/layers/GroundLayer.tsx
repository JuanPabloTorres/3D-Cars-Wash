import type { WorldViewModel } from '../../domain/contracts'
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { ACESFilmicToneMapping, Path, PerspectiveCamera } from 'three'
import { Lettering } from '../prefabs/Architecture'
import { useGroundMaterials } from './groundMaterials'
import { CornerMarks, PaintStroke, PedestrianWalk, RoundedSurface } from './GroundShapes'
import { BAY_IDS, bayCenter } from '../../domain/sitePlan'
import { ServiceGroundMarkings } from './ServiceGroundMarkings'
import { plantingBeds } from '../siteLandscape'
import './ground-layer.css'
import { ReceptionCamera } from './reception/ReceptionCamera'
import { ReceptionExperience, openReceptionAction } from './reception/ReceptionExperience'
import { ReceptionHost } from './reception/ReceptionHotspot'

const LandscapeSystem = lazy(() =>
  import('./LandscapeSystem').then((module) => ({ default: module.LandscapeSystem })),
)
const EnvironmentBackground = lazy(() =>
  import('./EnvironmentBackground').then((module) => ({ default: module.EnvironmentBackground })),
)
const ReceptionStructure = lazy(() =>
  import('./reception/ReceptionStructure').then((module) => ({
    default: module.ReceptionStructure,
  })),
)

type Stage = 'reception' | 'waiting' | 'service' | 'delivery'

export type GroundView = 'general' | 'plan' | 'entrance' | 'vehicle' | Stage

type View = GroundView

export type CameraFocus = { position: [number, number, number]; target: [number, number, number] }

type Palette = ReturnType<typeof useGroundMaterials>

const targets = { general: [17, 0, 5], plan: [17, 0, 5], entrance: [0, 0, -1] } as const
const stages: { id: Stage; title: string; purpose: string; target: [number, number, number] }[] = [
  {
    id: 'reception',
    title: 'Preparar visita',
    purpose:
      'Recepción: consultar servicios, registrar el vehículo y preparar la orden. La llegada presencial se confirma aquí.',
    target: [-6, 0, 1],
  },
  {
    id: 'waiting',
    title: 'Esperar turno',
    purpose:
      'Espera: consultar la posición y el estado de la orden. Deck de madera junto a recepción y tres plazas de cola, separadas de la acera.',
    target: [-13, 0, 8],
  },
  {
    id: 'service',
    title: 'Seguir servicio',
    purpose:
      'Bahías: consultar las etapas del servicio y la ubicación del vehículo. Los espacios se ocuparán solo con órdenes existentes.',
    target: [19.4, 0, -4.2],
  },
  {
    id: 'delivery',
    title: 'Recoger vehículo',
    purpose:
      'Entrega: consultar la inspección, el pago y la autorización de retiro antes de salir.',
    target: [50, 0, 17],
  },
]
const viewTarget = (view: View): [number, number, number] => [
  ...(stages.find((stage) => stage.id === view)?.target ?? targets[view as keyof typeof targets]),
]

/** Ground/landscape and architecture previews are presentation-only. The explicit
 * interactive reception layer connects to the existing commercial provider. */
export function GroundLayer({
  landscape = false,
  reception = false,
  operations,
  operationsOverlay,
  sceneContent,
  siteView,
  onSiteView,
  vehicleFocus,
  customerOverlay,
  customerWorld,
}: {
  landscape?: boolean
  reception?: boolean
  operations?: ReactNode
  operationsOverlay?: ReactNode
  sceneContent?: ReactNode
  siteView?: View
  onSiteView?: (view: View) => void
  vehicleFocus?: CameraFocus
  customerOverlay?: ReactNode
  customerWorld?: WorldViewModel
}) {
  const stage = new URLSearchParams(location.search).get('stage')
  const interactive = reception && !operations && stage !== 'architecture' && stage !== 'lights'
  const [localView, setLocalView] = useState<View>('entrance')
  const view = siteView ?? localView,
    setView = onSiteView ?? setLocalView
  const [guides, setGuides] = useState(!operations && !sceneContent)
  const [ready, setReady] = useState(false)
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    document.title = operations
      ? 'CarWash · Operación'
      : reception
        ? 'CarWash · Recepción'
        : landscape
          ? 'CarWash · Capa 02 — Paisaje'
          : 'CarWash · Capa 01 — Terreno'
  }, [landscape, reception])

  return (
    <main
      className="ground-layer"
      data-ground-ready={ready}
      data-ground-view={view}
      data-camera-moving={moving}
      data-landscape={landscape}
      data-reception={interactive}
    >
      <div className="ground-backdrop" aria-hidden="true" />
      <Canvas
        shadows
        camera={{ position: [65, 61, 83], fov: 48, near: 0.1, far: 500 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, toneMapping: ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <Environment files="/textures/daylight.hdr" environmentIntensity={0.65} />
          <hemisphereLight
            args={[landscape ? '#e3edf0' : '#dbeafa', '#a49a82', landscape ? 1.35 : 1.1]}
          />
          <directionalLight
            position={[-25, 38, 20]}
            color="#fff0d6"
            intensity={landscape ? 2.2 : 2.4}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-75}
            shadow-camera-right={75}
            shadow-camera-top={65}
            shadow-camera-bottom={-65}
            shadow-camera-far={160}
            shadow-bias={-0.0003}
          />
          <Terrain
            guides={guides}
            view={view}
            onSelect={setView}
            landscape={landscape}
            reception={reception}
          />
          {operations}
          {sceneContent}
          {reception && (
            <ReceptionStructure
              lights={stage !== 'architecture'}
              onAction={interactive && view === 'reception' ? openReceptionAction : undefined}
            />
          )}
          {interactive && <ReceptionHost active={view === 'reception'} />}
          {landscape && (
            <>
              <fog attach="fog" args={['#dce5dd', 150, 400]} />
              <EnvironmentBackground inspection={view !== 'entrance'} />
              <LandscapeSystem sample={new URLSearchParams(location.search).has('sample')} />
            </>
          )}
          {operations ? (
            <OperationReady onReady={() => setReady(true)} />
          ) : interactive ? (
            <ReceptionCamera
              view={view}
              focus={vehicleFocus}
              interactive
              onTransitionChange={setMoving}
              onReady={() => setReady(true)}
            />
          ) : (
            <LayerCamera view={view} reception={reception} onReady={() => setReady(true)} />
          )}
        </Suspense>
        {!interactive && !operations && (
          <OrbitControls
            key={view}
            target={reception && view === 'reception' ? [-6, 1.55, 0.8] : viewTarget(view)}
            minDistance={reception ? 3 : 12}
            maxDistance={320}
            minPolarAngle={0.03}
            maxPolarAngle={Math.PI / 2.15}
            enablePan={false}
          />
        )}
      </Canvas>
      {operations ? (
        operationsOverlay
      ) : interactive ? (
        <>
          <ReceptionExperience view={view} onView={setView} world={customerWorld} />
          {customerOverlay}
        </>
      ) : (
        <>
          <header className="ground-heading">
            <span>
              {landscape ? 'CAPA 02 · PAISAJE TROPICAL' : 'CAPA 01 · BASE DEL ESTABLECIMIENTO'}
            </span>
            <h1>El espacio de tu servicio</h1>
            <p>
              {landscape
                ? 'Vegetación, entorno y luz · suelo conservado'
                : 'Suelo y distribución · edificios y elementos ocultos'}
            </p>
          </header>
          <nav className="ground-views" aria-label="Vistas del terreno">
            {(['general', 'plan', 'entrance'] as View[]).map((id) => (
              <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>
                {id === 'general' ? 'General' : id === 'plan' ? 'Desde arriba' : 'Entrada'}
              </button>
            ))}
            <button aria-pressed={guides} onClick={() => setGuides((value) => !value)}>
              Delimitaciones
            </button>
          </nav>
          <details className="ground-legend">
            <summary>
              {landscape ? 'Distribución y vegetación' : 'Distribución y vegetación prevista'}
            </summary>
            <p>
              <i className="zone-concrete" />
              Acera peatonal · cemento claro
            </p>
            <p>
              <i className="zone-road" />
              Circulación de autos · asfalto continuo
            </p>
            <p>
              <i className="zone-wood" />
              Espera peatonal · deck de madera cálida
            </p>
            <p>
              <i className="zone-building" />
              Recepción, espera, servicio y entrega
            </p>
            <p>
              <i className="zone-parking" />
              Cola de vehículos · tres posiciones
            </p>
            <p>
              <i className="zone-plants" />
              {landscape
                ? 'Jardineras · arbustos, calatheas y helechos'
                : 'Jardineras vacías · tierra y bordes'}
            </p>
            <hr />
            <p>Perímetro y lounge: árboles de copa amplia para sombra y separación del entorno.</p>
            <p>
              Bordes peatonales: arbustos compactos bajos para delimitar sin tapar las vistas.
              Grupos de hojas amplias en los accesos como orientación.
            </p>
            <p>
              {landscape
                ? 'Árboles cercanos y lejanos comparten especie y materiales. Palmeras como acentos; fondo con muro, edificios y cielo.'
                : '60 % verde medio · 30 % profundo · 10 % acentos claros. La selección de modelos será una capa posterior.'}
            </p>
          </details>
          <nav className="ground-flow" aria-label="Zonas del flujo de servicio">
            {stages.map((stage, index) => (
              <button
                key={stage.id}
                aria-pressed={view === stage.id}
                onClick={() => setView(stage.id)}
              >
                <span>0{index + 1}</span>
                {stage.title}
              </button>
            ))}
          </nav>
          {stages
            .filter((stage) => stage.id === view)
            .map((stage) => (
              <section key={stage.id} className="ground-purpose" aria-live="polite">
                <strong>{stage.title}</strong>
                <p>{stage.purpose}</p>
                <small>
                  Ubicación prevista · las funciones se conservan en el sistema existente.
                </small>
              </section>
            ))}
          <p className="ground-hint">Selecciona una zona del servicio · Arrastra para observar</p>
        </>
      )}
      {!ready && (
        <div className="ground-loading" role="status">
          Preparando {reception ? 'la recepción' : 'el terreno'}…
        </div>
      )}
    </main>
  )
}

function OperationReady({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [])

  return null
}

function LayerCamera({
  view,
  onReady,
  reception = false,
}: {
  view: View
  onReady: () => void
  reception?: boolean
}) {
  const { camera, size, invalidate } = useThree()

  useEffect(() => {
    const mobile = size.width < 700
    const [x, y, z] = viewTarget(view)
    const stage = stages.some((stage) => stage.id === view)

    camera.position.set(
      ...((view === 'waiting'
        ? [x + 6, mobile ? 13 : 7, z + (mobile ? 18 : 11)]
        : stage
          ? [x + (mobile ? 12 : 8), mobile ? 38 : 20, z + (mobile ? 46 : 25)]
          : view === 'plan'
            ? [17, mobile ? 250 : 115, 5.1]
            : view === 'entrance'
              ? [-7, 5, mobile ? 33 : 26]
              : mobile
                ? [135, 155, 195]
                : [70, 72, 100]) as [number, number, number]),
    )
    camera.lookAt(x, y, z)
    ;(camera as PerspectiveCamera).fov = 48
    if (reception && view === 'reception') {
      camera.position.set(-6, 1.78, mobile ? 10.6 : 7.4)
      camera.lookAt(-6, 1.55, 0.8)
    }
    camera.updateProjectionMatrix()
    invalidate()

    const frame = requestAnimationFrame(onReady)

    return () => cancelAnimationFrame(frame)
  }, [camera, size.width, view, invalidate, reception])

  return null
}

function GroundLabel({
  x,
  z,
  children,
  color = '#dae0df',
  size = 0.7,
}: {
  x: number
  z: number
  children: string
  color?: string
  size?: number
}) {
  return (
    <Lettering
      at={[x, 0.15, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      size={size}
      maxWidth={15}
      color={color}
    >
      {children}
    </Lettering>
  )
}

function Footprint({
  x,
  z,
  width,
  depth,
  label,
  mat,
  onSelect,
  surface = true,
}: {
  x: number
  z: number
  width: number
  depth: number
  label: string
  mat: Palette
  onSelect?: () => void
  surface?: boolean
}) {
  return (
    <group
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.()
      }}
    >
      {surface && (
        <RoundedSurface
          x={x}
          z={z}
          width={width}
          depth={depth}
          height={0.045}
          radius={0.7}
          mat={mat.bayFloor}
        />
      )}
      <CornerMarks
        x={x}
        z={z}
        width={width}
        depth={depth}
        mat={mat.yellow}
        y={surface ? 0.017 : 0.072}
      />
      <GroundLabel x={x} z={z} size={0.7} color="#37424a">
        {label}
      </GroundLabel>
    </group>
  )
}

function Terrain({
  guides,
  view,
  onSelect,
  landscape = false,
  reception = false,
}: {
  guides: boolean
  view: View
  onSelect: (view: View) => void
  landscape?: boolean
  reception?: boolean
}) {
  const mat = useGroundMaterials()
  const edges = useMemo(() => {
    const boundary = new Path()

    boundary.moveTo(-22.8, 37)
    boundary.lineTo(-22.8, -26)
    boundary.quadraticCurveTo(-22.8, -28.8, -20, -28.8)
    boundary.lineTo(56, -28.8)
    boundary.quadraticCurveTo(58.8, -28.8, 58.8, -26)
    boundary.lineTo(58.8, 37)

    return [boundary].map((path) => path.getPoints(20).map((p) => [p.x, p.y] as [number, number]))
  }, [])

  return (
    <group name="ground-construction-layer">
      {view !== 'entrance' && !landscape && (
        <mesh rotation-x={-Math.PI / 2} position={[18, -0.25, 7]}>
          <planeGeometry args={[1200, 1200]} />
          <meshStandardMaterial color="#9b9c89" roughness={1} />
        </mesh>
      )}
      <RoundedSurface
        x={18}
        z={5.5}
        bottom={-0.23}
        height={0.2}
        width={82}
        depth={69}
        radius={3}
        mat={mat.ground}
      />
      <group
        onClick={(event) => {
          event.stopPropagation()
          onSelect('waiting')
        }}
      >
        <RoundedSurface
          x={-13.15}
          z={7.5}
          width={7.3}
          depth={5.6}
          height={0.1}
          radius={1}
          mat={mat.wood}
        />
      </group>
      {/* The ground plan reuses the operational centres. No routes are reassigned. */}
      <PedestrianWalk mat={mat.pavement} curb={mat.curb} joint={mat.joint} />
      {/* Only the property's ground is shown; the exterior street is omitted. */}
      <PaintStroke points={edges[0]} width={0.18} mat={mat.marking} />
      <ServiceGroundMarkings mat={mat} />
      {/* Omit the two isolated reception beds in this layer, preserving the full scene. */}
      {Object.entries(plantingBeds)
        .filter(([zone]) => zone !== 'receptionWest' && zone !== 'receptionRear')
        .map(([zone, bed]) => {
          const radius = Math.min(1.6, bed.width / 2, bed.depth / 2)

          return (
            <group key={zone} name={`empty-planter-${zone}`}>
              <RoundedSurface
                x={bed.x}
                z={bed.z}
                width={bed.width}
                depth={bed.depth}
                height={bed.height}
                radius={radius}
                rim={0.14}
                mat={mat.plaster}
              />
              <RoundedSurface
                x={bed.x}
                z={bed.z}
                width={bed.width - 0.28}
                depth={bed.depth - 0.28}
                height={0.02}
                bottom={bed.height - 0.065}
                radius={Math.max(0.02, radius - 0.14)}
                mat={mat.soil}
              />
            </group>
          )
        })}
      {reception && (
        <RoundedSurface
          x={-6}
          z={1}
          width={6.9}
          depth={6.1}
          height={0.045}
          radius={0.7}
          mat={mat.bayFloor}
        />
      )}
      {guides && (
        <group name="ground-footprints">
          {!reception && (
            <Footprint
              x={-6}
              z={1}
              width={6.9}
              depth={6.1}
              label="01 · RECEPCIÓN"
              mat={mat}
              onSelect={() => onSelect('reception')}
            />
          )}
          <Footprint
            x={-13.15}
            z={7.5}
            width={7.3}
            depth={5.6}
            label="02 · ESPERA"
            mat={mat}
            surface={false}
            onSelect={() => onSelect('waiting')}
          />
          {BAY_IDS.map((id) => {
            const [x, z] = bayCenter(id)

            return (
              <Footprint
                key={id}
                x={x}
                z={z}
                width={7.5}
                depth={9.2}
                label={`SERVICIO · ${id}`}
                mat={mat}
                onSelect={() => onSelect('service')}
              />
            )
          })}
          <Footprint
            x={50}
            z={17}
            width={5}
            depth={9}
            label="04 · ENTREGA"
            mat={mat}
            onSelect={() => onSelect('delivery')}
          />
          <GroundLabel x={20} z={10}>
            CIRCULACIÓN →
          </GroundLabel>
          <GroundLabel x={20} z={-15}>
            ACCESO A BAHÍAS
          </GroundLabel>
          <GroundLabel x={3.4} z={34}>
            ENTRADA ↑
          </GroundLabel>
          <GroundLabel x={51} z={34}>
            SALIDA ↓
          </GroundLabel>
          <GroundLabel x={18} z={-23.5} color="#d4d9b0">
            ÁRBOLES Y ARBUSTOS · PERÍMETRO
          </GroundLabel>
        </group>
      )}
    </group>
  )
}
