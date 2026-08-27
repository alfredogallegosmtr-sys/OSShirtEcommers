# TEST_PLAN — OSShirtEcommers

> Monorepo: backend `ecommerce-api/` (este documento, sección de arriba) y frontend
> `ecommerce-app/` (sección "Frontend", al final — plan producido por `test-planner` el
> 2026-08-26, `T-02`, todavía sin tests escritos). Fuente de verdad de ambas: los archivos reales
> en `src/`, verificados leyendo el código, no supuestos.

# Backend — ecommerce-api

> Express 5 + Mongoose 9, ESM. Runner: **Vitest**. Ejecutar con `npm test` desde `ecommerce-api/`
> (script agregado 2026-08-26, cierra T-03 de `docs/backlog.md`; también hay
> `npm run test:watch` y `npm run test:coverage`).

## Leyenda de Estado

- `No iniciado` — caso definido, sin test escrito.
- `Hecho` — test escrito y en verde en la última corrida real (ver Evidencia).
- `Bloqueado` — no se puede escribir/correr todavía (motivo en Evidencia).

## Resumen

| Prioridad | Total casos | Hecho | Bloqueado |
|---|---|---|---|
| ALTA | 10 | 10 | — |
| MEDIA | 25 | 25 | — |
| BAJA | 25 | 25 | — |
| **Integración** (`T-04`) | 45 | 45 | — |

Corrida real completa (`npm test`, 2026-08-26, tras cerrar `T-04`/`B-10` — integración de
auth/cart/category/product con `supertest` + `mongodb-memory-server`, más el fix del error
handler global para duplicados de índice `unique`):
```
Test Files  15 passed (15)
     Tests  105 passed (105)
```
(60 unitarios preexistentes + 45 de integración, todo en verde.)

**Reporte de cobertura real** (`npm run test:coverage`, `coverage/coverage-summary.json`):

| Archivo | Stmts | Branch | Funcs |
|---|---|---|---|
| `src/middlewares/*.js` (2) | 100% | 100% | 100% |
| `src/models/*.js` (8) | 100% | 100% | 100% |
| `src/routes/*.js` (9) | 100%\* | 100%\* | 100%\* |
| `src/app.js` | 80% | 43.75% | 40% |
| `src/controllers/auth.controller.js` | 96.42% | 84.21% | 100% |
| `src/controllers/cart.controller.js` | 93.44% | 77.77% | 100% |
| `src/controllers/category.controller.js` | 82.6% | 54.54% | 100% |
| `src/controllers/product.controller.js` | 74.5% | 52.63% | 100% |
| `src/controllers/address.controller.js` | 17.85% | 0% | 0% |
| `src/controllers/paymentMethod.controller.js` | 17.85% | 0% | 0% |
| `src/controllers/order.controller.js` | 17.24% | 0% | 0% |
| `src/controllers/wishlist.controller.js` | 13.33% | 0% | 0% |
| `src/controllers/user.controller.js` | 9.67% | 0% | 0% |
| `src/config/db.conf.js` | 0% | — | 0% |
| **Total del proyecto** | **65.54%** | **45.74%** | **55.93%** |

\* Los archivos de `routes/` marcan 100% solo porque registrar las rutas al importar el módulo ya
ejecuta ese código — no implica que cada handler detrás se haya ejercitado (ver el % real de cada
`controller.js`).

**Los controllers de `address`/`paymentMethod`/`order`/`wishlist`/`user` siguen sin integración**
— `T-04` cubrió explícitamente auth/cart/category/product (el alcance original bloqueado por
`REF-01`); los otros 5 recursos quedan fuera de este alcance, no son un olvido. Con lo cubierto
hoy quedan verificados: el 100% de las reglas `required`/enum/`min` de los 8 modelos, el 100% de
`requireAuth`/`validate`, y por integración real (HTTP + Mongo real vía `mongodb-memory-server`):
register/login completos, el CRUD de `cart` con aislamiento cross-user, `requireAuth`+`requireAdmin`
en la escritura de `category`/`product` (401/403/pass), hard delete real de `category`, soft
delete real de `product`, la recursión de un nivel en `/:id/products`, el orden de rutas
`/search` vs `/:id`, y las 4 constraints `unique` de índice (`Product.slug`, `Category.slug`,
`User.email`, `Cart.user`) contra una DB real.

## Prioridad ALTA

### `src/middlewares/auth.middleware.js` — `requireAuth`
Archivo: `tests/unit/middlewares/auth.middleware.test.js` (5/5 `Hecho`)

| # | Caso | Estado |
|---|---|---|
| 1 | [happy] Bearer válido → `next()` + `req.user` poblado | Hecho |
| 2 | [negativo] sin header `Authorization` → 401 | Hecho |
| 3 | [negativo] prefijo mal formado (`bearer` minúscula) → 401 | Hecho |
| 4 | [negativo] firma inválida/corrupta → 401 | Hecho |
| 5 | [negativo] token expirado → 401 | Hecho |

### `src/middlewares/validation.js` — `validate`
Archivo: `tests/unit/middlewares/validate.middleware.test.js` (5/5 `Hecho`)

| # | Caso | Estado |
|---|---|---|
| 1 | [happy] sin errores tras validador que pasa → `next()` | Hecho |
| 2 | [negativo] un error de validador → 422 `{errors:[...]}` | Hecho |
| 3 | [negativo] múltiples errores acumulados en el array | Hecho |
| 4 | [caso límite] sin ningún validador corrido sobre `req` → se trata como válido | Hecho |
| 5 | [negativo] forma exacta del body: solo la clave `errors`, sin `message` | Hecho |

## Prioridad MEDIA

### `src/models/Product.js`
Archivo: `tests/unit/models/product.model.test.js` (7/7 `Hecho`)
happy válido · falta `name` · falta `price` · falta `slug` · falta `category` · `sizes` fuera del enum · defaults (`stock=0`, `is_active=true`, `is_deleted=false`)

### `src/models/Category.js`
Archivo: `tests/unit/models/category.model.test.js` (6/6 `Hecho`)
happy válido · falta `description` · falta `type` · `type` fuera del enum de 8 · falta `slug` · `parentCategory` null por defecto

### `src/models/Cart.js`
Archivo: `tests/unit/models/cart.model.test.js` (6/6 `Hecho`)
happy válido · falta `user` · `products[].quantity=0` (min:1) · **[caso límite] `quantity=1`
(mínimo exacto) no rechaza** · item sin `product` · `total=0` por defecto

### `src/models/User.js`
Archivo: `tests/unit/models/user.model.test.js` (6/6 `Hecho`)
happy válido · falta `email` · falta `password` · `role` fuera del enum · `email` se normaliza a lowercase · `role='customer'` por defecto

**Nota de alcance para los 4 modelos de arriba:** estos tests cubren `required`/`enum`/`min`/
defaults vía `Document.validate()` **sin conexión real a Mongo**. **No cubren `unique`**
(`Product.slug`, `Category.slug`, `User.email`, `Cart.user`): eso es una constraint de índice de
MongoDB, no de Mongoose, y solo se puede probar con una DB real (`mongodb-memory-server`) — queda
en la sección de integración, más abajo.

## Prioridad BAJA

Modelos sin controller ni router (no alcanzables por HTTP hoy; solo los usa `src/seed/seed.js`).
Mismo alcance/limitación que los de arriba (sin `unique`, sin DB real).

### `src/models/Address.js`
Archivo: `tests/unit/models/address.model.test.js` (7/7 `Hecho`)
happy válido · falta `user` · falta `address` · falta `postalCode` · `addressType` fuera del enum ·
**hallazgo real:** `postalCode` de 20 caracteres NO rechaza (min/max son no-ops en un campo
`String`, confirmado empíricamente corriendo el test, no supuesto) · defaults

### `src/models/PaymentMethod.js`
Archivo: `tests/unit/models/paymentMethod.model.test.js` (7/7 `Hecho`)
happy válido · falta `user` · falta `type` · `type` fuera del enum de 5 · `last4` de 5 caracteres
rechaza (`maxlength` sí se aplica, a diferencia del `max` no-op que tenía el viejo `cardNumber`) ·
**decisión S-03 (2026-08-26):** `cardNumber`/`cvv` ya no son campos del schema — se descartan
aunque se envíen · defaults

### `src/models/Order.js`
Archivo: `tests/unit/models/order.model.test.js` (7/7 `Hecho`)
happy válido · falta `totalPrice` (required, sin default) · falta `address` · falta
`paymentMethod` · `products[].quantity=0` · `status` fuera del enum · defaults
(`subtotalPrice=0`, `shippingCost=0`, `status`/`paymentStatus='pending'`)

### `src/models/WishList.js`
Archivo: `tests/unit/models/wishList.model.test.js` (4/4 `Hecho`)
happy válido · falta `user` · `products` puede ser array vacío sin rechazar · elemento `null`
dentro de `products` → rechaza (required es por elemento, no por longitud del arreglo)

## Diagnóstico de calidad de la suite (2026-08-26)

Auditoría cruzando código productivo, tests existentes y el reporte de cobertura de arriba
(`TEST_MATRIX.md`/`TEST_STATUS.md` no existen en este repo — se verificó con Glob antes de asumir
nada; este documento es la fuente real). 12 puntos revisados:

1. **Funciones críticas sin pruebas — CERRADO parcialmente 2026-08-26 (`T-04`):** `auth`, `cart`,
   `category`, `product` ahora tienen integración real (74–96% de statements cada uno, ver tabla
   de cobertura). `connectDB` sigue en 0% — decisión aplazada, ver "Pendientes Abiertos".
   `address`/`paymentMethod`/`order`/`wishlist`/`user` siguen sin integración — fuera del alcance
   de `T-04`, no un olvido.
2. **Ramas de error sin cubrir — CERRADO 2026-08-26:** el error handler global (`src/app.js`,
   `ValidationError`→422, `code:11000`→422, resto→500) ya está cubierto por los tests de
   admin/auth (403/401) y por los tests de slug duplicado en `product.test.js`/`category.test.js`
   — el E11000 cayendo al 500 genérico era real (confirmado empíricamente, no solo sospecha leída
   del código) y se corrigió el mismo día como `B-10`.
3. **Endpoints sin integración — CERRADO parcialmente 2026-08-26:** de los 19 endpoints reales de
   `.claude/api-routes.md`, los de `auth`/`cart`/`category`/`product` (11) ya están probados por
   HTTP real (`T-04`). Los otros 8 (`address`/`paymentMethod`/`order`/`wishlist`/`user`) siguen
   sin integración, solo verificados manualmente con curl al cerrar cada `F-0X`.
4. **Permisos sin comprobar — CERRADO 2026-08-26:** `T-04` confirma con test real que
   `requireAuth` está enganchado en las 5 rutas de `cart.routes.js` (401 sin token en cada una), y
   que `requireAdmin` en `category`/`product` (escritura) sí produce 403 con rol `customer` —
   verificado, no solo asumido intencional.
5. **Casos límite faltantes:** cerrado el de `Cart.quantity=1` (ver arriba). Quedan pendientes a
   nivel integración (fuera del alcance cubierto por `T-04`): `page=0`, búsqueda sin resultados,
   `price=0` exacto.
6. **Tests duplicados:** revisados los 58 casos originales uno por uno — ninguno es duplicado
   literal.
7. **Tests sin assertions útiles — CERRADO:** 29 casos en los 8 archivos de modelos verificaban
   solo `error.errors.campo` con `toBeDefined()`. Se reemplazaron todos por
   `error.errors.campo.kind` con el valor exacto de Mongoose (`"required"`, `"enum"` o `"min"`
   según corresponda), verificado empíricamente antes de generalizar el patrón (se corrió cada
   caso, no se asumió el valor de `kind`).
8. **Mocks excesivos:** ninguno — cero mocks de Mongoose en toda la suite.
9. **Tests que dependen del orden:** verificado corriendo la suite con `--sequence.shuffle` y cada
   archivo de forma aislada — mismos resultados en los tres casos.
10. **Conexiones abiertas:** ninguna (`validate()` no requiere conexión a Mongo).
11. **Tests lentos o inestables:** ~200ms de ejecución real para 59 casos en las 3 corridas
    (normal, shuffled, aislada) — estable.
12. **Archivos excluidos artificialmente de cobertura — CERRADO:** no existía `vitest.config.js`;
    sin él, un reporte de cobertura habría medido solo los archivos que los tests importan
    (ocultando el 0% real de controllers/routes). Se agregó `ecommerce-api/vitest.config.js` con
    `coverage.all:true` + `include:['src/**/*.js']`.

**Hallazgos Media cerrados en esta pasada:** punto 5 (boundary `quantity=1`) y punto 7 (29
aserciones débiles → `kind` exacto). **Hallazgos Crítica/Alta (1–4): CERRADOS 2026-08-26** — ver
`T-04` en la sección siguiente. `connectDB` (parte de 1) queda sin cubrir por decisión aparte, ver
"Pendientes Abiertos".

## Integración — `T-04` (Hecho 2026-08-26)

Bloqueado hasta que se resolvió `REF-01` (split `app.js`/`server.js`, ver `docs/backlog.md`):
`ecommerce-api/server.js` no exportaba `app` sin efectos secundarios, así que no se podía montar
`supertest`. Con `ecommerce-api/src/app.js` exportando la app limpia, se instalaron `supertest` y
`mongodb-memory-server` (únicas devDependencies agregadas) y se escribieron 44 tests en
`ecommerce-api/tests/integration/` (helpers en `helpers/db.js` — levanta/baja
`MongoMemoryServer` y conecta Mongoose — y `helpers/auth.js` — firma JWTs reales con el mismo
shape que `auth.controller.js`):

- `auth.test.js` (8) — register happy/email duplicado (422)/campos faltantes; login happy/
  password incorrecto (401)/email inexistente (401); el hash nunca aparece en ninguna respuesta.
- `cart.test.js` (11) — sin token → 401 en las 5 rutas; token expirado → 401 en las 5 rutas; CRUD
  autorizado completo con recálculo de `total` verificado en cada paso; aislamiento cross-user
  (usuario B con `itemId` de A → 404, sin filtrar el carrito de A).
- `category.test.js` (13) — lecturas públicas; escritura con `requireAuth`+`requireAdmin`
  (401/403/pass); hard delete real confirmado; recursión de un nivel en `GET /:id/products`
  (incluye hijo directo, no nieto).
- `product.test.js` (13) — mismo patrón 401/403/pass en escritura; soft delete real (el documento
  sigue existiendo con `is_deleted:true`, desaparece de los listados); `GET /search` alcanzable y
  no tapado por `GET /:id`; slug duplicado → 422 (antes 500, ver `B-10` abajo — mismo test,
  aserción actualizada al corregir el bug).
- `category.test.js` — se le agregó un tercer caso de slug duplicado → 422 al cerrar `B-10`, para
  confirmar que el fix generaliza más allá de `Product.slug` (14 casos en total).
- `unique-constraints.test.js` (4) — `Product.slug`, `Category.slug`, `User.email`, `Cart.user`
  duplicados, cada uno rechazado por Mongo (`code: 11000`) contra la DB real en memoria.

**Hallazgo confirmado con test real, cerrado como `B-10` el mismo día:** un `slug` duplicado en
`POST /api/products` producía un **500 genérico** en vez de un 422 manejado.
`product.controller.js` (`createProduct`) llama `Product.create(req.body)` sin capturar el error
de índice duplicado de Mongo (`MongoServerError`, `code: 11000`); el error handler global
(`src/app.js`) solo interceptaba `err.name === 'ValidationError'` (Mongoose), así que un E11000
caía al `else` → 500. Antes era una sospecha leída del código (punto 2 del diagnóstico); el test
lo confirmó empíricamente, y el fix se hizo en el **error handler global** (no con `try/catch` en
el controller, respetando la convención del repo): una rama nueva para `err.code === 11000` → 422
con un mensaje que nombra el campo/valor duplicados. Por vivir en el handler global, cubre
cualquier `unique` duplicado — se agregó un segundo test HTTP para `Category.slug` que confirma
que generaliza, no solo `Product.slug`.

**Detalle no obvio de la implementación:** `helpers/db.js` fija
`process.env.JWT_SECRET`/`JWT_REFRESH_SECRET`/etc. a mano antes de conectar, porque `src/app.js`
no llama `dotenv.config()` (sin efectos secundarios, por diseño de `REF-01`) — sin esto, firmar/
verificar JWTs en los tests fallaría en silencio contra un secreto `undefined`.
`unique-constraints.test.js` espera `Model.init()` antes de ejercitar los duplicados, porque los
índices `unique` se construyen de forma async al compilar cada modelo — sin esperarlo, el primer
test podría correr antes de que el índice exista y el duplicado no se rechazaría.

**Nota de infraestructura:** `npm run test:coverage` (instrumentación V8) tardaba lo suficiente
en levantar los 15 `MongoMemoryServer` (uno por archivo) como para superar el timeout default de
Vitest (5000ms) en 3 tests, de forma intermitente — no es un bug de la app, es overhead de
instrumentación + arranque concurrente de la DB en memoria. Se subió `testTimeout`/`hookTimeout`
a 20000ms en `vitest.config.js`; confirmado estable en corridas repetidas de `npm test` y
`npm run test:coverage` después del cambio.

## Pendientes Abiertos y Gaps Detectados

- **Fuera de este alcance (`T-04` cubrió explícitamente auth/cart/category/product):**
  integración de `address`/`paymentMethod`/`order`/`wishlist`/`user` — no están cubiertos por
  `supertest`, solo por curl manual (documentado en `docs/backlog.md`, cada F-0X). No es un
  olvido, es alcance.
- **Decisión aplazada:** cobertura de `src/config/db.conf.js` (`connectDB`) — probarla
  requeriría interceptar `mongoose.connect`/`process.exit`, lo cual roza "mockear Mongoose", algo
  que la convención del proyecto evita; queda sin cubrir hasta decidir un enfoque.
- **Hallazgo real documentado como test, no como bug a corregir aquí:** `Address.postalCode`
  tiene `min`/`max` que no hacen nada por estar en un campo `String` — ya estaba registrado en
  `docs/backlog.md`, ahora además tiene un test que lo demuestra en vez de solo documentarlo en
  prosa. El mismo hallazgo en `PaymentMethod.cardNumber` quedó resuelto de raíz al cerrar S-03: el
  campo ya no existe (se reemplazó por `last4` con `maxlength`, que sí funciona).
- **Backlog relacionado:** `docs/backlog.md` items `T-01` (en progreso, esta es su evidencia),
  `T-03` (cerrado, script `npm test` agregado), `REF-01` (cerrado, split `app.js`/`server.js`),
  `T-04` (**cerrado 2026-08-26** — integración real de auth/cart/category/product vía supertest +
  `mongodb-memory-server`, 45 tests), `B-10` (**cerrado el mismo día** — slug duplicado ahora
  responde 422, fix en el error handler global).

# Frontend — ecommerce-app

> Plan producido por el agente `test-planner` el 2026-08-26 (`T-02` de `docs/backlog.md`),
> read-only — no escribió ni ejecutó nada. `frontend-tester` (Testing Library + `user-event`,
> API interceptada con MSW, nunca mocks manuales de `fetch`/`axios`) es quien escribe y corre los
> tests a partir de este plan. **Estado: Prioridad ALTA `Hecho` (111 tests, 2026-08-26) — MEDIA y
> BAJA `No iniciado`.**

**Corrida real de la sección ALTA** (`CI=true npm test` en `ecommerce-app/`, 2026-08-26):
```
Test Suites: 17 passed, 17 total
Tests:       111 passed, 111 total
```
`msw@1.3.2` fue la única devDependency nueva instalada — se probó `msw@2.x` primero pero se
descartó por incompatibilidades reales entre `@mswjs/interceptors` (basado en sockets/Fetch) y el
toolchain fijo de este repo (CRA5 → Jest 27.5.1 → jsdom 16.7.0): `responseText` vacío en la ruta
XHR, `stream has been aborted` en la ruta `http`, y choques de `AbortSignal`/`ReadableStream`
entre realms — `msw@1.3.2` (interceptor XHR) funciona limpio contra ese jsdom sin tocar código de
producción. Infraestructura agregada, ningún archivo de producción tocado:
`ecommerce-app/src/mocks/server.js` (`setupServer()` sin handlers por defecto, cada test registra
los suyos con `server.use(...)`), `ecommerce-app/src/setupTests.js` (
`beforeAll(server.listen)`/`afterEach(server.resetHandlers)`/`afterAll(server.close)`, más un
polyfill de `TextEncoder`/`TextDecoder` — `react-router-dom` v7 lo necesita y jsdom 16 no lo
expone, hallazgo previo no relacionado con MSW) y un `jest.moduleNameMapper` en `package.json`
para `react-router/dom` (Jest 27 no resuelve el mapa `exports` de `package.json` que usa
`react-router-dom` v7, también preexistente).

**Dos casos del plan no se pudieron automatizar con este stack (documentados en el código, no
omitidos en silencio, sin bugs de producción encontrados):**
- `apiClient.js`, caso "timeout" (handler que excede 10000ms → `kind:"TIMEOUT"`):
  `@mswjs/interceptors` (`XMLHttpRequestOverride`) solo reenvía `xhr.timeout` a la petición real
  cuando la request no está interceptada (passthrough); para una respuesta mockeada nunca se
  agenda un timer propio, así que `ontimeout` no se dispara sin importar `ctx.delay(...)`.
  Verificado leyendo el código fuente de `@mswjs/interceptors`.
- `ProtectedRoute.jsx`, caso "auth aún cargando": la resolución de `loading` en `AuthContext` es
  100% síncrona y `render()` de Testing Library flushea los efectos vía `act()` antes de devolver
  el control al test, así que el render intermedio con `loading:true` nunca es observable en este
  stack sin mockear el propio `AuthContext` (fuera de alcance de "solo interceptar con MSW").

Alcance: `ecommerce-app/src/` (services, context, pages, components). Todos los casos se apoyan
en MSW interceptando los endpoints reales que consumen los servicios (`/api/auth/*`,
`/api/products*`, `/api/categories*`, `/api/cart*`, `/api/addresses*`, `/api/payment-methods*`,
`/api/orders`, `/api/wishlist*`, `/api/users/me*`) y en `@testing-library/user-event`. Nada de
mocks manuales de axios.

Formas de respuesta reales a respetar en los handlers MSW:
- `GET /api/products` → `{ products }`
- `GET /api/products/search` → `{ products, pagination:{page,limit,totalResults,totalPages} }`
- `GET /api/products/:id` → producto plano (404 si id inválido o inexistente)
- `GET /api/categories/:id/products` → `{ category, products }`
- `GET|POST|PATCH|DELETE /api/cart*` → `{ items:[{ _id|id, quantity, product }] }`
- `POST /api/auth/register` → 201 usuario sin token; 422 `{message:"User already exist"}`
- `POST /api/auth/login` → `{ token, refreshToken }`; 401 `{message:"Credenciales inválidas"}`
- `GET /api/wishlist` → `{ products:[...] }`
- `GET /api/orders` → array de órdenes con `products[].productId`, `address`, `paymentMethod` poblados

**Tres bugs reales encontrados por `test-planner` al leer el código (no al correr nada) — los
tres se verificaron leyendo el código fuente y luego se corrigieron el mismo día, ANTES de que
`frontend-tester` escriba ningún test, para que los casos de abajo prueben el comportamiento
correcto y no queden como tests de caracterización de un bug:**

1. **`LoginForm.jsx` (`handleLoginError`) — CORREGIDO 2026-08-26:** solo trataba
   `kind === 'CLIENT_ERROR' && status === 400`, pero el backend real responde **401** en
   credenciales inválidas (`kind: 'UNAUTHORIZED'`), así que una contraseña incorrecta caía al
   fallback genérico de `RegisterErrorMessage` ("Ocurrió un error inesperado... no es necesario
   reportarlo") en vez de "Email o contraseña incorrectos". Se agregó una rama explícita para
   `kind === 'UNAUTHORIZED'`. Verificado en vivo con Playwright: login con password incorrecto
   contra `user1@test.com` real → se ve "Email o contraseña incorrectos".
2. **`RegisterForm.jsx` (`handleRegisterError`) — CORREGIDO 2026-08-26:** el backend responde 422
   `{message:"User already exist"}` (sin array `errors`) en email duplicado, lo que `classifyError`
   traduce a `kind:"VALIDATION"` con `fields: undefined` — ninguna de las dos ramas existentes
   (`CLIENT_ERROR`+400, o `VALIDATION`+`fields`) lo capturaba, así que el registro fallaba **en
   silencio total** (el botón dejaba de cargar y no se veía ningún mensaje). Lo mismo pasaba con
   errores de red/timeout/servidor: ninguno seteaba `errorKind`, así que `RegisterErrorMessage`
   nunca se renderizaba. Se reordenó la función para chequear el mensaje del backend primero
   (independiente del `kind`) y se agregó un `setErrorKind(kind)` de fallback al final para que
   cualquier error no capturado por las ramas específicas sí muestre algo. Verificado en vivo con
   Playwright: registrar con `user1@test.com` (ya existente) → aparece "Este email ya está
   registrado" junto al campo email.
3. **`OrderConfirmation.jsx` — CORREGIDO 2026-08-26:** leía `order.address` (y otros campos)
   **síncronamente durante el render**, antes de que el `useEffect` que redirige a `/` cuando no
   hay `order` llegara a ejecutarse — entrar a `/order-confirmation` directamente (URL escrita a
   mano, recarga de página, link viejo) lanzaba `TypeError: Cannot read properties of undefined
   (reading 'address')` en vez de redirigir. Se agregó un `if (!order) return null;` justo
   después del `useEffect`. Verificado en vivo con Playwright: navegar a `/order-confirmation`
   sin `state` → redirige a `/` sin ningún error de página.

Estos tres hallazgos no están en `docs/backlog.md` como items abiertos — se cerraron el mismo día
que se encontraron (`B-11`, `B-12`, `B-13`), ver el detalle ahí.

## Prioridad ALTA

### ecommerce-app/src/services/apiClient.js
- [happy] Con `authToken` en `localStorage`, cualquier llamada de servicio sale con header
  `Authorization: Bearer <token>` (verificable capturando la request en el handler MSW).
- [negativo: sin token] Sin `authToken` en `localStorage` → la request se emite sin header
  `Authorization` (el handler recibe `authorization === null`).
- [negativo: classifyError 404] Endpoint responde 404 → la promesa del servicio se rechaza con
  `{ kind: "NOT_FOUND", status: 404 }`.
- [negativo: classifyError 401] Endpoint responde 401 → rechazo con `{ kind: "UNAUTHORIZED", status: 401 }`.
- [negativo: classifyError 403] Endpoint responde 403 → rechazo con `{ kind: "FORBIDDEN", status: 403 }`.
- [negativo: classifyError 422] Endpoint responde 422 con `{ errors:[{path,msg}] }` → rechazo con
  `{ kind: "VALIDATION", status: 422, fields: [...] }` (`fields` toma `response.data.errors`).
- [negativo: classifyError 422 sin `errors`] 422 con solo `{ message }` → `kind: "VALIDATION"` y
  `fields === undefined` (este es el caso real que producía el bug de `RegisterForm`, ya corregido
  — ver arriba).
- [negativo: classifyError otro 4xx] Endpoint responde 400 → rechazo con `{ kind: "CLIENT_ERROR", status: 400 }`.
- [negativo: classifyError 500] Endpoint responde 500 → rechazo con `{ kind: "SERVER_ERROR", status: 500 }`.
- [negativo: sin respuesta] Handler MSW devuelve error de red (`HttpResponse.error()`) → rechazo con
  `{ kind: "NETWORK" }`.
- [negativo: timeout] Handler que excede los 10 000 ms de `timeout` de axios (usar `delay`
  + timers falsos) → rechazo con `{ kind: "TIMEOUT" }`.

### ecommerce-app/src/utils/auth.js
- [happy] `saveToken(t)` + `getToken()` devuelve el token; `decodeToken(t)` devuelve
  `{userId,name,role,exp}`; `isTokenExpired(t)` con `exp` futuro → `false`.
- [negativo: saveToken sin valor] `saveToken(null)`/`saveToken("")` → no escribe nada y
  `getToken()` sigue devolviendo `null`.
- [negativo: getToken vacío] `localStorage` sin `authToken` → `getToken()` devuelve `null` (no `undefined`).
- [negativo: clearToken] Tras `clearToken()`, `getToken()` devuelve `null`.
- [negativo: decodeToken malformado] `decodeToken("no-es-un-jwt")` → `null` (no lanza).
- [negativo: isTokenExpired sin `exp`] Token cuyo payload no trae `exp` → `true`.
- [negativo: isTokenExpired vencido] Token con `exp` en el pasado → `true`.

### ecommerce-app/src/context/AuthContext.jsx
- [happy] `authToken` válido y vigente en `localStorage` → tras el montaje, el consumidor ve
  `isAuthenticated` verdadero y el nombre/rol del payload (`userId`, `name`, `role`).
- [negativo: sin token] `localStorage` vacío → `loading` termina, no hay usuario y la UI muestra
  el estado de invitado.
- [negativo: token expirado] `authToken` con `exp` pasado → se elimina de `localStorage` y el
  consumidor queda como invitado.
- [negativo: token indecodificable] `authToken = "basura"` → se limpia y no se expone usuario
  (no debe lanzar ni dejar la app en `loading` permanente).
- [happy login] `login({email,password})` con `POST /api/auth/login` 200 → guarda el token en
  `localStorage["authToken"]` y expone el usuario decodificado.
- [negativo: credenciales inválidas] `POST /api/auth/login` 401 → `login()` rechaza con
  `kind:"UNAUTHORIZED"` y el usuario sigue sin autenticar.
- [negativo: token no decodificable del backend] Login 200 con `token:"abc"` → `login()` lanza
  `"Token inválido del backend"` y el consumidor sigue como invitado.
- [negativo: logout] Tras `logout()`, `authToken` desaparece de `localStorage` y la UI vuelve a invitado.
- [negativo: sesión cerrada en otra pestaña] Disparar `StorageEvent` con
  `key:"authToken", newValue:null` → el consumidor pasa a invitado sin recargar.
- [negativo: hook fuera del provider] Renderizar un componente que use `useAuth()` sin
  `<AuthProvider>` → lanza `"useAuth debe usarse dentro de <AuthProvider>"`.

### ecommerce-app/src/context/CartContext.jsx
- [happy invitado] Sin sesión, `addItem(producto, 1)` → el ítem aparece en la UI, `count`/`total`
  reflejan cantidad × precio y el carrito queda persistido en `localStorage["cart"]`.
- [negativo: localStorage corrupto] `localStorage["cart"] = "{no-json"` → arranca con carrito
  vacío, sin lanzar.
- [negativo: ítem inválido en localStorage] Carrito guardado con un ítem sin `product` o con
  `product.price` no numérico → ese ítem se descarta al montar y no se renderiza.
- [negativo: producto repetido] `addItem(p,1)` dos veces sobre el mismo `_id` → un solo ítem con
  cantidad 2, no dos líneas.
- [negativo: invitado no depende del backend] Sin sesión y con `/api/cart` respondiendo 500, el
  ítem agregado sigue visible (el flujo de invitado nunca golpea la API).
- [negativo: rollback al agregar con sesión] Con sesión, `POST /api/cart` 500 → el ítem
  desaparece de la UI (vuelve al estado previo) y el contexto expone `error: "SERVER_ERROR"`.
- [negativo: cantidad < 1] `updateItem(itemId, 0)` → el ítem se elimina del carrito (delega en `removeItem`).
- [negativo: rollback al actualizar] Con sesión, `PATCH /api/cart/:itemId` 500 → la cantidad
  vuelve a su valor anterior en pantalla.
- [negativo: rollback al eliminar] Con sesión, `DELETE /api/cart/:itemId` 500 → el ítem reaparece.
- [negativo: rollback al vaciar] Con sesión, `DELETE /api/cart` 500 → los ítems reaparecen.
- [happy sync al iniciar sesión] Invitado con ítem A; al autenticarse, `GET /api/cart` devuelve
  ítem B → se hace `POST /api/cart` con A y la UI queda con lo que devuelve el servidor (A + B).
- [negativo: sync fallido] Al autenticarse, `GET /api/cart` 500 → el contexto expone
  `error: "SERVER_ERROR"` y la app no rompe.
- [negativo: hook fuera del provider] `useCart()` sin `<CartProvider>` → lanza
  `"useCart debe ser usado dentro de CartProvider"`.

### ecommerce-app/src/context/ThemeContext.jsx
- [happy] `localStorage["app:theme"] = "dark"` → `<html data-theme="dark">`; `toggleTheme()` lo
  cambia a `"light"` y persiste el nuevo valor.
- [negativo: valor no permitido en storage] `app:theme = "banana"` → se ignora y se usa
  `prefers-color-scheme` (con `matchMedia` mockeado a `matches:false` → `"light"`).
- [negativo: localStorage inaccesible] `getItem`/`setItem` que lanzan → el provider renderiza
  igual y aplica el tema por preferencia del sistema, sin propagar la excepción.
- [negativo: hook fuera del provider] `useTheme()` sin `<ThemeProvider>` → lanza
  `"useTheme must be used within a ThemeProvider"`.

### ecommerce-app/src/pages/ProtectedRoute.jsx
- [happy] Usuario autenticado y sin `allowedRoles` → se renderiza el contenido hijo.
- [negativo: auth aún cargando] Mientras `AuthContext` resuelve el token → no se renderiza el
  hijo ni se redirige (pantalla vacía; no debe "parpadear" el login).
- [negativo: no autenticado] Sin sesión → redirige a `redirectTo` (por defecto `/login`) y el
  hijo protegido no aparece; el `state.from` permite que LoginForm vuelva a la ruta original.
- [negativo: rol no permitido] Usuario con `role:"customer"` y `allowedRoles={["admin"]}` →
  se muestra "Acceso denegado" / "No tienes permisos para acceder a esta página." y no el hijo.

### ecommerce-app/src/components/RegisterForm/RegisterForm.jsx
- [happy] Formulario válido (nombre ≥ 2, email con formato, password ≥ 6, confirmación igual) →
  `POST /api/auth/register` 201 → navega a `/login` y allí se ve
  "Cuenta creada exitosamente..." con el email precargado.
- [negativo: nombre requerido] Nombre vacío → "El nombre es requerido" y no se emite la petición.
- [negativo: nombre < 2 caracteres] `"A"` → "El nombre debe de tener al menos dos caracteres".
- [negativo: email requerido] Email vacío → "El email es requerido".
- [negativo: formato de email] `"pepe@"` → "El email no tiene un formato válido".
- [negativo: password requerido] Password vacío → "El password es requerido".
- [negativo: password < 6] `"12345"` → "El password debe de tener al menos 6 caracteres".
- [negativo: confirmación distinta] `password` ≠ `confirmPassword` → "Las contraseñas no coinciden".
- [negativo: formato de teléfono] Teléfono `"abc"` → "El teléfono no tiene un formato válido"
  (el campo es opcional: vacío no debe producir error).
- [negativo: limpieza de error al escribir] Con el error de un campo visible, teclear en ese campo
  hace desaparecer su mensaje.
- [negativo: email ya registrado] `POST /api/auth/register` 422 con `{message:"User already exist"}`
  → "Este email ya está registrado" junto al campo email (bug `B-12`, corregido — ver arriba).
- [negativo: fallo de red] `POST /api/auth/register` con error de red → se ve el mensaje de
  `RegisterErrorMessage` para `NETWORK` ("No pudimos conectar con el servidor...") — antes no
  aparecía nada (mismo bug `B-12`, corregido).
- [negativo: estado de envío] Durante la petición el botón queda deshabilitado y muestra
  "Creando cuenta...".

### ecommerce-app/src/components/LoginForm/LoginForm.jsx
- [happy] Email + password correctos → `POST /api/auth/login` 200 → se guarda sesión y navega a `/`.
- [happy redirect] Entrando con `state.from = "/checkout"` (lo que pone `ProtectedRoute`) → tras
  login se navega a `/checkout`, no a `/`.
- [happy justRegistered] Entrando con `state = {justRegistered:true, email:"a@b.com"}` → se ve
  "Cuenta creada exitosamente..." y el campo email precargado con `a@b.com`.
- [negativo: credenciales inválidas] `POST /api/auth/login` 401 → "Email o contraseña incorrectos"
  (bug `B-11`, corregido — ver arriba; antes caía en el fallback genérico de `RegisterErrorMessage`).
- [negativo: fallo de red] Error de red → "No pudimos conectar con el servidor. Revisa tu conexión
  a internet." (vía `RegisterErrorMessage` con `kind:"NETWORK"`).
- [negativo: error del servidor] 500 → "Algo salió mal de nuestro lado. Intenta de nuevo en unos minutos."
- [negativo: estado de envío] Durante la petición el botón está deshabilitado y dice
  "Iniciando sesión...".

### ecommerce-app/src/services/authService.js
- [happy register] `register({name," Ana ", email:"  ANA@Mail.com ", password:"secreto"})` → el
  handler recibe `name:"Ana"` y `email:"ana@mail.com"`; devuelve el body del backend.
- [negativo: teléfono vacío] `phone: "   "` → el body enviado no incluye `phone` (queda `undefined`).
- [negativo: error del backend] 422 en `/auth/register` → la promesa se rechaza con el objeto
  clasificado (`kind:"VALIDATION"`), sin envolverlo ni tragarlo.
- [happy login] Login 200 → devuelve exactamente `{ token, refreshToken }` (no el `response` completo).
- [negativo: credenciales inválidas] Login 401 → rechaza con `kind:"UNAUTHORIZED"`.

### ecommerce-app/src/services/productsService.js
- [happy] `getAllProducts()` devuelve `{ products }` tal cual lo manda el backend.
- [happy] `getProductById(id)` devuelve el producto.
- [negativo: producto inexistente] `GET /api/products/:id` 404 → rechaza con `kind:"NOT_FOUND"`.
- [happy] `searchProducts({q:"naruto", sort:"price", order:"asc"})` → el handler recibe esos
  query params y se devuelve `{products, pagination}`.
- [negativo: precio NaN] `searchProducts({minPrice: NaN})` → `minPrice` no viaja en la query.
- [negativo: precio nulo] `searchProducts({maxPrice: null})` → `maxPrice` no viaja en la query.
- [negativo: inStock no booleano] `searchProducts({inStock:"true"})` → `inStock` no viaja en la query.
- [negativo: sin filtros] `searchProducts()` → petición a `/products/search` sin ningún query param.
- [happy admin CRUD] `createProduct`/`updateProduct` devuelven el producto; `deleteProduct`
  resuelve sin valor con 204.
- [negativo: sin rol admin] Cualquiera de las tres contra un handler que responde 403 → rechaza
  con `kind:"FORBIDDEN"`.

### ecommerce-app/src/services/categoryService.js
- [happy] `getAllCategories()` devuelve el array; `getCategoryById(id)` devuelve la categoría.
- [happy paginación por defecto] `getProductsByCategoryAndChildren(id)` → el handler recibe
  `page=1` y `limit=10`; con `{page:2, limit:50}` recibe esos valores.
- [negativo: id inválido] `GET /api/categories/:id/products` 422 → rechaza con `kind:"VALIDATION"`.
- [negativo: categoría inexistente] `getCategoryById` con 404 → rechaza con `kind:"NOT_FOUND"`.
- [negativo: sin rol admin] `createCategory`/`updateCategory`/`deleteCategory` con 403 → rechazan
  con `kind:"FORBIDDEN"`.

### ecommerce-app/src/services/cartService.js
- [happy] `getCart()` devuelve `{items}`; `addItem(productId)` envía `quantity:1` por defecto;
  `updateQuantity(itemId, 3)` envía `{quantity:3}` a `PATCH /api/cart/:itemId`;
  `removeItem`/`clearCart` devuelven el carrito actualizado.
- [negativo: sin sesión] Handler responde 401 → todas rechazan con `kind:"UNAUTHORIZED"`.
- [negativo: cantidad inválida] `updateQuantity(itemId, 0)` contra un handler 422 → rechaza con
  `kind:"VALIDATION"` (el clamp de cantidad vive en `CartContext`, no aquí).

### ecommerce-app/src/services/wishlistService.js
- [happy] `getWishlist()` devuelve `{products}`; `addToWishlist(id)` envía `{productId}`;
  `removeFromWishlist(id)` pega a `DELETE /api/wishlist/:productId` y devuelve la lista actualizada.
- [negativo: sin sesión] 401 → rechaza con `kind:"UNAUTHORIZED"`.

### ecommerce-app/src/services/orderService.js
- [happy] `getOrders()` devuelve el array de órdenes; `createOrder({addressId, paymentMethodId})`
  envía exactamente esos dos campos (nada de productos ni totales).
- [negativo: datos no válidos] `POST /api/orders` 422 (carrito vacío o ids ausentes) → rechaza con
  `kind:"VALIDATION"`.

### ecommerce-app/src/services/addressService.js
- [happy] `getAddresses`, `createAddress`, `updateAddress`, `deleteAddress` devuelven `response.data`
  y pegan a `/addresses` y `/addresses/:id`.
- [negativo: dirección de otro usuario] `PUT`/`DELETE` con 404 → rechaza con `kind:"NOT_FOUND"`.

### ecommerce-app/src/services/paymentMethodService.js
- [happy] CRUD contra `/payment-methods` devolviendo `response.data`.
- [negativo: datos de tarjeta prohibidos] `createPaymentMethod({cardNumber, cvv})` contra el
  handler que responde 422 → rechaza con `kind:"VALIDATION"` (el backend rechaza `cardNumber`/`cvv`).
- [negativo: método de otro usuario] `PUT`/`DELETE` con 404 → rechaza con `kind:"NOT_FOUND"`.

### ecommerce-app/src/services/userService.js
- [happy] `getMe()` devuelve el usuario; `updateMe({name,email})` devuelve el usuario actualizado;
  `changePassword({currentPassword,newPassword})` envía ambos campos a `/users/me/password`.
- [negativo: email en uso] `PUT /api/users/me` 422 `{message:"User already exist"}` → rechaza con el
  objeto clasificado, con el mensaje accesible en `err.original.response.data.message`.
- [negativo: contraseña actual incorrecta] `PUT /api/users/me/password` 401 → rechaza con
  `kind:"UNAUTHORIZED"` y `err.original.response.status === 401`.

---

## Prioridad MEDIA

### ecommerce-app/src/components/ProductDetails/ProductDetails.jsx
- [happy] `GET /api/products/:id` 200 → se ven nombre, descripción, precio, badge "En stock",
  "N unidades disponibles", breadcrumb de la categoría y el botón "Agregar al carrito" habilitado.
- [negativo: producto sin stock] `stock: 0` → badge "Agotado", sin línea de unidades y el botón
  "Agregar al carrito" deshabilitado.
- [negativo: 404] `kind:"NOT_FOUND"` → "Producto no encontrado" + enlace "Volver al catálogo".
- [negativo: red/timeout] Error de red → "No pudimos conectar con el servidor." + botón "Reintentar".
- [negativo: 500] → "Algo salió mal de nuestro lado."
- [negativo: error no clasificado] Cualquier otro `kind` (p. ej. 403 → `FORBIDDEN`) →
  "Ocurrió un error inesperado."
- [negativo: favoritos oculto para invitados] Sin sesión → no aparece el botón de favoritos y
  no se llama a `/api/wishlist`.
- [happy favoritos] Con sesión y el producto ya en `GET /api/wishlist` → el botón dice
  "♥ En favoritos"; al pulsarlo se llama a `DELETE /api/wishlist/:id` y pasa a "♡ Agregar a favoritos".
- [negativo: fallo de wishlist] `POST /api/wishlist` 500 → no aparece ningún error bloqueante y el
  resto de la ficha sigue usable (fallo silencioso deliberado).
- [happy agregar al carrito] Click en "Agregar al carrito" → el contador del carrito refleja el ítem.
- [regresión B-09] Estados de carga/error se renderizan como *children* de `Loading`/`ErrorMessage`:
  los textos deben ser visibles en pantalla (no pasarse como prop `message`).

### ecommerce-app/src/components/CategoryProducts/CategoryProducts.jsx
- [happy] `GET /api/categories/:id/products` 200 con `{category, products}` → título de la categoría,
  descripción, breadcrumb y una tarjeta por producto.
- [happy título anidado] Categoría con `parentCategory` poblada → el encabezado muestra
  "Padre: Hija".
- [negativo: error de carga] 404/500 → "Categoría no encontrada" + enlace al inicio.
- [negativo: categoría ausente] Respuesta 200 con `category: null` → mismo bloque
  "Categoría no encontrada" (no debe renderizar el grid vacío).
- [negativo: categoría sin productos] `products: []` → "No se encontraron productos" /
  "No hay productos disponibles en esta categoría por el momento."
- [regresión B-09] Durante la carga se ve el texto "Cargando categoría y productos..." dentro de
  `Loading`.

### ecommerce-app/src/pages/Home.jsx
- [happy] `GET /api/products` con ≥ 5 productos → se ven las secciones "Productos recomendados",
  "Ofertas del día", "Novedades", "Más vendidos" y "Flash sale", más el carrusel de banners.
- [negativo: catálogo vacío] `{products: []}` → "No hay productos en el catálogo." y ninguna sección.
- [negativo: red] Error de red → "No pudimos conectar. Revisa tu conexión a internet".
- [negativo: 500] → "Algo salió mal. Intenta mas tarde."
- [negativo: otro error] 403 → "Ocurrió un error inesperado." (con el `kind` concatenado).
- [happy loading] Mientras responde el handler se ve "Cargando productos...".

### ecommerce-app/src/components/SearchResultsList/SearchResultsList.jsx
- [happy con query] `/search?q=naruto` → título `Resultados para "naruto"`,
  "Encontramos N productos" (de `pagination.totalResults`) y la lista de resultados.
- [happy sin query] `/search` sin `q` → "Explora nuestro catálogo" y no se muestran los controles
  de ordenamiento.
- [happy ordenamiento] Con query, cambiar el `select` a "Precio" y pulsar el botón de orden →
  se repite la búsqueda con `sort=price` y `order` alternado (`Descendente` ↔ `Ascendente`).
- [negativo: sin coincidencias] Query con `products: []` → `No encontramos coincidencias para "..."`
  + enlace "Ofertas destacadas".
- [negativo: red] Error de red → "No pudimos conectar con el servidor".
- [negativo: 500] → "Algo salió mal de nuestro lado".
- [negativo: otro error] 403 → "Ocurrió un error inesperado".
- [happy loading] Durante la búsqueda se ve "Buscando productos...".

### ecommerce-app/src/pages/Cart.jsx
- [happy] Carrito con ítems → encabezado "Carrito de Compras", el conteo "N artículos", el total
  formateado y el botón "Proceder al pago" habilitado (navega a `/checkout`).
- [negativo: carrito vacío] Sin ítems → "Tu carrito está vacío" + botón "Continuar Comprando" que
  navega a `/`, sin resumen ni botón de pago.
- [happy vaciar] "Vaciar carrito" deja el carrito vacío y muestra el estado vacío.
- [negativo: singular/plural] Un solo artículo → "1 artículo" (no "1 artículos").

### ecommerce-app/src/components/Cart/CartView.jsx
- [happy] Con ítems, cada línea muestra nombre, precio con dos decimales y el subtotal
  `precio × cantidad`.
- [happy incrementar] El botón "+" sube la cantidad y recalcula el subtotal de la línea.
- [negativo: decrementar hasta 0] Con cantidad 1, pulsar "−" elimina la línea del carrito
  (regla `quantity < 1 → removeItem` de `CartContext`).
- [happy eliminar] El botón con `title="Eliminar artículo"` quita la línea.
- [negativo: carrito vacío] Sin ítems → encabezado "0 artículos" y ninguna línea renderizada.

### ecommerce-app/src/pages/Checkout.jsx
- [happy] Con carrito no vacío, direcciones y métodos de pago → se preselecciona la marcada como
  `isDefault`, se muestran subtotal, IVA (16 %), envío y total, y "Confirmar y Pagar" está habilitado.
- [happy crear orden] Click en "Confirmar y Pagar" → `POST /api/orders` con
  `{addressId, paymentMethodId}` → navega a `/order-confirmation` y el carrito queda vacío.
- [negativo: carrito vacío] Entrar con carrito vacío → redirige a `/cart` (no se queda en checkout).
- [negativo: fallo al cargar datos] `GET /api/addresses` o `/api/payment-methods` 500 →
  "No se pudo cargar direcciones o métodos de pago." y no se renderiza el formulario.
- [negativo: sin dirección seleccionada] Lista de direcciones vacía → "Confirmar y Pagar"
  deshabilitado con `title` "Selecciona una dirección de envío" y la sección de dirección abierta.
- [negativo: sin método de pago] Lista de métodos vacía → botón deshabilitado con `title`
  "Selecciona un método de pago".
- [negativo: fallo al crear la orden] `POST /api/orders` 500 → "No se pudo completar la orden." y
  se permanece en checkout con el carrito intacto.
- [negativo: fallo al guardar dirección] `POST /api/addresses` 500 → "No se pudo guardar la dirección."
- [negativo: fallo al eliminar dirección] `DELETE /api/addresses/:id` 500 → "No se pudo eliminar la dirección."
- [negativo: fallo al guardar pago] `POST /api/payment-methods` 500 → "No se pudo guardar el método de pago."
- [negativo: fallo al eliminar pago] `DELETE /api/payment-methods/:id` 500 → "No se pudo eliminar el método de pago."
- [happy envío gratis] Subtotal ≥ 1000 → la línea de envío dice "Gratis" y el total = subtotal + IVA.
- [negativo: envío con costo] Subtotal < 1000 → la línea de envío muestra $350.00 y entra en el total.
- [happy recarga tras guardar] Tras guardar una dirección, se vuelve a consultar `GET /api/addresses`
  y queda seleccionada la guardada (regla de `isDefault` server-side).

### ecommerce-app/src/pages/Orders.jsx
- [happy] `GET /api/orders` con dos órdenes → "Mis pedidos", "Tienes 2 pedidos en tu cuenta",
  la primera queda seleccionada y su detalle muestra total, subtotal, IVA derivado, envío,
  dirección, método de pago y productos.
- [happy selección] Click en otra orden de la lista → el panel de detalle cambia a esa orden.
- [negativo: sin pedidos] `[]` → "No tienes pedidos todavía" + "Descubrir productos".
- [negativo: error de carga] 500 → "No pudimos cargar tus pedidos" / "No se pudieron cargar tus pedidos."
- [negativo: orden sin dirección] Orden con `address: null` → "Sin dirección registrada."
- [negativo: orden sin método de pago] `paymentMethod: null` → "Sin método de pago registrado."
- [negativo: fecha ausente] Orden sin `createdAt` → "Fecha desconocida".
- [negativo: envío gratis] `shippingCost: 0` → la fila de envío dice "Gratis".
- [happy loading] Durante la carga se ve "Cargando tus pedidos...".

### ecommerce-app/src/pages/WishList.jsx
- [happy] `GET /api/wishlist` con productos → "Mi lista de favoritos", "Tienes N productos guardados"
  y una tarjeta por producto.
- [happy quitar] "Quitar de favoritos" → `DELETE /api/wishlist/:productId` y el producto desaparece.
- [negativo: lista vacía] `{products: []}` → "Tu lista de favoritos está vacía" + "Descubrir productos".
- [negativo: error de carga] 500 → "No se pudo cargar tu lista de favoritos."
- [negativo: error al quitar] `DELETE` 500 → "No se pudo quitar el producto de favoritos."
- [negativo: singular] Un solo producto → "Tienes 1 producto guardado".

### ecommerce-app/src/pages/Setttings.jsx
- [happy perfil] `GET /api/users/me` 200 → los campos Nombre/Email vienen precargados; al guardar,
  `PUT /api/users/me` 200 → "Perfil actualizado correctamente."
- [negativo: email en uso] `PUT /api/users/me` 422 `{message:"User already exist"}` →
  "Ese email ya está en uso por otra cuenta."
- [negativo: otro fallo al guardar perfil] `PUT /api/users/me` 500 → "No se pudo actualizar tu perfil."
- [happy contraseña] Contraseña actual + nueva + confirmación iguales → `PUT /api/users/me/password`
  200 → "Contraseña actualizada correctamente." y los tres campos quedan vacíos.
- [negativo: confirmación distinta] Nueva ≠ confirmación → "Las contraseñas nuevas no coinciden."
  y **no** se emite la petición.
- [negativo: contraseña actual incorrecta] `PUT /api/users/me/password` 401 →
  "La contraseña actual no es correcta."
- [negativo: otro fallo al cambiar contraseña] 500 → "No se pudo cambiar tu contraseña."
- [negativo: fallo al cargar] `GET /api/users/me` 500 → "No se pudo cargar tu información." y no se
  renderizan los formularios.

### ecommerce-app/src/pages/Profile.jsx
- [happy] `GET /api/users/me` 200 → se renderiza `ProfileCard` con los datos del backend.
- [negativo: error de carga] 500 → "No se pudo cargar tu perfil." y no se renderiza la tarjeta.
- [happy loading] Durante la carga se ve "Cargando tu perfil...".

### ecommerce-app/src/components/ProfileCard/ProfileCard.jsx
- [happy] Con `userProp` del backend (`{name, email, role:"customer", isActive:true, last_login}`)
  → se ve el nombre, el email, la insignia "customer", "Activo" y la fecha de última conexión
  formateada (regresión de los nombres de campo `role` / `last_login`).
- [negativo: sin `userProp`] Sin prop y con usuario en `AuthContext` → se usa el del contexto.
- [negativo: sin rol] Usuario sin `role` → la insignia muestra "guest".
- [negativo: sin `last_login`] Usuario sin ese campo → "No disponible" (no "Invalid Date").
- [negativo: usuario inactivo] `isActive: false` → "Inactivo".
- [negativo: acciones según rol] `role:"admin"` → aparece "Ver todos los pedidos";
  `role:"customer"` → aparece "Ver mis pedidos" (y no la variante admin).
- [happy navegación] "Editar Perfil" navega a `/settings`; "Ver mis pedidos" navega a `/orders`.

### ecommerce-app/src/pages/OrderConfirmation.jsx
- [happy] Navegando con `state.order` completo → "¡Gracias por tu compra!", el `#id` del pedido,
  la fecha, los productos con cantidad y precio, subtotal, IVA derivado, envío, total y la dirección.
- [negativo: sin orden en el state] Entrar a `/order-confirmation` sin `state` → redirige a `/`
  (bug `B-13`, corregido — ver arriba; antes lanzaba `TypeError` al leer `order.address` antes de
  que el `useEffect` de redirección corriera).
- [negativo: dirección incompleta] Orden con `address: {}` → "No disponible" /
  "Ciudad, estado y código postal no disponibles" / "País no especificado".
- [negativo: sin fecha] Orden sin `createdAt` → "No disponible".

### ecommerce-app/src/components/ProductCard/ProductCard.jsx
- [happy] Producto con stock → nombre enlazado a `/product/:id`, precio, badge "En stock" y botón
  "Agregar al carrito" habilitado que suma al carrito.
- [negativo: sin stock] `stock: 0` → badge "Agotado" y botón deshabilitado (el click no altera el carrito).
- [negativo: descripción larga] Descripción > 60 caracteres → se muestra truncada con "...".
- [negativo: sin descripción] Producto sin `description` → no se renderiza el párrafo.
- [negativo: con descuento] `discount: 20` → aparece la insignia "-20%"; sin `discount` no aparece.
- [negativo: sin imagen] Producto sin `imageURL` ni `images` → se usa `/img/products/placeholder.svg`.
- [negativo: prop `product` ausente] Renderizar sin `product` → se espera "Producto no disponible"
  (verificar que la desestructuración `const {name,...} = product || {}` y el acceso posterior a
  `product.discount`/`product._id` no rompan antes de llegar al guard).

### ecommerce-app/src/layout/Navigation/Navigation.jsx
- [happy escritorio] `GET /api/categories` 200 → al abrir "Todas las categorías" se listan solo las
  raíces (sin `parentCategory`) y sus subcategorías ordenadas alfabéticamente, enlazadas a
  `/category/:id`.
- [happy panel lateral] "Menú" abre el drawer; una categoría con subcategorías se expande/colapsa al
  pulsarla (`aria-expanded`), y una sin subcategorías es un enlace directo.
- [happy cerrar con Escape] Con el drawer abierto, `Escape` lo cierra.
- [negativo: error al cargar categorías] 500 → "No pudimos cargar las categorías." en el desplegable,
  el drawer y la versión móvil.
- [negativo: sin categorías] `[]` → no se listan categorías, pero los enlaces fijos
  (Ofertas del día, Novedades, Más vendidos, Flash sale) siguen presentes.
- [happy móvil] Con `isMobile` → solo enlaces planos; al pulsar uno se invoca `onLinkClick`
  (cierra el menú del Header).
- [negativo: saludo de invitado] Sin sesión, el drawer muestra "Hola, Inicia sesión";
  con sesión, "Hola, <primer nombre>".
- [happy loading] Mientras cargan las categorías se ve "Cargando categorías...".

### ecommerce-app/src/layout/Header/Header.jsx
- [happy búsqueda] Escribir "naruto" y enviar el formulario → navega a `/search?q=naruto`.
- [negativo: búsqueda vacía] Enviar con el campo vacío o solo espacios → navega a `/search` sin `q`.
- [negativo: invitado] Sin sesión → "Hola, Inicia sesión" y el menú de usuario ofrece
  "Iniciar Sesión" / "Crear Cuenta" (no aparecen "Mis Pedidos" ni "Cerrar Sesión").
- [happy autenticado] Con sesión → "Hola, <nombre>", iniciales en el avatar y enlaces a
  Mi Cuenta / Mis Pedidos / Lista de Deseos / Configuración.
- [happy logout] "Cerrar Sesión" limpia la sesión, cierra el menú y navega a `/`.
- [happy contador del carrito] Con 3 unidades en el carrito, la insignia muestra 3; con carrito
  vacío muestra 0.
- [happy tema] El botón "Cambiar tema" alterna `data-theme` en `<html>` y su `aria-pressed`.
- [negativo: cerrar con Escape] Con el menú de usuario abierto, `Escape` lo cierra.

### ecommerce-app/src/layout/Breadcrumb/Breadcrumb.jsx
- [happy] Categoría con `parentCategory` poblada → migas "Inicio > Padre > Hija", con la última como
  `aria-current="page"` y las anteriores enlazadas a `/category/:id`.
- [negativo: sin categorías] `categories` ausente o `[]` → no se renderiza nada.
- [negativo: `parentCategory` sin poblar] `parentCategory` como string (ObjectId crudo) → la cadena
  se corta ahí y no aparece una miga sin nombre.
- [happy array] Recibiendo un array de categorías → se usa la última como categoría actual.

### ecommerce-app/src/components/List/List.jsx
- [happy grid] `layout="grid"` → el título y una `ProductCard` por producto.
- [happy vertical] `layout="vertical"` → tarjetas en orientación horizontal, una por producto.
- [happy carrusel] `layout="carousel"` → botones "Producto anterior"/"Siguiente producto" y el set
  de productos repetido (loop); pulsar los controles no rompe el render.
- [negativo: sin productos] `products: []` → solo el título, sin tarjetas (y sin arrancar el
  auto-avance).
- [negativo: título por defecto] Sin prop `title` → "Nuestros Productos".

### ecommerce-app/src/components/BannerCarousel/BannerCarousel.jsx
- [happy] Con 3 banners → se ve el título/subtítulo del primero, el contador "1 / 3" e indicadores.
- [happy navegación] "Banner siguiente" avanza el contador a "2 / 3"; desde el último vuelve a "1 / 3".
- [happy anterior] "Banner anterior" desde el primero salta al último ("3 / 3").
- [negativo: sin banners] `banners: []` → "No hay banners disponibles" y ningún control.
- [negativo: un solo banner] `banners.length === 1` → no se renderizan flechas ni indicadores.

### ecommerce-app/src/components/Checkout/Address/AddressForm.jsx
- [happy alta] Rellenar dirección, ciudad, estado, CP, país y teléfono y enviar → `onSubmit` recibe
  esos valores con `addressType:"home"` e `isDefault:false`, y el formulario queda limpio.
- [negativo: campos requeridos] Enviar con "Dirección" vacía → el navegador bloquea el envío
  (`required`) y `onSubmit` no se ejecuta.
- [happy edición] Con `initialValues` y `isEdit` → título "Editar Dirección", campos precargados,
  botón "Guardar Cambios" y el formulario **no** se limpia tras enviar.
- [happy predeterminada] Marcar el checkbox → `onSubmit` recibe `isDefault: true`.
- [happy cancelar] Con `onCancel` → aparece "Cancelar" y al pulsarlo se invoca; sin `onCancel` el
  botón no se renderiza.

### ecommerce-app/src/components/Checkout/Payment/PaymentForm.jsx
- [happy alta] Número "4111111111111111", titular y "12/28" → `onSubmit` recibe
  `{type:"credit_card", cardHolderName, expiryDate, isDefault, last4:"1111", brand:"visa"}`.
- [negativo: el número completo nunca sale] El payload entregado a `onSubmit` no contiene
  `cardNumber` ni `cvv` (regla S-03).
- [negativo: menos de 4 dígitos] Número "12" → el payload no incluye `last4` ni `brand`.
- [happy marcas] "5..." → `brand:"mastercard"`; "3..." → `"amex"`; "6..." → `"other"`.
- [happy edición] Con `initialValues.last4` e `isEdit` → el campo muestra `**** **** **** 1234`,
  el título es "Editar Método de Pago" y el número no es obligatorio.
- [negativo: campos requeridos en alta] Sin `isEdit`, enviar con el número vacío → el envío se
  bloquea (`required`) y `onSubmit` no corre.

### ecommerce-app/src/components/Checkout/Address/AddressList.jsx y Payment/PaymentList.jsx
- [happy] Con N elementos se renderizan N ítems y el ítem cuyo `_id` coincide con el seleccionado
  aparece como "Seleccionada"; "Agregar Nueva Dirección"/"Agregar Nueva Tarjeta" invocan `onAdd`.
- [negativo: lista vacía] `[]` → solo el encabezado y el botón de alta, sin ítems.

### ecommerce-app/src/components/Checkout/shared/SummarySection.jsx
- [happy expandido] `isExpanded` → se renderizan los children y no el resumen.
- [negativo: colapsado con selección] `!isExpanded` y `selected` → se ve `summaryContent`, el botón
  "Cambiar" y la marca "✓", y no los children.
- [negativo: colapsado sin selección] `!isExpanded` y `selected` falsy → no se muestra ni el
  resumen ni la marca.
- [negativo: click sobre un botón no togglea] Pulsar "Cambiar" invoca `onToggle` una sola vez (el
  handler del header ignora los clicks originados en botones).

### ecommerce-app/src/components/RegisterErrorMessage/RegisterErrorMessage.jsx
- [happy] `kind="NETWORK"` → "No pudimos conectar con el servidor. Revisa tu conexión a internet."
- [negativo: TIMEOUT] mismo mensaje que `NETWORK`.
- [negativo: SERVER_ERROR] → "Algo salió mal de nuestro lado. Intenta de nuevo en unos minutos."
- [negativo: BAD_REQUEST] → "Los datos enviados no son válidos. Revisa los campos."
- [negativo: kind desconocido] `kind="UNAUTHORIZED"` o `undefined` → mensaje genérico
  "Ocurrió un error inesperado al ejecutar tu petición...".

### ecommerce-app/src/components/App/App.jsx (cableado de rutas)
- [happy rutas públicas] `/`, `/cart`, `/login`, `/register`, `/search`, `/product/:productId`,
  `/category/:categoryId`, `/order-confirmation` renderizan sin sesión.
- [negativo: rutas protegidas sin sesión] `/checkout`, `/wishlist`, `/orders`, `/settings` →
  redirigen a `/login` y se ve el formulario de acceso.
- [negativo: `/profile` con rol no permitido] Sesión con `role` fuera de `["admin","customer"]` →
  "Acceso denegado" (el `allowedRoles` real del repo es `["admin","customer"]`).
- [negativo: ruta inexistente] `/no-existe` → "Ruta no encontrada".

### ecommerce-app/src/pages/{Login,Register,Product,CategoryPage,SearchResults}.jsx
- [happy] Son envoltorios sin lógica: `Product`/`CategoryPage` solo pasan el parámetro de URL
  (`productId`/`categoryId`) al componente hijo. Un único caso por página: montar en la ruta real
  y comprobar que el hijo recibe el id correcto (visible en la petición que hace a la API).
  Sin casos negativos propios (las reglas viven en los componentes hijos).

---

## Prioridad BAJA

### ecommerce-app/src/components/common/Button/Button.jsx
- [happy] Renderiza sus children, dispara `onClick` y aplica `type="button"` por defecto.
- [negativo: deshabilitado] `disabled` → el botón está deshabilitado y el click no dispara `onClick`.

### ecommerce-app/src/components/common/Input/Input.jsx
- [happy] Con `label` e `id`, el label queda asociado al input (accesible por `getByLabelText`) y
  `onChange` recibe lo tecleado.
- [negativo: sin label] Sin prop `label` → no se renderiza `<label>` y el input sigue siendo
  consultable por su placeholder.

### ecommerce-app/src/components/common/Badge/Badge.jsx
- [happy] Renderiza el `text` recibido. Sin casos negativos (componente puramente visual).

### ecommerce-app/src/components/common/Loading/Loading.jsx
- [happy] Renderiza el spinner con `aria-label="Cargando"` y el texto pasado como children.

### ecommerce-app/src/components/common/ErrorMessage/ErrorMessage.jsx
- [happy] Renderiza el contenido pasado como children (texto o nodos). Es la contraparte de la
  regresión B-09: el mensaje llega por children, no por prop.

### ecommerce-app/src/components/common/Icon/Icon.jsx
- [happy] Con un `name` existente renderiza el SVG correspondiente.
- [negativo: nombre inexistente] `name="no-existe"` → no renderiza icono y no lanza.

### ecommerce-app/src/components/Checkout/Address/AddressItem.jsx y Payment/PaymentItem.jsx
- [happy] Muestran los datos del elemento (dirección/ciudad/CP; marca, `**** last4`, vencimiento y
  titular) e invocan `onSelect`/`onEdit`/`onDelete` con el elemento.
- [negativo: seleccionado] `isSelected` → el botón dice "Seleccionada" y está deshabilitado.
- [negativo: predeterminado] `isDefault` → aparece la etiqueta "Predeterminada".
- [negativo: `last4`/`brand` ausentes] `PaymentItem` sin esos campos → "**** **** **** ----" y el
  título "Método de pago".

### ecommerce-app/src/layout/Footer/Footer.jsx
- [happy] En `/` se renderiza el bloque principal del footer.
- [negativo: fuera del home] En cualquier otra ruta ese bloque no se renderiza.

### ecommerce-app/src/layout/Layout.jsx
- [happy] Renderiza Header, los children y Footer en ese orden. Sin casos negativos.

## Notas para `frontend-tester`

- Los tres hallazgos marcados arriba (`B-11`/`B-12`/`B-13`) ya están corregidos en el código —
  los casos correspondientes deben pasar contra el comportamiento real, no documentarlo como bug.
- `allowedRoles` real de `/profile` en `ecommerce-app/src/components/App/App.jsx` es
  `["admin", "customer"]` (sin `"cliente"`), igual al enum de `User.role`.
- No existen `userService`/`paymentService`/`shippingService` con datos locales: todos los
  servicios del repo pegan a la API real vía `apiClient`, así que todo se cubre con MSW.
