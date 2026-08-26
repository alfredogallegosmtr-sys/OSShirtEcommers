# Reglas operativas del sistema de subagentes

## Protocolos obligatorios

1. Ningún agente implementa sin spec aprobado por el orchestrator.
2. Ningún agente cierra una tarea sin evidencia verificable (gates + prueba por CA).
3. El implementador no puede autoaprobarse: revisión por un rol distinto (`code-reviewer`).
4. Si cambia la arquitectura, se exige un ADR aceptado en `docs/adrs/` antes de integrar.
5. Cada cambio actualiza spec + tests + docs según corresponda (FASE 10).
6. Aislamiento: `1 pendiente = 1 spec = 1 rama = 1 PR`. Prohibido mezclar pendientes.
7. Solo se trabaja sobre el backlog aprobado; todo hallazgo nuevo se escala como propuesta.
8. Nadie toca `main`/`master`/`develop` directamente; la integración la ordena el orchestrator.
9. Todo PR pasa por `anti-hallucination-reviewer` antes de integrarse.
10. Riesgo crítico de seguridad = veto: no se integra hasta mitigar o aceptar formalmente.

## Reglas de Vibe Coding

- No inventar archivos, rutas, carpetas ni componentes: verificar contra el repo real (grep/lectura).
- No usar librerías ausentes del `package.json` correspondiente. Si se necesita una, se propone e
  instala en un paso explícito y documentado; nunca se asume.
- No asumir contratos de API no definidos: si el contrato no existe en `docs/contracts/`, se define
  o se escala. Jamás se inventan campos, rutas o formas de respuesta.
- No mezclar código temporal con definitivo: lo provisional se marca (`// TODO-TEMP`) y se registra
  como pendiente; no se integra código temporal sin etiqueta.
- Validar siempre contra el repo real: el estado del código manda sobre cualquier suposición.
- Exigir evidencia funcional: nada se da por hecho sin salida de tests o reproducción observable.
- Pedir explicación breve del razonamiento: cada PR incluye 2-4 líneas de por qué esta solución y
  qué se descartó.
- Ante ambigüedad, no improvisar: escalar al orchestrator con opciones e impacto.

## Enfoque pedagógico

- Explicar tradeoffs: toda decisión no trivial enumera una alternativa y por qué se descartó
  (ADR para las grandes; nota de razonamiento para las pequeñas).
- Justificar decisiones con evidencia del repo, no con autoridad de la IA.
- Convertir errores en lecciones: cada bug cerrado deja una "nota de aprendizaje" (qué falló, por
  qué, cómo se evita) en el spec o en `docs/runbooks/`.
- Evitar dependencia ciega: el alumno debe poder explicar el código que integró.
  Regla práctica: "si no lo puedes explicar en 3 frases, no lo integras".
- La IA propone; el alumno decide y comprende. Evidencia + comprensión son requisitos de cierre.
