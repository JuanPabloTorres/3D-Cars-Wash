# Instrucción para Codex — Implementar el lounge según la imagen adjunta

Utiliza **“Febles Car Wash Lounge UI-5.png”** como referencia de composición, mobiliario, materiales, vegetación, iluminación y panel informativo.

El resultado debe sentirse como **estar sentado dentro de una sala de espera exterior cubierta, mirando hacia recepción y las bahías**.

Este lounge pertenece al mismo establecimiento de la entrada. Reutiliza arquitectura, vegetación, materiales y datos. No construyas otra escena independiente.

Las dimensiones físicas indicadas son medidas de implementación propuestas para conseguir las proporciones de la imagen; no representan medidas obtenidas de un plano.

## 1. Composición general

La referencia mide **1855 × 848 px**, aproximadamente **2.19:1**. Realiza primero la comparación con esa proporción.

La pantalla se divide visualmente en dos áreas:

- **Izquierda y centro, aproximadamente 69 %:** escena del establecimiento observada desde el lounge.
- **Derecha, aproximadamente 30 %:** panel «Tu espera».

La escena debe mostrar tres planos:

| Plano | Elementos |
|---|---|
| Primer plano | Asientos, mesa, maceta, plataforma y columna del lounge |
| Plano medio | Acera, recepción y bahías |
| Fondo | Muro, árboles, edificios discretos y cielo |

No debe parecer una cámara parada en medio del estacionamiento con un banco a un lado.

## 2. Cámara del lounge

### Posición y orientación

Sitúa la cámara dentro del espacio cubierto, junto al conjunto de asientos.

- Altura inicial de prueba: entre **1.15 y 1.35 m** sobre la plataforma.
- Mirada hacia recepción.
- Ligera perspectiva diagonal que permita ver las bahías a la derecha.
- Inclinación contenida, sin mirar excesivamente al suelo.
- Sin rotación lateral del horizonte.

Ajusta estos valores contra la imagen, conservando proporciones humanas.

### Elementos que deben entrar en el encuadre

- Techo de madera ocupando la esquina superior izquierda.
- Columna oscura alrededor del primer cuarto del ancho.
- Sofá visible a la izquierda.
- Mesa baja en la parte inferior central izquierda.
- Asientos recortados intencionalmente en las esquinas inferiores.
- Recepción reconocible al centro.
- Bahías visibles detrás y a la derecha.
- Vegetación detrás del sofá.
- Panel lateral sin cubrir la mesa principal.

### Elementos que no deben ocurrir

- Cámara dentro de un cojín.
- Respaldo tapando recepción.
- Columna sobre el rostro de Ana.
- Techo ocupando la mitad de la pantalla.
- Campo de visión excesivo que deforme los muebles.
- Grandes superficies vacías entre lounge y recepción.

Los recortes de los asientos en primer plano son intencionales: ayudan a transmitir que el visitante está dentro del conjunto de muebles.

## 3. Estructura cubierta

### Techo

El lounge tiene una cubierta plana con:

- Parte inferior revestida de madera.
- Borde exterior rojo.
- Estructura y soportes oscuros.
- Espesor proporcionado.

En esta cámara, la madera del techo aparece como una superficie diagonal desde la parte superior izquierda hacia el centro superior.

Las tablas deben tener:

- Dirección consistente.
- Juntas finas.
- Tono marrón cálido.
- Veta discreta.
- Brillo bajo.

No utilizar una textura de madera agrandada hasta que cada veta parezca una franja.

### Columna principal

La columna cercana será:

- Rectangular.
- Gris carbón.
- Acabado satinado.
- Con volumen y sombra.
- Conectada físicamente al suelo y al techo.

En la referencia ocupa aproximadamente el **25–28 % del ancho**.

Debe enmarcar la vista, separando visualmente el mobiliario de recepción. No debe bloquear el centro de recepción.

## 4. Plataforma de madera

El área de asientos se apoya sobre una plataforma de madera diferenciada de la acera exterior.

### Material

- Tablas marrones cálidas.
- Variaciones moderadas entre piezas.
- Juntas estrechas.
- Acabado exterior mate o satinado.
- Sin apariencia de madera mojada.

### Construcción

La plataforma debe tener espesor y borde visible donde corresponda.

Si existe un desnivel, mantener un acceso coherente y libre. No crear un escalón atravesando la ruta principal sin resolver cómo se entra.

La madera termina donde comienza la superficie peatonal clara. No se extiende bajo las bahías.

### Distribución visual

En esta cámara, la plataforma aparece principalmente:

- Bajo el sofá izquierdo.
- Bajo la mesa.
- Bajo los asientos del primer plano.
- Hasta el límite con la acera.

No sustituirla por asfalto ni por una textura marrón aplicada al terreno completo.

## 5. Conjunto de asientos

Esta imagen utiliza un conjunto de **estructura oscura, laterales de cuerda o listones finos y cojines claros**.

No utilizar el banco de madera sin cojines de la versión actual como resultado final.

### 5.1. Sofá del lado izquierdo

Debe mostrar:

- Capacidad aproximada para dos personas.
- Cojines gruesos de asiento.
- Respaldo acolchado.
- Tapizado beige grisáceo.
- Estructura oscura.
- Brazo lateral visible.
- Cojín decorativo rojo oscuro.

Medidas iniciales orientativas:

| Parte | Medida propuesta |
|---|---|
| Ancho | 1.5–1.7 m |
| Profundidad | 0.75–0.9 m |
| Altura del asiento | 0.42–0.46 m |
| Altura total | 0.75–0.9 m |

No hacer el asiento tan bajo que parezca mobiliario infantil.

### 5.2. Asiento cercano a la derecha

Colocar un sillón del mismo conjunto:

- Estructura oscura.
- Cojín claro.
- Brazo y respaldo con el mismo lenguaje material.
- Orientado hacia la mesa.

En el encuadre aparece parcialmente, en la esquina inferior derecha de la escena, antes del panel.

Debe percibirse como parte del conjunto, no como un objeto abandonado frente a la cámara.

### 5.3. Asiento del primer plano izquierdo

Mostrar parcialmente otro asiento o el extremo del conjunto.

Su presencia debe aportar profundidad sin bloquear la mesa.

No hace falta modelar muebles diferentes para cada posición: reutiliza un módulo de sillón y una variante de sofá.

### 5.4. Cojines

Los cojines deben tener:

- Espesor.
- Bordes suavizados.
- Ligera deformación natural.
- Material textil mate.
- Textura fina.

No utilizar cubos rígidos con esquinas perfectas.

El cojín rojo será un acento. No añadir muchos cojines de diferentes colores.

### 5.5. Laterales

Para representar cuerda o listones finos:

- Mantener una separación regular.
- Evitar geometría innecesariamente densa.
- Conservar la silueta en esta cámara.
- Usar una solución simplificada cuando el detalle no sea visible.

El objetivo es que se perciba un mueble exterior bien terminado, sin exigir miles de piezas independientes.

## 6. Mesa central

### Forma

Mesa baja rectangular:

- Tablero de listones de madera.
- Marco y patas oscuras.
- Sin cristal.
- Sin mantel.
- Sin objetos comerciales encima.

Medidas orientativas:

- Ancho: 1–1.2 m.
- Profundidad: 0.6–0.75 m.
- Alto: 0.35–0.42 m.

### Ubicación

Colocarla entre los asientos, ligeramente hacia el centro del grupo.

En la referencia aparece aproximadamente entre:

- **22–47 % del ancho**.
- **69–91 % de la altura**, parcialmente limitada por la interfaz inferior.

La perspectiva debe permitir ver el tablero y parte de sus patas.

### Relación con los asientos

Mantener una separación aproximada de 35–45 cm entre asiento y mesa.

Ninguna pata debe atravesar la plataforma ni flotar.

No ampliar la mesa hasta que se convierta en el elemento dominante de toda la vista.

## 7. Maceta sobre la mesa

Colocar una sola maceta ornamental.

Características:

- Recipiente bajo y redondeado.
- Color piedra claro.
- Acabado mate.
- Planta verde compacta de hojas pequeñas.
- Altura total moderada.

Medidas iniciales:

- Diámetro de maceta: 20–28 cm.
- Altura total con planta: 30–45 cm.

Ubicarla cerca del centro del tablero, ligeramente desplazada si ayuda al encuadre.

Debe dejar visible recepción. No usar una planta alta, una palmera pequeña ni flores de colores intensos.

## 8. Jardineras detrás del mobiliario

Detrás del sofá izquierdo existe una jardinera alargada que separa la espera del perímetro.

### Construcción

- Hormigón gris claro.
- Borde limpio.
- Altura aproximada de 40–55 cm.
- Espesor visible.
- Material coherente con las jardineras de entrada.

No debe confundirse con el respaldo del sofá.

### Vegetación

Combinar:

1. Arbustos bajos.
2. Plantas de hojas amplias.
3. Árboles situados detrás.

La composición debe tener alturas distintas. Evitar una línea perfectamente uniforme.

Las hojas pueden acercarse al mobiliario, pero no atravesarlo.

## 9. Árboles y fondo vegetal

En esta imagen predominan árboles de copa, no palmeras.

### Árboles próximos

Mostrar a la izquierda:

- Troncos visibles.
- Ramificación.
- Copas que dejan pasar parte del cielo.
- Hojas iluminadas por el sol.

Los árboles deben estar plantados detrás o dentro del área vegetal, sin aparecer sobre la plataforma.

### Vegetación de fondo

Continuar detrás de recepción y bahías con la misma familia visual utilizada en entrada.

No mezclar:

- Árboles fotográficos en un plano.
- Palmeras esquemáticas en otro.
- Arbustos de estilo caricaturesco distinto en primer plano.

La coherencia entre recursos es más importante que la cantidad.

## 10. Acera frente al lounge

Entre plataforma y recepción debe verse una superficie peatonal clara.

Características:

- Hormigón gris claro cálido.
- Juntas discretas.
- Acabado mate.
- Sombras de árboles.
- Sin brillo excesivo.

La acera ocupa buena parte del plano medio.

No dibujar marcas de carril o estacionamiento atravesando esta zona peatonal.

El tope amarillo visible en el sector central derecho debe pertenecer al límite de circulación o estacionamiento, fuera del paso principal.

## 11. Recepción al fondo

Reutilizar la recepción del mismo establecimiento.

Desde el lounge debe verse:

- Cubierta roja.
- Franja oscura.
- Rótulo «RECEPCIÓN».
- Mostrador de madera.
- Fondo oscuro.
- Ana.
- Plantas laterales.

### Escala en pantalla

La recepción ocupa aproximadamente:

- **27–50 % del ancho**.
- **25–57 % de la altura**.

Ana será reconocible, aunque no tendrá el tamaño de la cámara de atención.

No cambiar su modelo, uniforme o escala entre vistas.

No ocultar recepción detrás de una planta para compensar problemas de composición.

## 12. Bahías al fondo

Mostrar parte de las bahías a la derecha:

- Cubiertas alineadas.
- Columnas oscuras.
- Identificadores.
- Equipos en sus soportes.
- Vehículos según ocupación autorizada.

La vista del lounge debe transmitir que el establecimiento continúa trabajando.

La actividad aparecerá únicamente cuando existan órdenes o un escenario DEMO explícito.

Las bahías, sus estados y los vehículos deben ser exactamente los mismos que se observan desde entrada y desde sus cámaras cercanas.

## 13. Fondo urbano y cielo

### Fondo

Detrás del muro y los árboles:

- Edificaciones neutras.
- Pocas ventanas y detalles a esta distancia.
- Algún elemento urbano discreto, como luminarias exteriores.
- Sin publicidad inventada.

### Cielo

- Azul luminoso.
- Nubes blancas suaves.
- Sin horizonte costero.
- Sin montaña dominante.
- Sin borde visible de una imagen rectangular.

La continuidad del fondo debe mantenerse durante el traslado hacia recepción y bahías.

## 14. Iluminación

La imagen muestra un día luminoso, con el lounge protegido por la cubierta.

Reproducir:

- Exterior soleado.
- Sombra suave bajo el techo.
- Madera cálida.
- Cojines claros con detalle.
- Sombras de hojas sobre acera y plataforma.

Los asientos bajo techo deben conservar volumen y textura. No deben quedar completamente negros.

La maceta de la mesa debe proyectar una sombra de contacto sobre el tablero.

No usar una luz frontal intensa que elimine todas las sombras del mobiliario.

---

## 15. Panel «Tu espera»

El panel se implementará en HTML/CSS sobre la escena.

### Posición y tamaño

En la referencia:

- Comienza aproximadamente en el **69 % del ancho**.
- Termina cerca del borde derecho.
- Se ubica debajo de cuenta y ayuda.
- Su base queda por encima de la navegación inferior.

Para el viewport de referencia:

- Ancho aproximado: 555 px.
- Margen derecho: 16–24 px.
- Margen superior: alrededor de 84 px.
- Padding interior: 28–32 px.
- Radio: 20–24 px.

En resoluciones menores, utilizar límites adaptables. No conservar un ancho fijo que provoque desbordamiento.

### Apariencia

- Fondo Dark Blue `#11212D`.
- Superficies internas ligeramente más claras.
- Borde fino.
- Sombra suave.
- Texto principal claro.
- Separadores discretos.
- Sin transparencia que dificulte leer.

Incorporar un botón de cierre arriba a la derecha. La imagen no lo presenta claramente, pero es necesario para recuperar la escena.

## 16. Encabezado y mensaje según el estado

### Etiqueta superior

En DEMO:

**OPERACIÓN ILUSTRATIVA · DEMO**

En operación real, utilizar una etiqueta apropiada al estado de conexión. No mantener DEMO si no corresponde.

### Título

**Tu espera**

### Corrección obligatoria del mensaje

La imagen contiene una contradicción: dice que el negocio cuida el auto mientras informa que no existe orden activa.

Implementar variantes.

**Sin orden activa:**

> Conoce el local y prepara tu visita.

**Con orden en espera o atención:**

> Consulta cómo va el cuidado de tu vehículo.

**Con vehículo listo:**

> Tu vehículo está listo. Revisa los siguientes pasos.

No mostrar mensajes de atención sin una orden confirmada que los respalde.

## 17. Tarjeta principal sin orden

La primera tarjeta tendrá:

- Icono de automóvil dentro de un círculo.
- Título.
- Descripción breve.
- Botón principal ancho.

Contenido:

**Aún no tienes una orden activa.**

Prepara tu solicitud con recepción para consultar su estado aquí.

Botón:

**Preparar mi orden →**

### Distribución

- Icono a la izquierda.
- Texto a la derecha.
- Botón debajo ocupando el ancho útil.
- Separación de 16–20 px entre contenido y botón.

El botón debe continuar el flujo existente. Si hay un borrador, recuperarlo conforme a las reglas del sistema.

No crear una orden vacía al seleccionar esta acción.

## 18. Tarjeta principal con orden activa

Reemplazar la tarjeta vacía por información real:

- Vehículo.
- Estado.
- Tarea actual.
- Bahía, cuando exista.
- Posición en fila, cuando esté disponible.
- Acción «Ver mi orden».

No utilizar un porcentaje de progreso calculado únicamente por tiempo transcurrido.

Si la información está reconectando:

> Actualizando el estado de tu orden…

Mantener el último estado claramente identificado cuando corresponda.

## 19. Tres tarjetas de contenido

Debajo de la tarjeta principal, mostrar tres tarjetas iguales en escritorio.

### A. Servicios y cuidados

- Imagen representativa.
- Icono de cuidado.
- Título «Servicios y cuidados».
- Flecha de apertura.

Abre información ampliada de los servicios y recomendaciones autorizadas.

No añade servicios a una orden confirmada sin pasar por la operación correspondiente.

### B. Ofertas vigentes

- Imagen o fondo discreto.
- Icono de promoción.
- Título «Ofertas vigentes».

Cuando no haya promociones:

> Sin ofertas publicadas.

La tarjeta puede abrir un estado vacío informativo, pero no aparentará una oferta disponible.

Cuando existan, mostrar promociones administradas, con sus condiciones y vigencia.

### C. Información del local

- Imagen del establecimiento o recurso representativo autorizado.
- Icono de ubicación.
- Título «Información del local».

Abre horarios, contacto y otros datos configurados.

No inventar teléfonos, direcciones ni enlaces.

### Estilo común

- Mismo ancho.
- Mismo alto.
- Imagen superior de igual proporción.
- Radio de 14–16 px.
- Padding de 14–16 px.
- Título legible.
- Flecha alineada.
- Foco de teclado visible.

No usar textos excesivamente pequeños para hacer caber las tres tarjetas.

## 20. Acciones inferiores

Después de un separador, colocar dos botones secundarios:

- **Ir a recepción →**
- **Ver mi vehículo →**

Ambos tendrán igual altura y ocuparán la fila disponible.

### Sin vehículo confirmado

«Ver mi vehículo» debe explicar el estado y ofrecer seleccionar o registrar uno. No trasladar a un automóvil ajeno.

### Con vehículo confirmado

Trasladar a su ubicación o mostrar la información correspondiente.

Mantener un solo panel principal abierto.

## 21. Navegación y cuenta

Reutilizar los componentes generales.

Arriba:

- Marca.
- Estado DEMO cuando aplique.
- Mi cuenta.
- Ayuda.

Abajo:

- Recepción.
- Mi orden.
- Mi vehículo.
- El local.

**Corregir la referencia: en lounge el destino activo es «El local», no «Recepción».**

La barra no debe cambiar de apariencia al entrar al lounge.

## 22. Interacciones y movimiento

### Llegada al lounge

1. Cerrar el panel anterior.
2. Trasladar suavemente la cámara.
3. Evitar atravesar columnas y muebles.
4. Detenerla en el encuadre definido.
5. Abrir «Tu espera» con el estado vigente.

### Apertura de contenido

Seleccionar una tarjeta cambia el contenido del panel o abre una vista interna con «Volver al lounge».

No apilar ventanas sobre ventanas.

### Animación ambiental

Permitida:

- Movimiento leve de hojas.
- Operación visible de las bahías.
- Cambios discretos de estado.

Evitar:

- Muebles moviéndose.
- Maceta girando.
- Iconos pulsando continuamente.
- Cámara oscilando.
- Promociones que cambian mientras se están leyendo.

---

## 23. Adaptación móvil

Mantener la sensación de estar dentro del lounge.

### Escena

Mostrar al menos:

- Parte del sofá.
- Mesa o maceta.
- Recepción al fondo.

No intentar encajar todos los muebles del escritorio en el ancho móvil.

### Panel

Usar un panel inferior:

- Altura inicial aproximada del 55–60 % del viewport.
- Contenido desplazable.
- Botón de cierre.
- Respeto al área segura.
- Posibilidad de ampliar cuando el contenido lo requiera.

Las tres tarjetas pasarán a una lista vertical o distribución que conserve su lectura. No reducirlas a tres columnas de texto diminuto.

La navegación inferior debe permanecer accesible sin tapar las acciones del panel.

## 24. Construcción eficiente

Reutilizar:

- Un módulo de sillón.
- Una variante de sofá.
- Un material textil claro.
- Un material textil rojo.
- Un material de estructura oscura.
- Un material de madera.
- Una jardinera modular.
- Las familias vegetales ya seleccionadas para entrada.

Modelar con mayor detalle los muebles cercanos a cámara. Reducir detalle en edificios y elementos de fondo.

No utilizar la imagen completa como fondo para fingir el lounge: plataforma, mobiliario y columnas necesitan volumen y perspectiva real.

## 25. Orden de implementación y aceptación

Implementar en este orden:

1. Plataforma y estructura.
2. Sofá, sillones y mesa con proporciones correctas.
3. Cámara.
4. Materiales.
5. Jardineras y vegetación.
6. Continuidad con recepción y bahías.
7. Iluminación.
8. Panel y estados.
9. Móvil.
10. Comparación final.

Entregar una captura con el mismo formato de la referencia y comprobar:

- Se percibe una sala de espera cubierta.
- El mobiliario coincide en silueta y materiales.
- La plataforma es de madera.
- La mesa y maceta están correctamente apoyadas.
- Recepción se reconoce al fondo.
- El panel conserva la jerarquía descrita.
- El mensaje coincide con la existencia de una orden.
- «El local» está seleccionado.
- No existen intersecciones ni cortes del fondo.
- Las acciones consultan y ejecutan funciones reales.

**No dar este lounge por terminado con un banco, una mesa genérica y un panel: deben coincidir el encuadre interior, el conjunto de muebles, la plataforma, la vegetación y la relación visual con el establecimiento.**