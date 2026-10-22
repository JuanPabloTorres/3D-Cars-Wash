# Auditoría de experiencia · v0.2

## Contrato visual y de interacción

La aplicación es un local 3D vivo con dirección de cámara. El visitante elige una intención y el sistema ejecuta el encuadre, la marcha del avatar y las rutas del carro. No se requiere controlar ejes, arrastrar la cámara ni navegar por un mapa libre. Las ocho imágenes aportadas son referencias de arte; ninguna funciona como fondo del home.

La dirección artística toma techos rojos, acero oscuro, recepción en madera, piso mojado, cinco cubículos, vegetación tropical y personajes caricaturescos con volumen. Los modelos de esta versión se generan con geometría suave y materiales físicos. El acabado es una aproximación procedural: **no se acredita igualdad visual con el detalle y las expresiones de las ilustraciones**. El siguiente trabajo artístico debe reemplazar las entidades intercambiables por modelos GLB diseñados y animados para esa referencia, preservando sus contratos y sus estados.

## Hallazgos corregidos

| Hallazgo | Cambio |
| --- | --- |
| Entrada inicial demasiado aérea | Encuadre desde la entrada; transiciones dirigidas a recepción, servicios, carro y lounge. |
| Fondo de imágenes no cumple el mundo vivo | Se retiró el experimento y sus recursos. Entorno, personajes, vehículos y herramientas son objetos 3D. |
| Navegación libre contraria al flujo solicitado | Selección de intención, objetos por raycasting y marcadores accesibles; cámara automática. |
| Carro enviado siempre a cubículo 4 | La asignación usa el cubículo real 1–5. Se oculta la actividad ambiental que ocuparía ese espacio. |
| Visita activa no recuperada al volver | Consulta de órdenes y recuperación del detalle completo de la última activa. |
| Vista de estado solo en panel | HUD en home, identificador sobre el carro y tareas proyectadas cerca del vehículo. |
| Cambios de estado sin recorrido convincente | Rutas con puntos de paso por zona de espera, carril de distribución, cubículo y salida. |
| Todos los modelos iguales | Tipo de vehículo, pintura, ruedas y puerta articulada; puerta interior ligada a la tarea. |
| Actividad inmóvil | Brazos y piernas animados, operarios trabajando, entrada/salida ambiental coordinada, agua y espuma, palmas y nubes. |
| Fallo silencioso de actualización | Mensaje de desconexión conservando el último estado confirmado. |

## Propietarios y módulos

- `lib/world.ts`: dirección de cámara, proyección de interacciones y sincronización de órdenes con la escena.
- `lib/world/entities.ts`: carro, persona y efectos de agua; animaciones y rutas visuales.
- `lib/world/environment.ts`: arquitectura, mobiliario, paisaje, displays y reflejo del piso.
- `lib/world/primitives.ts`: geometrías reutilizables, materiales, letreros y agrupación por material.
- `lib/server/`: servicios y repositorio SQL existentes. El servidor mantiene autoridad sobre estado, asignación y permisos.

La simulación ambiental no crea ni completa órdenes. El recorrido demo solo altera memoria local. Las órdenes reales se actualizan desde la API cada 15 segundos y avanzan únicamente mediante acciones autorizadas del personal. La escena representa estados registrados; no es una cámara ni una medición física en vivo del establecimiento.

## Seguridad y alcance

Se conservan validación de entrada, aislamiento de órdenes por propietario, permisos administrativos en servidor, precios calculados en servidor, idempotencia, concurrencia por versión y restricción SQL de ocupación única del cubículo. El acceso usa autenticación del alojamiento. No hay OTP de correo ni cobros electrónicos configurados. Los precios y tiempos siguen siendo ilustrativos.

## Verificación y límites

Las pruebas cubren reglas de negocio, restricciones SQL, rutas continuas sin teletransporte, llegada del avatar, puerta articulada, partículas dinámicas, tipos de vehículo y geometrías finitas del entorno. También se comprueban tipos y compilación de producción.

La inspección del home 3D en el navegador de pruebas está bloqueada por `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled` y `Error creating WebGL context`. No se atribuye el bloqueo a un fallo del hardware del usuario. No se acredita aceptación visual, FPS en móviles ni el flujo autenticado completo del nuevo home. El sitio muestra un error recuperable cuando WebGL no está disponible. La versión debe revisarse en un navegador con WebGL antes de considerar aprobado su acabado artístico.
