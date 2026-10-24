# Blender → GLB → Three.js

Revisar inventario vigente `docs/ASSET_INVENTORY.md` y `public/ASSET_LICENSES.txt`, distinguiendo históricos. No ejecutar un pipeline descartado por su nombre genérico.

Blender observado instalado en `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe`; descubrir ruta si cambia. Comprobar conexión/addon y escena/archivo/selección/modo/guardado antes de modificar Blender abierto. Fallo MCP no prueba falta de instalación. Fuentes profesionales locales en `C:/Projects/Assets/Febles-G1-20261023` y `Febles-Visual-Revision-20261023`; comprobar disponibilidad/licencia. Para incorporaciones nuevas verificar condiciones oficiales vigentes. No compras/generación de pago por defecto.

| Recurso | Contrato actual |
|---|---|
| Mundo | Metros, Y arriba, vehículos +Z adelante; verificar transformación Blender en GLB |
| Innerscene | Cuatro categorías CC0; Body, WindowFrontL, WheelFrontL/R, WheelRearL/R; truck ruedas posteriores adicionales |
| Escala | VehicleAppearance limita uniformemente a largo 6.15 m, ancho 2.52 m, alto 2.35 m; verificar proporción/gálibo |
| Personal | SkeletonUtils.clone y apoyo al suelo; StaffPrefab altura 1.72/1.78 m; no doble normalización |
| Rain | Idle, Greet, Talk, Service, PointServices, PointOrder |
| Snow | Idle, Greet, Talk, Service, ServiceInterior, ServiceLights, ServiceInspect |
| Herramienta | StaffTool usa DEF-Wrist.R/DEF-WristR y grip (0,.07,0); punta estimada según tarea. Comprobar contacto real |
| Animación | NPCAnimationController único mixer; gestos puntuales y crossfade; cero mutaciones comerciales |
| Materiales | staff_materials convierte UDIM, sin TILED/imágenes vacías. Comprobar UV/alpha/normales/PBR en renderer |

Medidas GLB leídas el 23-10-2026: Rain 876 joints/2,628 canales por clip; Snow 1,844/5,529. No son presupuestos universales. Medir mixer/deformación antes de simplificar pesos/rig. Exportador actual elimina shape keys y no exporta morphs: Talk no implica visemas o expresión facial.

## Efectos de scripts existentes

- prepare-sow-receptionist.mjs sobrescribe backup receptionist-before-pointing.glb al repetirse.
- optimize-staff.mjs escribe GLB activo directamente.
- prepare-innerscene-vehicles.py y pack-revision-props.mjs publican activos.
- export-staff.py --output separa candidato pero escribe preflight externo compartido.

No usarlos como comandos de diagnóstico. Aislar TODOS los destinos antes de ejecutar un trabajo autorizado.

## Entrega de candidato

1. Directorio único por intento; originales/.blend abierto/respaldos preservados. CLI sobre copias con --background --disable-autoexec.
2. Manifest de fuente/hash/autor/licencia/versiones/comando, ejes/unidades/bounds, nodos semánticos, materiales/texturas, joints/clips/duración/triángulos/bytes.
3. Validar glTF conservando warnings; revisión frontal/lateral y en navegador con condiciones iguales. Exportación válida no demuestra calidad.
4. Fotogramas de saludo/reposo/reentrada, mano/grip/boquilla/superficie; pausa/pestaña oculta/reduced motion cuando aplique.
5. Integrador promueve candidato identificado con backup inmutable/rollback; actualiza procedencia/evidencia. Renombrar joints/ruedas exige revisar consumidores.

Prioridad: composición, escala, actuación y materiales coherentes con recursos existentes; no acumular modelos.
