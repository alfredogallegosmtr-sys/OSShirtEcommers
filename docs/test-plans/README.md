# docs/test-plans

Planes de prueba por unidad de trabajo. **Owner:** `qa-test-designer` (≈ `.claude/agents/test-planner.md`).

- Un archivo por spec: `[nombre].md`, enlazado desde el spec correspondiente.
- Por módulo: archivo, casos (happy path + **un negativo por cada regla real**) y prioridad
  (validadores/auth = alta, rutas = media, presentación = baja).
- La ejecución de los tests la realizan `backend-tester` y `frontend-tester`; aquí solo se **diseña**.
- Plantilla de caso: [../../.agents/templates/test-case-template.md](../../.agents/templates/test-case-template.md).
