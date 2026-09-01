# Variables de entorno

## Backend (`ecommerce-api/.env`)

| Variable | Obligatoria | Ejemplo local | Descripción |
| --- | --- | --- | --- |
| `PORT` | No (default `4001`) | `4001` | Puerto de escucha de Express. |
| `MONGO_URI` | Sí | `mongodb://localhost:27017/ecommerceDB-dev` | Cadena de conexión a MongoDB. |
| `JWT_SECRET` | Sí | (string largo) | Secreto de firma del access token. |
| `JWT_REFRESH_SECRET` | Sí | (string largo) | Secreto de firma del refresh token. |
| `JWT_EXPIRES_IN` | No | `5h` | Expiración del access token. |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Expiración del refresh token. |
| `ASSET_BASE_URL` | No (default `http://localhost:$PORT`) | — | Base usada por `src/seed/seed.js` para construir las URLs de imágenes de producto. |
| `SEED_ALLOW_RESET` | No (default `false`) | `true` | Solo la lee `src/seed/seed.js`. En `false`/sin definir, el seed es **no destructivo** (upsert por slug/email, nunca borra). En `true`, borra las 7 colecciones antes de sembrar. |
| `CORS_ALLOWED_ORIGINS` | No (default `http://localhost:3001`) | `http://localhost:3001` | Lista de orígenes permitidos para CORS, separados por coma (se hace `trim()` a cada uno). Antes de desplegar a un dominio real (`DEP-01`), agregar aquí la URL real del frontend. |
| `ENABLE_DOCS` | No (default `false`) | `true` | Solo importa si `NODE_ENV=production`. Swagger UI (`/api-docs`) siempre está montado fuera de producción; en producción queda apagado salvo que se ponga `ENABLE_DOCS=true` explícitamente — evita exponer la forma de la API a cualquiera en un despliegue real por defecto. |

No hay módulo de validación de entorno (a diferencia de otros proyectos de referencia con un
`config/env.js` que aborta el arranque si falta algo): las variables se leen donde se usan
(`dotenv.config()` al inicio de `server.js`).

CORS: `src/app.js` (desde 2026-08-26, `S-04`) usa `cors({ origin: ... })` con allowlist real vía
`CORS_ALLOWED_ORIGINS` (ver tabla arriba). Se lee **dentro** del callback de `cors()`, evaluado
por request, no a nivel de módulo — necesario porque `app.js` se importa (y su código de nivel de
módulo se ejecuta) antes de que `server.js` corra `dotenv.config()`, así que una lectura a nivel
de módulo nunca vería el valor real del `.env`. Un origen no listado no recibe el header
`Access-Control-Allow-Origin` (el navegador bloquea que JS lea la respuesta), pero la petición en
sí se sigue procesando normalmente — es el comportamiento estándar de CORS, no un control de
acceso de servidor. Peticiones sin header `Origin` (curl, servidor-a-servidor) siempre pasan.

## Frontend (`ecommerce-app`)

`ecommerce-app` **no usa ningún archivo `.env`** — no depende de ninguna variable de entorno para
arrancar.

| Variable | Obligatoria | Valor efectivo | Descripción |
| --- | --- | --- | --- |
| `PORT` | No (fijo en `3001`) | `3001` | Puerto del dev server. Se fija en `scripts/start.js` (`process.env.PORT = process.env.PORT \|\| "3001"`, cargado por `npm start` en vez de `react-scripts start` directo) — evita chocar con otros repos del curso que usan 3000, sin depender de un `.env` ni de una dependencia extra como `cross-env`. |
| `REACT_APP_API_URL` | No (default `http://localhost:4001/api`) | `http://localhost:4001/api` | Base de la API, **incluye el sufijo `/api`**. Solo se lee en `apiClient.js`; si se quiere fijar explícito hay que exportarla en el shell antes de `npm start`/`npm run build`, o vía un `.env.production` (CRA lo carga automático en `build`) cuando exista una URL real de backend. |

Convención de Create React App: las variables públicas empiezan con `REACT_APP_`, se acceden con
`process.env.REACT_APP_*` y quedan incrustadas en el build (un cambio exige reconstruir).

## Archivos `.env` locales

`ecommerce-api/.env.example` existe y sí está versionado — el `.gitignore` usa `.env.*` +
`!.env.example` (bloquea cualquier `.env`, `.env.local`, `.env.production`, etc. real, y deja
pasar solo el ejemplo). Copiarlo a `.env` y completar los secretos reales (`JWT_SECRET`/
`JWT_REFRESH_SECRET`) para levantar el backend de cero. `ecommerce-app/` no necesita ningún
`.env` — ver la sección de arriba.

**`.env.local` tiene prioridad sobre `.env`** (`server.js`/`seed.js` cargan
`dotenv.config({ path: [".env.local", ".env"] })` — dotenv no sobreescribe una variable ya seteada
por un archivo anterior en la lista, así que cualquier variable ausente en `.env.local` cae a
`.env`). Convención de este repo: `.env.local` apunta a Mongo local
(`mongodb://localhost:27017/ecommerceDB-dev`) para el día a día, y `.env` queda con la cadena de
Atlas para cuando se necesite explícitamente (migraciones, probar contra datos reales) —
evita que correr la app o el seed "en local" toque sin querer la base de producción.

## Cookies

No aplica. La autenticación es JWT stateless por header `Authorization: Bearer <token>` (token en
`localStorage["authToken"]` del navegador). No se usan cookies.

## MCP de MongoDB (tooling de desarrollo, 2026-08-27)

`ecommerce-api/.mcp.json` configura un servidor MCP `mongodb` en modo `stdio` para que Claude Code
pueda consultar la base de datos en **solo lectura** (`mongodb-mcp-server@latest --readOnly`). No
contiene ningún secreto: usa `dotenv-cli` para cargar `MONGO_URI` desde `ecommerce-api/.env` en
tiempo de ejecución, así que es seguro tenerlo versionado (mismo patrón ya usado en el repo de
referencia del curso). No forma parte del runtime de la app — es exclusivamente una herramienta de
desarrollo. Para activarlo: `claude mcp list` / `claude mcp get mongodb` y reiniciar Claude Code.
