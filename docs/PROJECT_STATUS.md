# Estado real del proyecto — OSShirtEcommers

> **Documento vivo.** Refleja el estado **observable del código** al **2026-08-26**, no el estado
> deseado.
> Convención de evidencia: **[CÓDIGO]** verificado en el repo · **[DOC]** proviene de
> documentación · **[HIPÓTESIS]** inferencia por validar. Cuando la documentación contradice
> al código, prevalece el código.

## Resumen ejecutivo

E-commerce de camisetas anime/manga/cultura pop: backend Express 5 + MongoDB (ESM,
`ecommerce-api/`) y frontend React 19 / CRA (`ecommerce-app/`). Los **8 modelos Mongoose ya
están expuestos por API** — `user` (self-service, F-05/F-06) fue el último en conectarse,
2026-08-26. El checkout completo (dirección, pago, orden), la wishlist, el perfil real y settings
ya corren de punta a punta sobre el backend real, verificado con Playwright; `localStorage` solo
sigue usándose para `authToken`/`cart`/`app:theme`. Ya no quedan páginas enrutadas vacías.

El núcleo (auth, catálogo, carrito, checkout, wishlist, perfil, settings) es sólido y fue
verificado en vivo (curl + Playwright). La épica de seguridad del catálogo/pagos (E4) está
completa: no quedan riesgos de seguridad abiertos (catálogo protegido por rol, sin datos de
tarjeta reales, CORS con allowlist). E5 (limpieza de bugs) quedó sin páginas huérfanas pero se
reabrió con un hallazgo nuevo (`B-10`, ver "Bugs verificados"). La restructuración
`app.js`/`server.js` (`REF-01`) está cerrada y ya dio fruto: `T-04` (integración real de
auth/cart/category/product con `supertest`+`mongodb-memory-server`, 104 tests totales) también
está cerrado.

## Estado del backend [CÓDIGO]

| Recurso | Modelo | Controller | Router montado | Estado |
|---|---|---|---|---|
| Products | ✅ | ✅ | ✅ | Completo — lectura pública, escritura **solo admin** (2026-08-26) |
| Categories | ✅ | ✅ | ✅ | Completo — lectura pública, escritura **solo admin** (2026-08-26) |
| Auth (register/login) | ✅ (`User`) | ✅ | ✅ | Completo, validación manual inline (sin `express-validator`) |
| Cart | ✅ | ✅ | ✅ | Completo, protegido con `requireAuth` |
| Order | ✅ | ✅ | ✅ | Completo desde 2026-08-26 (F-03) — arma products/totales desde el `Cart` real, nunca del cliente |
| Address | ✅ | ✅ | ✅ | Completo desde 2026-08-26 (F-01) — protegido con `requireAuth`, scoped a `req.user.id` |
| PaymentMethod | ✅ | ✅ | ✅ | Completo desde 2026-08-26 (F-02) — protegido con `requireAuth`, rechaza `cardNumber`/`cvv` explícitamente |
| WishList | ✅ | ✅ | ✅ | Completo desde 2026-08-26 (F-04) — get-or-create por usuario, idempotente |
| User (self-service) | ✅ | ✅ | ✅ | Completo desde 2026-08-26 (F-05/F-06) — `GET/PUT /api/users/me`, `PUT /api/users/me/password`, protegido con `requireAuth`, scoped a `req.user.id` |

Auth [CÓDIGO]: JWT Bearer (`Authorization`), payload `{ userId, name, role }`, `requireAuth`
verifica con `JWT_SECRET`, password con `bcrypt` (saltRounds 10). **`requireAdmin` existe desde
2026-08-26** (`src/middlewares/auth.middleware.js`, exige `req.user.role === "admin"`, 403 si no)
y protege la escritura de `products`/`categories` — es su único uso hoy. Validación con `express-validator` +
middleware `validate` en `products`/`categories`/`cart`; `auth` con chequeo manual inline.
**`cors()` con allowlist real desde 2026-08-26** (`S-04`) vía `CORS_ALLOWED_ORIGINS`
(default `http://localhost:3001`, ver `docs/environment-variables.md`).

## Estado del frontend [CÓDIGO]

- **Servicios reales** (`apiClient`/axios → backend real): `authService`, `productsService`,
  `categoryService`, `cartService`, `addressService`, `paymentMethodService`, `orderService`,
  `wishlistService`, `userService` (los últimos 5, 2026-08-26, F-01/F-02/F-03/F-04/F-05).
  `userService` se reescribió por completo: el mock viejo sobre `data/users.json` se borró (cero
  importadores) y el nuevo llama a `/api/users/me`.
- **Sin servicios mock restantes.** `shippingService`/`paymentService`/`userService` (mocks
  viejos) y `utils/storageHelpers.js` se borraron por quedar sin uso.
- **Páginas completas y funcionales:** Home, Product, CategoryPage, SearchResults, Login,
  Register, Cart, Checkout, Orders, WishList, Profile, Settings (`Setttings.jsx`) — las últimas 6
  ya sobre API real, no `localStorage`/placeholder.
- **Sin páginas huérfanas.** `pages/ProductDetails.jsx` (import roto a `ProductDetailsCard`,
  archivo inexistente) y `pages/PurchaseOrder.jsx` (resumen de compra con datos hardcodeados,
  superado por `Checkout.jsx`) se borraron el 2026-08-26 (`B-02`/`B-03`) tras confirmar con grep
  que ninguna tenía importador real fuera de sí misma.
- `apiClient`: `baseURL http://localhost:4001/api`, inyecta `Bearer` desde
  `localStorage["authToken"]`, interceptor `classifyError`.

## Estado de persistencia (fuente de verdad)

Ver la matriz detallada en [ARCHITECTURE.md](./ARCHITECTURE.md#matriz-de-fuente-de-verdad).

- **localStorage [CÓDIGO]:** `authToken`, `cart`, `app:theme` — nada más; `orders`,
  `shippingAddresses`, `paymentMethods` dejaron de usarse cuando se conectaron F-01/F-02/F-03
  (`utils/storageHelpers.js`, que solo servía a eso, se borró por quedar sin uso).
- **Backend (vía API real):** los 8 recursos — auth, products, categories, cart, address,
  paymentMethod, order, wishlist, **user self-service** (2026-08-26) — ya expuestos y consumidos
  de verdad por el frontend. Ningún recurso queda desalineado.

## Flujos funcionales [CÓDIGO]

| Flujo | Fuente de verdad real | Estado |
|---|---|---|
| Registro / Login | Backend (JWT) | ✅ Funcional |
| Catálogo / Detalle / Categoría / Búsqueda | Backend | ✅ Funcional |
| Drawer de categorías / navegación | Backend (categorías) + UI local | ✅ Funcional |
| Carrito (add/update/remove) | localStorage + Backend (híbrido) | ✅ Funcional, verificado en vivo |
| Checkout (direcciones/pagos) | Backend (`Address`/`PaymentMethod`) | ✅ Funcional, verificado en vivo |
| Crear pedido | Backend (`Order`, totales calculados server-side) | ✅ Funcional, verificado en vivo |
| Mis pedidos (Orders) | Backend (`GET /api/orders`) | ✅ Funcional, verificado en vivo |
| Wishlist | Backend (`GET/POST/DELETE /api/wishlist`) | ✅ Funcional, verificado en vivo |
| Profile | Backend (`GET /api/users/me`) | ✅ Funcional, verificado en vivo |
| Settings (editar perfil / cambiar contraseña) | Backend (`PUT /api/users/me`, `PUT /api/users/me/password`) | ✅ Funcional, verificado en vivo |
| Breadcrumb (producto/categoría) | Backend (categorías pobladas) | ✅ Funcional (bug B1 corregido) |

## Bugs verificados [CÓDIGO]

| # | Bug | Estado |
|---|---|---|
| B1 | `Breadcrumb` esperaba prop `categories`, sus consumidores le pasaban `items` → nunca se renderizaba | ✅ Cerrado 2026-08-26 |
| B2 | `pages/ProductDetails.jsx` (huérfano, no enrutado) importa un componente inexistente | ✅ Cerrado 2026-08-26 (archivo borrado, sin importadores) |
| B3 | `pages/PurchaseOrder.jsx` huérfana con datos hardcodeados, sin ruta | ✅ Cerrado 2026-08-26 (archivo borrado, sin importadores) |
| B4 | `WishList.jsx`/`Setttings.jsx` enrutadas pero vacías — pantalla en blanco | ✅ Cerrado 2026-08-26: `WishList.jsx` implementado (F-04); `Setttings.jsx` implementado (F-06) |
| B8 | `ProfileCard.jsx` usaba `contextUser.role` en vez de `currentUser.role` (siempre "guest"); `currentUser.loginDate` (campo inexistente) en vez de `currentUser.last_login`; botones de acción eran stubs no-op (`() => {}`), incluido un "Panel de administración" sin ruta real | ✅ Cerrado 2026-08-26 (F-05) |
| B9 | `ErrorMessage`/`Loading` (`components/common/`) solo aceptan `children`, no una prop `message` — varios llamadores (`Checkout.jsx`, `Orders.jsx`, `WishList.jsx`, `CategoryProducts.jsx`, `ProductDetails.jsx`) les pasan `message={...}` en vez de `{...}` como children, así que el texto nunca se renderiza (queda una caja vacía) | ✅ Cerrado 2026-08-26 — corregidos los 5 llamadores; de paso se encontró y corrigió un segundo bug en `CategoryProducts.jsx` (mostraba el `kind` interno crudo `"NOT_FOUND"` en vez del texto amigable) |
| B10 | `POST /api/products` con `slug` duplicado responde 500 genérico en vez de 422 — `product.controller.js` (`createProduct`) no captura el `MongoServerError`/`code:11000` de Mongo, y el error handler global solo reconoce `ValidationError` de Mongoose | Pendiente — confirmado con test real (`T-04`, `tests/integration/product.test.js`), no corregido por quedar fuera del alcance de esa tarea |
| B5 | `data/categories.json` código muerto | ✅ Cerrado 2026-08-26 (borrado) |
| B6 | Rol fantasma `"cliente"` en `ProtectedRoute` | ✅ Cerrado 2026-08-26 (quitado) |
| B7 | `server_practice.js`/`db.config_practice.js` (0 bytes) | ✅ Cerrado 2026-08-26 (borrados) |

## Riesgos

- ~~Pérdida de datos: pedidos/direcciones/pagos solo en `localStorage`~~ — resuelto, los tres
  persisten en el backend real desde 2026-08-26 (F-01/F-02/F-03).
- ~~`cors()` abierto sin allowlist~~ — resuelto 2026-08-26 (`S-04`): `CORS_ALLOWED_ORIGINS` real,
  default `http://localhost:3001`. No queda ningún riesgo de seguridad conocido sin cerrar en
  `E4`. `PaymentMethod` ya no guarda `cardNumber`/`cvv` (S-03); un cobro real requeriría
  tokenización con un proveedor externo.
- ~~Integridad del total del pedido~~ — resuelto: `order.controller.js` calcula
  `subtotalPrice`/`shippingCost`/`totalPrice` desde el `Cart` real del usuario, nunca desde el
  body de la petición.
- **Mantenibilidad:** los 8 modelos ya están conectados de punta a punta — ya no queda ningún
  modelo Mongoose sin usar ni página frontend enrutada vacía.

## Decisiones de producto confirmadas

- **2026-08-26 — Catálogo protegido por rol admin.** `products`/`categories` ya no permiten
  escritura pública: `requireAuth` + `requireAdmin` en `POST`/`PUT`/`DELETE` de ambos recursos.
  Verificado en vivo contra el backend real (401 sin token, 403 con token `customer`, 201/204 con
  token `admin`). Cierra `S-01`/`S-02` de [docs/backlog.md](./backlog.md).
- **2026-08-26 — No se guarda tarjeta ni cvv reales.** Decisión explícita del usuario ante 4
  opciones presentadas (no guardar el número real / tokenización externa / cifrado en la app /
  aplazar): eligió no guardar el número real. `PaymentMethod` pasó de `cardNumber`/`cvv` a
  `last4`/`brand` (solo datos para mostrar en UI, nunca el número completo). Un cobro real con
  tarjeta requeriría integrar un proveedor externo (Stripe/PayPal) que devuelva un token. Cierra
  `S-03` de [docs/backlog.md](./backlog.md).
- **2026-08-26 — F-01 (Address) y F-02 (PaymentMethod) conectados de punta a punta.** Ambos
  recursos tienen backend real (`requireAuth`, scoped a `req.user.id`, regla "solo un
  `isDefault`") y `Checkout.jsx` ya los consume en vez de `shippingService`/`paymentService`
  mock — ambos mocks quedaron sin uso y se borraron. Verificado con Playwright: crear dirección y
  método de pago reales desde el checkout, completar una orden, y confirmar que
  `OrderConfirmation`/`Orders.jsx` muestran los datos reales sin campos en blanco (se corrigieron
  ahí referencias a la forma vieja del mock). Cierra `F-01`/`F-02` de
  [docs/backlog.md](./backlog.md). El pago sigue sin conectarse a un proveedor real — solo se
  guarda `last4`/`brand` derivados en el cliente.
- **2026-08-26 — F-03 (Order) conectado, epica E1 completa.** `order.controller.js` crea la
  orden a partir del `Cart` real del usuario (no de lo que mande el cliente), valida que
  `address`/`paymentMethod` le pertenezcan (404 si no), y vacía el carrito server-side al crear.
  `Checkout.jsx` ya llama a `POST /api/orders`; `Orders.jsx`/`OrderConfirmation.jsx` leen
  `GET /api/orders` en vez de `localStorage`. `utils/storageHelpers.js` (dedicado a los mocks
  viejos) se borró por quedar sin uso. Verificado con Playwright de punta a punta: agregar al
  carrito → checkout → crear orden → total exacto (`IVA 16% + envío $350 si <$1000`) →
  `OrderConfirmation`/`Orders.jsx` muestran todo real. Cierra `F-03`/`A-01` de
  [docs/backlog.md](./backlog.md).
- **2026-08-26 — F-04 (Wishlist) conectado.** `wishlist.controller.js` con patrón get-or-create
  (un usuario, una wishlist, como `Cart`); agregar/quitar un producto es idempotente. Botón
  "Agregar a favoritos" en `ProductDetails.jsx` (solo visible logueado); `pages/WishList.jsx`
  reescrito (antes vacío) para listar/quitar productos reales vía `ProductCard`. Verificado con
  Playwright: agregar desde el producto → persiste tras recargar la página → aparece en
  `/wishlist` → quitar deja el estado vacío correcto. Cierra `F-04` y la mitad de `B-04` de
  [docs/backlog.md](./backlog.md).
- **2026-08-26 — F-05 (Profile) y F-06 (Settings) conectados, épica E3 completa.**
  `user.controller.js`/`user.routes.js` exponen `GET/PUT /api/users/me` y
  `PUT /api/users/me/password`, siempre scoped a `req.user.id` (self-service puro, sin
  `GET /api/users/:id`). `Profile.jsx` ahora hace `GET /api/users/me` en vez de derivar todo del
  JWT decodificado (que solo trae `userId`/`name`/`role`). De paso se corrigió `ProfileCard.jsx`
  (bug `B8`: `contextUser.role` → `currentUser.role`, `loginDate` inexistente →
  `last_login` real, botones de acción no-op → navegación real a `/settings`/`/orders`, se quitó
  el stub de "Panel de administración" por no existir esa ruta). `Setttings.jsx` (antes vacío,
  `B4`) ahora tiene dos formularios reales: editar nombre/email y cambiar contraseña, ambos contra
  el backend. El mock viejo `userService.js` (`data/users.json`) se borró (cero importadores) y se
  reemplazó por uno real sobre `apiClient`. Verificado con Playwright de punta a punta: login →
  `/profile` muestra email/estado/última conexión reales → "Editar Perfil" navega a `/settings` →
  actualizar nombre/email funciona → email duplicado da 422 con mensaje correcto → cambiar
  contraseña con la actual incorrecta da 401 → confirmación de contraseña no coincidente se
  rechaza client-side → cambio de contraseña real funciona y persiste tras recargar `/profile`.
  Se revirtió la contraseña del usuario semilla (`user4@test.com`) a `123456` tras la verificación
  para no romper las credenciales de demo documentadas. Cierra `F-05`/`F-06` y el resto de `B-04`
  de [docs/backlog.md](./backlog.md); descubre `B-09` (ver tabla de bugs), cerrado por separado a
  continuación.
- **2026-08-26 — B-09 (`ErrorMessage`/`Loading` ignoran `message`) cerrado.** Se corrigieron los 5
  llamadores que pasaban `message={...}` en vez de `{...}` como children (`Checkout.jsx`,
  `Orders.jsx`, `WishList.jsx`, `CategoryProducts.jsx`, `ProductDetails.jsx`). De paso se encontró
  y corrigió un segundo bug encadenado en `CategoryProducts.jsx`: mostraba el `kind` interno de
  `classifyError` (`"NOT_FOUND"`) en vez de un texto amigable, porque `error` siempre es verdadero
  en esa rama y nunca caía al fallback `"Categoría no encontrada"`. Verificado con Playwright:
  `/category/<id-inexistente>` y `/product/<id-inexistente>` muestran el mensaje real; `/wishlist`,
  `/orders`, `/checkout` y una categoría real siguen sin regresiones. Cierra `B-09` de
  [docs/backlog.md](./backlog.md).
- **2026-08-26 — B-02/B-03 (páginas huérfanas) cerrados.** Se borraron
  `pages/ProductDetails.jsx` y `pages/PurchaseOrder.jsx` tras confirmar con grep que ninguna tenía
  importador real fuera de sí misma. `ProductDetails.jsx` importaba
  `components/ProductDetails/ProductDetailsCard`, un módulo inexistente en el repo — el producto
  real ya se sirve desde `pages/Product.jsx`. `PurchaseOrder.jsx` era un borrador de checkout con
  datos hardcodeados usando las formas viejas del mock (`alias`/`placeHolder`/`cardNumber`/`cvv`),
  completamente superado por `Checkout.jsx`. Se borraron en vez de reescribirse: sin ruta que
  llegue a ellas, no había comportamiento real que preservar ni proteger con tests. Cierra
  `B-02`/`B-03` de [docs/backlog.md](./backlog.md) (`E5` se reabrió después con `B-10`, ver
  abajo).
- **2026-08-26 — REF-01: split `app.js`/`server.js`, desbloquea `T-04`.** `server.js` (raíz)
  quedó como entrypoint delgado (`dotenv.config()` → `connectDB()` → `app.listen()`); toda la
  construcción de la app (middlewares, montaje de rutas, error handler) se movió a
  `ecommerce-api/src/app.js`, que exporta `app` **sin efectos secundarios** — se confirmó que se
  puede `import()` en aislado sin conexión a Mongo ni servidor escuchando, el requisito real que
  bloqueaba montar `supertest`. Se hizo antes que otros pendientes (`E2E-01`/`CI-01`) precisamente
  para no tener que rehacerlos si en algún momento dependen de este bootstrap. Detalle no obvio
  corregido de paso: el mount estático `/img` resolvía su ruta con `__dirname`, que al moverse a
  `src/app.js` pasaba a apuntar un nivel más adentro — se ajustó a `path.join(__dirname, '..',
  'public', 'img')`. Verificado: `npm test` sigue 60/60; `npm start` real con los mismos logs de
  siempre; curl contra `GET /`, `GET /api/products`, `GET /api/users/me` sin token (401),
  `POST /api/auth/login` (200) y una imagen real de producto (200, `image/jpeg`) responden igual
  que antes del refactor. `package.json` (`main`/`start`/`dev`) no cambió. Cierra `REF-01` de
  [docs/backlog.md](./backlog.md); `T-04` ya no está bloqueado por este motivo (sigue faltando
  instalar `mongodb-memory-server` y escribir los casos).
- **2026-08-26 — S-04: `cors()` con allowlist real, épica E4 completa.** `src/app.js` configura
  `cors({ origin: ... })` leyendo `CORS_ALLOWED_ORIGINS` (comma-separated, default
  `http://localhost:3001`). Detalle no obvio: la lectura tiene que ser diferida (dentro del
  callback de `cors()`, evaluada por request), no una constante a nivel de módulo — `app.js` se
  importa antes de que `server.js` corra `dotenv.config()`, así que una lectura a nivel de módulo
  nunca vería el `.env` real. Verificado en tres escenarios: default sin variable, variable como
  env real del proceso, y variable en el `.env` real vía `npm start` (restaurado después) — los
  tres confirman que un origen permitido recibe `Access-Control-Allow-Origin` y uno no listado no
  lo recibe (mientras la petición sigue respondiendo 200, comportamiento estándar de CORS).
  Verificado además con Playwright contra un navegador real: login y navegación normales, sin
  errores de CORS en consola. Cierra `S-04` de [docs/backlog.md](./backlog.md) — `E4` (seguridad
  del catálogo y de pagos) queda sin items pendientes.
- **2026-08-26 — T-04: integración real de auth/cart/category/product, 104 tests totales.**
  Delegado al agente `backend-tester` (tras corregir su definición, que seguía indicando montar
  Jest con `--experimental-vm-modules`, desactualizada desde que `T-01` eligió Vitest). Se
  instalaron `supertest` y `mongodb-memory-server`; se escribieron 44 tests en `ecommerce-api/
  tests/integration/` importando `src/app.js` (nunca `server.js`) — detalle completo en
  [TEST_PLAN.md](../TEST_PLAN.md#integración--t-04-hecho-2026-08-26). Verificado de forma
  independiente al reporte del agente: se leyeron los 5 archivos de test, se corrió `npm test` dos
  veces (104/104 ambas) y se regeneró el reporte de cobertura real. **Hallazgo confirmado con test
  real (trackeado como `B-10`, no corregido):** `POST /api/products` con `slug` duplicado responde
  500 genérico en vez de 422 — antes era una sospecha leída del código, ahora está probada
  empíricamente contra `mongodb-memory-server`. De paso se encontró y arregló una inestabilidad
  real en `npm run test:coverage` (timeout intermitente por overhead de instrumentación + 15
  instancias de `MongoMemoryServer` en paralelo) subiendo `testTimeout`/`hookTimeout` a 20000ms en
  `vitest.config.js`. Cierra `T-04` de [docs/backlog.md](./backlog.md); reabre `E5` con `B-10`.

## Supuestos pendientes de validar

- ~~El rol `"cliente"` en `ProtectedRoute`~~, ~~contrato de `Address`/`PaymentMethod`/`Order` vs.
  lo que esperaba `Checkout.jsx`~~ — ambos resueltos (`B-06`, `F-01`/`F-02`/`F-03`).
- **[HIPÓTESIS]** No hay evidencia de multi-tenant en este proyecto (un solo comercio); no se
  audita esa dimensión.
- **[DATO REAL]** Los `PaymentMethod` sembrados **antes** de cerrar S-03 conservan el `cardNumber`
  viejo en Mongo (el schema ya no lo define, pero Mongo no migra documentos existentes) y no
  tienen `last4`/`brand` — se ven como "Método de pago / **** **** **** ----" en la UI en vez de
  una tarjeta real. No es un bug de código, es un dato de seed sin backfill; correr el seed con
  `SEED_ALLOW_RESET=true` lo regenera limpio.
