# TEST_PLAN — ecommerce-api

> Backend `ecommerce-api` (Express 5 + Mongoose 9, ESM). Runner: **Vitest**. Ejecutar con
> `npm test` desde `ecommerce-api/` (script agregado 2026-08-26, cierra T-03 de
> `docs/backlog.md`; también hay `npm run test:watch` y `npm run test:coverage`). Fuente de
> verdad de esta matriz: los archivos reales en `ecommerce-api/src/` y `ecommerce-api/tests/`,
> verificados leyendo el código, no supuestos.

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
| **Integración** (`T-04`) | 44 | 44 | — |

Corrida real completa (`npm test`, 2026-08-26, tras cerrar `T-04` — integración de
auth/cart/category/product con `supertest` + `mongodb-memory-server`):
```
Test Files  15 passed (15)
     Tests  104 passed (104)
```
(60 unitarios preexistentes + 44 de integración nuevos, todo en verde.)

**Reporte de cobertura real** (`npm run test:coverage`, `coverage/coverage-summary.json`):

| Archivo | Stmts | Branch | Funcs |
|---|---|---|---|
| `src/middlewares/*.js` (2) | 100% | 100% | 100% |
| `src/models/*.js` (8) | 100% | 100% | 100% |
| `src/routes/*.js` (9) | 100%\* | 100%\* | 100%\* |
| `src/app.js` | 80.76% | 37.5% | 40% |
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
| **Total del proyecto** | **65.46%** | **45.55%** | **55.93%** |

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
   `ValidationError`→422 vs. resto→500) ya está cubierto por los tests de admin/auth (403/401) y
   por el propio test de slug duplicado, que **confirma empíricamente** (no solo sospecha leída
   del código) que un E11000 cae al 500 genérico — ver `T-04`, hallazgo `B-10`.
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
  no tapado por `GET /:id`; slug duplicado documentado como test de caracterización (ver hallazgo
  abajo).
- `unique-constraints.test.js` (4) — `Product.slug`, `Category.slug`, `User.email`, `Cart.user`
  duplicados, cada uno rechazado por Mongo (`code: 11000`) contra la DB real en memoria.

**Hallazgo confirmado con test real (documentado, no corregido — fuera de este alcance):** un
`slug` duplicado en `POST /api/products` produce un **500 genérico** en vez de un 422 manejado.
`product.controller.js` (`createProduct`) llama `Product.create(req.body)` sin capturar el error
de índice duplicado de Mongo (`MongoServerError`, `code: 11000`); el error handler global
(`src/app.js`) solo intercepta `err.name === 'ValidationError'` (Mongoose), así que un E11000 cae
al `else` → 500. Antes era una sospecha leída del código (punto 2 del diagnóstico); ahora está
confirmada empíricamente con `test/integration/product.test.js` contra `mongodb-memory-server`
real. Trackeado como `B-10` en `docs/backlog.md`. El mismo patrón aplicaría a `Category.slug` y a
`Cart.user` si algún flujo intentara crear un segundo carrito por fuera de `getOrCreateCart` —
`User.email` no lo dispara porque `register` ya chequea duplicado manualmente antes de `create`.

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
  `mongodb-memory-server`, 44 tests), `B-10` (hallazgo nuevo: slug duplicado → 500 en vez de 422,
  confirmado con test real, no corregido — fuera de este alcance).
