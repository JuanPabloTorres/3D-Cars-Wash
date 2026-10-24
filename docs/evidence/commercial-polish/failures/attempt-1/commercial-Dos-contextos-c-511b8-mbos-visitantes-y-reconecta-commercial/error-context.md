# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: commercial.spec.ts >> Dos contextos: comando DEMO del servidor llega a ambos visitantes y reconecta
- Location: tests\e2e\commercial.spec.ts:27:1

# Error details

```
Test timeout of 90000ms exceeded.
```

# Page snapshot

```yaml
- 'main "Febles Car Wash: visita tridimensional" [ref=e3]':
  - generic:
    - generic:
      - text: FEBLES · DEMO
      - generic: Simulación conectada
  - generic [ref=e7]:
    - button "Visitar" [ref=e8] [cursor=pointer]
    - button "Ayuda de la visita" [ref=e12] [cursor=pointer]
  - generic [ref=e16]:
    - text: BIENVENIDO A FEBLES
    - heading "Tu auto, en buenas manos." [level=1] [ref=e17]
    - paragraph [ref=e18]: Conoce nuestros servicios y prepara tu visita.
    - button "Ir a recepción" [ref=e19] [cursor=pointer]
  - generic [ref=e22]: Bienvenido a Febles
```