Revisé las cinco imágenes. **Definen bien la dirección visual, pero todavía no forman una referencia completa y consistente para implementar todo el sistema.** Hay diferencias entre ellas, faltan estados del recorrido y algunos detalles del render serían costosos de reproducir literalmente.

Debemos convertirlas en **una escena compartida, cinco encuadres y componentes reutilizables**.

### 1. Qué corregir en las imágenes actuales

| Vista | Hallazgo | Decisión para implementar |
|---|---|---|
| Entrada | La flecha central conduce visualmente por el carril de autos hacia recepción | La cámara del visitante seguirá el camino peatonal izquierdo. La flecha del pavimento será exclusivamente vehicular |
| Entrada | Aparece «Recepción» seleccionada antes de llegar | En entrada no habrá destino activo; se activará al completar el traslado |
| Recepción | Falta un cierre claro del panel | Añadir cierre. Cerrar el panel conserva la cámara y deja disponibles los objetos del mostrador |
| Recepción | Marca superior, pared y mostrador repiten bastante protagonismo | Marca superior compacta, pared como identidad principal y marca frontal de menor tamaño |
| Servicios | Reaparecen los bloques negros que queríamos eliminar | Usar exactamente el mostrador de recepción: folleto, reloj, información y tableta |
| Servicios | El panel crece considerablemente y cambia la composición | Definir una variante ampliada del mismo panel y un encuadre específico para catálogo |
| Bahía | «Recepción» permanece seleccionada | Activar «El local», o «Mi vehículo» cuando se observa el vehículo del cliente |
| Bahía | La espuma cubre bastante suelo y aumenta la complejidad visual | Limitar humedad y espuma al área de trabajo, con efectos contenidos |
| Lounge | Dice «mientras cuidamos tu auto» aunque no existe orden | Sin orden: «Conoce el local y prepara tu visita». Con orden activa: mensaje de espera |
| Todas | Cambian logotipo, navegación, iconos y anchura de controles | Utilizar un solo componente para cada elemento compartido |

**No debemos copiar estas diferencias como si fueran decisiones aprobadas.**

### 2. Qué falta representar

Las imágenes muestran cinco lugares, pero no todos los pasos que el usuario debe completar.

| Referencia faltante | Estados que debe mostrar |
|---|---|
| Primera llegada | Carga, bienvenida, error de carga y regreso con orden |
| Servicios seleccionados | Tarjeta añadida, quitar servicio, subtotal y continuar habilitado |
| Detalle de servicio | Inclusiones, condiciones y regreso conservando selección |
| Vehículo | Vehículos guardados, registro nuevo y errores de campos |
| Revisión | Servicios, categoría, importes, condiciones y confirmación |
| Confirmación | Enviando, éxito y error recuperable |
| Mi orden | Espera, atención, inspección, listo y cancelado |
| Fila | Posición del cliente y avance sin superposición |
| Preguntas | Respuesta, ausencia de respuesta y solicitud de contacto |
| Cuenta | Visitante anónimo, perfil y vehículos |
| Móvil | Entrada, recepción, catálogo y seguimiento |
| Administrador | Operación, asignación de bahías, precios y actualización de tareas |

No hace falta generar una imagen diferente para cada mensaje. **Los formularios y estados deben definirse con componentes reales**, utilizando las cinco propuestas como referencia de estilo.

Para cerrar la referencia visual, las prioridades son: **revisión de orden, seguimiento con fila, móvil y operación administrativa**.

### 3. Cómo recrearlo eficientemente

La aplicación debe tener **un único establecimiento 3D**. Cambiar de vista modifica cámara, selección y panel; no carga una reconstrucción diferente del local.

| Capa | Implementación |
|---|---|
| Arquitectura | Módulos reutilizables de techo, columna, pared, bahía y mostrador |
| Ambiente | Suelos, jardineras y fondo compartidos |
| Vehículos | Cuatro modelos por categoría, reutilizados según las entidades |
| Personajes | Ana y operarios con controlador de animación compartido cuando sea compatible |
| Interfaz | Texto, botones, formularios y tarjetas en HTML/CSS sobre la escena |
| Información espacial | Identificadores de bahía y etiquetas vinculados a posiciones 3D |
| Operación | Datos existentes alimentan paneles, vehículos y animaciones |

Los textos largos, precios y botones no deben convertirse en texturas dentro del mundo 3D: necesitan seguir siendo legibles, accesibles y actualizables.

### 4. Un catálogo mínimo de piezas

Para obtener el aspecto de las imágenes no necesitamos cientos de objetos distintos.

| Grupo | Piezas iniciales |
|---|---|
| Estructura | Techo, columna, pared, borde de techo |
| Recepción | Mostrador, soporte de folleto, reloj, flyer, tableta |
| Lounge | Asiento modular, mesa y jardinera |
| Vegetación | Dos árboles, dos arbustos y una planta ornamental |
| Operación | Carrete, manguera, pistola, aspiradora, carro de herramientas y drenaje |
| Vehículos | Carro, pickup, SUV y truck |
| Señalización | Número de bahía, estado y marcas del suelo |

Las variaciones se obtienen mediante distribución, materiales y orientación. No crear un modelo diferente para cada repetición.

Antes de sustituir recursos, comprobar cuáles de los existentes sirven. Los archivos ya reunidos para el proyecto deben evaluarse por **coherencia visual, estructura y rendimiento**, sin asumir que todos combinan automáticamente.

### 5. Qué requiere modelado y qué puede construirse con código

**Construir con geometría sencilla:**

- Edificio.
- Mostrador.
- Jardineras.
- Bordillos.
- Señalización.
- Soportes.
- Drenajes.
- Muebles sencillos.

**Utilizar modelos preparados y adaptarlos:**

- Personajes.
- Vehículos.
- Vegetación orgánica.
- Herramientas que se observan de cerca.

**Utilizar imágenes:**

- Fotografías representativas de servicios.
- Contenido de folletos.
- Fondo lejano, cuando sea compatible con las cámaras.

El fondo no debe contener objetos que el visitante necesite rodear o inspeccionar. Las paredes y vegetación cercanas sí necesitan volumen para que el desplazamiento resulte creíble.

### 6. La calidad debe concentrarse donde se observa

Las propuestas tienen vegetación densa, superficies muy detalladas y reflejos cercanos a un render arquitectónico. Debemos conservar su composición, ajustando el coste de representación.

| Prioridad | Elementos |
|---|---|
| Alta | Rostro de Ana, mostrador, vehículo observado, manos y herramienta |
| Media | Bahías vecinas, muebles, plantas cercanas |
| Baja | Edificios lejanos, vegetación de fondo y objetos pequeños fuera de cámara |

No es eficiente detallar un edificio lejano tanto como el personaje de recepción.

La apariencia profesional dependerá especialmente de:

- Buen encuadre.
- Escala coherente.
- Materiales consistentes.
- Sombras de contacto.
- Texto legible.
- Ausencia de intersecciones.
- Animaciones conectadas correctamente.

### 7. Las animaciones necesitan una especificación independiente

Las imágenes muestran poses, pero no demuestran movimiento correcto. Debemos definir y comprobar:

| Animación | Condición de aceptación |
|---|---|
| Saludo | Comienza al llegar, termina y regresa al reposo |
| Explicación | Gestos breves sin repetición constante |
| Lavado | Manos sujetan pistola y agua sale de la boquilla |
| Interior | Herramienta entra por un acceso coherente al habitáculo |
| Ruedas | Giran según desplazamiento y se detienen con el vehículo |
| Fila | Un espacio por vehículo y avance solo con ruta libre |
| Cámara | No atraviesa arquitectura ni termina detrás de un obstáculo |

Para mangueras y herramientas, primero resolver sujeción y trayectoria. Añadir partículas después. Así evitamos embellecer una interacción que todavía está mal conectada.

### 8. Cómo debe organizarse el trabajo de Codex

**Primero: construir una muestra completa de recepción.**

Debe incluir:

- Fondo y vegetación del encuadre.
- Iluminación y materiales finales.
- Ana.
- Mostrador y cuatro objetos.
- Panel funcional.
- Navegación y cuenta.

Esta muestra establece la calidad común para el resto del establecimiento.

**Después: completar una bahía.**

Resolver un vehículo, operario, herramientas, efectos y estados. Una vez verificado, reutilizar la estructura en las demás bahías.

**Luego: integrar entrada y lounge.**

Se construyen con las mismas piezas, materiales y componentes ya validados.

**Finalmente: cerrar los estados del recorrido y móvil.**

No reconstruir la escena para cada estado.

### 9. Cómo evitar otra interpretación libre

Para cada vista, Codex debe recibir una ficha con:

1. Imagen de referencia.
2. Cámara y objetivo.
3. Elementos que deben verse.
4. Elementos que no pueden quedar ocultos.
5. Panel y contenido.
6. Estado del usuario y de la orden.
7. Acciones y resultado esperado.
8. Captura real de aceptación.

La comparación debe realizarse con **el mismo tamaño de viewport y un escenario DEMO estable**. Si cambian vehículos, iluminación y ocupación entre capturas, es difícil determinar si la implementación se aproxima a la referencia.

**La corrección principal es esta:** las cinco imágenes deben convertirse en un sistema visual compartido y verificable. Faltan referencias del flujo, pero podemos completarlas mediante componentes y estados reutilizables, sin producir una implementación distinta para cada pantalla.