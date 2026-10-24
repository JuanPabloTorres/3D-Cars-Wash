# Estado vigente — cierre integral del SOW

23-10-2026. Cliente: http://127.0.0.1:4173/ · Administración local: http://127.0.0.1:4173/admin.

| Área | Estado vigente |
|---|---|
| Cliente y administración local conectados | Implementados y verificados por navegador real |
| Contratación, recuperación, cancelación y seguimiento | Verificados con el mismo servidor y revisiones |
| Llegada → fila → bahía → tareas → entrega | Comandos administrativos locales; mapa proyecta los mismos registros |
| Catálogo, tarifas, contenido y consultas | Configuración compartida; guardado administrativo y recibos reales del servidor local |
| Cuenta | Perfil y vehículos de sesión; cierre real; sin datos fijos |
| Visual, gestos y cuatro categorías | Capturas reales y validación técnica; aprobación artística pendiente |
| Pruebas | Build, 45 unitarias, 22 E2E y edición administrativa adicional aprobados |
| Producción | PENDIENTE: identidad/roles comerciales, persistencia duradera y cobros |
| Aceptación artística | PENDIENTE del usuario |

Reporte actual y límites: [SOW_CLOSURE.md](SOW_CLOSURE.md). Contratos: [LOCAL_API_CONTRACTS.md](LOCAL_API_CONTRACTS.md). Evidencia: `evidence/sow-closure/`.

Las secciones siguientes conservan el historial anterior a este cierre; sus cifras y afirmaciones sobre ausencia de administración corresponden a esas revisiones.

---

# Febles — estado actual de hitos

23-10-2026. Aplicación local: http://127.0.0.1:4173/.

| Hito | Estado |
|---|---|
| G0, establecimiento y modelos utilizables | Conservados |
| Navegación comercial por áreas | Implementada y probada: cuatro accesos, transición breve y apertura contextual |
| Recepción → servicios → registro → cotización → orden | Implementado y probado contra proveedor local DEMO |
| Consulta y cancelación | Mismo agregado comercial; idempotencia, recuperación por sesión y rechazo del proveedor probados |
| Operación compartida y reconexión | SSE DEMO probado con dos contextos separados; no es administración real |
| Cuatro tipos de vehículo y ruedas | Cuatro GLB distintos carro/pickup/SUV/truck; 4/4/4/6 ruedas originales; avance, reversa y parada comprobados |
| Modelos aptos para evaluación | Innerscene CC0 con dimensiones y materiales revisados; aceptación artística pendiente |
| Herramientas de servicio | Importadas y asociadas a cada tarea; agarres, contacto y mangueras requieren acabado artístico |
| Recepción y lounge | Contenido compartido, bienvenida progresiva, FAQ y mostrador funcional; sin inventar horarios, contactos u ofertas |
| Tarifas por servicio y categoría | Configuración del servidor DEMO; faltantes requieren cotización; no hay administración real conectada |
| Backend comercial, permisos y persistencia de producción | PENDIENTES; el sandbox no los sustituye |
| Aprobación artística | PENDIENTE. No se deduce de pruebas técnicas |
| Refinamiento de cámara, suelo y controles | Implementado y observado en Playwright; aprobación artística pendiente |

Evidencia vigente: [VISUAL_REVISION.md](VISUAL_REVISION.md), `evidence/visual-revision/final/`. Los reportes comerciales anteriores, A–D y las suites de caminata son historial, no aceptación de esta revisión.

Pruebas actuales: 42 unitarias y build aprobados; galería final real de escritorio/móvil con cuatro etapas de servicio y sin errores de página. Campaña de regresión E2E y mediciones finales registradas en VISUAL_REVISION.md.

GLB: 26 archivos, 0 errores y 69 advertencias (incluye archivos históricos/candidatos no activos). Detalle en asset-validation.json. La auditoría npm anterior no pudo completarse: el endpoint remoto devolvió HTTP 400 de retirada del servicio; se conserva `commercial-dependency-audit.json`. No se declara una auditoría de dependencias aprobada en esta revisión.

## Mediciones vigentes — revisión visual

Edge/Intel UHD/ANGLE D3D11, escritorio 1440×900, ventana de 180 frames: quiet 39.8 FPS / P95 26.6 ms / 1,139 draw calls; busy 27.2 FPS / P95 41.2 ms / 1,708 draw calls. Memoria GPU no disponible. El caso busy y el teléfono físico requieren optimización/validación adicional. Ver `evidence/visual-revision/final/metrics-*.json`.

Campaña final: 16/16 E2E en 2.5 minutos. Picking de mostrador, tarifas faltantes y consulta sin backend probados. Prueba independiente de ruedas: cuatro categorías con avance/reversa/parada en 100 muestras, 33.39 s, sin errores. Gate artístico permanece abierto.

## Mediciones históricas — fase comercial anterior

Edge/Intel UHD/ANGLE D3D11, escritorio 1440×900, ventana de 180 frames. Sin memoria GPU fiable disponible.

| Escenario | FPS medios de ventana | P95 frame | Draw calls | Triángulos | Texturas |
|---|---:|---:|---:|---:|---:|
| Una bahía (quiet) | 38.9 | 36.6 ms | 853 | 2,051,278 | 102 |
| Cinco ocupadas (busy) | 28.7 | 45.1 ms | 1260 | 3,121,960 | 171 |

Estos números corresponden al Car Concept anterior. No representan el rendimiento de los cuatro modelos y personaje segmentado actuales; consultar las mediciones nuevas de VISUAL_REVISION.md. Las ventanas de FPS varían con la carga del equipo; no se promete 60 FPS ni un SLA. Móvil es emulación en el GPU del PC, no hardware de teléfono.

Recepción abrió en ~1.0 s en la prueba de navegación. Un comando de tarea del sandbox se reflejó en el segundo contexto en 973 ms en localhost. No son medidas de un backend remoto de producción.

Los datos DEMO no verifican llegada física ni pago. Servidor en memoria: órdenes recuperables durante la sesión/proceso, eliminadas al reiniciar. El borrador del navegador permanece separado de la operación.

## Actualización vigente — vegetación, fondo, lounge y llegada (2026-10-23)

Se conserva el historial anterior. Para este incremento, la evidencia vigente es [INTEGRATION_REPORT.md](evidence/vegetation-coherence/INTEGRATION_REPORT.md) y su [comparación visual](evidence/vegetation-coherence/comparison.html).

- Fondo original restaurado; canal alfa de recursos vegetales corregido; zonas de suelo y mobiliario del lounge integrados.
- Llegada: el visitante solicita revisión; sólo la confirmación explícita del personal crea vehículo y turno. Validado en pruebas HTTP y en el flujo completo de navegador.
- Build final integrado aprobado; 59/59 unitarias en 12 archivos. Suite amplia: 30/31, con fallo de selector Color documentado; se realiza revalidación focal sobre bundle congelado, cuyos resultados se agregan al informe.
- No hay aceptación artística automática. Persisten diferencias de densidad vegetal, corteza, mobiliario y adaptación panorámica de la foto; falta prueba en teléfono físico.

Revalidación final de este incremento: **11/11 E2E aprobadas**, intento `evidence/pilot-20261023/attempt-4`, sobre preview FXtXVk5r con recursos HTTP iguales a dist antes/después. Los intentos previos y la interferencia DEV están documentados; no se ocultan. Fuente exacta conservada en `evidence/vegetation-coherence/source-FXtXVk5r.zip`. Aceptación artística pendiente.
