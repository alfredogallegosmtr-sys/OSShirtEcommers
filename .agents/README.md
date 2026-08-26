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

- **MVP:** orchestrator, spec-writer, backend-builder, frontend-builder, qa-test-designer, code-reviewer.
- **Segunda:** security-reviewer, docs-keeper, anti-hallucination-reviewer (+ `docs/contracts`, `docs/adrs`, `docs/threat-models`).
- **Avanzada/pedagógica:** learning-coach, architecture-reviewer (formal), release-observability.
