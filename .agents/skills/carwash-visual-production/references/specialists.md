# Especialistas y coordinación

Perfiles `.codex/agents/carwash_*.toml`: agentes persistentes de proyecto, no procesos permanentes. Heredan modelo/permisos/MCP del padre. Si la herramienta no permite elegir perfil por nombre, leer el TOML y pasar sus instrucciones manualmente, declarando ese uso. No afirmar descubrimiento automático sin recibo.

| Perfil | Área | Límite |
|---|---|---|
| carwash_architecture | Propietarios/contratos/integración | Solo lectura en auditoría |
| carwash_scene | Cámaras, layout, materiales/luz | world/navigation, WorldLayout, siteLandscape, Architecture/Landscape/EntranceForecourt/LoungePrefab, environment; sin comercio |
| carwash_blender | Recursos/rigs/actuación | Scripts delimitados, candidatos y manifiestos; sin promoción activa por defecto |
| carwash_interaction | Paneles/props/accesibilidad | ui, reception, CounterObjects; preservar estado/acciones |
| carwash_validation | Evidencia independiente/regresión | Tests/evidence asignados; sin reparar producto o aprobar arte |

Asignar objetivo/modo, toma/estado/viewport, contexto mínimo, archivos permitidos, entrada/salida/consumidor, invariantes, dependencias y verificación. Delegar solo con autorización y concurrencia disponible.

Un escritor por CameraController, WorldLayout, registry, CSS, GLB o escena Blender. Otros agentes entregan propuestas al dueño. Lecturas independientes pueden paralelizarse; integración/promoción son secuenciales. No crear chats nuevos.

Las seis responsabilidades del establecimiento no requieren seis perfiles nuevos:
dirección del mundo corresponde al coordinador; escena y ambiente a `carwash_scene`;
personajes y movimiento a `carwash_blender`, coordinado con rutas/prefabs existentes;
operación y sincronización a `carwash_architecture`; UX espacial a
`carwash_interaction`; evidencia independiente a `carwash_validation`.
UI Pro Max apoya controles, formularios, tipografía y accesibilidad; la dirección
del entorno procede de las referencias reconciliadas y los contratos por toma.
Cuando varios chats humanos ya autorizados comparten checkout, acordar también
un único dueño de build/preview y una cola explícita para navegador/E2E. No lanzar
otra captura basándose en silencio o en que terminó un log anterior: esperar la
liberación del dueño de la ejecución vigente y conservar cualquier solapamiento.

Interacción entrega cajas proyectadas/espacio de panel al dueño de cámara, no una cámara paralela. Blender coordina joints/anclajes con StaffPrefab. Cada retorno incluye hechos/rutas, cambios autorizados, comandos ejecutados, evidencia e incertidumbre. QA no sustituye aprobación artística.

Evaluar la habilidad con petición realista y fuentes mínimas en agente independiente. Comprobar dueños, alcance y separación hecho/propuesta. Preservar fallos antes de corregir instrucciones.
