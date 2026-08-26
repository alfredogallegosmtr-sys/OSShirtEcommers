# docs/contracts

Contratos de API entre `ecommerce-app` (frontend) y `ecommerce-api` (backend). **Owner:**
`backend-builder` define, `frontend-builder` consume.

Antes de implementar un endpoint nuevo o consumirlo desde el frontend, su contrato debe existir
aquí — evita el tipo de bug ya visto en este proyecto (el frontend asumiendo una forma de
respuesta distinta a la real, p. ej. `item.price` cuando el backend devuelve `item.product.price`).

- Un archivo por recurso: `[recurso].md` (p. ej. `cart.md`, `auth.md`).
- Por endpoint: método + path, auth requerida, request (params/body), response (status + forma),
  errores posibles. Anclado a modelos reales ([.claude/models.md](../../.claude/models.md)) y
  rutas ([.claude/api-routes.md](../../.claude/api-routes.md)).
- Regla de Vibe Coding: **no asumir contratos no definidos** — si falta, se define o se escala.
