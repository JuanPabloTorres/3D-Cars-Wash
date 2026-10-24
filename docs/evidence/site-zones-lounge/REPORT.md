# Vegetación por zonas y lounge · 23-10-2026

## Alcance y diagnóstico

Petición: apoyar la vegetación en tierra, conservar libres las carreteras y mejorar los asientos según los conceptos existentes.

Referencias inspeccionadas: `Febles Car Wash entrance UI concept-1.png` y `Febles Car Wash Lounge UI-5.png`, ambas en Downloads, más los SOW/reconciliación de `docs/design`. Capturas propias iniciales: `before-entrance.png` y `before-lounge.png`, 1855×848, operación vacía, clima soleado. El fondo montañoso actual difiere del concepto urbano y queda fuera de esta corrección.

Mecanismo observado en código: `Landscape`, `EntranceForecourt` y `EnvironmentBoundary` mantenían colocaciones independientes de las superficies de tierra. Había arbustos sin soporte y árboles sobre el asfalto, incluido el sector de maniobra trasero. No se trata de un problema del GLB: la colocación no estaba vinculada a una zona.

## Cambios y propietarios

| Flujo | Propietario | Contrato |
| --- | --- | --- |
| Zonas de tierra | `src/world/siteLandscape.ts` | Ocho jardineras con límites, altura y margen interior |
| Colocación | `plantPlacement` | Rechaza bases fuera de tierra; deriva Y del suelo de la zona |
| Representación | `src/world/prefabs/Landscape.tsx` | Un único conjunto de plantas y superficies para entrada, lounge y perímetro |
| Circulación frontal | `EntranceForecourt.tsx` | Luces/topes siguen el borde de la jardinera; la vegetación duplicada se elimina |
| Montaje | `WorldLayout.tsx`, `EnvironmentBoundary.tsx`, `Architecture.tsx` | Retiran las colocaciones anteriores; conservan modelos, pavimento y fondo |
| Muebles/cámara | Otro chat autorizado del mismo proyecto | Integración de asientos oscuros, listones, cojines claros y acento rojo; sin sobrescribir su trabajo |

La jardinera frontal se desplazó a x=-2.3 m y ancho 1.8 m después de comprobar el barrido del camión. Los árboles posteriores se apoyan en una franja de tierra cuyo borde comienza en z=-18.5 m, fuera de las maniobras. Los modelos con maceta de recepción y mesa conservan sus propios recipientes. El plano `site-plan.png`/`site-plan.svg` se genera desde los módulos actuales y muestra las ocho zonas, las 96 bases plantadas y dos rutas representativas. Sus símbolos no representan las copas.

No se modifican tarifas, órdenes, autenticación, estados comerciales ni GLB desde este chat. El usuario autorizó integrar los cambios simultáneos y coordinar mensajes con los otros dos chats del proyecto. Un solo propietario mantiene build/dist/preview y la suite E2E compartida.

## Evidencia de intentos

- 20:32, intento inicial: la nueva prueba detectó interferencia de la jardinera frontal con el camión en x≈3.43, z≈9.80. Se conservó la expectativa y se corrigió la posición de la jardinera.
- 20:32 y 20:33: los recorridos al lounge fallaron tras la redistribución concurrente de muebles. El diagnóstico del grafo mostró un componente desconectado en el paso oriental. Se envió al propietario de cámara/navegación; no se desactivó la prueba.
- 20:33: build propio completado; advertencia existente de tamaño de chunk. Este build precede la última posición frontal y no constituye la validación final integrada.
- 20:35: pasaron cuatro pruebas dirigidas: bases dentro de tierra, rechazo de ubicaciones inválidas, barrido OBB del camión por todas las rutas y geometría inferior de los GLB reales transformada por escala/rotación.
- 20:38: las 54 pruebas unitarias de la versión integrada pasaron, incluido el acceso al lounge corregido por el propietario de navegación.
- 20:39: inspección visual de `vegetation-coherence/integrated-preview/desktop-entrance.png` detectó que la caja maciza de las jardineras ocultaba la tierra inferior. Se conservaron límites y alturas; se sustituyó la caja por cuatro paredes abiertas.
- 20:40: la nueva regresión usa Raycaster sobre las superficies que renderiza Landscape y comprueba que el primer impacto debajo de cada planta es tierra a la altura correcta. Suite completa: **55/55 pruebas, 11 archivos, PASS**, en `unit-final.log`.
- `git diff --check` encontró CRLF/espacios en `vite.config.ts`, archivo preexistente ajeno al alcance; se conservó.

## Validación final

**Corrección espacial y visual comprobada dentro de este alcance.**

- **55/55 pruebas unitarias**, 11 archivos, ejecutadas aquí después de corregir las paredes; evidencia `unit-final.log`.
- Build integrado del propietario coordinado: `../vegetation-coherence/build-release-candidate.log`, completado 20:41. Advertencia conservada de chunk grande. Esta compilación incluye las cuatro paredes y suelo expuesto.
- **3/3 recorridos reales entrada → lounge → recepción**: 1855×848, 1440×900 y 390×844. Capturador propio `scripts/capture-site-zones-lounge.mjs`, salida `capture-final.log` y manifiesto `after/capture.json`.
- **Cero errores de página o recursos, sin pérdida de contexto WebGL**. Entry `/assets/index-Ds3b6eNw.js`; hashes de todos los bundles idénticos antes/después.
- Los tres contextos eran anónimos, operación vacía, clima soleado, exposición 1.05. No se enviaron comandos ni se crearon órdenes.
- Inspección visual directa de `after/1855-entrance.png`, `after/1855-lounge.png` y `after/390-lounge.png`: suelo visible en jardineras; plantas apoyadas; sofá claro con acento rojo, sillones y mesa sobre la plataforma. El móvil conserva sofá, maceta/mesa y recepción encima del panel.

Hubo concurrencia durante parte de la captura con la repetición de dos casos del mostrador del otro chat, tras señales cruzadas de coordinación. Se conserva esa condición y **no se afirman FPS ni rendimiento**. Los hashes y la ausencia de errores se comprobaron igualmente. Browser de la captura cerrado al terminar.

La tanda del piloto del otro chat tuvo inicialmente 4 aprobados y 2 fallos (timeout y medición flotante de un control de 44px); su repetición dirigida pasó 2/2 en el mismo bundle. Registros compartidos: `../pilot-20261023/attempt-1/targeted.log` y `../pilot-20261023/attempt-2/targeted.log`. La suite general completa continúa bajo el propietario coordinado y no se declara aprobada aquí.

Capturas de aceptación del alcance:

- Entrada: `after/1855-entrance.png`.
- Lounge escritorio: `after/1855-lounge.png`, `after/1440-lounge.png`.
- Lounge móvil: `after/390-lounge.png`.
- Conjunto sin panel: `after/1855-lounge-unobstructed.png`, `after/390-lounge-unobstructed.png`.
- Plano de zonas: `site-plan.png` / `site-plan.svg`.

La aprobación artística depende de la revisión del usuario. Una compilación, una prueba geométrica o una captura guardada no equivalen a esa aprobación.

## Límite del observador

Al cerrar, `report.py` no pudo entregar `result.json`: receptor incompatible/no disponible en el puerto del panel. El intento de recuperación con `launch.py` agotó el tiempo de espera. El resultado estructurado queda guardado localmente; su recepción por el panel **no está confirmada**. Este fallo no afecta los registros, capturas ni comprobaciones del producto.
