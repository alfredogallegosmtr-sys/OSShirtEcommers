# Auditoría OWASP Top 10:2025 — `ecommerce-api` (2026-08-27)

> Evaluación de **solo lectura** sobre el código real (rutas, middleware, modelos, config, manejo
> de errores) y `package.json`. No se ejecutó el servidor (salvo `npm audit`, pedido
> explícitamente); no se modificó nada de código en esta pasada — ver `docs/backlog.md` (`E12`,
> `S-05` a `S-11`) para el seguimiento de cada hallazgo a medida que se corrige.

## Tabla resumen

| # | Categoría | Estado | Severidad | Evidencia |
|---|---|---|---|---|
| A01 | Broken Access Control | PARCIAL | Baja | `product.controller.js:89,99` — mass assignment |
| A02 | Security Misconfiguration | PARCIAL | Media | Sin `helmet` en `package.json` |
| A03 | Software Supply Chain | OK | — | `npm audit`: 0 vulnerabilidades |
| A04 | Cryptographic Failures | OK | — | `bcrypt` (saltRounds 10), sin `cardNumber`/`cvv` guardados |
| A05 | Injection | PARCIAL | Media | `product.controller.js:28-33` — ReDoS vía `$regex` sin escapar |
| A06 | Insecure Design | EXPUESTO | Media | Sin control de stock en `cart`/`order` |
| A07 | Authentication Failures | EXPUESTO | Alta | Sin rate limiting; sin política de password en registro |
| A08 | Data Integrity Failures | OK | — | CI usa `npm ci` + acciones con versión fijada |
| A09 | Logging & Alerting Failures | EXPUESTO | Alta | Cero logging de eventos de seguridad |
| A10 | Mishandling of Exceptional Conditions | OK | — | Un solo error handler central, sin try/catch dispersos |

## Detalle de hallazgos EXPUESTO/PARCIAL

### A07 — Authentication Failures (Alta) → `S-05`, `S-06`

**Encontrado:**
- Sin rate limiting en `POST /auth/login` ni `POST /auth/register` (`auth.routes.js:6-7`) — sin
  `express-rate-limit` ni nada similar en `package.json`.
- `register` (`auth.controller.js:21`) solo valida `!password` (truthy) — una contraseña de 1
  carácter pasa. Contrasta con `changePassword` (`user.routes.js:18-22`), que sí exige
  `isLength({min:6})`.

**Riesgo:** fuerza bruta ilimitada contra cualquier cuenta; cuentas nuevas con contraseñas
triviales facilitan esa misma fuerza bruta.

**Mitigación recomendada:** `express-rate-limit` en `/auth/login` (y `/auth/register`) +
`isLength({min:6})` en `register`, igual que ya existe en `changePassword`.

### A09 — Logging & Alerting Failures (Alta) → `S-07`

**Encontrado:** ni `requireAuth`/`requireAdmin` (`auth.middleware.js`) ni `login`/`register`
(`auth.controller.js`) registran nada cuando fallan. El único logging del proyecto es
`console.error(err)` genérico en el error handler (`app.js:65`), para excepciones no manejadas,
no para eventos de seguridad.

**Riesgo:** el ataque de fuerza bruta de A07 (o cualquier intento de acceso a rutas admin sin el
rol correcto) no deja ningún rastro.

**Mitigación recomendada:** loguear los 401 de `requireAuth`, los 403 de `requireAdmin`, y los
intentos de login fallidos en `auth.controller.js` — un log a archivo simple cierra la brecha,
sin necesitar una librería nueva.

### A02 — Security Misconfiguration (Media) → `S-09`

**Encontrado:** `package.json` no tiene `helmet` — `app.js` no fija ningún header de seguridad
(`X-Content-Type-Options`, `X-Frame-Options`, etc.), solo `cors()` y `express.json()`. El resto de
esta categoría está bien: CORS ya usa allowlist real (`app.js:21-26`, no `origin:'*'`), Swagger
queda gateado por `NODE_ENV`/`ENABLE_DOCS` (`DOC-03`/`E11`, PR #1), y el error handler nunca
filtra stack traces al cliente (`app.js:64-79`, solo `message`).

**Riesgo:** moderado para una API JSON pura, pero es una mitigación gratuita.

**Mitigación recomendada:** `app.use(helmet())` justo después de crear `app`.

### A05 — Injection (Media) → `S-08`

**Encontrado:** `searchProducts` (`product.controller.js:28-33`) mete el query param `q` directo
y sin escapar en un `$regex` de Mongo: `filter.$or = [{name: {$regex: q, $options: "i"}}, ...]`.
Es una ruta pública (`GET /products/search`, sin auth), sin límite de longitud ni escape de
metacaracteres de regex.

Por contraste, el resto de la superficie de inyección está bien cerrada: `login`/`register`
nunca meten `password` en un query de Mongo (solo `bcrypt.compare`), y `category` en el mismo
`searchProducts` sí se valida con `mongoose.isValidObjectId()` (línea 36) antes de usarse.

**Riesgo:** un patrón de regex con backtracking catastrófico (ej. `q=(a+)+$`) puede consumir CPU
del servidor de Mongo de forma desproporcionada (ReDoS), sin necesitar cuenta ni token.

**Mitigación recomendada:** escapar los metacaracteres de regex de `q` antes de usarlo (o limitar
su longitud), o usar `$text` search en vez de `$regex` libre.

### A06 — Insecure Design (Media) → `S-10`

**Encontrado:** `Product.stock` existe como campo (`Product.js`) pero nunca se valida ni se
descuenta — ni al agregar al carrito (`cart.controller.js:38-58`, `addItem` no consulta el
producto ni su stock) ni al crear una orden (`order.controller.js` completo, nunca importa
`Product` ni compara cantidades contra `stock`).

**Riesgo:** sin control de sobreventa — múltiples usuarios pueden ordenar más unidades de las que
existen.

**Mitigación recomendada:** decidir la regla de negocio (reservar stock al agregar al carrito vs.
al confirmar la orden) y validarla en `order.controller.js` antes de crear la orden.

### A01 — Broken Access Control (Baja, nota secundaria) → `S-11`

**Encontrado:** `createProduct`/`updateProduct` (`product.controller.js:89,99`) pasan `req.body`
completo a `Product.create()`/`findByIdAndUpdate()` sin whitelist de campos — un admin (ya
autenticado y autorizado, `requireAdmin` sí está bien aplicado en la ruta) podría enviar campos
no contemplados por el validador (ej. `is_deleted`, `average_rating`) y que se guarden igual.

El resto de A01 está bien resuelto — se verificó explícitamente que sí hay chequeo de
**propiedad**, no solo de token: `address.controller.js`/`paymentMethod.controller.js` usan
`findOneAndUpdate({_id: id, user: req.user.id}, ...)` (nunca solo `{_id: id}`), y no existe
ningún `GET /orders/:id` que permita pedir una orden ajena por id — solo `GET /orders` scoped a
`req.user.id`. Tampoco se encontró ninguna llamada HTTP saliente en todo `ecommerce-api/src/`
(sin `fetch`/`axios`/`http.get`), así que no hay superficie de SSRF.

**Riesgo:** bajo — requiere ya tener rol admin, no es una escalada de privilegios, pero elimina
una capa de defensa en profundidad.

**Mitigación recomendada:** whitelist explícito de campos permitidos en `createProduct`/
`updateProduct` en vez de pasar `req.body` completo.

## Categorías OK (sin hallazgo)

- **A03 (Software Supply Chain):** `npm audit` → 0 vulnerabilidades. `package-lock.json`
  versionado. `npm outdated` solo señala 2 actualizaciones de patch menores (`dotenv`,
  `express-validator`), nada crítico ni sospechoso.
- **A04 (Cryptographic Failures):** `bcrypt.hash(password, 10)` en registro/cambio de contraseña,
  `bcrypt.compare` en login — nunca texto plano. `PaymentMethod` nunca guarda `cardNumber`/`cvv`
  (decisión `S-03`). Secretos JWT vía variables de entorno.
- **A08 (Data Integrity Failures):** los 3 jobs de `.github/workflows/ci-cd.yml` usan `npm ci`
  (instalación exacta desde el lockfile, no `npm install`); las GitHub Actions usadas están
  fijadas a versión (`@v4`, `@v6`), no a `@main`/`@latest`. Sin deserialización insegura custom en
  ningún punto del código (solo `express.json()`, librería estándar).
- **A10 (Mishandling of Exceptional Conditions):** un único error handler centralizado
  (`app.js:64-79`). Verificado con grep que el único `try/catch` real en todo
  `src/controllers/`+`src/middlewares/` es el de `requireAuth` (`auth.middleware.js:11`,
  necesario porque `jwt.verify` lanza síncronamente) — ningún controller tiene `try/catch`
  disperso que rompa la consistencia.

## Backlog derivado

Ver `docs/backlog.md` — épica `E12`, items `S-05` a `S-11`, ordenados por severidad
(Alta: `S-05`/`S-06`/`S-07` — Media: `S-08`/`S-09`/`S-10` — Baja: `S-11`). Cada uno se corrige
como una unidad aislada (spec/rama/PR propios), uno por uno.
