# Capa de subagentes — OSShirtEcommers

Esta carpeta define **cómo opera el equipo (humano + IA) sobre el proyecto**. No reemplaza el
SSDLC: lo **extiende** materializando su FASE 11 (ejecución orquestada con subagentes).

- **Proceso canónico:** [.claude/skills/workflow/SSDLC.md](../.claude/skills/workflow/SSDLC.md) (v1.2.0).
  El archivo [workflows/ssdlc.md](./workflows/ssdlc.md) es un puntero a ese canónico.
- **Regla columna vertebral:** `1 pendiente = 1 spec = 1 rama = 1 PR`.
- **Fuente de verdad:** baseline = código en `main` + documentación vigente en `docs/` + backlog aprobado.

## Estructura

| Carpeta | Contenido |
|---|---|
| `orchestrator.md` | Agente principal (orquesta; no implementa) |
| `rules.md` | Protocolos obligatorios + reglas de Vibe Coding + enfoque pedagógico |
| `roles/` | Playbooks de cada rol ejecutor |
| `workflows/` | SSDLC (puntero) + flujos de feature y bugfix |
| `templates/` | ADR, PR, caso de prueba, spec |
| `checklists/` | Definition of Done (frontend/backend) y checklist de PR |

## Playbooks vs runtime (Claude Code)

`.agents/roles/*.md` son **playbooks tool-agnósticos** (la fuente de verdad de responsabilidades).
`.claude/agents/*.md` son **bindings de runtime** para Claude Code. Mapeo actual:

| Playbook (`.agents/roles/`) | Binding runtime (`.claude/agents/`) |
|---|---|
| `qa-test-designer.md` | `test-planner.md` (diseño) |
| ejecución de pruebas | `backend-tester.md`, `frontend-tester.md` |
| `code-reviewer.md` (incluye auditoría de tests) | `test-reviewer.md` (parcial) |
| resto de roles | sin binding aún (se ejecutan vía el orchestrator) |

## Capas de adopción

No se adopta todo de golpe — cada capa se activa cuando la anterior ya es hábito, no antes.

### MVP
**Roles:** `orchestrator`, `spec-writer`, `backend-builder`, `frontend-builder`,
`qa-test-designer`, `code-reviewer`.
**Por qué:** es el ciclo mínimo que ya obliga a specificar antes de codificar y a que nadie se
autoapruebe — sin esto, cualquier capa adicional es cosmética.
**Impacto esperado:** reduce el "vibe coding sin disciplina" (codear directo desde el prompt sin
CA verificable) y establece la regla `1 pendiente = 1 spec = 1 rama = 1 PR` como hábito de equipo.

### Segunda capa
**Roles:** `security-reviewer`, `docs-keeper`, `anti-hallucination-reviewer` (+ activar
`docs/contracts/`, `docs/adrs/`, `docs/threat-models/`).
**Por qué:** el MVP ya produce código funcional, pero sin estos tres roles el riesgo de seguridad
queda sin dueño, la documentación se desactualiza en silencio, y las alucinaciones de IA
(endpoints o campos inventados) pasan sin que nadie las verifique contra el repo real.
**Impacto esperado:** cierra el hueco de seguridad activo hoy en el proyecto (ver
[docs/backlog.md](../docs/backlog.md), épica E4) y evita que `docs/` vuelva a quedar como
plantilla vacía una vez que el equipo esté ocupado codeando.

### Capa avanzada / pedagógica
**Roles:** `learning-coach`, `architecture-reviewer` (formalizar como archivo — hoy solo referido
aquí), `release-observability`.
**Por qué:** son de mayor costo de mantenimiento y menor urgencia — tienen sentido cuando el
equipo ya ejecuta las dos capas anteriores sin fricción, no antes. Introducirlos temprano en un
equipo de alumnos compite por atención con lo que sí es crítico (spec, seguridad, evidencia).
**Impacto esperado:** `learning-coach` convierte el trabajo en aprendizaje explícito (tradeoffs,
lecciones de bugs); `architecture-reviewer` previene decisiones estructurales tomadas por
default dentro de un PR individual; `release-observability` cierra el ciclo con métricas reales
en vez de "parece que funciona" (ver épica E9 del backlog).

## Riesgos y recomendaciones de esta capa de subagentes

- **Sobre-formalización para un equipo de alumnos.** El modelo completo (11 roles + orchestrator)
  es exigente para un curso. Recomendación: no saltar de MVP a capa avanzada sin que la anterior
  ya sea hábito — la progresión por capas existe justamente para controlar este riesgo, no es
  opcional.
- **El orchestrator como cuello de botella.** Si una sola persona/agente hace de orchestrator para
  todo el equipo, se vuelve el límite de velocidad del proyecto. Mitigación: el orchestrator
  puede rotar por unidad de trabajo siempre que respete sus mismos límites (no implementa, no se
  autoaprueba).
- **Roles que se vacían de contenido con el tiempo.** Un playbook de rol que nadie actualiza
  cuando cambia el código real (ej. `backend-builder.md` describiendo un patrón que ya no se usa)
  es peor que no tenerlo, porque genera falsa confianza. Mitigación: `docs-keeper` revisa los
  playbooks afectados en cada cierre de spec, no solo `docs/`.
- **No reemplaza el criterio humano.** Toda esta estructura reduce improvisación e
  incentiva evidencia verificable, pero el veto final ante ambigüedad de producto sigue siendo del
  usuario/instructor — el orchestrator escala, no decide solo, en cualquier duda de alcance.
