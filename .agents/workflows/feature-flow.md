# Workflow: Feature

Extiende el SSDLC para una `feature`. Regla: **1 pendiente = 1 spec = 1 rama = 1 PR**.

| # | Fase SSDLC | Rol responsable | Artefacto |
|---|---|---|---|
| 1 | Contexto | orchestrator | Briefing |
| 2 | Clasif. + STRIDE | orchestrator, security-reviewer | Tipo + STRIDE |
| 3 | Spec | spec-writer, qa-test-designer, anti-hallucination | spec + test-plan |
| 4 | Rama | orchestrator | `feature/nombre` desde base |
| 5 | Skill Audit | builder | nota de reuso |
| 6 | Implementación | backend/frontend-builder, security-reviewer | código + contrato |
| 7 | Gates | builder, code-reviewer, anti-hallucination | gates verdes + review |
| 8 | Prueba funcional | qa + testers existentes | evidencia por CA |
| 9 | PR | code-reviewer (+ security) | PR con `pr-template` |
| 10 | Cierre | docs-keeper, orchestrator | spec DONE + backlog |

**Salida de cada builder:** resumen, CAs cumplidos/no, evidencia, riesgos, deuda, pendientes,
impacto en docs, recomendación de integración. El builder **no integra**.
