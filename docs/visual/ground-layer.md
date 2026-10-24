# Capa 01 — terreno y materiales

Acceso: http://127.0.0.1:4173/?layer=ground

La escena completa permanece conservada. Esta capa no carga GLB ni monta el
proveedor comercial. Permite estudiar el suelo y el inicio espacial del flujo.
Seleccionar una etapa encuadra su zona y explica su responsabilidad; no crea
órdenes, confirma llegadas, cobra ni entrega vehículos.

| Zona | Responsabilidad | Superficie |
|---|---|---|
| Recepción | Servicios, vehículo, preparación y llegada | Concreto claro |
| Espera peatonal | Seguimiento del turno | Madera cálida |
| Cola de vehículos | Tres posiciones de espera | Asfalto y pintura amarilla |
| Bahías | Etapas del servicio | Huellas de concreto; sin edificios |
| Entrega | Inspección, pago y retiro autorizados | Huella de concreto |
| Jardineras | Separación de recorridos, futura sombra y orientación | Tierra con terrones y bordes claros |

Los centros de bahías y cola proceden de `domain/sitePlan.ts`. Se ajustó la huella
de recepción a su transformación real (z local -2.2 + padre 3.2 = 1), se prolongó
la acera hasta la calle y se extendió el borde posterior a -29 para contener la
jardinera trasera. No se cambiaron las rutas operativas del sistema conservado.

Vegetación prevista, todavía no montada: árboles de copa amplia en perímetro y
tras espera; arbustos bajos en bordes peatonales; hojas amplias en accesos. Verdes
60/30/10 medio/profundo/acento. Los modelos se seleccionarán en su propia capa.

Materiales: Asphalt010 y Concrete034 de ambientCG; Brown Mud 03 de Poly Haven;
WoodFloor051 de ambientCG. Color, normales OpenGL y rugosidad de resolución 2K,
UV en metros, color sRGB y datos lineales. Licencias y fuentes en
`public/textures/ground-v2/SOURCES.md`. Rugosidad mínima de .82 para tierra y .65
para madera para evitar que parches húmedos/pulidos dominen el acabado.

El fondo original conserva su proporción mediante `cover`; es visible desde
Entrada. Las vistas de plano y acercamiento usan suelo exterior neutro para no
mostrar una fotografía pegada a la cámara al orbitar. Resolución original
1672×941: no se inventó detalle 4K ni un panorama 360.

Validación: `npm test`, `npm run build`, `node scripts/capture-ground-layer.mjs`.
El script verifica escritorio/móvil, siete vistas, cuatro etapas, selección 3D de
recepción en escritorio, delimitaciones, doce mapas PBR descargados correctamente,
fondo proporcional y ausencia de GLB/API comercial/texturas antiguas. Evidencias
en `docs/evidence/ground-materials/after`; baseline en `before`.

Esta es una capa de construcción revisable, no la aprobación artística del mundo
final ni una validación nueva de todo el flujo comercial conservado.

## Bordes y señalización — 24-10-2026

`GroundShapes.tsx` construye superficies redondeadas en planta, jardineras huecas
con tierra ajustada al borde, una acera continua con encuentros curvos y pintura
plana mediante cintas de geometría. Los contornos rojos cerrados se sustituyen
por marcas cortas de esquina; la cola tiene identificadores y marcas abiertas.
Las líneas amarillas delimitan circulación con transiciones curvas, sin formar
una cuadrícula. Se conservan centros, materiales y rutas comerciales.

La curvatura se introduce dentro de los límites de cada zona. Las superficies
conservan UV en metros. Las bahías siguen reservando área útil rectangular para
vehículos, con esquinas suavizadas visualmente. El cambio es exclusivo de esta
capa; no cambia las jardineras ni las colisiones del sistema completo conservado.

Pruebas ejecutadas: 65/65 unitarias, compilación y captura Playwright de siete
vistas en 1440×900 y 390×844, selección 3D de recepción y controles de navegación.
Capturas de esta iteración: `docs/evidence/ground-curves/before` y `after`.
Para reproducirlas, definir `GROUND_EVIDENCE_DIR=docs/evidence/ground-curves/after`
y ejecutar `node scripts/capture-ground-layer.mjs` con el servidor en 4173.

### Aceras — 24-10-2026

Recorrido de acceso ampliado a 2,90 m, desembarco ensanchado hacia recepción y transiciones curvas de 1,20 m. Plataforma de cemento con juntas de paneles grandes; bordillo de 24 cm y cara elevada respecto al asfalto. El bordillo sobresale 12 mm para evitar caras coincidentes con la plataforma. Se preservan cámaras, fondo, jardineras, centros operativos y la ausencia de carretera exterior.

Validación: build, 65 pruebas Vitest y captura Playwright en 1440×900 y 390×844. Inspección visual de entrada y plano; se corrigió interferencia entre caras detectada en la primera captura. Evidencia final: `docs/evidence/sidewalk-shape/after/`. La referencia guía la geometría de la acera; no implica reproducción idéntica de toda la escena ni aceptación artística.
