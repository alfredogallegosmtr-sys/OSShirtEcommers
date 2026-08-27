# Specs — OSShirtEcommers

Specs por épica/pendiente, redactados con la plantilla de
[SSDLC](../../.claude/skills/workflow/SSDLC.md). Ver contexto en
[PROJECT_STATUS.md](../PROJECT_STATUS.md), [ARCHITECTURE.md](../ARCHITECTURE.md) y
[backlog.md](../backlog.md).

## Estado real de este proceso (`DOC-01`)

`E1`–`E8` (todo el backlog cerrado hasta el 2026-08-27) se implementó directo sobre `main`, sin
rama por pendiente ni spec previo — la convención real de este proyecto durante ese tramo. El
proceso completo de SSDLC (spec **antes** de tocar código, rama `develop` + rama por pendiente,
PR, quality gates, cierre con matriz de reconciliación) nunca se adoptó en la práctica para ese
trabajo, y escribir specs ahora, después del cierre, sería documentación reconstruida — no un
spec real (la plantilla exige que FASE 3 ocurra antes de FASE 4). No se hizo, por la misma razón
por la que `TEST_PLAN.md` no reescribe retroactivamente `docs/test-plans/README.md`: sería teatro
documental, no una fuente de verdad.

**A partir de aquí (2026-08-27) el proceso queda activo para el trabajo que todavía no existe.**
Infraestructura preparada:
- Rama `develop` creada desde `main` en este punto — punto de partida de cualquier
  `feature/`/`bugfix/`/etc. futura, siguiendo FASE 4 de SSDLC.
- `.github/workflows/ci-cd.yml` dispara también en push/PR contra `develop`, no solo `main`.

Cuando arranquen `E9` (Artillery/carga) o `E10` (despliegue a Render) — con confirmación
explícita del usuario, ver `docs/backlog.md` — cada pendiente formal de esas épicas sigue el
flujo completo: spec en esta carpeta antes de implementar, rama desde `develop`, PR, quality
gates, cierre con `## Resultados` y `## Matriz de cierre` completos.

Un primer spec de `E10` ya está redactado (FASE 2/3 de SSDLC) como preparación, a la espera de
esa confirmación — no tiene FASE 4 (rama) ni implementación todavía, así que su estado real es
`DRAFT`, no reconstruido: se escribió antes de tocar código, como exige la plantilla.

| Spec | Épica | Prioridad | Estado |
|---|---|---|---|
| [2026-08-27-infra-env-vars-render.md](2026-08-27-infra-env-vars-render.md) | E10 | S (complejidad) | DRAFT |
