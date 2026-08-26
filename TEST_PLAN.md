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
| ALTA | 10 | 10 | — (rutas/controllers de auth quedan aparte, ver abajo) |
| MEDIA | 25 | 25 | — (rutas/controllers de cart/category/product quedan aparte) |
| BAJA | 25 | 25 | — |
| **Integración (fuera de este alcance)** | — | 0 | Todo — ver sección final |

Corrida real completa (`npx vitest run tests/unit/`, 2026-08-26, tras cerrar S-03 —
`PaymentMethod` sin `cardNumber`/`cvv`):
```
Test Files  10 passed (10)
     Tests  60 passed (60)
```

**Reporte de cobertura real** (`npx vitest run tests/unit/ --coverage`, `coverage/coverage-summary.json`):

| Archivo | Stmts | Branch | Funcs |
|---|---|---|---|
| `src/middlewares/*.js` (2) | 100% | 100% | 100% |
| `src/models/*.js` (8) | 100% | 100% | 100% |
| `src/config/db.conf.js` | 0% | — | 0% |
| `src/controllers/*.js` (4) | 0% | 0% | 0% |
| `src/routes/*.js` (4) | 0% | — | — |
| **Total del proyecto** | **12.01%** | **7.01%** | **6.45%** |

**El 12% no es el criterio de calidad — lo que cubre sí lo es.** Con estos tests quedan
verificadas: el 100% de las reglas `required` de los 8 modelos Mongoose, el 100% de los enums del
dominio (`Category.type`, `Product.sizes`, `User.role`, `PaymentMethod.type`,
`Address.addressType`, `Order.status`/`paymentStatus`), el 100% de las ramas de `requireAuth`
(éxito, sin header, prefijo mal formado, firma inválida, expirado) y de `validate` (con/sin
errores, forma exacta del body), más 2 bugs reales confirmados con test (no en prosa): `min`/`max`
como no-ops en campos `String`. El 88% restante sin cubrir es controllers/routes — requiere
integración (HTTP+DB), no más pruebas unitarias (ver sección final).

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

1. **Funciones críticas sin pruebas:** las 4 controllers completas (`auth`, `cart`, `category`,
   `product`) y `connectDB` — 0% real, confirmado por cobertura.
2. **Ramas de error sin cubrir:** error handler global de `server.js` (`ValidationError`→422 vs.
   resto→500); slug duplicado → Mongo E11000 → cae al 500 genérico (no al 422 que uno esperaría).
3. **Endpoints sin integración:** los 19 endpoints reales de `.claude/api-routes.md`, ninguno
   probado por HTTP.
4. **Permisos sin comprobar:** nada garantiza hoy, con un test, que `requireAuth` esté realmente
   enganchado en `cart.routes.js`, ni que la ausencia de auth en `category`/`product` (escritura)
   sea intencional y no una regresión futura sin aviso.
5. **Casos límite faltantes:** cerrado el de `Cart.quantity=1` (ver arriba). Quedan pendientes a
   nivel integración: `page=0`, búsqueda sin resultados, `price=0` exacto.
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
aserciones débiles → `kind` exacto). **Hallazgos Crítica/Alta (1–4):** no se cerraron porque
requieren estructuralmente integración (HTTP+DB) — fabricar un test unitario ahí no cerraría el
hueco real, solo simularía cobertura. Quedan trackeados en `docs/backlog.md` como `T-04`.

## Fuera de este alcance — Integración (Bloqueado)

**Motivo del bloqueo, verificado leyendo el código real:** `ecommerce-api/server.js` no exporta
`app` — todo (`dotenv.config()`, `connectDB()` que hace `process.exit(1)` si Mongo falla, y
`app.listen()`) vive en un solo archivo ejecutado al importar. No se puede montar `supertest`
contra la app sin antes hacer el split `app.js`/`server.js`. Además no hay `mongodb-memory-server`
instalado — necesario para que estas pruebas no dependan de un Mongo local real ni lo contaminen.

Ninguno de estos casos se ha escrito. Quedan pendientes hasta que se autorice ese trabajo:

- `src/controllers/auth.controller.js` + `routes/auth.routes.js` (register/login, incluye duplicado
  de email, credenciales inválidas, verificación de que el password nunca se devuelve en claro)
- `routes/cart.routes.js` + `src/controllers/cart.controller.js` (todo bajo `requireAuth`: CRUD del
  carrito, aislamiento cross-user de `itemId`, recálculo de `total`)
- `routes/category.routes.js` + `src/controllers/category.controller.js` (CRUD, hard delete real,
  ausencia de auth en escritura, recursión de un nivel en `/:id/products`)
- `routes/product.routes.js` + `src/controllers/product.controller.js` (soft delete, orden de
  `/search` antes de `/:id`, slug duplicado → 500 en vez de 422, `sort` de query sin validar)
- **Actualizado 2026-08-26:** `POST`/`PUT`/`DELETE` de `product.routes.js` y `category.routes.js`
  ahora exigen `requireAuth` + `requireAdmin` (antes eran públicas — ver `docs/backlog.md` S-01/
  S-02, cerrados). Cuando se escriban estos tests de integración, agregar el caso de rol
  equivocado (`customer` → 403) además de sin-token (401) y admin (pasa) — ya verificado en vivo
  con curl, falta automatizarlo.
- Constraints `unique` de los modelos (`Product.slug`, `Category.slug`, `User.email`, `Cart.user`)
  — requieren una DB real, no son cubribles con `validate()` puro

## Pendientes Abiertos y Gaps Detectados

- **Trabajo fuera de alcance en esta iteración:** todas las pruebas de integración (ver sección
  anterior) — requieren el refactor `app.js`/`server.js` y `mongodb-memory-server`, ninguno de los
  dos autorizado todavía.
- **Decisión aplazada:** cobertura de `src/config/db.conf.js` (`connectDB`) — probarla
  requeriría interceptar `mongoose.connect`/`process.exit`, lo cual roza "mockear Mongoose", algo
  que la convención del proyecto evita; queda sin cubrir hasta decidir un enfoque.
- **Hallazgo real documentado como test, no como bug a corregir aquí:** `Address.postalCode`
  tiene `min`/`max` que no hacen nada por estar en un campo `String` — ya estaba registrado en
  `docs/backlog.md`, ahora además tiene un test que lo demuestra en vez de solo documentarlo en
  prosa. El mismo hallazgo en `PaymentMethod.cardNumber` quedó resuelto de raíz al cerrar S-03: el
  campo ya no existe (se reemplazó por `last4` con `maxlength`, que sí funciona).
- **Backlog relacionado:** `docs/backlog.md` items `T-01` (en progreso, esta es su evidencia),
  `T-03` (falta script `npm test`), `T-04` (integración completa — auth/cart/category/product vía
  supertest, bloqueada hasta el refactor `app.js`/`server.js` + `mongodb-memory-server`).
