# Organización y mantenimiento

La raíz conserva entradas convencionales del proyecto. La configuración auxiliar y los componentes se agrupan por responsabilidad:

```text
src/
  main.tsx                  Entradas lazy por ruta/capa
  app/                      Composición, navegación y sesión comercial
  admin/
    AdminApp.tsx            Shell del dashboard
    components/             Login, empleados, catálogo y operación
    hooks/                  Sesión y borrador administrativo
  ui/
    account/                Cuenta, login y registro de cliente
    …                       HUD, paneles y componentes DOM compartidos
  reception/                Diálogo, categorías y contenido del catálogo
  domain/                   Contratos, dinero, operación y proyecciones
  environment/              Fondo y clima de la escena conservada
  world/
    layers/                 Suelo, paisaje, recepción, bahías y lounge
    materials/              Preparación compartida de mapas PBR
    prefabs/                Objetos físicos reutilizables
    navigation/             Cámara y rutas de la escena completa
    …                       Assets, interacción, animación y diagnósticos
server/                     API Node, servicios, SQLite y JWT
config/testing/             Configuraciones Vitest/Playwright y rutas
tests/unit/                 Contratos y reglas deterministas
tests/e2e/                  Recorridos de navegador
scripts/                    Herramientas de assets y comprobación
public/                     Recursos servidos y licencias
docs/                       Arquitectura, operación y evidencia
.agents/skills/             Habilidades versionadas del proyecto
```

No mover `server/data` ni claves por razones estéticas: su ubicación forma parte del contrato operativo y de respaldos. `/` y `/world3d` mantienen entradas diferentes; que una capa no monte una escena no prueba desuso.

## Formato y comentarios

`npm run format` aplica Prettier a TS/TSX, CSS y herramientas JavaScript propias. `npm run format:check` verifica el mismo alcance. `.editorconfig` define UTF-8, indentación y saltos de línea. Python, PowerShell, documentación histórica y recursos generados conservan su formato; no se pasan por un parser de JavaScript.

Separar imports, declaraciones relacionadas, funciones, efectos y retornos con líneas en blanco. Las propiedades del mismo contrato permanecen juntas. Comentar responsabilidad, unidades, invariantes, errores y propiedad de recursos; no narrar cada asignación.

`npm run typecheck` detecta variables, parámetros e imports sin uso en TypeScript. Los módulos exportados y recursos por URL requieren además revisar entradas, scripts, imports dinámicos y pruebas.

## Reutilización

| Capacidad | Propietario y regla |
| --- | --- |
| Sesión comercial | `src/app/useCommercialSession.ts`: mundo completo, recepción y operaciones comparten SSE, polling y cleanup. Solo el mundo completo solicita refresh inmediato al volver a la pestaña. |
| Mapas PBR | `src/world/materials/textureMaps.ts`: suelo, recepción y lounge comparten clonación y espacio de color; cada superficie conserva UV y dispone sus clones. |
| Maceta y tierra | `src/world/prefabs/Planter.tsx`: altura, radio y especie configurables con plano de anclaje único. |
| Difusor cálido | `src/world/layers/WarmDiffuser.tsx`: emisión compartida; montaje y posición pertenecen al área. |
| Panel DOM | `src/ui/WorldOverlayManager.tsx`: foco, cierre y transición; no reglas de precios o permisos. |
| Categorías | `src/ui/VehicleIcon.tsx`: siluetas comunes; las tarifas pertenecen al servidor. |
| Persistencia | `server/persistence.ts` y `server/services.ts`: repositorios y composición sobre SQLite. |

No se unifican paletas con distinto propósito ni formateadores monetarios de locales diferentes sin decisión explícita. Compartir preparación de texturas no significa recolorear superficies.

## Pruebas

| Comando | Alcance |
| --- | --- |
| `npm test` | Vitest con `config/testing/vitest.config.ts` |
| `npm run typecheck` | Tipos e identificadores no usados |
| `npm run build` | Tipos y frontend |
| `npm run build:server` | Bundle Node |
| `npm run test:e2e` | Runner raíz → `config/testing/playwright.staff.config.ts`, SQLite temporal en 4175 |
| `node scripts/test-standalone.mjs` | HTTP real en 4186 con base temporal |

Los runners de operaciones, lounge e historial están en `config/testing/`. `playwright.legacy.config.ts` conserva las pruebas antiguas para un sandbox administrado manualmente en 4173: inspeccionarlas antes de ejecutarlas. No usarlas sobre la sesión activa del usuario. `config/testing/paths.ts` mantiene sus rutas relativas al repositorio.

## Retirado y conservado

Retirados por ausencia de consumidores comprobada: `TouchControls`, su estado `navigation/input`, `UrbanSurround`, `WorldInteractionCard`, el registro antiguo de interacción y `advanceToward`. También el componente vacío `VehicleInspectionExperience` (se conserva `inspectOwnVehicle`), el escritor JSON `persistConfiguration`, el callback sin uso de `VehicleAnchor` e imports no usados.

Se conserva el lector JSON inicial porque alimenta una instalación nueva de SQLite. Modelos, herramientas Blender, fixtures, evidencia histórica y escenas alcanzables permanecen intactos.

## Habilidad

Fuente versionada: [spatial-web-production](../.agents/skills/spatial-web-production/SKILL.md). La copia de la biblioteca personal se invoca como `$spatial-web-production`. Su mapa específico de CarWash está separado de las reglas reutilizables de escena, materiales, cámara e interacción.

Resultados: [informe de mantenimiento](MAINTENANCE_2026-10-24.md).
