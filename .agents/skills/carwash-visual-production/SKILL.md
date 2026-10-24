---
name: carwash-visual-production
description: Analiza y mejora composición, recursos Blender, cámaras e interacción del proyecto CarWash 3D existente mediante tomas comparables y especialistas con propietarios explícitos. Usar para su pulido visual y operativo, conservando autoridad comercial y aceptación artística separada.
---

# Producción visual de CarWash 3D

Trabajar sobre el establecimiento existente. Esta habilidad conserva conocimiento específico de `3D-Cars-Wash`; no impone su arquitectura a otros proyectos. Localizar la raíz antes de utilizar rutas relativas. Instalación habitual: `C:/Projects/Repos/3D-Cars-Wash`.

## Alcance y arranque eficiente

Elegir **analizar**, **preparar**, **implementar** o **validar** según la petición. En análisis no modificar producto ni exportar recursos. Crear agentes/habilidades no autoriza por sí solo cambios visuales. Las referencias no autorizan cambios de precios, marca, permisos o estados.

1. Leer `AGENTS.md`, `package.json`, Git y el dueño de la capacidad afectada. Conservar trabajo ajeno.
2. Consultar [propietarios](references/project-map.md), verificando rutas contra código actual. Leer `docs/design/visual-experience-sow.md` y `docs/design/reference-reconciliation.md` desde la raíz del repositorio para discrepancias entre imágenes.
3. Para una baseline compartida o cambios de recursos, ejecutar desde el repositorio `python .agents/skills/carwash-visual-production/scripts/collect_context.py --project <raíz> --output <archivo-nuevo.json>`. En análisis acotado basta leer los dueños afectados; no es obligatorio identificar todos los GLB. `--references <carpeta>` localiza las cinco imágenes. El helper no lee secretos ni cambia producto; su éxito no aprueba la estética. Comprobar que Python funciona; un alias de Microsoft Store no es un intérprete. Puede usarse el runtime incluido que expone load_workspace_dependencies, sin instalar Python.
4. Abrir referencia y captura real de la misma vista. Una captura histórica requiere reproducción antes de atribuirle una causa actual. Imágenes conceptuales nunca prueban ejecución.
5. Aplicar `universal-modular-architecture`, `threejs-interaction` y `ui-ux-pro-max` cuando correspondan. Cargar solo la habilidad Three.js pertinente al renderer/rig/luz. No duplicar manuales ni instalar dependencias para coordinar.

## Unidad de trabajo: toma + estado + acción

Usar [contratos visuales](references/visual-contracts.md). Cada ficha incluye referencia, viewport, estado de usuario/orden, cámara, sujetos visibles, panel, acciones, errores, evidencia y diferencias. Cámara, panel, props y luz se evalúan juntos.

Primero resolver recepción y catálogo; después una bahía con mano/herramienta/vehículo visibles; integrar entrada/lounge con las mismas piezas y cerrar estados/móvil. Una petición acotada trabaja solo la toma afectada.

Antes de cambios sustanciales publicar Mermaid y pseudocódigo compactos, propietario, archivos, invariantes, entrada/salida, pruebas y rollback. Preferir extender módulos actuales; un contrato pequeño compartido puede servir a cámara + UI + pruebas, sin motor genérico nuevo.

```text
leer solicitud y estado real; elegir alcance
seleccionar toma/estado; inspeccionar referencia y captura real
definir exposición del sujeto, panel, acciones y responsables
si análisis: entregar hallazgos y contrato sin modificar producto
si implementación autorizada:
    preservar baseline; cambiar en el dueño existente
    validar candidatos de recursos antes de promoverlos
    probar recorrido, toma y negativos pertinentes
comparar mismo viewport/estado/luz/recursos; conservar divergencias
entregar validación técnica y aceptación artística separadas
```

## Especialistas

Usar `.codex/agents/carwash_*.toml` y [coordinación](references/specialists.md). Delegar cuando esté autorizado por petición o instrucciones aplicables, solo tareas independientes. El coordinador integra. No crear chats nuevos ni otro framework de agentes.

Asignar objetivo, modo, toma, archivos, contrato, salida y evidencia. Un escritor por archivo o recurso compartido; otros proponen cambios al dueño. Limitar concurrencia a capacidad real. QA no concede aceptación artística de su propia implementación.

## Invariantes

- Una escena continua, navegación breve por áreas, sin exigir caminar o jugar.
- Cuatro destinos: Recepción, Mi orden, Mi vehículo, El local; conservar borrador/orden al navegar.
- Operación vacía por defecto sin clientes. Vehículos proceden de entidades; fixtures explícitos y rotulados DEMO, nunca rellenar bahías para imitar imágenes.
- Proveedor/dominio existentes gobiernan cotización, confirmación, llegada, tareas, pago y entrega. Cámara, clips y partículas solo representan estado.
- Exploración pública muestra ocupación sin datos privados de otros clientes.
- Marca y contenido configurables prevalecen sobre FEBLES escrito en referencias. No inventar tarifas, horarios, perfiles, descuentos o envíos.
- Conservar Three.js/R3F/Drei y modelos profesionales vigentes, cuatro categorías Innerscene. No recuperar PixiJS o vehículos/personajes SVG descartados.
- Geometría modular sencilla permitida por el SOW vigente para estructura; no reemplazar personajes, vehículos, vegetación orgánica o herramientas cercanas por bloques.

## Blender y coste

Leer [pipeline Blender](references/blender-pipeline.md) antes de adaptar. Comprobar una vez conexión y escena activa antes de operar Blender del usuario. Si no conecta, informar y continuar inspección de archivos o CLI sobre copias autorizadas; no afirmar inspección en vivo.

Algunos exportadores escriben GLB activos y respaldos: no ejecutarlos como diagnóstico. Candidatos únicos, originales protegidos, licencia/anclajes documentados, validación glTF y revisión en navegador antes de promoción. Un GLB válido no prueba calidad artística.

Medir CPU/GPU, joints, canales, memoria, draw calls y tiempos cuando corresponda. Menos draw calls no demuestra más FPS. Resolver composición, escala y contacto antes de posprocesado o partículas.

## Evidencia y cierre

Usar herramientas existentes: `npm test`, `npm run build`, E2E pertinentes, `scripts/validate-assets.mjs` según cambio. Para análisis/documentos no repetir toda la suite ni presentar resultados históricos como pruebas nuevas.

Playwright real, escritorio 1440×900 y móvil 390×844; anchos intermedios si cambia layout. Registrar fixture, hora/clima, fase del gesto y panel. Si no se pueden fijar, declarar comparación aproximada. No suponer que desactivar animaciones CSS congela Three.js.

Revisar video/fotogramas de saludo/trabajo, oclusiones, foco/teclado, touch ≥44 px, cierre/retorno y consola. Clip activo o clic correcto no prueban naturalidad/agarre. Verificar productor de `diagnostics.sightLines` antes de confiar en él.

Entregar cambio/conclusión, evidencia, diferencias, fallos y siguiente incremento. Aceptación artística humana pendiente hasta decisión; validación técnica no la sustituye.
