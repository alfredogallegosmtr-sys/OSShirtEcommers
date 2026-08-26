# Modelos Mongoose

Todos en `ecommerce-api/src/models/`, usan `new mongoose.Schema({...}, { timestamps: true })`
y exportan `mongoose.model(...)` por defecto (`export default X`).

- **User** (`User.js`): `name` (String, required, trim), `email` (String, required, unique, trim,
  lowercase), `password` (String, required — ya viene hasheado con bcrypt desde el controller),
  `role` (enum `["customer","admin"]`, default `"customer"`), `isActive` (Boolean, default true),
  `email_verified` (Boolean, default false), `last_login` (Date).
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
  **Sin controller ni router todavía** — el frontend simula órdenes en `localStorage`.
- **Address** (`Address.js`): `user` (ObjectId → `User`, required), `address`/`city`/`state`
  (String, required, trim), `postalCode` (String, required, min 4, max 6, trim), `country`
  (String, required, trim), `phone` (String, required, max 10, trim), `isDefault` (Boolean,
  default false), `addressType` (enum `["home","work","other"]`, default `"home"`).
  **Sin controller ni router.**
- **PaymentMethod** (`PaymentMethod.js`): `user` (ObjectId → `User`, required), `type` (String,
  required, enum `["credit_card","debit_card","paypal","bank_transfer","cash_on_delivery"]`),
  `cardNumber` (String, max 16), `cardHolderName` (String, trim), `expiryDate`/`paypalEmail`/
  `bankName`/`accountNumber` (String), `isDefault` (Boolean, default false), `isActive` (Boolean,
  default true), `cvv` (String — **texto plano, sin hashear ni tokenizar**; ver `docs/threat-models/`
  antes de exponer este modelo por API). **Sin controller ni router.**
- **WishList** (`WishList.js`): `user` (ObjectId → `User`, required), `products[]` (ObjectId →
  `Product`, required). **Sin controller ni router.**

## Antes de asumir que un endpoint existe

Solo `Product`, `Category`, `User` (vía auth) y `Cart` tienen controller + router montados en
`server.js`. `Order`, `Address`, `PaymentMethod` y `WishList` son modelos sin exponer — si una
tarea los necesita, hay que crear el controller y el router (seguir el patrón de
`cart.controller.js`/`cart.routes.js`), no asumir que ya están conectados.
