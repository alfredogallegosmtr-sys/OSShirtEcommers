# Mapa de rutas API

Todas bajo el prefijo `/api`. Auth: **público** = sin auth; **auth** = `requireAuth`
(middleware que valida `Authorization: Bearer <token>` con `JWT_SECRET`).

> No hay rol `admin` implementado todavía (el modelo `User` tiene el campo `role`, pero
> ningún middleware lo exige). No confundir con el `.claude/api-routes.md` de otros
> proyectos de referencia: aquí no existe `isAdmin`.

## Auth (`/api/auth`)
| Método | Path | Auth | Notas |
|---|---|---|---|
| POST | /api/auth/register | público | 422 si faltan campos o el email ya existe (`"User already exist"`) |
| POST | /api/auth/login | público | 401 en credenciales inválidas |

## Products (`/api/products`)
| Método | Path | Auth | Notas |
|---|---|---|---|
| GET | /api/products/search | público | filtros: `q, category, minPrice, maxPrice, inStock, sort, order, page, limit` |
| GET | /api/products | público | lista completa (sin paginar), `populate("category")` |
| GET | /api/products/:id | público | 404 si no existe o `is_deleted` |
| POST | /api/products | público (**sin proteger**) | crea producto |
| PUT | /api/products/:id | público (**sin proteger**) | actualiza |
| DELETE | /api/products/:id | público (**sin proteger**) | soft-delete (`is_deleted: true`) |

## Categories (`/api/categories`)
| Método | Path | Auth | Notas |
|---|---|---|---|
| GET | /api/categories | público | lista todas (raíz + subcategorías) |
| GET | /api/categories/:id | público | — |
| GET | /api/categories/:id/products | público | productos de esa categoría + sus hijas |
| POST | /api/categories | público (**sin proteger**) | crea categoría |
| PUT | /api/categories/:id | público (**sin proteger**) | actualiza |
| DELETE | /api/categories/:id | público (**sin proteger**) | borra (hard delete) |

## Cart (`/api/cart`)
| Método | Path | Auth | Notas |
|---|---|---|---|
| GET | /api/cart | auth | trae o crea el carrito del usuario logueado |
| POST | /api/cart | auth | body `{ productId, quantity }`; suma cantidad si ya existe |
| PATCH | /api/cart/:itemId | auth | body `{ quantity }`; `itemId` es el `_id` del subdocumento en `Cart.products`, no el `productId` |
| DELETE | /api/cart/:itemId | auth | quita un ítem |
| DELETE | /api/cart | auth | vacía el carrito |

Respuesta estándar del carrito: `{ items: [{ id, quantity, product }], total }` — `product`
siempre viene poblado.

## Fuera de `/api`
- `GET /` → `"API Ecommerce with MongoDB"` (texto plano).
- `GET /img/products/:file` → estático, sirve `ecommerce-api/public/img/products/`.
- Sin catch-all 404 explícito: Express responde el 404 default.

## Modelos sin rutas todavía

`Address`, `Order`, `PaymentMethod`, `WishList` tienen modelo Mongoose
(`src/models/`) pero **ningún controller ni router**. Antes de asumir que existe un
endpoint para ellos, verificar `src/routes/` — hoy solo hay `product.routes.js`,
`category.routes.js`, `auth.routes.js`, `cart.routes.js`.
