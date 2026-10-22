# Febles virtual · v0.2

Estado: primera implementación funcional; importes ilustrativos; no certificada para operación comercial. El mundo es una interpretación del local, no un levantamiento arquitectónico. La inspección visual en navegador quedó bloqueada por la política del navegador de pruebas.

## Decisiones

- Three.js y GLB para una escena realmente tridimensional. Cámara dirigida por selecciones, personajes con rutas automáticas, vehículos circulantes y zonas interactivas. La experiencia ocupa la pantalla; los formularios se presentan solo en el punto de interacción.
- React/TypeScript para interacciones y accesibilidad. El motor se carga dinámicamente en el cliente; no se ejecuta WebGL en el servidor.
- Backend TypeScript sobre Workers, API HTTP con validación Zod y base SQL D1 mediante el alojamiento. Esta plataforma no ejecuta ASP.NET Core; elegirla permite entregar una URL funcional en este entorno. Los contratos de repositorio permiten una implementación posterior en .NET sin acoplar el motor 3D a esa elección.
- Monolito modular: dominio → servicio de aplicación → contrato de repositorio → adaptador SQL. Los controladores HTTP autentican, autorizan y validan antes de invocar el servicio.
- Sin pagos integrados ni correos de OTP ficticios. La autenticación publicada la proporciona el alojamiento con ChatGPT. No se almacenan passwords. El control de administración se configura en secreto `ADMIN_EMAILS`, comprobado en el servidor.

## Módulos y contratos

| Área | Propietario y archivos | Responsabilidad |
|---|---|---|
| Dominio | `lib/domain.ts`, `lib/contracts.ts` | Catálogo ilustrativo, cotización en centavos, planes de tareas y máquina de estados |
| Aplicación | `lib/server/order-service.ts` | Creación de solicitudes, idempotencia y operaciones autorizadas |
| Persistencia | `lib/server/repository.ts`, `db/schema.ts` | Transacciones, consultas con pertenencia, snapshots de precios y relaciones |
| Acceso HTTP | `app/api/**`, `lib/server/http.ts` | Identidad, rol administrativo, mismo origen, JSON acotado y errores |
| Mundo | `lib/world.ts` | Escena, ciclo de vida, recursos, personajes, cámaras, modelos y animación |
| Experiencia | `app/experience.tsx`, `app/febles.css` | Recorrido, cotización, órdenes, demostración y operación administrativa |

Las entidades `Person`, `Car` y `WaterEffect` mantienen ciclos de actualización y estados visuales separados; el director compone sus comportamientos sin acoplarlos al repositorio. `ServicePlanFactory` selecciona planes tipados por clase de servicio. Los datos del catálogo continúan configurables sin exponer código arbitrario. No se usa reflexión para conceder permisos.

## Datos y consistencia

Perfiles → vehículos → órdenes → líneas, tareas, pagos y eventos. Las líneas guardan nombre/precio aceptados. Los importes son enteros en centavos; los reportes muestran zona `America/Puerto_Rico`. Los precios del catálogo no son tarifas oficiales.

Claves foráneas, índice único por usuario/clave de petición, hash de contenido normalizado, control de versión, restricción de estados e índice único de ocupación activa por cubículo. Una transición no válida devuelve conflicto. Completar una orden requiere todas sus tareas y entregar requiere un cobro registrado. No hay borrado de movimientos financieros por interfaz.

La API de clientes solo devuelve órdenes del usuario autenticado; la API administrativa requiere el rol configurado en servidor. No se envía la lista de clientes al mundo público. El entorno no simula acceso autenticado si no existe identidad real.

## Endpoints

| Método y ruta | Acceso | Uso |
|---|---|---|
| GET `/api/catalog` | Lectura | Catálogo y naturaleza ilustrativa |
| GET `/api/session` | Lectura | Identidad opcional y capacidades de acceso |
| GET `/api/orders` | Usuario | Sus órdenes |
| POST `/api/orders` | Usuario + mismo origen | Solicitud, clave `Idempotency-Key`, total recalculado |
| GET `/api/orders/:id` | Propietario de orden o admin | Detalle y etapas |
| GET `/api/orders?scope=admin` | Admin | Lista operativa, hasta 100 registros |
| PATCH `/api/orders/:id` | Admin + mismo origen | Llegada, asignación, tarea, finalización, cobro manual, entrega, cancelación |

## Demostración y operación

El recorrido de demostración usa memoria de la pestaña, no crea registros SQL y no representa pagos. Los borradores de formulario se conservan en sessionStorage; nunca se usan como base compartida de órdenes. La actividad ambiental es simulada. Las órdenes persistidas se actualizan por consultas cada 15 segundos. El cliente puede preparar una solicitud desde casa; la llegada la confirma el personal.

## Acceso por email y siguientes incrementos

El OTP por email no está implementado ni activado. Requiere confirmar que el alojamiento admite otro proveedor de identidad, conectar el envío con dominio/remitente verificado y completar un flujo real. El diseño futuro debe incluir código aleatorio criptográfico, hash/HMAC de almacenamiento, expiración breve, uso único, consumo atómico, límites por cuenta e IP, respuestas que no permitan enumerar usuarios, sesiones seguras y protección CSRF. El email OTP no debe venderse como MFA o resistencia al phishing. Para administradores es preferible un proveedor con passkeys/MFA.

Antes de uso comercial: aprobar tarifas e impuestos, términos de garantía, política de retención, respaldo/restauración, pruebas en Android/iOS, carga y accesibilidad, roles de personal más finos, monitoreo y pruebas autenticadas completas. D1 no hace que el producto sea infinitamente escalable: comprobar latencia, concurrencia y límites según uso. No añadir Redis, microservicios o un bus de eventos hasta una necesidad medida.

## Recursos visuales y fuentes oficiales

- Kenney Car Kit 3.1 — https://kenney.nl/assets/car-kit — CC0; archivos y licencia en `public/models/cars`.
- Kenney Mini Characters — https://kenney.nl/assets/mini-characters — CC0; modelos y licencia en `public/models/characters`.
- Escenario, cubículos, mobiliario, herramientas y vegetación: geometría original del proyecto.
- Three.js — https://threejs.org/manual/ y https://threejs.org/docs/ — carga GLTF, cámaras, animación y escena.
- Babylon.js evaluado — https://www.babylonjs.com/specifications/ — alternativa completa; no necesario sumar dos motores.
- OWASP — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html y https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html.

Las licencias originales se incluyen. No se ha descargado ni reutilizado arte de Los Sims: solo se usa la referencia a simulación social para orientar el estilo.

## Comprobaciones

`node tests/domain.test.mjs`, `python3 tests/storage_test.py`, TypeScript y compilación del alojamiento. Las pruebas SQL usan una base aislada y comprueban restricciones reales; no insertan pruebas en producción. El ensayo visual y el recorrido autenticado en navegador siguen pendientes si el navegador de pruebas bloquea el acceso.

## Evolución v0.2 · dirección de escena

La escena se divide en director, entidades, entorno y primitivas. El director recibe intención y estado confirmado; aplica interpolación de cámara, waypoints y etiquetas proyectadas. Las entidades reciben estado visual, nunca permisos ni acceso a SQL. No se necesita navegación libre. La simulación ambiental coordina un solo vehículo de tráfico por ciclo y no modifica órdenes de negocio. El carro del visitante usa la asignación real y su tipo/pintura; los materiales se reutilizan y las geometrías inmutables se agrupan por material. Un reflector planar puede desactivarse automáticamente si el rendimiento inicial es bajo. Consultar `AUDIT-V0.2.md` para límites de aceptación y trabajo artístico pendiente.
