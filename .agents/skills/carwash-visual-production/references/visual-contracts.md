# Contratos por toma

Fuentes canónicas del repositorio: `docs/design/visual-experience-sow.md` y `docs/design/reference-reconciliation.md`. La segunda reconcilia diferencias entre propuestas. Configuración comercial gobierna marca, catálogo y precios.

## Ficha antes de editar

```text
ID / intención comercial / modo de trabajo:
Referencia: archivo + SHA-256
Estado: sesión sintética/anónima, orden/fase, fixture explícito
Viewport/DPR/dispositivo: escritorio 1440x900; móvil 390x844
Escena: recursos/hash, hora/clima/exposición, fase del gesto
Cámara: posición/target/FOV/near/far, ruta sin colisión
Sujetos: cajas proyectadas, cara/manos/props que deben verse
UI: panel/variante/cierre, safe area, destino activo
Acción: pointer + touch + teclado, resultado, retorno sin pérdida
Fallo: carga/transición/proveedor, recuperación/cancelación
Antes/después: screenshot real, video pertinente, consola, diferencias
Técnico: PASS/FAIL/NOT_TESTED; artístico: pendiente/decisión humana
```

Las dimensiones del SOW son metas, no mediciones actuales. Nuevos umbrales de tamaño proyectado se proponen y calibran; no presentarlos como aprobación del usuario.

| Toma / imagen original en carpeta de referencias | Composición / acciones | Estados |
|---|---|---|
| entrance.empty · `Febles Car Wash entrance UI concept-1.png` | Lounge izquierda, recepción centro, bahías derecha; camino peatonal distinguible. Bienvenida inferior izquierda, cuenta/ayuda arriba y cuatro destinos abajo. Recepción activa solo al llegar. Ir a recepción en 1–1.5 s, sin cruzar mobiliario. | Carga/error/reintento; sin orden; regreso tras recuperación válida |
| reception.welcome · `Febles Car Wash Reception Concept-3.png` | Ana centro-izquierda, rostro cerca del tercio alto; torso/mano/objetos completos. Panel último tercio derecho; cierre conserva cámara. Marca frontal menor, visible sobre navegación. | Saludo → reposo; visita inicial/regreso; panel cerrado |
| reception.catalogue · `Polished car wash service catalog-2.png` | Misma recepción/props; panel ampliado y encuadre específico, cara visible. Cuatro categorías, tarjetas reales, selección/resumen/continuar legibles. | Cero/uno/varios servicios, quitar/detalle, precio ausente, vehículo/revisión con borrador conservado |
| bay.own.active · `Polished Car Wash Operations UI-4.png` | Auto/operario dominan; panel/pilar no tapan agarre, boquilla o superficie. Humedad localizada, drenaje y manguera conectada. Destino según contexto propio/público. | Vacío/fila; exterior/interior/focos/inspección/listo. Vehículo por ID, público sin información privada |
| lounge.empty / lounge.order · `Febles Car Wash Lounge UI-5.png` | Asientos/mesa en primer plano izquierdo, vegetación detrás; vista a recepción y bahías; panel derecho. | Sin orden preparar visita; con orden estado real; ofertas configuradas o vacío honesto |

## Reconciliación

- Cuatro objetos: **folleto Servicios → reloj Horarios → flyer El local → tableta Preguntas**. Centro frente a Ana libre. Un icono de reloj dentro de botón no es un reloj modelado.
- Una navegación compartida de cuatro destinos: escritorio objetivo 640×76 px a 20 px del borde. Sin barra permanente duplicada.
- Bienvenida escritorio: izquierda 24 px, ancho objetivo 380 px, padding 24 px, separación 20 px de barra; sin backdrop bloqueante.
- Materiales rojo/grafito/cemento mate/madera/verde vivo. Panel Dark Blue `#11212D`, Manrope instalada e iconos Lucide semánticos. UX Pro Max complementa; no reemplaza referencias por template SaaS.
- Fondo urbano detrás de muro, sin playa ni costura en traslado. Imagen lejana permitida; elementos cercanos con volumen.
- Tres familias vegetales predominantes máximo; palmeras aisladas. Priorizar rostro/manos/automóvil/props cercanos antes que edificios lejanos.
- Móvil: misma lógica, panel inferior, acciones sobre barra/safe area, texto legible. Catálogo una columna.

## Prueba adecuada

Estática: cara/mano/props/auto expuestos; controles dentro del viewport sin oclusión; continuidad de suelo/escala; plantas apoyadas sin intersecciones. Inspeccionar imagen y anclas proyectadas si existen; `sightLines` sin productor activo no demuestra visibilidad.

Dinámica: saludo inicio/subida/máximo/regreso/reposo; explicación breve; cámara salida/medio/llegada; contacto mano/herramienta/superficie frontal y lateral. Clip activo o attached:true no prueba actuación natural.

Flujo: servicios → vehículo → revisión → confirmación de proveedor → orden → fila/bahía/entrega operativa. Cierre/volver conserva borrador. Sin orden/error recuperable/cancelación permitida/sesión aislada. No poblar operación normal con coches falsos.

Comparación: mismo viewport, recursos, fase, luz y fixture. Desactivar CSS no congela Three.js. Si no puede fijarse un estado, declarar comparación aproximada. Pixel diff no equivale a juicio artístico. Screenshot Blender y navegador se etiquetan por separado; no generar imágenes para simular evidencia.
