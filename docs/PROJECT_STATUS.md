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
verificado en vivo (curl + Playwright). La épica de limpieza de bugs y código muerto (E5) está
completa: ya no quedan páginas huérfanas ni bugs de UI conocidos sin cerrar.

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
`cors()` abierto, sin allowlist de orígenes.

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
| B5 | `data/categories.json` código muerto | ✅ Cerrado 2026-08-26 (borrado) |
| B6 | Rol fantasma `"cliente"` en `ProtectedRoute` | ✅ Cerrado 2026-08-26 (quitado) |
| B7 | `server_practice.js`/`db.config_practice.js` (0 bytes) | ✅ Cerrado 2026-08-26 (borrados) |

## Riesgos

- ~~Pérdida de datos: pedidos/direcciones/pagos solo en `localStorage`~~ — resuelto, los tres
  persisten en el backend real desde 2026-08-26 (F-01/F-02/F-03).
- **Seguridad [CÓDIGO]:** `cors()` abierto sin allowlist es el único riesgo de seguridad vigente
  (`S-04`, Medio). `PaymentMethod` ya no guarda `cardNumber`/`cvv` (S-03); un cobro real
  requeriría tokenización con un proveedor externo.
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
- **2026-08-26 — B-02/B-03 (páginas huérfanas) cerrados, épica E5 completa.** Se borraron
  `pages/ProductDetails.jsx` y `pages/PurchaseOrder.jsx` tras confirmar con grep que ninguna tenía
  importador real fuera de sí misma. `ProductDetails.jsx` importaba
  `components/ProductDetails/ProductDetailsCard`, un módulo inexistente en el repo — el producto
  real ya se sirve desde `pages/Product.jsx`. `PurchaseOrder.jsx` era un borrador de checkout con
  datos hardcodeados usando las formas viejas del mock (`alias`/`placeHolder`/`cardNumber`/`cvv`),
  completamente superado por `Checkout.jsx`. Se borraron en vez de reescribirse: sin ruta que
  llegue a ellas, no había comportamiento real que preservar ni proteger con tests. Cierra
  `B-02`/`B-03` de [docs/backlog.md](./backlog.md) — E5 queda sin items pendientes.

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
