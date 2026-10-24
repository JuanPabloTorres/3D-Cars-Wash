# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: commercial.spec.ts >> Los cuatro objetos del mostrador abren funciones reales sin perder selección
- Location: tests\e2e\commercial.spec.ts:12:1

# Error details

```
Test timeout of 90000ms exceeded.
```

# Page snapshot

```yaml
- 'main "CarWash Studio: visita tridimensional" [ref=e3]':
  - generic:
    - generic:
      - text: CarWash Studio · DEMO
      - generic: Simulación conectada
  - generic [ref=e11]:
    - button "Visitar" [ref=e12] [cursor=pointer]
    - button "Estado de mi orden" [ref=e16] [cursor=pointer]:
      - generic [ref=e20]: Mi orden
    - button "Cómo funciona" [ref=e21] [cursor=pointer]
    - button "Abrir cuenta de Visitante" [ref=e27] [cursor=pointer]:
      - generic [ref=e28]: VI
    - button "Ayuda de la visita" [ref=e32] [cursor=pointer]
  - button "Entrada · Recepción" [ref=e36] [cursor=pointer]:
    - text: Entrada
    - generic [ref=e39]: · Recepción
  - dialog "Ana · Recepción" [ref=e40]:
    - generic [ref=e41]:
      - generic [ref=e42]:
        - text: ATENCIÓN · ENTORNO DEMO
        - heading "Ana · Recepción" [level=2] [ref=e43]
      - button "Cerrar Ana · Recepción" [ref=e44] [cursor=pointer]
    - generic [ref=e48]:
      - paragraph [ref=e49]: El cuidado que tu auto necesita.
      - generic [ref=e50]:
        - text: Tarifas por vehículo
        - combobox "Tarifas por vehículo" [ref=e51]:
          - option "Carro" [selected]
          - option "Pickup"
          - option "Truck"
          - option "SUV"
      - paragraph [ref=e52]: Selecciona uno o varios servicios. Precios DEMO en USD para Carro. Imágenes ilustrativas del servicio.
      - generic [ref=e53]:
        - article [ref=e54]:
          - 'img "Ilustración: Cuidado de la carrocería, rines y cristales." [ref=e55]'
          - generic [ref=e56]:
            - heading "Lavado exterior" [level=3] [ref=e57]
            - generic [ref=e58]: $35.00 DEMO
          - paragraph [ref=e59]: Cuidado de la carrocería, rines y cristales.
          - generic [ref=e60]:
            - button "Ver detalles" [ref=e61] [cursor=pointer]
            - button "Quitar Lavado exterior" [pressed] [ref=e62] [cursor=pointer]: Añadido
        - article [ref=e65]:
          - 'img "Ilustración: Aspirado y limpieza de superficies interiores." [ref=e66]'
          - generic [ref=e67]:
            - heading "Cuidado interior" [level=3] [ref=e68]
            - generic [ref=e69]: $20.00 DEMO
          - paragraph [ref=e70]: Aspirado y limpieza de superficies interiores.
          - generic [ref=e71]:
            - button "Ver detalles" [ref=e72] [cursor=pointer]
            - button "Añadir Cuidado interior" [ref=e73] [cursor=pointer]:
              - generic [ref=e74]: +
              - text: Añadir
        - article [ref=e75]:
          - 'img "Ilustración: Evaluación y tratamiento de las ópticas." [ref=e76]'
          - generic [ref=e77]:
            - heading "Cuidado de focos" [level=3] [ref=e78]
            - generic [ref=e79]: $10.00 DEMO
          - paragraph [ref=e80]: Evaluación y tratamiento de las ópticas.
          - generic [ref=e81]:
            - button "Ver detalles" [ref=e82] [cursor=pointer]
            - button "Añadir Cuidado de focos" [ref=e83] [cursor=pointer]:
              - generic [ref=e84]: +
              - text: Añadir
      - generic [ref=e85]:
        - generic [ref=e86]: 1 servicios seleccionados
        - button "Continuar" [ref=e87] [cursor=pointer]
      - button "Volver" [active] [ref=e90] [cursor=pointer]
  - generic [ref=e93]: Recepción abierta.
```