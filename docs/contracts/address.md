# Contrato: Address (`/api/addresses`)

Backend: `src/controllers/address.controller.js` + `src/routes/address.routes.js`. Modelo:
[.claude/models.md](../../.claude/models.md#address). Todas las rutas requieren `requireAuth`
(`Authorization: Bearer <token>`) y están scoped a `req.user.id` — un usuario nunca ve ni puede
tocar direcciones de otro usuario, aunque adivine su `_id`.

## GET /api/addresses
- **Auth:** requerida.
- **Response 200:** array de direcciones del usuario logueado, orden `createdAt` descendente.
  ```json
  [{ "_id": "...", "user": "...", "address": "...", "city": "...", "state": "...",
     "postalCode": "...", "country": "...", "phone": "...", "isDefault": false,
     "addressType": "home", "createdAt": "...", "updatedAt": "..." }]
  ```

## POST /api/addresses
- **Auth:** requerida.
- **Body:** `{ address, city, state, postalCode, country, phone }` requeridos;
  `addressType` (`"home"|"work"|"other"`, default `"home"`) e `isDefault` (Boolean, default
  `false`) opcionales. `user` **nunca** se lee del body — siempre sale de `req.user.id`.
- **Response 201:** la dirección creada (mismo shape que en `GET`).
- **Errores:** `422` si falta algún campo requerido o `addressType`/`isDefault` tienen forma
  inválida (`{errors:[...]}`, shape de express-validator).
- **Regla de negocio:** si `isDefault: true`, el backend desmarca automáticamente
  `isDefault` en las demás direcciones de ese usuario — solo puede haber una predeterminada.

## PUT /api/addresses/:id
- **Auth:** requerida. Solo actualiza si `:id` pertenece al usuario logueado.
- **Body:** cualquier subconjunto de los campos de `POST`, todos opcionales.
- **Response 200:** la dirección actualizada.
- **Errores:** `422` si `:id` no tiene formato de ObjectId (lo atrapa el validador antes que el
  controller) o si algún campo enviado es inválido. `404` si el id es válido pero no existe o no
  pertenece al usuario logueado.
- **Regla de negocio:** igual que en `POST`, marcar `isDefault: true` desmarca las demás.

## DELETE /api/addresses/:id
- **Auth:** requerida. Solo borra si `:id` pertenece al usuario logueado (hard delete).
- **Response 204**, sin body.
- **Errores:** `422` si `:id` no tiene formato de ObjectId (verificado en vivo: el validador de
  la ruta responde antes de que el controller corra su propio chequeo). `404` si el id es válido
  pero no existe o no pertenece al usuario logueado (verificado en vivo: otro usuario intentando
  borrar una dirección ajena recibe 404, nunca ve que existe).

## Fuera de este contrato
- No hay `GET /api/addresses/:id` (un solo recurso) — el frontend siempre lista y filtra en
  cliente si necesita una dirección puntual, igual que hoy no lo pedía `shippingService` mock.
- `postalCode` y `phone` no tienen validación real de longitud (el schema `Address` tiene
  `min`/`max` que son no-ops en campos `String` — ver `docs/backlog.md`, no es un bug de esta
  ruta, es un límite conocido del modelo, sin corregir).
