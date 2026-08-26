# Arquitectura — OSShirtEcommers

> Refleja el estado **observable del código** al **2026-08-26**. Referencias completas:
> [.claude/api-routes.md](../.claude/api-routes.md), [.claude/models.md](../.claude/models.md),
> [.claude/code-patterns.md](../.claude/code-patterns.md).

## Arquitectura funcional actual

El usuario navega el catálogo público (productos/categorías, sin sesión requerida). Puede agregar
al carrito como invitado (`localStorage`) o logueado (sincronizado con el backend). En checkout,
selecciona dirección y método de pago reales (`Address`/`PaymentMethod`, backend) y al confirmar
se crea una `Order` real vía API — el servidor calcula los totales desde el carrito, no el
cliente. "Mis pedidos" consulta esa misma API. Desde la página de producto puede marcar
favoritos (`WishList`, backend real); Settings y Profile siguen vacío/mínimo (Profile deriva del
JWT decodificado, sin llamada real al backend).

## Arquitectura técnica actual [CÓDIGO]

- **Backend:** Express 5 (ESM, `"type": "module"`) + Mongoose 9. Middlewares globales en orden:
  `cors()` (abierto) → `express.json()` → estático `/img` → `connectDB()` → routers montados
  directamente (`/api/products`, `/api/categories`, `/api/auth`, `/api/cart`) → error handler
  global. Auth con JWT (`jsonwebtoken` + `bcrypt`). Validación con `express-validator` en
  products/categories/cart.
- **Frontend:** React 19 (CRA/`react-scripts`). `index.js` → `ThemeProvider` → `App.jsx` →
  `BrowserRouter` → `AuthProvider` → `CartProvider` → `Layout` → `Routes`. Estado global vía
  Context (`AuthContext`, `CartContext`, `ThemeContext`).
- **Base de datos:** MongoDB vía Mongoose, 8 modelos definidos, solo 4 con controller/router.
- **Manejo de estado:** Context API (sin Redux ni librería externa de estado).
- **Persistencia local vs remota:** ver Matriz de fuente de verdad, abajo.
- **Autenticación:** JWT en `localStorage["authToken"]`, decodificado client-side sin verificar
  firma (solo para leer `{userId, name, role, exp}`); la verificación real ocurre en el backend
  vía `requireAuth`.
- **Validaciones:** `express-validator` (backend, products/categories/cart); ninguna librería de
  schema en frontend — validación de forms es manual/inline por componente.
- **Manejo de errores:** interceptor `classifyError` en `apiClient` (frontend); error handler
  global de Express que distingue `ValidationError` de Mongoose (422) de cualquier otro error
  (500), sin logging a archivo.

## Matriz de fuente de verdad

| Dominio de datos | Fuente real hoy | Modelo backend existe | Notas |
|---|---|---|---|
| Sesión / usuario | Backend (JWT) | ✅ `User` | Perfil se deriva del token, sin `GET` dedicado |
| Catálogo (productos/categorías) | Backend | ✅ | Lectura pública, escritura solo admin (`requireAuth`+`requireAdmin`) |
| Carrito | localStorage + Backend | ✅ `Cart` | Único recurso genuinamente híbrido y sincronizado |
| Pedidos | **Backend real** (`/api/orders`) | ✅ `Order` | F-03 cerrado 2026-08-26; totales calculados server-side desde el `Cart` real, nunca del cliente |
| Direcciones de envío | **Backend real** (`/api/addresses`) | ✅ `Address` | F-01 cerrado 2026-08-26 (backend + frontend), verificado con Playwright de punta a punta. `shippingService` mock queda sin usar en `Checkout.jsx` |
| Métodos de pago | **Backend real** (`/api/payment-methods`) | ✅ `PaymentMethod` | F-02 cerrado 2026-08-26 (backend + frontend); guarda solo `last4`/`brand` (S-03), rechaza `cardNumber`/`cvv` explícitamente. `paymentService` mock quedó sin usar en `Checkout.jsx` |
| Wishlist | **Backend real** (`/api/wishlist`) | ✅ `WishList` | F-04 cerrado 2026-08-26; get-or-create por usuario, patrón de `Cart` |
| Tema día/noche | localStorage (`app:theme`) | No aplica | Cosmético, no requiere backend |

## Dependencia clave entre módulos [CÓDIGO]

- `Cart` depende de `requireAuth` (rutas protegidas) y de `Product` (referencia poblada en cada
  item).
- `Checkout` depende del `CartContext` para los items, pero de los servicios **mock**
  (`shippingService`, `paymentService`) para dirección/pago — **no** depende de `Order`,
  `Address` ni `PaymentMethod` del backend.
- `Category` es autorreferencial vía `parentCategory` (árbol de categorías/subcategorías).
- El drawer de navegación depende del árbol de categorías real (backend) más el estado de
  `AuthContext` para el saludo/avatar.

## Modelos de datos (refs principales) [CÓDIGO]

Ver [.claude/models.md](../.claude/models.md) para el detalle campo por campo de los 8 modelos
(`User`, `Product`, `Category`, `Cart`, `Order`, `Address`, `PaymentMethod`, `WishList`).

## Reglas de negocio detectadas

- Un usuario tiene **un solo carrito** (`Cart.user` es `unique`).
- `Product` usa **soft delete** (`is_deleted`), nunca se borra el documento.
- `Category.type` es un **enum cerrado** (8 valores) — agregar un tipo nuevo requiere tocar el
  schema, no es configurable por datos.
- `Order.status`/`Order.paymentStatus` tienen enums definidos (`pending→processing→shipped→
  delivered→cancelled`, `pending→paid→failed→refunded`) pero **no hay ninguna transición real**
  todavía porque el modelo no se usa.
- `User.role` es `customer`/`admin`. Desde 2026-08-26 sí hay diferencia funcional real:
  `requireAdmin` exige `role === "admin"` para escribir en `products`/`categories` — es la única
  regla de negocio que distingue ambos roles hoy.
- `PaymentMethod` (desde 2026-08-26) nunca guarda el número completo de tarjeta ni el cvv —
  solo `last4`/`brand`. Un cobro real requeriría tokenización con un proveedor externo antes de
  exponer el modelo por API.
