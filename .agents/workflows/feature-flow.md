# Workflow: Feature

Extiende el SSDLC para una `feature`. Regla: **1 pendiente = 1 spec = 1 rama = 1 PR**.
Mapa completo de intervención por fase (FASE 0–10 de
[SSDLC.md](../../.claude/skills/workflow/SSDLC.md)):

| # | Fase SSDLC | Objetivo de la fase | Rol(es) que interviene(n) | Entregable mínimo | Riesgo si se omite |
|---|---|---|---|---|---|
| 0 | Lectura de contexto | Entender stack, convenciones y estado real antes de tocar nada | orchestrator | Briefing con contexto verificado | Se implementa contra supuestos, no contra el repo real |
| 1 | Clasificación + STRIDE | Tipar la unidad y detectar amenazas de seguridad temprano | orchestrator, security-reviewer | Tipo + amenazas STRIDE aplicables | Vulnerabilidad detectada tarde, cuando corregirla ya es caro |
| 2 | Historia SMART | Acotar qué se construye y cómo se mide el éxito | spec-writer | Historia SMART con criterios medibles | Alcance ambiguo → el implementador improvisa el criterio de éxito |
| 3 | Spec Driven Design | Formalizar CAs, dependencias, riesgos y plan de pruebas antes de codificar | spec-writer, qa-test-designer, anti-hallucination-reviewer | `docs/specs/*.md` con CAs + test-plan | Se codifica sin contrato — mismatch FE/BE, campos/endpoints inventados |
| 4 | Gestión de rama | Aislar la unidad de trabajo | orchestrator | Rama `feature/nombre` desde la base | Trabajo mezclado rompe `1=1=1=1`, PR irrevisable |
| 5 | Skill Audit | Evitar reinventar utilidades ya existentes | backend-builder / frontend-builder | Nota de reuso o skill nuevo documentado | Código duplicado, patrones inconsistentes entre módulos |
| 6 | Implementación segura | Construir cumpliendo el patrón del repo y las reglas de seguridad | backend-builder / frontend-builder, security-reviewer | Código + contrato actualizado en `docs/contracts/` | Secrets hardcodeados, validación faltante, deuda de seguridad silenciosa |
| 7 | Verificación y quality gates | Confirmar que el código cumple los checks automáticos | builder, code-reviewer, anti-hallucination-reviewer | Gates verdes + review aprobada | Bug o vulnerabilidad detectable por herramienta llega al PR |
| 8 | Prueba funcional | Confirmar cada CA contra comportamiento observable, no contra el código | qa-test-designer + `backend-tester`/`frontend-tester` | Evidencia por CA (verde/rojo/parcial) | "Funciona en teoría" pero falla en uso real |
| 9 | Pull Request | Entregar trabajo revisable, trazable y con evidencia | code-reviewer (+ security-reviewer si aplica) | PR con `pr-template.md` completo | PR sin contexto → revisión superficial o bloqueo por falta de info |
| 10 | Cierre de spec | Dejar registrado qué quedó, qué no, y qué pasa a backlog | docs-keeper, orchestrator | Spec `DONE`/`REJECTED` + backlog derivado actualizado | Cierre "bonito pero incompleto" (ver regla de cierre del SSDLC) |

**Salida de cada builder:** resumen, CAs cumplidos/no, evidencia, riesgos, deuda, pendientes,
impacto en docs, recomendación de integración. El builder **no integra**.
