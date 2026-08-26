# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# OSShirtEcommers

E-commerce de camisetas de anime/manga/cultura pop. Dos subproyectos independientes (cada uno con
su propio `package.json` y `node_modules`, no compartidos):

- `ecommerce-api/` — backend Node/Express 5 + Mongoose (MongoDB). ES Modules (`"type": "module"`).
- `ecommerce-app/` — frontend React 19 creado con Create React App (`react-scripts`).

## Docs de referencia (`.claude/`)

- [.claude/api-routes.md](.claude/api-routes.md) — mapa completo de endpoints (método/path/auth/validador).
- [.claude/models.md](.claude/models.md) — modelos Mongoose (campos, enums, relaciones).
- [.claude/validators.md](.claude/validators.md) — validadores `express-validator` por nombre.
- [.claude/code-patterns.md](.claude/code-patterns.md) — patrón exacto de código (backend y frontend).
- [.claude/skills/](.claude/skills/) — guías de referencia técnica clasificadas por scope
  (backend / frontend / workflow). Son guías **generales**, no la convención de este repo:
  ante conflicto, mandan `code-patterns.md`, `api-routes.md` y `models.md`.

## Comandos

### Backend (`ecommerce-api/`)
- `npm install` — instalar dependencias.
- `npm start` — `node server.js`.
- `npm run dev` — `nodemon server.js` (recarga en caliente).
- `npm run seed` — `node src/seed/seed.js` (siembra 8 categorías raíz, 39 subcategorías, 195
  productos y 10 usuarios — el primero con `role: "admin"`). **Idempotente y no destructivo por
  defecto**: upsert por slug/email, re-ejecutarlo no duplica ni borra nada. `SEED_ALLOW_RESET=true`
  habilita el reset explícito (limpia las 7 colecciones antes de sembrar).
- Variables de entorno (`ecommerce-api/.env`, sin `.env.example` todavía): `PORT` (default 4001),
  `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`,
  `ASSET_BASE_URL` (opcional, para las URLs de imágenes del seed).

### Frontend (`ecommerce-app/`)
- `npm install` — instalar dependencias.
- `npm start` — `react-scripts start` (dev server en `http://localhost:3001`, puerto fijado en
  `ecommerce-app/.env` para no chocar con otros proyectos del curso que usan 3000).
- `npm run build` — build de producción.
- `npm test` — `react-scripts test` (Jest en modo watch). Sin tests escritos todavía.
- Variable de entorno: `REACT_APP_API_URL` (opcional, default `http://localhost:4001/api`).

## Estructura de directorios (`src/`)

Ver el árbol completo por carpeta en cada doc de referencia; resumen de alto nivel:

```
ecommerce-api/src/    config/ controllers/ middlewares/ models/ routes/ seed/
ecommerce-app/src/    components/ (+ common/) context/ data/ layout/ pages/ services/ utils/
```

## Arquitectura (big picture)

### Backend
`server.js`: `port = process.env.PORT || 4001`. Middlewares globales en orden: `cors()` (abierto,
sin allowlist de orígenes) → `express.json()` → estático `/img` → `connectDB()` → `GET /` (texto
plano) → routers montados directamente con su prefijo (`/api/products`, `/api/categories`,
`/api/auth`, `/api/cart` — no hay un `routes/index.js` agregador) → error handler global al final.
`src/config/db.conf.js`: `connectDB` con `mongoose.connect(process.env.MONGO_URI)`;
`process.exit(1)` en error de conexión.

Flujo de una petición varía por recurso:
- `products`/`categories`: lectura (`GET`) es pública, `ruta → <validador> → validate →
  controller`. Escritura (`POST`/`PUT`/`DELETE`) exige rol admin: `ruta → requireAuth →
  requireAdmin → <validador> → validate → controller` (401 sin token, 403 si el rol no es
  `admin`).
- `cart`: `ruta → requireAuth → <validador> → validate → controller` (todo el router pasa por
  `router.use(requireAuth)`, así que sin token da 401 antes de llegar a la validación).
- `auth` (`register`/`login`): `ruta → controller` directo, sin validador ni middleware — la
  validación es manual dentro del controller.

Detalle por recurso en [.claude/api-routes.md](.claude/api-routes.md).

### Frontend
`index.js` → `<React.StrictMode><ThemeProvider><App/></ThemeProvider></React.StrictMode>`.
`components/App/App.jsx` → `<BrowserRouter><AuthProvider><CartProvider><Layout><Routes>...`.
Rutas públicas: `/`, `/cart`, `/login`, `/register`, `/search`, `/product/:productId`,
`/category/:categoryId`, `/order-confirmation`. Protegidas con `<ProtectedRoute>`: `/checkout`,
`/wishlist`, `/orders`, `/settings`; `/profile` además con
`allowedRoles={["admin","customer","cliente"]}`. Catch-all `*` → `<div>Ruta no encontrada</div>`.

Estado global vía Context: `AuthContext` (JWT en `localStorage["authToken"]`, decodificado
client-side sin verificar firma), `CartContext` (carrito primero en `localStorage["cart"]` —
funciona sin sesión — y sincronizado contra `/api/cart` si hay sesión), `ThemeContext`
(`localStorage["app:theme"]`, atributo `data-theme` en `<html>`).

Servicios sobre `apiClient` (axios, `baseURL: "http://localhost:4001/api"`, inyecta `Bearer`
token e interceptor `classifyError`). Servicios reales: `authService`, `productsService`,
`categoryService`, `cartService`. Servicios con datos locales (`data/*.json` + `setTimeout`):
`userService`, `paymentService`, `shippingService` — el checkout de direcciones/pagos y "Mis
pedidos" corren sobre esto, no sobre el backend.

## Patrón de código (resumen)

- Backend ESM: imports siempre con extensión `.js`. Controllers `async (req, res)` **sin**
  `try/catch` (Express 5 reenvía las promesas rechazadas al error handler global solo). Mongoose:
  `findById`, `create`, `findByIdAndUpdate(id,{...},{new:true,runValidators:true})`,
  `findByIdAndDelete`, `.populate(...)`. Respuestas `res.status(...).json(...)`; delete → `204`;
  no encontrado → `404`.
- Frontend: servicios son funciones `async` exportadas que llaman `apiClient.<verbo>(path)` y
  devuelven `response.data` explícitamente. Componentes en carpeta propia (`Componente.jsx` +
  `.css`). Acceso a auth vía hook `useAuth()`.
- Detalle completo en [.claude/code-patterns.md](.claude/code-patterns.md).

## Restricciones para el agente

- Documentar y trabajar **solo sobre el código real** del repositorio. No inventar endpoints,
  campos, scripts ni comportamiento.
- **No** incluir sugerencias, mejoras, refactors ni "buenas prácticas" no pedidas.
- **No** listar trabajo pendiente, TODOs ni deuda técnica — eso vive en
  [docs/backlog.md](docs/backlog.md), documento separado.
- Respetar la convención existente: backend ES Modules con imports `.js`, controllers sin
  `try/catch`, validación con `express-validator` + middleware `validate` en products/categories/
  cart (auth es manual inline); frontend con servicios sobre `apiClient` y estado global vía
  Context.
