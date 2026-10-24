# Aplicación del diagnóstico visual y UX

Solicitud: aplicar `Febles_Diagnostico_Visual_UX.md` al proyecto existente.
Fecha de trabajo: 23 de octubre de 2026, America/La_Paz.
Estado: EN CURSO; los cambios escritos no se consideran verificados por compilar.

## Base y límites

- Repositorio con una migración extensa sin confirmar. No se restauraron, eliminaron ni confirmaron archivos ajenos.
- Informe original conservado en Downloads. Su descripción histórica se contrastó con código y navegador actuales.
- Sesiones de captura aisladas: sin órdenes ni vehículos ficticios añadidos. Viewports 1440×900 y 390×844; clima inicial soleado. Las fases de animación no son idénticas entre capturas.
- `context-before.json` identifica propietarios y recursos; no certifica ejecución.
- Antes de cambios: `npm test`: 12 archivos, 59 pruebas aprobadas.
- Reproducción UX01/02 en navegador móvil: revisión con scrollTop 186.39999 y elemento activo BODY.
- `before-entry.png` y `before-reception.png`: estado previo a las correcciones UX. `before-scene/`: correcciones UX ya incorporadas, acabados 3D todavía anteriores.
- Hay otros chats sobre el mismo checkout. Se verificó autorización humana previa para coordinar sin sobrescribir; cada revisión servida debe identificarse antes de pruebas/capturas. No se atribuyen sus resultados a este incremento.

## Contrato y propietarios

Se extienden los módulos actuales. No se agrega un motor de navegación, estado comercial, respuestas de IA ni proveedor. Un nuevo sistema paralelo fue descartado por duplicar responsabilidades. No hay migración de datos ni cambio de API.

| Nodo | Propietario | Contrato | Aceptación |
|---|---|---|---|
| D | ReceptionDialogue | La transición cambia el paso y conserva selección y vehículo | Catálogo → vehículo → revisión → volver mantiene datos |
| P | WorldPanel | Cambio de contexto reinicia scroll y enfoca título; refresh no interrumpe lectura | Scroll 0 y foco en título en cada transición |
| R/C | commerceStore + servidor | Cotización vigente, autorización explícita y una sola orden activa | No confirma una segunda orden; errores preservan borrador |
| Q/A/F/S | BusinessQuestions + configuración | Sin canal no ofrece escritura; con canal requiere revisión, confirmación y recibo | Sin respuesta semántica anticipada ni éxito fabricado |
| N/Z/V | WorldHUD + LocalAreaPanel + CameraController | El local elige zona; cámara representa un destino | Lounge accesible sin visitar una bahía |
| O | OrderStatusCard + LoungeExperience | Llegada y siguiente paso corresponden al servidor | No busca un vehículo inexistente ni anticipa llegada |

Invariantes: marca y contenido configurables, tarifas existentes, privacidad por sesión, cinco bahías vacías cuando no hay vehículos, borrador conservado, operación gobernada por servidor. Los cambios de cámara/material no alteran rutas, estados ni autorizaciones.

Reversión: revertir exclusivamente los bloques de este incremento, usando las diferencias registradas; no usar reset del checkout compartido. No revertir recursos o geometría de otros chats.

## Registro de hallazgos

| IDs | Cambio / decisión | Estado actual |
|---|---|---|
| UX01, UX02 | WorldPanel gestiona foco y scroll al cambiar paso y retorna al control al cerrar | Transiciones verificadas en UX attempt-2; retorno de CTA recreado se amplió después para la suite final |
| UX03, UX18, UX19 | Cabecera móvil compacta; breadcrumb se oculta con panel/menú; targets mínimos 44px | Verificado a 320/390/650/768px en UX attempt-1 |
| UX04, UX05 | Consulta al personal separada de respuestas informativas; sin canal no hay textarea | Sin canal verificado en UX attempt-1; canal habilitado pendiente de regresión final |
| UX06 | Sin entidad propia no traslada cámara ni anuncia búsqueda | Orden pendiente verificada en UX attempt-1; atención se cubre en regresión final |
| UX07, UX08 | El local abre selector de zonas; nombres de lugares y lounge consistentes | Selector y acceso directo al lounge verificados en UX attempt-1 |
| UX09 | Ayuda única con navegación y guía de servicio | Escape, retorno y contenido verificados en cuatro anchos |
| UX10 | CTA de reapertura contextual | Implementado; comprobar por área |
| UX11 | Servicios → Vehículo → Revisión con aria-current y títulos | Recorrido con teclado aprobado en UX attempt-2 |
| UX12, UX13 | Estado/acción de llegada más compacto en orden y lounge | Implementado; medir contenido sobre pliegue |
| UX14 | El servidor rechaza otra orden activa; revisión lo explica y bloquea confirmación | Verificado en UX attempt-1 sin modificar la orden existente |
| UX15 | Singular/plural de servicios | 0/1/2 verificados en navegador |
| UX16 | Horarios priorizados; ausencia de horario/contacto explícita | Implementado; datos reales siguen sin configurar |
| UX17 | Fila y bahías usan lenguaje del establecimiento | Implementado |
| UX20 | Escala secundaria y controles ampliados | Implementado; revisar overflow/zoom |
| UX21 | Saludo corresponde a llegada y atención | Llegada pendiente verificada en UX attempt-1 |
| V01 | Asfalto con textura existente, normal y grano en escala métrica | Implementado y comparado en candidate-1/2 |
| V02 | Entorno urbano con volumen, tres batches y cielo compartido | Implementado; no se declara fidelidad artística a una fotografía |
| V03–V05 | Recursos vegetales, anclaje real y masas sobre tierra | Integración del chat de naturalización; candidato 1 rechazado por copa escasa, candidato 2 mejoró cobertura pero requiere revisión final |
| V06 | Intradós de madera mate, sin rojo brillante inferior | Verificado en capturas de recepción/lounge candidate-2 |
| V07, V10 | Props secundarios a escala .72, HTML sin escala y etiquetas compactas | Implementado; targets/foco en cuatro viewports pendientes de regresión final |
| V08, V09 | Listones menos profundos, respaldo cálido y marca frontal legible; contexto del local detrás | Comparado en recepción candidate-2, sin contacto inventado |
| V11, V16 | Tejido normal sutil y familia de acabados/luz cálida | Implementado; aceptación artística abierta |
| V12 | Cámara lounge conserva mesa/asiento/recepción y estructura real | Comparado con panel abierto/cerrado, desktop/móvil |
| V13, V14 | Señalización y acceso de bahía | Integración del incremento Bahía 01 en otro chat; se detectó interferencia de truck en reversa con pared posterior, no entrada frontal |
| V15 | Cámara longitudinal de fila desde paso peatonal existente | Fuente lista; captura final pendiente |
| V17 | Catálogo limitado a 42vw/620px con Ana visible | Verificado visualmente en desktop candidate-2 |
| V18 | Cuidados con ilustración y detalles ampliables compartidos | Implementado; comprobación de apertura añadida a regresión lounge |
| T01 | PCFSoftShadowMap sustituido por PCFShadowMap compatible con r186 | Sin aviso de sustitución en candidate-1/2; sombras preservadas |
| T02 | Clock creado por @react-three/fiber; aviso de precisión del compilador gráfico | Localizado parcialmente; no modificar dependencias para silenciar avisos |

## Verificación

- Build posterior al grupo UX: aprobado; advertencia de chunk grande conservada.
- TypeScript después de ajustes UX: aprobado.
- `tests/e2e/diagnostico.spec.ts`: UX attempt-1 terminó 6 aprobados / 1 fallido. La divergencia fue el selector de prueba `getByLabel('Color', exact)`: el snapshot mostraba el combobox Color. Se corrigió a role combobox y UX attempt-2 aprobó el caso restante sin cambiar producto.
- Los siete casos tienen evidencia favorable sobre candidate-1. La regresión final repetirá la revisión integrada con los últimos cambios de retorno al CTA.
- Capturas candidate-1 y candidate-2: 14 vistas por tanda, recursos estables por hash y entradas HTTP verificadas; ninguna excepción de página.
- No hay linter ni formateador configurado en scripts; se mantiene estilo existente y revisión acotada de responsabilidades, hooks, efectos y accesibilidad.
- Pendiente: prueba integrada de la revisión final estable, capturas finales, comparación visual, dispositivos físicos, lector de pantalla y aceptación artística humana.

## Incidentes preservados

- Alias `python` de Microsoft Store no disponible; se utilizó el intérprete incluido en el runtime sin instalar dependencias.
- Puerto 4173 no respondía al iniciar esta tarea; se abrió servidor dev. Otros chats esperaban preview. Se registró la divergencia, se detuvo trabajo GPU/build propio y se autorizó al propietario compartido a sustituir el listener por una revisión identificable.
- No se puede certificar un build por los hashes de dist si el navegador recibe módulos de desarrollo. Los resultados de otros chats permanecen en sus informes.
