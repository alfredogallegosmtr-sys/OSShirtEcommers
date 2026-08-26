# Mapa de rutas API

Todas bajo el prefijo `/api`. Auth: **público** = sin auth; **auth** = `requireAuth`
(middleware que valida `Authorization: Bearer <token>` con `JWT_SECRET`); **admin** =
`requireAuth` + `requireAdmin` (exige `req.user.role === "admin"`, 403 si no).

> `requireAdmin` (`src/middlewares/auth.middleware.js`) solo protege hoy la escritura de
> `products`/`categories` (ver tablas abajo) — no existe en ninguna otra ruta.

## Auth (`/api/auth`)
| Método | Path | Auth | Validador | Notas |
|---|---|---|---|---|
| POST | /api/auth/register | público | — (chequeo manual inline) | 422 si faltan campos o el email ya existe (`"User already exist"`) |
| POST | /api/auth/login | público | — (chequeo manual inline) | 401 en credenciales inválidas |

## Products (`/api/products`)
| Método | Path | Auth | Validador | Notas |
|---|---|---|---|---|
| GET | /api/products/search | público | — | filtros: `q, category, minPrice, maxPrice, inStock, sort, order, page, limit` |
| GET | /api/products | público | — | lista completa (sin paginar), `populate("category")` |
| GET | /api/products/:id | público | `productIdValidation` | 422 si el id no es ObjectId; 404 si no existe o `is_deleted` |
| POST | /api/products | admin | `createProductValidation` | crea producto |
| PUT | /api/products/:id | admin | `updateProductValidation` | actualiza |
| DELETE | /api/products/:id | admin | `productIdValidation` | soft-delete (`is_deleted: true`) |

## Categories (`/api/categories`)
| Método | Path | Auth | Validador | Notas |
|---|---|---|---|---|
| GET | /api/categories | público | — | lista todas (raíz + subcategorías) |
| GET | /api/categories/:id | público | `categoryIdValidation` | — |
| GET | /api/categories/:id/products | público | `categoryIdValidation` | productos de esa categoría + sus hijas |
| POST | /api/categories | admin | `createCategoryValidation` | crea categoría |
| PUT | /api/categories/:id | admin | `updateCategoryValidation` | actualiza |
| DELETE | /api/categories/:id | admin | `categoryIdValidation` | borra (hard delete) |

## Cart (`/api/cart`)
| Método | Path | Auth | Validador | Notas |
|---|---|---|---|---|
| GET | /api/cart | auth | — | trae o crea el carrito del usuario logueado |
| POST | /api/cart | auth | `addItemValidation` | body `{ productId, quantity }`; suma cantidad si ya existe |
| PATCH | /api/cart/:itemId | auth | `updateQuantityValidation` | body `{ quantity }`; `itemId` es el `_id` del subdocumento en `Cart.products`, no el `productId` |
| DELETE | /api/cart/:itemId | auth | `itemIdValidation` | quita un ítem |
| DELETE | /api/cart | auth | — | vacía el carrito |

Detalle de cada validador (reglas exactas) en [validators.md](validators.md). El orden en las
rutas de `cart` es siempre `requireAuth → <validador> → validate → controller` (sin token, da
401 antes de llegar a la validación). En `products`/`categories` (solo escritura), el orden es
`requireAuth → requireAdmin → <validador> → validate → controller` (403 si el token es válido
pero el rol no es `admin`).

Respuesta estándar del carrito: `{ items: [{ id, quantity, product }], total }` — `product`
siempre viene poblado.

## Addresses (`/api/addresses`)
| Método | Path | Auth | Validador | Notas |
|---|---|---|---|---|
| GET | /api/addresses | auth | — | lista las direcciones del usuario logueado, `createdAt` desc |
| POST | /api/addresses | auth | `createAddressValidation` | `isDefault:true` desmarca las demás direcciones del usuario |
| PUT | /api/addresses/:id | auth | `updateAddressValidation` | 404 si el id no es del usuario logueado (no expone que existe) |
| DELETE | /api/addresses/:id | auth | `addressIdValidation` | hard delete, 404 si no es del usuario logueado |

Igual que en `cart`, todo el router pasa por `router.use(requireAuth)`. Contrato completo
(shapes, reglas de negocio) en [docs/contracts/address.md](../docs/contracts/address.md).

## Payment Methods (`/api/payment-methods`)
| Método | Path | Auth | Validador | Notas |
|---|---|---|---|---|
| GET | /api/payment-methods | auth | — | lista los métodos de pago del usuario logueado |
| POST | /api/payment-methods | auth | `createPaymentMethodValidation` | rechaza `cardNumber`/`cvv` explícitamente (422); `isDefault:true` desmarca los demás |
| PUT | /api/payment-methods/:id | auth | `updatePaymentMethodValidation` | mismo rechazo de `cardNumber`/`cvv`; 404 si no es del usuario logueado |
| DELETE | /api/payment-methods/:id | auth | `paymentMethodIdValidation` | hard delete, 404 si no es del usuario logueado |

Mismo esquema que `address.routes.js` (todo bajo `requireAuth`, scoped a `req.user.id`).
Contrato completo en [docs/contracts/payment-method.md](../docs/contracts/payment-method.md).

## Fuera de `/api`
- `GET /` → `"API Ecommerce with MongoDB"` (texto plano).
- `GET /img/products/:file` → estático, sirve `ecommerce-api/public/img/products/`.
- Sin catch-all 404 explícito: Express responde el 404 default.

## Modelos sin rutas todavía

`Order`, `WishList` tienen modelo Mongoose (`src/models/`) pero **ningún controller ni router**.
`Address` (2026-08-26, F-01) y `PaymentMethod` (2026-08-26, F-02) ya tienen controller + router.
Antes de asumir que existe un endpoint, verificar `src/routes/` — hoy hay `product.routes.js`,
`category.routes.js`, `auth.routes.js`, `cart.routes.js`, `address.routes.js`,
`paymentMethod.routes.js`.
