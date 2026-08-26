# Contrato: Order (`/api/orders`)

Backend: `src/controllers/order.controller.js` + `src/routes/order.routes.js`. Modelo:
[.claude/models.md](../../.claude/models.md#order). Todas las rutas requieren `requireAuth` y
están scoped a `req.user.id`, igual que `/api/addresses` y `/api/payment-methods`.

## GET /api/orders
- **Auth:** requerida.
- **Response 200:** array de órdenes del usuario logueado, `createdAt` desc, con
  `products.productId`, `address` y `paymentMethod` poblados.
  ```json
  [{ "_id": "...", "user": "...", "products": [{ "productId": {...}, "quantity": 1, "price": 379 }],
     "address": {...}, "paymentMethod": {...}, "subtotalPrice": 379, "shippingCost": 350,
     "totalPrice": 789.64, "status": "pending", "paymentStatus": "pending",
     "createdAt": "...", "updatedAt": "..." }]
  ```

## POST /api/orders
- **Auth:** requerida.
- **Body:** `{ addressId, paymentMethodId }` — **nada más**. El backend arma `products`,
  `subtotalPrice`, `shippingCost` y `totalPrice` a partir del carrito real del usuario logueado
  (`Cart`, no de lo que mande el cliente) — cierra el riesgo de integridad ya documentado en
  `docs/PROJECT_STATUS.md` ("el total se calcula solo en frontend").
- **Reglas de negocio (constantes ya usadas antes en `Checkout.jsx`, ahora también aquí):**
  IVA 16% sobre el subtotal; envío gratis si el subtotal ≥ $1000, si no $350 fijo.
  `totalPrice = subtotalPrice + subtotalPrice*0.16 + shippingCost` (el schema `Order` no tiene un
  campo de impuesto separado, el IVA queda embebido en `totalPrice`).
- **`address`/`paymentMethod` deben pertenecer al usuario logueado** — se verifica antes de crear
  la orden; si no le pertenecen (o no existen), responde `404`, igual que en sus propios
  endpoints — nunca se confía en un ObjectId ajeno solo porque el formato es válido.
- **Efecto secundario:** si la orden se crea con éxito, el carrito del usuario se vacía
  server-side (mismo efecto que `DELETE /api/cart`, pero atómico con la creación de la orden —
  el frontend no necesita llamar a ambos endpoints por separado).
- **Response 201:** la orden creada, con `products.productId`/`address`/`paymentMethod` poblados
  (mismo shape que en `GET`).
- **Errores:** `422` si falta `addressId`/`paymentMethodId` o no son ObjectId válidos, o si el
  carrito del usuario está vacío. `404` si `addressId`/`paymentMethodId` no existen o no
  pertenecen al usuario logueado.

## Fuera de este contrato
- No hay `PUT`/`DELETE` — el cliente no edita ni cancela órdenes en este alcance (backlog F-03).
  Cambiar `status`/`paymentStatus` sería una operación de administración, no de cliente, y no
  está implementada.
- No hay `GET /api/orders/:id` — el frontend lista y filtra en cliente, igual que `Address` y
  `PaymentMethod`.
