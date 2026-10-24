# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sow.spec.ts >> Administración publica contenido y precios; cotización obsoleta se rechaza sin alterar precio aceptado
- Location: tests\e2e\sow.spec.ts:129:1

# Error details

```
Test timeout of 90000ms exceeded.
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - text: ADMINISTRACIÓN · SANDBOX LOCAL
      - heading "CarWash Studio" [level=1] [ref=e6]
    - generic [ref=e7]:
      - status [ref=e8]: Conectado
      - link "Visita 3D" [ref=e9] [cursor=pointer]:
        - /url: /
      - button "Actualizar administración" [ref=e13] [cursor=pointer]
      - button "Salir" [ref=e19] [cursor=pointer]
  - navigation "Áreas administrativas" [ref=e23]:
    - button "Operación" [ref=e24] [cursor=pointer]
    - button "Órdenes" [ref=e27] [cursor=pointer]
    - button "Servicios y precios" [ref=e31] [cursor=pointer]
    - button "Clientes y vehículos" [ref=e36] [cursor=pointer]
    - button "Contenido y atención" [ref=e42] [cursor=pointer]
    - button "Configuración" [ref=e46] [cursor=pointer]
  - generic [ref=e50]:
    - generic [ref=e51]:
      - generic [ref=e52]:
        - text: ATENCIÓN EN TIEMPO REAL
        - heading "Fila, bahías y próximas acciones" [level=2] [ref=e53]
      - generic [ref=e54]: 0 en fila · 0 en atención
    - generic [ref=e55]:
      - article [ref=e56]:
        - generic [ref=e57]: BAHÍA 01
        - strong [ref=e61]: Disponible
        - generic [ref=e62]: Sin vehículo asignado
        - button "Desactivar" [ref=e63] [cursor=pointer]
      - article [ref=e64]:
        - generic [ref=e65]: BAHÍA 02
        - strong [ref=e69]: Disponible
        - generic [ref=e70]: Sin vehículo asignado
        - button "Desactivar" [ref=e71] [cursor=pointer]
      - article [ref=e72]:
        - generic [ref=e73]: BAHÍA 03
        - strong [ref=e77]: Disponible
        - generic [ref=e78]: Sin vehículo asignado
        - button "Desactivar" [ref=e79] [cursor=pointer]
      - article [ref=e80]:
        - generic [ref=e81]: BAHÍA 04
        - strong [ref=e85]: Disponible
        - generic [ref=e86]: Sin vehículo asignado
        - button "Desactivar" [ref=e87] [cursor=pointer]
      - article [ref=e88]:
        - generic [ref=e89]: BAHÍA 05
        - strong [ref=e93]: Disponible
        - generic [ref=e94]: Sin vehículo asignado
        - button "Desactivar" [ref=e95] [cursor=pointer]
    - generic [ref=e96]:
      - generic [ref=e97]:
        - heading "Vehículos y solicitudes" [level=3] [ref=e98]
        - button "Carro · Azul D-AF4C2A93 · Llegada pendiente $39.03" [ref=e99] [cursor=pointer]:
          - generic [ref=e103]:
            - generic [ref=e104]: Carro · Azul
            - generic [ref=e105]: D-AF4C2A93 · Llegada pendiente
          - strong [ref=e106]: $39.03
        - button "Carro · Azul D-C02179CA · Llegada pendiente $39.03" [ref=e107] [cursor=pointer]:
          - generic [ref=e111]:
            - generic [ref=e112]: Carro · Azul
            - generic [ref=e113]: D-C02179CA · Llegada pendiente
          - strong [ref=e114]: $39.03
        - button "Carro · Azul D-AAB73AEC · Llegada pendiente $61.33" [ref=e115] [cursor=pointer]:
          - generic [ref=e119]:
            - generic [ref=e120]: Carro · Azul
            - generic [ref=e121]: D-AAB73AEC · Llegada pendiente
          - strong [ref=e122]: $61.33
        - button "Carro · Plata D-F9B8FD02 · Llegada pendiente $39.03" [ref=e123] [cursor=pointer]:
          - generic [ref=e127]:
            - generic [ref=e128]: Carro · Plata
            - generic [ref=e129]: D-F9B8FD02 · Llegada pendiente
          - strong [ref=e130]: $39.03
        - button "Carro · Plata D-C7A9B62B · Llegada pendiente $61.33" [ref=e131] [cursor=pointer]:
          - generic [ref=e135]:
            - generic [ref=e136]: Carro · Plata
            - generic [ref=e137]: D-C7A9B62B · Llegada pendiente
          - strong [ref=e138]: $61.33
        - button "Carro · Plata D-0C1673EC · Cancelada $61.33" [ref=e139] [cursor=pointer]:
          - generic [ref=e143]:
            - generic [ref=e144]: Carro · Plata
            - generic [ref=e145]: D-0C1673EC · Cancelada
          - strong [ref=e146]: $61.33
      - generic [ref=e147]:
        - heading "Selecciona una orden" [level=3] [ref=e148]
        - paragraph [ref=e149]: Revisa el importe aceptado, los servicios y el próximo paso antes de modificar la atención.
```