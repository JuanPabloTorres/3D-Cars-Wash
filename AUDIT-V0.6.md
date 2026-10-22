# Local virtual vivo — versión 0.6

## Objetivo y composición

La aplicación abre un local 3D continuo de Three.js. La puerta, el mostrador, los expositores, la sala de espera y los vehículos son los destinos. El visitante selecciona un destino y el director mueve la cámara; no hay movimiento libre por ejes ni estructura de header, sidebar y footer.

Esta revisión sustituye el predio flotante por un patio asentado en su entorno; añade cubiertas inclinadas de terracota, divisiones bajas, pavimento mate y plazas de espera y entrega. Las cubiertas se retiran al mostrar el mapa. Los cinco rótulos detallados de cubículo se ocultan en el plano general y se elimina el globo permanente sobre la recepcionista. La identidad y los modelos disponibles se conservan; no se afirma que sean modelos de Los Sims.

## Componentes

| Componente | Responsabilidad | Fuente de verdad |
|---|---|---|
| API `/api/local` | Proyección acotada de espera, servicio y entrega; excluye nombres, tablillas, cuentas e identificadores de órdenes | SQL: órdenes, vehículos, tareas y líneas de servicio |
| `operation-view.ts` | Contrato de la proyección, plazas y tipo de tarea | Reglas explícitas de presentación |
| `operation-fleet.ts` | Reconciliar actores persistentes y serializar recorridos confirmados | Proyección de operación |
| `environment.ts` | Puerta, recepción, plazas, cubículos, vegetación y arquitectura | Distribución virtual; ubicación física por confirmar |
| `world.ts` | Cámaras por selección, personajes, efectos y sincronización de escena | Intención del usuario + datos confirmados |
| `spatial-interface.ts` | Objetos interactivos, cotización, estado y tableta para campos editables | Contratos de aplicación |
| API de órdenes / servicios / repositorios | Autorizar, validar, guardar y auditar cambios | Backend autenticado y restricciones SQL |

No se cambia un estado comercial por terminar una animación. Las solicitudes con llegada pendiente no se convierten en carros presentes en el local. Una desaparición de la proyección anima la salida del mapa; no es una lectura de sensores de salida física.

## Operación y privacidad

- Se incluyen órdenes `waiting`, `working` y `ready`; se excluyen solicitudes sin llegada, canceladas y entregadas.
- Cada representación pública recibe un hash de presentación; ese valor no sirve como identificador para consultar una orden. Solo el backend utiliza el propietario para marcar la visita propia.
- Un máximo de cuatro carros en espera y tres listos se muestra en plazas separadas. Las visitas adicionales permanecen en los datos; no se apilan vehículos.
- Al seleccionar otro carro se consulta su categoría, estado y servicios, sin identidad del cliente. La cámara se acerca automáticamente.
- Los carros conservan su actor al actualizarse. Los cambios de posición se animan en secuencia, sin crear duplicados cada quince segundos.
- Los operarios y el agua aparecen en cubículos confirmados. Interior, pulido y revisión no activan espuma por defecto.
- Si falla la consulta se retiene la última observación y se muestra «sin conexión / último estado confirmado» en recepción.
- La demostración se activa expresamente y se mantiene separada de la operación guardada.

## Verificación y límites

Las pruebas cubren reglas de dominio, seguridad de perfil, restricciones SQL, categorías y escala de modelos, encuadres, selección con obstáculos, plazas sin superposición, tráfico serializado, conservación de actores y privacidad de la respuesta HTTP.

El navegador de revisión falla con «Error creating WebGL context». No se ha podido validar el acabado renderizado, los materiales en pantalla, los FPS ni la experiencia táctil completa. Las pruebas geométricas no sustituyen esa aceptación visual. Tampoco se ha confirmado la distribución física del establecimiento ni una integración con sensores: el reflejo operativo depende de los estados que registre el personal.
