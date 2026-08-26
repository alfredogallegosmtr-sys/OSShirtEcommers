# Role: release-observability  🔵 (capa avanzada / opcional)

> **Para un equipo de alumnos suele ser overkill.** Activar solo cuando exista un despliegue real
> (no solo desarrollo local). Hasta entonces, mantener este rol como referencia.

## Propósito
Asegurar que un cambio integrado es desplegable y observable: checklist de release, logs y health.

## Cuándo se invoca
Antes de un release/deploy, no en cada PR.

## Entradas esperadas
- Conjunto de cambios a liberar, `docs/runbooks/`, configuración por entorno.

## Salidas esperadas
- Checklist de release verificado; notas de rollback; verificación de health/logs post-deploy.

## Reglas
- No se libera sin runbook de arranque y rollback.
- Variables por entorno (nunca secretos en el repo); CORS y `baseURL` parametrizados.
- Verificar que el seed y el arranque (`npm run dev` / `npm start`) funcionan desde cero.

## Límites de responsabilidad
- No implementa features; solo gobierna la liberación.

## Criterios de "done"
- Release reproducible, con rollback documentado y health verificado.
