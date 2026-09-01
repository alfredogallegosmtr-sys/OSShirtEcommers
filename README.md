# OSShirtEcommers

E-commerce de camisetas de anime, manga y cultura pop (japonesa, coreana y china). Catálogo con
categorías anidadas y búsqueda, carrito persistente (funciona sin sesión), checkout con
direcciones/métodos de pago/pedidos reales contra el backend, wishlist y cuenta de usuario.
Arrancó como proyecto del curso React Full-Stack, y se llevó más allá del alcance típico de un
ejercicio de curso: auditoría de seguridad OWASP Top 10 corregida hallazgo por hallazgo, suite de
514 tests reales (unit + integración + E2E) como gate de CI, pruebas de carga con Artillery, y
simulacros reales de caída de infraestructura (Atlas inalcanzable, credenciales rotas) corridos
contra el propio despliegue de producción para verificar cómo se comporta la app cuando algo
falla — no solo cuando todo funciona.

> **En producción:** [Frontend](https://osshirtecommercefrontend.onrender.com) ·
> [Backend / API](https://osshirtecommerceproject.onrender.com)

Monorepo con dos subproyectos independientes (cada uno con su propio `package.json` y
`node_modules`, no compartidos):

- **`ecommerce-api/`** — backend Node/Express 5 + Mongoose (MongoDB). ES Modules.
- **`ecommerce-app/`** — frontend React 19 (Create React App).

## Arquitectura

```
┌───────────────────────┐        HTTPS         ┌───────────────────────┐
│  Frontend (React 19)   │ ────────────────────► │  Backend (Express 5)  │
│  Render Static Site    │                       │  Render Web Service   │
│  react-router-dom SPA  │ ◄──────────────────── │  Node.js 24 (ESM)     │
└───────────────────────┘     JSON + JWT Bearer   └───────────┬───────────┘
                                                               │
                                                               │ mongoose 9
                                                               ▼
                                                   ┌───────────────────────┐
                                                   │   MongoDB Atlas       │
                                                   │   (cluster M0 free)   │
                                                   └───────────────────────┘
```

El frontend no tiene backend-for-frontend ni SSR: es un Static Site puro que habla directo con la
API vía `axios` (`apiClient.js`), inyectando el JWT en cada request autenticada. El estado global
(usuario, carrito, tema) vive en Context API — ver [Decisiones técnicas](#decisiones-técnicas).
Como el Static Site sirve archivos reales por default, las rutas de `react-router-dom` necesitan
una regla de rewrite (`/* → /index.html`) configurada en el dashboard de Render, no en el repo —
detalle documentado en [docs/render-deployment.md](docs/render-deployment.md).

## Stack

| | Backend (`ecommerce-api/`) | Frontend (`ecommerce-app/`) |
|---|---|---|
| Runtime | Node.js 24 (ESM) | React 19.1 (Create React App) |
| Framework | Express 5.2 | React Router 7.9 |
| Base de datos | MongoDB Atlas + Mongoose 9.3 | — |
| Cliente HTTP | — | axios 1.16 |
| Auth | JWT (`jsonwebtoken` 9), `bcrypt` | JWT decodificado en cliente, `localStorage["authToken"]` |
| Validación | `express-validator` | validación manual en formularios |
| Tests unitarios/integración | Vitest 4 + Supertest + `mongodb-memory-server` | Jest (`react-scripts`) + Testing Library 16 + MSW |
| E2E | — | Cypress |
| Despliegue | Render Web Service | Render Static Site |
| CI | GitHub Actions (`.github/workflows/ci-cd.yml`) | mismo workflow |

## Requisitos

- Node.js 20+ y npm.
- Una instancia de MongoDB accesible (local o Atlas) — no incluida en este repo.

## Puesta en marcha rápida

Los dos subproyectos se instalan y arrancan por separado.

### 1. Backend

```bash
cd ecommerce-api
npm install
```

Crear `ecommerce-api/.env` (no existe `.env.example` todavía) con al menos:

```
MONGO_URI=mongodb://localhost:27017/ecommerceDB-dev
JWT_SECRET=un-secreto-largo
JWT_REFRESH_SECRET=otro-secreto-largo
```

Ver la lista completa de variables (opcionales incluidas) en
[docs/environment-variables.md](docs/environment-variables.md).

```bash
npm run dev      # nodemon server.js, recarga en caliente
# o
npm start        # node server.js
```

Levanta en `http://localhost:4001` por defecto.

Sembrar datos de prueba (8 categorías raíz, 39 subcategorías, 195 productos, 10 usuarios — el
primero admin; **idempotente**, no destructivo por defecto):

```bash
npm run seed
```

### 2. Frontend

```bash
cd ecommerce-app
npm install
npm start
```

Levanta en `http://localhost:3001` (puerto fijado en `ecommerce-app/.env` para no chocar con
otros proyectos que usan 3000 — si el archivo no existe, créalo con `PORT=3001`). Por defecto
apunta a `http://localhost:4001/api`; para cambiarlo, definir `REACT_APP_API_URL`.

Con ambos corriendo, la app queda disponible en `http://localhost:3001`.

## Testing

```bash
# Backend: 180 tests (unitarios + integración, mongodb-memory-server — no requiere Mongo real)
cd ecommerce-api && npm test

# Frontend: 314 tests
cd ecommerce-app && npm test -- --watchAll=false

# E2E con Cypress (requiere backend + Mongo real corriendo; ver docs/testing/running-tests.md)
cd ecommerce-app && npm run test:e2e:ci
```

Guía completa (cobertura, datos de prueba, comandos, limitaciones conocidas) en
[docs/testing/](docs/testing/strategy.md).

## CI/CD

`.github/workflows/ci-cd.yml` corre en cada push/PR a `main`: tests + cobertura de ambos
subproyectos, build del frontend, y las 20 specs de Cypress contra un backend real con MongoDB
como *service container*. Detalle en [docs/testing/known-issues.md](docs/testing/known-issues.md).

Despliegue a Render (backend Web Service + frontend Static Site) vía Auto-Deploy sobre `main` —
cada push despliega directo, sin pasar por un gate de CI (alternativa documentada pero no
adoptada, ver [docs/render-deployment.md](docs/render-deployment.md)). Detalle completo de
variables de entorno, build commands y la regla de rewrite del Static Site en ese mismo documento.

## Decisiones técnicas

**¿Por qué Context API y no Redux para el estado global?**
El estado que de verdad necesita vivir fuera de un componente (usuario autenticado, carrito,
tema) es pequeño y no tiene lógica de coordinación entre muchas acciones — `AuthContext`,
`CartContext` y `ThemeContext`, cada uno con su propio hook (`useAuth`/`useCart`/`useTheme`).
Redux (o Zustand) aporta valor real cuando el estado global crece en superficie o necesita
middlewares/time-travel debugging; acá habría sido una dependencia extra sin un problema real que
resolver. El costo real de esta elección: si el estado global crece de verdad (por ejemplo,
filtros de catálogo compartidos entre muchas vistas), Context sin selectors re-renderiza más de lo
necesario — no es un problema hoy porque ningún Context de este proyecto cambia con alta
frecuencia.

**¿Por qué no se guarda el número de tarjeta real (solo `last4`/`brand`)?**
Decisión explícita (`S-03` del backlog, con el usuario eligiendo entre 4 opciones reales:
no guardar el número / tokenizar con un proveedor externo / cifrar en la app / aplazarlo) — se
optó por no guardar el número real ni el cvv en ningún momento: `PaymentMethod` solo persiste
`last4` y `brand`, derivados en el propio formulario del frontend antes de enviarlos, y el
backend los rechaza explícitamente si llegan (`422` si el body incluye `cardNumber`/`cvv`). El
tradeoff: el checkout de este proyecto no procesa un cobro real — cualquier flujo de pago real
requeriría integrar un proveedor externo (Stripe/PayPal) que devuelva un token, fuera del alcance
actual.

**¿Por qué Vitest en el backend y no Jest?**
`ecommerce-api` es ESM puro (`"type": "module"` en `package.json`, imports con `.js` explícito).
Jest todavía necesita el flag `--experimental-vm-modules` para correr ESM nativo sin transpilar;
Vitest lo soporta de forma nativa, sin flags ni configuración extra. El frontend sigue con Jest
(vía `react-scripts`) porque ese es el runner que trae Create React App por defecto — no había
motivo para reemplazarlo ahí.

**¿Por qué el stock se descuenta al confirmar la orden, no al agregar al carrito?**
`Product.stock` existe desde el modelo original pero no se validaba en ningún punto real del
flujo hasta que se cerró como deuda de diseño (`S-10`). La decisión: reservar/descontar stock
recién al crear la orden (`POST /api/orders`), con un descuento atómico (`$gte` sobre la cantidad
disponible) y rollback si algún producto de la orden no alcanza — no al agregar al carrito, donde
un usuario podría dejar productos "reservados" en un carrito abandonado indefinidamente y bloquear
stock real sin haber comprado nada.

## Qué mejoraría con más tiempo

- **`AddressForm.jsx`/`PaymentForm.jsx` resetean el formulario antes de saber si el guardado tuvo
  éxito** (`B-22` en el backlog, encontrado y documentado, no corregido todavía) — si el submit
  falla del lado del servidor, el usuario pierde lo que acababa de escribir en vez de poder
  reintentar sobre los mismos datos.
- El checkout no integra un proveedor de pago real (ver "Decisiones técnicas" arriba) — es un
  flujo de demo consciente, no un cobro real.
- El free tier de Render (backend) se duerme tras inactividad; el primer request tras despertar
  puede tardar varios segundos o fallar por timeout — medido y documentado
  (`docs/runbooks/render-logs-diagnostico.md`), no resuelto (requeriría un plan pago).

## Documentación

| Documento | Contenido |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Guía de arquitectura y convenciones para trabajar con IA sobre este repo |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura del sistema |
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | Estado real del proyecto, verificado contra el código |
| [docs/backlog.md](docs/backlog.md) | Backlog priorizado (épicas, bugs, deuda técnica) |
| [docs/environment-variables.md](docs/environment-variables.md) | Variables de entorno de ambos subproyectos |
| [docs/testing/](docs/testing/strategy.md) | Estrategia de pruebas, matriz de trazabilidad, cómo correr todo |
| [docs/render-deployment.md](docs/render-deployment.md) | Configuración real del despliegue en Render (env vars, build commands, rewrite rules) |
| [docs/runbooks/](docs/runbooks/README.md) | Procedimientos operativos: diagnóstico de logs, troubleshooting local |
| [docs/security/owasp-audit-2026-08-27.md](docs/security/owasp-audit-2026-08-27.md) | Auditoría de seguridad OWASP Top 10, hallazgo por hallazgo |
| [.claude/api-routes.md](.claude/api-routes.md) | Mapa completo de endpoints del backend |
| [.claude/models.md](.claude/models.md) | Modelos de datos (Mongoose) |

## Estado del proyecto

Ver [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) para el estado detallado y verificado de
cada área. En resumen: el núcleo (auth, catálogo, carrito, checkout, wishlist, perfil, settings)
está completo, probado (514 tests reales entre backend, frontend y E2E, todos ejecutados y en
verde, con lint + tests + E2E como gate del CI) y **desplegado en producción real** en Render
(ver URLs al inicio de este documento). Backlog priorizado y verificado contra el código, sin
épicas abiertas salvo deuda técnica menor ya documentada, en
[docs/backlog.md](docs/backlog.md).
