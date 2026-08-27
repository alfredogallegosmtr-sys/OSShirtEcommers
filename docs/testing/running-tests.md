# Cómo correr las pruebas — OSShirtEcommers

Comandos listos para copiar. Cada subproyecto tiene su propio `package.json` — todos los comandos
de `ecommerce-api/` se corren con working directory ahí, y lo mismo para `ecommerce-app/`.

## Backend (`ecommerce-api/`)

```bash
cd ecommerce-api
npm install

# Toda la suite (unitarios + integración, mongodb-memory-server, no requiere Mongo real)
npm test

# Solo unitarios (middlewares + modelos, sin DB real)
npm run test:unit

# Solo integración (HTTP real vía supertest + mongodb-memory-server)
npm run test:integration

# Con reporte de cobertura (v8, texto + json-summary)
npm run test:coverage

# Modo watch durante desarrollo
npm run test:watch
```

No hace falta ningún `.env` para correr los tests: `tests/integration/helpers/db.js` fija
`JWT_SECRET`/etc. con valores de prueba si no están definidos, y cada test levanta su propia
instancia de MongoDB en memoria.

## Frontend (`ecommerce-app/`)

```bash
cd ecommerce-app
npm install

# Modo watch (default de react-scripts)
npm test

# Una sola corrida con cobertura (igual que en CI)
npm test -- --coverage --watchAll=false
```

No hay un split `test:frontend:unit`/`test:frontend:integration`: a diferencia del backend, aquí
no existe una separación real de carpetas entre "unitario" e "integración" (ambos corren con el
mismo `react-scripts test` sobre `src/**/*.test.jsx`) — agregar dos scripts que hacen exactamente
lo mismo con nombres distintos no aporta señal real, así que no se inventó esa distinción.

## E2E con Cypress (`ecommerce-app/`)

Requiere el backend (`ecommerce-api`) y una base de datos real corriendo — no `mongodb-memory-server`.

```bash
# Terminal 1 — backend real
cd ecommerce-api
npm start

# Terminal 2 — Cypress interactivo (requiere frontend en :3001 aparte, o usar el script :ci)
cd ecommerce-app
npm start        # en otra terminal, o usar test:e2e:ci de abajo
npm run cypress:open

# Headless, orquestando el frontend automáticamente (backend igual debe estar corriendo aparte)
npm run test:e2e:ci
```

**Nota de esta máquina de desarrollo:** el binario de `Cypress.exe` falla su propio smoke-test
(`bad option: --smoke-test`) — ver [known-issues.md](known-issues.md). Los comandos de arriba son
correctos; en esta máquina específica no completan. Funcionan en el job `e2e` de
`.github/workflows/ci-cd.yml` (Ubuntu, aún sin confirmar con una corrida real).

## Correr todo (backend + frontend, sin E2E)

No existe un único comando raíz (no hay `package.json` en la raíz del monorepo — cada subproyecto
es independiente por diseño, ver `CLAUDE.md`). Para correr ambas suites:

```bash
(cd ecommerce-api && npm test) && (cd ecommerce-app && npm test -- --watchAll=false)
```

## Variables de entorno relevantes para testing

| Variable | Dónde | Uso en tests |
|---|---|---|
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | `ecommerce-api` | Fijadas automáticamente con valores de prueba en `tests/integration/helpers/db.js` si no existen |
| `MONGO_URI` | `ecommerce-api` | No se usa en tests (memoria); sí en `npm start`/`npm run seed` reales y en el job `e2e` de CI (apunta al `service container` de Mongo) |
| `CYPRESS_BASE_URL` | `ecommerce-app` | Override del `baseUrl` de `cypress.config.js` (default `http://localhost:3001`) |
| `CYPRESS_API_URL` | `ecommerce-app` | Override de la URL de API que usan los comandos custom (default `http://localhost:4001/api`) |
| `CYPRESS_TEST_USER_EMAIL`/`PASSWORD` | `ecommerce-app` | Override del usuario de `cy.loginByApi()` (default `user4@test.com`/`123456`, el sembrado por `npm run seed`) |
