# Backlog priorizado — OSShirtEcommers

> Derivado de [PROJECT_STATUS.md](./PROJECT_STATUS.md) y [ARCHITECTURE.md](./ARCHITECTURE.md)
> (auditoría 2026-08-26). Prioridad: **Crítico / Alto / Medio / Bajo**. Tipo: Bug / Refactor /
> Feature faltante / Alineación FE-BE / Deuda técnica / Documentación.
> Cada épica con spec tiene su documento en [specs/](./specs/) (se redacta al iniciar esa épica,
> siguiendo la plantilla de [SSDLC](../.claude/skills/workflow/SSDLC.md) — ninguna tiene spec
> escrito todavía, esta tabla es la priorización previa al spec).
>
> **Documento único de pendientes.** Este archivo reemplaza al antiguo `PENDIENTES.md` (raíz),
> retirado el 2026-08-26 por redundancia una vez que este backlog quedó consolidado — su
> contenido íntegro está migrado aquí, incluyendo el detalle operativo de cada item (sección
> [Detalle de items](#detalle-de-items) y [Contexto operativo](#contexto-operativo)). No crear
> otro documento de pendientes: cualquier hallazgo nuevo se agrega a la tabla priorizada de este
> archivo.

## Épicas

> La columna **Spec** indica si existe un documento en [specs/](./specs/) (ninguna épica lo
> tiene todavía, ver nota arriba — es independiente de si la épica ya se cerró). La columna
> **Estado** se deriva de los items de esa épica en la [Tabla priorizada](#tabla-priorizada).

| ID | Épica | Estado | Spec |
|---|---|---|---|
| E1 | Persistencia real de checkout (direcciones, pagos, pedidos) | **Cerrado (2026-08-26)** — F-01/F-02/F-03/A-01 | _(pendiente)_ |
| E2 | Wishlist funcional | **Cerrado (2026-08-26)** — F-04 | _(pendiente)_ |
| E3 | Cuenta: Profile y Settings | **Cerrado (2026-08-26)** — F-05/F-06 | _(pendiente)_ |
| E4 | Seguridad del catálogo y de pagos | **Cerrado (2026-08-26)** — S-01/S-02/S-03/S-04 | _(pendiente)_ |
| E5 | Limpieza de bugs y código muerto detectados en la auditoría | **Cerrado (2026-08-27)** — B-01 a B-16, sin items pendientes | _(pendiente)_ |
| E6 | Suite de tests (backend + frontend) | **Cerrado (2026-08-27)** — T-01/T-02/T-03/T-04/T-05/REF-01 todos cerrados, 158 tests backend + 303 frontend = 461 tests reales | _(pendiente)_ |
| E7 | E2E con Cypress | **Cerrado (2026-08-27)** — corrido con el runner real de Cypress en GitHub Actions (Ubuntu, job `e2e`): **20/20 specs en verde** (login 8/8, register 6/6, checkout 6/6), confirmado en el run [33061741394](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/actions/runs/33061741394). En el camino se corrigieron 3 bugs de CI (PORT filtrado, PORT del frontend faltante, 2 selectores ambiguos propios) y un bug real de la app (`B-16`) | _(pendiente)_ |
| E8 | CI/CD completo | **Cerrado (2026-08-27)** — `CI-01` completo: lint + tests+cobertura + E2E con Cypress en los 3 jobs (`test-api`, `test-app`, `e2e`), confirmado en verde en un run real de GitHub Actions ([33068441727](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/actions/runs/33068441727)) | _(pendiente)_ |
| E9 | Observability: carga con Artillery | Pendiente — OBS-01 | _(pendiente)_ |
| E10 | Despliegue a Render | Pendiente — DEP-01 | _(pendiente)_ |
| E11 | Documentación de API (OpenAPI/Swagger) | **Cerrado (2026-08-27)** — `DOC-03`, [PR #1](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/pull/1) mergeado a `develop` | _(pendiente)_ |
| E12 | Auditoría de seguridad OWASP Top 10:2025 | En progreso (2026-08-27) — `S-05` cerrado ([PR #2](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/pull/2) mergeado), `S-06` a `S-11` pendientes, corrigiendo uno por uno | _(pendiente)_ |

## Tabla priorizada

| ID | Item | Épica | Tipo | Prioridad | Estado |
|---|---|---|---|---|---|
| S-01 | Proteger `POST/PUT/DELETE` de `products` y `categories` (hoy cualquiera sin sesión puede escribir) | E4 | Bug/Seguridad | **Crítico** | **Cerrado (2026-08-26)** |
| S-02 | Implementar middleware de rol admin (`isAdmin`) — no existe hoy | E4 | Feature faltante | **Crítico** | **Cerrado (2026-08-26)** |
| S-03 | Definir cómo se protegerá `cardNumber`/`cvv` de `PaymentMethod` (cifrado/tokenización) **antes** de exponerlo por API | E4 | Deuda/Seguridad | **Crítico** | **Cerrado (2026-08-26)** |
| B-01 | Fix `Breadcrumb`: prop `categories` vs `items` — no se renderiza nunca | E5 | Bug | **Alto** | **Cerrado (2026-08-26)** |
| B-04 | `WishList.jsx`/`Setttings.jsx` enrutadas pero vacías — pantalla en blanco para el usuario | E5 | Bug | **Alto** | **Cerrado (2026-08-26)** |
| F-01 | `addressService` real + endpoint `Address` conectado a checkout | E1 | Feature faltante | **Alto** | **Cerrado (2026-08-26)** |
| F-02 | `paymentMethodService` real + endpoint `PaymentMethod` conectado a checkout | E1 | Feature faltante | **Alto** | **Cerrado (2026-08-26)** |
| F-03 | `orderService` + endpoint `Order` — checkout crea pedido real, no `localStorage` | E1 | Feature faltante | **Alto** | **Cerrado (2026-08-26)** |
| A-01 | `Orders.jsx` lee `GET /orders` real en vez de `localStorage["orders"]` | E1 | Alineación FE-BE | **Alto** | **Cerrado (2026-08-26)** |
| F-04 | Wishlist: UI + `wishlistService` + endpoint conectado | E2 | Feature faltante | **Alto** | **Cerrado (2026-08-26)** |
| T-01 | Elegir runner de tests backend (Vitest/Jest) + `mongodb-memory-server`, correr `test-planner` | E6 | Deuda técnica | **Alto** | **Cerrado (2026-08-27)** |
| T-03 | `npm test` no es invocable todavía: falta el script `"test": "vitest run"` en `ecommerce-api/package.json` (hoy solo se corre con `npx vitest run <archivo>`) | E6 | Deuda técnica | **Alto** | **Cerrado (2026-08-26)** |
| REF-01 | Split `app.js`/`server.js` en `ecommerce-api` — `server.js` no exportaba `app` sin efectos secundarios (dotenv/connectDB/listen se disparaban solo con importarlo), bloqueando cualquier test de integración con supertest | E6 | Refactor | **Alto** | **Cerrado (2026-08-26)** |
| T-04 | Pruebas de integración de `ecommerce-api` (auth/cart/category/product vía supertest contra rutas reales) | E6 | Deuda técnica | **Alto** | **Cerrado (2026-08-26)** — extendido por `T-05` |
| T-05 | Extender integración de backend a los 5 recursos que quedaban fuera de `T-04` (address/paymentMethod/order/wishlist/user, 13 endpoints) + `requireAdmin` unitario + caso 422 de login — producto de la auditoría de la "Estrategia integral de pruebas" | E6 | Deuda técnica | **Alto** | **Cerrado (2026-08-27)** — 51 casos nuevos, 158/158 en verde |
| B-10 | `POST /api/products` con `slug` duplicado respondía 500 genérico en vez de 422 — `Product.create()` no capturaba el error de índice duplicado de Mongo (`code: 11000`), y el error handler global solo reconocía `ValidationError` de Mongoose | E5 | Bug | **Medio** | **Cerrado (2026-08-26)** |
| B-11 | `LoginForm.jsx` (`handleLoginError`) solo trataba `CLIENT_ERROR`+400, pero login inválido responde 401 real — contraseña incorrecta mostraba el mensaje genérico de error en vez de "Email o contraseña incorrectos" | E5 | Bug | **Alto** | **Cerrado (2026-08-26)** |
| B-12 | `RegisterForm.jsx` (`handleRegisterError`) no capturaba email duplicado (422 `{message}` sin `errors` → `kind:"VALIDATION"` sin `fields`) ni errores de red/timeout/servidor — el registro fallaba en silencio total, sin ningún mensaje visible | E5 | Bug | **Alto** | **Cerrado (2026-08-26)** |
| B-13 | `OrderConfirmation.jsx` leía `order.address` síncronamente durante el render, antes de que el `useEffect` de redirección corriera — entrar a `/order-confirmation` sin `state.order` (URL escrita a mano, bookmark, link viejo/compartido — cualquier navegación fresca que no pasó por el `navigate(..., {state})` real del checkout) lanzaba `TypeError` en vez de redirigir a `/` | E5 | Bug | **Alto** | **Cerrado (2026-08-26)** |
| B-14 | `Button.jsx` (`components/common/`) no reenviaba props extra (`title`, etc.) al `<button>` real — sin `{...rest}` ni destructuring explícito, cualquier `title` pasado por un consumidor se perdía en silencio. Afectaba tooltips reales en `Cart.jsx`, `Checkout.jsx` y `CartView.jsx` (explican por qué un botón está deshabilitado, o qué hace) | E5 | Bug | **Medio** | **Cerrado (2026-08-26)** |
| S-04 | `cors()` sin allowlist — restringir orígenes antes de cualquier despliegue | E4 | Deuda/Seguridad | **Medio** | **Cerrado (2026-08-26)** |
| F-05 | Profile: `GET` real al backend en vez de derivar todo del JWT decodificado | E3 | Feature faltante | **Medio** | **Cerrado (2026-08-26)** |
| F-06 | Settings: definir alcance real (qué configura) e implementar UI | E3 | Feature faltante | **Medio** | **Cerrado (2026-08-26)** |
| B-02 | `pages/ProductDetails.jsx` — import roto a componente inexistente (huérfano, no enrutado) | E5 | Bug | **Medio** | **Cerrado (2026-08-26)** |
| B-08 | `ProfileCard.jsx`: `contextUser.role` en vez de `currentUser.role`, `currentUser.loginDate` inexistente en vez de `last_login`, botones de acción no-op incluyendo un "Panel de administración" sin ruta | E5 | Bug | **Medio** | **Cerrado (2026-08-26)** |
| B-09 | `ErrorMessage`/`Loading` solo aceptan `children`, no `message` — varios llamadores (`Checkout.jsx`, `Orders.jsx`, `WishList.jsx`, `CategoryProducts.jsx`, `ProductDetails.jsx`) les pasan `message={...}` y el texto nunca se renderiza | E5 | Bug | **Medio** | **Cerrado (2026-08-26)** |
| B-06 | Rol fantasma `"cliente"` en `ProtectedRoute` (`/profile`) — no existe en `User.role` | E5 | Deuda técnica | **Medio** | **Cerrado (2026-08-26)** |
| DOC-01 | Escribir specs por épica en `docs/specs/` a medida que cada una arranque | E1–E10 | Documentación | **Medio** | En progreso (2026-08-27) — no aplica retroactivamente a E1–E8 (se implementaron directo sobre `main`, sin spec previo; escribirlos ahora sería documentación reconstruida, no un spec real — ver `docs/specs/README.md`). Infraestructura lista para E9/E10: rama `develop` creada, CI extendido a `develop`. Specs reales se escriben al arrancar esas épicas |
| DOC-02 | Crear `README.md` raíz (y/o por subproyecto) con setup, stack y comandos — hoy solo existe `CLAUDE.md`, pensado para el agente, no para un humano nuevo en el proyecto | — | Documentación | **Medio** | **Cerrado (2026-08-27)** |
| T-02 | Suite de tests frontend con Testing Library + MSW (`frontend-tester` ya está listo) | E6 | Deuda técnica | **Medio** | **Cerrado (2026-08-27)** — ALTA/MEDIA/BAJA completas, 301 tests |
| E2E-01 | Instalar Cypress + flujo crítico login→carrito→checkout (requiere F-03 primero) | E7 | Deuda técnica | **Medio** | **Cerrado (2026-08-27)** — 20/20 specs en verde con el runner real en GitHub Actions (bloqueo de Cypress en la máquina Windows de desarrollo sigue documentado, pero ya no bloquea nada: CI es el runner real) |
| B-15 | `Checkout.jsx` (`handleCreateOrder`) no tenía ninguna bandera de "enviando" — un doble clic real en "Confirmar y Pagar" podía disparar dos `POST /api/orders` mientras la primera petición seguía en curso | E5 | Bug | **Alto** | **Cerrado (2026-08-27)** |
| B-16 | `CartContext.jsx` (`updateItem`) sin ordenamiento de peticiones — dos cambios de cantidad rápidos sobre el mismo item (ej. +/- en sucesión) disparan dos `PATCH /api/cart/:itemId` en paralelo; si la respuesta de la petición vieja llega después que la de la más reciente, `setItems(data.items)` pisa el estado con una cantidad obsoleta | E5 | Bug | **Alto** | **Cerrado (2026-08-27)** |
| CI-01 | Agregar lint + tests + gate de cobertura al workflow (hoy solo `npm ci` + build) | E8 | Deuda técnica | **Bajo** | **Cerrado (2026-08-27)** — lint + tests+cobertura + E2E con Cypress en los 3 jobs, confirmado en verde |
| B-03 | `pages/PurchaseOrder.jsx` — página huérfana con datos hardcodeados, sin ruta | E5 | Deuda técnica | **Bajo** | **Cerrado (2026-08-26)** |
| B-05 | `data/categories.json` — código muerto, contenido de otro dominio | E5 | Deuda técnica | **Bajo** | **Cerrado (2026-08-26)** |
| B-07 | Borrar `server_practice.js` / `db.config_practice.js` (0 bytes, scaffolding del curso) | E5 | Deuda técnica | **Bajo** | **Cerrado (2026-08-26)** |
| OBS-01 | Instalar Artillery + escenario de carga contra endpoints reales | E9 | Deuda técnica | **Bajo** | Pendiente |
| DEP-01 | Crear servicios en Render + Deploy Hooks como secrets de GitHub | E10 | Deuda técnica | **Bajo** | Pendiente |
| DOC-03 | Documentación OpenAPI/Swagger de los 35 endpoints reales — `/api-docs`, gateado por `NODE_ENV`/`ENABLE_DOCS` | E11 | Documentación | **Medio** | **Cerrado (2026-08-27)** — [PR #1](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/pull/1) mergeado a `develop`, verificado con el servidor real corriendo |
| S-05 | Rate limiting en `POST /auth/login` y `POST /auth/register` — hoy sin ningún freno a fuerza bruta | E12 | Bug/Seguridad | **Alto** | **Cerrado (2026-08-27)** — `express-rate-limit`, 10 intentos/15min por ruta, limitadores independientes |
| S-06 | Política de contraseña mínima en `register` (`auth.controller.js:21` solo valida truthy) — igualar a `changePassword` (`isLength({min:6})`) | E12 | Bug/Seguridad | **Alto** | **Cerrado (2026-08-27)** — mínimo 6 caracteres, mismo umbral que `changePassword` |
| S-07 | Logging de eventos de seguridad — 401 de `requireAuth`, 403 de `requireAdmin`, login fallido, hoy no se registra nada | E12 | Deuda técnica | **Alto** | **Cerrado (2026-08-27)** — log a archivo real (`logs/security.log`, gitignored), sin librería nueva |
| S-08 | `GET /products/search` mete `q` sin escapar en un `$regex` de Mongo (`product.controller.js:28-33`) — riesgo de ReDoS en una ruta pública sin auth | E12 | Bug/Seguridad | **Medio** | Pendiente |
| S-09 | Agregar `helmet` — sin headers de seguridad HTTP en ninguna respuesta | E12 | Deuda técnica | **Medio** | Pendiente |
| S-10 | Definir y aplicar control de stock en `cart`/`order` — `Product.stock` existe pero nunca se valida ni se descuenta, sin control de sobreventa | E12 | Deuda de diseño | **Medio** | Pendiente |
| S-11 | Whitelist de campos en `createProduct`/`updateProduct` (`product.controller.js:89,99`) — hoy pasan `req.body` completo a Mongoose sin filtrar | E12 | Deuda técnica | **Bajo** | Pendiente |

## Detalle de items

Contexto adicional migrado desde `PENDIENTES.md`, necesario para arrancar cada item sin
re-descubrir el mismo terreno.

- **`S-05` a `S-11` (auditoría OWASP Top 10:2025, `E12`) — informe completo en
  [docs/security/owasp-audit-2026-08-27.md](security/owasp-audit-2026-08-27.md)**: evidencia
  archivo:línea, por qué es un riesgo y la mitigación recomendada para cada hallazgo. Auditoría de
  solo lectura, código no modificado — cada item se corrige por separado a partir de aquí.
- **`DOC-03` (Swagger/OpenAPI, `E11`):** `src/config/swagger.js` con la definición OpenAPI 3 y 14
  schemas reales, `/api-docs`+`/api-docs.json` gateados por `NODE_ENV`/`ENABLE_DOCS`, 35 endpoints
  anotados en los 9 archivos de rutas. [PR #1](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/pull/1)
  abierto contra `develop`, verificado con el servidor real (lint + 158/158 tests + los 3
  escenarios de `NODE_ENV`/`ENABLE_DOCS` probados en vivo), sin mergear todavía.
- **S-01/S-02 (seguridad de catálogo) — CERRADO 2026-08-26:** `requireAdmin` agregado a
  `src/middlewares/auth.middleware.js` (exige `req.user.role === "admin"`, 403 si no; debe montarse
  después de `requireAuth`). Aplicado como `requireAuth, requireAdmin` antes del validador en
  `POST`/`PUT`/`DELETE` de `product.routes.js` y `category.routes.js`. Verificado en vivo contra
  el backend real (no solo lectura de código): servidor levantado, 3 casos probados con curl —
  sin token → 401, token de `user2@test.com` (`customer`) → 403 `{"message":"Requiere rol de
  administrador"}`, token de `user1@test.com` (`admin`) → 201/204 normal. Mismo resultado en
  `products` y `categories`. Producto de prueba creado durante la verificación, borrado después
  (soft-delete). Documentación actualizada en `.claude/api-routes.md`, `.claude/validators.md`,
  `.claude/code-patterns.md`, `CLAUDE.md`, `docs/PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`,
  `docs/threat-models/README.md`, `.claude/agents/backend-tester.md`, `.claude/agents/
  test-planner.md` — todas contradecían el código nuevo y quedaron corregidas. **Sin cubrir
  todavía:** test automatizado (bloqueado por T-04, requiere integración).
- **S-03 (almacenamiento de tarjeta) — CERRADO 2026-08-26:** decisión del usuario entre 4 opciones
  presentadas (no guardar el número real / tokenización con proveedor externo / cifrado AES en la
  app / aplazar) → eligió **no guardar el número real**. `PaymentMethod.js` cambió `cardNumber`/
  `cvv` por `last4` (String, `maxlength:4`) y `brand` (String) — el número completo y el cvv ya no
  son campos del schema, se descartan aunque se envíen (verificado con test:
  `tests/unit/models/paymentMethod.model.test.js`). `src/seed/seed.js` actualizado a los campos
  nuevos, corrido en vivo sin errores. Un cobro real con tarjeta queda pendiente de F-02, y
  requeriría integrar un proveedor externo (Stripe/PayPal) que devuelva un token — no está en
  alcance todavía. Documentación actualizada en `.claude/models.md`, `docs/PROJECT_STATUS.md`,
  `docs/ARCHITECTURE.md`, `docs/threat-models/README.md`, `docs/user-stories.md` (US-002),
  `TEST_PLAN.md`.
- **T-03 (script `npm test`) — CERRADO 2026-08-26:** `ecommerce-api/package.json` ahora tiene
  `"test": "vitest run tests/unit/"`, `"test:watch": "vitest tests/unit/"`,
  `"test:coverage": "vitest run tests/unit/ --coverage"`. Verificado corriendo `npm test`
  (10 files / 60 tests, verde). Con integración (T-04) el glob debería ampliarse a `tests/`
  completo, no solo `tests/unit/`.
- **B-01 (Breadcrumb) — CERRADO 2026-08-26:** el bug real no era solo el nombre del prop
  (`items` vs `categories`) — ambos consumidores (`CategoryProducts.jsx`, `ProductDetails.jsx`)
  ya tenían el objeto `category` real poblado por el backend, y lo aplanaban a mano en un array
  `{label, to}` que `Breadcrumb` nunca supo leer. Fix: pasar `categories={category}` directo en
  los dos. Hallazgo adicional durante el fix: `product.controller.js` solo popula `category`, no
  `category.parentCategory` (a diferencia de `category.controller.js`, que sí popula un nivel) —
  sin guarda, eso habría empujado un `ObjectId` crudo a la jerarquía y roto una entrada del
  breadcrumb en la página de producto. Se agregó una guarda en `Breadcrumb.jsx` para cortar la
  cadena si `parentCategory` no viene poblado. Verificado visualmente con Playwright contra el
  backend real: página de categoría → `Inicio > Anime > Series` (jerarquía completa); página de
  producto → `Inicio > Más Vendidos` (un nivel, sin entradas rotas).
- **B-06 (rol fantasma) — CERRADO 2026-08-26:** quitado `"cliente"` de `allowedRoles` en
  `components/App/App.jsx` (ruta `/profile`). Queda `["admin", "customer"]`, igual al enum real
  de `User.role`.
- **B-05/B-07 (archivos muertos) — CERRADOS 2026-08-26:** borrados `ecommerce-app/src/data/
  categories.json`, `ecommerce-api/server_practice.js` y `ecommerce-api/src/config/
  db.config_practice.js` — verificado con grep que nada los importaba antes de borrar.
- **F-01 (Address) — CERRADO COMPLETO 2026-08-26 (backend + frontend):**
  - **Backend:** `address.controller.js` + `address.routes.js` siguiendo el patrón de
    `cart.controller.js`/`cart.routes.js` (todo bajo `requireAuth`, scoped a `req.user.id`).
    Contrato en `docs/contracts/address.md`. Verificado en vivo con curl: 401 sin token, 422 en
    validación, 201 al crear, `isDefault:true` desmarca las demás direcciones del usuario,
    aislamiento cross-user (`user3` no puede borrar dirección de `user2` → 404, nunca expone que
    existe). Hallazgo que corrigió el contrato: un `:id` con formato inválido da **422** (lo
    atrapa el validador), no 404 — 404 es solo id válido pero inexistente/ajeno.
  - **Frontend:** `addressService.js` real (patrón de `cartService.js`). `Checkout.jsx` ya no usa
    `shippingService` mock para direcciones (el pago sigue mock, es F-02). Se reescribieron
    `AddressForm.jsx`/`AddressItem.jsx` porque el mock viejo usaba una forma de datos totalmente
    distinta a la real (`name`/`address1`/`address2` vs `address`/`city`/`state`/`phone`/
    `addressType` — el modelo real ni siquiera tenía `name` y el mock nunca tuvo `state`/`phone`,
    que el backend exige). `handleAddressSubmit`/`handleAddressDelete` ahora llaman a la API real
    y, tras guardar, **re-consultan la lista completa** en vez de fusionar a mano — la regla
    "solo un default" la aplica el servidor, replicarla en cliente habría divergido.
  - **Bug de shape encontrado y corregido de paso:** `Orders.jsx` y `OrderConfirmation.jsx`
    todavía leían `shippingAddress.name`/`address1`/`address2` (forma del mock viejo) — con la
    forma real esos campos quedan `undefined` y se ven en blanco. Se corrigieron ambos antes de
    dar por cerrado el item, para no dejar un bug nuevo.
  - **Verificado de punta a punta con Playwright, no solo por código:** login real → agregar
    producto al carrito por la UI → checkout → crear dirección nueva por el formulario real →
    confirmar que queda seleccionada y que exactamente 1 badge "Predeterminada" se muestra (la
    vieja se desmarca sola) → completar la orden → `OrderConfirmation` y `/orders` muestran la
    dirección real completa, sin campos en blanco. Datos de prueba limpiados después
    (dirección y carrito borrados vía API).
  - **Limpieza de paso:** `services/shippingService.js` y `data/shipping-address.json` quedaron
    sin ningún import tras el cambio — verificado con grep, borrados (mismo criterio que B-05/B-07).
- **F-02 (PaymentMethod) — CERRADO COMPLETO 2026-08-26 (backend + frontend):**
  - **Backend:** `paymentMethod.controller.js` + `paymentMethod.routes.js`, mismo patrón que
    `address.controller.js`/`address.routes.js`. Contrato en `docs/contracts/payment-method.md`.
    Verificado en vivo con curl: 401 sin token, **422 explícito si el body incluye `cardNumber` o
    `cvv`** (regla S-03 aplicada como validación real, no solo como ausencia de campo), 422 en
    `type` inválido, 201 al crear, `isDefault:true` desmarca los demás, aislamiento cross-user
    (404, no expone que existe).
  - **Frontend:** `paymentMethodService.js` real. `PaymentForm.jsx` se reescribió completo: ya no
    pide **cvv** (se eliminó del formulario — no hay ningún motivo para pedirlo si nunca se
    transmite), el número de tarjeta que el usuario escribe **nunca sale del componente**: se usa
    solo para derivar `last4` (últimos 4 dígitos) y `brand` (por el primer dígito) antes de armar
    el payload; el string completo no viaja a `onSubmit` ni a la API. `PaymentItem.jsx`/
    `PaymentList.jsx` reescritos para la forma real (`brand`/`last4`/`cardHolderName` en vez de
    `alias`/`cardNumber`/`placeHolder`). `Checkout.jsx`, `Orders.jsx` actualizados — mismos 2
    puntos de renderizado que tenían el bug de shape viejo (`alias`/`cardNumber`) que F-01 ya
    había encontrado en direcciones.
  - **Verificado de punta a punta con Playwright:** login → agregar al carrito → checkout → crear
    tarjeta nueva (5500... → deriva "Mastercard" correctamente por el primer dígito) → queda
    seleccionada con exactamente 1 badge "Predeterminada" → completar orden → `/orders` muestra
    "Ana Test / **** **** **** 4444" sin campos en blanco. Datos de prueba limpiados vía API.
  - **Limpieza de paso:** `services/paymentService.js` y `data/paymentMethods.json` quedaron sin
    uso, borrados (mismo criterio que `shippingService` en F-01).
  - **Hallazgo real no accionable ahora:** los `PaymentMethod` sembrados antes de S-03 conservan
    el `cardNumber` viejo en Mongo y no tienen `last4`/`brand` — se ven como "Método de pago /
    **** ----" en la UI. Es un dato de seed sin backfill, no un bug; anotado en
    `docs/PROJECT_STATUS.md`, no se toca ahora.
- **F-03 (Order) / A-01 — CERRADO COMPLETO 2026-08-26 (backend + frontend), épica E1 completa:**
  - **Backend:** `order.controller.js` + `order.routes.js`. `POST /api/orders` recibe solo
    `{ addressId, paymentMethodId }` — arma `products`/`subtotalPrice`/`shippingCost`/
    `totalPrice` desde el `Cart` real del usuario (mismas constantes de negocio que ya usaba
    `Checkout.jsx`: IVA 16%, envío $350 si subtotal < $1000), nunca confía en un total mandado
    por el cliente. Verifica que `address`/`paymentMethod` pertenezcan al usuario logueado (404
    si no). Vacía el carrito server-side al crear la orden. Contrato en
    `docs/contracts/orders.md`. Verificado en vivo con curl: 401, 422 (carrito vacío), 404
    (dirección ajena), 201 con total exacto verificado a mano.
  - **Frontend:** `orderService.js` real. `Checkout.jsx` ya no escribe a `localStorage["orders"]`
    — llama a `POST /api/orders` y navega a `OrderConfirmation` con la orden real devuelta.
    `Orders.jsx` reescrito para consultar `GET /api/orders` (ya no `readLocalJSON`/
    `STORAGE_KEYS`). `OrderConfirmation.jsx`/`Orders.jsx` actualizados al shape real de `Order`
    (`order.products[].productId`, `order.address`, `order.subtotalPrice`/`shippingCost`/
    `totalPrice` — el IVA se recalcula por resta para mostrarlo como línea aparte, porque el
    schema no tiene un campo de impuesto separado).
  - **Verificado de punta a punta con Playwright:** agregar al carrito → checkout → confirmar →
    `OrderConfirmation` con total exacto ($379 subtotal → $60.64 IVA → $350 envío → $789.64
    total) → `/orders` lista y detalle muestran la misma orden real, con método de pago PayPal
    renderizado correctamente. Orden de prueba borrada después (sin endpoint DELETE por diseño,
    se limpió directo en Mongo).
  - **Limpieza de paso:** `utils/storageHelpers.js` quedó sin ningún importador tras el cambio
    (tenía además funciones de normalización atadas a las formas viejas del mock) — borrado.
- **F-04 (Wishlist) — CERRADO COMPLETO 2026-08-26 (backend + frontend), cierra la mitad de
  `B-04`:**
  - **Backend:** `wishlist.controller.js` + `wishlist.routes.js`, patrón get-or-create (un
    usuario, una wishlist, como `Cart` — el schema `WishList` no tiene `unique` en `user`, pero
    el controller nunca crea una segunda si ya existe). Agregar/quitar un producto es
    idempotente (no duplica, no falla si ya no estaba). Contrato en
    `docs/contracts/wishlist.md`. Verificado en vivo con curl: 401, 422 (`productId` inválido),
    201 al agregar, no duplica en un segundo POST del mismo producto, 200 al quitar.
  - **Frontend:** `wishlistService.js` real. Botón "♡ Agregar a favoritos" / "♥ En favoritos" en
    `ProductDetails.jsx` (solo visible si `isAuthenticated`, patrón ya usado en el drawer de
    categorías). `pages/WishList.jsx` — antes `export default function WishList() {}` vacío —
    reescrito para listar los productos reales de la wishlist reusando `ProductCard`, con botón
    de quitar.
  - **Verificado de punta a punta con Playwright:** click en "Agregar a favoritos" en la página
    de un producto → cambia a "En favoritos" → **persiste tras recargar la página** (confirma
    que lee del backend, no de estado en memoria) → aparece en `/wishlist` con el `ProductCard`
    real → quitar deja el estado vacío correcto.
- **F-05 (Profile) / F-06 (Settings) — CERRADO COMPLETO 2026-08-26 (backend + frontend), cierra
  la épica E3 y el resto de `B-04`:**
  - **Backend:** `user.controller.js` + `user.routes.js`, mismo patrón que `address`/
    `paymentMethod` (todo bajo `requireAuth`, self-service puro sobre `req.user.id` — no existe
    `GET /api/users/:id`). `GET /api/users/me` devuelve el usuario sin `password`. `PUT
    /api/users/me` acepta `name`/`email` opcionales, 422 si el email ya pertenece a otro usuario
    (mismo mensaje `"User already exist"` que `register`). `PUT /api/users/me/password` valida
    `currentPassword` con `bcrypt.compare` (401 si no coincide) antes de hashear y guardar la
    nueva. Contrato en `docs/contracts/user.md`. Verificado en vivo con curl contra
    `user4@test.com`: 401 sin token, `GET /me` sin `password`, `PUT /me` con email duplicado →
    422, actualización de nombre → 200, `PUT /me/password` con contraseña actual incorrecta →
    401, cambio real → 200. **La cuenta de prueba se revirtió** (nombre y contraseña) a los
    valores semilla (`"User 4"` / `123456`) después de verificar, para no romper la tabla de
    credenciales demo de este backlog.
  - **Frontend:** `userService.js` real (el mock viejo sobre `data/users.json` se borró, cero
    importadores). `Profile.jsx` ahora hace `GET /api/users/me` en un `useEffect` y pasa el
    resultado a `ProfileCard` vía `userProp` (mecanismo que ya existía en el componente pero no se
    usaba). `pages/Setttings.jsx` (antes vacío, `B-04`) implementado con dos formularios: editar
    nombre/email (`PUT /api/users/me`) y cambiar contraseña (`PUT /api/users/me/password`, con
    validación client-side de que `newPassword`/`confirmNewPassword` coincidan antes de llamar a
    la API).
  - **Bug encontrado y corregido de paso (`B-08`):** `ProfileCard.jsx` comparaba
    `contextUser.role` (variable que no existía en ese scope, siempre `undefined` → el badge de
    rol mostraba "guest") en vez de `currentUser.role`; leía `currentUser.loginDate` (campo que
    nunca existió en `User`) en vez de `currentUser.last_login`; los botones de "Acciones de la
    cuenta" eran un objeto estático `ROLE_ACTIONS` con handlers no-op (`() => {}`), incluyendo un
    botón "Panel de administración" que no apunta a ninguna ruta real del proyecto — se quitó en
    vez de inventar una ruta que no existe. Ahora "Editar Perfil"/"Cambiar contraseña" navegan a
    `/settings` y "Ver mis pedidos"/"Ver todos los pedidos" navegan a `/orders`.
  - **Bug encontrado, no corregido por quedar fuera de alcance (`B-09`):** `ErrorMessage`/
    `Loading` (`components/common/`) solo leen `children`, no una prop `message`; varios
    llamadores preexistentes (`Checkout.jsx`, `Orders.jsx`, `WishList.jsx`,
    `CategoryProducts.jsx`, `ProductDetails.jsx`) les pasan `message={...}`, así que el texto
    nunca se renderiza (queda una caja vacía en vez del mensaje). Se corrigió únicamente en el
    código nuevo de este item (`Profile.jsx`/`Setttings.jsx`, usando `{...}` como children); los
    llamadores preexistentes no se tocaron para no exceder el alcance de F-05/F-06.
  - **Verificado de punta a punta con Playwright:** login (`user4@test.com`) → `/profile` muestra
    email/estado/última conexión reales, sin "No disponible" → click "Editar Perfil" navega a
    `/settings` → formulario ya viene con nombre/email reales precargados → guardar (sin cambios)
    muestra mensaje de éxito → cambiar el email a uno ya existente (`user1@test.com`) da 422 con
    mensaje "Ese email ya está en uso por otra cuenta" → contraseña actual incorrecta da 401 con
    mensaje real → confirmación de contraseña no coincidente se rechaza client-side sin llamar a
    la API → cambio de contraseña real (a `654321`) funciona y muestra éxito → **se revierte la
    contraseña de vuelta a `123456`** en el mismo flujo, verificado con éxito → recargar
    `/profile` confirma que nombre/email persistieron correctamente → "Ver mis pedidos" navega a
    `/orders`. `npm test` del backend sigue en 60/60 después de los cambios.
- **B-09 (`ErrorMessage`/`Loading` ignoran `message`) — CERRADO 2026-08-26:** los componentes
  (`components/common/ErrorMessage/ErrorMessage.jsx`, `.../Loading/Loading.jsx`) solo leen
  `children`; se corrigieron los 5 llamadores que pasaban `message={...}` en vez de `{...}` como
  children: `Checkout.jsx` (loading y error), `Orders.jsx` (loading), `WishList.jsx` (loading y
  error), `CategoryProducts.jsx` (loading y las dos ramas de error, que además tenían contenido
  extra como children — se combinó todo en un solo bloque de children), `ProductDetails.jsx`
  (4 ramas de error, donde `message={error}` era además dead code: `error` guardaba el `kind`
  interno de `classifyError` como `"NOT_FOUND"`, nunca pensado para mostrarse — el texto real ya
  estaba completo en los children, así que solo se quitó la prop). **Hallazgo adicional al
  verificar con Playwright:** `CategoryProducts.jsx` tenía un segundo bug encadenado —
  `message={error || "Categoría no encontrada"}` mostraba el `kind` crudo (`"NOT_FOUND"`) en vez
  del texto amigable, porque `error` siempre es verdadero en esa rama (nunca cae al fallback); se
  corrigió a mostrar siempre "Categoría no encontrada", igual que el patrón ya usado en
  `ProductDetails.jsx` (texto humano fijo por rama, nunca el `kind` interno). Verificado con
  Playwright: `/category/<id-inexistente>` y `/product/<id-inexistente>` ahora sí muestran el
  mensaje real; `/wishlist`, `/orders`, `/checkout` y una categoría real siguen renderizando sin
  regresiones.
- **B-02/B-03 (páginas huérfanas) — CERRADOS 2026-08-26 (borradas, no reescritas):** verificado
  con grep en todo el repo que ninguna de las dos tenía importador fuera de sí misma (no aparecen
  en `App.jsx` ni en ningún otro archivo). `pages/ProductDetails.jsx` importaba
  `components/ProductDetails/ProductDetailsCard`, un módulo que **no existe en el repo** —
  hubiera roto al instante si algo llegaba a importarlo; el producto real se sirve desde
  `pages/Product.jsx` → `components/ProductDetails/ProductDetails.jsx`, ya enrutado en
  `/product/:productId`. `pages/PurchaseOrder.jsx` era un borrador de resumen de compra con
  `addressList`/`paymentMethodList` hardcodeados usando las formas viejas del mock
  (`alias`/`placeHolder`/`cardNumber`/`cvv`, las mismas que F-01/F-02 ya reemplazaron en todo el
  resto del código) y un botón "Pagar" sin conectar — completamente superado por `Checkout.jsx`,
  que ya hace todo esto contra el backend real. Se optó por borrar en vez de mover a tests: ninguna
  ruta llega a estos componentes, así que ningún test protegería comportamiento real; escribir
  tests ahí solo habría fijado en el tiempo un estado roto/mock que ya no representa el producto.
  Sin archivos CSS asociados que limpiar (ninguno de los dos tenía un `.css` propio).
- **S-04 (`cors()` allowlist) — CERRADO 2026-08-26, épica E4 completa:** `src/app.js` ahora
  configura `cors({ origin: ... })` con una allowlist real leída de `CORS_ALLOWED_ORIGINS`
  (comma-separated, default `http://localhost:3001` si no está definida — documentado en
  `docs/environment-variables.md`). **Detalle no obvio, encontrado al implementar:** la lectura
  del env var no puede hacerse a nivel de módulo — `src/app.js` se importa (y su código de nivel
  de módulo se ejecuta) **antes** de que `server.js` corra `dotenv.config()` (los `import` de ES
  Modules se resuelven antes que el código propio del archivo que importa, sin importar el orden
  en que estén escritas las líneas), así que una constante calculada al cargar el módulo nunca
  vería el valor real del `.env`. Se resolvió leyendo `process.env.CORS_ALLOWED_ORIGINS` **dentro**
  del callback de `cors()`, que corre por request, mucho después de que `dotenv.config()` ya se
  ejecutó. Un origen no permitido no recibe el header `Access-Control-Allow-Origin` (comportamiento
  estándar de CORS — el navegador bloquea que JS lea la respuesta, pero el request se sigue
  procesando); peticiones sin header `Origin` (curl, servidor-a-servidor) siempre pasan.
  Verificado en tres escenarios reales: (1) origen permitido por default (`http://localhost:3001`)
  recibe el header; origen no listado (`http://evil.com`) no lo recibe; sin `Origin` sigue
  respondiendo 200. (2) Levantando el server con `CORS_ALLOWED_ORIGINS` como variable de entorno
  real del proceso, un origen distinto queda permitido y el default deja de estarlo. (3) Agregando
  temporalmente la misma variable al `.env` real (restaurado exactamente después) y levantando con
  `npm start` (la ruta real de `dotenv`), confirmando que la lectura diferida sí resuelve el valor
  — este último caso era el que habría fallado silenciosamente sin el fix de timing. Verificado
  además de punta a punta con Playwright contra un navegador real (login + navegación real vía
  `apiClient`/axios, sin errores de CORS en consola). Cierra `S-04` de este backlog — `E4` queda
  sin items pendientes.
- **REF-01 (split `app.js`/`server.js`) — CERRADO 2026-08-26, desbloquea `T-04`:** se creó
  `ecommerce-api/src/app.js` con toda la construcción de la app Express (middlewares, montaje de
  rutas, error handler global) y `export default app`, **sin** `dotenv.config()`, `connectDB()`
  ni `app.listen()` — importarlo ya no dispara ningún efecto secundario. `server.js` (raíz) quedó
  como entrypoint delgado: `dotenv.config()` → `connectDB()` → `app.listen(port)`, importando
  `app` desde `src/app.js`. `package.json` (`main`/`start`/`dev`) no cambió — sigue apuntando a
  `server.js`, que sigue haciendo exactamente lo mismo que antes desde el punto de vista de quien
  corre `npm start`/`npm run dev`. Detalle no obvio: el mount estático `/img` usaba
  `path.dirname(fileURLToPath(import.meta.url))` para ubicar `public/img`; al mover ese código a
  `src/app.js`, `__dirname` pasa a apuntar a `ecommerce-api/src/` en vez de `ecommerce-api/`, así
  que la ruta se corrigió a `path.join(__dirname, '..', 'public', 'img')` — sin este ajuste las
  imágenes de producto habrían dejado de servirse (404) sin que ningún test lo detectara.
  Verificado: `npm test` sigue en 60/60; `npm start` real levanta con los mismos logs
  (`dotenv`/`MongoDB connected`/`Server running`); curl contra `GET /`, `GET /api/products`,
  `GET /api/users/me` sin token (401), `POST /api/auth/login` (200) y `GET /img/products/
  tshirt-01.jpg` (200, `image/jpeg` — confirma que la corrección de `__dirname` funciona con un
  archivo real, no solo que un 404 devuelva 404) responden igual que antes del refactor. Se
  confirmó además que `src/app.js` se puede `import()` de forma aislada sin conexión a Mongo ni
  servidor escuchando — el requisito real que pedía `T-04`/`TEST_PLAN.md` para poder montar
  `supertest`. **Motivo de hacerlo ahora, antes que otros items de la cola:** varios pendientes
  (`T-04`, y en menor medida `E2E-01`/`CI-01` si en algún momento levantan el backend para probar
  contra él) dependían o se beneficiaban de este bootstrap ya limpio; hacerlo antes evita tener
  que rehacer esas configuraciones más adelante.
- **T-04 (integración auth/cart/category/product) — CERRADO 2026-08-26, delegado al agente
  `backend-tester`:** se instalaron `supertest` y `mongodb-memory-server` (únicas devDependencies
  agregadas) y se escribieron 44 tests en `ecommerce-api/tests/integration/` — detalle completo
  (qué cubre cada archivo, decisiones de helpers) en
  [TEST_PLAN.md](../TEST_PLAN.md#integración--t-04-hecho-2026-08-26), no se duplica aquí.
  Verificado de forma independiente (no solo se confió en el reporte del agente): se leyeron los
  5 archivos de test completos, se corrió `npm test` dos veces por separado (104/104 ambas) y se
  regeneró `npm run test:coverage` para confirmar los números reales de cobertura por archivo.
  **Hallazgo real confirmado con test, trackeado y cerrado por separado como `B-10`** (ver su
  propia entrada más abajo): `POST /api/products` con `slug` duplicado respondía 500 genérico en
  vez de 422 — `product.controller.js` (`createProduct`) no capturaba el
  `MongoServerError`/`code:11000` de Mongo, y el error handler global (`src/app.js`) solo
  reconocía `ValidationError` de Mongoose. Antes era una sospecha leída del código (documentada en
  `TEST_PLAN.md`); el test de integración la confirmó empíricamente. **Detalle no obvio
  encontrado al verificar:** `npm run test:coverage` fallaba de
  forma intermitente (3 tests con timeout de 5000ms) por el overhead de instrumentación V8 sumado
  a levantar 15 instancias de `MongoMemoryServer` en paralelo — se subió `testTimeout`/
  `hookTimeout` a 20000ms en `vitest.config.js`, confirmado estable en corridas repetidas después.
  También se corrigió `ecommerce-api/package.json` (`test`/`test:watch`/`test:coverage` de
  `tests/unit/` a `tests/`, ya anticipado en el cierre de `T-03`) y `.claude/agents/
  backend-tester.md` (seguía diciendo que había que montar Jest con `--experimental-vm-modules`,
  desactualizado desde que `T-01` eligió Vitest) **antes** de delegar, para que el agente no
  reinventara infraestructura ya decidida.
- **B-10 (slug duplicado → 500) — CERRADO 2026-08-26, épica E5 completa:** el fix se hizo en el
  **error handler global** (`ecommerce-api/src/app.js`), no con `try/catch` en el controller —
  respeta la convención explícita del repo de que los controllers son `async (req,res)` **sin**
  `try/catch` (Express 5 reenvía la promesa rechazada al handler global solo). Se agregó una rama
  para `err.code === 11000` (duplicado de índice `unique` de Mongo) → 422 con un mensaje que
  nombra el campo y el valor duplicados (ej. `El valor de "slug" ya está en uso: "camiseta-x"`),
  igual que ya existía para `ValidationError` de Mongoose. **Por estar en el handler global, el
  fix cubre automáticamente cualquier `unique` duplicado de cualquier recurso** (no solo
  `Product.slug`) — se agregó un segundo test HTTP en `category.test.js` para probar
  `Category.slug` duplicado y confirmar que generaliza, no solo `product`. Se actualizó el test
  de `product.test.js` que antes documentaba el 500 (era un test de caracterización, no una
  aserción de "correcto") para esperar ahora el 422 real. Verificado: `npm test` en 105/105 (104
  + 1 nuevo), y en vivo con curl contra un servidor recién levantado — crear un producto, crear
  otro con el mismo slug → 422 con el mensaje esperado (antes 500), producto de prueba borrado
  (soft-delete) después. Cierra `B-10` de este backlog — `E5` queda otra vez sin items
  pendientes.
- **T-01 (tests backend) — CERRADO 2026-08-27:** runner elegido: **Vitest** (soporte ESM nativo,
  sin flags de `--experimental-vm-modules` que sí necesitaría Jest en este repo
  `"type":"module"`). Instalado como devDependency en `ecommerce-api`, igual que
  `mongodb-memory-server` (instalado al cerrar `T-04`). **Matriz completa y estado real en
  [TEST_PLAN.md](../TEST_PLAN.md)** (raíz del repo) — no se duplica aquí. Resumen: 107 tests
  `Hecho` (60 unitarios + 47 de integración), corrida real
  `16 passed (16 files) / 107 passed (107 tests)`. Lo que bloqueaba avanzar (refactor
  `app.js`/`server.js`, instalar `mongodb-memory-server`) ya se cerró como `REF-01`/`T-04`.
  **Las 3 piezas que quedaban pendientes de `T-01` específicamente, cerradas hoy:**
  - **Cobertura de `db.conf.js`:** la decisión aplazada ("interceptar `mongoose.connect`/
    `process.exit` roza mockear Mongoose") se resolvió con un enfoque que no mockea Mongoose en
    ningún momento: `tests/integration/db.conf.test.js` (2 casos) llama a la función real
    `connectDB()` — no a `mongoose.connect` directo como hace el helper de los demás tests de
    integración — contra un `mongodb-memory-server` real en el happy path, y con una URI
    sintácticamente inválida (rechazo casi instantáneo por fallo de parseo, no timeout de red) en
    el negativo. Lo único espiado es `process.exit` (`vi.spyOn`), y solo para evitar que el
    proceso del test runner termine — no es un mock de Mongoose, es la técnica estándar e
    inevitable para probar código que llama a `process.exit`. Resultado: 100% de cobertura real
    en las 8 líneas del archivo. Delegado a `backend-tester`, verificado de forma independiente
    (se leyó el archivo completo, se corrió `npm test` de forma independiente: `107/107`, y se
    regeneró `npm run test:coverage` para confirmar el 100% real).
  - **Objetivo de cobertura explícito:** definido como filosofía, no como número — este proyecto
    ya había demostrado en la práctica (`TEST_PLAN.md`: "el 12% no es el criterio de calidad") que
    perseguir un `%` global no es el criterio correcto. El objetivo real, documentado en
    [docs/testing.md](../docs/testing.md): 100% en modelos/middlewares (ya logrado, unidades
    pequeñas y cerradas); cada rama de estado/error real en controllers/routes con suite de
    integración (no un `%` de statements); recursos sin integración (`address`/`paymentMethod`/
    `order`/`wishlist`/`user`) quedan verificados solo por curl, brecha consciente documentada,
    no un olvido; frontend con lógica real, happy+negativo por regla; frontend de presentación
    pura, solo happy.
  - **`docs/testing.md` escrito:** documento nuevo, capa de arriba sobre `TEST_PLAN.md` — runners,
    comandos, convenciones innegociables (nunca mockear Mongoose/axios), estado real de ambas
    suites, la filosofía de cobertura de arriba, qué queda explícitamente fuera de alcance
    (E2E, integración de los 5 recursos restantes, gate de CI, carga), y una nota aclarando que
    `docs/test-plans/README.md` describe un proceso (un archivo de plan por spec) que en la
    práctica nunca se adoptó — `TEST_PLAN.md` es la fuente de verdad real, igual que
    `docs/backlog.md` reemplazó a `PENDIENTES.md`.
  `vitest.config.js` y `T-03` (`npm test`/`test:watch`/`test:coverage`) ya estaban, ver más abajo.
  **Con esto, `T-01` queda cerrado y la épica `E6` (suite de tests) queda completa: 107 tests de
  backend + 301 de frontend = 408 tests reales en todo el monorepo, arrancando desde cero.**
  **Actualización 2026-08-27 (`T-05`):** se extendió la integración de backend a los 5 recursos
  que quedaban fuera de `T-04` — total actual: 158 backend + 302 frontend = 460 tests reales.
- **T-02 (tests frontend) — EN PROGRESO desde 2026-08-26: planificación hecha, Prioridad ALTA
  hecha, MEDIA/BAJA pendientes.** Plan completo delegado a `test-planner` (scope explícito: solo
  `ecommerce-app/src/`, sin tocar el plan de backend ya existente), agregado como sección
  "Frontend" de [TEST_PLAN.md](../TEST_PLAN.md) (ALTA: `apiClient`, `AuthContext`/`CartContext`/
  `ThemeContext`, `ProtectedRoute`, formularios de login/registro, servicios; MEDIA: páginas y
  componentes con lógica real; BAJA: presentación pura).
  **Prioridad ALTA cerrada el mismo día, delegada a `frontend-tester`:** instaló `msw@1.3.2`
  (única devDependency nueva — se descartó `msw@2.x` por incompatibilidades reales con el
  toolchain fijo del repo, CRA5/Jest 27/jsdom 16, detalle completo en
  [TEST_PLAN.md](../TEST_PLAN.md#frontend--ecommerce-app)) y escribió 111 tests en 17 archivos
  (los 17 módulos ALTA: `apiClient`, `utils/auth`, los 3 Context, `ProtectedRoute`,
  `LoginForm`/`RegisterForm`, y los 9 servicios). **Verificado de forma independiente al reporte
  del agente:** se revisó el diff completo (`git status` — solo `package.json`/`package-lock.json`
  con `msw` + un `moduleNameMapper` de Jest, `setupTests.js`, `src/mocks/server.js` y los 17
  archivos `*.test.js(x)`, ningún archivo de producción tocado), se leyeron a fondo
  `LoginForm.test.jsx`, `RegisterForm.test.jsx`, `CartContext.test.jsx`, `ProtectedRoute.test.jsx`
  y `apiClient.test.js`, y se corrió `CI=true npm test` de forma independiente:
  `17 passed, 111 passed`. Los tests de `LoginForm`/`RegisterForm` ejercitan explícitamente el
  comportamiento ya corregido de `B-11`/`B-12` (password incorrecto → "Email o contraseña
  incorrectos"; email duplicado → "Este email ya está registrado") y ambos pasan. Dos casos del
  plan quedaron documentados como no automatizables con este stack (comentarios en el código
  citando la causa técnica exacta, no omitidos en silencio) — detalle en TEST_PLAN.md.
  **Segunda tanda, Prioridad MEDIA (flujo de compra) — cerrada 2026-08-26:** delegada a
  `frontend-tester`, cubre `ProductCard`, `ProductDetails`, `CategoryProducts`, `Home`,
  `SearchResultsList`, `Cart`, `CartView`, `Checkout`, `Orders`, `WishList` y
  `OrderConfirmation` — 80 tests nuevos en 11 archivos, siguiendo las convenciones ya
  establecidas en la tanda ALTA (mismo helper `makeToken`, mismos handlers `rest.*` de
  `msw@1.3.2`). **Hallazgo real nuevo, verificado y cerrado el mismo día como `B-14`:**
  `Button.jsx` (`components/common/`) no reenviaba props extra al `<button>` real — sin
  `{...rest}`, cualquier `title` pasado por un consumidor se perdía en silencio. Afecta tooltips
  reales en `Cart.jsx` ("Agrega productos al carrito para continuar" / "Proceder al pago"),
  `Checkout.jsx` ("Selecciona una dirección de envío" / "Selecciona un método de pago") y
  `CartView.jsx` ("Eliminar artículo"). El agente escribió los tests de `Checkout`/`CartView`
  documentando el comportamiento (entonces) real sin `title`, en vez de afirmar el atributo
  inexistente — se corrigió el mismo día (ver entrada `B-14` abajo) y se actualizaron esos dos
  tests para verificar el comportamiento correcto. Verificado de forma independiente: diff
  revisado (solo los 11 archivos `*.test.jsx`/`*.test.js` nuevos, cero producción tocada por el
  agente), y `CI=true npm test` corrido de forma independiente tras el fix de `B-14`:
  `28 passed, 191 passed`.
  **Tercera tanda, resto de Prioridad MEDIA (cuenta, navegación, checkout sub-forms, routing) —
  cerrada 2026-08-26:** delegada a `frontend-tester`, cubre `Setttings`, `Profile`,
  `ProfileCard`, `Navigation`, `Header`, `Breadcrumb`, `AddressForm`, `PaymentForm`,
  `AddressList`, `PaymentList`, `SummarySection`, `RegisterErrorMessage`, `App.jsx` (routing
  completo) y los 5 wrappers delgados (`Login`/`Register`/`Product`/`CategoryPage`/
  `SearchResults`) — 18 archivos nuevos, 89 tests, mismas convenciones que las tandas anteriores.
  `App.jsx` crea su propio `BrowserRouter` (no acepta uno inyectado), así que sus tests controlan
  la ruta inicial con `window.history.pushState` antes de cada render — patrón nuevo documentado
  ahí mismo, no en `TEST_PLAN.md` porque es un detalle de implementación del test, no del
  comportamiento probado. **Hallazgo investigado y descartado como no-bug reachable:**
  `ProfileCard.jsx` accede a `currentUser.role` (y otros campos) sin guardar contra
  `currentUser` nulo cuando no se pasa `userProp` — pero `AuthContext` deriva
  `isAuthenticated: !!user`, y el único caller real (`Profile.jsx`, detrás de `ProtectedRoute`)
  nunca renderiza `children` mientras `loading` es `true` ni si `isAuthenticated` es falso, así
  que por construcción `contextUser` ya es no-nulo si `ProfileCard` sin `userProp` llega a
  montar ahí. El test usa un `AuthGate` que replica exactamente esa guarda para ejercitar el
  caso del plan de forma realista, sin tocar `ProfileCard.jsx` ni abrir un item de backlog nuevo
  — no hay bug real, solo ausencia de una guarda defensiva en un camino inalcanzable. Dos casos
  ("campos requeridos" en `AddressForm`/`PaymentForm`) quedaron documentados como no
  automatizables: jsdom 16.7 no implementa la API de validación de restricciones HTML
  (`required` no bloquea `submit` en este entorno). Verificado de forma independiente: diff
  revisado (solo los 18 archivos `*.test.jsx` nuevos, cero producción tocada), `CI=true npm test`
  corrido de forma independiente: `46 passed, 280 passed`, y build de producción confirmado
  limpio. Con esto, Prioridad MEDIA de `T-02` queda completa — solo falta BAJA (componentes de
  presentación pura) para cerrar `T-02` del todo.
  **Cuarta y última tanda, Prioridad BAJA — CERRADA 2026-08-27, `T-02` completo:** delegada a
  `frontend-tester` (se interrumpió una vez por límite de sesión tras escribir solo
  `Button.test.jsx` — verificado que ese archivo quedó completo y en verde antes de relanzar el
  resto). Cubre `Input`, `Badge`, `Loading`, `ErrorMessage`, `Icon`, `AddressItem`, `PaymentItem`,
  `Footer` y `Layout` — 9 archivos nuevos, 18 tests, más los 3 de `Button.test.jsx` ya escritos =
  21 tests de esta tanda. La mayoría no necesitó MSW (componentes sin llamadas a la API);
  `Layout.test.jsx` sí, porque `Header`→`Navigation` dispara `GET /api/categories` al montar,
  mismo patrón ya usado en `Header.test.jsx`/`Navigation.test.jsx`. **Discrepancia real
  encontrada vs. el texto del plan, documentada y no un bug:** `Icon.jsx`
  (`icons[name] || icons.user`) no deja de renderizar nada ante un `name` desconocido como decía
  `TEST_PLAN.md` — cae al ícono `user` por defecto (comportamiento defensivo intencional, evita
  un hueco visual en blanco). El test se escribió contra el comportamiento real observado, no
  contra la redacción original del plan. `List.jsx`/`BannerCarousel.jsx` quedaron fuera de
  alcance de esta tanda (deferred, no forman parte del cierre de `T-02`). **Verificado de forma
  independiente al reporte del agente:** diff revisado (solo los 10 archivos `*.test.jsx` nuevos
  entre ambos intentos, cero producción tocada), lectura del hallazgo de `Icon.jsx` confirmada
  contra el código fuente real, `CI=true npm test` corrido de forma independiente:
  `56 passed, 301 passed`, y build de producción (`react-scripts build`) confirmado limpio.
  **`T-02` queda cerrado por completo** (301 tests de frontend + 105 de backend = 406 tests
  reales en todo el monorepo).
  **Hallazgo real de `test-planner` (leyendo código, no corriendo tests) — verificado y cerrado
  el mismo día como `B-11`/`B-12`/`B-13`, antes de que se escriba ningún test:** tres bugs reales
  en el manejo de errores de auth y en la confirmación de orden. Ver el detalle completo a
  continuación.
- **B-11/B-12/B-13 (bugs de manejo de errores frontend) — CERRADOS 2026-08-26:**
  - **B-11 (`LoginForm.jsx`):** `handleLoginError` solo reconocía `kind === 'CLIENT_ERROR' &&
    status === 400`, pero el backend real responde **401** en credenciales inválidas
    (`kind: 'UNAUTHORIZED'`, ver `.claude/api-routes.md`). Una contraseña incorrecta caía al
    fallback genérico de `RegisterErrorMessage.jsx` ("Ocurrió un error inesperado... no es
    necesario reportarlo") en vez de "Email o contraseña incorrectos" — el error más común de
    login mostraba el mensaje menos útil posible. Fix: rama explícita para `kind === 'UNAUTHORIZED'`.
  - **B-12 (`RegisterForm.jsx`):** el backend responde 422 `{message:"User already exist"}` (sin
    array `errors`) en email duplicado; `apiClient`'s `classifyError` traduce eso a
    `kind:"VALIDATION"` con `fields: undefined`. Ninguna de las dos ramas que tenía
    `handleRegisterError` (`CLIENT_ERROR`+400, o `VALIDATION`+`fields` truthy) lo capturaba —
    el registro fallaba **en silencio total**: el botón dejaba de cargar y no aparecía ningún
    mensaje, dejando al usuario sin saber qué pasó. Lo mismo ocurría con errores de red/timeout/
    servidor (ningún `kind` de esos seteaba `errorKind`). Fix: se movió el chequeo del mensaje del
    backend (`"User already exist"`) al principio, independiente del `kind`, y se agregó
    `setErrorKind(kind)` como fallback final para que cualquier error no capturado por las ramas
    específicas sí muestre algo vía `RegisterErrorMessage`.
  - **B-13 (`OrderConfirmation.jsx`):** el componente leía `order.address` (y varios campos más)
    **síncronamente durante el render**, antes de que el `useEffect` que redirige a `/` cuando no
    hay `order` llegara a ejecutarse. Entrar a `/order-confirmation` sin haber pasado por el
    `navigate(..., {state})` real del checkout — URL escrita a mano, un bookmark, o un link
    viejo/compartido — lanzaba `TypeError: Cannot read properties of undefined (reading
    'address')` en vez de redirigir silenciosamente. Fix: guarda `if (!order) return null;`
    inmediatamente después del `useEffect`. **Corrección posterior (encontrada al escribir
    `E2E-01`):** recargar la página (F5) sobre `/order-confirmation` **no** dispara este bug —
    el History API del navegador conserva `location.state` de la misma entrada de historial a
    través de un reload real, verificado en vivo con Playwright. La descripción original de este
    hallazgo mencionaba "recarga de página" como disparador; no lo es. El caso real sigue siendo
    válido (navegación fresca sin pasar por el checkout), solo se corrigió la redacción.
  - **Verificado con Playwright en los tres casos, contra un backend/frontend recién levantados:**
    login con password incorrecto contra `user1@test.com` real → "Email o contraseña incorrectos";
    registro con `user1@test.com` (ya existente) → "Este email ya está registrado" junto al campo
    email; navegar a `/order-confirmation` sin `state` → redirige a `/` sin ningún error de
    página (`page.on('pageerror')` sin eventos). Cierran `B-11`/`B-12`/`B-13` de este backlog.
- **B-14 (`Button.jsx` no reenvía props extra) — CERRADO 2026-08-26, encontrado por
  `frontend-tester` al escribir tests de `T-02`:** `components/common/Button/Button.jsx`
  desestructuraba explícitamente `children`/`onClick`/`type`/`disabled`/`variant`/`size`/
  `className` y renderizaba un `<button>` con exactamente esas props, sin `{...rest}` ni manejo
  explícito de `title` — cualquier otra prop (`title`, `aria-*`, `data-*`) que un consumidor le
  pasara se perdía en silencio, sin error ni warning. Confirmado con un test real
  (`render(<Button title="x">...</Button>)` → `getAttribute("title")` daba `null`). Impacto real
  verificado: `Cart.jsx` y `Checkout.jsx` usan `title` para explicar por qué el botón de pago está
  deshabilitado ("Agrega productos al carrito para continuar", "Selecciona una dirección de
  envío", "Selecciona un método de pago"), y `CartView.jsx` lo usa en el botón de eliminar
  ("Eliminar artículo") — los tres tooltips nunca llegaban al DOM. Fix: se agregó `...rest` a la
  desestructuración y al `<button>` renderizado, mismo patrón que ya usa el componente hermano
  `Input.jsx` (`{...rest}` en el `<input>`) — no una convención nueva, sino aplicar la que ya
  existía en el resto de `components/common/`. Se actualizaron los dos tests que documentaban el
  comportamiento roto (`Checkout.test.jsx`, `CartView.test.jsx`) para verificar ahora el
  comportamiento correcto. Verificado: `npm test` del frontend en 191/191 tras el fix, y build de
  producción (`react-scripts build`) limpio. Cierra `B-14` de este backlog.
- **E2E-01 (Cypress) — EN PROGRESO desde 2026-08-27, especificado y verificado por método
  alternativo, runner real bloqueado en esta máquina:** se instaló `cypress@15.21.1` +
  `@testing-library/cypress@10.1.3` + `start-server-and-test@3.0.12` en `ecommerce-app/`, se
  configuró `cypress.config.js` (baseUrl, env con overrides por variable de entorno, video/
  screenshot en fallos, retries) y se escribieron las 3 specs completas pedidas:
  `cypress/e2e/auth/register.cy.js` (6 casos: render, campos obligatorios, email inválido,
  contraseñas distintas, éxito, email duplicado), `cypress/e2e/auth/login.cy.js` (8 casos:
  render, 3 validaciones nativas HTML5, credenciales incorrectas, éxito, persistencia de sesión,
  protección de rutas) y `cypress/e2e/checkout/checkout.cy.js` (los 4 bloques funcionales reales
  del checkout de esta app — no un wizard de 4 pasos genérico, ver `docs/testing.md`). Se
  implementaron `cy.loginByApi()` (login real por API, cachea con `cy.session()`, escribe el JWT
  en `localStorage["authToken"]` — este backend no usa cookies) y `cy.addProductToCart()` (usa la
  interfaz real, toma el primer producto real del catálogo, nunca un id fijo).
  **No se usaron fixtures estáticos** (`users.json`/`products.json`): un producto con id fijo
  dejaría de existir tras un reset del seed, y el registro no puede reusar un email fijo —
  decisión documentada en `docs/testing.md`, no un olvido de la estructura sugerida.
  **Tres hallazgos reales encontrados al escribir y verificar las specs, corregidos antes de
  darlas por buenas:**
  1. El carrito de un usuario con sesión es híbrido (`localStorage` + servidor) — limpiar solo
     `localStorage` entre tests no alcanza, hay que vaciar también el carrito real del servidor
     (`DELETE /api/cart`) o los tests heredan ítems de corridas anteriores.
  2. Si el usuario de prueba ya tiene una dirección/método de pago (de una corrida anterior o del
     seed), `Checkout.jsx` los auto-selecciona y colapsa esa sección — hay que pulsar "Cambiar"
     primero. Se agregó un helper `ensureSectionExpanded()` en la spec en vez de asumir un estado
     inicial fijo.
  3. La nota original de `B-13` decía que "recargar la página" podía disparar ese bug — falso,
     verificado en vivo: el History API conserva `location.state` a través de un reload real. Se
     corrigió la redacción de `B-13` (ver su entrada arriba) y la aserción de la spec para probar
     el caso real (una navegación fresca sin pasar por el checkout, no un reload).
  **Hallazgo nuevo, cerrado el mismo día como `B-15`:** al escribir el caso de "prevención de
  doble clic" se confirmó que `Checkout.jsx` no tenía ninguna bandera de "enviando" — el botón
  "Confirmar y Pagar" seguía habilitado mientras la petición estaba en curso, así que un doble
  clic real podía disparar dos `POST /api/orders`. Fix: se agregó el estado `isSubmittingOrder`,
  deshabilita el botón y cambia su texto a "Procesando..." desde el inicio de
  `handleCreateOrder`, antes del `await` a la API. Se agregó una prueba unitaria de regresión en
  `Checkout.test.jsx` (simula la petición con `ctx.delay`, hace dos clicks, confirma una sola
  petición) además de cubrirlo en la spec E2E real.
  **Cypress no pudo ejecutarse en esta máquina de desarrollo** — el binario
  (`Cypress.exe`, reinstalado limpio, firma Authenticode válida, `resources/app` completo) falla
  su propio smoke test interno con `bad option: --smoke-test`, un error atípico de Electron que
  sugiere una restricción de seguridad del sistema operativo, no un problema del proyecto. Se
  agotaron los pasos de diagnóstico seguros (reinstalación, `cypress verify`, verificación de
  firma, `Unblock-File`) sin resolverlo; no se intentó nada más invasivo sin autorización.
  **Verificación alternativa realizada:** cada flujo de las 3 specs se ejecutó de punta a punta
  contra el backend/frontend reales con Playwright, replicando las mismas aserciones — así se
  encontraron los 3 hallazgos de arriba y `B-15`. No sustituye correr las specs reales con el
  runner de Cypress; detalle completo, incluyendo la tabla de `data-testid` agregados y las
  recomendaciones de CI, en [docs/testing.md](../docs/testing.md#e2e-con-cypress-ecommerce-appcypress).
  **Próximo paso:** correr `npm run test:e2e` en una máquina donde el binario de Cypress sí
  inicie.
- **CI-01 (CI/CD completo): cerrado (2026-08-27).** `.github/workflows/ci-cd.yml` tiene tres jobs,
  los tres confirmados en verde en un run real de GitHub Actions
  ([33068441727](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/actions/runs/33068441727)):
  `test-api` (lint + `npm run test:coverage`, sin Mongo real porque usa `mongodb-memory-server`),
  `test-app` (lint + `npm test -- --coverage --watchAll=false` + build) y `e2e` (Mongo real como
  *service container*, `npm run seed`, API en background, y `cypress-io/github-action@v6`
  corriendo las 20 specs reales, con video/screenshots subidos como artifact solo si falla). El
  lint se agregó con ESLint en ambos paquetes: `ecommerce-app` ya tenía `eslint-config-react-app`
  disponible vía `react-scripts`, solo faltaba fijarlo como devDependency directa y el script;
  `ecommerce-api` no tenía nada, se armó `eslint.config.js` (flat config, ESM) desde cero. Prettier
  no se agregó — no hacía falta para que el lint gatee el CI. Detalle completo en
  [docs/testing.md](../docs/testing.md#recomendaciones-para-cicd).
- **OBS-01 (Artillery):** el stack de Docker (Prometheus + Grafana + Pushgateway,
  `observability/`) ya está listo y funcional — falta instalar `artillery` + el plugin
  `publish-metrics` como devDependency en `ecommerce-api`, escribir el escenario de carga
  (`.yml`) contra los endpoints reales de `.claude/api-routes.md`, y agregar el script
  `npm run test:load`.
- **DEP-01 (Render):** requiere cuenta en Render y MongoDB Atlas para producción. Los *Deploy
  Hooks* se agregan como secrets de GitHub (`RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_APP`).
  Solo tiene sentido después de CI-01: sin el gate de calidad, un deploy automático no protege
  nada. Guía completa ya existe en `docs/render-deployment.md`.

## Contexto operativo

**Usuario admin de prueba** — ya existe, no hace falta crear uno nuevo. El seed
(`npm run seed`) crea 10 usuarios; el primero queda como `admin`. Verificado en vivo (login real
contra el backend corriendo, no solo lectura del seed):

| Email | Password | Rol |
|---|---|---|
| `user1@test.com` | `123456` | `admin` |

El resto (`user2@test.com` … `user10@test.com`, misma password) son `customer`. Desde que se
cerró S-02 (2026-08-26), este usuario admin **sí desbloquea** rutas reales: es el único que puede
`POST`/`PUT`/`DELETE` en `/api/products` y `/api/categories` — cualquier `customer` recibe 403.

## Orden de ejecución sugerido

1. ~~**E4 (seguridad del catálogo y de pagos)**~~ — S-01/S-02/S-03/S-04 cerrados 2026-08-26.
   Épica completa: catálogo protegido por rol, sin datos de tarjeta reales, CORS con allowlist.
2. ~~**E1 (persistencia de checkout)**~~ — F-01/F-02/F-03/A-01 cerrados 2026-08-26. Épica completa:
   dirección, pago y pedido corren de punta a punta sobre el backend real.
3. ~~**E2 (Wishlist)**~~ — F-04 cerrado 2026-08-26.
4. ~~**E3 (cuenta: Profile y Settings)**~~ — F-05/F-06 cerrados 2026-08-26. `B-04` queda
   completamente cerrado (ambas páginas, `WishList.jsx` y `Setttings.jsx`, implementadas).
5. ~~**E5 (bugs y limpieza restante)**~~ — `B-01` a `B-14` cerrados 2026-08-26, todos encontrados
   por trabajo real (auditoría inicial, o al hacer `T-04`/`T-02`) y cerrados el mismo día. Épica
   completa: sin páginas huérfanas, mensajes de error/carga silenciados, ramas de error sin
   manejar, ni props perdidas en componentes compartidos.
6. ~~**E6 (tests)**~~ — `REF-01`, `T-01`, `T-04`+`T-05` (158 tests backend, 9/9 recursos con
   integración) y `T-02` (302 tests frontend) cerrados 2026-08-26/27. Épica completa: 460 tests
   reales en todo el monorepo.
7. **E7 (E2E con Cypress)** — `E2E-01` especificado y verificado por método alternativo
   (Playwright) el 2026-08-27, incluyendo el fix de `B-15` que encontró. Solo falta correr el
   runner real de Cypress (bloqueado en la máquina de desarrollo actual, ver detalle en
   `E2E-01` y `docs/testing.md`).
8. **E8, E9, E10** — CI/CD, observabilidad y despliegue, en ese orden, sobre una base ya probada
   (CI-01 necesita ESLint/Prettier primero; DEP-01 depende de CI-01).

## Historial de auditoría documental

- **2026-08-26 — Auditoría completa de documentación existente.** Se revisó todo `.claude/`,
  `.agents/`, `docs/` y la raíz del repo, clasificando cada documento como vigente / desactualizado
  / obsoleto / duplicado. Resultado: ningún documento contradecía el código (el proyecto es joven
  y no había acumulado deuda documental), salvo un caso de redundancia real —
  `PENDIENTES.md` (raíz) vs. este backlog, una vez que dejó de estar vacío. Se decidió consolidar
  en un único documento en vez de mantener dos fuentes que podían divergir (principio
  *Single Source of Truth* del [SSDLC](../.claude/skills/workflow/SSDLC.md)).
- **2026-08-26 — Plan de limpieza ejecutado.** `PENDIENTES.md` se fusionó en este archivo (ver
  [Detalle de items](#detalle-de-items) y [Contexto operativo](#contexto-operativo)) y se
  eliminó del repo; `React + Express (1).code-profile` (artefacto de editor en la raíz, no era
  documentación del proyecto) también se eliminó. Ambos borrados quedan recuperables vía historial
  de git si hiciera falta.
- **Regla hacia adelante:** cualquier documento nuevo en `docs/` que se detecte redundante con
  otro ya existente se resuelve de la misma forma — se fusiona en el que sobrevive y se retira el
  otro, dejando la fecha y el motivo anotados acá, no se mantienen dos fuentes vivas en paralelo.

## Estado de cierre

_Backlog recién consolidado (2026-08-26) — ninguna épica iniciada todavía. Se actualizará esta
sección a medida que cada épica se cierre, siguiendo la Matriz de cierre del spec correspondiente
(ver [SSDLC.md](../.claude/skills/workflow/SSDLC.md))._
