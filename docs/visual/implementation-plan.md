# Plan de implementación visual por incrementos

Fuente: request-20261023.md. Primera entrega: Bahía 01. No se declara cerrado el SOW completo.

## Registro B01
- ID: B01
- Zona: Bahía 01
- Problema observado: prefab de estructura con uniones simples, drenaje elevado y manguera sin soporte lateral explícito; encuadre distante. Observaciones estáticas, pendientes de captura actual.
- Referencia aplicable: Polished Car Wash Operations UI-4.png.
- Componentes reales: src/world/prefabs/Architecture.tsx (WashBayPrefab/usePalette), WorldLayout.tsx, navigation/CameraController.tsx, navigation/layout.ts, src/ui/LocalAreaPanel.tsx; Model.tsx y registry.ts para equipamiento profesional.
- Cambio previsto: acabado modular con materiales aislados, soporte de equipo, drenaje integrado, encuentro de estructura, cámara y panel coordinados. Nuevo FinishedWashBay.tsx, sin duplicar escena.
- Funciones que deben conservarse: cinco IDs y asignaciones, ingreso posterior, tipos/identidad de vehículos, autoridad comercial, navegación, privacidad, llegada, precios y cotizaciones.
- Prueba de aceptación: vacío terminado y equipo apoyado; vehículo mayor cabe; barrido de entrada/salida sin intersecciones; panel coincide con estado; escritorio y móvil; coste antes/después bajo el mismo entorno.
- Evidencia antes/después: docs/evidence/bay01-refinement (por capturar); baseline complementaria reciente docs/evidence/diagnostico-ux-20261023/after-candidate-1.
- Estado: en curso
- Limitación pendiente: baseline final requiere estabilizar candidato vegetal concurrente para no confundir su coste con el cambio de bahía.

## Secuencia y contratos
AUDIT → captura baseline → FinishedWashBay piloto01 → cámara/panel → pruebas geométricas/operativas → comparación y rendimiento → extensión compartida tras criterios técnicos → aceptación artística pendiente.

Pseudocódigo: leer bayId/occupancy desde world; representar equipo y estado sin emitir comandos; usar mismas coordenadas operativas; aislar materiales propios; verificar en fixture DEMO identificado; rechazar atribución de rendimiento si recursos ajenos cambiaron entre capturas.

## Incrementos posteriores
B02 pavimentos/fila; B03 vegetación/fondo urbano; B04 recepción; B05 lounge; B06 continuidad UX/animaciones. Otros chats ya trabajan parte de esos incrementos: integrar su evidencia vigente, no sobrescribir ni afirmar que están terminados sin revisarla.
