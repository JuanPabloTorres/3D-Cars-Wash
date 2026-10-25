# De una referencia a una escena utilizable

## Descomponer antes de modelar

Ver la imagen original y la captura actual, no solo sus nombres. Identificar:

| Aspecto | Qué registrar | Qué verificar en el mundo |
| --- | --- | --- |
| Composición | Sujeto principal, horizonte, líneas de fuga, proporción visible de suelo/cielo | Cámara, FOV y escala relativa sin estirar geometría |
| Suelo | Asfalto, acera, bordillo, tierra, madera; juntas y pintura por función | Alturas y contacto, continuidad, UV en metros y ausencia de z-fighting |
| Arquitectura | Silueta, grosor, soportes, aleros y huecos | Estructura físicamente conectada; no lámparas colgando de una varilla sin base |
| Vegetación | Tipo de hoja, densidad, alturas, verdes de luz y sombra | Tallos anclados, tierra visible, macetas huecas y copas contenidas |
| Iluminación | Dirección, temperatura, contraste y sombras | Hojas legibles bajo techo, emisores perceptibles sin saturación |
| Fondo | Proporción, horizonte, familia vegetal y escala lejana | Cobertura durante navegación, sin estirar ni competir con primer plano |
| Interfaz | Jerarquía, espacio reservado, acciones y estado | Foco, legibilidad, móvil y ausencia de superposiciones |

Expresar coordenadas de pantalla como proporciones para comparar distintas resoluciones. Inferir metros a partir de referencias de escala y marcar esas dimensiones como estimaciones hasta contrastar geometría. No reproducir tipografía de una maqueta como textura cuando necesita contenido dinámico.

## Orden de corrección

1. Cámara y encuadre: sujeto legible y camino hacia la siguiente acción.
2. Volúmenes y disposición: proporciones, circulación y espacios libres.
3. Superficies: tamaño del grano, dirección de veta, juntas y bordes.
4. Luz: exposición, ambiente, sombras y emisores.
5. Props: detalles constructivos, contacto, iconos y señalización.
6. Interacción y estados: área clicable, hover/foco, modales y transiciones.

No ocultar una mala geometría con saturación, niebla, bloom o grandes tarjetas. Conservar una muestra antes/después bajo la misma cámara, exposición y estado; fijar animaciones WebGL explícitamente si se necesita comparación determinista.

## Material por objeto

- **Asfalto:** variación fina de árido y roughness alta; evitar cuadrícula de losas. Las marcas siguen circulación y límites, no cruzan jardineras ni aceras. Poco relieve: un normal enorme hace parecer grava al asfalto.
- **Acera/concreto:** juntas a escala, bordillo con espesor y transiciones suavizadas donde corresponde; no convertir todo el solar en módulos cuadrados repetidos.
- **Madera:** veta longitudinal, contraste moderado y roughness según acabado. Los listones pueden variar offset; no estirar una textura para cubrir cada objeto completo.
- **Tierra:** plano bajo el borde de la maceta, variación de terrones y detalle con coste acotado. Raíces/tallos nacen en ese plano y no en el origen de la malla sin comprobar su bounding box.
- **Cerámica:** espesor, labio y pared interior; material mate o vidriado coherente. Reutilizar geometría parametrizada por altura/radio y la misma regla de anclaje vegetal.
- **Hojas:** no metálicas; revisar recorte alpha, normales y doble cara según el recurso. Usar variación de mapa y verdes interiores, medios y acentos. No multiplicar un mapa ya verde por un verde muy saturado para corregir falta de luz.
- **Metal y tela:** reflejo y normal distintos. Un tono similar no justifica compartir un material entre materiales físicos diferentes.

Color/albedo se interpreta en sRGB; normal, roughness y metalness son datos lineales. Verificar convención normal GL/DX, canales ORM cuando estén empaquetados, repetición, filtrado y unidades. No reutilizar automáticamente un sampler de suelo para madera vertical o tela.

## Vegetación y fondo

Analizar primero el fondo real utilizado: verdes oliva o amarillentos en sol, sombras más profundas, tamaño de hoja y familia de árboles. La paleta se obtiene de regiones vegetales representativas, evitando cielo, suelo y reflejos; registrar que los colores de captura están afectados por exposición y tone mapping.

Preparar un árbol y una jardinera bajo la luz real. Combinar masas bajas, plantas ornamentales y copas, con alturas y rotaciones moderadas. Un reparto de 60/30/10 entre medio/oscuro/acento puede servir de punto de partida, no de regla fija. Sustituir un modelo de silueta incompatible; no intentar arreglarlo solo con color.

Comprobar contacto y límites desde entrada, recepción y lounge: hojas fuera de macetas, tallos flotantes, intersecciones con mostradores o asientos, caras negras y repetición evidente. Mantener rostro, letreros y circulaciones despejados.

Una fotografía rectangular no es un panorama. Para fondos en planos laterales y central, mantener proporción mediante recorte y solapes controlados; comprobar esquinas, cielo y cobertura de todas las cámaras permitidas. No añadir edificios 3D si el contrato asigna el entorno al fondo fotográfico. Mantenerlo algo menos contrastado que los objetos cercanos.

## Lámparas encendidas

Separar carcasa, montaje, difusor, núcleo luminoso e iluminación del entorno. Un plástico amarillo no comunica emisión: usar centro claro cálido, caída suave y luz sobre superficies próximas. Compartir el difusor entre jardín y techo si cumplen el mismo lenguaje, variando escala y montaje. Verificar al sol y bajo techo; evitar saturación plana, halo atravesando objetos y luces puntuales costosas sin contribución visible.

## Blender y recursos

Antes de ejecutar un script de exportación, inspeccionar destinos, origen, escala, ejes, materiales y variantes. Usar archivos candidatos con nombres separados; preservar fuente y licencia. El live Blender puede contener trabajo ajeno: inspeccionar primero, no reiniciar su escena por defecto.

Validar glTF, normales, textura, alpha, pivotes, bounds, coste y anclajes; luego revisar en el renderer real. Una captura de Blender no prueba el aspecto bajo Three.js. Medir draw calls/memoria/tiempo cuando el cambio lo requiera. Instanciar repeticiones conservando variación y sin perder picking.

## Cámara, DOM y acción

Los presets de cámara pertenecen al plan de cada área, no a botones individuales. Una transición parte de la posición renderizada, interpola orientación sin giros largos, mantiene horizonte y termina en el destino más reciente. No desplazar la cámara al abrir un modal salvo que exista una razón del flujo. Repetir destino o cambiar viewport no reinicia el recorrido.

Los props informativos pueden ser clicables, con señal de interacción discreta y equivalente de teclado. Ocultar o desactivar los overlays del mundo al abrir modales; z-index por sí solo no evita interceptar clics o foco. Usar iconos con significado, estado textual y movimiento reducido. Probar regreso, cierre, clic durante transición y ancho intermedio además de desktop/móvil.
