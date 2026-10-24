# CarWash Studio — v0.1.0

Primera versión etiquetada de la aplicación web espacial. Cliente: recepción, catálogo por categoría, orden, espera y seguimiento. Personal: llegada, asignación, etapas y entrega. Administrador: usuarios, servicios, precios, duración y ofertas.

Node.js y SQLite mantienen la autoridad comercial; JWT en cookie HttpOnly identifica las sesiones y los roles se validan en el servidor. La cámara y los badges presentan esos estados, no los autorizan.

## Verificación

90 pruebas unitarias/integración, cuatro recorridos de navegador con SQLite temporal, compilación frontend/servidor. Regresión de cuenta sobre lounge, navegación interrumpida, encuadre inicial y movimiento reducido. Evidencia en docs/evidence/release-v0.1.0.

## Límites

MVP local, no servicio público desplegado. Docker no ejecutado debido al motor local. Pagos, mensajes externos e IA no conectados. Recursos visuales y aceptación artística siguen siendo iterables.

## Ejecutar

Node.js 22.19 o compatible con node:sqlite. npm ci; npm run build; npm run build:server; npm start. Consultar docs/LOCAL_STAFF_SQLITE.md para inicializar la cuenta administrativa. Credenciales y bases privadas quedan fuera de Git.

Comprobación final: 90 pruebas pasan. El reintento de navegación tras corregir el breakpoint pasó (28.9 s). Se encontró además que redimensionar el lounge repetía el recorrido de entrada; ahora seleccionar o redimensionar la misma zona conserva la posición, con regresión unitaria específica.
