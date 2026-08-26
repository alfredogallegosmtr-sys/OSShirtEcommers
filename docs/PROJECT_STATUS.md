# Estado real del proyecto — OSShirtEcommers

> **Documento vivo.** Refleja el estado **observable del código** al **2026-08-26**, no el estado
> deseado.
> Convención de evidencia: **[CÓDIGO]** verificado en el repo · **[DOC]** proviene de
> documentación · **[HIPÓTESIS]** inferencia por validar. Cuando la documentación contradice
> al código, prevalece el código.

## Resumen ejecutivo

E-commerce de camisetas anime/manga/cultura pop: backend Express 5 + MongoDB (ESM,
`ecommerce-api/`) y frontend React 19 / CRA (`ecommerce-app/`). El backend tiene **8 modelos
Mongoose** pero solo **4 recursos expuestos por API** (`auth`, `products`, `categories`, `cart`).
`Order`, `Address`, `PaymentMethod` y `WishList` tienen modelo pero **ningún controller ni
router** — no son accesibles por HTTP. El frontend consume los 4 recursos reales vía `apiClient`,
pero para direcciones, métodos de pago y "mis pedidos" usa **JSON mock local**
(`data/*.json` + `setTimeout`) que **no tiene ninguna relación** con los modelos `Address` /
`PaymentMethod` / `Order` del backend — ni siquiera comparten forma de datos. `Wishlist` y
`Settings` son páginas completamente vacías pero ya están enrutadas detrás de `ProtectedRoute`.

El núcleo (auth, catálogo, carrito) es sólido y fue verificado en vivo (curl + Playwright) en
sesiones previas de este mismo proyecto. La brecha central es la **falta de persistencia real**
en checkout, pedidos, wishlist y perfil, más un grupo de bugs de UI ya identificados por lectura
completa del código.

**Estrategia recomendada: estabilizar, documentar, normalizar persistencia. No reescribir.**

## Estado del backend [CÓDIGO]

| Recurso | Modelo | Controller | Router montado | Estado |
|---|---|---|---|---|
| Products | ✅ | ✅ | ✅ | Completo — lectura pública, escritura **solo admin** (2026-08-26) |
| Categories | ✅ | ✅ | ✅ | Completo — lectura pública, escritura **solo admin** (2026-08-26) |
| Auth (register/login) | ✅ (`User`) | ✅ | ✅ | Completo, validación manual inline (sin `express-validator`) |
| Cart | ✅ | ✅ | ✅ | Completo, protegido con `requireAuth` |
| Order | ✅ | ❌ | ❌ | **Huérfano** — modelo sin exponer |
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
  `categoryService`, `cartService`.
- **Servicios mock** (JSON local en `data/*.json` + `setTimeout`, sin relación con los modelos del
  backend): `userService` (`data/users.json`), `paymentService` (`data/paymentMethods.json`),
  `shippingService` (`data/shipping-address.json`). **No existe `orderService`.**
- **Páginas completas y funcionales:** Home, Product, CategoryPage, SearchResults, Login,
  Register, Cart, Checkout (con caveats — ver más abajo), Orders (lee `localStorage`).
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

- **localStorage [CÓDIGO]:** `authToken`, `cart`, `app:theme`, y — vía
  `utils/storageHelpers.js` `STORAGE_KEYS` — `orders`, `shippingAddresses`, `paymentMethods`
  ([Checkout.jsx:371](../ecommerce-app/src/pages/Checkout.jsx#L371)).
- **Backend (vía API real):** auth, products, categories, **cart** (único recurso realmente
  híbrido: localStorage-first + sync contra `/api/cart` si hay sesión).
- **Completamente desalineado:** órdenes (`Order` existe en el backend, **nunca se llama**;
  `Checkout.jsx` escribe directo a `localStorage.setItem("orders", ...)`), direcciones y pagos
  (`Address`/`PaymentMethod` existen en el backend, el frontend usa JSON mock de un dominio de
  datos distinto, sin relación de campos), wishlist (`WishList` existe en el backend, la página
  está vacía).

## Flujos funcionales [CÓDIGO]

| Flujo | Fuente de verdad real | Estado |
|---|---|---|
| Registro / Login | Backend (JWT) | ✅ Funcional |
| Catálogo / Detalle / Categoría / Búsqueda | Backend | ✅ Funcional |
| Drawer de categorías / navegación | Backend (categorías) + UI local | ✅ Funcional |
| Carrito (add/update/remove) | localStorage + Backend (híbrido) | ✅ Funcional, verificado en vivo |
| Checkout (direcciones/pagos) | JSON mock local, sin relación con el backend | ⚠️ Simulado |
| Crear pedido | **localStorage** | ❌ No persiste en backend (`Order` sin usar) |
| Mis pedidos (Orders) | localStorage | ❌ No persiste en backend |
| Wishlist | — | ❌ Placeholder (`WishList` backend existe, sin usar) |
| Profile | Deriva del JWT decodificado client-side | ⚠️ Sin `GET` real al backend |
| Settings | — | ❌ Placeholder |
| Breadcrumb (producto/categoría) | — | ❌ Bug: nunca se renderiza (ver Bugs) |

## Bugs verificados [CÓDIGO]

| # | Bug | Ubicación | Severidad |
|---|---|---|---|
| B1 | `Breadcrumb` espera prop `categories`, sus dos consumidores le pasan `items` → nunca se renderiza | [Breadcrumb.jsx](../ecommerce-app/src/layout/Breadcrumb/Breadcrumb.jsx), `ProductDetails.jsx`/`CategoryProducts.jsx` | Alto (UX) |
| B2 | `pages/ProductDetails.jsx` importa `ProductDetailsCard` desde un archivo inexistente | [pages/ProductDetails.jsx](../ecommerce-app/src/pages/ProductDetails.jsx) | Medio (huérfano, no enrutado) |
| B3 | `pages/PurchaseOrder.jsx` completa, con datos hardcodeados, sin ruta ni link | [pages/PurchaseOrder.jsx](../ecommerce-app/src/pages/PurchaseOrder.jsx) | Bajo (huérfano) |
| B4 | `WishList.jsx`/`Setttings.jsx` enrutadas pero vacías — pantalla en blanco para el usuario | [pages/WishList.jsx](../ecommerce-app/src/pages/WishList.jsx), [pages/Setttings.jsx](../ecommerce-app/src/pages/Setttings.jsx) | Alto (UX) |
| B5 | `data/categories.json` no lo importa nada; contenido de otro dominio (celulares Android) | [data/categories.json](../ecommerce-app/src/data/categories.json) | Bajo (código muerto) |
| B6 | `ProtectedRoute` en `/profile` acepta rol `"cliente"`, que no existe en `User.role` (`customer`/`admin`) | [pages/ProtectedRoute.jsx](../ecommerce-app/src/pages/ProtectedRoute.jsx) | Bajo (ruido) |
| B7 | `server_practice.js` y `db.config_practice.js` — archivos de 0 bytes, scaffolding del curso | [ecommerce-api/server_practice.js](../ecommerce-api/server_practice.js) | Bajo (limpieza) |

## Riesgos

- **Pérdida de datos:** pedidos, direcciones y métodos de pago solo en `localStorage` — se
  borran al limpiar el navegador o cambiar de dispositivo.
- **Seguridad [CÓDIGO]:** `cors()` abierto sin allowlist (riesgo aún vigente, ver `S-04`).
  `PaymentMethod` ya no guarda `cardNumber`/`cvv` (S-03 cerrado 2026-08-26): solo `last4`/`brand`
  para mostrar en UI; un cobro real requeriría tokenización con un proveedor externo.
- **Integridad:** el total del pedido se calcularía solo en frontend si se llegara a conectar
  Checkout sin validación backend — no hay endpoint de creación de orden hoy que lo prevenga ni
  lo permita.
- **Mantenibilidad:** doble fuente de verdad (modelos Mongoose sin usar + mock JSON del frontend)
  duplica el trabajo cuando se decida conectar cada uno.

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

## Supuestos pendientes de validar

- ~~El rol `"cliente"` en `ProtectedRoute`~~ — resuelto, `B-06` cerrado (quitado de `allowedRoles`).
- ~~Contrato de `Address`/`PaymentMethod` vs. lo que esperaba `Checkout.jsx`~~ — resuelto al cerrar
  `F-01`/`F-02`: sí había diferencias de nombres de campo reales (confirmado, no solo hipótesis) y
  se corrigieron en `Checkout.jsx`, `Orders.jsx` y `OrderConfirmation.jsx`. Sigue pendiente
  `Order` (F-03).
- **[HIPÓTESIS]** No hay evidencia de multi-tenant en este proyecto (un solo comercio); no se
  audita esa dimensión.
- **[DATO REAL]** Los `PaymentMethod` sembrados **antes** de cerrar S-03 conservan el `cardNumber`
  viejo en Mongo (el schema ya no lo define, pero Mongo no migra documentos existentes) y no
  tienen `last4`/`brand` — se ven como "Método de pago / **** **** **** ----" en la UI en vez de
  una tarjeta real. No es un bug de código, es un dato de seed sin backfill; correr el seed con
  `SEED_ALLOW_RESET=true` lo regenera limpio.
