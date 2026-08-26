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

| ID | Épica | Spec |
|---|---|---|
| E1 | Persistencia real de checkout (direcciones, pagos, pedidos) | _(pendiente)_ |
| E2 | Wishlist funcional | _(pendiente)_ |
| E3 | Cuenta: Profile y Settings | _(pendiente)_ |
| E4 | Seguridad del catálogo y de pagos | _(pendiente)_ |
| E5 | Limpieza de bugs y código muerto detectados en la auditoría | _(pendiente)_ |
| E6 | Suite de tests (backend + frontend) | _(pendiente)_ |
| E7 | E2E con Cypress | _(pendiente)_ |
| E8 | CI/CD completo | _(pendiente)_ |
| E9 | Observability: carga con Artillery | _(pendiente)_ |
| E10 | Despliegue a Render | _(pendiente)_ |

## Tabla priorizada

| ID | Item | Épica | Tipo | Prioridad | Estado |
|---|---|---|---|---|---|
| S-01 | Proteger `POST/PUT/DELETE` de `products` y `categories` (hoy cualquiera sin sesión puede escribir) | E4 | Bug/Seguridad | **Crítico** | **Cerrado (2026-08-26)** |
| S-02 | Implementar middleware de rol admin (`isAdmin`) — no existe hoy | E4 | Feature faltante | **Crítico** | **Cerrado (2026-08-26)** |
| S-03 | Definir cómo se protegerá `cardNumber`/`cvv` de `PaymentMethod` (cifrado/tokenización) **antes** de exponerlo por API | E4 | Deuda/Seguridad | **Crítico** | **Cerrado (2026-08-26)** |
| B-01 | Fix `Breadcrumb`: prop `categories` vs `items` — no se renderiza nunca | E5 | Bug | **Alto** | **Cerrado (2026-08-26)** |
| B-04 | `WishList.jsx`/`Setttings.jsx` enrutadas pero vacías — pantalla en blanco para el usuario | E5 | Bug | **Alto** | Mitad cerrada (2026-08-26) — `WishList.jsx` listo, `Setttings.jsx` sigue pendiente (F-06) |
| F-01 | `addressService` real + endpoint `Address` conectado a checkout | E1 | Feature faltante | **Alto** | **Cerrado (2026-08-26)** |
| F-02 | `paymentMethodService` real + endpoint `PaymentMethod` conectado a checkout | E1 | Feature faltante | **Alto** | **Cerrado (2026-08-26)** |
| F-03 | `orderService` + endpoint `Order` — checkout crea pedido real, no `localStorage` | E1 | Feature faltante | **Alto** | **Cerrado (2026-08-26)** |
| A-01 | `Orders.jsx` lee `GET /orders` real en vez de `localStorage["orders"]` | E1 | Alineación FE-BE | **Alto** | **Cerrado (2026-08-26)** |
| F-04 | Wishlist: UI + `wishlistService` + endpoint conectado | E2 | Feature faltante | **Alto** | **Cerrado (2026-08-26)** |
| T-01 | Elegir runner de tests backend (Vitest/Jest) + `mongodb-memory-server`, correr `test-planner` | E6 | Deuda técnica | **Alto** | En progreso |
| T-03 | `npm test` no es invocable todavía: falta el script `"test": "vitest run"` en `ecommerce-api/package.json` (hoy solo se corre con `npx vitest run <archivo>`) | E6 | Deuda técnica | **Alto** | **Cerrado (2026-08-26)** |
| T-04 | Pruebas de integración de `ecommerce-api` (auth/cart/category/product vía supertest contra rutas reales) — bloqueado hasta hacer el split `app.js`/`server.js` (hoy `server.js` no exporta `app` sin efectos secundarios) e instalar `mongodb-memory-server`. Detalle completo del alcance bloqueado en [TEST_PLAN.md](../TEST_PLAN.md#fuera-de-este-alcance--integración-bloqueado) | E6 | Deuda técnica | **Alto** | Pendiente |
| S-04 | `cors()` sin allowlist — restringir orígenes antes de cualquier despliegue | E4 | Deuda/Seguridad | **Medio** | Pendiente |
| F-05 | Profile: `GET` real al backend en vez de derivar todo del JWT decodificado | E3 | Feature faltante | **Medio** | Pendiente |
| F-06 | Settings: definir alcance real (qué configura) e implementar UI | E3 | Feature faltante | **Medio** | Pendiente |
| B-02 | `pages/ProductDetails.jsx` — import roto a componente inexistente (huérfano, no enrutado) | E5 | Bug | **Medio** | Pendiente |
| B-06 | Rol fantasma `"cliente"` en `ProtectedRoute` (`/profile`) — no existe en `User.role` | E5 | Deuda técnica | **Medio** | **Cerrado (2026-08-26)** |
| DOC-01 | Escribir specs por épica en `docs/specs/` a medida que cada una arranque | E1–E10 | Documentación | **Medio** | Pendiente |
| DOC-02 | Crear `README.md` raíz (y/o por subproyecto) con setup, stack y comandos — hoy solo existe `CLAUDE.md`, pensado para el agente, no para un humano nuevo en el proyecto | — | Documentación | **Medio** | Pendiente |
| T-02 | Suite de tests frontend con Testing Library + MSW (`frontend-tester` ya está listo) | E6 | Deuda técnica | **Medio** | Pendiente |
| E2E-01 | Instalar Cypress + flujo crítico login→carrito→checkout (requiere F-03 primero) | E7 | Deuda técnica | **Medio** | Pendiente |
| CI-01 | Agregar lint + tests + gate de cobertura al workflow (hoy solo `npm ci` + build) | E8 | Deuda técnica | **Bajo** | Pendiente |
| B-03 | `pages/PurchaseOrder.jsx` — página huérfana con datos hardcodeados, sin ruta | E5 | Deuda técnica | **Bajo** | Pendiente |
| B-05 | `data/categories.json` — código muerto, contenido de otro dominio | E5 | Deuda técnica | **Bajo** | **Cerrado (2026-08-26)** |
| B-07 | Borrar `server_practice.js` / `db.config_practice.js` (0 bytes, scaffolding del curso) | E5 | Deuda técnica | **Bajo** | **Cerrado (2026-08-26)** |
| OBS-01 | Instalar Artillery + escenario de carga contra endpoints reales | E9 | Deuda técnica | **Bajo** | Pendiente |
| DEP-01 | Crear servicios en Render + Deploy Hooks como secrets de GitHub | E10 | Deuda técnica | **Bajo** | Pendiente |

## Detalle de items

Contexto adicional migrado desde `PENDIENTES.md`, necesario para arrancar cada item sin
re-descubrir el mismo terreno.

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
- **T-01 (tests backend) — EN PROGRESO desde 2026-08-26:** runner elegido: **Vitest** (soporte
  ESM nativo, sin flags de `--experimental-vm-modules` que sí necesitaría Jest en este repo
  `"type":"module"`). Ya instalado como devDependency en `ecommerce-api`. **Matriz completa y
  estado real en [TEST_PLAN.md](../TEST_PLAN.md)** (raíz del repo) — no se duplica aquí. Resumen:
  58 casos unitarios `Hecho` (2 middlewares + 6 modelos, sin DB real), corrida real
  `10 passed (10 files) / 58 passed (58 tests)`. **Pendiente real, no completado:** todas las
  pruebas de integración (controllers/rutas de auth/cart/category/product) — bloqueadas hasta
  hacer el refactor `app.js`/`server.js` (hoy `server.js` no exporta `app` sin efectos
  secundarios) e instalar `mongodb-memory-server`; cobertura de `db.conf.js` (aplazada, ver
  TEST_PLAN.md); objetivo de cobertura; `docs/testing.md`. `vitest.config.js` y T-03
  (`npm test`/`test:watch`/`test:coverage`) ya están, ver más abajo.
- **T-02 (tests frontend):** el agente `frontend-tester` (`.claude/agents/frontend-tester.md`) ya
  está listo; falta instalar `msw` como devDependency antes de que pueda correr.
- **E2E-01 (Cypress):** el proyecto de referencia usa un seed dedicado vía *task* de Cypress para
  datos de prueba, no el `npm run seed` normal — replicar ese patrón en vez de reusar el seed de
  producción. Escenario mínimo: login → agregar al carrito → checkout (depende de F-03 para
  tener un backend real de órdenes contra el cual probar).
- **CI-01 (CI/CD completo):** `.github/workflows/ci-cd.yml` hoy es la versión reducida (solo
  `npm ci` + build). Antes de agregar el job de lint hace falta configurar ESLint + Prettier en
  ambos paquetes — ningún `package.json` tiene hoy scripts `lint`/`format:check`. El workflow ya
  trae un comentario apuntando al patrón completo de
  `2026-2-ReactFS/.github/workflows/ci-cd.yml` para cuando toque ampliarlo.
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

1. ~~**E4 (seguridad del catálogo)**~~ — S-01/S-02/S-03 cerrados 2026-08-26. Solo queda **S-04**
   (`cors()` sin allowlist), prioridad Media, no bloquea nada más.
2. ~~**E1 (persistencia de checkout)**~~ — F-01/F-02/F-03/A-01 cerrados 2026-08-26. Épica completa:
   dirección, pago y pedido corren de punta a punta sobre el backend real.
3. ~~**E2 (Wishlist)**~~ — F-04 cerrado 2026-08-26. `B-04` queda con mitad pendiente (`Setttings.jsx`,
   ver E3).
4. **E3 (cuenta: Profile y Settings)** — `F-05`/`F-06` (ambos Medio), únicas features de páginas
   de usuario que faltan.
5. **E5 (bugs y limpieza restante)** — `B-02`/`B-03` (páginas huérfanas, Medio/Bajo).
5. **E6 + E7** (tests, E2E) — una vez estabilizada la persistencia, para no testear contra un
   contrato que va a cambiar.
6. **E8, E9, E10** — CI/CD, observabilidad y despliegue, en ese orden, sobre una base ya probada.

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
