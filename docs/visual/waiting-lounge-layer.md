# Fase 05 — terraza de espera y componentes compartidos

## Alcance y propietarios

- `WaitingLoungeLayer`: arquitectura y mobiliario sobre el deck existente de 7,3 × 5,6 m, centro (-13,15; 7,5). Se monta en recepción y `?layer=lounge`. `?layer=reception&lounge=off` desactiva el conjunto añadido. Ground y landscape aislados no lo montan.
- `loungePlan`: configuración de muebles, acceso, observación y ruta por acera. El recorrido no cambia la circulación de vehículos.
- `Planter` / `PottedPlant` en `src/world/prefabs/Planter.tsx`: propietario compartido de recipiente, borde, pared interna, tierra, áridos y anclaje botánico. Recepción y lounge son dos consumidores del mismo componente. No hay una copia por área. Tamaño de recipiente, altura de planta, especie, orientación y posición son parámetros; el suelo interior determina automáticamente la altura de plantación. Los 22 áridos se dibujan con una instancia agrupada por recipiente.
- `useReceptionMaterials` y `WarmPendantLens`: los mismos acabados de madera/metal y difusión cálida utilizados por recepción. Mapas clonados por propietario; los activos almacenados en caché no se recolorean globalmente.
- Textiles: mapas locales existentes `public/textures/lounge/`; se usan relieve y rugosidad, sin el albedo a cuadros que no coincidía con la referencia. No se afirma procedencia/licencia no documentada.
- `LoungeConsultation`: estación y consulta opcional; información resumida visible, detalle cerrado por defecto. No crea órdenes ni avanza tareas.
- `loungeStatus`: une exclusivamente el identificador de la orden privada a la proyección operativa compartida. Posición/órdenes anteriores siguen la cola del servidor; una orden sin llegada no recibe turno inventado.

## Contratos conservados

`useOperations` observa la misma operación que bahías. `useCommercialSession` aporta la sesión privada. La interfaz no deriva estados de una animación ni genera otra simulación. Los visitantes consultan; el personal confirma llegada, asignación, tareas y entrega.

Finalizar tareas no equivale a estar listo para retirar. La recogida se anuncia únicamente en `handover`, sin movimiento pendiente. Se muestra pago pendiente y comprobante no disponible porque el contrato actual no emite comprobantes. No hay SMS, correo ni cobro real.

Los servicios/ofertas/horarios se reutilizan desde `LoungeContent` y la configuración real. La cola muestra alias públicos e iconos; no expone identificadores comerciales de otros clientes. El aviso de fin se conserva en la orden privada y puede reabrirse desde la consulta. La notificación emergente existente se descarta una sola vez por pestaña.

## Verificación

Evidencia real en `docs/evidence/phase05`. Las primeras capturas conservan los hallazgos (tapicería a cuadros, cabecera móvil solapada) y las posteriores documentan las correcciones. Los resultados de las pruebas, rendimiento y limitaciones se registran en `results.md` al terminar. La referencia artística no queda aprobada automáticamente por compilar.

## Refinamiento UI/UX — 24 octubre 2026

La geometría de cojines y brazos se comparte entre sofá y sillones en LoungeFurniture; colores lino, oliva, terracota y metal. El tablero expone centro/espesor en loungePlan para apoyar la maceta sin offsets independientes. La especie de esquina es warmShrub con tallos, no warmGroundcover.

El terminal mantiene un botón CSS de al menos 44 px sin escala por distancia. La cámara usa roundLoungeRoute en el pasillo delantero y FOV interpolado; reduced-motion llega inmediatamente. Los indicadores ya no desaparecen por ancho de pantalla. Evidencia y resultados de esta revisión: docs/evidence/reception-information/results.md.
