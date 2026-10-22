# Auditoría de la experiencia 0.5

## Problema y cambio

La composición anterior mostraba numerosos objetos de selección en primer plano, un fondo extenso y un encuadre bajo. La nueva escena se organiza como un mapa de juego de simulación: predio delimitado sobre una base, puerta peatonal con apertura, ruta peatonal diferenciada, cinco cubículos y edificios con cubiertas desmontables. Se eliminan el paisaje distante y el pavimento de espejo completo. La paleta es mate, cálida, con rojo, gris, verde salvia y madera.

La cámara cruza el acceso y se eleva al mapa. Recepción se selecciona desde su estructura; el carro y los muebles de espera son objetos interactivos. Los expositores y controles de servicios quedan fuera de la composición general y se activan únicamente en esa zona. Las superficies de cotización y orden siguen siendo objetos del local. Inicio no contiene header, footer ni sidebar. Los controles de retorno y cuenta son pequeños elementos de utilidad.

## Componentes y responsabilidades

- `environment.ts`: arquitectura, zonas, acceso, señalización, cubiertas agrupadas y superficies transitables.
- `assets.ts`: caché/fábrica de mallas, cinco carrocerías independientes, pintura por actor y esqueletos independientes.
- `entities.ts`: movimiento y animación de carros y personas; cambio de apariencia conserva la ruta.
- `world.ts`: dirección de cámaras por intención, apertura del acceso, tráfico y proyección de estados confirmados. No cambia estados comerciales.
- `spatial-interface.ts`: superficies físicas seleccionables, foco progresivo y tableta proyectada para campos editables.
- `appearance.ts`: categorías y preferencias compartidas sin dependencias de renderizado o SQL.
- API/servicios/repositorios: autenticación, autorización, precios, estados, registros persistentes y preferencias propias.

## Estado real frente a demostración

La vista conectada utiliza una proyección limitada de los cubículos en servicio. No inventa visitas cuando el negocio está vacío ni expone identidad de otros clientes. Entrada/salida se animan al cambiar la ocupación observada; no constituyen detección física de un vehículo. El tráfico de demostración se activa expresamente. Los estados de la visita propia provienen del flujo de administración existente.

## Comprobaciones y límites

Se verifican categorías, dimensiones, ruedas, pinturas independientes, cambio de esqueleto sin pérdida de navegación, migraciones, conservación del perfil, privacidad de consultas, encuadres y selección con obstáculos. Los cuatro extremos del mapa caben en los encuadres de escritorio y móvil utilizados por las pruebas.

El navegador de revisión devolvió `GL_VENDOR = Disabled / GL_RENDERER = Disabled` el 22 de octubre de 2026. No fue posible revisar el acabado renderizado ni medir rendimiento gráfico. La aceptación visual y el recorrido autenticado completo siguen pendientes de un dispositivo con WebGL. No se afirma equivalencia visual exacta con las referencias conceptuales ni conexión con sensores físicos.
