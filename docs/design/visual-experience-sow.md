Con base en las capturas reales y las cinco recreaciones, falta definir **la secuencia completa de lo que aparece en pantalla y la composición de cada espacio**, desde la primera llegada hasta la entrega del vehículo.

Esta especificación fija esa secuencia. Los valores de tamaño y posición son decisiones de diseño para implementar; los servicios, precios, horarios y estados deben seguir llegando de la configuración del negocio.

# SOW — Experiencia visual completa de Febles Car Wash 3D

## 1. Reglas de referencia

Implementar sobre el sistema existente, conservando sus funciones correctas.

Utilizar las imágenes conceptuales para materiales, iluminación y aspecto general. Este documento determina la distribución y el comportamiento cuando las imágenes contienen diferencias.

La experiencia debe sentirse como visitar un establecimiento pequeño y organizado:

**Entrada → Recepción → Servicios → Vehículo → Revisión → Orden → Espera o seguimiento → Finalización.**

La navegación permitirá volver a las zonas sin perder la orden ni las selecciones.

No introducir pantallas adicionales, objetos decorativos o nuevas opciones que no estén descritas o justificadas por una función existente.

---

## 2. Qué ve el visitante al abrir el sistema

### 2.1. Carga inicial

Durante la carga inicial, mostrar un fondo Dark Blue con:

- Marca de Febles centrada.
- Indicador de carga discreto debajo.
- Texto: **«Preparando tu visita…»**.

No mostrar porcentajes si no se calculan sobre recursos reales.

La escena debe aparecer cuando estén disponibles como mínimo:

- Arquitectura principal.
- Suelo.
- Cámara de entrada.
- Recepción.
- Vehículos operativos necesarios.
- Materiales esenciales.
- Interfaz principal.

Los recursos secundarios pueden completarse después, sin desplazar objetos ni cambiar bruscamente el encuadre.

Si falla la carga:

> **No pudimos preparar la visita.**  
> Intenta cargar el establecimiento nuevamente.

Acción: **«Reintentar»**.

### 2.2. Primera imagen del establecimiento

Al terminar la carga, mostrar la cámara de entrada. No comenzar dentro de recepción ni detrás de una pared.

La composición será:

| Zona de pantalla | Contenido |
|---|---|
| Tercio izquierdo | Lounge, mobiliario y vegetación |
| Centro | Recepción y Ana reconocibles |
| Mitad derecha | Bahías y vehículos en atención |
| Parte superior | Cielo y fondo urbano |
| Parte inferior | Acceso peatonal y circulación delimitada |

Recepción debe ser el punto principal de atención mediante encuadre, contraste y luz.

No utilizar una flecha gigante flotando sobre Ana.

### 2.3. Primer panel de bienvenida

El primer “modal” será un **panel de bienvenida no bloqueante**, situado abajo a la izquierda. No oscurecer toda la escena.

En escritorio de 1440 × 900:

- Posición izquierda: 24 px.
- Ancho: 380 px.
- Padding: 24 px.
- Separación respecto a navegación inferior: 20 px.
- Alto determinado por el contenido, aproximadamente 210–240 px.

Contenido exacto:

**BIENVENIDO A FEBLES**

# Tu auto, en buenas manos.

Conoce nuestros servicios y prepara tu visita.

Botón principal:

**Ir a recepción →**

No añadir al panel otra lista de menús, un formulario ni una explicación larga.

Al seleccionar el botón:

1. Desactivar temporalmente esa acción para evitar dobles activaciones.
2. Cerrar suavemente el panel.
3. Iniciar traslado de cámara.
4. Mostrar «Yendo a recepción…».
5. Abrir la bienvenida de Ana al llegar.

### 2.4. Si el visitante regresa

Si existe una orden activa recuperada correctamente, sustituir el panel inicial por:

**QUÉ BUENO VERTE DE NUEVO**

**Tu orden está disponible.**

Consulta su estado o acércate a recepción.

Acciones:

- Principal: **«Ver mi orden»**.
- Secundaria: **«Ir a recepción»**.

No mostrar esta variante hasta verificar que la orden realmente existe.

---

## 3. Controles que permanecen visibles

### 3.1. Superior izquierda

Una placa compacta con:

- FEBLES.
- CAR WASH.
- Indicador DEMO cuando corresponda.

No mostrar «conectado» si solamente está funcionando una simulación local sin conexión operativa.

Diferenciar:

- **DEMO**.
- **En línea**, cuando exista conexión verificada.
- **Reconectando**, cuando se haya perdido.

### 3.2. Superior derecha

Dos controles:

1. Icono de persona y texto **«Mi cuenta»**.
2. Icono de ayuda.

Separación: 12 px. Altura: 48 px.

El menú de cuenta abre debajo del botón, alineado a la derecha. No cambia la cámara.

Solo incluir funciones disponibles:

- Mi perfil.
- Mis vehículos.
- Historial.
- Cerrar sesión.

En visitante anónimo, el control presentará el acceso correspondiente. No mostrar nombre o avatar inventado.

### 3.3. Navegación inferior

Barra flotante centrada con cuatro destinos:

| Destino | Icono | Resultado |
|---|---|---|
| Recepción | Mostrador o casa | Traslada a recepción |
| Mi orden | Documento | Abre orden o estado vacío |
| Mi vehículo | Automóvil | Muestra vehículo o selección necesaria |
| El local | Ubicación | Permite explorar bahías, fila y lounge |

Dimensiones de escritorio:

- Ancho: 640 px.
- Alto: 76 px.
- Distancia al borde inferior: 20 px.
- Cuatro espacios iguales.
- Icono arriba y texto debajo.

No añadir otra barra permanente que repita estos destinos.

Durante un traslado, conservar la barra visible y mostrar qué destino se está abriendo.

---

## 4. Cómo se organiza físicamente el establecimiento

La escena debe tener cinco zonas reconocibles:

1. Acceso.
2. Recepción.
3. Lounge.
4. Bahías.
5. Fila y salida.

### 4.1. Recepción

Ubicarla al frente del recorrido peatonal, con fachada abierta hacia el visitante.

Debe ser visualmente más cercana que en la captura actual de entrada. Evitar que Ana parezca una figura minúscula al fondo de una explanada.

### 4.2. Lounge

A la izquierda de recepción, bajo techo, conectado por el mismo recorrido peatonal.

Desde sus asientos debe poder verse parte de recepción y de las bahías.

### 4.3. Bahías

A la derecha de recepción, alineadas bajo la estructura roja y oscura.

Conservar las bahías operativas existentes y su relación con los datos. Las cámaras pueden mostrar dos o tres a la vez, aunque existan más.

No eliminar bahías funcionales solo para parecerse a una imagen.

### 4.4. Fila

Ubicarla en un carril identificable que no atraviese el camino del visitante.

La fila debe tener entrada, posiciones de espera y una conexión comprensible con las bahías.

### 4.5. Salida

El vehículo listo debe poder abandonar la bahía mediante una ruta definida.

No desaparecer instantáneamente en mitad del área de trabajo ni circular indefinidamente.

---

## 5. Suelos, bordillos y delimitaciones

El suelo debe explicar visualmente dónde caminan las personas y dónde circulan los vehículos.

### 5.1. Recorrido peatonal

Material:

- Hormigón gris claro.
- Acabado mate.
- Juntas discretas.
- Textura de escala realista.

No utilizar blanco puro.

Ancho objetivo: 1.5–1.8 m virtuales.

Debe conectar entrada, recepción y lounge sin obstáculos.

### 5.2. Circulación de vehículos

Material:

- Asfalto o pavimento gris oscuro.
- Textura fina.
- Sin patrón repetido evidente.

Señalización:

- Líneas amarillas para separar posiciones.
- Flechas de dirección solo donde ayuden a entender un giro o avance.
- Sin textos gigantes sobre todo el suelo.

### 5.3. Bahías

Material más oscuro y resistente.

Cada bahía tendrá:

- Límites laterales.
- Zona de vehículo.
- Área de trabajo del operario.
- Drenaje coherente.

La humedad aparece dentro de la zona de lavado. No convertir todo el establecimiento en una superficie mojada.

### 5.4. Bordillos

Usar bordillos bajos para separar jardineras y circulación.

Reservar amarillo para elementos de seguridad y delimitación. No pintar todos los bordes de amarillo por decoración.

---

## 6. Paredes, perímetro y fondo

### 6.1. Pared de recepción

Color oscuro uniforme, con textura discreta.

Distribución:

- Marca a la izquierda.
- Zona detrás de Ana despejada.
- Información complementaria a la derecha, si hay espacio.

La marca debe ser legible desde recepción y reconocible desde la entrada.

No repetir FEBLES en cinco puntos del mismo encuadre.

### 6.2. Frente del mostrador

Madera vertical con separación y escala consistentes.

Colocar una sola marca central:

**FEBLES**  
**CAR WASH**

Su posición debe quedar completamente visible desde la cámara de recepción, por encima de la barra inferior.

Eliminar la marca que actualmente queda cortada cerca del suelo.

### 6.3. Paredes de bahías

Pared clara neutra con acento rojo horizontal, coherente con la arquitectura.

Sobre ellas pueden aparecer:

- Carrete de manguera.
- Soportes de equipo.
- Identificación operativa.

No colocar cuadros, carteles o elementos que parezcan accesos sin función.

### 6.4. Muro perimetral

Debe ocultar la unión entre el terreno y el fondo.

Aspecto:

- Gris claro o neutro.
- Altura consistente.
- Acabado sencillo.
- Sin grandes superficies vacías llamativas.

### 6.5. Fondo final

Detrás del muro:

- Árboles de copa.
- Algunas edificaciones comerciales bajas.
- Cielo luminoso.

No incorporar playa, agua, arena ni un horizonte azul horizontal.

El fondo debe funcionar desde las cinco cámaras y durante los traslados, sin revelar cortes o una imagen plana mal orientada.

---

## 7. Vegetación: ubicación y cantidad visual

La vegetación debe delimitar el local y suavizar la arquitectura.

### 7.1. Entrada

Colocar jardineras en los extremos del recorrido.

No colocar una masa vegetal en el centro del acceso.

Las plantas bajas no superarán visualmente la altura del respaldo de un asiento.

### 7.2. Recepción

Desde su cámara deben verse:

- Una composición vegetal principal a la izquierda.
- Un elemento secundario al otro extremo, si no invade el panel.
- Fondo despejado alrededor del rostro de Ana.

No permitir hojas detrás de la cabeza que parezcan salir del personaje.

### 7.3. Lounge

Jardineras detrás o al lado de los asientos.

Separación suficiente para que las hojas no atraviesen respaldos y mesas.

Sobre la mesa, como máximo una planta pequeña que no bloquee la vista.

### 7.4. Perímetro

Árboles separados, con variaciones moderadas.

Evitar la fila actual de palmeras repetidas y superpuestas.

Utilizar como máximo tres familias vegetales predominantes. Las palmeras serán acentos aislados.

### 7.5. Criterio de aceptación

Desde cualquier cámara principal:

- Ninguna planta atraviesa arquitectura.
- Ninguna tapa una etiqueta necesaria.
- Ninguna invade una ruta.
- Ninguna parece suspendida.
- La vegetación conserva escala respecto a vehículos y personas.

---

## 8. Llegada a recepción

### 8.1. Movimiento de cámara

La cámara se desplaza desde entrada hacia el mostrador sin atravesar mobiliario.

Duración orientativa: 1–1.5 segundos.

Al llegar:

- Frenado suave.
- Sin rebote.
- Sin giro adicional inesperado.
- Rostro y mostrador enfocados.
- Panel ubicado a la derecha.

### 8.2. Encuadre

En escritorio:

- Ana ocupa el sector central izquierdo.
- Su rostro queda alrededor de un tercio de la altura.
- Los objetos del mostrador aparecen completos.
- El panel ocupa aproximadamente el último tercio.
- La marca frontal no queda cortada.

La cámara debe mostrar a Ana aproximadamente desde cintura o torso, según la altura del mostrador. No necesita mostrar sus pies.

### 8.3. Saludo

Ana realiza una animación breve con una mano y regresa al reposo.

Mostrar el primer mensaje:

> **¡Bienvenido a Febles Car Wash!**

Luego:

> Soy Ana. Puedo ayudarte a elegir servicios, preparar tu orden y consultar tu vehículo.

No presentar ambos mensajes como un párrafo extenso.

Al finalizar la introducción:

> **¿Qué te gustaría hacer?**

Opciones:

- Ver servicios.
- Preparar mi orden.
- Consultar mi orden.
- Tengo una pregunta.

En visitas posteriores:

> **Qué bueno verte de nuevo. ¿En qué puedo ayudarte?**

No repetir toda la introducción.

---

## 9. Mostrador: objetos exactos y acciones

Eliminar los tres bloques negros actuales.

### 9.1. Catálogo de servicios

Forma:

- Folleto vertical.
- Soporte fino.
- Portada con imagen representativa de un vehículo.
- Texto principal «Servicios».

Acción: abrir catálogo.

No usar el folleto como una pantalla con texto diminuto.

### 9.2. Reloj

Forma:

- Reloj circular.
- Base pequeña.
- Material coherente con el mostrador.
- Placa «Horarios».

Acción: abrir los horarios configurados.

La hora dibujada es decorativa; no representa las horas de apertura.

### 9.3. Información

Forma:

- Flyer vertical más pequeño que el catálogo.
- Icono de información.
- Etiqueta «El local».

Acción: mostrar información autorizada del establecimiento.

### 9.4. Preguntas

Forma:

- Tableta inclinada hacia el visitante.
- Icono de conversación.
- Texto «Preguntas».

Acción: abrir consultas.

### 9.5. Distribución

De izquierda a derecha:

**Servicios → Horarios → El local → Preguntas.**

Mantener despejado el espacio directamente frente a Ana.

Los objetos deben estar apoyados en el mostrador. No flotarán ni girarán continuamente.

---

## 10. Catálogo de servicios

Al seleccionar «Ver servicios», transformar el panel de atención en un panel ampliado. Mantener recepción visible.

### 10.1. Encabezado

**Servicios para tu vehículo**

Descripción:

> Elige tu categoría y selecciona el cuidado que necesitas.

### 10.2. Categorías

Cuatro controles con silueta y nombre:

**Carro · Pickup · Truck · SUV**

La categoría seleccionada tendrá borde y fondo diferenciados.

Si existe un vehículo seleccionado, utilizar su categoría y permitir cambiarla mediante una acción explícita.

### 10.3. Tarjetas

Mostrar el catálogo real. Las capturas actuales contienen:

- Lavado exterior.
- Cuidado interior.
- Cuidado de focos.

No crear nuevos servicios por completar espacios.

Cada tarjeta tendrá este orden:

1. Imagen.
2. Nombre.
3. Precio.
4. Descripción breve.
5. «Ver qué incluye».
6. «Añadir».

La imagen ocupará aproximadamente el 40 % superior de la tarjeta.

Usar imágenes que expliquen el servicio:

- Exterior: limpieza de carrocería.
- Interior: aspirado o limpieza del habitáculo.
- Focos: tratamiento de ópticas.

No usar la misma fotografía en todos.

### 10.4. Selección

Al añadir:

- Borde de selección.
- Indicador de verificación.
- Botón cambia a «Quitar».
- Actualizar resumen inferior.

No cerrar el catálogo después de cada selección.

### 10.5. Resumen inferior

Con cero servicios:

> **0 servicios seleccionados**

«Continuar» deshabilitado.

Con selección:

> **2 servicios seleccionados**

Mostrar subtotal válido y acción **«Continuar»**.

### 10.6. Sin precio

Mostrar:

> **Requiere cotización**

Aplicar la regla existente del negocio para continuar. No sustituirlo por cero ni reutilizar la tarifa de otra categoría.

---

## 11. Detalle de servicio

«Ver qué incluye» abre el detalle dentro del mismo contexto.

Contenido:

- Imagen.
- Nombre.
- Descripción.
- Inclusiones.
- Condiciones.
- Precio para la categoría actual.

Acciones:

- «Añadir servicio» o «Quitar servicio».
- «Volver a servicios».

Al regresar:

- Conservar categoría.
- Conservar selección.
- Conservar posición del catálogo cuando sea posible.

No abrir una segunda ventana encima de la primera.

---

## 12. Registro o selección del vehículo

Al continuar, mostrar:

**¿Qué vehículo vamos a atender?**

### 12.1. Si existen vehículos guardados

Mostrar cada vehículo con:

- Representación de su categoría.
- Nombre o identificación autorizada.
- Datos disponibles.
- Acción «Seleccionar».

Añadir «Registrar otro vehículo» si la función existe.

### 12.2. Si no existen

Presentar el formulario existente con los campos necesarios.

No exigir datos adicionales únicamente para llenar el panel.

La categoría debe corresponder al modelo 3D que aparecerá después.

### 12.3. Validación

Los errores aparecerán junto al campo correspondiente.

Al corregir un campo, no borrar los demás.

Acciones inferiores:

- «Volver».
- «Revisar orden».

---

## 13. Revisión antes de confirmar

Título:

**Revisa tu orden**

Mostrar en este orden:

1. Vehículo.
2. Categoría.
3. Servicios seleccionados.
4. Precio individual.
5. Subtotal.
6. Impuestos o cargos configurados.
7. Total.
8. Condiciones aplicables.

Cada grupo tendrá una acción breve «Editar».

Botón principal:

**Confirmar orden**

Durante la solicitud:

**Confirmando…**

No permitir varias confirmaciones simultáneas.

Si cambia la cotización antes de confirmar, mostrar el cambio y solicitar aceptación explícita.

---

## 14. Orden confirmada

Después de la confirmación del servidor:

**Tu orden está confirmada**

Mostrar:

- Identificador real.
- Vehículo.
- Servicios.
- Estado actual.
- Siguiente paso.

Acciones:

- **Ver mi orden**.
- **Ver mi vehículo**.
- **Ir al lounge**.

No mover un vehículo a una bahía si todavía está en espera o requiere llegada presencial.

Si la visita es DEMO, mantener la identificación visible.

---

## 15. «Mi orden»

El panel debe responder primero:

**Qué está pasando y qué puede hacer el cliente.**

Orden del contenido:

1. Estado destacado.
2. Vehículo.
3. Etapa actual.
4. Servicios.
5. Importe confirmado.
6. Acciones disponibles.

Estados visuales:

| Estado | Presentación |
|---|---|
| Pendiente de llegada | Instrucción de llegada configurada |
| En espera | Posición o información de fila disponible |
| En atención | Tarea y bahía |
| En inspección | Revisión final |
| Listo | Aviso de finalización |
| Cancelado | Confirmación de cancelación |

La cancelación aparecerá solo cuando esté permitida.

Antes de cancelarla:

> **¿Deseas cancelar esta orden?**

Mostrar el alcance real de la acción y botones:

- Mantener orden.
- Confirmar cancelación.

No mostrar éxito hasta recibir respuesta válida.

---

## 16. Fila y movimiento de vehículos

### 16.1. Apariencia de la fila

Los vehículos deben estar orientados en el sentido de avance y dentro del carril.

No alternar orientaciones arbitrarias.

Cada espacio tendrá longitud suficiente para el vehículo que contiene.

### 16.2. Avance

Cuando queda libre el siguiente espacio:

1. Reservarlo.
2. Iniciar movimiento.
3. Girar ruedas.
4. Frenar antes de la posición final.
5. Detener ruedas.
6. Liberar el espacio anterior.

No lanzar movimientos independientes que permitan superposiciones.

### 16.3. Modelos

Debe distinguirse claramente:

- Carro regular.
- Pickup con caja.
- SUV.
- Truck o camión.

El color y los detalles solo se representarán cuando existan datos o una regla DEMO explícita.

No cambiar de carro a SUV al entrar a la bahía.

---

## 17. «Mi vehículo» y vista de bahía

### 17.1. Cámara

Debe mostrar el vehículo asignado y el trabajo relevante.

No enfocar automáticamente otro vehículo porque esté más cerca.

El panel lateral no puede tapar el punto donde trabaja el operario.

### 17.2. Lavado exterior

La imagen debe mostrar:

- Vehículo detenido.
- Operario junto a la carrocería.
- Pistola agarrada.
- Manguera conectada.
- Agua desde la boquilla.
- Humedad localizada.
- Drenaje visible.

La trayectoria del agua debe terminar aproximadamente sobre el vehículo.

### 17.3. Interior

Mostrar:

- Acceso al habitáculo.
- Operario inclinado de forma natural.
- Herramienta dirigida al interior.
- Manguera conectada a aspiradora.
- Ausencia de agua exterior.

Si el modelo no permite puertas articuladas, resolverlo con una adaptación consistente del recurso. No simular trabajo atravesando una puerta cerrada.

### 17.4. Inspección

Operario revisando puntos del vehículo.

Sin efectos de lavado o aspiración activos.

### 17.5. Herramientas en reposo

Al terminar una tarea:

- Desactivar efectos.
- Colocar herramienta en soporte o postura de descanso.
- No dejarla suspendida delante del personaje.

---

## 18. Panel de operación

Título:

**Tu vehículo** cuando corresponde al cliente.

**Bahía 01**, por ejemplo, cuando se explora una zona pública.

Contenido:

- Estado.
- Tarea actual.
- Etapas contratadas.
- Información de ubicación.
- Acción contextual.

No mostrar etapas que la orden no incluye.

En exploración pública, proteger información de otros clientes. Mostrar operación y ocupación, sin exponer datos privados.

El estado del panel, la señalización de la bahía y la animación deben coincidir.

---

## 19. Lounge

### 19.1. Espacio

Desde su cámara:

- Asientos en primer plano izquierdo.
- Mesa baja.
- Vegetación detrás del mobiliario.
- Recepción visible al fondo.
- Bahías visibles parcialmente.
- Panel a la derecha.

No llenar el lounge de objetos sin uso.

### 19.2. Con orden activa

Título:

**Tu espera**

Mensaje:

> Puedes consultar tu orden mientras cuidamos tu vehículo.

Mostrar una tarjeta principal con:

- Estado.
- Vehículo.
- Tarea o fila.
- Acción «Ver detalles».

Debajo:

- Servicios y cuidados.
- Ofertas vigentes.
- Información del local.

### 19.3. Sin orden

Mostrar:

> **Aún no tienes una orden activa.**

Acción:

**Preparar mi orden**

No afirmar que el negocio está atendiendo el vehículo si todavía no existe una orden.

### 19.4. Ofertas

Si hay promociones configuradas:

- Imagen.
- Nombre.
- Condiciones.
- Vigencia.
- Acción válida.

Si no hay:

> **No hay ofertas publicadas en este momento.**

No inventar descuentos.

---

## 20. Finalización del servicio

Cuando el administrador marque el vehículo como listo:

1. Detener animaciones de trabajo.
2. Actualizar señalización de la bahía.
3. Actualizar «Mi orden».
4. Mostrar aviso discreto.

Texto:

**Tu vehículo está listo**

Descripción según la operación configurada.

Acciones:

- Ver mi orden.
- Ver mi vehículo.
- Consultar recepción.

No reproducir confeti, bocinas o animaciones invasivas.

Si falta pago o entrega, indicarlo como siguiente paso real. No afirmar que todo está completado si existe una acción pendiente.

---

## 21. Preguntas y contacto

Al seleccionar «Preguntas» o «Tengo una pregunta»:

**¿En qué podemos ayudarte?**

Mostrar temas:

- Servicios.
- Horarios.
- Mi orden.
- Condiciones.
- Otra pregunta.

Al seleccionar un tema, presentar información autorizada y breve.

Para otra pregunta:

- Campo de texto.
- Botón «Enviar pregunta».
- Indicador de respuesta.

Si no hay una respuesta fiable:

> No tengo información suficiente para responder con seguridad.

Ofrecer:

**Solicitar contacto del negocio**

Antes de enviar:

- Mostrar pregunta.
- Mostrar datos de contacto necesarios.
- Permitir corregirlos.
- Pedir confirmación.

Nunca simular el envío.

---

## 22. Tratamiento visual común

### Paneles

- Fondo `#11212D`.
- Texto claro.
- Radio de 20 px.
- Padding de 24 px.
- Separadores discretos.
- Botón de cierre visible arriba a la derecha.
- Desplazamiento interno cuando el contenido supera el alto disponible.

### Botones

- Principal rojo.
- Secundario oscuro con borde.
- Texto e icono alineados.
- Altura mínima de 44 px.
- Sin efectos de resplandor continuo.

### Textos

- Títulos breves.
- Una idea por bloque.
- Información principal antes de condiciones.
- No usar textos diminutos para hacer caber contenido.
- No colocar párrafos completos como etiquetas flotantes dentro del mundo 3D.

### Sonido

Si existe sonido, mantener control de silencio accesible y respetar las restricciones del navegador. La información esencial debe entenderse sin audio.

---

## 23. Móvil

La experiencia móvil tendrá el mismo flujo, con composición adaptada.

### Entrada

- Escenario visible.
- Bienvenida compacta sobre navegación.
- Una sola acción principal.
- Cuenta y ayuda arriba.

### Recepción

- Ana visible en la parte superior.
- Objetos principales reconocibles.
- Panel inferior.
- Posibilidad de expandir contenido sin perder la acción de cerrar.

### Servicios

- Tarjetas en una columna.
- Selector de categoría accesible.
- Resumen y continuar fijos dentro del panel.
- Sin scroll horizontal general.

### Bahía

- Vehículo y operario visibles arriba.
- Panel inferior compacto.
- Expandir para detalles.

### Regla común

Ninguna acción debe quedar detrás de la barra inferior o del área segura del dispositivo.

---

## 24. Qué debe comprobar Codex antes de entregar

Recorrer exactamente esta secuencia:

1. Abrir la aplicación sin orden.
2. Ver carga y bienvenida.
3. Ir a recepción.
4. Observar saludo y reposo.
5. Abrir cada objeto del mostrador.
6. Abrir catálogo.
7. Cambiar las cuatro categorías.
8. Consultar detalles.
9. Seleccionar y quitar servicios.
10. Registrar o seleccionar vehículo.
11. Revisar cotización.
12. Confirmar.
13. Abrir «Mi orden».
14. Abrir «Mi vehículo».
15. Ir al lounge.
16. Cambiar estados desde administración.
17. Verificar fila, bahía, herramientas y paneles.
18. Recargar y recuperar la orden.
19. Probar cancelación en un estado permitido.
20. Probar finalización.
21. Repetir los encuadres principales en móvil.

Entregar capturas reales equivalentes a las referencias y evidencia de las animaciones funcionando.

**Una sección no se considera terminada porque sus componentes existan en el código: debe verse y comportarse como se describe desde la cámara y el estado correspondiente.**