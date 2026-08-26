# SSDLC — puntero al canónico

> **Fuente de verdad única:** el protocolo SSDLC vive en
> [.claude/skills/workflow/SSDLC.md](../../.claude/skills/workflow/SSDLC.md) (v1.2.0),
> porque es el `skill` que carga el runtime de Claude Code y al que ya apuntan los specs.

Este archivo existe para que la carpeta `.agents/workflows/` sea autocontenida y para resolver
la discrepancia de ruta histórica (`.agents/workflows/ssdlc.md`). **No dupliques el contenido
aquí:** edita siempre el canónico y deja este puntero intacto.

Resumen de la secuencia (detalle completo en el canónico):

1. Lectura de contexto
2. Clasificación + STRIDE
3. Spec Driven Design
4. Gestión de rama
5. Skill Audit
6. Implementación segura
7. Verificación y quality gates
8. Prueba funcional
9. Pull Request
10. Cierre de spec
10.5 Establecimiento del baseline oficial
11. Modo de ejecución con subagentes

Los flujos concretos de trabajo están en [feature-flow.md](./feature-flow.md) y
[bugfix-flow.md](./bugfix-flow.md).
