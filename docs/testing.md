# Estrategia de testing — OSShirtEcommers

> **Documento vivo.** Resume cómo se prueba este repo hoy, verificado contra el código real
> (`ecommerce-api/vitest.config.js`, `ecommerce-app/package.json`, `ecommerce-app/cypress.config.js`,
> los archivos de test mismos) — no un plan aspiracional. El detalle caso por caso (qué prueba
> cada archivo) vive en [TEST_PLAN.md](../TEST_PLAN.md) (raíz del repo); este documento es la
> capa de arriba — filosofía, convenciones, cómo correr todo, y dónde está cada cosa.
>
> **La vista integral que cruza backend+frontend+E2E por escenario de negocio** (matriz de
> trazabilidad, estrategia unificada de datos de prueba, comandos consolidados, bloqueos
> conocidos) vive en [docs/testing/](testing/strategy.md) — no se duplica aquí, ese es el punto de
> entrada de más alto nivel.

## Backend (`ecommerce-api/`)

- **Runner:** Vitest — elegido sobre Jest por soporte ESM nativo (este repo es
  `"type": "module"`; Jest necesitaría `--experimental-vm-modules`).
- **Comandos:** `npm test` (`vitest run tests/`), `npm run test:watch`, `npm run test:coverage`.
- **Estructura:** `tests/unit/` (middlewares y modelos, sin DB real — `Document.validate()`
  puro) y `tests/integration/` (HTTP real vía `supertest` contra `src/app.js`, DB real vía
  `mongodb-memory-server`).
- **Estado real (2026-08-27):** 158 tests — 63 unitarios (`requireAuth`+`requireAdmin`,
  `validate`, 8 modelos) + 95 de integración (`auth`/`cart`/`category`/`product`/`address`/
  `paymentMethod`/`order`/`wishlist`/`user`, las 4 constraints `unique` de índice, y `connectDB`).
  Los 9 recursos reales del backend tienen integración completa. Detalle completo en
  [TEST_PLAN.md](../TEST_PLAN.md) y en la matriz de trazabilidad
  [docs/testing/test-matrix.md](testing/test-matrix.md).
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
- **Estado real (2026-08-27):** 302 tests en 56 archivos — Prioridad ALTA (111: `apiClient`,
  `AuthContext`/`CartContext`/`ThemeContext`, `ProtectedRoute`, `LoginForm`/`RegisterForm`, los 9
  servicios), MEDIA (170: páginas y componentes con lógica real, incluye la regresión de `B-15`)
  y BAJA (21: componentes de presentación pura). Detalle completo en
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

## E2E con Cypress (`ecommerce-app/cypress/`)

Cierra `E2E-01`/`E7` en [backlog.md](./backlog.md). A diferencia de los tests unitarios/de
integración de arriba, **estos hablan con el backend y la base de datos reales** — nada de MSW
ni `mongodb-memory-server`. No hay pasarela de pago externa que mockear: `PaymentMethod` es un
recurso propio de este backend (decisión `S-03`), nunca hay un proveedor real (Stripe/PayPal/etc.)
de por medio.

### Diferencia entre las tres capas de test de este repo

| Capa | Qué ejercita | DB/API | Dónde |
|---|---|---|---|
| Unitario (backend) | Reglas de un modelo o middleware aislado | Ninguna (`Document.validate()`) | `ecommerce-api/tests/unit/` |
| Integración (backend) | Un controller+ruta completo vía HTTP | `mongodb-memory-server` (real, efímera) | `ecommerce-api/tests/integration/` |
| Unitario/componente (frontend) | Un componente/hook/servicio aislado | MSW (interceptada, nunca red real) | `ecommerce-app/src/**/*.test.jsx` |
| **E2E (Cypress)** | **El flujo real de punta a punta, navegador real** | **Backend + Mongo reales, corriendo de verdad** | `ecommerce-app/cypress/` |

### Dependencias instaladas

`cypress@15.21.1`, `@testing-library/cypress@10.1.3` (da `cy.findByRole`/`findByLabelText`/
`findByText`, mismo estilo de consulta que ya usan los tests de RTL — evita `data-testid` en casi
todos los formularios porque los labels ya están asociados correctamente) y
`start-server-and-test@3.0.12`, todas como devDependencies de `ecommerce-app/`.

### Estructura de carpetas

```
ecommerce-app/
├── cypress.config.js
└── cypress/
    ├── e2e/
    │   ├── auth/
    │   │   ├── register.cy.js
    │   │   └── login.cy.js
    │   └── checkout/
    │       └── checkout.cy.js
    ├── support/
    │   ├── commands.js   (cy.loginByApi, cy.addProductToCart)
    │   └── e2e.js
    └── utils/
        └── testData.js   (buildUniqueUser, buildAddress, buildCard)
```

No hay `cypress/fixtures/`: se decidió deliberadamente no usar fixtures estáticos de
usuarios/productos. Un producto con un `_id` fijo dejaría de existir tras un
`SEED_ALLOW_RESET=true npm run seed`, y el registro **nunca** puede reusar un email fijo (el
backend lo rechaza con 422 "User already exist" a partir de la segunda corrida) — por eso
`addProductToCart` toma el primer producto real vía `GET /api/products` y `buildUniqueUser()`
genera un email con timestamp en cada corrida. `cypress/fixtures/products.json`/`users.json` no
se crearon porque ningún test los habría usado — habría sido una carpeta vacía de conveniencia,
no datos reales.

### Variables de entorno

| Variable | Default (en `cypress.config.js`) | Uso |
|---|---|---|
| `CYPRESS_BASE_URL` | `http://localhost:3001` | URL del frontend |
| `CYPRESS_API_URL` | `http://localhost:4001/api` | Mismo default que usa `apiClient.js` — Cypress corre fuera del proceso de la app y no lee su `.env` |
| `CYPRESS_TEST_USER_EMAIL` | `user4@test.com` | Usuario semilla real, customer (no admin), para login/checkout |
| `CYPRESS_TEST_USER_PASSWORD` | `123456` | Password del seed (ver "Contexto operativo" en `backlog.md`) |

Para correr contra otro ambiente o usuario, sobreescribir por variable de entorno del shell o con
un `cypress.env.json` local en `ecommerce-app/` (gitignorado) — **nunca** comitear credenciales
reales de un ambiente que no sea este seed de desarrollo.

### Cómo correr

Requiere el backend real + Mongo real corriendo (no `mongodb-memory-server`) — arrancar
`ecommerce-api` (`npm start` o `npm run dev`) por separado primero:

```bash
# Terminal 1 — backend real (necesita Mongo corriendo)
cd ecommerce-api && npm start

# Terminal 2 — Cypress, arranca el frontend por vos y espera a que responda
cd ecommerce-app
npm run cypress:open        # modo interactivo
npm run test:e2e            # headless, una sola corrida
npm run test:e2e:headed     # headless pero con navegador visible
npm run test:e2e:ci         # levanta SOLO el frontend (start-server-and-test) y corre headless
```

`test:e2e:ci` no levanta `ecommerce-api` — `start-server-and-test` puede orquestar varios
servidores pero no puede garantizar que Mongo esté disponible (no es un contenedor, es un
servicio del sistema). Ver "Recomendaciones para CI/CD" más abajo para qué falta para
automatizar esto por completo.

### Datos de prueba: creación, preparación y limpieza

- **Usuarios de prueba (registro):** `buildUniqueUser()` en `cypress/utils/testData.js` genera
  `cypress-<timestamp>@example.com` en cada corrida — nunca colisiona, nunca necesita limpieza
  explícita (no hay `DELETE /api/users` en este backend por diseño; son cuentas de descarte
  inofensivas que quedan en la base).
- **Usuario para login/checkout:** el seed real (`user4@test.com`/`123456`, customer). No se crea
  por API — ya existe desde `npm run seed`.
- **Productos:** `cy.addProductToCart()` toma el primero real de `GET /api/products` — nunca un
  id fijo.
- **Carrito:** el carrito de un usuario con sesión es **híbrido** (`localStorage` + servidor, ver
  `CartContext.jsx`) — antes de cada test de checkout, el `beforeEach` vacía el carrito real del
  servidor con `DELETE /api/cart`, no solo `localStorage` (limpiar solo `localStorage` no alcanza
  para un usuario autenticado y deja tests dependientes de corridas anteriores — hallazgo real
  encontrado escribiendo esta suite, no un supuesto).
- **Direcciones y métodos de pago:** `checkout.cy.js` guarda los `_id` de lo que crea vía
  `cy.intercept` y los borra con `DELETE /api/addresses/:id`/`DELETE /api/payment-methods/:id`
  en un `afterEach` — ambos endpoints sí existen.
- **Órdenes:** **no se pueden limpiar.** `POST /api/orders` no tiene contraparte `DELETE` (ver
  [docs/contracts/orders.md](./contracts/orders.md)) — es una decisión de diseño del backend, no
  un hueco de esta suite. Cada corrida completa de `checkout.cy.js` deja una orden real en el
  historial de `user4@test.com`. Para un reset completo del catálogo/usuarios/órdenes de
  desarrollo: `SEED_ALLOW_RESET=true npm run seed` (borra y re-siembra las 7 colecciones — no
  correrlo casualmente, es destructivo para *todo* el dev DB, no solo los datos de Cypress).
- **Sección de dirección/pago ya colapsada:** si el usuario de prueba ya tiene una dirección o
  método de pago (de una corrida anterior, o del seed), `Checkout.jsx` los auto-selecciona y
  colapsa esa sección — `checkout.cy.js` maneja esto con un helper `ensureSectionExpanded()` que
  pulsa "Cambiar" solo si la sección ya está colapsada, en vez de asumir un estado inicial fijo.

### `cy.loginByApi()` y `cy.addProductToCart()`

Ambos en `cypress/support/commands.js`.

- **`cy.loginByApi({ email, password })`** — `POST /api/auth/login` directo (nunca pasa por
  `LoginForm`), usa `cy.session()` para cachear la sesión entre tests. Este backend usa JWT por
  header (`Authorization: Bearer`), **sin cookies HTTP-only ni sessionStorage** — el token se
  guarda en `localStorage["authToken"]` dentro del `setup` de `cy.session`, replicando
  exactamente lo que hace `AuthContext.jsx`. Como `cy.session()` no deja la app cargada, todo
  test que lo use debe hacer `cy.visit(...)` después.
- **`cy.addProductToCart({ productId?, quantity? })`** — usa la interfaz real (visita
  `/product/:id`, clickea "Agregar al carrito") porque el objetivo es validar la integración
  visual del carrito, no solo dejar una precondición. `ProductDetails.jsx` no tiene selector de
  cantidad propio (siempre agrega 1) — para `quantity > 1` el comando visita `/cart` después y
  usa el botón real "Aumentar cantidad" las veces que faga falta, en vez de inventar un mecanismo
  que no existe en la UI real.

### Qué partes del checkout están mockeadas

**Ninguna.** Es E2E real: `POST /api/auth/*`, `/api/addresses`, `/api/payment-methods` y
`/api/orders` van contra el backend real y escriben en Mongo real. Los `cy.intercept(...)` en las
specs son solo para crear **alias** (`cy.wait("@alias")`) y sincronizar la prueba con la
respuesta real — nunca para reemplazarla con un stub (a diferencia de MSW en los tests de
componentes, que sí reemplaza la red por completo).

### Qué no se puede probar completamente

- **Una pasarela de pago externa real** — no existe en este proyecto. `PaymentMethod` nunca se
  conecta a Stripe/PayPal/etc.; un cobro real requeriría integrarlo primero (fuera del alcance
  actual, ver `docs/backlog.md`).
- **Validación de campos obligatorios vacíos en `AddressForm`/`PaymentForm` vía Cypress
  `cy.get(...).click()` sin llenar nada:** esto SÍ funciona en Cypress (a diferencia de los tests
  Jest/jsdom, que no implementan la API de validación de restricciones HTML) porque Cypress corre
  en un navegador real — se verificó en vivo que el envío vacío efectivamente no dispara la
  petición.
- **Inventario/stock insuficiente en el flujo de carrito** — no existe esa validación en esta
  app (no se inventó una prueba para una regla que no está implementada).

### Tabla de `data-testid` y atributos de accesibilidad agregados

Solo se agregaron donde no había alternativa semántica estable (rol, label o texto). La mayoría
de los formularios (login, registro, dirección, pago) se prueban por `label`/`role`/texto real,
sin ningún `data-testid` nuevo.

| Módulo | Componente | Elemento | Identificador | Archivo |
|---|---|---|---|---|
| Header | `Header.jsx` | Contador del carrito | `data-testid="cart-count"` | `src/layout/Header/Header.jsx` |
| Carrito | `CartView.jsx` | Cantidad de un ítem | `data-testid="cart-item-quantity-{productId}"` | `src/components/Cart/CartView.jsx` |
| Carrito | `CartView.jsx` | Botón disminuir cantidad | `aria-label="Disminuir cantidad"` | `src/components/Cart/CartView.jsx` |
| Carrito | `CartView.jsx` | Botón aumentar cantidad | `aria-label="Aumentar cantidad"` | `src/components/Cart/CartView.jsx` |

Los `aria-label` de arriba son, ante todo, una corrección real de accesibilidad (los botones
`+`/`-` solo tenían un ícono SVG, sin nombre accesible) — que de paso resuelve la necesidad de un
selector estable, siguiendo el orden de prioridad de esta guía (rol+nombre antes que
`data-testid`). El resto de selectores usados en las specs son `cy.findByRole`/`findByLabelText`/
`findByText` sobre markup que ya era accesible, o clases CSS ya existentes y estables
(`.cart-item`, `.selected-address`, `.summary-section`, etc.) cuando no había una alternativa de
rol/texto razonable.

### Errores conocidos / limitaciones de este entorno

- **Cypress no puede ejecutarse en esta máquina de desarrollo (Windows), pero sí en CI.** El
  binario de Cypress (`Cypress.exe`, instalado y reinstalado limpio, firma Authenticode válida,
  `resources/app` completo) falla su propio smoke test interno (`Cypress.exe --smoke-test
  --ping=N`) con `bad option: --smoke-test` — un formato de error atípico para Electron, que
  sugiere una restricción de seguridad a nivel de sistema operativo en esta máquina, no un
  problema del proyecto ni de las specs. Se agotaron los pasos de diagnóstico seguros
  (reinstalación limpia, `cypress verify`, verificación de firma digital, `Unblock-File`) sin
  resolverlo. **Confirmado (2026-08-27) que el bloqueo es específico de esta máquina**: el job
  `e2e` de `.github/workflows/ci-cd.yml` corrió las 20 specs con el runner real de Cypress en
  Ubuntu (GitHub Actions) y las 20 pasaron —
  [run 33061741394](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/actions/runs/33061741394).
- **Verificación previa con Playwright (histórica, antes de tener CI funcionando):** cada flujo se
  había ejecutado de punta a punta contra el backend/frontend reales usando Playwright, replicando
  las mismas aserciones. Encontró y corrigió 3 problemas reales antes de la primera corrida real:
  (1) el carrito híbrido necesita limpiarse también en el servidor, no solo en `localStorage`;
  (2) las secciones de dirección/pago pueden cargar ya colapsadas si el usuario tiene datos
  previos; (3) la nota original de `B-13` mencionaba "recargar la página" como disparador del
  bug — verificado en vivo que es falso, el History API conserva `location.state` a través de un
  reload real. Esa verificación resultó ser evidencia útil pero incompleta: la primera corrida real
  en CI encontró 2 selectores propios ambiguos (`/envío/i`, `/total:/i` sin anclar, matcheaban
  también "Dirección de envío"/"Subtotal:") y un bug real de la app (`B-16`, condición de carrera
  en `CartContext.updateItem`) que Playwright no había detectado — confirma que ningún método
  alternativo sustituye correr las specs reales con su runner.

### Recomendaciones para CI/CD

(2026-08-27) Implementado en `.github/workflows/ci-cd.yml` — ya no es solo `npm ci` + build:

- **`test-api`**: `npm ci` + `npm run test:coverage`. No necesita Mongo real en el runner porque
  toda la suite usa `mongodb-memory-server` (levanta su propia instancia en memoria por test, ver
  `tests/integration/helpers/db.js`).
- **`test-app`**: `npm ci` + `npm test -- --coverage --watchAll=false` (con `CI: true` para que
  `react-scripts` corra Jest una sola vez) + `npm run build`.
- **`e2e`**: corre después de que `test-api`/`test-app` pasen (`needs:`). Usa un *service
  container* `mongo:7` real (Cypress necesita el backend real corriendo como proceso aparte, no
  importado dentro del test runner — `mongodb-memory-server` no sirve aquí), siembra datos con
  `npm run seed` (crea `user4@test.com`/`123456`, el usuario por defecto de
  `cy.loginByApi()`/`cypress.config.js`), levanta `ecommerce-api` en background, y usa
  `cypress-io/github-action@v6` para instalar dependencias del frontend, levantar
  `ecommerce-app` (`npm start`) y correr las specs contra ambos (`wait-on` sobre los dos puertos).
  Sube `cypress/videos`/`cypress/screenshots` como artifact solo si el job falla.
- Ningún paso usa `|| true` — cualquier test o spec rota rompe el pipeline.
- **Confirmado (2026-08-27)**: `test-api`, `test-app` y `e2e` corren en verde en un runner real de
  GitHub Actions (Ubuntu) —
  [run 33061741394](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/actions/runs/33061741394),
  20/20 specs de Cypress pasando. Llegar a esa primera corrida verde requirió 3 fixes reales al
  propio workflow: `PORT: 4001` (pensado solo para la API) vivía en el `env` a nivel de job y se
  filtraba al `npm start` del frontend; al frontend le faltaba `PORT: 3001` explícito porque
  `ecommerce-app/.env` está en `.gitignore` y no existe en el checkout de CI; y `wait-on`/
  `CYPRESS_BASE_URL`/`CYPRESS_API_URL`/`CORS_ALLOWED_ORIGINS` se cambiaron a `127.0.0.1` en vez de
  `localhost` (precaución adicional, no la causa raíz de esos fallos).
- **Lint agregado y confirmado (2026-08-27)**: paso `Lint` (`npm run lint`) en `test-api` y
  `test-app`, antes de los tests — confirmado en verde en
  [run 33068441727](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/actions/runs/33068441727).
  `ecommerce-app` ya tenía `eslint-config-react-app` disponible transitivamente vía `react-scripts`
  (usa el `eslintConfig` que ya existía en `package.json`), solo faltaba fijar `eslint` como
  devDependency directa y el script. `ecommerce-api` no tenía nada — se agregó
  `eslint.config.js` (flat config, ESM) con `@eslint/js` recommended + globals de node/vitest, y
  una convención propia: un parámetro/binding de catch prefijado con `_` es intencionalmente no
  usado (ej. el `next` obligatorio por la arity de un error handler de Express). Prettier no se
  agregó — no hacía falta para que el lint gatee el CI, y no se introduce una herramienta nueva
  sin necesidad real.

## Filosofía de cobertura (no es un número)

Este proyecto **no persigue un porcentaje global de cobertura** — un `%` alto se logra fácil con
asserts débiles y no dice nada sobre calidad real. El criterio real, ya aplicado de forma
consistente en todo el trabajo de `T-04`/`T-02`, es:

- **Modelos y middlewares (backend):** 100% de las reglas reales (`required`/`enum`/`min`,
  cada rama de `requireAuth`/`requireAdmin`/`validate`) — ya logrado, y es el único caso donde
  "100%" es literalmente el objetivo, porque son unidades pequeñas y cerradas.
- **Controllers/routes con suite de integración** (los 9 recursos reales: `auth`/`cart`/
  `category`/`product`/`address`/`paymentMethod`/`order`/`wishlist`/`user`): cada rama de
  estado/error real y documentada en [.claude/api-routes.md](../.claude/api-routes.md) — no un `%`
  de statements, sino "¿está probado cada 401/403/404/422/2xx real de esta ruta?". Extendido
  (2026-08-27) a los 5 recursos que solo se habían verificado con `curl` en vivo al cerrar cada
  `F-0X` — ver [docs/testing/test-matrix.md](testing/test-matrix.md).
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

- **Pruebas de carga** (`OBS-01`/`E9`) — Artillery no instalado todavía.
- **Ejecutar `npm run test:e2e` en esta máquina de desarrollo específica** — sigue bloqueado (ver
  "Errores conocidos" en la sección de E2E arriba), pero ya no importa: el runner real de Cypress
  corre y confirma las 20 specs en verde vía el job `e2e` de CI.

## Nota sobre `docs/test-plans/`

Ese directorio documenta una convención (un archivo de plan por spec, bajo `docs/test-plans/`)
que en la práctica nunca se adoptó: toda la planificación real de tests — backend y frontend —
vive consolidada en [TEST_PLAN.md](../TEST_PLAN.md) (raíz del repo), igual que
[backlog.md](./backlog.md) reemplazó al antiguo `PENDIENTES.md`. `TEST_PLAN.md` es la fuente de
verdad real; `docs/test-plans/README.md` describe un proceso que no ocurrió.
