# Matriz integral de pruebas — OSShirtEcommers

> Generada a partir de una auditoría real del código (2026-08-27), no de un plan aspiracional.
> Cada fila es un escenario de negocio real; las columnas Sí/No indican el **nivel recomendado**
> para ese escenario según la pirámide de pruebas (ver
> [strategy.md](strategy.md#pirámide-de-pruebas)) — no todos los escenarios necesitan probarse en
> los 4 niveles, y duplicar un escenario ya cubierto en unitario/integración dentro de Cypress es
> deliberadamente evitado. La columna **Estado** usa únicamente: Pendiente / En progreso /
> Implementado / Fallando / Bloqueado / No aplica.
>
> Esta matriz **no** enumera cada `it()` individual (hay 107 backend + 302 frontend + 20 E2E) —
> agrupa por escenario de negocio real. El detalle línea por línea de cada archivo de test está en
> el resultado de la auditoría (ver `docs/PROJECT_STATUS.md` y `docs/testing.md`).

| ID | Módulo | Escenario | Backend unitario | API integración | Frontend unitario | Frontend integración | E2E | Prioridad | Estado |
|---|---|---|---|---|---|---|---|---|---|
| AUTH-001 | Registro | Registro exitoso | No | Sí | Sí | Sí | Sí | Crítica | Implementado |
| AUTH-002 | Registro | Correo duplicado | No | Sí | Sí | Sí | Sí | Alta | Implementado |
| AUTH-003 | Registro | Campos requeridos vacíos | No | No | Sí | No | Sí | Media | Implementado |
| AUTH-004 | Login | Login exitoso + token | No | Sí | Sí | Sí | Sí | Crítica | Implementado |
| AUTH-005 | Login | Credenciales incorrectas | No | Sí | Sí | Sí | Sí | Alta | Implementado |
| AUTH-006 | Login | Email/password faltantes → 422 | No | Sí | No | No | No | Media | Implementado |
| AUTH-007 | Login | Persistencia de sesión (reload) | No | No | No | Sí | Sí | Alta | Implementado |
| AUTH-008 | Autorización | `requireAuth` rechaza sin token/token inválido | Sí | Sí (indirecto, en cada recurso) | No | No | No | Crítica | Implementado |
| AUTH-009 | Autorización | `requireAdmin` rechaza rol no-admin | Sí | No | No | No | No | Alta | Implementado |
| AUTH-010 | Rutas protegidas | Redirección a `/login` sin sesión | No | No | Sí | No | Sí | Alta | Implementado |
| PROD-001 | Productos | Listado (paginación/filtros) | No | Sí | Sí | Sí | No | Alta | Implementado |
| PROD-002 | Productos | Detalle de producto | No | Sí | Sí | Sí | No | Alta | Implementado |
| PROD-003 | Productos | Creación requiere rol admin | No | Sí | No | No | No | Crítica | Implementado |
| PROD-004 | Productos | Slug duplicado → 422 | No | Sí | No | No | No | Media | Implementado |
| PROD-005 | Productos | Soft delete | No | Sí | No | No | No | Media | Implementado |
| PROD-006 | Productos | `/search` no tapada por `/:id` | No | Sí | No | No | No | Media | Implementado |
| CAT-001 | Categorías | CRUD con rol admin + jerarquía | No | Sí | Sí | No | No | Alta | Implementado |
| CART-001 | Carrito | Agregar producto | No | Sí | Sí | Sí | Sí | Crítica | Implementado |
| CART-002 | Carrito | Modificar cantidad | No | Sí | Sí | Sí | Sí | Alta | Implementado |
| CART-003 | Carrito | Eliminar producto | No | Sí | Sí | Sí | Sí | Alta | Implementado |
| CART-004 | Carrito | Cálculo de subtotal/total | No | Sí (vía `recalcTotal`) | Sí | Sí | Sí | Crítica | Implementado |
| CART-005 | Carrito | Aislamiento entre usuarios | No | Sí | No | No | No | Alta | Implementado |
| CART-006 | Carrito | Persistencia híbrida (localStorage + servidor) | No | No | No | Sí (`CartContext`) | No | Alta | Implementado |
| ADDR-001 | Direcciones | Crear dirección válida | No | Sí | Sí | Sí | Sí | Alta | Implementado |
| ADDR-002 | Direcciones | Campos requeridos vacíos → 422 | No | Sí | Sí | No | Sí | Media | Implementado |
| ADDR-003 | Direcciones | `isDefault` exclusivo (desmarca las demás) | No | Sí | No | No | No | Media | Implementado |
| ADDR-004 | Direcciones | Aislamiento entre usuarios (editar/borrar de otro) | No | Sí | No | No | No | Alta | Implementado |
| PAY-001 | Métodos de pago | Crear método válido (solo `last4`, nunca número completo) | No | Sí | Sí | Sí | Sí | Crítica | Implementado |
| PAY-002 | Métodos de pago | Rechazo de `cardNumber`/`cvv` en el request (S-03) | No | Sí | No | No | No | Crítica | Implementado |
| PAY-003 | Métodos de pago | `isDefault` exclusivo | No | Sí | No | No | No | Media | Implementado |
| PAY-004 | Métodos de pago | Tipo fuera del enum → 422 | No | Sí | No | No | No | Media | Implementado |
| ORD-001 | Órdenes | Crear orden con carrito válido | No | Sí | Sí | Sí | Sí | Crítica | Implementado |
| ORD-002 | Órdenes | Cálculo de totales (IVA 16%, envío $350/gratis ≥$1000) | No | Sí | Sí | No | Sí | Crítica | Implementado |
| ORD-003 | Órdenes | Carrito vacío → 422 | No | Sí | Sí | No | Sí | Alta | Implementado |
| ORD-004 | Órdenes | Dirección/método de pago inexistente o de otro usuario → 404 | No | Sí | No | No | No | Alta | Implementado |
| ORD-005 | Órdenes | Vaciar carrito tras crear la orden | No | Sí | No | Sí | Sí | Alta | Implementado |
| ORD-006 | Órdenes | Doble clic no crea dos órdenes (B-15) | No | No | No | Sí (regresión) | Sí | Alta | Implementado |
| ORD-007 | Órdenes | `GET /orders` solo devuelve las del usuario autenticado | No | Sí | No | No | No | Alta | Implementado |
| WISH-001 | Wishlist | Agregar producto | No | Sí | Sí | No | No | Media | Implementado |
| WISH-002 | Wishlist | Agregar el mismo producto dos veces no duplica | No | Sí | No | No | No | Media | Implementado |
| WISH-003 | Wishlist | Quitar producto | No | Sí | Sí | No | No | Media | Implementado |
| USER-001 | Perfil | Ver perfil (sin exponer password) | No | Sí | Sí | No | No | Alta | Implementado |
| USER-002 | Perfil | Actualizar email a uno ya usado → 422 | No | Sí | No | No | No | Media | Implementado |
| USER-003 | Perfil | Cambiar contraseña con `currentPassword` incorrecto → 401 | No | Sí | No | No | No | Alta | Implementado |
| USER-004 | Perfil | Cambiar contraseña exitoso (login con la nueva funciona) | No | Sí | No | No | No | Media | Implementado |
| SEC-001 | Seguridad | CORS: origen fuera de la allowlist es rechazado | No | No | No | No | No | Media | Pendiente |
| SEC-002 | Seguridad | Error handler: rama `ValidationError`/500 genérico | No | No | No | No | No | Baja | Pendiente |
| INV-001 | Inventario/Stock | Prevenir compra sin stock suficiente | No aplica | No aplica | No aplica | No aplica | No aplica | — | **No aplica — la regla no existe en el código** (`stock` es solo un badge de UI, nunca se valida en `cart`/`order`) |
| DISC-001 | Descuentos | Aplicar descuento a un producto | No aplica | No aplica | No aplica | No aplica | No aplica | — | **No aplica — `product.discount` no existe en el modelo real**, solo se renderiza si se pasa manualmente como prop en un test |

## Notas de la matriz

- **Implementado** (ADDR/PAY/ORD/WISH/USER, backend, 2026-08-27): 51 casos nuevos de integración
  agregados a partir de esta auditoría (`address.test.js`, `paymentMethod.test.js`,
  `order.test.js`, `wishlist.test.js`, `user.test.js`, + 3 casos de `requireAdmin` + 1 caso de
  login) — confirmados con `npm test` real: **158/158 en verde**. Ningún comportamiento real
  difirió de lo documentado en esta matriz.
- **Implementado** (columna E2E, todas las filas con Cypress, 2026-08-27): las 20 specs corrieron
  con el runner real de Cypress en GitHub Actions (Ubuntu) — **20/20 en verde**
  ([run 33061741394](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/actions/runs/33061741394)).
  En el camino se encontraron y corrigieron `B-16` (race condition real en `CartContext`) y 2
  selectores propios ambiguos — ver [known-issues.md](known-issues.md).
- `INV-001`/`DISC-001` se dejan en la matriz a propósito, marcadas **No aplica**, para que quede
  registrado que se investigaron y no se inventó una prueba de algo inexistente — no para que se
  implementen sin que exista la funcionalidad primero.
- `SEC-001`/`SEC-002` son de prioridad baja/media y quedan **Pendiente** — no bloquean ningún
  flujo de negocio, se dejan documentadas para trabajo futuro.
