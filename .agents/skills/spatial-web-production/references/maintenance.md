# Mantenimiento sin perder la experiencia

## Inventario y contratos

Leer entradas del bundler, rutas lazy, imports, scripts, pruebas, carga dinámica de modelos y recursos por URL. Un archivo sin imports entrantes puede ser entry point, herramienta ejecutable o contrato de pruebas. No borrar assets porque TypeScript no los importa.

Clasificar: activo, sin consumidores demostrados, histórico o incierto. Para retirar código, comprobar imports estáticos/dinámicos, referencias en scripts y pruebas, y uso por convención. Conservar evidencia y originales de recursos salvo petición explícita. Las exportaciones públicas necesitan análisis de consumidores, no solo `noUnusedLocals`.

## Organización

- Mantener configuración estándar que necesita descubrimiento automático en raíz; agrupar configuraciones auxiliares por herramienta o capacidad.
- Separar presentación DOM, mundo 3D, dominio y adaptadores de backend. Agrupar componentes por funcionalidad; separar hooks si tienen ciclo de vida propio.
- Prefabs reutilizables son objetos físicos completos con parámetros coherentes. Materiales compartidos son dueños de preparación/vida útil; los planes de área poseen posiciones y dimensiones.
- Evitar mover todo a `components/` o `utils/`: mezcla responsabilidades y oculta contratos.
- Al mover archivos actualizar imports, rutas relativas de tests, documentación operativa y scripts. No modificar relatos históricos para hacer parecer que se ejecutaron con rutas nuevas.

## Reutilización comprobable

Preferir extender una pieza existente si ya cumple el propósito. Extraer una capacidad cuando dos consumidores comparten reglas, no solo sintaxis.

Ejemplos: maceta con tierra y anclaje común; clonación de mapas PBR con sampler configurable; conexión de sesión con limpieza y recuperación; difusor cálido; iconografía de categorías. Mantener separados autorización, navegación y escena.

No crear una clase base universal por semejanza visual. Usar composición cuando varían material, tamaño o contenido de manera independiente. Para afirmar reutilización, ejecutar los dos consumidores o una sustitución de configuración relevante, comprobando también efectos de desmontaje.

## Formato y comentarios

Usar formateador/configuración del proyecto; añadirlo solo si el alcance incluye normalizar el formato. Excluir dependencias, bundles, capturas, bases, claves y recursos generados. Separar el diff mecánico del funcional para revisarlo.

Un bloque de imports, declaraciones relacionadas, hooks, acciones y render debe poder leerse por responsabilidades. Dejar una línea en blanco entre bloques y funciones, antes de retornos complejos y entre secciones de clase. No insertar una línea vacía después de cada propiedad o sentencia ni comentar `setBusy(true)` como «poner ocupado».

Comentar responsabilidad de módulos, APIs compartidas, unidades, restricciones, ownership de GPU, limpieza, orden de efectos y reglas no obvias. Conservar comentarios que expliquen decisiones reales. Verificar que los nuevos comentarios describen la implementación, no una intención no construida.

## Verificación

Para formato masivo comparar AST normalizado antes/después cuando sea viable; el formateador no debe cambiar cadenas, JSX ni control de flujo. Compilar, ejecutar unidad/integración y flujos de navegador afectados. La revisión de AST complementa las pruebas, no las sustituye.

Usar base temporal y cuentas sintéticas para E2E. No ejecutar suites históricas que mutan sesiones del usuario como simple comprobación de formato. Registrar fallo previo, fallo introducido y limitación ambiental por separado. Un archivo largo es señal para inspeccionar cohesión, no motivo para extraer decenas de componentes triviales.
