# Contrato: PaymentMethod (`/api/payment-methods`)

Backend: `src/controllers/paymentMethod.controller.js` + `src/routes/paymentMethod.routes.js`.
Modelo: [.claude/models.md](../../.claude/models.md#paymentmethod). Todas las rutas requieren
`requireAuth` y están scoped a `req.user.id`, igual que `/api/addresses`.

> **Regla de seguridad no negociable (S-03, `docs/backlog.md`):** este endpoint **nunca** acepta
> `cardNumber` ni `cvv` en el body — el request se rechaza con 422 si vienen presentes, aunque
> sea con valor vacío. Solo se acepta `last4` (últimos 4 dígitos) para mostrar en UI.

## GET /api/payment-methods
- **Auth:** requerida.
- **Response 200:** array de métodos de pago del usuario logueado, `createdAt` desc.
  ```json
  [{ "_id": "...", "user": "...", "type": "credit_card", "last4": "1111", "brand": "visa",
     "cardHolderName": "...", "expiryDate": "12/30", "isDefault": false, "isActive": true,
     "createdAt": "...", "updatedAt": "..." }]
  ```

## POST /api/payment-methods
- **Auth:** requerida.
- **Body:** `type` requerido (`"credit_card"|"debit_card"|"paypal"|"bank_transfer"|
  "cash_on_delivery"`). Opcionales: `last4` (exactamente 4 dígitos numéricos), `brand`,
  `cardHolderName`, `expiryDate`, `paypalEmail` (formato email), `bankName`, `accountNumber`,
  `isDefault`, `isActive`. `user` **nunca** se lee del body.
- **Response 201:** el método de pago creado.
- **Errores:** `422` si falta `type`, si `type` no es uno de los 5 valores válidos, si `last4` no
  tiene exactamente 4 dígitos, si `paypalEmail` no es email válido, o **si el body incluye
  `cardNumber` o `cvv`** (rechazado explícitamente, no silenciosamente ignorado).
- **Regla de negocio:** `isDefault: true` desmarca los demás métodos de pago del usuario (mismo
  patrón que `Address`).

## PUT /api/payment-methods/:id
- **Auth:** requerida. Solo actualiza si `:id` pertenece al usuario logueado.
- **Body:** cualquier subconjunto de los campos de `POST`, todos opcionales. Mismo rechazo de
  `cardNumber`/`cvv`.
- **Response 200:** el método de pago actualizado.
- **Errores:** `422` si `:id` no tiene formato de ObjectId (lo atrapa el validador antes que el
  controller) o si algún campo enviado es inválido. `404` si el id es válido pero no existe o no
  pertenece al usuario logueado.

## DELETE /api/payment-methods/:id
- **Auth:** requerida. Solo borra si `:id` pertenece al usuario logueado (hard delete).
- **Response 204**, sin body.
- **Errores:** `422` si `:id` no tiene formato de ObjectId. `404` si el id es válido pero no
  existe o no pertenece al usuario logueado.

## Fuera de este contrato
- No hay integración real con ningún proveedor de pagos (Stripe/PayPal) — `last4`/`brand` los
  calcula el frontend a partir de lo que el usuario escribe, no vienen de un proveedor real. Un
  cobro real no está en alcance todavía (ver `docs/backlog.md`, decisión S-03).
- No hay `GET /api/payment-methods/:id` (un solo recurso) — igual que `Address`, el frontend
  lista y filtra en cliente.
