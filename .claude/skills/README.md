# Skills / Guías de referencia

Guías de referencia técnica para el curso, clasificadas por **scope**. Cada archivo conserva su
cabecera original (Scope / Trigger / Tools / Version).

> ⚠️ **Importante:** son guías **generales**, no documentación del código de este repo. En varios
> puntos NO coinciden con las convenciones reales del proyecto (p. ej. la guía *Express + MongoDB*
> usa CommonJS `require`, `bcryptjs` y respuestas `{ success, data }`; este repo usa ES Modules,
> `bcrypt` y otros formatos). Para las convenciones reales, ver
> [../code-patterns.md](../code-patterns.md), [../api-routes.md](../api-routes.md) y
> [../models.md](../models.md). Ante conflicto, manda el código real del repo.

## Clasificación

Las carpetas `backend/`, `frontend/` y `workflow/` son las guías propias del curso. Además hay skills
**de terceros** instalados por un gestor: viven en [`../../.agents/skills/`](../../.agents/skills/) y
se exponen aquí como symlinks planos (`accessibility`, `agent-development`, `best-practices`,
`browser-use`, `core-web-vitals`, `frontend-design`, `performance`, `seo`, `web-quality-audit`).
Su origen y versión están fijados en [`../../skills-lock.json`](../../skills-lock.json); no se editan
a mano, se regeneran desde el lock.

### backend (`skills/backend/`)
- [api-best-practices.md](backend/api-best-practices.md) — diseño RESTful, status codes, versionado,
  paginación, seguridad, caching, OpenAPI/Swagger, monitoring.
- [express-mongodb.md](backend/express-mongodb.md) — stack MERN: Express, Mongoose, JWT, validación,
  error handling, CRUD.
- [mongodb-patterns.md](backend/mongodb-patterns.md) — diseño de schemas, relaciones (embedded vs
  referenced), índices, aggregation pipeline, transacciones.
- [nodejs-best-practices.md](backend/nodejs-best-practices.md) — estructura de proyecto, env vars,
  logging, error handling, performance, seguridad, graceful shutdown.

### frontend (`skills/frontend/`)
- [frontend-design.md](frontend/frontend-design.md) — UI/UX, atomic design, Tailwind, Material UI,
  patrones (Card/Modal/Toast), accesibilidad, responsive.
- [react.md](frontend/react.md) — componentes, hooks (useState/useEffect/custom), React Router,
  optimización (memo/useMemo/useCallback), integración con APIs.

### workflow (`skills/workflow/`)
- [git-workflow.md](workflow/git-workflow.md) — comandos Git, branches, conventional commits,
  Git Flow, trunk-based, pull requests, resolución de conflictos.
