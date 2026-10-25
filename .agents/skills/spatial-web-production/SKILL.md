---
name: spatial-web-production
description: Implementa y mantiene aplicaciones web espaciales con Three.js/R3F, reconstruyendo referencias visuales mediante cámaras, geometría, materiales e interacción comercial reutilizables. Usar al convertir conceptos en escenas navegables o limpiar su código preservando los flujos del producto.
---

# Producción de aplicaciones web espaciales

Una zona del mundo representa una acción o información del producto. El escenario es una interfaz: la animación muestra estados y el dominio autoriza operaciones. Elegir modo **análisis**, **implementación visual**, **mantenimiento** o **validación** según el pedido; una consulta no autoriza cambios al producto.

## Arranque y propietarios

1. Localizar raíz, instrucciones, Git, entradas, rutas, scripts y pruebas actuales. No asumir que una captura o documento histórico describe la versión en ejecución.
2. Inspeccionar navegador y recursos de la zona afectada. Identificar por separado cámara, composición, materiales, interacción, proyección de estado y fuente comercial.
3. Elegir el dueño existente antes de crear otro componente. Consultar [mantenimiento y reutilización](references/maintenance.md) para limpieza o extracción de capacidades.
4. Para conceptos, disposición, luz o texturas, leer [referencia a escena](references/reference-to-scene.md). Para este repositorio, consultar además [propietarios de CarWash](references/carwash-map.md); sus restricciones no son universales para otros proyectos.
5. Definir toma, estado de usuario, acción esperada, piezas a cambiar y criterios verificables. Registrar qué zonas comparten el recurso para comprobarlas después.

## Método de trabajo

Integrar con el método de ingeniería del proyecto, sin otro sistema de revisión ni servidor de coordinación. Antes de cambios sustanciales, publicar un flujo y pseudocódigo breves con propietarios, fallos y verificaciones reales.

```text
leer petición, código y escena actual
si solo análisis: entregar diferencias y causas demostradas sin editar
comparar referencia y navegador en la misma toma y estado
priorizar composición y escala, después material y luz, después detalle
localizar dueño compartido y preservar una captura inicial
implementar una muestra representativa en el propietario existente
comprobar muestra en dos zonas consumidoras si se afirma reutilización
propagar solo cuando contacto, color, interacción y coste resulten correctos
validar flujos y recursos afectados; conservar diferencias pendientes
```

## Límites que evitan regresiones

- Mantener una fuente de verdad por estado comercial. Un reloj visual, efecto luminoso o clip terminado no confirma pagos, llegada, servicio ni entrega.
- Respetar roles y privacidad en servidor. Los indicadores públicos muestran ocupación; el detalle privado depende de la identidad del dueño.
- Separar revisión técnica y aprobación estética. No declarar igualdad exacta con una imagen conceptual sin comparación observable. Una referencia generada puede contener geometría o perspectivas incompatibles: explicitar la elección, no deformar el mundo para cubrirla.
- Preservar la distribución funcional y las capas aprobadas. Cambiar un material compartido exige comprobar sus consumidores; ajustar una planta no justifica sustituir el fondo.
- Los materiales y texturas cargados en caché tienen consumidores múltiples. Clonar antes de variar UV, color o parámetros; definir quién libera cada clon. No liberar recursos fuente compartidos.
- La navegación conserva borradores, selección y sesión; debe poder interrumpirse sin saltar a un punto antiguo. Respetar movimiento reducido y evitar controles de videojuego salvo petición expresa.
- Un elemento visible que ofrece información debe ser descubrible y accesible. Un badge informativo no debe tener apariencia o semántica de botón. Los overlays 3D se subordinan a los modales y al foco de la interfaz.
- Licencias, resolución y origen de recursos son datos verificables. No llamar HDRI a una foto LDR, ni 4K a un archivo menor, ni afirmar realismo por usar mapas PBR.

## Entrega

Entregar archivos y propietarios, motivo de la decisión, capturas reales comparables cuando cambia la vista, pruebas ejecutadas y límites. En mantenimiento separar cambio mecánico de cambio funcional. No publicar, borrar bases, reiniciar sesiones ni hacer commit por inferencia: conservar el alcance autorizado del usuario.

La compilación prueba compatibilidad del código. El navegador prueba el flujo. Ninguno demuestra por sí solo calidad artística, rendimiento en todos los equipos o preparación para producción.
