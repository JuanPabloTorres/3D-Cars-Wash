# CarWash Studio v0.1.1

Entrega de mantenimiento del MVP local, 24 de octubre de 2026.

## Cambios

- Habilidad `spatial-web-production` versionada: referencias conceptuales, materiales, texturas, vegetación, iluminación, cámaras y mantenimiento de aplicaciones web espaciales.
- Cuenta y administración organizadas por componentes y hooks; configuraciones de pruebas agrupadas en `config/testing`.
- Prettier fijado, comandos de formato, separación de bloques y comentarios de responsabilidad y contratos.
- Eliminación de seis módulos sin consumidores comprobados y lógica vacía o duplicada.
- Sesión comercial compartida y preparación de mapas PBR reutilizada en suelo, recepción y lounge.

## Validación y compatibilidad

El mantenimiento pasó 91 pruebas unitarias, comprobación de tipos, builds de frontend y backend, formato y comprobaciones HTTP de autenticación y permisos. Cinco recorridos E2E pasaron entre dos ejecuciones: cuatro inicialmente y uno tras corregir su selector. El detalle y los fallos conservados están en [el informe de mantenimiento](MAINTENANCE_2026-10-24.md).

La suite E2E por defecto usa un servidor aislado en 4175. El runner histórico se conserva en `config/testing/playwright.legacy.config.ts`. No hay migraciones de base de datos ni cambios de API en esta entrega. Las capturas de v0.1.0 siguen identificadas como evidencia de esa versión.

Esta versión mantiene la clasificación de MVP local: Docker no está certificado y pagos externos, mensajería externa e IA siguen pendientes. Publicar el código y el tag no constituye un despliegue de producción.

## Recuperación

El tag inicial `v0.1.0` se conserva. Para comparar o recuperar su código, utilizar un checkout separado de ese tag, sin sobrescribir datos locales ni claves. Esta entrega no cambia el esquema SQLite.
