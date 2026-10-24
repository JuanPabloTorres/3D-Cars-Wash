# Febles — estado de G0/G1

Fecha: 2026-10-23. Build evaluado: versión 0.1.0, Vite preview en localhost:4173.

| Hito | Estado | Evidencia |
|---|---|---|
| G0: repositorio, arquitectura y plano | COMPLETADO | G0_FOUNDATIONS.md |
| G0: recursos y licencias | COMPLETADO para el slice | ASSET_INVENTORY.md y ASSET_LICENSES.txt |
| G1: experiencia ejecutable | IMPLEMENTADO | http://127.0.0.1:4173 |
| G1: validación técnica automatizada | PASS | 12 unitarias, 3 E2E en versión compilada |
| G1: aceptación funcional del usuario | PENDIENTE | Recorrer y evaluar en navegador |
| G1: aceptación artística | PENDIENTE | Capturas y videos reales, sin aprobación asumida |
| G2/G3/G4/G5 y cinco bahías | NO INICIADOS | Detención en gate autorizado |

## Cambios solicitados durante la evaluación

- Saludo con hombro, codo y muñeca, entrada/salida suaves, LoopOnce y regreso a Idle.
- Transiciones Idle/Greet/Talk independientes del estado comercial.
- Mirador en (1.2,4.3); desplazamiento físico y enfoque diagonal sin poste delante.
- Tres espacios Q1/Q2/Q3 y observadores de fila y llegada, dentro del sendero seguro.
- Cartel y vegetación retirados de las líneas de visión de los observadores.
- Bounds precisos para que el vehículo no se vea como una miniatura.
- Auto DEMO único: no se crean vehículos de terceros para aparentar ocupación.

## Pruebas ejecutadas

`npm run build`: PASS. Advertencia: bundle JS de aproximadamente 1.43 MB sin gzip
(411 KB gzip); queda trabajo de distribución/carga antes de producción.

`npm test`: 12/12 PASS. Rutas a todos los destinos, conectividad entre pares,
colisiones, rechazo de destino inseguro, eventos duplicados/obsoletos, un solo auto
y separación entre movimiento visual y estado.

`npm run test:e2e` sobre **Vite preview**: 3/3 PASS en 1.1 min.

1. Escritorio 1440×900: entrada, caminata incremental y cancelación manual,
   recepción, colisión con mostrador, saludo que regresa a Idle, conversación con E,
   tres servicios, explicación de privacidad, exhibidor, bahía, pausa y eventos de
   servicio, movimiento del auto sin duplicación, retirada del foco, fila y llegada.
   Se comprobaron líneas de visión hacia auto, trabajador, fila y llegada.
2. Falta de GLB: respuesta 503 deliberada, error visible, reintento y carga exitosa.
3. Móvil 390×844: entrada, eventos táctiles nativos de Chromium/joystick con
   pointer capture, gesto para mirar, caminata guiada, conversación táctil,
   servicios, diálogo dentro del viewport y llegada al mirador.

Los recorridos normales finalizaron con cero errores de consola, excepciones o
solicitudes fallidas detectadas. La prueba 503 provoca y comprueba un fallo esperado.

`node scripts/validate-assets.mjs`: ocho GLB, cero errores. Advertencias conservadas:
generación de tangentes de equipamiento y mallas skinned no raíz en personajes.
No se presentan esas advertencias como aceptación artística.

`npm audit --omit=dev`: cero vulnerabilidades reportadas para dependencias de runtime.
Este chequeo no certifica seguridad de un backend, porque no hay backend real.

## Rendimiento observado y alcance de la medición

Ver JSON de métricas: viewport, versión de Edge, renderer, muestras, tiempos de
frame, llamadas de dibujo, texturas, geometrías y transferencias de red.
Renderer observado: Intel UHD mediante ANGLE/Direct3D11, en este equipo Windows.

| Recorrido emulado | FPS medio, ventana corta | Frame P95 | Draw calls |
|---|---:|---:|---:|
| Escritorio | 87.5 | 48.1 ms | 399 |
| Móvil | 122.0 | 11.5 ms | 364 |

Datos de la última campaña al redactar este reporte; ventanas de 240 frames en
momentos diferentes del recorrido, con animaciones y sondas de visibilidad. No son
benchmark sostenido ni una comparación de dispositivos. Un viewport móvil en el
GPU de escritorio **no prueba rendimiento de un teléfono**. Aproximadamente 23.23 MB
transferidos en la visita local; bytes de memoria GPU no medidos. Renderer.info
reporta conteos, no VRAM exacta. No se promete 60 FPS ni se certifica móviles físicos.

## Evidencia auténtica

- [Entrada](evidence/g1/desktop-entry.png)
- [Recepción y saludo](evidence/g1/desktop-reception.png)
- [Conversación](evidence/g1/desktop-dialogue.png)
- [Exhibidor](evidence/g1/desktop-service-station.png)
- [Bahía sin poste bloqueando](evidence/g1/desktop-bay.png)
- [Auto en movimiento](evidence/g1/desktop-vehicle-moving.png)
- [Fila](evidence/g1/desktop-queue.png)
- [Llegada de autos](evidence/g1/desktop-car-entry.png)
- [Diálogo móvil](evidence/g1/mobile-dialogue.png)
- [Bahía móvil](evidence/g1/mobile-bay.png)
- [Recorrido continuo de escritorio](evidence/g1/desktop-walkthrough.webm)
- [Recorrido continuo móvil](evidence/g1/mobile-walkthrough.webm)

## Límites antes de cualquier expansión

La naturalidad de gestos/manos, la vegetación low-poly, la coherencia entre el auto
conceptual y el resto del arte, el entorno periférico sencillo y el equipamiento
parcial necesitan evaluación. No hay lavado físico complejo, sincronización real,
registro de llegada, cotización, pago, entrega, lounge completo ni otras bahías.
Los estados y el vehículo son exclusivamente DEMO. Se mantiene el gate pendiente
de aprobación del usuario y no se expande el mundo.
