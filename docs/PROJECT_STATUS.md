# Estado real del proyecto — OSShirtEcommers

> **Documento vivo.** Refleja el estado **observable del código** al **2026-08-26**, no el estado
> deseado.
> Convención de evidencia: **[CÓDIGO]** verificado en el repo · **[DOC]** proviene de
> documentación · **[HIPÓTESIS]** inferencia por validar. Cuando la documentación contradice
> al código, prevalece el código.

## Resumen ejecutivo

E-commerce de camisetas anime/manga/cultura pop: backend Express 5 + MongoDB (ESM,
`ecommerce-api/`) y frontend React 19 / CRA (`ecommerce-app/`). El backend tiene **8 modelos
Mongoose**, de los cuales **7 ya están expuestos por API** (`auth`, `products`, `categories`,
`cart`, `address`, `paymentMethod`, `order` — los últimos 3 conectados 2026-08-26, épica E1
completa). Solo `WishList` sigue sin controller/router. El checkout (dirección, pago, orden) ya
corre de punta a punta sobre el backend real, verificado con Playwright; `localStorage` solo
sigue usándose para `authToken`/`cart`/`app:theme`. `Wishlist` y `Settings` son las únicas
páginas completamente vacías, ya enrutadas detrás de `ProtectedRoute`.

El núcleo (auth, catálogo, carrito, checkout completo) es sólido y fue verificado en vivo (curl +
Playwright). La brecha restante es wishlist, perfil real, y los bugs de UI menores (B2/B3/B4)
todavía sin cerrar.

**Estrategia recomendada: seguir el mismo patrón (backend real + verificación en vivo) para
wishlist y perfil. No reescribir lo ya conectado.**

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
| WishList | ✅ | ❌ | ❌ | **Huérfano** — modelo sin exponer |

Auth [CÓDIGO]: JWT Bearer (`Authorization`), payload `{ userId, name, role }`, `requireAuth`
verifica con `JWT_SECRET`, password con `bcrypt` (saltRounds 10). **`requireAdmin` existe desde
2026-08-26** (`src/middlewares/auth.middleware.js`, exige `req.user.role === "admin"`, 403 si no)
y protege la escritura de `products`/`categories` — es su único uso hoy. Validación con `express-validator` +
middleware `validate` en `products`/`categories`/`cart`; `auth` con chequeo manual inline.
`cors()` abierto, sin allowlist de orígenes.

## Estado del frontend [CÓDIGO]

- **Servicios reales** (`apiClient`/axios → backend real): `authService`, `productsService`,
  `categoryService`, `cartService`, `addressService`, `paymentMethodService`, `orderService`
  (los últimos 3, 2026-08-26, F-01/F-02/F-03).
- **Servicio mock restante:** `userService` (`data/users.json`) — sin relación con `User` real,
  fuera del alcance E1. `shippingService`/`paymentService` (mocks viejos) se borraron por quedar
  sin uso.
- **Páginas completas y funcionales:** Home, Product, CategoryPage, SearchResults, Login,
  Register, Cart, Checkout, Orders (los tres últimos ya sobre API real, no `localStorage`).
- **Páginas placeholder vacías pero ya enrutadas:** `pages/WishList.jsx` y `pages/Setttings.jsx`
  (nombre de archivo con typo — triple "t") son literalmente `export default function X() {}`.
  Ambas están detrás de `ProtectedRoute` en `/wishlist` y `/settings`: un usuario logueado que
  entra ahí ve una página en blanco sin ningún aviso.
- **Páginas huérfanas** (sin `<Route>` en `App.jsx`): `pages/ProductDetails.jsx` (distinto del que
  sí se usa, `pages/Product.jsx`) importa `ProductDetailsCard` desde un archivo que no existe —
  rompe al instante si algo llega a importarlo. `pages/PurchaseOrder.jsx` es una página completa
  de resumen de compra con datos hardcodeados, sin ninguna ruta ni link que apunte ahí — parece
  una versión previa de `Checkout.jsx`.
- `apiClient`: `baseURL http://localhost:4001/api`, inyecta `Bearer` desde
  `localStorage["authToken"]`, interceptor `classifyError`.

## Estado de persistencia (fuente de verdad)

Ver la matriz detallada en [ARCHITECTURE.md](./ARCHITECTURE.md#matriz-de-fuente-de-verdad).

- **localStorage [CÓDIGO]:** `authToken`, `cart`, `app:theme` — nada más; `orders`,
  `shippingAddresses`, `paymentMethods` dejaron de usarse cuando se conectaron F-01/F-02/F-03
  (`utils/storageHelpers.js`, que solo servía a eso, se borró por quedar sin uso).
- **Backend (vía API real):** auth, products, categories, cart, **address, paymentMethod, order**
  (2026-08-26) — 7 de 8 recursos ya expuestos y consumidos de verdad por el frontend.
- **Desalineado:** solo wishlist (`WishList` existe en el backend, la página sigue vacía).

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
| Wishlist | — | ❌ Placeholder (`WishList` backend existe, sin usar) |
| Profile | Deriva del JWT decodificado client-side | ⚠️ Sin `GET` real al backend |
| Settings | — | ❌ Placeholder |
| Breadcrumb (producto/categoría) | Backend (categorías pobladas) | ✅ Funcional (bug B1 corregido) |

## Bugs verificados [CÓDIGO]

| # | Bug | Estado |
|---|---|---|
| B1 | `Breadcrumb` esperaba prop `categories`, sus consumidores le pasaban `items` → nunca se renderizaba | ✅ Cerrado 2026-08-26 |
| B2 | `pages/ProductDetails.jsx` (huérfano, no enrutado) importa un componente inexistente | Pendiente — bajo impacto, no enrutado |
| B3 | `pages/PurchaseOrder.jsx` huérfana con datos hardcodeados, sin ruta | Pendiente — bajo impacto, no enrutado |
| B4 | `WishList.jsx`/`Setttings.jsx` enrutadas pero vacías — pantalla en blanco | Pendiente |
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
- **Mantenibilidad:** solo `WishList` sigue sin conectar (modelo Mongoose sin usar, página
  frontend vacía) — ya no hay doble fuente de verdad en direcciones/pagos/pedidos.

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
