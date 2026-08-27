# Datos de prueba — OSShirtEcommers

> Objetivo: que backend, frontend y Cypress no inventen cada uno su propia forma de construir un
> usuario/producto/orden de prueba. No hay una librería de factories compartida entre los tres
> (viven en runtimes distintos — Vitest en Node, Jest en jsdom, Cypress en el navegador), así que
> la unificación real es **de convención**, no de código compartido: mismos campos, mismos valores
> por defecto, mismo criterio de limpieza.

## Por entidad

| Entidad | Método de creación | Método de limpieza | Suites que la utilizan |
|---|---|---|---|
| Usuario válido | Backend: `createUser`/`createUserAndToken` (`ecommerce-api/tests/integration/helpers/auth.js:13,29`) — hashea password con bcrypt, rol `customer` por defecto. Frontend/Cypress: `buildUniqueUser()` (`ecommerce-app/cypress/utils/testData.js:10`, email con timestamp) o el usuario sembrado `user4@test.com`/`123456` (`ecommerce-api/src/seed/seed.js:454-464`) | Backend: `clearTestDB()` entre tests (`tests/integration/helpers/db.js`) — DB en memoria, se descarta entera. Cypress: usuarios de `buildUniqueUser()` nunca se borran (no hay `DELETE /users/:id`, documentado como limitación en `known-issues.md`) | Todos los `tests/integration/*.test.js`; `register.cy.js`/`login.cy.js`/`checkout.cy.js` |
| Usuario administrador | Backend: `createUserAndToken({ role: "admin" })`. Real en dev: `user1@test.com`/`123456` es el admin del seed (`seed.js:464`, `i === 0 ? "admin" : "customer"`) | Igual que usuario válido | `product.test.js`, `category.test.js` (casos 201/200/204 que requieren rol admin) |
| Usuario sin permisos | Backend: `createUserAndToken({ role: "customer" })` usado contra una ruta que exige admin | Igual que usuario válido | `product.test.js`/`category.test.js` (casos 403), `auth.middleware.test.js` (`requireAdmin`, en progreso) |
| Usuario duplicado | Backend: crear un `User` con un email, luego intentar `POST /api/auth/register` o `PUT /api/users/me` con el mismo email | Igual que usuario válido | `auth.test.js`, `user.test.js` (en progreso) |
| Producto disponible | Backend: `Product.create({...})` inline en cada test de integración (no hay factory compartida todavía — ver "Pendiente" abajo). Real en dev: los 195 productos del seed | `clearTestDB()` | `product.test.js`, `cart.test.js`, `order.test.js` (en progreso) |
| Producto sin stock (`stock: 0`) | Backend: `Product.create({..., stock: 0})` — **nota:** `stock` no bloquea nada en `cart`/`order` (ver `strategy.md`/`test-matrix.md` INV-001), solo afecta el filtro `?inStock=true` (`product.controller.js:46`) y el badge de UI | `clearTestDB()` | Frontend: `ProductDetails.test.jsx`/`ProductCard.test.jsx` (badge "Agotado") |
| Producto eliminado (soft delete) | Backend: `DELETE /api/products/:id` real → pone `is_deleted: true` (`product.controller.js:110-125`); las lecturas públicas filtran por `{is_active:true, is_deleted:false}` (`:4`) | `clearTestDB()` | `product.test.js` (casos de soft delete) |
| Carrito con productos | Backend: `Cart.create({user, products:[{product, quantity}]})` inline, o vía `POST /api/cart` real. Frontend: `localStorage["cart"]` sembrado directo en el test (ej. `Cart.test.jsx`). Cypress: `cy.addProductToCart()` (`cypress/support/commands.js`) | `clearTestDB()` / `localStorage.clear()` / `DELETE /api/cart` real en `checkout.cy.js` `beforeEach` (necesario por el carrito híbrido, ver `known-issues.md`) | `cart.test.js`, `order.test.js` (en progreso), `CartContext.test.jsx`, `checkout.cy.js` |
| Orden válida | Backend: `POST /api/orders` real con address+paymentMethod+cart armados en el test | `clearTestDB()` — **no hay `DELETE /orders`**, es una limitación real y aceptada (ver `known-issues.md`) | `order.test.js` (en progreso), `Checkout.test.jsx`, `checkout.cy.js` |
| Orden fallida | Backend: `POST /api/orders` con carrito vacío (422) o `addressId`/`paymentMethodId` inexistente (404) | N/A (nunca se persiste) | `order.test.js` (en progreso) |

## Valores por defecto acordados

- **Password de prueba**: `"123456"` en backend/seed (coincide con el seed real, no un valor
  inventado) y `"Test1234!"` en `buildAddress`/`buildUniqueUser` de Cypress (necesita cumplir
  cualquier regla de complejidad del frontend, que el backend no exige).
- **Email único**: `` `cypress-${Date.now()}@example.com` `` en Cypress, para que cada corrida
  registre un usuario nuevo real y nunca colisione con `user1..user10@test.com` del seed.
- **Tarjeta de prueba**: `"4111111111111111"` (Visa de prueba estándar de la industria) en
  `buildCard()` — nunca se envía completa al backend (rechazada por el validador `S-03`), se usa
  solo para derivar `last4`/`brand` en el cliente, igual que el flujo real de `PaymentForm.jsx`.

## Pendiente (no implementado en esta pasada)

- **No existe una factory compartida de `Product`/`Cart`/`Address`/`PaymentMethod` en el backend**
  — cada archivo de integración arma su payload inline (mismo patrón que ya usaban
  `cart.test.js`/`product.test.js` antes de esta auditoría). Se mantiene así deliberadamente: son
  ~10 archivos, no justifica todavía una abstracción compartida (regla del proyecto de no
  introducir abstracciones sin necesidad real).
- **Limpieza de órdenes**: no existe `DELETE /api/orders/:id` por diseño (no se pidió, no se
  inventa). Las órdenes creadas por tests de integración desaparecen con `clearTestDB()` (DB en
  memoria); las creadas por Cypress contra un Mongo real (CI) o por verificación manual quedan
  acumuladas — documentado como limitación conocida, no un bug.
