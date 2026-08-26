# Contrato: User self-service (`/api/users`)

Backend: `src/controllers/user.controller.js` + `src/routes/user.routes.js`. Modelo:
[.claude/models.md](../../.claude/models.md#user). Todas las rutas requieren `requireAuth` y
operan **solo sobre el propio usuario autenticado** (`req.user.id`) — no hay forma de leer o
editar a otro usuario por este contrato (no existe `GET /api/users/:id`, es deliberado).

## GET /api/users/me
- **Auth:** requerida.
- **Response 200:** el usuario autenticado, sin `password`.
  ```json
  { "_id": "...", "name": "...", "email": "...", "role": "customer", "isActive": true,
    "email_verified": false, "last_login": "...", "createdAt": "...", "updatedAt": "..." }
  ```
- **Errores:** `404` si el usuario del token ya no existe (caso raro, cuenta borrada).

## PUT /api/users/me
- **Auth:** requerida.
- **Body:** `name` y/o `email`, ambos opcionales.
- **Response 200:** el usuario actualizado (mismo shape que `GET`, sin `password`).
- **Errores:** `422` si `email` no es un email válido, o si ya pertenece a **otro** usuario
  (mensaje `"User already exist"`, igual que en `register` — mismo criterio de duplicado).
  `404` si el usuario del token ya no existe.

## PUT /api/users/me/password
- **Auth:** requerida.
- **Body:** `{ currentPassword, newPassword }`, ambos requeridos; `newPassword` mínimo 6
  caracteres.
- **Response 200:** `{ message: "Contraseña actualizada" }` (no devuelve el usuario).
- **Errores:** `422` si falta algún campo o `newPassword` no cumple la longitud mínima. `401` si
  `currentPassword` no coincide con la contraseña real (verificado con `bcrypt.compare`, mismo
  mecanismo que `login`). `404` si el usuario del token ya no existe.

## Fuera de este contrato
- No hay verificación de email (`email_verified` existe en el modelo pero ningún flujo lo
  cambia — cambiar el email no lo resetea a `false` automáticamente, es una decisión consciente
  de no inventar un flujo de verificación que no existe).
- No hay `DELETE /api/users/me` (dar de baja la cuenta) en este alcance.
