# Pendientes — framework `.agents`/`.claude`/`docs`/`observability`/`.github`

> Generado al copiar y adaptar el framework de agentes del proyecto de referencia
> (`2026-2-ReactFS`) a OSShirtEcommers. Lista todo lo que quedó **deliberadamente sin hacer**
> porque falta información/decisiones que solo tú puedes dar (no porque falte trabajo técnico).
> Cuando tengas esa info, retómalo desde acá — cada punto dice qué se necesita y dónde iría.

## 1. Tests

**Estado actual:** ni `ecommerce-api` ni `ecommerce-app` tienen suite de tests corriendo hoy.
`ecommerce-app` sí tiene `@testing-library/*` instalado (sin tests escritos); `ecommerce-api` no
tiene nada de testing instalado.

- [ ] Elegir runner de tests del backend (Vitest o Jest) e instalarlo.
- [ ] Decidir estrategia de DB en tests (`mongodb-memory-server` es lo que usa el proyecto de
      referencia — evita depender de tu Mongo local).
- [ ] Generar `TEST_PLAN.md` real: correr el agente **test-planner** (ya está en
      `.claude/agents/test-planner.md`) sobre el código actual.
- [ ] Escribir los tests: agentes **backend-tester** / **frontend-tester** ya están listos para
      esto (`.claude/agents/`), pero necesitan que exista el runner instalado primero.
- [ ] Definir un objetivo de cobertura (el proyecto de referencia usa 90% — decide si aplica
      aquí o prefieres algo más laxo para empezar).
- [ ] Documentar la estrategia en `docs/testing.md` (lo omití por completo esta vez porque no
      hay nada que documentar todavía).

## 2. E2E (Cypress)

**Estado actual:** no instalado, sin escenarios.

- [ ] Instalar Cypress en `ecommerce-app`.
- [ ] Definir usuario/datos de prueba para E2E (el proyecto de referencia usa un seed dedicado
      vía task de Cypress, no el `npm run seed` normal).
- [ ] Escribir al menos el flujo crítico (login → agregar al carrito → checkout) una vez el
      checkout esté conectado a un backend real de órdenes (ver punto 5).

## 3. Specs, backlog y estado del proyecto

**Estado actual:** `docs/PROJECT_STATUS.md`, `docs/ARCHITECTURE.md` y `docs/backlog.md` quedaron
como plantillas vacías a propósito (para no inventar una auditoría). `docs/specs/` no tiene
ningún spec todavía.

- [ ] Decidir si quieres que audite el código actual y llene `PROJECT_STATUS.md`/`ARCHITECTURE.md`
      con el estado real (puedo hacerlo — solo dime cuándo, es una tarea grande de revisión).
- [ ] Definir el backlog real: ¿qué falta para este proyecto? (ejemplos de huecos que ya sé que
      existen, ver punto 6 — pero priorizar es una decisión tuya, no mía).
- [ ] A partir del backlog, generar specs en `docs/specs/` con la plantilla de
      `.agents/templates/spec-template.md`.

## 4. CI/CD completo

**Estado actual:** `.github/workflows/ci-cd.yml` es la versión reducida (solo `npm ci` + build).
Sin lint, sin tests, sin E2E, sin deploy automático.

- [ ] Configurar ESLint + Prettier en ambos paquetes (scripts `lint` / `format:check` en cada
      `package.json` — hoy no existen).
- [ ] Una vez exista la suite de tests (punto 1), agregar el job de tests + gate de cobertura.
- [ ] Una vez exista Cypress (punto 2), agregar el job E2E.
- [ ] Para el job de deploy: ver punto 7 (Render). El workflow ya trae un comentario apuntando
      al patrón completo de `2026-2-ReactFS/.github/workflows/ci-cd.yml` para cuando toque
      ampliarlo.

## 5. Órdenes, direcciones y métodos de pago reales

**Estado actual:** los modelos `Order`, `Address`, `PaymentMethod`, `WishList` existen
(`ecommerce-api/src/models/`) pero **no tienen controller ni router** — no son accesibles por
API. El checkout del frontend simula todo con `localStorage`.

- [ ] Decidir si quieres que arme controller + router para alguno de estos (siguiendo el patrón
      de `cart.controller.js`/`cart.routes.js`, que ya quedó documentado en
      `.claude/code-patterns.md`).
- [ ] Si se conecta `Order` de verdad, actualizar `docs/contracts/orders.md` (no existe todavía)
      antes de que el frontend lo consuma — regla del framework: no asumir contratos no
      definidos.

## 6. Seguridad / roles

**Estado actual (ya verificado en el código, no es una suposición):**

- Las rutas de escritura de `products` y `categories` (`POST`/`PUT`/`DELETE`) **no están
  protegidas** — cualquiera puede crear/editar/borrar productos sin sesión.
- No existe middleware de rol admin (`User.role` existe en el modelo pero nada lo exige).
- `PaymentMethod` guarda `cardNumber`/`cvv` en texto plano, sin cifrar ni tokenizar.
- `cors()` está abierto sin allowlist (`server.js`).

- [ ] Decidir si estos son riesgos aceptables para el curso o si quieres que los cierre.
- [ ] Si se agrega rol admin, documentar el modelo de amenazas en `docs/threat-models/` (ya
      tiene el README con la prioridad sugerida).

## 7. Despliegue (Render)

**Estado actual:** `docs/render-deployment.md` es una guía, nada está desplegado.

- [ ] Crear los servicios en Render (cuenta, MongoDB Atlas para producción).
- [ ] Generar los *Deploy Hooks* y agregarlos como secrets de GitHub
      (`RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_APP`) — solo tiene sentido después del
      punto 4 (CI completo), si no el gate de calidad no protege nada.

## 8. Observability (Artillery)

**Estado actual:** el stack de Docker (Prometheus + Grafana + Pushgateway) está listo y
funcional (`observability/`), pero **no hay Artillery instalado** ni escenario de carga — sin
eso no hay métricas que ver.

- [ ] Instalar `artillery` + plugin `publish-metrics` como devDependency en `ecommerce-api`.
- [ ] Escribir un escenario de carga (`.yml`) contra los endpoints reales (ver
      `.claude/api-routes.md`).
- [ ] Agregar el script `npm run test:load`.

---

**Cómo retomar esto:** cuando tengas la info de cualquiera de estos puntos (specs escritos,
prioridades del backlog, decisión sobre roles/seguridad, etc.), pásamela y seguimos desde acá —
no hace falta repetir el contexto, este archivo ya lo deja mapeado.
