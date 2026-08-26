# Modelos Mongoose

Todos en `ecommerce-api/src/models/`, usan `new mongoose.Schema({...}, { timestamps: true })`
y exportan `mongoose.model(...)` por defecto (`export default X`).

- **User** (`User.js`): `name` (String, required, trim), `email` (String, required, unique, trim,
  lowercase), `password` (String, required — ya viene hasheado con bcrypt desde el controller),
  `role` (enum `["customer","admin"]`, default `"customer"`), `isActive` (Boolean, default true),
  `email_verified` (Boolean, default false), `last_login` (Date). **Con controller y router
  desde 2026-08-26** (`user.controller.js`/`user.routes.js`, backlog F-05/F-06) — self-service
  únicamente: `GET/PUT /api/users/me` y `PUT /api/users/me/password`, siempre sobre `req.user.id`;
  no existe `GET /api/users/:id` ni ninguna forma de leer/editar a otro usuario.
- **Product** (`Product.js`): `name` (String, required, trim), `description` (String), `price`
  (Number, required), `stock` (Number, default 0), `imageURL` (String, default
  `https://placehold.co/600x400`), `images` (String[]), `slug` (String, required, unique,
  lowercase, trim), `sizes` (String[], enum `["XS","S","M","L","XL","XXL"]`), `tags` (String[]),
  `average_rating`/`review_count` (Number, default 0), `is_active` (Boolean, default true),
  `is_deleted` (Boolean, default false — soft delete), `category` (ObjectId → `Category`, required).
- **Category** (`Category.js`): `name` (String, required, trim), `description` (String, required),
  `type` (String, required, **enum cerrado**: `anime`, `manga-novelas`, `japon`, `kpop-culture`,
  `videojuegos`, `cultura-pop`, `originales`, `colecciones` — agregar un tipo nuevo requiere tocar
  este enum), `slug` (String, required, unique, lowercase, trim), `imageURL` (String, default
  `https://placehold.co/800x600.png`), `parentCategory` (ObjectId → `Category`, default `null`).
- **Cart** (`Cart.js`): `user` (ObjectId → `User`, required, **unique** — un carrito por usuario),
  `products[]` `{ product (ObjectId → Product, required), quantity (Number, required, min 1) }`
  (cada entrada del array tiene su propio `_id` autogenerado — **ese** `_id`, no el del producto,
  es el `itemId` que usan las rutas `PATCH/DELETE /api/cart/:itemId`), `total` (Number, default 0).
- **Order** (`Order.js`): `user` (ObjectId → `User`, required), `products[]` `{ productId (ObjectId
  → Product, required), quantity (Number, required, min 1), price (Number, required) }`, `address`
  (ObjectId → `Address`, required), `paymentMethod` (ObjectId → `PaymentMethod`, required),
  `subtotalPrice`/`shippingCost` (Number, required, default 0), `totalPrice` (Number, required),
  `status` (enum `["pending","processing","shipped","delivered","cancelled"]`, default `"pending"`),
  `paymentStatus` (enum `["pending","paid","failed","refunded"]`, default `"pending"`).
  **Con controller y router desde 2026-08-26** (`order.controller.js`/`order.routes.js`, backlog
  F-03) — scoped a `req.user.id`. `products`/`subtotalPrice`/`shippingCost`/`totalPrice` los
  calcula el backend a partir del `Cart` real del usuario (nunca de lo que mande el cliente);
  `address`/`paymentMethod` deben pertenecer al usuario logueado. Crear una orden vacía el
  carrito server-side. Sin `PUT`/`DELETE` en este alcance.
- **Address** (`Address.js`): `user` (ObjectId → `User`, required), `address`/`city`/`state`
  (String, required, trim), `postalCode` (String, required, min 4, max 6, trim — `min`/`max`
  son no-ops en `String`, no rechazan longitud), `country` (String, required, trim), `phone`
  (String, required, max 10, trim — mismo no-op), `isDefault` (Boolean, default false),
  `addressType` (enum `["home","work","other"]`, default `"home"`). **Con controller y router
  desde 2026-08-26** (`address.controller.js`/`address.routes.js`, backlog F-01) — scoped a
  `req.user.id`, `isDefault:true` desmarca las demás direcciones del usuario.
- **PaymentMethod** (`PaymentMethod.js`): `user` (ObjectId → `User`, required), `type` (String,
  required, enum `["credit_card","debit_card","paypal","bank_transfer","cash_on_delivery"]`),
  `last4` (String, maxlength 4 — solo últimos 4 dígitos, para mostrar en UI), `brand` (String,
  ej. "visa"), `cardHolderName` (String, trim), `expiryDate`/`paypalEmail`/`bankName`/
  `accountNumber` (String), `isDefault` (Boolean, default false), `isActive` (Boolean, default
  true). **Decisión S-03 (2026-08-26, `docs/backlog.md`): el modelo ya no tiene `cardNumber` ni
  `cvv`** — el número completo de tarjeta y el cvv nunca se guardan, ni cifrados; un cobro real
  requeriría delegar a un proveedor externo (Stripe/PayPal) que devuelva un token. **Con
  controller y router desde 2026-08-26** (`paymentMethod.controller.js`/`paymentMethod.routes.js`,
  backlog F-02) — scoped a `req.user.id`, rechaza explícitamente `cardNumber`/`cvv` en el body
  (422, no los ignora en silencio), `isDefault:true` desmarca los demás métodos del usuario.
- **WishList** (`WishList.js`): `user` (ObjectId → `User`, required), `products[]` (ObjectId →
  `Product`, required). **Con controller y router desde 2026-08-26** (`wishlist.controller.js`/
  `wishlist.routes.js`, backlog F-04) — get-or-create por usuario (patrón de `Cart`), agregar/
  quitar un producto es idempotente.

## Antes de asumir que un endpoint existe

Los 8 modelos tienen controller + router montados en `src/app.js` desde 2026-08-26 (ver `REF-01`
en `docs/backlog.md` para el split `app.js`/`server.js`). Si una tarea
nueva necesita un recurso más, seguir el patrón ya establecido en `cart.controller.js`/
`cart.routes.js` (o cualquiera de `address`/`paymentMethod`/`order`/`wishlist`/`user`), no asumir
que algo distinto ya está conectado.
