# G0 — Fundamentos de la reconstrucción

Fecha: 2026-10-23. Alcance autorizado: G0 y G1. No producción ni cinco bahías.

## Estado inicial observado

El directorio activo contenía exclusivamente `.git`. Sin package.json, assets,
backend, pruebas, configuración privada ni aplicación ejecutable. El historial
Git permanecía intacto; las eliminaciones de archivos versionados ya existían.
No se recuperó código, componentes ni escena de archivos anteriores.

Clasificación del sistema anterior: REPLACE por decisión del usuario. Contratos
de negocio reales: UNKNOWN, porque no existe backend en el directorio activo.
Los únicos documentos de producto copiados son el Master SOW y el Brief v2
proporcionados en Downloads. Recursos nuevos descargados desde fuentes oficiales.

## Stack y límites

React 19.3.1, TypeScript 5.9, Three.js 0.186.1, Fiber 9.8.2, Drei 10.7.9,
Zustand 5; Vite 8.3.5 sobre Node 22.19. Dependencias compatibles según peers
consultados antes de instalar. Lockfile conservado. Playwright usa Edge Chromium.
Vitest prueba contratos puros. Ningún servicio externo ni cuenta es necesario.

Un Canvas y una escena. Sin router, dashboard, PixiJS ni código SVG de personajes.
Lucide se limita a controles HTML; todo vehículo y persona es una malla GLB.
La infraestructura modular nueva utiliza mallas simples y materiales PBR según
la excepción del Master SOW §10. No se modelaron vehículos ni personas con ellas.

## Plano en metros

- Origen de coordenadas: patio del establecimiento; +Y arriba; +Z hacia entrada.
- Entrada peatonal: (-7, 14.5); ojos a 1.66 m.
- Recepción: pabellón x=-6, z=-2.1. Mostrador z=0.3; llegada segura (-6,2.25).
- Exhibidor: (-9.9,2.05); posición de lectura (-9.9,3.65).
- Bahía única 01: centro (3.4,-4.2), ancho 7.5 m y profundidad 9.5 m.
- Mirador: (1.2,4.3), con barandal a x=1.85 y visión diagonal al auto.
- Carril único DEMO: x=3.4; entrada y salida por el frente de la bahía.
- Tres espacios de fila Q1/Q2/Q3: z=4/10.2/16.4, separados 6.2 m.
- Observadores de fila: (-5.15,9.4) y (-5.15,14.5), dentro del sendero.

No se han construido lounge completo, caja, entrega comercial ni otras bahías.
El plano de expansión queda en el brief, sin fingir que esas áreas están terminadas.

## Propietarios y contratos

| Propietario | Entrada y salida | Invariante |
|---|---|---|
| `WorldScene` | Manifiesto GLB → escena lista/error | Un renderer; error recuperable |
| `WaypointPathPlanner` | Origen/destino → waypoints o null | Cada tramo es transitable |
| `CameraController` | Teclado/táctil/ruta → cámara humana | Radio físico; control manual cancela ruta |
| `InteractionRegistry` | Posición, foco y raycast → interacción | Sin diálogo remoto o a través de muros |
| `StaffPrefab` | Estado visual → clip | Saludo breve; conversación estructurada |
| `DemoOperationSource` | Reloj/control DEMO → evento revisado | Sin red, APIs ni pagos |
| `OperationProjection` | Estado/evento → WorldViewModel | Idempotencia; una entidad por ID |
| `VehiclePrefab` | Ubicación objetivo → interpolación | No escribe estados comerciales |
| `ReceptionDialogue` | Acción explícita → explicación/ruta | No confirma llegada ni orden real |

## Algoritmo implementado

1. Cargar assets locales y construir mundo. Mostrar error con recarga si falla.
2. Resolver rutas sobre grafo de visibilidad; comprobar colisiones por tramos.
3. Leer entradas por frame y desplazar físicamente la cámara, con deslizamiento.
4. Cancelar ruta al caminar manualmente; cerrar diálogo con Escape.
5. Determinar proximidad, dirección de mirada y oclusión antes de habilitar E/tap.
6. Recepción: primera visita, servicios e información de vehículo DEMO sin datos privados.
7. Emitir eventos DEMO independientes del render; ignorar revisiones antiguas/duplicadas.
8. Mantener un vehículo, moverlo por carril y representar tareas mediante animación.
9. Validar en navegador. La aprobación artística pertenece al usuario.

## Preparación de expansión

`WashBayPrefab` acepta bayId; activos y registro de interacción están separados.
`IPathPlanner` permite otro planificador sin cambiar controles. `OperationSource`
define el límite de datos; sólo existe su implementación DEMO. El adaptador real
requiere contratos, identidad, autorizaciones y reconciliación por snapshot antes
de conectarse. No existe un fallback silencioso de producción a datos ficticios.
