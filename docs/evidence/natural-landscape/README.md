# Vegetación natural y apoyo en tierra

Pedido: reducir el aspecto caricaturesco de árboles/plantas y la sensación de recursos colocados encima del escenario, conservando el acabado redondeado y la operación existente.

## Diagnóstico observado

- `coherentOak.glb`: 213372 triángulos, cuatro materiales de color plano, sin diffuse ni normal map. Corteza y hojas carecían de textura fotográfica.
- Arbustos distribuidos en filas uniformes; tres tintes aplicados a materiales completos. Los modelos `coherentShrub` y `coherentCalathea` ya tenían texturas y recorte alfa correctos; no se sustituyeron.
- `urbanFern.glb`: material MASK pero textura RGB sin canal alfa. Se verificó leyendo el archivo activo y decodificando su imagen, no sólo comprobando el valor de alphaMode.
- El adaptador anterior alineaba X/Z al centro de la copa completa. Una copa asimétrica puede desplazar el tronco respecto al punto previsto, aunque la altura de su base sea correcta.

## Cambios propios

- `naturalTree` reutiliza geometría profesional fototexturizada existente, conservando UV/PBR y reparando alfa con el mapa oficial. `naturalFern` conserva geometría y recupera su alfa. Recursos anteriores preservados.
- `vegetationFrame` mide la base real dentro de los primeros 2.5 cm normalizados y alinea su centro X/Z con el punto de plantación. No modifica dimensiones de jardineras ni rutas.
- `InstancedVegetation` conserva geometrías/texturas cacheadas, clona sólo materiales y libera recursos propios. Recorte alfa sin mezcla transparente y variación neutra discreta por instancia.
- `siteLandscape` concentra modelo/altura y agrupa plantas en manchas escalonadas con escala y giro moderados. Las raíces permanecen dentro de tierra.
- `Landscape` incorpora sustrato fotográfico Brown Mud PBR1K a 1.3 m por repetición.

## Evidencia y validación

- `candidate-manifest.json`: fuente, autores CC0, descargas verificadas, hashes, 0 errores glTF en ambos candidatos, máscaras alfa con regiones visibles y transparentes.
- `source-manifest.json`: archivos de este incremento y hashes antes de la tanda integrada.
- `npm test`: **61/61**, 13 archivos, ejecutado el 23-10-2026 a las 22:04 de La Paz. Incluye base medida, apoyo real sobre tierra, volumen barrido del truck, caminos y alfa real en los cuatro recursos vegetales activos.
- Baseline compartida e inmutable: `../pilot-20261023/after/1440-entrance.png` y `1440-lounge.png`; bundle FXtXVk5r y captura con resourcesStable. No se modifica esa evidencia ni se atribuye a esta nueva fase.
- Build y captura posteriores: coordinados con el chat de diagnóstico sobre una única tanda. Pendientes de inspección y registro al escribir este apartado.
- Promoción final a las 22:26: `naturalTreeDense.glb` copiado y verificado antes de activar su selección. SHA256 `5a1ed837dc16897fb3ee2300a7059fb5a13ae134fd7d7d64ab559cb7dfa924ad`. glTF 0 errores, 3 avisos de tangentes en runtime. **65/65 pruebas** en 14 archivos, `unit-final.log`; todos los GLB seleccionados existen y se prueban raíces de ambas variantes de árbol. El propietario de circulación resolvió su fallo anterior sin cambios desde paisajismo.
- Compilación conjunta: `../bay01-build-final.log`, aprobada. Capturas finales reales inspeccionadas: [entrada 1440](../bay01-refinement/final/1440-entry.png) y [lounge 1440](../bay01-refinement/final/1440-lounge.png), bundle `index-Dbn7wan8.js`. `vegetation-check.json` registra consola sin errores, contexto WebGL conservado y operación vacía. La tanda Bay precedente registra recursos estables; estas dos tomas adicionales tienen su recibo propio y no se presentan como benchmark.
- Inspección visual final: corteza texturizada, grupos de hojas más legibles, sustrato granular y jardineras apoyadas. La especie mantiene una copa fina/aireada y no reproduce la densidad del concepto. Se cierra la iteración técnica sin declarar aprobación artística humana. No se cambian nuevamente recortes, especies ni densidad durante las comprobaciones integradas.
- `frozen-check.json`: 12 archivos de este incremento conservan los hashes de READY final, sin modificaciones durante la compilación/captura compartida.

## Revisiones visuales conservadas

1. `../diagnostico-ux-20261023/after-candidate-1/`: primer árbol fototexturizado y nuevas bases. Captura estable; corteza mejora, copa demasiado escasa. No aceptado como resultado visual completo.
2. `../diagnostico-ux-20261023/after-candidate-2/`: umbral alfa de copa reducido a .2 con cobertura MSAA y calatheas como masa principal. Captura estable; jardineras más volumétricas, copa todavía fina. No se declara aprobación artística ni cierre por ese intento.
3. Candidato externo `naturalTree-dense-v2.glb`: preparado desde la fuente original con mayor preservación de UV (.5/.5), límites de error .0008 y extremos de islas foliares protegidos. 472062 triángulos, 18358996 bytes, 0 errores y 3 avisos glTF. Pendiente de promoción y comparación final.

El experimento de cobertura en CPU usa el mismo atlas alfa y altura normalizada de 5.8 m, muestreando centroides de aproximadamente 50000 triángulos. Superficie opaca estimada a umbral .45: **24.79 m²** en el candidato inicial, **35.45 m²** en v2 y **45.14 m²** en el original. Es una medida relativa de preservación UV/geometría; no equivale al área proyectada en pantalla ni a una prueba de FPS. Se conserva en el staging `coverage-experiment.json`. La reducción anterior mantiene buena parte del área geométrica pero pierde correspondencia con la máscara, por lo que bajar el umbral es sólo una mitigación parcial.

La sustitución de arbustos abiertos por grupos de hojas amplias reduce geometría de vegetación baja para compensar parte del coste de una copa mejor conservada. El coste final se medirá en la tanda integrada; no se afirma rendimiento equivalente sin comparación válida.

Selección propuesta para la comparación final: sólo los **dos árboles cercanos** usarán la geometría v2 más conservada; los tres del fondo mantienen la versión ligera. `geometry-budget.json` registra 48 arbustos, 36 calatheas, 12 helechos y cinco árboles (dos cercanos/tres lejanos): 3210756 triángulos instanciados de plantas, sin contar sombras ni el resto del escenario. La segunda geometría también agrega peso de descarga y texturas; no se oculta ese coste ni se equipara reducción de triángulos con mejora de FPS.

## Responsabilidades y límites

Incidente de integración preservado: una compilación intermedia incorporó una referencia a `naturalTreeDense.glb` antes de que el archivo se promoviera y la visita mostró error de carga (recibió HTML en lugar de GLB). La selección se retiró, se comprobó que todos los modelos seleccionados existían y se congeló la fuente. La promoción final debe copiar primero el archivo nuevo, verificar existencia y después activar su ID. No se atribuye este incidente al trabajo de bahías.

Revalidación compartida a las 22:22: 64/65 pruebas aprobadas tras incorporar trabajo concurrente de circulación. El fallo está en cambio de marcha/orientación (`refinement.test.ts:34`, diferencia .036643 frente a límite .02); las pruebas de raíces, suelo y máscaras alfa pasan. Se comunicó al propietario de movimiento; no se relajó la expectativa ni se modificó esa lógica desde este incremento.

Este incremento edita únicamente paisajismo, su adaptador, recursos nuevos, pruebas de raíces/materiales y procedencia. El chat de diagnóstico es propietario de cámaras, Architecture, EnvironmentBoundary, sombras, backdrop y acabados de mobiliario; sus cambios no se atribuyen aquí.

No hay aprobación artística automática, benchmark comparativo de FPS, prueba de teléfono físico ni cambios comerciales. La aceptación visual requiere inspección de las capturas integradas y decisión humana.
