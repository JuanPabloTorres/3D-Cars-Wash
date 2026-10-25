# CarWash Studio: propietarios comprobados

Revisar rutas contra el código actual; este mapa es específico del proyecto.

| Capacidad | Propietario |
| --- | --- |
| Entradas cliente/admin/empleado/capas | `src/main.tsx` |
| Draft, sesión y comandos privados | `src/app/commerceStore.ts` |
| Conexión comercial compartida | `src/app/useCommercialSession.ts` |
| Navegación y overlays | `src/app/store.ts`, `src/ui/WorldOverlayManager.tsx` |
| Cuenta/login | `src/ui/account/` |
| Dashboard, componentes y hook | `src/admin/AdminApp.tsx`, `src/admin/components/`, `src/admin/hooks/` |
| Catálogo/recepción DOM | `src/reception/` |
| Escena por capas | `src/world/layers/ground*`, `reception/`, `operations/`, `lounge/` |
| Cámara recepción/lounge | `src/world/layers/reception/ReceptionCamera.tsx`, `cameraFlight.ts` |
| Maceta y anclaje | `src/world/prefabs/Planter.tsx` |
| Mapas PBR clonados | `src/world/materials/textureMaps.ts` |
| Difusor de lámparas | `src/world/layers/WarmDiffuser.tsx` |
| Reglas de operación y proyección | `src/domain/DemoOperationSource.ts`, `OperationProjection.ts` |
| API, permisos y composición | `server/demoApi.ts`, `users.ts`, `sessionTokens.ts`, `services.ts` |
| Persistencia SQLite | `server/persistence.ts` |
| Pruebas aisladas vigentes | `config/testing/playwright.staff.config.ts`, `tests/e2e/staff-integration.spec.ts` |

Invariantes específicos:

- `?layer=ground` conserva el solar vacío; no poblarlo al mejorar paisaje. Las capas posteriores agregan capacidades.
- El fondo aprobado es imagen, no edificios 3D fuera del local. No recuperar vegetación descartada ni árboles externos por usar documentos antiguos.
- Las operaciones usan medallones e iconos, no vehículos o trabajadores 3D decorativos. Las escenas conservadas pueden tener otros prefabs activos: comprobar entradas antes de retirar.
- Admin y empleado son dashboards sin canvas. Cliente usa la navegación espacial.
- Servicio completado, llegada a entrega, retiro y pago son estados distintos. La notificación interna es mock; no presentarla como SMS/correo enviado.
- Preservar marca configurable y precios por categoría. El texto FEBLES de referencias no autoriza reemplazar configuración.
- La revisión del Studio fue retirada: no recrearla como requisito de trabajo o aceptación.
- La versión actual es MVP local. Docker, pagos, mensajería externa y agente IA tienen pendientes propios; no declararlos listos por pasar tests de escena.

Pruebas: `npm test`, `npm run build`, `npm run build:server`, `npm run test:e2e`. El runner por defecto de Playwright reutiliza la configuración de staff con SQLite temporal en 4175; no reinicia ni modifica el servidor del usuario en 4173.
