# Patrón exacto de código

## Backend (`ecommerce-api/`)

- **ESM**: imports siempre con extensión `.js` (p. ej. `import X from "../models/X.js"`).
- **Modelos**: archivo por modelo. `const xSchema = new mongoose.Schema({...}, { timestamps: true })`,
  `const X = mongoose.model("X", xSchema)`, `export default X`.
- **Validación con `express-validator`**: arrays `body()`/`param()` declarados al inicio de cada
  archivo de ruta (`product.routes.js`, `category.routes.js`, `cart.routes.js`), aplicados con el
  middleware `validate` (`middlewares/validation.js`: `validationResult(req)` → 422
  `{ errors: [...] }` si falla, si no `next()`). Orden en la ruta: `[requireAuth] →
  <validaciónArray> → validate → controller`. Detalle completo en
  [.claude/validators.md](.claude/validators.md). `auth.routes.js` es la excepción: register/login
  siguen con chequeo manual inline dentro del controller (campos requeridos, email duplicado,
  `mongoose.isValidObjectId` donde aplica) — no pasan por `express-validator`.
- **Middleware de auth por rol**: `src/middlewares/auth.middleware.js` exporta `requireAuth` y
  `requireAdmin` (exige `req.user.role === "admin"`, 403 si no; debe montarse siempre después de
  `requireAuth`). Rutas de escritura de `products`/`categories` (`POST`/`PUT`/`DELETE`) están
  protegidas con `requireAuth, requireAdmin, <validador>, validate, controller`. Es el único lugar
  del código que usa `requireAdmin` hoy.
- **Controllers**: funciones `async (req, res)` **sin `try/catch`** — Express 5 reenvía promesas
  rechazadas al error handler automáticamente, así que no hace falta envolver manualmente.
  Mongoose: `find`, `findOne`, `findById`, `create`, `findByIdAndUpdate(id, {...}, { new: true, runValidators: true })`,
  `findByIdAndDelete`, `.populate(...)`, `countDocuments`. Respuestas `res.status(...).json(...)`;
  delete exitoso → `res.status(204).send()`; no encontrado → `res.status(404).json({ message: "..." })`.
  Export con `export const nombre = async (req, res) => {...}` (named exports, no default).
- **Auth** (`auth.controller.js`): `jwt.sign({ userId, name, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })`,
  refresh token con `JWT_REFRESH_SECRET`/`JWT_REFRESH_EXPIRES_IN`, hash con `bcrypt` (saltRounds 10).
  Login inválido → 401 `{ message: "Credenciales inválidas" }`. Registro con email duplicado →
  422 `{ message: "User already exist" }` (string exacto: el frontend compara contra él).
- **Error handler global** (`server.js`, al final de los middlewares): `ValidationError` de Mongoose →
  422 `{ message, errors }`; cualquier otro error → 500 `{ message: "Error interno del servidor" }`.
  No escribe a archivo de log.
- **Imágenes**: se sirven estáticas desde `express.static` montado en `/img` →
  `ecommerce-api/public/img/products/`. El seed genera las URLs con
  `${ASSET_BASE_URL || http://localhost:$PORT}/img/products/<archivo>`.

## Frontend (`ecommerce-app/`)

- **`apiClient.js`**: axios `baseURL: "http://localhost:4001/api"` (override con
  `REACT_APP_API_URL`), `timeout: 10000`. Interceptor de request inyecta
  `Authorization: Bearer <localStorage authToken>`. Interceptor de response usa `classifyError`
  y rechaza con `{ kind, status, original, fields? }` (kinds: NOT_FOUND, UNAUTHORIZED, FORBIDDEN,
  VALIDATION, SERVER_ERROR, CLIENT_ERROR, TIMEOUT, NETWORK, UNKNOWN).
- **Servicios**: funciones `async` exportadas que llaman `apiClient.get/post/put/patch/delete(path)`
  y devuelven `response.data` explícitamente (**no** devolver la respuesta de axios completa —
  fue un bug real: `cartService.js` no lo hacía y rompía todo el flujo de carrito).
  Los paths de servicio **no** llevan el prefijo `/api` (ya está en `baseURL`).
- **Carrito**: `CartContext` mantiene el estado primero en `localStorage` (funciona sin sesión) y,
  si hay sesión, sincroniza contra `/api/cart` en cada mutación. Al hacer login se fusiona el
  carrito local con el del servidor. Forma de cada item: `{ id, quantity, product }` — `product`
  es el objeto completo poblado, **nunca** asumir campos planos (`item.price` no existe,
  es `item.product.price`).
- **Contextos**: React Context + provider; acceso vía hooks (`useAuth()`, `useCart()`, `useTheme()`).
  `AuthContext` decodifica el JWT client-side (sin verificar firma) para leer
  `{ userId, name, role, exp }` y persiste el token crudo en `localStorage["authToken"]`.
- **Componentes**: carpeta por componente con `Componente.jsx` + `Componente.css`.
  `ProductCard` acepta `className` (compónelo con sus clases propias) — verificar que un componente
  realmente reenvíe `className` antes de asumir que un estilo pasado por el padre se aplica.
- **Tema día/noche**: `ThemeContext` alterna `data-theme` en `<html>`; paleta completa en
  `index.css` bajo `:root` y `:root[data-theme="dark"]`.
