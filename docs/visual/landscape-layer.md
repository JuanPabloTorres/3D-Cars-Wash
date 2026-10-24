# Capa 02 · vegetación nueva

Acceso: `http://127.0.0.1:4173/?layer=landscape`. La capa `ground` conserva el terreno vacío. El sistema comercial sigue en su ruta original.

## Referencia y alcance

La imagen de fondo aportada contiene árboles de hoja pequeña con copas irregulares, troncos marrón grisáceo, palmas de frondas arqueadas y arbustos densos. Predominan verdes oliva, interiores oscuros y puntas amarillo verdosas. Las cinco imágenes conceptuales añaden grupos de hoja ancha entre los arbustos. No permiten identificar especies con certeza: se reproduce su morfología, no una identificación botánica certificada.

Entrada y lounge usan vegetación para enmarcar; recepción mantiene despejados rostro y atención; las bahías conservan visibilidad. En esta fase esos espacios siguen vacíos. Se respetan las seis jardineras existentes, sus alturas, suelo, circulación, aceras y deck. No se recuperan los dos círculos de tierra retirados.

La última instrucción prevalece: **no hay edificios 3D detrás del local ni árboles 3D fuera del perímetro**. Se retiraron los cinco árboles exteriores. El entorno urbano lo representa exclusivamente `site-background.png`, conservando su relación 1672:941 mediante recorte proporcional de fondo, sin un plano/cartel dentro del mundo. Ese archivo no es una imagen 4K ni un panorama de 360°; no se inventa resolución adicional. Las vistas elevadas conservan un plano neutral de inspección fuera del lote.

## Recursos creados

Todos los siguientes recursos son geometría y texturas nuevas, creadas mediante Blender 5.2 en un proceso aislado. No importan modelos, materiales ni archivos Blender anteriores.

| Recurso | Uso | Material |
|---|---|---|
| `warmShadeTree.glb` | Copas anchas de perímetro y lounge | Corteza con surcos y relieve; cuatro tonos de hoja |
| `warmPalm.glb` | Acentos verticales posteriores | Tronco rugoso y frondas con folíolos curvados |
| `warmShrub.glb` | Base compacta de jardineras | Hojas pequeñas, verdes medios y oscuros |
| `warmBroadleaf.glb` | Acentos entre arbustos | Hojas amplias curvadas con nervaduras |
| `warmGroundcover.glb` | Cobertura baja | Hojas pequeñas próximas al sustrato |

Activos: `public/models/layer02/`. Generador reproducible: `scripts/create-layer02-botany.py`. Fuente editable y texturas originales: `C:/Projects/Assets/CarWash-Layer02-NewBotany-20261024/new-tropical-botany.blend` y archivos contiguos. Los objetos de esa fuente se conservan ocultos individualmente tras exportar; pueden revelarse en Blender. El generador no modifica una sesión de Blender abierta ni copia automáticamente candidatos al producto.

Hojas: color horneado en texturas, nervaduras y normales tangentes, rugosidad 0.74, metalicidad cero. La silueta es geometría: no necesita recorte alfa. Corteza: textura propia con fisuras y mapa normal, rugosidad 0.98. El relleno emisivo de hojas es mínimo (0.025); no sustituye la luz ni pinta toda la copa de un color. Se comparten las mismas especies y materiales entre planos cercanos y distantes.

## Comprobaciones

### Luminarias interiores (24-10-2026)

Los dos postes que estaban en `(-25, -31)` y `(64, -31)` se retiraron del
componente de fondo. Ahora pertenecen a `LightingLandscapeLayer`, con anclajes
en las jardineras de espera `(-19.1, 10.2)` y lateral este `(56.3, 5.2)`.
Su altura es aproximadamente 4.4 m sobre el sustrato y los brazos curvos miran
hacia el interior. Se conservan despejadas las superficies de paso.

Las seis balizas tienen un cuerpo cilíndrico de aluminio grafito, tapa estrecha
y remate redondeado. Su altura es 1.31 m sobre el sustrato. El difusor envolvente
mide 0.34 m de alto (antes 0.15 m). `WarmDiffuser` separa la apariencia luminosa
de la iluminación del entorno: un shader mezcla bordes cálidos `#e8b267` con
centro crema `#fff1ce`, sin tone mapping local. Un halo aditivo tenue, acotado
y orientado hacia la cámara conserva depth testing y no escribe profundidad.
Cada baliza tiene una luz puntual `#ffd19a`, intensidad 7, alcance 2.2 m,
decaimiento físico y sin mapa de sombras. Ilumina hojas y sustrato cercanos;
los postes no añaden focos diurnos ni sombras dinámicas adicionales. No hay bloom
global. Fondo, paleta vegetal y suelo se conservan.

Evidencia: `docs/evidence/landscape-lighting/before` y `after` conservan la primera
versión; `amber-modern` conserva la banda amarilla anterior. `soft-cylinder`
contiene el resultado actual (14 vistas, escritorio y móvil, sin errores de
consola ni recursos fallidos). Compilación y 68 pruebas unitarias superadas.
La prueba de anclajes comprueba apoyo en jardineras retenidas, distancia
a troncos y cabezales orientados hacia el lote.

### Paleta de follaje con el fondo aprobado (24-10-2026)

El usuario aprobó los paneles fotográficos de `public/textures/background-box/`.
El ajuste posterior afecta exclusivamente a las hojas con `finish="landscape"`
en `InstancedVegetation.tsx`; no cambia esos paneles, luces, geometría o distribución.
Muestras de vegetación de los tres fondos (franja vertical 28–56 %, filtro de
matiz 45–130°, verde/azul > 1.4) dan tonos medios oliva entre `#5c5c0f` y
`#67661c`, con amarillos verdosos en las luces. Son colores fotografiados bajo
iluminación, no valores que deban copiarse directamente al albedo de un material PBR.

Se conserva la textura original y se aplica una proporción RGB en espacio lineal
a copias de los materiales: profundidad `#34421d`, medio `#606825`, iluminado
`#909833`, brote `#b0b550`. Se mantienen nervaduras, variación de hojas, normales,
sombras, metalicidad cero y troncos originales. Las pruebas/capturas de esta tarea
están en `docs/evidence/foliage-palette/`; `before` es la base y `verified` el
resultado final. `after` se capturó durante compilación y no demuestra la versión
final; `final` conserva una primera paleta algo más luminosa.

- `tests/unit/landscape-layer.test.ts`: verde real en las texturas exportadas, normales, metalicidad, raíces sobre sustrato y límites de hojas bajas respecto a la tierra.
- `scripts/capture-landscape-layer.mjs`: siete vistas en escritorio y móvil, navegación, consola, carga de recursos y ausencia de vegetación anterior o solicitudes comerciales.
- `scripts/capture-ground-layer.mjs`: regresión de la base vacía, mapas de suelo y navegación.
- `docs/evidence/landscape-layer/new-botany-validation.json`: validación glTF de los cinco recursos finales.
- Capturas finales: `docs/evidence/landscape-layer/final/`. Los directorios `sample`, `sample-02`, `new-botany-sample`, `new-botany-full`, `after` y `after-perimeter` documentan candidatos anteriores, **no el resultado actual**. `new-botany-full` conserva el fallo visual de exportación de mezcla de color; se corrigió horneando explícitamente cada textura verde.
- La comparación de las 14 capturas de `ground-regression` contra la base de aceras dio cero diferencias de píxeles. Se conservó el suelo vacío y sus materiales.

La compilación y las pruebas no prueban igualdad fotográfica con los conceptos. Los recursos son modelos originales basados en las referencias, no escaneos de las plantas que aparecen en ellas. Las vistas elevadas de inspección conservan la cámara del terreno; todavía no incluyen arquitectura o mobiliario del establecimiento.
