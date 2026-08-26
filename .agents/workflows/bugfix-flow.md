# Workflow: Bugfix

Versión acotada del SSDLC para corregir un comportamiento. Sigue siendo `1 = 1 = 1 = 1`.

| # | Fase | Rol | Artefacto |
|---|---|---|---|
| 1 | Reproducir | spec-writer (+ qa) | caso que falla documentado en el spec |
| 2 | STRIDE rápido | security-reviewer (si aplica) | nota de riesgo |
| 3 | Spec mínimo | spec-writer | spec `bugfix` con CA = "el caso ya no falla" |
| 4 | Rama | orchestrator | `bugfix/nombre` |
| 5 | Test que reproduce | qa + tester | test rojo que evidencia el bug |
| 6 | Fix | builder | código mínimo que pone el test en verde |
| 7 | Gates | builder, code-reviewer | suite verde, sin regresiones |
| 8 | Verificación | qa | CA verificado |
| 9 | PR | code-reviewer | PR con `pr-template` + enlace al test |
| 10 | Cierre | docs-keeper | spec DONE; nota en PROJECT_STATUS si era bug conocido |

**Regla de oro:** primero el test que reproduce el bug (rojo), luego el fix (verde). Sin test que
reproduzca, no se cierra.
