# Administración y atención local con SQLite

El cliente 3D, `/admin` y `/employee` usan la misma API `/api/demo`. Continúa siendo una aplicación local de demostración: los avisos son internos, el pago permanece pendiente y no se envían correos ni SMS.

## Inicio y primer acceso

- Node 22.19 o superior, con `node:sqlite` disponible. En Node 22 la API todavía emite una advertencia experimental.
- `npm run dev`, o `npm run build` y `npm run preview`.
- Backend Node.js independiente: `npm run build`, `npm run build:server`, `npm start`. Vite sólo proporciona la alternativa de desarrollo/preview.
- Clientes: `/login` permite registrarse o iniciar sesión; al entrar abre `/world3d`. Cerrar sesión vuelve a `/login` después de que el servidor confirme la invalidación.
- Abrir `/admin`. Si no existen cuentas, el formulario permite crear el primer administrador utilizando la clave de instalación de `server/.local-admin-token` y una contraseña nueva de 12–200 caracteres. No publicar ese archivo.
- El administrador crea cuentas de empleados o administradores en **Usuarios del equipo**. Cada usuario entra con su nombre de usuario y contraseña. El rol se obtiene de SQLite.
- El empleado utiliza `/employee`: registra llegada, asigna bahía, completa tareas, finaliza el servicio y confirma entrega. No puede editar catálogo, ofertas, disponibilidad ni usuarios.
- El acceso por clave local de las herramientas existentes se conserva como adaptador de mantenimiento, limitado a loopback. No es un mecanismo de autenticación para desplegar en Internet.

## Datos y propietarios

`server/data/carwash.sqlite` es la base predeterminada, excluida de Git. `CARWASH_DB_PATH` permite aislar pruebas o cambiar su ubicación explícitamente. No ejecutar dos servidores operativos contra la misma base: cada servidor mantiene su proyección activa en memoria.

| Propietario | Responsabilidad |
| --- | --- |
| `SqliteRepository` | Conexión compartida, parámetros SQL y transacciones locales |
| `CatalogRepository` / `CatalogService` | Catálogo, tarifas, ofertas y configuración con control de versión |
| `UserRepository` / `AuthenticationService` | Usuarios, hashes scrypt, autenticación y protección del último administrador |
| `SessionTokens` | Firma/verificación JWT HS256, emisor, audiencia, vencimiento y vínculo con sesión persistente |
| `RuntimeRepository` | Checkpoint atómico de sesiones privadas y operación |
| `DemoOperationSource` | Orden de tareas contratadas, cola FIFO, carril y entrega |
| `createLocalServices` | Composición e inyección de las dependencias |
| `demoApi` | Frontera HTTP, sesión, CSRF, permisos y proyecciones públicas/privadas |

Los usuarios se guardan en una tabla con restricciones de rol y unicidad. El catálogo y el checkpoint operativo se guardan como documentos JSON en SQLite. Esto mantiene atómicos sus contratos existentes; no hay un ORM ni consultas analíticas sobre órdenes normalizadas.

La primera apertura importa la configuración JSON anterior si existe. No modifica ni borra ese archivo. La base guarda las sesiones, sus órdenes, cotizaciones, claves de idempotencia, historial, avisos y el checkpoint completo de la operación. Reiniciar conserva el punto de trabajo; el tiempo fuera de ejecución no finaliza servicios. Las sesiones vencen a las 24 horas; las órdenes de sesiones vencidas o cerradas siguen disponibles para el personal.

Las cookies de los puertos de prueba tienen nombres distintos para no reemplazar la sesión de 4173. Una base anterior en memoria **no puede recuperarse después de detener su proceso**. La activación inicial requiere conservar ese servidor o autorizar su reinicio; las ejecuciones posteriores con SQLite sí conservan los datos.

Los tres roles autenticados utilizan JWT en cookie HttpOnly, SameSite=Strict y ruta `/api/demo`, con vigencia de 24 horas. No se guarda el token en localStorage. El identificador `jti` corresponde a la sesión persistida y `sub` al usuario; el permiso se consulta en SQLite, no se acepta desde el token. Logout y revocación eliminan la autorización persistida y rechazan reutilizaciones. Las visitas anónimas conservan su cookie opaca sin privilegios. Al migrar desde sesiones autenticadas anteriores a JWT se requiere iniciar sesión otra vez, conservando su dueño comercial y sus órdenes.

La clave de firma se genera con 32 bytes aleatorios y se conserva en `<ruta-de-la-base>.jwt-key` (por defecto `server/data/carwash.sqlite.jwt-key`). Está excluida de Git y del contexto de construcción Docker; el volumen `/data` la conserva junto a SQLite. Incluirla en respaldos privados para conservar sesiones al restaurar. No editar ni reemplazar una clave corrupta automáticamente. Esta aplicación sólo admite HTTP local; una publicación pública requeriría HTTPS, cookie Secure y una revisión de sus límites de despliegue.

Para respaldo, detener el servidor de forma ordenada y copiar la base junto con cualquier archivo `-wal`/`-shm` que exista. Mantenerlos privados: contienen datos de sesiones y contactos. No restaurar respaldos mientras el servidor esté abierto.

## Catálogo y operación

Se admiten de 1 a 40 servicios distintos. Crear un servicio lo deja inicialmente no disponible y sin tarifas; el administrador completa importes por categoría y lo activa. No se inventan precios ausentes. Las órdenes confirmadas conservan sus precios y etiquetas originales. El descuento histórico sigue perteneciendo al paquete exterior + interior + focos.

Cada orden genera su propia lista de tareas con los servicios contratados y la inspección final. Un servicio nuevo no desaparece al entrar a la bahía. Las animaciones nunca completan tareas. Finalizar genera un aviso privado, traslada el vehículo cuando el carril y la entrega lo permiten y habilita el siguiente turno; recoger y pagar siguen siendo acciones distintas.

## Comprobación reproducible

- `npm test`: contratos, repositorios, credenciales, último administrador, reapertura SQLite y tareas dinámicas.
- `npm run build`: TypeScript y producción.
- `npm run test:e2e`: servidor aislado en 4175, base temporal, primer acceso, creación de empleado/servicio/oferta, orden del cliente, atención por empleado, reinicio y recuperación, aviso privado, entrega, revocación y permisos negativos.
- Suites visuales existentes en `playwright.operations.config.ts`, sobre un servidor de prueba aislado en 4174.

Para iniciar ese servidor visual en PowerShell, usar una ruta de prueba explícita antes de ejecutar Vite:

```powershell
$env:CARWASH_DB_PATH = Join-Path $PWD '.cache/operations-tests.sqlite'
npx vite --host 127.0.0.1 --port 4174 --strictPort
```

No usar esa variable en la consola del servidor operativo. El fixture HTTP de Vitest inyecta `demoApi({databasePath: ':memory:'})`; la suite de integración utiliza un archivo temporal real y comprueba su reapertura.

El fondo de login es `public/images/staff-login-v1.png`, generado para este proyecto a 1672 × 941 píxeles, con recorte proporcional mediante `background-size: cover`.
