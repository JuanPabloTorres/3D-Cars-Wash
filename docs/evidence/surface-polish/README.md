# Acabado de superficies y bordes · 23-10-2026

Se suavizaron aristas de arquitectura, mostrador, mobiliario y objetos del mostrador; se ajustaron texturas existentes y el acabado de paneles y controles. Se conservan posiciones, dimensiones exteriores, navegación y autoridad comercial.

## Diagnóstico y responsables

| Nodo | Propietario | Contrato y evidencia |
|---|---|---|
| A | `Architecture.Block` | La baseline usa cajas rectas. `before-entry.png`, `before-reception.png`. |
| B | `surfaceGeometry.createBlockGeometry` | Biseles contenidos dentro de las dimensiones originales; pintura fina plana; UV por metro. Cuatro pruebas en `surface-geometry.test.ts` cubren creación y agrupación. |
| C | `StaticArchitectureBatch.batchArchitecture` | La agrupación anterior sustituía piezas por un cubo escalado. Ahora fusiona geometrías reales por material, conserva normales/UV, excluye modelos y props interactivos y restaura originales al desmontar. Si no puede fusionar, conserva originales visibles. |
| D | `sow.css`, `CounterObjects.PropBox`, `Architecture.usePalette` | Radios de panel/control diferenciados, reflejo interior y sombras discretas; madera, grafito y cemento con relieve y escala coherentes. Cemento con albedo atenuado para mantener el camino claro. |
| E | TypeScript, Vite, Vitest | Compilación y 59 pruebas unitarias ejecutadas correctamente. |
| F | Playwright | 17 capturas y comprobaciones en 1440, 650, 390 y 375 px, con foco visible y selección conservada. Suite completa: 28/31 aprobadas; ver resultado final. |

```text
entrada: geometrías/materiales y controles actuales
para cada Block:
    limitar bisel por el grosor sin ampliar su volumen exterior
    mantener planas las marcas finas
    ajustar UV por dimensiones en metros
agrupar copias transformadas de geometrías compatibles por material
si falla una agrupación: dejar visibles las piezas originales
al desmontar: liberar geometría propia y restaurar visibilidad
aplicar acabado CSS sin cambiar navegación, formularios ni comercio
verificar compilación, geometría, recorrido, foco y vistas responsive
```

## Evidencia

- `context-before.json` / `context-after.json`: identidades estáticas, sin secretos; no prueban calidad.
- `before-entry.png` / `before-reception.png`: baseline real de escritorio a 1440×900.
- `after-1440-*.png`: entrada, recepción, catálogo, lounge y bahía.
- `after-650-*.png`, `after-390-*.png`, `after-375-*.png`: mismas áreas principales, viewport y DPR registrados.
- `browser-checks.json`: consola, desbordamiento, contexto WebGL, selección, foco y métricas observadas.
- `scripts/capture-surface-polish.mjs`: reproduce las capturas mediante recorridos HTML públicos; no crea órdenes ni modifica configuración.

La comparación fija viewport y ambiente simulado soleado. El saludo no está congelado y puede variar entre imágenes. Las muestras de tiempos de fotograma son observaciones de una ejecución en este equipo, no un benchmark comparativo. Cero llamadas de dibujo al inicio significa telemetría todavía no publicada, no ausencia de geometría.

## Incidentes conservados y límites

- La primera ejecución de la prueba nueva de límites girados comparaba AABB aproximados. Se cambió el arnés a medición precisa de vértices; las 59 pruebas pasan.
- Una revisión detectó cemento demasiado oscuro. Se atenuó su mapa de color y se recapturó la compilación final manteniendo el camino claro.
- La primera suite E2E registró un timeout total de 90 s en confirmación/recuperación/cancelación, esperando estabilidad del botón «Mi orden». La causa no está confirmada. Se conserva el fallo y se verifica por separado.
- En la inspección de esta tarea el puerto 4173 ejecutaba `vite preview`: las capturas finales se realizaron después de compilar. Otra validación concurrente comunicó posteriormente un estado distinto del servidor. No se atribuye actualización automática al código fuente ni se fija el estado actual del servidor.
- No hay scripts de lint/formato en `package.json`. `git diff --check` detectó espacios finales en el `vite.config.ts` preexistente; ese archivo no se modificó.
- Aceptación artística humana pendiente. Los resultados técnicos no la sustituyen.

## Resultado de la suite completa

`full-suite-results.json` conserva el resultado original: **28 aprobadas, 3 fallidas, 0 omitidas**. `sow.spec.ts`: 11/11; `commercial.spec.ts`: 14/16; `lounge.spec.ts`: 3/4.

Fallos registrados:

1. Confirmación, recuperación y cancelación: timeout total de 90 s, pendiente de click en «Mi orden».
2. Sincronización de dos contextos: timeout total de 90 s.
3. Recuperación de borrador desde lounge: el selector «Color» no se resolvió durante la espera; el snapshot de fallo muestra el formulario con Azul seleccionado. Causa sin confirmar; el archivo de pruebas recibió cambios concurrentes ajenos a este trabajo.

Se inició una repetición de esos tres casos con salida separada, pero se canceló mediante Ctrl+C antes de obtener resultados para no competir con otra tanda GPU activa sobre el mismo proyecto. Esta cancelación no demuestra ni fallo ni éxito del producto.

El acabado visual está implementado y sus recorridos/capturas se verificaron. La validación global queda **PARCIAL** por esos tres casos. No se cambiaron tiempos límite ni expectativas para conseguir aprobaciones. No se alteraron servidor, compilación ni fuentes después de comunicar la congelación de esta tarea.
