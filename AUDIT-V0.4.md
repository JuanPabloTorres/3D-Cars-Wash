# Auditoría con las ocho referencias · v0.4

## Resultado y alcance de aceptación

Se inspeccionaron directamente las ocho imágenes conceptuales adjuntas, de `1000007916.png` a `1000007923.png`. La refactorización toma su organización espacial: las opciones son objetos del mostrador, los servicios se eligen en expositores y la cotización se acepta sobre una tablilla dentro del local. Se elimina la interfaz de tarjetas de cliente de la v0.3.

Las imágenes de referencia **no se distribuyen ni se usan como fondos del mundo**. Los carros, el personal, la arquitectura, los servicios y sus controles son geometría 3D. Las texturas Canvas se limitan a superficies, señalización y documentos. Los campos editables viven en una tableta proyectada por CSS3DRenderer, con la misma cámara que la escena WebGL.

La aceptación visual sigue **pendiente**: este navegador de pruebas devuelve `GL_VENDOR = Disabled / GL_RENDERER = Disabled` y no permite crear el contexto WebGL. La compilación y las pruebas geométricas no acreditan equivalencia de píxeles ni un acabado idéntico a las ilustraciones. Los modelos disponibles del personal y los vehículos tampoco son los personajes ni las carrocerías exactas de las referencias. No se afirma que esa diferencia artística esté resuelta.

## Correspondencia de experiencia

| Referencia | Implementación |
|---|---|
| 7922 · Entrada | Avatar visible, recepción a la derecha, cartel de bienvenida seleccionable, cinco cubículos y cámara automática a altura humana |
| 7917 · Recepción | Brújula, SUV en miniatura y documento sobre bases de madera; elección sobre el objeto y su placa, sin menú flotante |
| 7918 · Vehículo | Tableta 3D junto al carro con tipo, color e identificador; llegada presencial sigue pendiente de confirmación por personal |
| 7920 · Servicios | Capó curvo con espuma, foco y asiento derivados del SUV; otros tres servicios en otro grupo de exposición |
| 7916 · Cotización | Tablilla inclinada con partidas, total de ejemplo y áreas Aceptar/Cambiar, seleccionables por coordenadas UV |
| 7921 · Espera | Letrero físico junto al vehículo, identificador, estado, tareas y acceso a la orden |
| 7919 · Trabajo | Vehículo en cubículo asignado, operario y efectos de lavado; tareas mostradas a partir de datos confirmados |
| 7923 · Entrega | Documento de orden, comprobante descargable y acceso a información de garantía; entrega confirmada por la operación |

## Dirección artística aplicada

- El escenario ocupa la pantalla; desaparecen las tarjetas de recepción, catálogo, cotización, orden y garantía.
- Se mantienen únicamente los controles discretos de retorno/cuenta y los avisos temporales; login y operación administrativa conservan formularios convencionales.
- Mostrador a 1 m y cámara de recepción a 1,85 m. Los cubículos bajan a 3,8 m para dar mayor presencia a vehículos y personas.
- Materiales originales de madera y piedra con relieve y UV en metros; cielo procedural y terreno continuo sustituyen montañas y nubes esféricas.
- Ropa de personal oscura con detalles rojos. Los modelos conservan esqueletos y animaciones; no se incorporan archivos extraídos de The Sims.
- Los nuevos objetos reutilizan componentes del SUV y geometría nativa. No aumenta la descarga de los seis GLB activos (5,91 MB).
- En móvil se muestra un expositor por encuadre y se ajusta el zoom de la tableta y de la tablilla. Los seis servicios siguen accesibles.

## Componentes y contratos

`WorldSurface` es una superficie física reutilizable con textura, regiones de acción y equivalentes semánticos para teclado. `InteractionRegistry` resuelve el contacto con el mundo y respeta visibilidad y obstáculos. `SpatialInterface` compone mostrador, documentos, estado y expositores. `shotFor` centraliza los encuadres por intención. React conserva el estado de negocio y proyecta una vista tipada; la escena no concede permisos ni escribe SQL.

El servidor continúa recalculando precios, comprobando propiedad y rol, validando las transiciones e impidiendo cobros y ocupaciones duplicadas. Una animación no confirma llegada, no finaliza tareas y no procesa dinero. La demostración sigue separada de las órdenes persistidas.

## Verificación

Además de dominio, SQL y carga de los GLB reales, las pruebas nuevas verifican selección UV, áreas desactivadas, obstáculos opacos, grupos ocultos, las opciones del mostrador en el entorno completo, los botones de la tablilla frente al mostrador real, controles de servicio sin oclusión mutua y encuadres móviles completos. Se comprueba también que únicamente haya tres expositores activos en escritorio o uno en móvil.

Los fixtures de documento e imágenes permiten probar geometría y matrices sin GPU; no renderizan texturas ni validan apariencia, interacciones táctiles reales, teclado virtual o rendimiento en Android/iOS. Quedan pendientes la aceptación visual sobre WebGL, el recorrido autenticado completo y las mediciones en dispositivos reales. Pickup conserva la representación SUV y Compacto el sedán reducido; las puertas no están articuladas.
