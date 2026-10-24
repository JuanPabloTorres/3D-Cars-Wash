# Statement of Work (SOW) — Febles Car Wash: Experiencia Inmersiva 3D

**Versión:** 1.0 · **Estado:** Propuesta para análisis y planificación · **Fecha:** 23 de octubre de 2026

**Repositorio de referencia:** `C:\Projects\Repos\3D-Cars-Wash`

## 1. Encargo

Diseñar y construir una **experiencia web 3D continua** que permita al cliente sentir que **llega personalmente a Febles Car Wash**, camina por el establecimiento, conversa con recepción, registra su vehículo, conoce y contrata servicios, observa su posición en la cola y sigue el trabajo hasta la entrega. La interfaz principal **es el establecimiento navegable**, no una página web tradicional, un dashboard ni un juego de gestión visto desde arriba.

El proyecto debe poder implementarse por Codex con **herramientas reales, modelos 3D licenciados, componentes reutilizables y pruebas automáticas**, sin depender de escenas cinematográficas prerenderizadas ni de crear assets artísticos complejos desde cero.

## 2. Decisiones de producto no negociables

1. **Mundo único, continuo y explorable.** Recepción, entrada, cola de autos, exhibición de servicios, cinco bahías, lounge, caja/entrega y salida forman parte del mismo espacio persistente. Las acciones no cargan páginas distintas.
2. **Perspectiva humana.** Cámara principal en primera persona a altura de los ojos. Puede existir una cámara cercana detrás del visitante como opción; **nunca** vista isométrica, aérea o estética tipo *The Sims* como experiencia principal. La vista aérea puede reservarse para un minimapa opcional.
3. **Caminar, no teletransportarse.** El usuario puede moverse con WASD/flechas y mirar con ratón, y en móvil usa controles táctiles. También puede seleccionar «Ir a recepción», «Ir a servicios», «Ver mi auto» o «Ir al lounge»; el sistema calcula una ruta y **camina animadamente** a ese destino con cámara acompañante. Se admite recuperación de accesibilidad si no es posible navegar, sin presentarla como un salto físico normal.
4. **Interacción contextual.** Al acercarse a una persona o estación aparece una indicación breve: «E · Hablar», «E · Ver servicios», «E · Ver mi orden». Los formularios solo aparecen mientras el usuario interactúa; se cierran sin abandonar el mundo.
5. **Recepcionista creíble y útil.** Debe saludar, preguntar el motivo de la visita, responder dudas sobre servicios, guiar al cliente, solicitar datos necesarios, consultar su orden y explicar estado/cola. Puede empezar con diálogos estructurados e incorporar un asistente conversacional después. El lenguaje natural **nunca** concede permisos ni confirma pagos, llegada, servicios o entrega sin la API de negocio.
6. **Estado operativo visible y correcto.** Los autos esperan físicamente en una fila. El cliente puede ver «N vehículos antes que tú», su estado, bahía asignada y trabajos realizados únicamente cuando exista información confirmada. Si faltan datos, mostrar «Sin información actualizada» en vez de inventarlos.
7. **Estilo visual realizable.** Instalación 3D comercial estilizada y sobria: modelos de detalle medio, arquitectura modular, materiales PBR sencillos, buena luz natural, sombras de contacto y señales claras. Evitar hiperrealismo, personajes de película, muñecos caricaturescos tipo Sims/Pixar, múltiples estilos visuales, SVG planos como autos/personajes y escenarios que sean una sola imagen.
8. **Interfaz mínima.** No usar barra lateral permanente, dashboard de tarjetas, collage de pasos, menú de ecommerce o HUD invasivo. Se permiten una señal de interacción, un pequeño indicador opcional del auto/cola y un menú discreto de destinos/ayuda que se oculta.
9. **Separación real/demostración.** La simulación demo debe ser evidente y aislada; el estado real lo autoriza el backend.
10. **La aceptación visual es independiente de las pruebas técnicas.** Compilar o pasar E2E no acredita un diseño aprobado.

## 3. Alcance de la experiencia (journey)

### A. Llegada

- El cliente aparece en el acceso peatonal, con recepción a distancia alcanzable, zona de circulación segura y bahías observables.
- Controles: caminar, mirar, interactuar, destinos y ayuda. Tutorial opcional de una sola aparición.
- El mundo muestra actividad solo en espacios ocupados según demo u operación confirmada.

### B. Recepción

- Al caminar hasta el mostrador, la empleada mira/saluda al visitante y aparece «Hablar con recepción».
- Interfaz de conversación contextual: «Es mi primera visita», «Quiero registrar mi vehículo», «Quiero saber los servicios», «¿Dónde está mi vehículo?», «Tengo una pregunta».
- Preguntas y respuestas en lenguaje claro; voz opcional para fase posterior.
- Registro de tipo/color y datos necesarios; una solicitud online no se representa como llegada física.

### C. Catálogo y cotización

- Desde recepción o estación de servicios, se presentan opciones en una interfaz compacta sobre el mismo mundo, vinculadas al vehículo visible.
- Permitir consultar explicaciones y combinar servicios válidos: lavado, interior, focos, aspirado, etc., de acuerdo con el catálogo real.
- Precios, compatibilidades, descuentos y total provienen del servidor. Mostrar resumen y confirmar antes de crear o modificar orden.

### D. Cola y espera

- La fila de autos existe físicamente en el mundo con escala, separación y circulación coherentes.
- Mostrar número de vehículos por delante **solo si la posición puede determinarse con datos autorizados**; los autos de otros clientes no muestran placas ni identidades.
- El usuario puede caminar al lounge, permanecer en recepción o acercarse a un mirador de las bahías.

### E. Servicio y progreso

- El auto propio puede pasar de espera a bahía asignada sin duplicarse. Cada bahía tiene estado independiente.
- Una animación de entrada, agua, aspirado o inspección solo ilustra una etapa respaldada por la operación. No cambia estados comerciales.
- Desde puntos seguros se puede mirar el vehículo o seleccionar «Ver mi auto» para que el visitante camine al área de observación.
- Las demás bahías conservan actividad anonimizada, sin aparentar seguimiento individual que la API no ofrece.

### F. Cobro y entrega

- El cliente recibe aviso de que el vehículo está listo según el estado autorizado, puede caminar a entrega y consultar recibo o instrucciones de pago.
- No simular pago en línea si no existe integración de cobro. Entrega y salida solo tras confirmación adecuada.

## 4. Arquitectura propuesta

- **Frontend:** React + TypeScript + Three.js + React Three Fiber + Drei.
- **Escena persistente:** `WorldScene`, `WorldAssetRegistry`, `EnvironmentPrefab`, `ReceptionPrefab`, `WashBayPrefab`, `VehiclePrefab`, `StaffPrefab`, `InteractionPoint`, `NavigationController`, `CameraController`, `WorldHUD`.
- **Recorrido:** sistema de waypoints / malla navegable. Evaluar Recast Navigation si la geometría lo necesita; empezar con rutas simples verificables. Colisiones básicas, obstáculos y puntos seguros junto a las bahías.
- **Animación:** `AnimationMixer` y clips de caminar, reposo, saludo, conversación y actividad. Cambios de estado mediante controladores reutilizables.
- **Estado de UI:** Zustand u opción equivalente, separado del estado de negocio.
- **Adaptador:** `OperationProjection` proyecta respuestas del backend en entidades visuales; no contiene reglas de cobro, permisos ni confirmación.
- **Backend:** contratos de visitas, catálogo, cotización, orden, registro de llegada, cola, ocupación, etapas y entrega. Decidir si se recupera una parte estable del backend archivado o se implementa nuevo según auditoría de contratos y datos; **no reutilizar la antigua capa visual**. Autorizaciones y precios en servidor.
- **Sincronización:** actualización periódica como respaldo; valorar SSE/WebSocket para eventos operativos. Gestionar desconexión, estados obsoletos y reconciliación.
- **Assets:** GLB/GLTF existentes con permiso de uso; registro de licencia, autor, enlace, versión, dimensiones y presupuesto de polígonos/texturas. Herramientas: Blender para adaptar, glTF Transform y KTX2/Draco/Meshopt según compatibilidad.
- **Efectos:** iluminación moderada, materiales PBR, partículas limitadas, sombras optimizadas. Evitar agua volumétrica y simulación física compleja en MVP.

## 5. Sistema de interacción mínimo

**Escritorio:** WASD/flechas para caminar; ratón para girar cámara; `E` para interactuar; `M` para mostrar/ocultar mapa compacto; `Esc` para cerrar diálogo/pausar entrada. Clic en destino accesible activa *caminar automáticamente*, no teletransporte.

**Móvil:** joystick virtual discreto, gesto de arrastre para mirar, botón contextual de interacción y selector de destinos. Zona táctil y lectura accesibles a 390×844 sin barra lateral permanente.

**Navegación guiada:** origen y destino se resuelven a nodos navegables; el avatar recorre el camino, orienta el cuerpo y la cámara le acompaña. Al llegar se habilita la interacción; cancelación devuelve control manual. La navegación nunca atraviesa autos, paredes o bahías peligrosas.

**Recepción:** diálogo contextual con texto y acciones estructuradas, memoria de la visita actual y acceso al catálogo/orden. Un LLM o sistema RAG es opcional y debe limitarse a conversación y consultas autorizadas, jamás efectuar cambios sensibles sin validación.

## 6. Reglas del diseño visual

- Una referencia visual nueva debe representar una **captura auténtica de juego a pantalla completa y un único momento**: perspectiva humana, caminos y edificios reconocibles, objetos alcanzables y controles discretos.
- Prohibidos: posters de varias viñetas, menús verticales permanentes, tarjetas cubriendo la mitad de la escena, perspectiva Sims, edificios irreales, personajes caricaturescos hiperexpresivos, fondos fotográficos estáticos.
- El arte se construye con **pocos prefabs consistentes**. Las cinco bahías reutilizan una misma estructura parametrizada. Vehículos y personal comparten escala/materiales. Texturas y luces deben verse coherentes.
- Priorizar realismo funcional: distancias, accesos peatonales seguros, visión desde recepción y lounge, flujo entrada→cola→bahías→entrega→salida.
- El visor/debug técnico no debe aparecer en la experiencia del cliente final.

## 7. Fuera de alcance del MVP

Multijugador, tráfico físicamente simulado, VR, gemelo digital de precisión topográfica, personajes fotorealistas, sincronización individual de autos de terceros sin IDs, navegación libre por zonas de riesgo, procesamiento real de tarjetas sin proveedor, voz conversacional obligatoria, generación procedural masiva de todo el local.

## 8. Etapas y entregables

| Etapa | Entregable verificable | Gate |
|---|---|---|
| 0. Auditoría | Inventario de assets actuales, contratos, licencias y reporte de reutilización | Sin cambios destructivos antes del inventario |
| 1. Vertical slice | Entrada + camino transitable + recepción + una bahía + auto + NPC + HUD mínimo | Aprobación visual y navegación funcional |
| 2. Atención | Conversación estructurada, check-in y catálogo/cotización demo | Flujo de recepción E2E |
| 3. Mundo | Cinco bahías, cola, servicios, lounge, caja/entrega y circulación | Rutas físicas completas sin colisiones |
| 4. Negocio | Backend y sincronización de órdenes/cola/servicios/entrega | Seguridad, precio, estados y privacidad |
| 5. Certificación | Pruebas navegador, capturas, accesibilidad, optimización móvil y escenarios de fallo | Aceptación técnica + artística separadas |

## 9. Criterios de aceptación objetivos

1. Entrada: el visitante ve recepción, circulación peatonal, autos esperando y al menos una bahía activa (en modo demo definido), sin dashboards flotantes.
2. Movimiento: puede caminar de entrada a recepción con teclado y móvil; también mediante «Ir a recepción», siguiendo una ruta física visible sin teletransporte ni atravesar obstáculos.
3. NPC: saluda al acercarse, acepta «Registrar», «Servicios» y «Mi orden», y no afirma operaciones no confirmadas.
4. Orden: cotización y total calculados por backend, diferencias y errores visibles; sin cambios de estado por animación.
5. Cola: cero, tres y más vehículos soportados; posición exacta solo cuando verificable y propio auto sin duplicados.
6. Bahías: dos activas y tres libres se representan consistentemente, con tareas visuales acordes al estado.
7. Conectividad: desconexión conserva última lectura etiquetada como no actualizada; reconexión concilia posiciones sin duplicación.
8. Móvil: controles táctiles, lectura, diálogos y navegación real en 390×844, sin barras que tapen la escena.
9. Evidencia: capturas **individuales** del mundo en entrada, recepción, cola, servicio, lounge y entrega, más clips de caminata y pruebas E2E. Comparar con el contrato, no con una imagen cinematográfica irreproducible.
10. Rendimiento: medir FPS, tiempo de carga, errores WebGL y memoria en dispositivos objetivo; establecer presupuesto cuantificado tras el vertical slice.

**Escenarios demo obligatorios:** local vacío; tres autos en espera; dos bahías activas; un vehículo propio desde orden pendiente a llegada, cola, trabajo, listo y entrega; desconexión/reconexión; vista móvil. Cualquier precio o espera ficticia debe etiquetarse como demo y no confundirse con la operación real.

## 10. Riesgos y medidas

- **Arte incoherente:** aprobar un pequeño conjunto de assets juntos antes de poblar el local; no aceptar solo capturas aisladas.
- **Pérdida de tiempo buscando assets perfectos:** permitir geometría modular únicamente para infraestructura, con buenos materiales; reservar modelos comprados/licenciados para autos/personas/equipamiento significativo.
- **Experiencia lenta:** reutilizar GLB, instanciar elementos, usar LOD, compresión y optimización de sombras; medir en navegador real.
- **Interacciones falsas:** toda operación invoca una API con autorización; demo separada y claramente marcada.
- **UI convencional encubierta:** auditar que todo flujo comience caminando hacia un objeto o persona, excepto accesos rápidos explícitos de accesibilidad.
- **Bloqueo por arte cinematográfico:** aceptar una dirección visual de simulación comercial coherente, no perseguir fidelidad 1:1 a referencias prerenderizadas.

## 11. Definición de terminado

Un usuario nuevo puede entrar virtualmente, caminar hasta recepción, hablar con una empleada funcional, registrar un vehículo, conocer y elegir servicios, obtener cotización, comprender cuántos autos tiene delante (si el dato está disponible), desplazarse a un área segura para observar el progreso, esperar en el lounge y completar el retiro cuando esté autorizado; todo **dentro de un mundo continuo** que se ve coherente y funciona en escritorio y móvil. La entrega debe incluir fuentes, manifiesto de assets/licencias, pruebas, capturas de cada escena y un registro honesto de límites.

## 12. Instrucción para abrir una nueva sección de trabajo

> Actúa como arquitecto de producto 3D, director de experiencia y líder técnico de Febles Car Wash. Toma este SOW como contrato inicial, no como autorización para construir inmediatamente todo el sistema. Primero realiza un discovery de la base Three.js actual y de los recursos GLB/HDRI; produce un inventario, una propuesta de dirección artística reproducible, un mapa de rutas navegables, contratos de interacción y un plan de vertical slice. No uses PixiJS ni el diseño anterior. No uses dashboard, sidebar ni una composición de pantallas. La experiencia central es caminar de manera física por el local desde una perspectiva humana, interactuar con la recepcionista y ver la operación de mi auto/cola de forma confiable. Implementa primero entrada→recepción→interacción→bahía de demostración y valida en navegador con capturas individuales y controles funcionales. Solo continúa a las demás áreas cuando el vertical slice alcance aceptación visual y funcional. Mantén separado el backend como fuente de verdad. Registra expresamente las decisiones, riesgos, licencias y pruebas de cada fase.
