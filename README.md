# Febles · Car wash virtual

Versión 0.5 de una tienda 3D animada con cámara dirigida por intenciones. Three.js, React/TypeScript, API por capas y SQL D1.

## Recorrido

Selecciona recepción, identifica tu vehículo, elige servicios sobre sus objetos 3D y revisa la cotización. La cámara y los personajes realizan los recorridos automáticamente. El home muestra tu carro y el estado de la visita; el ambiente incluye operarios, agua, espuma, vehículos entrando y saliendo y vegetación animada. El recorrido de demostración no crea registros. El acceso autenticado permite guardar solicitudes; el administrador confirma llegada, cubículo, tareas, cobro manual y entrega.

## Desarrollo

Usar Node 22 o superior y pnpm con el archivo de bloqueo. `pnpm dev` inicia el proyecto fuera del entorno administrado. `pnpm test` comprueba reglas y restricciones. `pnpm exec tsc --noEmit` valida tipos. Los scripts incluidos preparan compilación, enlaces SQL y autenticación del alojamiento.

La base local y la publicada son independientes. Se deben aplicar las migraciones SQL de `drizzle/` en orden. No guardar credenciales en el código. La configuración administrativa `ADMIN_EMAILS` pertenece al entorno del servidor.

## Límites de V1

Precios ilustrativos; no cobros electrónicos, OTP por correo, respaldo certificado ni garantía automática. La autenticación actual usa el acceso seguro del alojamiento. Inspección visual de navegador y flujo autenticado completo pendientes por bloqueo del navegador de pruebas.

Consulta `ARCHITECTURE.md` para contratos, decisiones, seguridad, fuentes y siguientes incrementos. Los recursos visuales externos incluyen sus licencias CC0 dentro de `public/models/`.

## Experiencia y verificación

`AUDIT-V0.5.md` documenta el nuevo mapa de simulación y la aceptación pendiente. La escena usa modelos GLB detallados de vehículos, humanos con animación esquelética, sofás y palmeras. No se utilizan imágenes de fondo para simular el mundo. Las referencias conceptuales orientan el encuadre y los materiales; la equivalencia visual todavía requiere revisión humana sobre WebGL.

Los nueve modelos de ejecución suman 10,70 MB. Meshopt comprime la geometría y WebP reduce las texturas. Los vehículos conservan cuatro ruedas animadas y pintura independiente; el mundo agrupa su geometría por material. Fuentes y licencias: `public/models/studio/NOTICE.md`.

`pnpm test` verifica dominio, SQL, rutas, decodificación de los GLB reales, escala, esqueletos independientes, animación sin deriva y presupuesto de recursos. El navegador de pruebas tiene WebGL deshabilitado; estas comprobaciones no sustituyen la aceptación visual ni la medición en móviles reales.

## Interfaz dentro del local

Recepción se maneja con una brújula, un carro en miniatura y un documento sobre el mostrador. Los servicios se eligen en sus expositores. Cotización, orden y garantía usan tablillas 3D; los datos del carro se editan en una tableta CSS3D. No hay paneles de cliente superpuestos al mundo. Los encuadres están centralizados en `lib/world/shots.ts` y la selección respeta obstáculos y objetos ocultos.

Las ocho referencias se revisaron directamente. Se documentan las diferencias artísticas y la aceptación visual pendiente en la auditoría; no se afirma una réplica exacta ni se utilizan las ilustraciones como fondos.

## Mapa de simulación 0.5

La visita comienza en una puerta física. Al seleccionarla se abren las hojas, el personaje entra y la cámara pasa al mapa del local. La vista general utiliza cubiertas desmontables para mostrar los cinco cubículos, recepción y sala de espera. No hay navegación libre por ejes. Los expositores aparecen al elegir servicios y no ocupan el mapa inicial.

Los modelos de sedán, SUV, pickup de caja abierta, compacto hatchback y van son carrocerías distintas. El contrato `lib/appearance.ts` comparte las categorías entre la API, la tableta y la fábrica de actores. El personaje hombre/mujer se elige expresamente: se conserva como borrador en la sesión del navegador y en SQL para una cuenta autenticada. No se infiere a partir del nombre, correo ni fotografía. El cambio de personaje conserva posición y ruta.

`GET /api/local` entrega una proyección de los cubículos con trabajo confirmado, tipo/color de vehículo y tarea activa. No expone nombres, tablillas, identificadores de órdenes ni cuentas de otros clientes. Se actualiza cada 15 segundos. Los datos recibidos dirigen la ocupación y las transiciones de entrada/salida; la llegada física sigue siendo confirmada por el personal. La recepción distingue datos conectados, datos sin sincronizar y demostración. La demo explícita ejecuta tráfico ambiental sin modificar órdenes reales. Este sistema no detecta vehículos mediante cámaras ni sensores.

`PATCH /api/profile` requiere identidad, mismo origen y JSON validado. Usa únicamente el usuario autenticado para guardar su personaje. La migración 0003 añade una preferencia nullable sin alterar visitas existentes.
