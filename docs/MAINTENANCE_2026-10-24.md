# Habilidad y mantenimiento — 24 de octubre de 2026

## Alcance y decisiones

Pedido: convertir el aprendizaje del proyecto en una habilidad reutilizable, ordenar raíz/componentes, normalizar formato y comentarios, eliminar lógica sin uso y extraer duplicaciones demostradas. Se conservaron flujos, permisos, SQLite, escenas activas, modelos, texturas y evidencia histórica. No se rediseñó la apariencia ni se cambiaron precios, rutas HTTP o migraciones.

Se añadió `spatial-web-production`, con instrucciones de reconstrucción visual, materiales PBR, escala, plantas, fondo, luz, cámara, interacción y mantenimiento. La fuente está en `.agents/skills/`; una copia idéntica se instaló en la biblioteca personal de Codex. El conocimiento específico de CarWash queda en una referencia separada. La habilidad guía decisiones; su validación de estructura no demuestra igualdad artística automática.

Se prefirió conservar los límites actuales y extraer capacidades pequeñas frente a crear una clase base universal o un nuevo framework. Cambios funcionales acotados:

1. `useCommercialSession` reemplaza la suscripción privada duplicada en `App`. Conserva SSE, polling, cleanup y el refresh de visibilidad particular de la escena completa.
2. `cloneSurfaceMaps` concentra clonación, color space y muestreo de mapas usados por suelo, recepción y lounge. Las opciones de cada superficie y la liberación de clones siguen perteneciendo al consumidor.
3. Se retiran seis módulos sin consumidores comprobados, el render vacío de inspección, el escritor JSON no usado y un callback muerto. El lector JSON de inicialización y la navegación de inspección sí se conservan.
4. Cuenta y administración se agrupan por componentes/hooks. Los imports se actualizaron según resolución de módulos.
5. Configuraciones auxiliares se mueven a `config/testing`. El runner raíz de Playwright ahora usa la suite aislada en 4175; el runner anterior sigue disponible como `playwright.legacy.config.ts`.

## Formato y documentación

Prettier 3.9.10 es una dependencia de desarrollo fijada. Se normalizaron fuentes TS/TSX, CSS, pruebas y herramientas JavaScript. Se añadieron espacios entre bloques y funciones, comentarios de responsabilidad y contratos compartidos. No se insertaron líneas vacías entre cada propiedad ni comentarios que repiten las asignaciones.

La revisión del grafo TypeScript y búsquedas de referencias distingue entradas de módulos sin consumidores; no es una prueba general de ausencia de carga dinámica. Se revisaron los candidatos retirados también en scripts y tests. El mapa está en [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

Se compararon 203 archivos modificados TS/TSX/MJS que conservan su ruta con el código emitido de HEAD: 189 resultan estructuralmente equivalentes al normalizar formato y segmentos contiguos de texto JSX. Los otros 14 corresponden a imports movidos, extracciones, limpieza y prueba nueva, revisados por separado. Esta comprobación no incluye CSS, archivos nuevos o movidos; compilación y navegador cubren sus conexiones. No se presenta como prueba formal de equivalencia de todo el sistema.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| Baseline `npm test` | 90 pruebas, 20 archivos |
| `npm test` después de extraer mapas | 91 pruebas, 21 archivos |
| `npm run typecheck` | Pasa con `noUnusedLocals` y `noUnusedParameters` |
| `npm run build` | Frontend y tipos pasan |
| `npm run build:server` | Bundle Node pasa |
| `npm run format:check` | Pasa |
| `node scripts/test-standalone.mjs` | HTTP, salud, JWT, logout replay, CSRF, Host y roles pasan |
| Cuatro E2E existentes | Pasan: login/logout, registro móvil, navegación y operación completa admin → cliente → empleado con reinicio SQLite |
| Nuevo E2E de sesión compartida | Pasa en reintento: misma cuenta desde `/` y `/world3d`, 20.2 s de ejecución |
| Contrato de mapas PBR | Comprueba clones independientes, canales, UV, rotación y que disponer un clon no dispone la fuente |
| `quick_validate.py` | Habilidad del repositorio e instalada válidas |
| `collect_context.py` actualizado | 52 propietarios presentes, 38 modelos identificados, 5 referencias encontradas |
| `git diff --check` con `cr-at-eol` | Pasa |

El primer E2E añadido falló porque buscaba «Mi cuenta» en una vista cuyo nombre accesible es «Abrir cuenta de Cliente compartido». La captura mostraba la cuenta correcta. Se corrigió el selector por entrada y se repitió solo ese recorrido; no se alteró la aplicación para satisfacerlo. Primer intento: cuatro recorridos pasaron y uno falló; reintento: uno pasó. Registros locales conservados en `.cache/maintenance-e2e-attempt1.log`, `.cache/maintenance-selector-failure.md` y `.cache/maintenance-e2e-retry.log`.

El validador de habilidades inicialmente no arrancó por ausencia de PyYAML en el runtime. Se instaló únicamente en `.cache/skill-validation-deps` y se ejecutó después correctamente; no es dependencia del producto.

## Límites y continuación

- La estructura, formatos y dos capacidades compartidas están corregidos; no se afirma haber eliminado toda duplicación posible. `demoApi` y `AdminEditors` siguen siendo propietarios amplios: cualquier división adicional debe preservar sus contratos y tener un motivo concreto.
- Las paletas diferenciadas, los formateadores de dinero con locales distintos y las escenas históricas aún alcanzables se conservan deliberadamente.
- No se ejecutaron exportadores Blender ni herramientas que reescriben assets. Se formatearon sus herramientas JavaScript, sin promover nuevos modelos o texturas.
- No se modificó la base activa, no se reinició 4173 y no se hizo publicación, commit ni push en este mantenimiento. Los cambios permanecen revisables en el working tree.
- La apertura del panel Visual Agent Live agotó el tiempo de espera. La validación técnica procede de los comandos y navegadores ejecutados, no de ese panel.
- Se mantienen los límites del MVP: Docker sin certificar, pagos/mensajería externos e IA pendientes. Este mantenimiento no cambia esa clasificación.
