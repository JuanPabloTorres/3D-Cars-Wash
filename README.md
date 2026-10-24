# CarWash Studio · experiencia 3D configurable

Visita comercial continua en Three.js, React Three Fiber y Drei. El visitante selecciona un destino y la cámara abre el área; no necesita WASD ni joystick. Nombre predeterminado genérico, editable desde administración.

## Ejecutar localmente

Node 22.19 o compatible. En `C:\Projects\Repos\3D-Cars-Wash`:

```powershell
npm install
npm run build
npm run preview
```

- Cliente: http://127.0.0.1:4173/
- Administración local: http://127.0.0.1:4173/admin
- Desarrollo: `npm run dev`, usando un único servidor en el puerto 4173.

La API local está integrada en Vite. Servir únicamente `dist/` desde un hosting estático NO proporciona órdenes, sesiones, administración ni eventos. El sandbox rechaza accesos ajenos a loopback y no debe conectarse a datos de producción.

## Acceso administrativo

Al iniciar se genera `server/.local-admin-token`, excluido de Git. Abre ese archivo localmente y usa su contenido en el formulario administrativo. No compartas la clave en chats ni capturas. Puede sustituirse mediante `CARWASH_ADMIN_TOKEN` en el entorno del proceso; no se incluye en el cliente.

El acceso requiere clave, cookie de sesión y nonce para mutaciones. El visitante no obtiene permisos con un parámetro de URL. Las áreas son Operación, Órdenes, Servicios y precios, Clientes y vehículos, Contenido y atención, y Configuración. Es administración del sandbox local; no es autenticación comercial ni un directorio de empleados de producción.

## Fuente de verdad y conservación

`server/demoApi.ts` conserva las sesiones y controla comandos. `DemoOperationSource` controla rutas, posiciones y tareas; el renderer consume sus eventos. Las animaciones no confirman pagos, llegada ni entrega.

- Configuración inicial: `server/business-config.json` y contenido inicial existente.
- Ediciones administrativas: `server/local-business-config.json`, guardado mediante archivo temporal y reemplazo; excluido de Git.
- Órdenes, perfiles, historial y consultas: memoria del servidor. Se recuperan tras recargar el navegador con la misma cookie; un reinicio elimina esos registros.
- Borrador de contratación: `sessionStorage`, separado de la orden confirmada.
- Cerrar sesión revoca la cookie y elimina el borrador local. Los registros operativos permanecen para el administrador hasta reiniciar el servidor.
- Actualizaciones del mapa: SSE público sin contacto ni importes. Orden privada: SSE y recuperación periódica. Administración: consulta periódica y recibos de comandos.

No hay cobros integrados. El pago permanece pendiente incluso si el personal registra la entrega. El registro virtual tampoco prueba presencia física; administración debe registrar la llegada.

## Recorrido del cliente

Recepción reúne servicios, preguntas, horarios e información. Se elige categoría/color, se revisa una cotización vigente y se confirma una orden idempotente. Mi orden muestra turno, bahía, tareas, importe aceptado e historial; permite cancelación mientras no comenzó la atención. Mi vehículo observa su entidad asignada. El local reúne bahías, fila, lounge y entrega; el lounge comparte contenido, ofertas y cuidados con recepción.

El mapa operativo inicia vacío. Sólo aparece un vehículo cuando el administrador registra la llegada de una orden. Se conserva su categoría y color durante fila, servicio y entrega. El administrador asigna una bahía libre, avanza las tareas, mueve a entrega y confirma el retiro. Los traslados y el carril compartido bloquean acciones incompatibles.

Los precios son por servicio y categoría. No se inventaron tarifas para pickup, SUV o truck: permanecen en «Requiere cotización» hasta configurarlas. Una cotización anterior a un cambio de configuración debe renovarse; una orden confirmada conserva el importe aceptado.

Horarios, contacto, redes y ofertas oficiales permanecen vacíos hasta configurarlos. Las consultas sólo se registran si el administrador habilita su recepción; el visitante revisa y confirma, y el éxito requiere recibo del servidor. Se reciben en el panel local; no envían correo ni mensajes externos.

## Escenarios sintéticos explícitos

http://127.0.0.1:4173/?tools=demo&scenario=mixed

Escenarios `mixed`, `quiet`, `busy`, `arrival`; `demoSpeed` opcional. Sus registros son fixtures identificados como DEMO, separados del escenario operativo `operation`. Los comandos históricos `/api/demo/tools` no pueden modificar la operación. No equivalen a permisos administrativos.

## Verificación y evidencia

```powershell
npm test
npm run build
npm run test:e2e
node scripts/validate-assets.mjs
```

Suite vigente: `commercial.spec.ts` y `sow.spec.ts`, con navegador Edge real, escritorio y móvil emulado. Las suites antiguas de caminata son historial, excluido del contrato actual. Los tests administrativos deshabilitan trazas y videos para evitar grabar la clave local; las capturas sólo muestran la UI.

- [Cierre del SOW y matriz](docs/SOW_CLOSURE.md)
- [Contratos de API local](docs/LOCAL_API_CONTRACTS.md)
- [Estado de hitos](docs/GATE_STATUS.md)
- Evidencia real: `docs/evidence/sow-closure/`
- [Inventario de recursos](docs/ASSET_INVENTORY.md) y [licencias](public/ASSET_LICENSES.txt)

Se conservan cuatro GLB de Innerscene CC0 y personajes de Blender Studio CC BY 4.0. Los originales externos permanecen intactos. `scripts/export-staff.py` añade señalamiento en una adaptación del rig profesional; los scripts embebidos del archivo Blender permanecen deshabilitados.

El entorno utiliza la imagen urbana aportada por el usuario como fondo físico lejano con bordes suavizados, separado del HDRI que ilumina los materiales. La escena, vehículos y rutas son tridimensionales; el mostrador utiliza displays HTML de Drei anclados espacialmente y accesibles, no zonas invisibles a coordenadas de pantalla.

## Límites

La aprobación artística sigue pendiente. Faltan integración de identidad y roles comerciales, almacenamiento duradero, pagos y un backend de producción. El móvil se verifica por emulación, no en un teléfono físico. El ajuste fino de mirada, manos, herramientas y mangueras sigue sujeto a revisión visual. No se promete 60 FPS.

La ubicación comercial definitiva no está configurada. Se conserva NWS y un ambiente simulado de respaldo; la geolocalización sólo se solicita por acción explícita. Las aplicaciones y diseños anteriores siguen descartados; no se restauró su historial ni su código.
