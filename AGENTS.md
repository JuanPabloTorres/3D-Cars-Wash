# Febles — alcance activo

## Mantenimiento vigente — 24-10-2026

- Usar `.agents/skills/spatial-web-production/SKILL.md` para reconstrucción visual y mantenimiento reutilizable. El mapa específico y las restricciones del proyecto permanecen en sus referencias y en este archivo.
- Formato: `npm run format` y `npm run format:check`; comprobación de tipos y código local sin uso: `npm run typecheck`. Comentar responsabilidad, contratos y decisiones; separar bloques relacionados sin insertar líneas vacías entre cada propiedad.
- La estructura actual está en `docs/PROJECT_STRUCTURE.md`. Cuenta está en `src/ui/account/`; componentes administrativos en `src/admin/components/` y hooks en `src/admin/hooks/`.
- La suite E2E por defecto ahora es la de staff aislada en 4175, mediante `config/testing/playwright.staff.config.ts`. Las referencias históricas de este documento a suites activas en 4173 quedan sustituidas por esta regla. `config/testing/playwright.legacy.config.ts` conserva el runner antiguo; no ejecutarlo sobre la sesión viva del usuario.
- Suelo, recepción y lounge comparten `src/world/materials/textureMaps.ts` para clonar y configurar mapas; cada consumidor conserva sus UV, color y disposal. La conexión comercial compartida pertenece a `src/app/useCommercialSession.ts`.

- Fase 05: `WaitingLoungeLayer` es aditiva sobre el deck reservado; acceso en Área de espera y `?layer=lounge`. La consulta sólo lee la sesión privada y la misma proyección operativa de bahías. No confundir servicio finalizado con llegada física a entrega, ni emitir comprobantes inexistentes.
- Componentes visuales reutilizables: `src/world/prefabs/Planter.tsx` es el único dueño del diseño de maceta, tierra y anclaje vegetal de recepción y lounge. Usar `PottedPlant` con posición, dimensiones y especie configurables en futuras áreas; no copiar geometría/materiales por ubicación. Reutilizar también los acabados y difusores existentes. Ver `docs/visual/waiting-lounge-layer.md`.


- Refinamiento Fase 04: recepción y operaciones comparten las bahías físicas mediante `ReceptionSiteExperience`; el suelo y paisaje aislados conservan sus capas. Los medallones del mundo son indicadores sin botones; las consultas están en el panel lateral. Mangueras, soportes y carros auxiliares retirados de `FinishedWashBay` por petición del usuario.
- `/employee` y `/admin` son dashboards sin canvas. El rol local employee puede registrar llegada, asignar, avanzar, finalizar y entregar; configuración y disponibilidad requieren admin. `complete-service` autoriza la simulación de cierre y sucesión; respeta carril, zona de entrega y FIFO. El aviso `completionNotice` pertenece exclusivamente a la sesión comercial del dueño, es mock en aplicación y no envía mensajes externos. Retiro y pago siguen separados.

- Fase 04: `?layer=operations` integra `OperationsWorldLayer` sobre las capas conservadas. Por instrucción explícita del usuario, las órdenes de espera, bahías y completados usan `VehicleStatusBadge` e iconos semánticos animados, sin automóviles GLB ni trabajadores animados en esa capa. Esta excepción prevalece sobre las referencias históricas a vehículos 3D.
- La capa operativa solo observa el escenario `operation` del proveedor existente: no crear órdenes decorativas ni avanzar tareas desde animaciones. Servicios terminados no equivalen a bahía liberada. Contratos y retención en `docs/visual/operations-layer.md`; pruebas aisladas en `playwright.operations.config.ts` (puerto 4174).

- Fase actual por capas (24-10-2026): `?layer=ground` muestra únicamente terreno, circulación, jardineras vacías, deck de espera, delimitaciones y fondo. Conservar edificios, vehículos, plantas y lógica existentes sin montarlos en esta capa. No volver a poblar el mundo antes de trabajar la capa correspondiente.
- Capa 02 independiente en `?layer=landscape`: vegetación nueva en las jardineras existentes, perímetro e iluminación. Los cinco modelos en `public/models/layer02/` se generan desde cero con `scripts/create-layer02-botany.py`; no reutilizar los modelos vegetales anteriores rechazados. Mantener `?layer=ground` como base vacía.
- El entorno urbano pertenece a la imagen de fondo. Por instrucción del usuario, no añadir edificios 3D detrás ni árboles 3D fuera del perímetro del local; no convertir la navegación de la tienda en mecánicas de videojuego. Usar materiales diferenciados de hoja, tallo y corteza, y conservar suelo, distribución y flujo comercial.
- La distribución debe servir como inicio del flujo: preparar visita, esperar turno, seguir servicio y recoger vehículo. En esta fase sus controles inspeccionan la ubicación y responsabilidad; no simulan transacciones. No crear zonas sin función.
- Materiales de esta capa: `src/world/layers/groundMaterials.ts`, fuentes en `public/textures/ground-v2/SOURCES.md`. Mantenerlos aislados de la paleta del sistema conservado. El fondo aportado es 1672×941, con recorte proporcional; no presentarlo como 4K ni estirarlo a panorama.

- Conservar el establecimiento Three.js y los recursos profesionales existentes. No recuperar la aplicación descartada.
- Fuente de esta fase: docs/COMMERCIAL_EXPERIENCE.md y las instrucciones de pulido/ZIP aportadas el 23-10-2026.
- Navegación por áreas mediante transiciones breves. El visitante no necesita WASD, joystick ni una caminata de avatar.
- Cuatro accesos principales: Recepción, Mi orden, Mi vehículo y El local. Toda zona debe aportar una acción comercial o información útil para la atención.
- Servicios y registro pertenecen a recepción. Bahías, cola y espera se consultan dentro de El local. No crear destinos puramente decorativos.
- Separar cámara, renderer, proyección operativa y proveedor comercial. La animación nunca confirma una orden, llegada, pago o entrega.
- API y herramientas /api/demo son exclusivamente un sandbox local. No presentarlas como autenticación, pagos o administración de producción.
- Conservar privacidad entre sesiones y no mostrar información comercial de otros clientes.
- Las cuatro categorías usan sus GLB específicos CC0 de Innerscene. No volver al deportivo ni a los candidatos Rgsdev rechazados. Pipeline vigente: scripts/prepare-innerscene-vehicles.py.
- Tarifas por servicio y categoría: server/business-config.json. No inventar importes ausentes. El archivo es configuración del sandbox, no una consola administrativa de producción.
- Ejecutar npm test, npm run build y npm run test:e2e después de cambios pertinentes. Conservar fallos y capturas reales.
- Las pruebas de caminata anteriores quedan como historial; las suites vigentes son commercial.spec.ts, sow.spec.ts y lounge.spec.ts, según playwright.config.ts.
- La aprobación artística permanece pendiente. Compilar o pasar pruebas no la concede.

## Producción visual y especialistas

- La página «Revisión del sistema» del Studio y su publicador fueron retirados por instrucción del usuario. No recrearlos ni usar el Studio como requisito para trabajar o cerrar cambios. Comparar directamente las referencias aportadas con el navegador real; conservar pruebas y capturas sin otro flujo de aprobación automatizado.
- Para esta fase, consultar las cinco imágenes conceptuales de `C:/Users/estju/Downloads`, `Febles_Diagnostico_Visual_UX.md`, `Febles_Ambiente_Iconografia_y_UX.md` y `Febles_Cierre_Visual_Animacion_y_Circulacion.md`. `Febles_Visual_Asset_Kit.zip` contiene un fondo urbano LDR: no es un panorama 360°. Los hallazgos históricos deben reproducirse antes de atribuirlos a la versión actual. Las instrucciones recientes del usuario prevalecen sobre propuestas antiguas de esos documentos.
- Para análisis o pulido del mundo 3D, usar `.agents/skills/carwash-visual-production/SKILL.md`. Sus fichas coordinan cámara, panel, props, iluminación y estado; no son otro motor gráfico.
- Fuentes nuevas: `docs/design/visual-experience-sow.md` y `reference-reconciliation.md`, con cinco conceptos de entrada, recepción, catálogo, bahía y lounge. Conservar marca configurable y autoridad comercial aunque las imágenes digan FEBLES.
- Perfiles especializados en `.codex/agents/carwash_*.toml`: arquitectura, escena, Blender, interacción y validación. Asignar modo, toma, archivos y evidencia; un escritor por archivo/recurso compartido. Delegar cuando esté autorizado y aporte trabajo independiente.
- Antes de exportar, inspeccionar todos los destinos de los scripts: varios escriben activos o backups. Auditoría no autoriza exportación. Candidatos separados, fuentes preservadas, promoción por integrador.
- En una tarea de método/habilidades o análisis no cambiar producto. Validar la habilidad y su uso; no presentar pruebas históricas del producto como nuevas.
