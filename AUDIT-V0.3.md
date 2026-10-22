# Refactor visual · v0.3

## Problema y resultado implementado

La versión anterior tenía personajes de cabezas grandes, carrocerías construidas con cajas redondeadas, mobiliario simplificado y demasiadas tarjetas simultáneas. Esta versión sustituye las entidades principales por modelos GLB con proporciones naturales, texturas y materiales físicos. Conserva geometría real y animación: no introduce fondos de las imágenes conceptuales.

Se retiran el dock, la tarjeta grande de bienvenida, el HUD permanente de visita, el logo flotante, los controles de ambiente y las etiquetas descriptivas permanentes. Se reescribe el CSS para evitar las numerosas reglas superpuestas de la versión anterior. Una única conversación se abre al interactuar con el local. Recepción ofrece vehículo, servicios, lounge, visitas guardadas y administración autorizada. El carrito propio muestra su detalle al seleccionarlo.

Los expositores físicos representan seis servicios; cambiar de servicio dirige la cámara al objeto correspondiente. Se elimina la ilustración SVG que repetía el objeto dentro del panel. El mostrador baja a escala humana y el cartel principal deja de tener proporción cuadrada. Se reducen las burbujas de espuma y se añade iluminación de entorno para metal, pintura y cristales.

## Modelos y movimiento

- SUV y sedán con interiores, cristales, carrocería y cuatro ruedas animadas. Pintura independiente por vehículo.
- Recepcionista y operarios con esqueleto humano y clip de espera. Marcha, trabajo y saludo se aplican sobre el rig sin acumular rotaciones.
- Sofás con textiles y palmeras con hojas detalladas.
- Modelos locales, sin dependencia del proveedor en tiempo de ejecución. Fuentes y licencias en NOTICE.
- Recursos optimizados: 5,91 MB; carros agrupados en menos de 30 mallas cada uno.
- El cliente espera a que termine el tráfico ambiental ya iniciado antes de entrar al pasillo compartido.

## Comprobaciones y aceptación

Las pruebas decodifican los GLB reales y comprueban sus dimensiones, ruedas, materiales independientes, esqueletos, ausencia de deriva, escala del mobiliario y presupuesto. Las pruebas de dominio y SQL conservan las restricciones de operación. TypeScript y compilación del alojamiento se ejecutan antes de publicar.

La comprobación de texturas en pantalla, iluminación final, ausencia de oclusiones en cada encuadre y comparación directa con las referencias **no está completada**: el navegador disponible reporta WebGL deshabilitado. Los tests de modelos sustituyen la decodificación de imágenes por un stub y no acreditan cómo se ven los píxeles. No se acredita igualdad con las imágenes conceptuales ni rendimiento aceptable en dispositivos reales.

Pickup sigue representada por un SUV, explícito en la selección. Compacto usa un sedán a menor escala. Las puertas no tienen articulación en los nuevos GLB. La administración, la autenticación del alojamiento y las órdenes persistidas conservan su funcionamiento anterior; no se ha ejecutado una venta real ni un cobro electrónico.
