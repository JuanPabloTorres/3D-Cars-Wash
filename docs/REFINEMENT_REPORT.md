# Refinamiento A–D

Base conservada: React/TypeScript/R3F/Drei, navegación continua y fuente DEMO independiente. Las eliminaciones Git anteriores pertenecen al vaciado autorizado: no se restauran.

## A — ejecución 2026-10-23
- 12 pruebas unitarias pasan; build correcto.
- Playwright `refinement-a`: PASS tras exportar y optimizar el GLB nuevo. Entrada inmediata, WASD, refresh desde recepción/fila, navegación, Greet→Idle→Talk, seis ambientes simulados y fallo NWS 503 con fallback.
- Capturas secuenciales reales en evidence/refinement/a; antes en evidence/refinement/before.
- Diagnóstico del rig: ejes globales del antiguo autor no definían la normal de la palma. Sustituidos por marcos anatómicos en espacio del rig convertidos mediante parent evaluado; palma hacia visitante, dedos arriba, envolvente de levantar/saludar/bajar. NPCAnimationController conserva un propietario por mixer y cruza clips explícitamente.
- Usuario autorizó ubicación temporal de visitante mientras desconoce la del negocio. Solo se consulta con permiso geolocation; no se persiste como dirección del negocio. Proveedor gratuito NWS limitado a USA/PR; se informa pronóstico, nunca observación actual. Fuera de cobertura: simulación. Sin compra ni clave.
- Aceptación artística pendiente. Esta evidencia técnica no certifica naturalidad humana perfecta.

Fuentes: https://www.weather.gov/documentation/services-web-api (datos abiertos gratuitos cualquier propósito). Open-Meteo gratuito se descartó por restricción no comercial; MET Norway directo desde localhost se descartó por sus requisitos de identificación/proxy.

## B — revisión de recursos
Incorporados planta en maceta, Calathea, helechos y árbol tropical de Poly Haven, CC0 (precio cero), procedencia y hashes descargados en refinement-asset-provenance.json. Árbol cercano 37,378 tri; versión perimetral 1,413 tri instanciada. Original optimizado inicial 237,669 tri resultó demasiado pesado para repetirlo: sustituido antes de aceptación. Palmeras Kenney reservadas para horizonte distante.
Pintura física con clearcoat, vidrio, caucho y luces ajustados por semántica del material. Proporción del automóvil conceptual adaptada a huella 2.14×4.7m; no se etiqueta como SUV ni se afirma disponer de modelos variados. Manrope local sustituye DM Sans; Lucide conserva conjunto consistente.
Incidente B1: primera ejecución no cargó la escena por copiar material Standard como Physical (faltaban propiedades Physical). Corregido construyendo Physical desde mapas compatibles explícitos. Se conserva este fallo de implementación; no es aceptación visual.


Incidente D2 (regresión completa): la transición manual DEMO con pausa actualizaba las tareas del vehículo pero dejaba las tareas de su bahía en la versión anterior. Causa: la sincronización solo estaba en tick(), mientras advance() emitía directamente. Se mueve la proyección coherente a emit(), frontera común de todos los eventos, con regresión específica. No se reduce la expectativa de coherencia para aprobar.

Incidente D3: bajo carga, la comprobación acelerada detectó un desplazamiento de 16.569 m frente a un límite medido de 16.396 m. Se identificaron dos mecanismos: props React de posición/orientación se reaplicaban durante eventos mientras useFrame también escribía la transformación; además el arnés comparaba posiciones del navegador con tiempos del proceso anfitrión, sujetos a latencia desigual. Se fija el transform inicial y se concede escritura continua solo al controlador por frame. Se elimina el margen aditivo de velocidad por frame y se publica observedAt junto a cada pose. La nueva prueba usa ese mismo reloj y un margen numérico de 5 cm, más estricto. El diario del ciclo se guarda aun si falla. No se atribuye todo el fallo a una única causa sin medición aislada; ambas fronteras ahora tienen contratos explícitos.

Incidente A1 de arnés: la prueba ampliada combinaba tres cargas completas, caminatas y seis transiciones meteorológicas con esperas de estabilización. Alcanzó el límite global de 90 s; no identificó una condición meteorológica incorrecta. Se separan navegación/refresh y meteorología/cache en dos casos independientes conservando las mismas expectativas y el mismo timeout, sin elevar umbrales de comportamiento.
Revisión visual de recuperación: el overlay de carga tapaba el mensaje de fallo GLB aunque el botón de reintento funcionaba. SceneErrorBoundary publica sceneFailed y retira el loader/HUD de navegación hasta que la visita está lista. Se conserva prueba 503/reintento.
D3: la marca de pose se toma finalmente del reloj del frame de R3F, que es el mismo que suministra el delta de movimiento; no del tiempo de CPU al finalizar los callbacks del frame.

## C — representación de mi vehículo y tiempos
- Tarjetas HTML ancladas al mundo, tamaño legible, foco/proximidad/oclusores y un único objetivo pertinente. Selección por E o puntero; el marcador propio aparece durante inspección.
- Orden F-0104 sintética: servicios en centavos, descuento de $5 e impuesto ilustrativo de 11.5%, total $66.90. Nunca se anuncia como precio fiscal/comercial real.
- La cotización permite cambiar servicios y confirmar un ejemplo dentro de la conversación. No altera la orden ilustrativa ni crea transacciones.
- Estimación separada: duración configurada, espera por cargas y capacidad, y total restante. Incluye inspección y descuenta fracción transcurrida de la tarea DEMO activa. Promedio histórico no disponible. No se afirma disponer de datos reales de operación.
- Mi auto resuelve bahía/cola/entrega, camina por ruta segura, orienta la misma cámara y muestra orden. Escenario quiet demuestra propiedad en bahía 03; no está vinculado exclusivamente a 01.

## D — actividad del establecimiento
- Cinco WashBayPrefab independientes con ocupación, etapas, empleados, herramientas y actividades dirigidas por estado. Tres plazas Q1/Q2/Q3 y lounge físico con banco GLB.
- Escenarios configurables mixed/quiet/busy/arrival, sin panel administrativo. Tráfico con un transporte activo a la vez y entrada/cola/asignación/servicio/entrega/salida.
- Rutas redondeadas por lateral/posterior; velocidad máxima normal 2.8 m/s, aceleración/frenado, reversa y parada antes de cambiar a marcha adelante. Las animaciones no publican eventos comerciales.
- Los prefabs toman la transformación inicial solo al montar; el controlador visual es el único escritor continuo. Reiniciar DEMO es una acción explícita que reinicia el escenario, no parte del recorrido continuo.

## Evidencia y límites de aceptación
La campaña final técnica se registra en GATE_STATUS.md. Las capturas se obtienen del navegador real; las finales de tarjetas desactivan únicamente transiciones CSS de aparición para evitar una foto a mitad del fundido. Los modelos y la escena siguen siendo renderizado real. No se generan imágenes de resultado mediante IA.

No se consideran aprobados el arte, vestuario/expresividad, mezcla de estilos, variedad de modelos de vehículo ni exactitud gestual de cada herramienta. Un automóvil conceptual GLB con colores diferentes no se presenta como catálogo de SUV/pickup/truck. Interior/focos/inspección comparten clip de empleado genérico; no hay aspiradora o pulidora específica. El banco y herramientas son GLB; la arquitectura modular es la existente autorizada por SOW §10.

El clima se verificó con fixtures de proveedor/errores y consulta pública NWS de San Juan, no con coordenadas reales del visitante ni del negocio. La ubicación del negocio sigue pendiente. La opción temporal exige permiso del navegador. Sin cobertura (NWS USA/PR), datos válidos o conexión se muestra simulación.

No hay backend/auth/pagos comerciales ni seguimiento físico. El renderer no ha recibido esa autoridad. El móvil evaluado es Edge con viewport táctil sobre Intel UHD de escritorio; no representa una certificación de teléfono físico ni un benchmark sostenido. La expansión posterior y aceptación artística requieren evaluación del usuario.

Revisión final de capturas: el marcador propio existía pero quedaba oculto por oclusión desde el mirador habitual (DOM sin rectángulo visible). Se eleva el ancla de la etiqueta a 2.25 m, encima de la envolvente del auto/empleado, manteniendo oclusión frente a arquitectura. Se añade una comprobación explícita de visibilidad al recorrido C; no se desactiva la oclusión para fingir visibilidad.
