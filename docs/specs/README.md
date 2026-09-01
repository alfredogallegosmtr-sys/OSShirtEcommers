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

Un primer spec de `E10` se redactó (FASE 2/3 de SSDLC) como preparación — sigue en `DRAFT`, sin
FASE 4 (rama) ni implementación formal atada a él, porque `E10` (`DEP-01`/`DEP-02`/`DEP-03`) se
terminó implementando directo, igual que `E1`–`E8`.

| Spec | Épica | Prioridad | Estado |
|---|---|---|---|
| [2026-08-27-infra-env-vars-render.md](2026-08-27-infra-env-vars-render.md) | E10 | S (complejidad) | DRAFT (sin seguimiento — ver cierre de `DOC-01`) |

## Cierre de `DOC-01` (2026-09-01)

El proceso spec-first quedó preparado en la infraestructura (`develop`, CI extendido) pero
**nunca se adoptó en la práctica** para ninguna épica posterior, incluidas `E9` a `E14`
(Artillery, Render, Swagger, auditoría OWASP, performance, hooks) — todas se implementaron con
el mismo patrón real de este proyecto: 1 pendiente → 1 rama → 1 PR, verificado en vivo
(curl/tests/Playwright según el caso) antes de mergear, documentado después en
[backlog.md](../backlog.md), sin spec previo. Ese patrón demostró funcionar de forma consistente
en las 14 épicas del backlog, así que `DOC-01` se cierra como decisión consciente de no adoptar
el flujo SSDLC completo — no como pendiente olvidado. El spec de `E10` queda como el único
ejemplo real de FASE 2/3, sin reconstruir specs retroactivos para el resto (sería documentación
de teatro, no una fuente de verdad, como ya advertía este documento).
