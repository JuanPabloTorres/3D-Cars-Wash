# Contrato de cierre MVP por roles — 2026-10-24

## Capacidad y propietarios
- ReceptionCamera: navegación continua cancelable; nunca altera órdenes. Reutilizar geometría de rutas del lounge.
- UserRepository/AuthenticationService: identidad y roles de cliente, empleado y administrador. demoApi: cookie, CSRF y autorización de cada acción. La cuenta de cliente recupera su sesión comercial privada al volver a entrar.
- CatalogService: precios y duración estimada por categoría. Quote conserva la versión contratada. El tiempo estimado nunca finaliza un servicio.
- Docker: ejecutar el mismo backend con SQLite en volumen persistente; Wix recibe solo una ficha en la colección de portafolio después de verificar el MVP.

## Invariantes y errores
No exponer contraseñas ni hashes. Registro público siempre cliente. Empleado no configura ni crea usuarios. Cliente no accede a snapshots privados ajenos. Rotar sesión en login; revocación consulta DB. Orden activa y cola conservadas al cerrar sesión/reiniciar. Cotizaciones anteriores inmutables. No afirmar pago real o SMS: son pendientes/mock.

## Alternativas y elección
A: extender propietarios actuales; elegida para usuarios, catálogo y cámara.
B: pequeña función compartida para muestreo de vuelo y duración por servicio; justificada por navegación y cotización/seguimiento.
C: nuevo framework de auth, ORM o microservicios; rechazado por complejidad sin necesidad.
La frontera Docker/HTTP necesita configuración explícita, no eliminar la protección local sin sustituto.

## Interfaces y migración
Extender users.role a customer mediante migración SQLite transaccional, conservar IDs/hashes. Nuevos endpoints auth/register y auth/login, solo cliente. durations opcional por tipo y servicio; null/missing significa sin estimación. Campos de quote y tarea adicionales opcionales para checkpoints anteriores. El rollback de roles requiere exportar cuentas de cliente; conservar respaldo antes de activar en base real.

## Dependencias y despliegue
UI → HTTP → servicios → repositorios → SQLite. Animación → cámara únicamente. Producción requiere Node único escritor, volumen, HTTPS externo, orígenes configurados y cookies seguras. El contenedor local por sí solo no publica un backend para Wix.

## Verificación prevista
Unitarias: migración, roles, credenciales, duración y preservación de cotización. E2E: tres cuentas, login incorrecto, cliente sin privilegios, CRUD catálogo/ofertas, atención, aviso, entrega, logout/relogin, reinicio. Cámara: posiciones intermedias, destino final, interrupción, movimiento reducido. Dependencias, secretos, git diff y build antes de commit/push. Ficha Wix únicamente con resultado verificable y metadatos fieles; registrar bloqueos reales.
