# Contrato: WishList (`/api/wishlist`)

Backend: `src/controllers/wishlist.controller.js` + `src/routes/wishlist.routes.js`. Modelo:
[.claude/models.md](../../.claude/models.md#wishlist). Todas las rutas requieren `requireAuth` y
están scoped a `req.user.id`. Un usuario tiene **una sola wishlist** (get-or-create, mismo patrón
que `Cart` — el schema `WishList` no tiene `unique` en `user`, pero el controller nunca crea una
segunda si ya existe una).

## GET /api/wishlist
- **Auth:** requerida.
- **Response 200:** la wishlist del usuario logueado (se crea vacía si no existía), con
  `products` poblado.
  ```json
  { "_id": "...", "user": "...", "products": [{ "_id": "...", "name": "...", "price": 379, ... }],
    "createdAt": "...", "updatedAt": "..." }
  ```

## POST /api/wishlist
- **Auth:** requerida.
- **Body:** `{ productId }` — requerido, debe ser un ObjectId válido.
- **Response 201:** la wishlist actualizada, `products` poblado. Si el producto ya estaba en la
  lista, no se duplica (idempotente) y responde igual 201 con la lista sin cambios.
- **Errores:** `422` si falta `productId` o no es un ObjectId válido.

## DELETE /api/wishlist/:productId
- **Auth:** requerida.
- **Response 200:** la wishlist actualizada, `products` poblado (no `204`, porque a diferencia de
  `Address`/`PaymentMethod` acá no se borra un recurso propio sino que se modifica la lista —
  el cliente necesita el estado resultante para actualizar la UI sin otra petición).
- **Errores:** `422` si `:productId` no tiene formato de ObjectId. Quitar un producto que no
  estaba en la lista no es un error — responde 200 con la lista sin cambios (idempotente).

## Fuera de este contrato
- No hay límite de productos en la wishlist.
- No se valida que el producto exista/esté activo al agregarlo — si luego se borra (soft-delete)
  o queda inactivo, sigue apareciendo en la wishlist poblada (mismo comportamiento que
  `Cart.products`, no es una regla nueva de este endpoint).
