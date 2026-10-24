# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lounge.spec.ts >> Lounge móvil: hoja de 58%, contenido legible y vehículo ajeno nunca seleccionado
- Location: tests\e2e\lounge.spec.ts:111:1

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
  - generic [ref=e7]:
    - button "Visitar" [ref=e8] [cursor=pointer]
    - button "Abrir cuenta de Visitante" [ref=e12] [cursor=pointer]
    - button "Ayuda de la visita" [ref=e16] [cursor=pointer]
  - dialog "El local" [ref=e20]:
    - generic [ref=e22]:
      - generic [ref=e23]:
        - text: OPERACIÓN ILUSTRATIVA · DEMO
        - heading "El local" [active] [level=2] [ref=e24]
      - button "Cerrar El local" [ref=e25] [cursor=pointer]
    - generic [ref=e29]:
      - paragraph [ref=e30]: Elige una zona del local.
      - generic [ref=e31]: 0 disponibles · 1 en espera
      - generic [ref=e35]:
        - button "Lounge · Sala de espera" [ref=e36] [cursor=pointer]
        - button "Fila de espera" [ref=e39] [cursor=pointer]
      - group [ref=e42]:
        - generic "Bahías del local" [ref=e43] [cursor=pointer]
        - generic [ref=e44]:
          - button "Bahía 01 En atención" [ref=e45] [cursor=pointer]:
            - generic [ref=e46]: Bahía 01
            - generic [ref=e47]: En atención
          - button "Bahía 02 En atención" [ref=e50] [cursor=pointer]:
            - generic [ref=e51]: Bahía 02
            - generic [ref=e52]: En atención
          - button "Bahía 03 En atención" [ref=e55] [cursor=pointer]:
            - generic [ref=e56]: Bahía 03
            - generic [ref=e57]: En atención
          - button "Bahía 04 Inactiva" [ref=e60] [cursor=pointer]:
            - generic [ref=e61]: Bahía 04
            - generic [ref=e62]: Inactiva
          - button "Bahía 05 En atención" [ref=e65] [cursor=pointer]:
            - generic [ref=e66]: Bahía 05
            - generic [ref=e67]: En atención
      - button "Consultar mi vehículo" [ref=e70] [cursor=pointer]
      - generic [ref=e71]: Solo información operativa. Datos de otros clientes protegidos.
  - generic [ref=e72]: Bienvenido a CarWash Studio
```