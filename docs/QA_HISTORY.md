# Registro de diagnóstico — G0/G1

## Revisión visual actual — 23-10-2026

Reporte vigente: VISUAL_REVISION.md; galería real en `evidence/visual-revision/final`. Los apartados posteriores son historial.

- Exportación de Snow sustituida al demostrar pérdida de B-Bones/máscaras y reinicio de índices de materiales. Capturas previas conservadas; revisión final en navegador con ropa continua e iris/pupilas. No se considera acabado artístico completo.
- Primer E2E de esta fase: 13/15, con 503 mal clasificado y fixture operativo que avanzaba; fallos conservados y contratos corregidos. Segunda campaña: 15/15.
- Nueva prueba física del mostrador: una campaña 15/16 por coordenadas incompatibles con cámara centrada tras cerrar panel. Se conserva traza/captura; corrección del arnés, sin cambiar el producto para satisfacerlo. Campaña final: 16/16 en 2.5 minutos.
- Vitest final: 42/42, ocho archivos. Build aprobado con aviso de chunk grande. GLB: 26 archivos, 0 errores y 69 advertencias registradas.
- Las dos galerías finales recorren recepción, catálogo, orden, cola, lounge y cuatro tareas en escritorio/móvil, sin errores de página. Móvil es emulación, no dispositivo físico.

No se consideran aprobación artística los resultados de estas verificaciones.
Las imágenes fuera de `evidence/g1` son diagnósticos anteriores, no la entrega final.

| Intento / frontera | Fallo observado | Corrección del propietario | Resultado observado |
|---|---|---|---|
| Blender/contexto | select_all no disponible al abrir rig en modo Pose | Pasar a Object antes de construir copia | Exportación continúa |
| Materiales S1/S2/S3 | UDIM empaquetado/índice de textura inválido; luego preflight bloqueado | Sustituir mecanismo: nueva malla/objeto, materiales explícitos, imágenes RGB independientes y asignación UV por tile | Ocho GLB validados sin errores |
| Animación A1 | Figura con triángulos estirados en captura `first-reception` | Convertir matrices de pose a basis con matrices reales del padre e inherit_scale original | `bindfix-reception` elimina deformación extrema |
| Animación A2 | Sólo Service sobrevivía a la exportación | Conservar NLA entre acciones; no limpiar animation_data por clip | Idle/Greet/Talk/Service disponibles en ambos GLB |
| Runtime R1 | Troika rechaza WOFF2; paleta externa de SUV no disponible | TTF local con OFL; empaquetar GLB autosuficientes | Carga completa sin CDN de recursos |
| Test U1 | Vitest descubría tests de Playwright | Directorio unitario explícito en vitest.config.ts | 12 pruebas de contratos pasan |
| Test E1 | Timeout de recorrido con OpenGL forzado y carga gráfica alta | Usar backend predeterminado de Edge; simplificar y agrupar el auto; retirar capas físicas costosas | Recorridos de escritorio y móvil completos |
| Test E2 | Flujo completo pero consola con favicon 404 | Declarar icono de documento sin solicitud de archivo inexistente | Tres escenarios E2E pasan en servidor de desarrollo |
| Vista V1 | Poste ocultaba trabajador; saludo repetitivo y rígido | Mirador frontal/diagonal, sendero extendido y barandal fuera del foco; gesto corto con envolvente suave y LoopOnce | Capturas revisadas; saludo vuelve a Idle |
| Escala V2 | Bounding box conservadora de submallas rotadas reducía el auto | Bounds precisos de vértices antes de normalizar | Auto de tamaño coherente en captura de bahía |
| Fila V3 | Cartel nuevo delante de la cámara tapaba espacios | Mover cartel al borde occidental, detrás del observador | Nueva verificación de vista en campaña final |

Las métricas y capturas finales pertenecen a la campaña de producción local
(Vite preview). Playwright conserva video y reporte de cada escenario. Cualquier
fallo final debe mantenerse como fallo; no se cambia la expectativa para aprobarlo.

Límites restantes: manos/gestos requieren valoración humana, vegetación low-poly,
carro conceptual de muestra, equipamiento parcial y ausencia de integración real.

## Refinamiento A–D — 2026-10-23

Historia detallada: REFINEMENT_REPORT.md. Se preservan B1 (conversión de material), D2 (tareas incoherentes al avanzar en pausa), D3 (propiedad doble del transform y relojes de medición), A1 (caso de arnés demasiado amplio), overlay de carga y ancla del marcador. La campaña completa final pasa 9/9; 27 unitarias pasan. El marcador se comprueba nuevamente en C y con captura de escritorio/móvil tras su ajuste. NWS también responde desde navegador a un punto público de San Juan.

El arte continúa pendiente, sin afirmar aprobación por pasar pruebas. Las nuevas capturas no son imágenes generadas.

## 23-10-2026 — navegación comercial

Sustituye el contrato de caminata por cuatro vistas funcionales. La suite vigente es commercial.spec.ts; conservar desktop/mobile/refinement anteriores como historial, sin contarlas como pruebas actuales. Se probaron servidor DEMO, privacidad, idempotencia, cancelación, reconexión, controles móviles y ruedas. Fallos iniciales y causas están descritos en COMMERCIAL_EXPERIENCE.md; capturas/trace en evidence/commercial-polish/failures.
