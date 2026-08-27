# Historias de usuario — OSShirtEcommers

> Derivadas de [backlog.md](./backlog.md) (auditoría 2026-08-26). Solo se redactan historias para
> items con valor de usuario final claro; los items de deuda técnica pura (limpieza de archivos
> muertos, config de CI, etc.) quedan en el backlog sin historia — forzar una historia ahí sería
> artificial.

---

**ID:** US-001
**Título:** Registrar una dirección de envío real
**Como** cliente logueado
**Quiero** que la dirección que ingreso en el checkout se guarde en el backend
**Para** no tener que volver a escribirla cada vez que compro desde otro dispositivo o después de
limpiar el navegador

**Criterios de aceptación:**
- Al guardar una dirección en checkout, se crea un documento `Address` real vía API (no
  `localStorage`).
- Si el usuario ya tiene direcciones guardadas, se listan desde el backend al entrar a checkout.
- Se puede marcar una dirección como predeterminada (`isDefault`).

**Definición de terminado:**
- ✅ `Address` tiene controller + router siguiendo el patrón de `cart.controller.js`.
- ✅ El checkout consume ese endpoint — `shippingService` mock eliminado (quedó sin uso).
- ✅ Documentado el contrato en `docs/contracts/address.md`.
- ✅ Verificado de punta a punta con Playwright: crear dirección real desde el formulario de
  checkout, marcarla default, completar una orden y confirmar que se muestra correctamente en
  `OrderConfirmation` y `/orders`.

**Dependencias técnicas:**
- Ninguna otra épica bloqueaba esta.

**Prioridad:** Alto
**Estado actual relacionado:** Implementado y verificado en vivo (2026-08-26, backlog F-01 cerrado)

---

**ID:** US-002
**Título:** Registrar un método de pago real
**Como** cliente logueado
**Quiero** que mi método de pago se guarde de forma segura en el backend
**Para** reutilizarlo en compras futuras sin volver a escribirlo

**Criterios de aceptación:**
- Al guardar un método de pago, se crea un documento `PaymentMethod` real vía API.
- El backend **nunca** recibe ni almacena el número completo de tarjeta ni el cvv — solo
  `last4`/`brand` para mostrar en UI (decisión S-03: sin tokenización de proveedor externo, el
  checkout con tarjeta real no está en alcance todavía).
- Se puede marcar un método como predeterminado.

**Definición de terminado:**
- ✅ S-03 resuelto (2026-08-26): `PaymentMethod` ya no tiene `cardNumber`/`cvv` en el schema.
- ✅ `PaymentMethod` tiene controller + router, y además **rechaza explícitamente** (422) si el
  body incluye `cardNumber`/`cvv` — no solo los ignora.
- ✅ El checkout consume ese endpoint — `paymentService` mock eliminado (quedó sin uso).
- ✅ El formulario de pago ya no pide cvv, y el número de tarjeta escrito nunca sale del
  componente ni se envía a la API (solo `last4`/`brand` derivados en el cliente).
- ✅ Verificado de punta a punta con Playwright: crear tarjeta real desde el checkout, marcarla
  default, completar una orden y confirmar que se muestra correctamente en `/orders`.

**Dependencias técnicas:**
- Ninguna otra épica bloqueaba esta.

**Prioridad:** Alto
**Estado actual relacionado:** Implementado y verificado en vivo (2026-08-26, backlog F-02
cerrado)

---

**ID:** US-003
**Título:** Confirmar un pedido y que quede registrado en el backend
**Como** cliente logueado
**Quiero** que al confirmar mi compra se cree una orden real en el servidor
**Para** que mi pedido no se pierda si limpio el navegador o cambio de dispositivo

**Criterios de aceptación:**
- Al confirmar checkout, se crea un `Order` real vía API (no `localStorage.setItem("orders")`).
- El total se calcula/valida en el backend, no solo en el frontend.
- La orden queda asociada al usuario autenticado (`req.user.id`, nunca del body).

**Definición de terminado:**
- ✅ `Order` tiene controller + router.
- ✅ `Checkout.jsx` ya no escribe a `localStorage["orders"]` — llama a `POST /api/orders`.
- ✅ CA verificados en vivo: curl (total exacto, 404 en dirección/pago ajenos, 422 carrito vacío)
  y Playwright (flujo completo real en navegador).

**Dependencias técnicas:**
- Dependía de US-001 y US-002 (ya cerradas) — `Order` referencia `address` y `paymentMethod`
  como requeridos en el schema.

**Prioridad:** Alto
**Estado actual relacionado:** Implementado y verificado en vivo (2026-08-26, backlog F-03
cerrado)

---

**ID:** US-004
**Título:** Ver mi historial de pedidos real
**Como** cliente logueado
**Quiero** ver mis pedidos guardados en el servidor, no solo en este navegador
**Para** consultarlos desde cualquier dispositivo

**Criterios de aceptación:**
- `Orders.jsx` consulta `GET /api/orders` (o equivalente) en vez de leer `localStorage["orders"]`.
- El listado y el detalle muestran los mismos datos que hoy (fecha, estado, items, dirección,
  pago), ahora desde el backend.

**Definición de terminado:**
- ✅ `orderService.js` real en `services/`.
- ✅ `Orders.jsx` reescrito para el shape real de `Order` (sin regresión funcional: misma UI,
  datos reales en vez de mock).

**Dependencias técnicas:**
- Dependía de US-003 (ya cerrada).

**Prioridad:** Alto
**Estado actual relacionado:** Implementado y verificado en vivo (2026-08-26, backlog A-01
cerrado)

---

**ID:** US-005
**Título:** Agregar y ver productos en mi wishlist
**Como** cliente logueado
**Quiero** poder marcar productos como favoritos y verlos después
**Para** encontrarlos fácilmente sin tener que buscarlos de nuevo

**Criterios de aceptación:**
- Botón de "agregar a wishlist" visible en producto (nuevo — no hay evidencia de que exista hoy).
- `/wishlist` muestra los productos guardados, con opción de quitarlos.
- Persistencia real vía `WishList` (backend), no `localStorage`.

**Definición de terminado:**
- ✅ `WishList` tiene controller + router (get-or-create, idempotente).
- ✅ `pages/WishList.jsx` ya no está vacío — lista productos reales con `ProductCard`.
- ✅ `wishlistService.js` real.
- ✅ Verificado con Playwright: agregar desde el producto, persiste tras recargar la página,
  aparece en `/wishlist`, quitar funciona.

**Dependencias técnicas:**
- Ninguna otra épica bloqueaba esta.

**Prioridad:** Alto
**Estado actual relacionado:** Implementado y verificado en vivo (2026-08-26, backlog F-04
cerrado)

---

**ID:** US-006
**Título:** Ver mi información de perfil real
**Como** cliente logueado
**Quiero** ver mis datos de cuenta reales, no solo lo que trae el token
**Para** confiar en que la información mostrada está actualizada

**Criterios de aceptación:**
- `/profile` hace un `GET` real al backend (no deriva todo del JWT decodificado client-side).
- Se muestran al menos `name`, `email`, `role`.

**Definición de terminado:**
- ✅ Endpoint de perfil: `GET /api/users/me` en `user.routes.js` (nuevo, self-service, scoped a
  `req.user.id`).
- ✅ `Profile.jsx` consume ese endpoint en un `useEffect`, ya no deriva del JWT decodificado.
- ✅ Verificado con Playwright: `/profile` muestra email/estado/última conexión reales, sin
  "No disponible".

**Dependencias técnicas:**
- Ninguna otra épica bloquea esta.

**Prioridad:** Medio
**Estado actual relacionado:** Implementado y verificado en vivo (2026-08-26, backlog F-05
cerrado)

---

**ID:** US-009
**Título:** Editar mi nombre/email y cambiar mi contraseña
**Como** cliente logueado
**Quiero** poder actualizar mi nombre, mi email o mi contraseña desde una página de configuración
**Para** mantener mis datos de cuenta al día sin depender de soporte

**Criterios de aceptación:**
- `/settings` permite editar `name`/`email` y guardar los cambios contra el backend.
- `/settings` permite cambiar la contraseña pidiendo la contraseña actual, la nueva y su
  confirmación.
- Si el email ya está en uso por otra cuenta, se muestra un error claro (no un 500 genérico).
- Si la contraseña actual es incorrecta, se muestra un error claro y no se cambia nada.

**Definición de terminado:**
- ✅ `PUT /api/users/me` (nombre/email) y `PUT /api/users/me/password` (cambio de contraseña) en
  `user.routes.js`.
- ✅ `pages/Setttings.jsx` (antes vacío) implementado con ambos formularios sobre `userService.js`
  real.
- ✅ Verificado con Playwright: actualizar nombre/email real, email duplicado rechazado con
  mensaje, contraseña actual incorrecta rechazada con mensaje, confirmación no coincidente
  rechazada client-side, cambio de contraseña real exitoso.

**Dependencias técnicas:**
- Dependía de US-006 (perfil real) para tener `userService.js` ya conectado al backend.

**Prioridad:** Medio
**Estado actual relacionado:** Implementado y verificado en vivo (2026-08-26, backlog F-06
cerrado)

---

**ID:** US-007
**Título:** Que solo un administrador pueda modificar el catálogo
**Como** administrador del comercio
**Quiero** que crear, editar o borrar productos y categorías requiera mi sesión de admin
**Para** que un visitante sin cuenta no pueda alterar el catálogo público

**Criterios de aceptación:**
- `POST`/`PUT`/`DELETE` de `/api/products` y `/api/categories` devuelven 401 sin token y 403 con
  token de un usuario `customer`.
- Un usuario con `role: "admin"` sí puede completar esas operaciones.

**Definición de terminado:**
- Middleware `requireAdmin` creado y aplicado en las rutas de escritura de ambos recursos. ✅
- Verificado en vivo contra el backend real (curl): sin token → 401, token `customer` → 403,
  token `admin` → 201/204. ✅
- ✅ Casos negativos automatizados por `backend-tester` (`T-04`, 2026-08-26):
  `tests/integration/category.test.js`/`product.test.js` cubren sin-token (401), rol `customer`
  (403) y rol `admin` (pasa) contra `mongodb-memory-server` real.

**Dependencias técnicas:**
- Ninguna otra épica bloqueaba esta — era la de mayor prioridad del backlog (S-01, S-02).

**Prioridad:** Crítico
**Estado actual relacionado:** Implementado, verificado en vivo (2026-08-26, backlog S-01/S-02
cerrados) y con test de integración automatizado (`T-04`, cerrado).

---

**ID:** US-008
**Título:** Ver la ruta de navegación (breadcrumb) en producto y categoría
**Como** cualquier visitante
**Quiero** ver un breadcrumb que muestre dónde estoy dentro del catálogo
**Para** orientarme y volver fácilmente a una categoría anterior

**Criterios de aceptación:**
- En `/product/:productId` y `/category/:categoryId` se ve el breadcrumb con la ruta real de
  categorías.
- Cada nivel del breadcrumb es un link funcional.

**Definición de terminado:**
- ✅ Unificado el nombre de la prop entre `Breadcrumb.jsx` y sus consumidores (`categories` vs
  `items`) — ambos ya tenían el objeto `category` real, solo lo aplanaban mal.
- ✅ Verificado visualmente con Playwright contra el backend real: `/category/:id` →
  `Inicio > Anime > Series` (jerarquía completa); `/product/:id` → `Inicio > Más Vendidos`.
- ✅ Guarda agregada en `Breadcrumb.jsx` para no romper una entrada cuando `parentCategory` no
  viene poblado (caso real de `product.controller.js`, descubierto al implementar).

**Dependencias técnicas:**
- Ninguna otra épica bloqueaba esta — fue un fix aislado y de bajo esfuerzo.

**Prioridad:** Alto
**Estado actual relacionado:** Implementado y verificado en vivo (2026-08-26, backlog B-01
cerrado)
