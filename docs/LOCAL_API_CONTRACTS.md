# API del sandbox local

Todas las rutas comienzan con `/api/demo/`. El middleware sólo admite loopback y Host local. Los POST exigen Origin coincidente, cookie privada y `X-Demo-Nonce` obtenido desde `GET session`. No existe un contrato de producción ni un cambio de esquema de base de datos.

| Ruta | Rol | Contrato y efectos |
|---|---|---|
| GET catalog | Público local | Tarifas, catálogo y contenido administrativo, sin cookie nueva |
| GET session | Visitante/administrador local | Orden propia, perfil, historial, solicitudes, revisión y nonce |
| GET events | Sesión privada | SSE de la misma sesión; no expone órdenes de terceros |
| GET operation | Público local | SSE de posiciones/tareas; sin nombre, contacto ni importe |
| POST quote | Visitante | IDs de servicios y vehículo; calcula en centavos; 422 si falta tarifa/disponibilidad |
| POST confirm | Visitante | quoteId y key idempotente; rechaza vencimiento o versión obsoleta; conserva precio aceptado |
| POST arrival-request | Visitante | orderId propio, confirmado y con attention=not-arrived; registra arrivalRequestedAt una sola vez, historial y revisión privados. Reintentar devuelve el estado vigente sin duplicar. No confirma presencia ni crea vehículo; 404 para orden ajena y 409 si está cerrada o la llegada ya fue confirmada |
| POST cancel | Visitante | orderId propio; cancela sólo antes de atención y sin traslado incompatible |
| POST profile | Visitante | Nombre de 1–80 caracteres para la sesión |
| POST logout | Sesión | Revoca cookie; conserva registros operativos únicamente para administración local |
| POST contact | Visitante | Pregunta, correo/teléfono, key y confirmed=true; requiere habilitación administrativa; devuelve identificador de recibo |
| POST admin/login | Sesión local | Clave local; límite de intentos. No devuelve la clave |
| GET admin/snapshot | Administrador local | Agregado privado de configuración, órdenes, clientes, consultas y operación |
| POST admin/configuration | Administrador local | configuration y expectedVersion; valida URLs/centavos/categorías; guardado local; 409 ante edición concurrente |
| POST admin/command | Administrador local | Acción explícita; orderId y expectedRevision cuando aplica; 409 ante revisión o transición incompatible |
| POST tools | Fixture DEMO explícito | Pausa/avance/reinicio de escenarios sintéticos; no admite `operation` |

Comandos operativos: `arrive` registra llegada y posición de fila; `assign` reserva una bahía libre al primer vehículo; `task` avanza una tarea autorizada; `handover` permite traslado después de inspección; `deliver` registra entrega y salida, conservando payment=pending. `cancel` aplica las mismas restricciones operativas del visitante. `bay` cambia disponibilidad sólo sin ocupación. `resolve-contact` marca una consulta como revisada sin enviar comunicación externa.

El cliente puede solicitar revisión de llegada desde Mi orden o Mi vehículo cuando ya esté en el local. La solicitud permanece privada entre su sesión y administración, que la identifica en la lista e historial. El personal debe verificar presencia antes de `arrive`; sólo ese comando incorpora el vehículo a la fila. Navegar, enviar la solicitud y completar una animación conservan attention=not-arrived y worldEntityId=null. La confirmación administrativa conserva el registro de la solicitud para trazabilidad.

El carril compartido permite un traslado a la vez. Las posiciones de cola tienen 7.4 m de separación y el modelo visible se limita a 6.15 m de longitud; la prueba de circulación comprueba continuidad, separación y rutas fuera del camino peatonal. Una finalización de clip no llama ningún comando comercial. En el escenario operativo las tareas no avanzan por tiempo.

SSE operativo usa streamId, eventId y revisión; la proyección descarta eventos duplicados o atrasados. La orden privada conserva revisiones monotónicas. El panel administrativo invalida consultas anteriores al emitir un comando y conserva el borrador frente a errores o conflictos. No es una garantía de sincronización distribuida de producción.

Se mantiene USD y la regla de descuento existente por seleccionar los tres servicios. El límite técnico de tarifas es 10,000,000 centavos y los campos administrativos admiten ese mismo máximo. Las categorías son las cuatro existentes y los servicios son los tres IDs que el mecanismo operativo comprende. Añadir categorías o tareas nuevas requiere ampliar explícitamente ese contrato; no se simula soporte dinámico universal.
