# FEBLES CAR WASH — Design & Implementation Brief v2.0

**Fecha:** 2026-10-23  
**Repositorio objetivo (sin inspección en esta revisión):** `C:\Projects\Repos\3D-Cars-Wash`  
**Base contractual:** SOW Febles Immersive Experience 3D v1.0.  
**Estado:** propuesta de diseño y arquitectura, no certificación de implementación.

## 0. Objetivo no negociable

El **car wash 3D navegable** es la interfaz principal. No debe existir un reemplazo por landing page, dashboard, tarjetas, sidebar o página de e-commerce. El usuario entra, camina (primera persona por defecto), conversa, inspecciona servicios, ve vehículos en cola, observa bahías y sigue su orden sin salir del mundo. La escena es persistente y responde a datos del negocio.

**IMPORTANTE:** las 8 imágenes de referencia son arte conceptual, NO promesas de fidelidad visual ni una captura de un sistema construido. Su realismo cinematográfico, la figura del cliente visible en primer plano y la saturación de actividades se deben adaptar a capacidades web reales.

## 1. Evaluación de las ocho referencias visuales

| Archivo visual | Qué conservar | Qué adaptar |
|---|---|---|
| `Entering the Febles Car Wash-1(2).png` | Entrada, cinco bahías, recepción visible, señalización, camino peatonal | Cámara primera persona; no exigir al motor reflejos cinematográficos ni avatar en primer plano |
| `Welcome to Febles Car Wash-2(2).png` | Recepcionista, saludo, tres acciones situadas físicamente en mostrador | Los objetos interactivos deben abrir funciones reales; saludo a distancia y `E` solo al entrar en rango |
| `Virtual Car Wash Vehicle Check-In-3(2).png` | Ficha de vehículo, registro y recepción conectada al mundo | El registro web crea solicitud; solo personal/sistema autorizado confirma llegada física |
| `Febles Car Wash Service Demo-4(2).png` | Comparador de lavado, focos, interior con muestras de equipamiento | Eliminar piezas y partículas de alto costo, usar GLB/PBR y panel breve, no vitrina de imágenes |
| `Silver SUV Awaiting Service-5(2).png` | Auto de cliente visualizado una vez, tarjeta de espera, área de observación | No encender badge de orden propia sin autenticación/autorización; mostrar cola exacta solo con datos confirmados |
| `Bay 02_ Interior Service Underway-6(2).png` | Trabajador, vehículo en bahía 02, badges de tareas individuales | Separar `task.status` de `vehicle.status`; no inferir finalización de servicios por animaciones |
| `Febles Car Wash_ Service Complete-7(2).png` | Entrega con recepción, comprobante y vehículo en zona de salida | La UI no debe afirmar pago o entrega confirmados sin eventos de backend |
| `Carwash quote confirmation at reception-8(2).png` | Confirmación de cotización con desglose y opciones de revisar/cambiar | No usar $35/$10/$45 como precios reales: cifras únicamente ilustrativas y marcadas como DEMO |

## 2. Dirección artística y alcance visual reproducible

- Identidad Febles: carbón `#171A21`, rojo `#D9343A`, blanco cálido `#F3F3F0`, cemento medio `#777C82`, vegetación tropical. Ajustar a branding real cuando esté disponible.
- Estructura: cinco bahías repetibles, techos metálicos, pilares, barreras, drenajes, mostrador, lounge, senderos y accesos. Mallas 3D modulares y materiales PBR básicos.
- GLB reales para autos, empleada y trabajadores (nunca figuras SVG); texturas optimizadas; rigs y clips adquiridos/documentados.
- Reflejos simulados moderados, luces suficientes y sombras selectivas. Evitar postproceso extensivo, SSR de pantalla completa, espumas volumétricas, simulaciones físicas de agua y docenas de NPC.
- Las imágenes muestran personajes de estilo animado muy expresivo; sustituir por personajes GLB estilizados sobrios con rostro y rig consistentes.
- Primera persona por defecto; cámara de ojos aproximadamente 1.6-1.7 m (ajustar tras pruebas de escala). Tercera persona opcional, no permanente.
- **HUD contextual**: prompts cerca de objetos, badge de auto cuando aplica, selector compacto temporal de destinos, sin áreas de UI persistentes ocupando la escena.

## 3. Geografía y rutas del mundo

Disposición **conceptual, no levantamiento real del local**:

```text
                  AREA DE VEHICULOS (NO TRANSITABLE POR VISITANTE)
     ENTRADA AUTOS -> COLA Q3 -> Q2 -> Q1 -> BAHIAS [1][2][3][4][5] -> ENTREGA -> SALIDA
                     |                    |                |
          barreras de seguridad   vidrio / barandal de observación
                     |                    |                |
  ENTRADA PEATONAL --- PLAZA --- RECEPCION --- MIRADOR --- LOUNGE
                                  |
                             EXHIBICION SERVICIOS
```

- Rutas peatonales distintas de rutas de vehículos. Un usuario nunca camina dentro de una bahía operativa.
- Zonas semánticas: `pedestrian_entrance`, `reception`, `service_exhibit`, `viewing_point`, `lounge`, `pickup_counter`; zonas de tráfico `car_entry`, `queue_slot:n`, `bay:n`, `handover`, `car_exit`.
- Navegación guiada **recorre** rutas y enseña desplazamiento; no teletransporta.
- MVP: `RouteGraph` con waypoints y comprobación de tramos transitables; exponer `IPathPlanner` para migrar a NavMesh (Recast) cuando la geometría lo justifique. Colisiones de cámara/personaje y cancelación de ruta al mover manualmente.
- Auto-movimiento: splines o secuencias de waypoints de carril; detener en slots y semáforos; interpolar posición/orientación, nunca tras paredes o peatones. No usar física de vehículos completa en MVP.

## 4. Qué debe suceder mientras el cliente está visitando

### 4.1 Escena de llegada

La puerta peatonal está abierta y recepción es alcanzable. El visitante oye/ve actividad moderada del mundo. Una unidad entra por carril de autos, **solo en demo** o si un evento operativo respalda una transición. Modo demo visible desde el principio.

### 4.2 Recepción

Al aproximarse a la recepcionista aparece `E · Hablar`. La empleada usa clips Idle → Greet → Talk → Idle. Interacciones:

- Primera visita: explicación breve del flujo y guía a servicios.
- Explorar servicios: texto y ejemplos tomados del catálogo autorizado, selecciones de paquetes compatibles.
- Registrar auto: datos básicos y solicitud, sin afirmar llegada física.
- Cotizar: llamada a la API (o adapter DEMO); detallar servicios y total; confirmar por acción explícita.
- Consultar orden: exige identidad/autorización y muestra estado confirmado, sin revelar datos de terceros.

La lógica conversacional inicial es **determinista y estructurada**. IA natural posterior solo traduce intenciones a consultas/acciones, con permisos y reglas comerciales en el servidor.

### 4.3 Servicios físicos

Una pequeña estación de muestras presenta lavado, focos, interior; cada muestra real 3D funciona como `InteractionPoint` y abre información breve. Si el catálogo permite combinarlos, el usuario construye una cotización, que el servidor calcula. No crear un sitio e-commerce alrededor de la escena.

### 4.4 Cola y movimientos

Vehículos se renderizan en posiciones lógicas (Q3→Q2→Q1→bahía). Si se libera un slot, las unidades avanzan en secuencia **solo bajo escenario demo** o cambios respaldados por estado validado. La vista no debe garantizar ubicación física exacta si el negocio no proporciona telemetría ni check-in/ocupación por estación.

### 4.5 Bahías

Cada `WashBayPrefab` recibe `bayId`, `occupancy`, `stage`, `visibleTasks`, `visualQuality`. En lugar de una única animación genérica:

| Servicio | Acción visual reproducible | Badge opcional |
|---|---|---|
| Lavado exterior | cepillo simple giratorio + sprites/partículas discretas | `Exterior · En curso` |
| Interior / aspirado | trabajador con loop aspirar junto a puerta | `Interior · En curso` |
| Focos | empleado en parte delantera con clip de inspección | `Focos · Pendiente / En curso` |
| Inspección | empleado rodea/observa el auto o se queda en punto de inspección | `Inspección` |

La animación debe representar actividad documentada; **nunca escribir estados comerciales**. Las tareas pueden estar pendientes, activas, completadas, canceladas o no reportadas, independientes del estado general de la orden.

### 4.6 Lounge y entrega

El cliente puede caminar desde mirador hasta lounge, sin cargar otra página. El estado propio permanece accesible mediante control contextual. «Listo para entrega» únicamente si el backend lo declara; «Entregado» únicamente con autorización del flujo de entrega. Si no hay integración de pago, no incluir pago confirmado ficticio en modo real.

## 5. Modelo de objetos del mundo

```ts
interface WorldVehicle {
  worldEntityId: string;      // ID estable en la escena
  operationVehicleId?: string; // Solo si el backend permite identificarlo
  visibility: 'own' | 'anonymous';
  operationalState: 'unknown' | 'pending-arrival' | 'arrived' | 'queued' |
    'bay-assigned' | 'in-service' | 'inspection' | 'ready' | 'delivered';
  visualLocation: string;      // entrada, Qn, bay:n, entrega, salida
  locationConfidence: 'confirmed' | 'representational' | 'demo';
  sourceRevision?: number;
  updatedAt?: string;
}

interface BayViewModel {
  bayId: string;
  vehicleEntityId?: string;
  occupancy: 'free' | 'occupied' | 'unknown';
  tasks: Array<{ id: string; label: string; status: 'pending'|'active'|'done'|'unknown' }>;
  sourceRevision?: number;
}

interface WorldInteraction {
  id: string;
  anchor: [number, number, number];
  radiusMeters: number;
  label: string;
  kind: 'talk'|'inspect'|'navigate'|'quote'|'checkin'|'pickup';
  targetId: string;
  allowedBy: 'public' | 'authenticated' | 'authorized';
}
```

Los tipos anteriores representan **contratos frontend propuestos**, no datos que se haya comprobado que el backend entregue actualmente.

## 6. Reglas de estado, reconciliación y privacidad

- Fuente de verdad: API de negocio. `OperationProjection` mapea snapshots/eventos a estado 3D pero nunca escribe pagos, entrega, posiciones o servicios por sí sola.
- Fuente `DemoOperationSource` completamente separada de `LiveOperationSource`; no permitir que modo demo escriba en APIs productivas.
- Eventos idempotentes con `eventId`, `revision`, `occurredAt`; ignorar revisiones obsoletas, pedir snapshot en reconexión y evitar vehículos duplicados.
- Mantener **una sola instancia visual** por `worldEntityId`. Si un auto pasa de cola a bahía, mover esa instancia por ruta, sin clonar otra.
- Si el backend no entrega posición física, mostrar `representación del proceso`, no `ubicación en tiempo real`.
- Nunca exponer nombres/placas/órdenes de otros visitantes; otros autos pueden ser genéricos anonimizados.
- Nunca mostrar números de posición o tiempos de espera inventados en modo real. Si no se sabe, `Estado no actualizado` / `Posición no disponible`.
- La cotización la calcula el backend; aceptación explícita con revisión de precios; ingreso al local no equivale a confirmación de llegada.

## 7. Badges 3D contextuales

Priorizar un sistema central `WorldBadgeSystem`, anclado a objeto o posición mundial, por ejemplo usando Drei `<Html>` con oclusión.

1. **Auto propio** — un badge pequeño al apuntar, acercarse, abrir consulta o seleccionar `Ver mi auto`, con estado y frescura del dato.
2. **Bahía** — señal fija `01 ... 05`; el badge `En curso / libre / inspección` aparece solamente cuando la cámara está cerca o la bahía es foco.
3. **Servicio** — etiqueta de tarea en el área de ejecución `Interior · En curso` u otra etapa validada; no mostrar 3+ etiquetas sobre cada auto simultáneamente.
4. **Cola** — panel físico en área de espera, con contador confirmado; no etiquetas de identidades de otros conductores.
5. **Recepción** — prompt `E · Hablar` solamente en radio y línea visual, no atravesando muros.

Reglas: anclaje a coordenadas del mundo, escalar por distancia con mínimo legible, ocultar tras paredes, prioridad de un solo elemento activo, autocierre al alejarse. Contraste accesible en móvil; sin HTML permanente cubriendo el canvas.

## 8. Arquitectura modular de implementación

```text
src/
  app/                  # bootstrap, provider, modo demo/real
  world/
    WorldScene.tsx
    WorldLayout.tsx
    zones/               # puntos de entrada, recepción, bahías, lounge
    prefabs/             # WashBay, Vehicle, Staff, Reception, ServiceDisplay
    navigation/          # IPathPlanner, WaypointPathPlanner, CameraController
    movement/            # VehicleMovementSystem, AvatarMovementSystem
    interactions/        # InteractionRegistry, ProximityDetector, InteractionRunner
    badges/              # WorldBadge, BadgeVisibilityPolicy
    animation/           # clips, effects, state visual mappings
    assets/              # manifiesto GLB y licencias
  domain/
    contracts/           # order/service/vehicle/bay/queue DTOs
    adapters/            # LiveOperationSource, DemoOperationSource
    projection/          # OperationProjection + reconciliación por revision
  reception/             # script/dialogue FSM y acciones autorizadas
  ui/                    # HUD contextual y controles táctiles
  tests/                 # navegación, operaciones, screenshots, e2e
```

Separación: el renderer lee `WorldViewModel`; `InteractionRunner` solicita acciones al caso de uso; este invoca backend, y la proyección del backend actualiza el mundo. Ningún `Prefab` de vehículo maneja reglas de precio, cobro o confirmación.

### Dependencias preferidas

- React + TypeScript, `three`, `@react-three/fiber`, `@react-three/drei`, `zustand` (según stack actual del repo).
- `AnimationMixer`/clips de GLB para personas/equipamiento.
- `GLTFLoader` y optimización de GLB; compresión opcional Meshopt/KTX2 tras validar exportaciones.
- Rutas por waypoints primero; `recast-navigation-js` después, bajo `IPathPlanner`, si el layout lo exige.
- Playwright para escenarios, capturas y trazas. Verificar personalmente WebGL y errores en la consola.
- No sustituir Three.js, no PixiJS, no motor alternativo.

## 9. Etapas y criterios de corte

### G0. Discovery real del repositorio (OBLIGATORIO)

Leer árbol, package.json/lockfile, páginas actuales, 3D assets GLB, licencias, texturas, rig/clips, backend y pruebas. Producir clasificación `REUSABLE`, `ADAPT`, `REPLACE`, `UNKNOWN`. No inventar rutas/assets que no se inspeccionaron.

### G1. Blockout navegable

Escena única con entrada, ruta segura, mostrador, línea visual al menos a una bahía; cámara primera persona; controles escritorio/móvil; click destino -> movimiento verificable sin teletransporte. No agregar efectos de agua todavía.

### G2. Dirección artística aplicada

Modelos GLB reales para vehículo y recepcionista, entorno modular sobrio, señalización clara. Aprobación por capturas y recorrido en navegador. No empezar siguientes etapas por compilar.

### G3. Experiencia de recepción completa

Acercarse -> conversar -> consultar tres servicios demo -> seleccionar -> obtener cotización demo -> revisar/cancelar/confirmar sin pasar de la escena. Peticiones y errores visibles; ninguna acción se marca como autorizada por la animación.

### G4. Bahía demostrativa operativa

Un auto entra en cola demo -> avanza -> entra a bahía 01 -> trabajador realiza loop visual -> badges de tareas se actualizan por eventos demo -> sale a entrega. Sin clonación ni pasos instantáneos. La demo se puede pausar/reiniciar y avanzar por eventos para pruebas deterministas.

### G5. Expansión y conexión real

Cinco bahías por instancias, cola, lounge, entrega, eventos reales, reconciliación y privacidad. Nunca conectar producción si G0 no confirmó contratos, identidades y autorizaciones.

## 10. Matriz de pruebas obligatorias

- **Navegación:** entrada -> recepción -> exhibidor -> mirador -> lounge, trayectorias observables y cancelación manual; no atravesar autos/columnas.
- **Interacciones:** prompt solo cerca del objeto y con foco; oculto a través de paredes; `E` y táctil equivalentes.
- **Escenario demo:** cola 0/3/5, 1 y 2 bahías activas, auto propio no se duplica, entrada/avance/bahía/salida.
- **Estado:** evento fuera de orden, evento duplicado, reconexión, snapshot corregido, estado no disponible; sin confirmar por animación.
- **Recepción:** preguntas, cambio de servicio, cancelar y confirmar, errores de backend, catálogo actualizado; totales demo identificados.
- **Privacidad:** visitante anónimo nunca obtiene identidad ni placa de otros vehículos; dato de auto propio requiere autorización.
- **Viewport:** desktop 1440×900 y móvil 390×844; joystick, gesto de mirar y botones utilizables sin tapar la escena.
- **Rendimiento:** reportar FPS real y percentiles, draw calls, memoria GPU y red; definir objetivos después del primer slice, no prometer 60 FPS sin medir.
- **Evidencia:** Playwright screenshot por zona y escenario; video continuo de recorrido; consola sin errores; revisión artística **separada** de E2E.

## 11. Directiva final para Codex

> **No construir otra web convencional.** Implementa un mundo 3D persistente, en primera persona, con la recepción y el car wash como objetos utilizables. Haz que las personas caminen y los autos se muevan por rutas; los badges de servicio y espera aparecen anclados al mundo y reflejan solo datos autorizados. Usa arquitectura 3D modular y GLB reutilizables, con five `WashBayPrefab` en la expansión. Durante el slice crea la entrada, recepción, diálogo de servicios, un auto real GLB y una bahía operativa DEMO, con controles escritorio y táctiles. Antes de programar inspecciona el repositorio y registra los assets/contratos realmente existentes. Registra resultados de Playwright y capturas desde el juego real. No presentes ilustraciones generadas como capturas del sistema y no interpretes la belleza de referencias cinematográficas como una obligación de reproducirlas píxel por píxel.
