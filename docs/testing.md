# Estrategia de testing — OSShirtEcommers

> **Documento vivo.** Resume cómo se prueba este repo hoy, verificado contra el código real
> (`ecommerce-api/vitest.config.js`, `ecommerce-app/package.json`, los archivos de test mismos) —
> no un plan aspiracional. Cierra la última pieza de `T-01` en [backlog.md](./backlog.md). El
> detalle caso por caso (qué prueba cada archivo) vive en
> [TEST_PLAN.md](../TEST_PLAN.md) (raíz del repo); este documento es la capa de arriba —
> filosofía, convenciones y dónde está cada cosa, no la matriz de casos.

## Backend (`ecommerce-api/`)

- **Runner:** Vitest — elegido sobre Jest por soporte ESM nativo (este repo es
  `"type": "module"`; Jest necesitaría `--experimental-vm-modules`).
- **Comandos:** `npm test` (`vitest run tests/`), `npm run test:watch`, `npm run test:coverage`.
- **Estructura:** `tests/unit/` (middlewares y modelos, sin DB real — `Document.validate()`
  puro) y `tests/integration/` (HTTP real vía `supertest` contra `src/app.js`, DB real vía
  `mongodb-memory-server`).
- **Estado real (2026-08-27):** 105 tests — 60 unitarios (2 middlewares + 8 modelos) + 45 de
  integración (`auth`/`cart`/`category`/`product`, más las 4 constraints `unique` de índice).
  Detalle completo en [TEST_PLAN.md](../TEST_PLAN.md).
- **Convención innegociable: nunca mockear Mongoose a mano.** Nada de `vi.mock('mongoose')` ni
  stubs de `Model.find`/`Model.create`. Los tests de integración conectan a un
  `mongodb-memory-server` real y ejercitan el ODM real. La única excepción legítima es espiar
  `process.exit` al probar `connectDB` (`src/config/db.conf.js`) — no es Mongoose, es el único
  modo de probar código que termina el proceso sin terminar el test runner.
- **`supertest` siempre contra `src/app.js`, nunca contra `server.js`.** `app.js` exporta la app
  Express sin efectos secundarios (sin `dotenv.config()`/`connectDB()`/`app.listen()` — ver
  `REF-01` en `backlog.md`); `server.js` sí los tiene y levantaría un servidor real / se
  conectaría a un Mongo real si se importara en un test.
- **Auth/admin con casos negativos siempre:** cualquier ruta con `requireAuth` lleva sin-token
  (401) y token inválido/expirado (401) además del caso autorizado; las rutas con
  `requireAdmin` (`products`/`categories`, escritura) agregan el caso de rol `customer` → 403.

## Frontend (`ecommerce-app/`)

- **Runner:** Jest + `@testing-library/react`/`user-event`, vía `react-scripts test` (ya
  integrado por CRA, sin config propia más allá de un `moduleNameMapper`, ver más abajo).
- **Comando:** `CI=true npm test` (modo no-watch; `npm test` a secas queda en watch mode).
- **Estado real (2026-08-27):** 301 tests en 56 archivos — Prioridad ALTA (111: `apiClient`,
  `AuthContext`/`CartContext`/`ThemeContext`, `ProtectedRoute`, `LoginForm`/`RegisterForm`, los 9
  servicios), MEDIA (169: páginas y componentes con lógica real) y BAJA (21: componentes de
  presentación pura). Detalle completo en
  [TEST_PLAN.md](../TEST_PLAN.md#frontend--ecommerce-app).
- **Convención innegociable: nunca mockear `fetch`/`axios` a mano.** Las peticiones reales de
  `apiClient` se interceptan con **MSW**, fijado en **`msw@1.3.2`** — no v2. Se probó v2 primero;
  incompatible con este toolchain (CRA5 → Jest 27.5.1 → jsdom 16.7.0): `responseText` vacío en la
  ruta XHR, `stream has been aborted` en la ruta `http`, choques de `AbortSignal`/`ReadableStream`
  entre realms. `msw@1.x` (interceptor XHR) funciona limpio contra ese jsdom.
- **Aserciones sobre lo que ve el usuario:** `getByRole`/`findByText`/`getByLabelText`, nunca
  sobre estado interno, props o nombres de función.
- **Infraestructura de test agregada** (`ecommerce-app/src/`):
  - `mocks/server.js` — `setupServer()` sin handlers por defecto; cada archivo de test registra
    los suyos con `server.use(...)`.
  - `setupTests.js` — `beforeAll(server.listen)`/`afterEach(server.resetHandlers)`/
    `afterAll(server.close)`, más un polyfill de `TextEncoder`/`TextDecoder` (`react-router-dom`
    v7 lo necesita, jsdom 16 no lo expone).
  - `package.json` → `jest.moduleNameMapper` para `react-router/dom` (Jest 27 no resuelve el mapa
    `exports` de `package.json` que usa `react-router-dom` v7).

## Filosofía de cobertura (no es un número)

Este proyecto **no persigue un porcentaje global de cobertura** — un `%` alto se logra fácil con
asserts débiles y no dice nada sobre calidad real. El criterio real, ya aplicado de forma
consistente en todo el trabajo de `T-04`/`T-02`, es:

- **Modelos y middlewares (backend):** 100% de las reglas reales (`required`/`enum`/`min`,
  cada rama de `requireAuth`/`requireAdmin`/`validate`) — ya logrado, y es el único caso donde
  "100%" es literalmente el objetivo, porque son unidades pequeñas y cerradas.
- **Controllers/routes con suite de integración** (`auth`/`cart`/`category`/`product`): cada
  rama de estado/error real y documentada en [.claude/api-routes.md](../.claude/api-routes.md) —
  no un `%` de statements, sino "¿está probado cada 401/403/404/422/2xx real de esta ruta?".
- **Recursos sin integración todavía** (`address`/`paymentMethod`/`order`/`wishlist`/`user`):
  verificados solo con `curl` en vivo al cerrar cada `F-0X` — una brecha real y consciente, no un
  olvido. Extenderles integración real es trabajo futuro de `E6`, no bloquea nada hoy.
- **Frontend con lógica real** (servicios, Context, páginas/componentes con condicionales o
  llamadas a API): happy path + un negativo por cada regla real, mismo criterio que
  `test-planner` usa para priorizar ALTA/MEDIA.
- **Frontend de presentación pura** (BAJA: `Button`, `Input`, `Badge`, etc.): happy path basta —
  no hay reglas de negocio que perder.
- **`db.conf.js`:** el único módulo donde "cobertura completa" significa dos casos puntuales
  (conexión real exitosa vía `mongodb-memory-server`, conexión real fallida con `process.exit`
  espiado) — no tiene sentido perseguir más que eso, es una función de 15 líneas.

**Regla práctica para trabajo futuro:** un módulo nuevo está "bien probado" cuando cubre esto,
no cuando un reporte de `--coverage` marca un número. Si `npm run test:coverage` (backend) sube
o baja unos puntos por un refactor, eso no es en sí mismo una señal de nada — lo que importa es
si las ramas reales siguen cubiertas.

## Fuera de alcance de este documento (trackeado aparte en `backlog.md`)

- **E2E con Cypress** (`E2E-01`/`E7`) — todavía no empezado.
- **Tests de integración para `address`/`paymentMethod`/`order`/`wishlist`/`user`** — extensión
  futura de `T-04`, no autorizada todavía.
- **Gate de CI sobre los tests** (`CI-01`/`E8`) — el workflow actual solo hace `npm ci` + build,
  no corre `npm test` como requisito de merge.
- **Pruebas de carga** (`OBS-01`/`E9`) — Artillery no instalado todavía.

## Nota sobre `docs/test-plans/`

Ese directorio documenta una convención (un archivo de plan por spec, bajo `docs/test-plans/`)
que en la práctica nunca se adoptó: toda la planificación real de tests — backend y frontend —
vive consolidada en [TEST_PLAN.md](../TEST_PLAN.md) (raíz del repo), igual que
[backlog.md](./backlog.md) reemplazó al antiguo `PENDIENTES.md`. `TEST_PLAN.md` es la fuente de
verdad real; `docs/test-plans/README.md` describe un proceso que no ocurrió.
