# OSShirtEcommers

E-commerce de camisetas de anime/manga/cultura pop. Monorepo con dos subproyectos independientes
(cada uno con su propio `package.json` y `node_modules`, no compartidos):

- **`ecommerce-api/`** — backend Node/Express 5 + Mongoose (MongoDB). ES Modules.
- **`ecommerce-app/`** — frontend React 19 (Create React App).

## Stack

| | Backend (`ecommerce-api/`) | Frontend (`ecommerce-app/`) |
|---|---|---|
| Runtime | Node.js (ESM) | React 19 (Create React App) |
| Framework | Express 5 | React Router 7 |
| Base de datos | MongoDB + Mongoose | — |
| Auth | JWT (Bearer), `bcrypt` | JWT decodificado en cliente, `localStorage["authToken"]` |
| Validación | `express-validator` | validación manual en formularios |
| Tests unitarios/integración | Vitest + Supertest + `mongodb-memory-server` | Jest + React Testing Library + MSW |
| E2E | — | Cypress |
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
# Backend: 158 tests (unitarios + integración, mongodb-memory-server — no requiere Mongo real)
cd ecommerce-api && npm test

# Frontend: 303 tests
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

## Documentación

| Documento | Contenido |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Guía de arquitectura y convenciones para trabajar con IA sobre este repo |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura del sistema |
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | Estado real del proyecto, verificado contra el código |
| [docs/backlog.md](docs/backlog.md) | Backlog priorizado (épicas, bugs, deuda técnica) |
| [docs/environment-variables.md](docs/environment-variables.md) | Variables de entorno de ambos subproyectos |
| [docs/testing/](docs/testing/strategy.md) | Estrategia de pruebas, matriz de trazabilidad, cómo correr todo |
| [.claude/api-routes.md](.claude/api-routes.md) | Mapa completo de endpoints del backend |
| [.claude/models.md](.claude/models.md) | Modelos de datos (Mongoose) |

## Estado del proyecto

Ver [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) para el estado detallado y verificado de
cada área. En resumen: el núcleo (auth, catálogo, carrito, checkout, wishlist, perfil, settings)
está completo y probado — 461 tests reales entre backend, frontend y E2E, todos ejecutados y en
verde, con lint + tests + E2E como gate del CI. Pendiente: despliegue a Render y pruebas de carga
(ver [docs/backlog.md](docs/backlog.md)).
