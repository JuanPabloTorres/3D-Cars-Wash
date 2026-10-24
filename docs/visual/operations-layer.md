# Fase 04 · Operación iconográfica

Entrada: `/?layer=operations`, desde «El local · Operación» en recepción. La capa conserva terreno, vegetación, fondo y recepción; monta las bahías existentes y fichas HTML orientadas a cámara. No monta vehículos GLB ni empleados en las bahías. El mundo anterior sigue conservado en su ruta anterior.

## Autoridad y contratos

- `DemoOperationSource` sigue siendo el propietario del sandbox. La capa observa `DemoOperationTransport` en el escenario `operation`, velocidad 1; no llama a herramientas de avance ni crea órdenes de relleno.
- `OperationProjection` rechaza revisiones/eventos repetidos, identificadores duplicados y ocupaciones contradictorias. La cantidad de bahías viene del snapshot configurado por el servidor.
- Extensión aditiva compatible: `serviceStarted`, `serviceCompleted` (reloj operativo), `completedAt` (fecha ISO del servidor) y `frame.completed` opcional. El temporizador visual nunca decide el estado ni inventa porcentajes.
- Retención pública: últimas 50 entidades físicamente entregadas durante la vida del servidor. Reiniciar el sandbox borra este historial en memoria. No sustituye el historial comercial privado. Una cancelación no se archiva como completada.
- `ready`: servicios terminados, **bahía aún ocupada**. `handover` administrativo libera la plaza y autoriza el traslado. `deliver` autoriza salida; tras salir, la ficha queda en el historial. El contador «en servicio» excluye tareas ya terminadas, aunque la plaza siga ocupada.
- La fila usa `queueIndex` del proveedor FIFO vigente, con su capacidad existente. No agrega prioridades ni reservas inexistentes.
- Datos públicos: alias estable, categoría, tareas, estado, ubicación y tiempo. Detalle monetario: únicamente coincidencia con `order/history` de la sesión privada. Sin consulta de órdenes ajenas por ID. No se exponen nombre, contacto o matrícula.
- Comprobante deshabilitado: el proveedor actual no emite recibos ni confirma pagos. No se presenta el resumen como comprobante fiscal.

## Presentación

`VehicleStatusBadge` sirve a espera, bahías, completados y detalle. `VehicleIcon` comparte las cuatro siluetas con recepción. El catálogo visual se indexa por IDs estables: exterior/cian, interior/violeta, focos/ámbar, inspección/verde. Inspección es una etapa operativa; no añade un servicio cobrado. Icono genérico para IDs desconocidos.

Pendiente: quieto y neutral. Activo: color semántico y pulso suave. Terminado: check verde; animación breve solo al cambiar de estado durante el montaje. El aviso propio se emite al observar transición a `ready`, no al cargar historial. Su identidad queda registrada en sessionStorage, limitada a 50 IDs, para evitar repetición al reconectar.

Las fichas 3D comparten identidad durante los traslados y siguen rutas confirmadas. Vista lejana compacta, ficha seleccionada ampliada y panel de consulta. En móvil, lista accesible sin marcadores flotantes. Teclado, Escape, foco de retorno y `prefers-reduced-motion`; actividad detenida cuando la conexión está obsoleta.

## Validación y reproducción

1. `npm test` y `npm run build`.
2. Servidor aislado: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4174 --strictPort`.
3. `npx playwright test --config playwright.operations.config.ts`. Usa sesiones separadas y comandos administrativos reales del sandbox. Credenciales locales no se imprimen, trazas y vídeo desactivados para el inicio de sesión.
4. Recepción/regresión: suite vigente en `playwright.config.ts`.

Evidencia: `docs/evidence/phase04/acceptance/`. Copia reversible del código antes de esta fase: `docs/evidence/phase04/source-before.zip`. No restaurar el árbol entero sobre trabajo posterior; revertir solo los archivos de este incremento.

Limitaciones explícitas: no existe backend de producción, pagos/recibos, cancelación de tareas individuales ni prioridad por citas. La representación no inventa esas capacidades. La aprobación artística del usuario es independiente de los resultados técnicos.

## Registro de comprobaciones de este incremento

- 74 pruebas unitarias ejecutadas y aprobadas, incluidas 51 entregas consecutivas para comprobar retención y reutilización de la misma bahía.
- Tres escenarios E2E nuevos aprobados con servidor aislado: recorrido completo de dos sesiones, alternativa móvil/reduced-motion y cancelación con un detalle abierto. La comprobación de escritorio usa comandos reales de administración y el reloj del proveedor, sin acelerar etapas mediante el renderer.
- Capturas finales posteriores al ajuste de cámara, sin errores JavaScript observados. Fotograma de entrega: 6.642.865 triángulos y 511 llamadas; estos contadores incluyen el paisaje conservado y no constituyen una medición de FPS ni una garantía para dispositivos de gama baja.
- Dos ejecuciones iniciales del arnés fueron interrumpidas por esperas demasiado largas. Se acotaron tiempos de acción y navegación y se dio nombre accesible explícito a los botones con contadores. No se cuentan como validación aprobada; el primer bloqueo no quedó aislado con evidencia suficiente para atribuirlo al producto.
- No hay scripts de lint/formato configurados. Se ejecutan TypeScript, build y pruebas; no se declara un lint inexistente.

- Regresión: 19/20 aprobadas inicialmente. La prueba restante falló al cerrar una traza (`ENOENT`) por colisión entre carpetas de resultados de dos ejecuciones. Se aisló la salida de la suite de operaciones y se repitió móvil/tableta: 1/1 aprobada. Resultado conjunto: las 20 pruebas pertinentes aprobadas, conservando el incidente del arnés.
- Pulso observado en navegador: brillo de 1.20034 a 1.02951 con animación `op-pulse`; reduced-motion verificado sin animación. Muestreo headless de 3.004 s: 79 frames, media 38.03 ms (~26 FPS). La escena completa sigue pesada; no se atribuye ese coste exclusivamente a los badges ni se promete 60 FPS.
- Activación: reinicio del sandbox en 4173 autorizado explícitamente por el usuario tras informar que su orden en memoria se perdería. Endpoint y navegador confirmaron cero entidades, cinco bahías y archivo de completados disponible.

- Cierre final tras ajustar escala: suite de operaciones 3/3 repetida y aprobada. Ficha enfocada medida en 234.55 × 195.80 px, lista posterior oculta; captura final con cero errores. Muestreo final 80 frames / 3.022 s, 37.77 ms de media. Informe local conservado: el observador devolvió «No hay una consulta identificada», por lo que su cierre automático no está confirmado.


## Refinamiento activo — 24 de octubre de 2026

La entrada compacta y los muros con textura mineral, zócalo, juntas y remates sustituyen las superficies lisas. El fondo fotográfico conserva sus imágenes, proporciones y orientación. Los detalles de cada muro se agrupan en tres mallas por material para evitar una llamada de dibujo por pieza.

`ReceptionSiteExperience` monta las mismas bahías de `OperationsWorldLayer`, sin cederle la cámara de recepción. La causa comprobada de los espacios ausentes era el montaje exclusivo de las bahías en `?layer=operations`; no era un recurso perdido. Las capas de terreno/paisaje aisladas permanecen independientes. Se retiraron mangueras, soportes y mesitas/carritos de `FinishedWashBay`, conservando sus activos originales.

`BayServiceIndicator` representa el vehículo y los servicios contratados como medallones, con anillo animado para actividad, estado neutral para pendientes y confirmación verde. No contiene botones; la selección vive en el panel lateral. No se añaden servicios ficticios para rellenar la composición de referencia. Respeta pausa, desconexión y movimiento reducido.

### Finalización y conexión mock

- `/employee` y `/admin` montan dashboards convencionales sin canvas. El sidebar administrativo mantiene órdenes, catálogo/tarifas, clientes, contenido y configuración. El panel de personal se limita a operación y órdenes.
- En el sandbox, la clave local existente permite iniciar una sesión con rol employee; no constituye cuentas laborales ni autenticación de producción. El servidor restringe employee a llegada, asignación, tareas, finalización, traslado y entrega. Configuración y disponibilidad requieren admin. Se conservan nonce, origen y revisión optimista.
- `POST /api/demo/admin/command` con `action: complete-service`, `orderId` y `expectedRevision` autoriza una simulación de fin de todos los servicios contratados más inspección. Se rechazan vehículos en cola o traslado. El cliente no gobierna estas transiciones.
- `DemoOperationSource.completeService` marca ready y reserva la transferencia. En los ticks del servidor espera carril y zona de entrega libres, mueve a recogida y asigna el primer turno a la bahía liberada después del traslado y reajuste de cola. Si recogida está ocupada espera sin superponer vehículos. La ruta anterior de avance manual sigue disponible.
- El dueño recibe `CommercialOrder.completionNotice` por su sesión/SSE privado. ID estable por orden, canal `in-app-mock`, mensaje de recogida y fecha del servidor. La notificación se recupera en reconexión si no se había visto y se descarta una vez por pestaña. Nunca aparece en el stream público ni en la sesión de otro visitante.
- Completar el servicio no equivale a confirmar retiro ni pago. El operador confirma entrega; el archivo de 50 entregas se actualiza al terminar la salida. No se envían SMS, correo o WhatsApp.

### Evidencia ejecutada del refinamiento

- 75 unitarias aprobadas, incluyendo finalización duplicada, sucesión FIFO y bloqueo cuando recogida está ocupada.
- Nuevo E2E aprobado: login por dashboard empleado, restricciones HTTP, finalización con botón, aviso privado, segundo vehículo atendido, retiro y archivo; dashboard móvil sin overflow.
- Cuatro E2E de recepción aprobados: catálogo, orden idempotente, móvil/tableta, reduced motion, recuperación y objetos interactivos.
- Tres E2E operativos anteriores repetidos y aprobados: avance manual, privacidad, reconexión, entrega, móvil y cancelación. Total de este turno: ocho escenarios de navegador.
- TypeScript y build aprobados. Capturas finales de recepción sin errores JavaScript en `docs/evidence/phase04/refinement/`. Prueba visual de medallones actualizada también en `docs/evidence/phase04/acceptance/03-own-detail.png`.
- Reinicio de 4173 autorizado después de informar de la orden activa en memoria. `refinement/activation.json` confirma que el HTML servido coincide con dist y que el servidor admite el nuevo rol empleado. Pestaña del usuario recargada y observada con bahías y sin equipo auxiliar.
- El helper de seguimiento local agotó el tiempo de conexión dos veces; se conserva informe local. El primer intento de actualizar el script de capturas falló por la codificación Windows; se repitió con UTF-8 y el capturador finalizó correctamente. No se cuentan estos intentos como aprobación del producto.

El mock sigue usando memoria del servidor y la aceptación artística corresponde al usuario. El paisaje completo conserva un coste considerable; las capturas no garantizan rendimiento de producción ni de todos los móviles.

## Corrección de navegación en el mapa — 24 de octubre de 2026

Los accesos de recepción son acciones locales de cámara: Bahías -> vista del conjunto y selector 01–05; Ver mi auto -> ubicación confirmada de la sesión privada en cola, bahía o entrega. ReceptionSiteExperience mantiene el mismo Canvas, proveedor y URL. No abre OperationsExperience ni /admin o /employee. El panel contextual es compacto y el progreso se despliega a petición. Sin orden o con llegada pendiente se informa el estado, sin enfocar vehículos ajenos.

Propietarios: ReceptionExperience (acciones), ReceptionSiteExperience (selección y contexto), ReceptionCamera (transición y encuadre por relación de aspecto), useOperationNavigation (identidad privada y selección), OperationsWorldLayer (geometría e indicadores). Los deep links del visor operativo separado siguen siendo compatibles, pero no son los accesos del mapa del cliente.

La bienvenida mide 260 px de ancho; los medallones ampliados usan 280 px CSS y factor de distancia 8.5, verificados por debajo de 300 px en la cámara de vehículo a 1440×900. En móvil se conserva el medallón principal y el detalle permanece en el control compacto. Las cinco bahías se encuadran según el aspecto de pantalla.

Validación de esta corrección: 75 unitarias, build TypeScript/Vite, 2 pruebas nuevas de navegación, 1 de finalización desde empleado con sucesión y aviso privado, y 4 regresiones de recepción aprobadas. La prueba de navegación final comprueba cero navegaciones de documento, movimiento real de cámara al conjunto y a bahía 01, estado sin orden y llegada pendiente. Capturas en docs/evidence/phase04/navigation/ y refinement/bay-medallions.png.

Intentos conservados: inicialmente los enlaces abrían el visor separado, contrario a la intención aclarada por el usuario; se sustituyeron por selección local de cámara. Primer E2E posterior: un selector del arnés todavía esperaba ese visor; otro detectó medallón de 349.79 px por escala de perspectiva. Se corrigieron selector y factor de distancia, sin relajar el límite de 300 px. Evidencia en navigation/attempt-1. La ejecución operativa previa se interrumpió al recibir la aclaración del usuario y no cuenta como aprobada.

No se reinició 4173: las órdenes del usuario permanecen en memoria. No se modificaron estados del backend, paisaje ni muros en esta corrección. La fase 05 del lounge queda como siguiente etapa; este cierre corresponde a recepción y navegación operativa.
