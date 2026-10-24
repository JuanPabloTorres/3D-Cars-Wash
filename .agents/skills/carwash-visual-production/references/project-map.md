# Propietarios observados · 23-10-2026

Confirmar símbolos y consumidores en cada tarea; este mapa no es un contrato inmutable.

| Capacidad | Dueño actual | Límite |
|---|---|---|
| Montaje/streams | `src/app/App.tsx` | No duplicar suscripción por vista |
| Renderer/carga/WebGL | `src/world/WorldScene.tsx` | Recursos compartidos y cleanup |
| Navegación | `src/app/store.ts`, `src/world/navigation/CameraController.tsx`, `src/world/navigation/layout.ts` | Transición separada del comercio |
| Plano/circulación | `src/domain/sitePlan.ts`, `src/domain/DemoOperationSource.ts`, `src/domain/vehicleMotion.ts` | Reservas/rutas libres; animación no adelanta tareas |
| Proyección | `src/domain/OperationProjection.ts` | Revision/stream/event IDs |
| Sesión/cotización/orden | `src/app/commerceStore.ts`, `server/demoApi.ts` | Permisos en proveedor, sandbox local |
| Contenido | `server/configuration.ts`, `server/business-config.json` | Sin datos inventados |
| Arquitectura | `src/world/WorldLayout.tsx`, `src/world/prefabs/Architecture.tsx`, `src/world/prefabs/LoungePrefab.tsx` | Rutas, escala y ocupación |
| Paisajismo | `src/world/siteLandscape.ts`, `src/world/prefabs/Landscape.tsx` | Zonas de tierra, raíces y superficies compartidas; sin colocaciones vegetales duplicadas en entrada/perímetro |
| Modelos/vehículos | `src/world/assets/registry.ts`, `src/world/prefabs/Model.tsx`, `src/world/prefabs/VehicleAppearance.tsx` | Clones y nodos semánticos |
| Personal/gestos | `src/world/prefabs/StaffPrefab.tsx`, `src/world/animation/NPCAnimationController.ts` | Un mixer, clips sin efecto comercial |
| Herramientas/efectos | `src/world/prefabs/StaffPrefab.tsx` (StaffTool), `src/world/prefabs/ServiceActivityVisualizer.tsx` | Mano → grip → boquilla → superficie |
| Paneles/props | `src/ui/WorldHUD.tsx`, `src/ui/WorldOverlayManager.tsx`, `src/reception/ReceptionDialogue.tsx`, `src/world/prefabs/CounterObjects.tsx` | Pointer/touch/teclado; formularios HTML |
| Presentación | `src/ui/world.css`, `src/ui/sow.css` | Un escritor para reglas compartidas |
| Pruebas | `tests/e2e/commercial.spec.ts`, `tests/e2e/sow.spec.ts`, `playwright.config.ts` | Suites activas, no históricas excluidas |

Rutas relativas a la raíz del repositorio.

## Riesgos observados por lectura

- Composición dispersa entre cámara, props, arquitectura y CSS. Offsets de cámara no miden panel real.
- `diagnostics` transporta poses/anclas funcionales usadas por cámara/personal/efectos: no es telemetría removible.
- `DemoOperationTransport.ts` importa `demoRequest` de `app/commerceStore.ts`: dependencia invertida puntual; no justifica reescritura.
- Plano operativo, arquitectura y obstáculos repiten coordenadas. Revisar juntos al mover pilares/truck.
- `CounterObjects` contiene cuatro props volumétricos y equivalentes HTML sin escala 3D: Servicios, Horarios, El local y Preguntas. El centro queda libre; Preparar orden se conserva mediante el diálogo. Medir targets reales y encuadre en navegador: la existencia del JSX no acredita accesibilidad ni estética.
- `tests/e2e/sow.spec.ts` comprueba cuatro props en 1855, 1440, 650 y 390 px, foco y conservación de selección; `commercial.spec.ts` conserva el flujo de preparación mediante diálogo. Consultar la ejecución actual, sin atribuir resultados históricos a una nueva versión.
- Breakpoints 600/700 px y CSS sucesivo: comprobar también 601–700 px.
- Capturadores históricos tienen precios/textos fijos. Inspeccionarlos antes de usar; no modificar tarifas para obtener PASS.

Preferir ajuste del dueño actual. Un contrato de composición compartido se justifica si cámara + panel + pruebas necesitan la misma variación. No hace falta nuevo motor o framework. La auditoría no autoriza refactor automático.
