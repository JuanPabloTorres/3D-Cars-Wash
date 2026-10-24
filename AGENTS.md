# Febles — alcance activo

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

- Para análisis o pulido del mundo 3D, usar `.agents/skills/carwash-visual-production/SKILL.md`. Sus fichas coordinan cámara, panel, props, iluminación y estado; no son otro motor gráfico.
- Fuentes nuevas: `docs/design/visual-experience-sow.md` y `reference-reconciliation.md`, con cinco conceptos de entrada, recepción, catálogo, bahía y lounge. Conservar marca configurable y autoridad comercial aunque las imágenes digan FEBLES.
- Perfiles especializados en `.codex/agents/carwash_*.toml`: arquitectura, escena, Blender, interacción y validación. Asignar modo, toma, archivos y evidencia; un escritor por archivo/recurso compartido. Delegar cuando esté autorizado y aporte trabajo independiente.
- Antes de exportar, inspeccionar todos los destinos de los scripts: varios escriben activos o backups. Auditoría no autoriza exportación. Candidatos separados, fuentes preservadas, promoción por integrador.
- En una tarea de método/habilidades o análisis no cambiar producto. Validar la habilidad y su uso; no presentar pruebas históricas del producto como nuevas.
