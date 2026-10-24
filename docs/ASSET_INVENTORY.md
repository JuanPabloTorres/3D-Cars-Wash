# G0/G1 — Inventario y procedencia

## Inventario vigente — revisión visual 23-10-2026

Esta sección sustituye las afirmaciones históricas de un único carro y ausencia de herramientas en las secciones siguientes. Reporte actual: [VISUAL_REVISION.md](VISUAL_REVISION.md). Licencias y URLs exactas: [ASSET_LICENSES.txt](../public/ASSET_LICENSES.txt).

| Recurso activo | Origen / licencia / precio | Adaptación y revisión |
|---|---|---|
| vehicle-car.glb | Innerscene, Red four-door sedan / CC0 / gratuito | Carro regular, 4 ruedas originales, carrocería y ventana separadas |
| vehicle-pickup.glb | Innerscene, Crew-cab pickup with tonneau cover / CC0 / gratuito | Pickup, 4 ruedas, largo ≈5.69 m |
| vehicle-suv.glb | Innerscene, Generic compact SUV / CC0 / gratuito | SUV, 4 ruedas, largo ≈4.49 m |
| vehicle-truck.glb | Innerscene, 7.5 t class box truck with roll-up door / CC0 / gratuito | Camión, 6 ruedas; cola con separación de 7.4 m; visualización limitada al gálibo del establecimiento |
| tropicalPalm.glb / areca.glb | Innerscene, Palm detailed / Potted areca palm / CC0 / gratuito | Vegetación profesional agrupada; WebP 1K e instancias |
| vacuum.glb / vacuumNozzle.glb | Innerscene, Workshop Vac wet/dry vacuum / CC0 / gratuito | Equipo y boquilla originales, derivados separados |
| sprayer.glb / sprayWand.glb | Innerscene, Spray Pump pressure sprayer / CC0 / gratuito | Tanque de pulverización y lanza; no hidrolavadora industrial |
| sander.glb | Innerscene, Orbit Sand orbital sander / CC0 / gratuito | Herramienta orbital ilustrativa; agarre/contacto requieren acabado |
| worker.glb | Blender Studio, Snow / CC BY 4.0 / gratuito | Conversión de B-Bones a segmentos glTF, máscaras de autor y materiales portátiles; siete clips |
| receptionist.glb | Blender Studio, Rain / CC BY 4.0 / gratuito | Conservada, seis clips: reposo, saludo, explicación, servicio y señalamiento hacia catálogo/terminal; misma licencia |
| texturas/services/*.webp | OpenAI Image Generation, creadas para este proyecto | Ilustraciones identificadas como tales; no fotos del local ni evidencia del navegador |

Recepción de cuatro objetos: el GLB conserva `PointOrder` como recurso histórico,
pero el runtime ya no lo selecciona porque se retiró la terminal de órdenes.
Servicios conserva `PointServices`; vehículo, revisión e información usan la
explicación breve `Talk` y regresan a `Idle`. Esto no modifica órdenes ni sus estados.

Originales nuevos externos: `C:\Projects\Assets\Febles-Visual-Revision-20261023\innerscene`. Los originales no se sobrescriben. Pipelines vigentes: `prepare-innerscene-vehicles.py`, `pack-revision-props.mjs`, `export-staff.py`, `optimize-staff.mjs worker`. El empaquetado anterior de Car Concept no debe sobrescribir los cuatro nuevos vehículos.

Descartados: familia Rgsdev, por simplicidad visual; Car Concept, retirado de la escena activa (archivo/licencia históricos conservados). Date palm es candidato descargado, no instanciado. No se compraron recursos. El resto de este documento registra fases previas; su aceptación no implica aceptación del arte actual.

## Inventario histórico de G0/G1

El directorio activo no contenía assets al comenzar. Cada fuente indicada se
descargó nuevamente; no se recuperaron escenas, personajes o vehículos del sistema
eliminado. Originales externos: `C:\Projects\Assets\Febles-G1-20261023`.

| Recurso suministrado | Autor / fuente | Licencia / precio | Decisión |
|---|---|---|---|
| Rain v3.3, .blend + texturas | Blender Studio / Blender Foundation | CC BY 4.0 / gratuito | ADAPT → receptionist.glb |
| Snow v4.2, .blend + texturas | Blender Studio / Blender Foundation | CC BY 4.0 / gratuito | ADAPT → worker.glb |
| Car Concept, GLB | DGG / Eric Chadwick; original Unity Fan | CC BY 4.0 (muestra adaptada) / gratuito | ADAPT → vehicle.glb |
| Nature Kit, GLB | Kenney | CC0 / gratuito | ADAPT → palm, shrub, plant |
| Garden Hose Wall Mounted 01, glTF/PBR | Kuutti Siitonen / Poly Haven | CC0 / gratuito | ADAPT → hose.glb |
| Tool Cart, glTF/PBR | Savva Zakharov / Poly Haven | CC0 / gratuito | ADAPT → cart.glb |
| Concrete Floor Worn 001 | D. Savva / R. Cilliers / Poly Haven | CC0 / gratuito | REUSABLE, 1K |
| Wood Planks | Amal Kumar / Poly Haven | CC0 / gratuito | REUSABLE, 1K |
| Kiara 6 Afternoon | Greg Zaal / Poly Haven | CC0 / gratuito | REUSABLE, HDRI 1K |
| SUV Luxury, GLB | Kenney Car Kit | CC0 / gratuito | REPLACE: poco detalle para esta evaluación |

Licencias, URLs y modificaciones completas: [ASSET_LICENSES](../public/ASSET_LICENSES.txt).
Inspección mecánica: [asset-inspection.json](asset-inspection.json).
Validación Khronos: [asset-validation.json](asset-validation.json).

## Evaluación técnica y límites artísticos

- Personajes: mallas reales, piel, cabello, ropa, ojos, rig y cuatro clips horneados.
  El rig cinematográfico fue adaptado, no exportado ciegamente. Su deformación se
  revisó en capturas; las manos conservan limitaciones del rig reducido.
- El saludo es un gesto breve de hombro/codo/muñeca con entrada/salida suavizadas,
  seguido de reposo. No es captura de movimiento ni una actuación profesional aprobada.
- Auto: superficies curvas, ruedas, interior y materiales PBR. Se conserva el concepto
  del autor; no representa el SUV de referencia ni un modelo de cliente real.
- La escala usa límites precisos de vértices, no cajas infladas por submallas rotadas.
- Vegetación: low-poly explícita, materiales de verde y corteza adaptados. Adecuada para
  evaluar el recorrido, pero su simplificación visual sigue pendiente de aprobación.
- Equipamiento: carrito real y manguera de pared. No hay máquina de presión licenciada
  ni aspiradora profesional en esta entrega; no se fabricó un sustituto con primitivas.
- Infraestructura nueva: un pabellón y una bahía modular con materiales PBR, tal como
  permite el Master SOW §10. No se afirma que sea arquitectura artística final.
- GLB autosuficientes: imágenes embebidas, sin descargas autenticadas ni decoders remotos.
- Presupuesto visual conservador: luz direccional con sombra 1024, HDRI 1K, sin SSR,
  postprocesado, agua volumétrica, multijugador ni docenas de NPC.

Estado de todos los recursos: **aptitud técnica evaluada; aceptación artística pendiente**.

## Recursos añadidos en refinamiento A–D

| GLB | Autor / origen oficial | Licencia / precio | Adaptación |
|---|---|---|---|
| pottedPlant | James Ray Cock / [Potted Plant 04](https://polyhaven.com/a/potted_plant_04) | CC0 / $0 | Maceta suculenta; PBR 1K, WebP, geometría simplificada |
| fern | Rob Tuytel y Rico Cilliers / [Fern 02](https://polyhaven.com/a/fern_02) | CC0 / $0 | Helecho texturizado con alpha; instancias en jardineras |
| calathea | Rob Tuytel y Rico Cilliers / [Calathea Orbifolia 01](https://polyhaven.com/a/calathea_orbifolia_01) | CC0 / $0 | Plantas de recepción y lounge; PBR 1K |
| islandTree / islandTreeFar | Rob Tuytel y Rico Cilliers / [Island Tree 02](https://polyhaven.com/a/island_tree_02) | CC0 / $0 | LOD cercano 37,378 tri y perímetro 1,413 tri; geometría instanciada |
| bench | Kirill Sannikov / [Painted Wooden Bench](https://polyhaven.com/a/painted_wooden_bench) | CC0 / $0 | Banco real del lounge, GLB/PBR |
| Manrope | Mikhail Sharanda / Mirko Velimirovic | SIL OFL 1.1 / $0 | HTML variable local y TTF estático peso 550 para Troika |

[Registro oficial descargado](refinement-asset-provenance.json), con autores, formato y licencia. La descarga verificó MD5 de binarios y texturas incluidos. [Licencia Poly Haven](https://polyhaven.com/license): permite uso comercial y redistribución.

Se conservaron Rain/Snow y el auto profesional existente, adaptando animación y materiales. Las palmeras Kenney se reservan para distancia; arbustos/plantas Kenney anteriores ya no representan los jardines cercanos. Se mantiene un único diseño de vehículo con colores diferentes: no se presenta como variedad real de modelos.

La validación actual incluye 14 GLB: cero errores y advertencias conservadas en asset-validation.json (tangentes generadas y jerarquía skinned). Un GLB técnicamente válido no implica aceptación artística.

## Pulido comercial 23-10-2026

Se conservan licencias y autores de los GLB existentes. Sin nuevas compras ni modelos de vehículos ficticios.

- `vehicle.glb`: reempaquetado desde Car Concept, conservando WheelFrontL/R y WheelRearL/R. Carrocería agrupada aparte; 40 primitivas, cuatro conjuntos de ruedas. Los pivotes se centran por bounds en el consumidor.
- `worker.glb`: mismo Snow licenciado; nuevos clips derivados ServiceInterior, ServiceLights y ServiceInspect, además de los cuatro clips anteriores. Rig y texturas portátiles conservados.
- `islandTree.glb`: 74,126 triángulos; `islandTreeFar.glb`: 7,899. Nueva reducción por material, mayor conservación de hojas, alpha MASK y color coherente. Instancias deterministas. La familia de palmeras geométricas anterior sale del perímetro activo.
- `public/textures/services/*.webp`: renders de navegador del Car Concept profesional, con vistas exterior, interior y focos. Interior es un corte ilustrativo por capas de cámara; no representa una puerta abierta en la escena operativa. Misma atribución CC BY del modelo original. Capturados con `scripts/capture-service-previews.mjs`, no generados con IA.

Los cuatro tipos del formulario son tipos de negocio, no evidencia de cuatro modelos existentes. Pickup, truck y SUV permanecen pendientes de recursos aptos y revisión dimensional. No se afirma que el carro disponible represente esas categorías.

Reempaquetado canónico del carro: `pack-vehicle-wheels.mjs`, luego `batch-vehicle-body.mjs`. No ejecutar el antiguo finalize-assets para sobrescribir la adaptación de ruedas. La galería real valida apariencia y movimiento después del empaquetado.


## Estado activo — entrada, vegetación y lounge (23-10-2026, cierre en validación)

Esta sección sustituye las decisiones visuales anteriores para el paisajismo activo. Vehículos Innerscene y personajes Blender Studio conservan sus contratos y licencias.

| Archivo activo | Fuente / autor | Licencia | Adaptación y límite |
|---|---|---|---|
| coherentOak.glb | [Oak street tree detailed leaves](https://www.innerscene.com/tools/library/3d-parts/oak-street-tree-detailed-leaves-a273fef9), Innerscene | CC0 / gratuito | 213372 triángulos y 9450 hojas conservados; ramas fusionadas por4materiales; colores60/30/10 solamente en este modelo sin textura. Corteza lisa e interpretación arquitectónica; no equivalencia fotográfica |
| coherentShrub.glb | [Shrub01](https://polyhaven.com/a/shrub_01), Rico Cilliers | CC0 / gratuito | 30905 triángulos; WebP1K con alfa oficial reparado; conserva pequeñas flores blancas, no es un seto podado |
| coherentCalathea.glb | [Calathea Orbifolia01](https://polyhaven.com/a/calathea_orbifolia_01), Rob Tuytel / Rico Cilliers | CC0 / gratuito | Una variante completa3749triángulos; UV, normales y rugosidad conservados; canal alfa oficial restaurado |
| urbanFern.glb | [Fern02](https://polyhaven.com/a/fern_02), Rob Tuytel / Rico Cilliers | CC0 / gratuito | Una variante completa2365triángulos; evita escalar una fila de variantes como una planta |
| site-background.png | Imagen suministrada por el usuario | Permiso para este proyecto; no se atribuye CC0 | Restaurada como entorno continuo; cuatro sectores reflejados y cielo fundido; no es una fotografía360° ni una sustitución del establecimiento3D |

Fuentes sin modificar fuera del repositorio; hashes y revisión de canal alfa en [auditoría](evidence/vegetation-coherence/REPORT.md). [Términos Innerscene](https://www.innerscene.com/tools/library/terms), [licencia Poly Haven](https://polyhaven.com/license). No hubo compras.

Se retiran de la escena activa islandTree/canopyTree, urbanTree/urbanTreeFar y urbanShrub/urbanCalathea sin alfa. Se conservan como historial; Jacaranda fue descartada por copa abierta. La validación glTF anterior no detectó la pérdida de alfa: esa afirmación queda rectificada. Los nuevos archivos coherent* tienen validación0errores y verificación adicional de textura; 2avisos de tangentes entre Shrub/Calathea. Aceptación artística humana pendiente.

El suelo de jardineras y sus plantas ahora comparten siteLandscape. El mobiliario modular del lounge usa marcos oscuros, cojines claros y mesa de listones, según el SOW autorizado; no sustituye personas/vehículos/vegetación por primitivas.

## Incremento posterior: vegetación natural (23-10-2026)

La selección actual de árboles, arbustos, calatheas y helechos está centralizada en `vegetationModels` (`src/world/siteLandscape.ts`). Se conserva el historial anterior.

| Recurso nuevo | Fuente y licencia | Contrato comprobado |
|---|---|---|
| `naturalTree.glb` | [Tree Small 02](https://polyhaven.com/a/tree_small_02), Rico Cilliers, CC0 | 206616 triángulos; geometría existente preservada con corteza/hojas PBR y UV originales. Máscara alfa oficial reparada: 482156 píxeles transparentes, 566420 visibles al umbral registrado. glTF sin errores. Sustituye el árbol activo de colores planos. |
| `naturalTreeDense.glb` | Misma fuente Tree Small 02, CC0 | Sólo dos árboles cercanos; 472062 triángulos, UV conservadas con mayor rigor desde el original. 18358996 bytes; 0 errores glTF y 3 avisos de tangentes generadas en runtime. Los tres árboles del fondo conservan la versión ligera. |
| `naturalFern.glb` | [Fern 02](https://polyhaven.com/a/fern_02), Rob Tuytel / Rico Cilliers, CC0 | 2365 triángulos; mismo helecho individual con alfa oficial restaurado. El archivo anterior declaraba MASK pero su textura no tenía alfa. glTF sin errores. |
| `textures/landscape/soil-*.jpg` | [Brown Mud](https://polyhaven.com/a/brown_mud), Rob Tuytel, CC0 | Tres mapas 1K, diffuse/normal GL/roughness. Escala física 1.3 m; MD5 oficial y SHA256 guardados. |

`coherentShrub` y `coherentCalathea` conservan sus recursos y texturas reales, con grupos escalonados y variaciones moderadas de tamaño/giro. No se aplican los tres tintes fuertes a toda la planta. El anclaje nuevo utiliza los vértices inferiores reales, conservando la cota común de tierra y los límites de circulación. Las texturas cacheadas no se modifican ni se destruyen al desmontar instancias.

Fuentes y candidatos separados: `C:/Projects/Assets/CarWash-Natural-Landscape-20261023`. Originales preservados. Procedencia y verificación en [candidate-manifest.json](evidence/natural-landscape/candidate-manifest.json); resultado visual y límites en [informe](evidence/natural-landscape/README.md). La validez técnica de GLB no equivale a aceptación artística.
