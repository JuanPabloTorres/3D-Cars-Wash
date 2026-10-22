# Febles · Car wash virtual

Versión 0.2 de una tienda 3D animada con cámara dirigida por intenciones. Three.js, React/TypeScript, API por capas y SQL D1.

## Recorrido

Selecciona recepción, identifica tu vehículo, elige servicios sobre sus objetos 3D y revisa la cotización. La cámara y los personajes realizan los recorridos automáticamente. El home muestra tu carro y el estado de la visita; el ambiente incluye operarios, agua, espuma, vehículos entrando y saliendo y vegetación animada. El recorrido de demostración no crea registros. El acceso autenticado permite guardar solicitudes; el administrador confirma llegada, cubículo, tareas, cobro manual y entrega.

## Desarrollo

Usar Node 22 o superior y pnpm con el archivo de bloqueo. `pnpm dev` inicia el proyecto fuera del entorno administrado. `pnpm test` comprueba reglas y restricciones. `pnpm exec tsc --noEmit` valida tipos. Los scripts incluidos preparan compilación, enlaces SQL y autenticación del alojamiento.

La base local y la publicada son independientes. Se deben aplicar las migraciones SQL de `drizzle/` en orden. No guardar credenciales en el código. La configuración administrativa `ADMIN_EMAILS` pertenece al entorno del servidor.

## Límites de V1

Precios ilustrativos; no cobros electrónicos, OTP por correo, respaldo certificado ni garantía automática. La autenticación actual usa el acceso seguro del alojamiento. Inspección visual de navegador y flujo autenticado completo pendientes por bloqueo del navegador de pruebas.

Consulta `ARCHITECTURE.md` para contratos, decisiones, seguridad, fuentes y siguientes incrementos. Los recursos visuales externos incluyen sus licencias CC0 dentro de `public/models/`.

## Experiencia y verificación

`AUDIT-V0.2.md` documenta los cambios de jerarquía, cámara, movimiento, estado y límites de aceptación. Las referencias conceptuales no se utilizan como fondos. El acabado procedural todavía necesita una revisión artística para igualar los personajes y detalles de las ilustraciones. WebGL es necesario; el navegador de pruebas tiene su contexto gráfico deshabilitado.
