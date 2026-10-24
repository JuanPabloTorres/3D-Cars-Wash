# Refinamiento A–D: contratos y plano

La fase conserva el motor y los flujos de G1. La autorización de esta fase sustituye el límite previo de una sola bahía, y permite cinco bahías DEMO. No autoriza operación real ni aceptación artística automática.

## Propietarios y fronteras

| Flujo | Propietario | Contrato | Evidencia |
|---|---|---|---|
| Saludo | Blender `export-staff.py` → GLB → `NPCAnimationController` | Marcos anatómicos locales, palma frontal, dedos arriba; Greet una vez y cruce a Idle/Talk. Ninguna animación publica eventos de negocio. | Secuencia `a/greeting-*`, videos de navegador |
| Ambiente | `WeatherDataController` → adaptador NWS → `WeatherEnvironmentController` | Coordenadas configuradas o temporales explícitas; caché de sesión 15 min; abort/timeout; fallback marcado. Renderer solo consume el resultado. | A: seis vistas, 503, pronóstico simulado y caché |
| Caminata | `WaypointPathPlanner` → `CameraController` | Visibility graph sobre regiones transitables, colisión por subpasos; sin teletransporte; entrada sin ruta automática; WASD cancela intención guiada. | Unitarias de todas las parejas de destinos y E2E |
| Operación | `DemoOperationSource` → `OperationProjection` | Eventos sintéticos con revisión creciente; rechazo de duplicados, ocupación inconsistente o IDs duplicados. Sin red ni escritura a backend. | Unitarias, incluida regresión de evento manual pausado |
| Tráfico | `sitePlan` + `vehicleMotion` → `VehiclePrefab` | Curvas redondeadas; velocidad máxima 2.8 m/s, aceleración/frenado; parada de cambio reversa/marcha; exclusión de un solo transporte activo. El renderer nunca concede asignaciones ni confirma entrega. | Ciclo de 2,600 pasos y ciclo real acelerado en navegador |
| Bahías | `WashBayPrefab` + `ServiceActivityVisualizer` + `StaffPrefab` | Una implementación para 01–05; entrada posterior abierta; ocupación/tareas del proveedor; trabajadores y efectos dependen de la etapa y presencia. | Escenarios mixed/quiet/busy/arrival |
| Mi vehículo | `VehicleInspectionExperience` | Resolver propio vehículo DEMO, seleccionar observador seguro de su bahía/cola/entrega, caminar, orientar la misma cámara y abrir orden; cancelar manualmente. | C y escenario quiet en bahía 03 |
| Datos privados | `DemoOrderSource` y `publicVehicleCard` | Mi orden sintética solo para entidad `own`. Terceros: lista permitida de información operativa; no nombre, matrícula, orden ni precios. No sustituye autenticación real. | Unitarias de exclusión y tarjeta anónima E2E |
| Estimación | `ServiceTimeEstimator` | Duraciones configuradas, trabajos pendientes y cargas por capacidad. Espera, servicio y total son métricas distintas. Sin datos: null, nunca tiempo inventado por conteo de autos. | Pruebas de planificación y datos insuficientes |

## Algoritmos

```text
EN CARGA COMPLETA:
  cámara = entrada peatonal; destino = ninguno
  cargar recursos y habilitar caminar; iniciar reloj DEMO tras disponibilidad
  si hay coordenadas configuradas: consultar pronóstico con caché y timeout
  si falla: etiquetar ambiente simulado; mantener la visita operativa

EN EVENTO DE ESCENARIO:
  validar revisión, entidades únicas y ocupación
  publicar tareas coherentes para vehículos y bahías en la misma revisión
  actualizar proyección; nunca recibir eventos desde animaciones

EN RELOJ DEMO:
  terminar movimientos programados; avanzar tareas cuyo tiempo configurado terminó
  si carril de transporte está libre:
    priorizar salida de entrega; después retiro de vehículo listo
    después asignar frente de cola a bahía libre, o compactar cola
  bloquear nuevas maniobras mientras otra usa el carril

EN FRAME VISUAL:
  muestrear trayectoria autorizada y perfil de aceleración/frenado
  orientar modelo y representar actividad; no cambiar operación
  detectar proximidad/foco/oclusores y ofrecer una sola tarjeta pertinente

AL CONSULTAR MI AUTO:
  si no hay representación propia: informar indisponibilidad
  elegir punto transitable; calcular ruta; caminar; orientar cámara
  mostrar marcador y orden DEMO, costos y estimaciones fundamentadas
  si el visitante camina manualmente: cancelar ruta e intención de inspección
```

## Plano de coordenadas (metros)

- Bahías: centros X = 3.4, 11.4, 19.4, 27.4, 35.4; Z = −4.2.
- Recepción: X = −6, Z = −2.1. Entrada peatonal: (−7, 14.5), altura de ojos 1.66.
- Paseo frontal: Z 1.7–6.6; miradores diagonales desplazados del poste de cada bahía.
- Cola Q1/Q2/Q3: X = 3.4; Z = 12, 18.4, 24.8. Separación 6.4 m para autos de 4.7 m.
- Acceso de servicio: cola → carril Z 9.5 → lateral X 46 → corredor posterior Z −14 → bahía.
- Salida: maniobra posterior de reversa → carril X 50 → entrega (50,17) → salida (51,38).
- Lounge: zona occidental con banco GLB y pérgola; sendero conectado al paseo frontal.
- El plano es de simulación, no una medición del establecimiento físico.

## Preparación reproducible de recursos

No hace falta Blender para ejecutar: los GLB finales están incluidos. Para regenerar en este workspace, preservar originales externos y ejecutar, en orden:

1. Blender 5.2 con `scripts/export-staff.py -- receptionist` / `-- worker`, abriendo el .blend oficial correspondiente. Los scripts embebidos descargados permanecen deshabilitados.
2. `node scripts/optimize-staff.mjs receptionist worker` (después de terminar Blender).
3. `scripts/download-refinement-assets.ps1` obtiene fuentes oficiales y verifica MD5 de dependencias.
4. `node scripts/pack-refinement-assets.mjs`, después `node scripts/tree-lod.mjs`.
5. `node scripts/validate-assets.mjs` conserva errores/advertencias en JSON.

El archivo Manrope Medium para texto 3D se instancia a peso 550 desde la fuente variable mediante fontTools, instalado únicamente en la carpeta externa de preparación. HTML usa la fuente variable local del paquete. No se exige ese tooling para `npm ci` ni para ejecutar.
