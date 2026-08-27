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

## Frontend (`ecommerce-app/.env`)

| Variable | Obligatoria | Ejemplo local | Descripción |
| --- | --- | --- | --- |
| `PORT` | No | `3001` | Puerto del dev server de Create React App. Fijo en este proyecto para no chocar con otros repos que usan 3000. |
| `REACT_APP_API_URL` | No (default `http://localhost:4001/api`) | `http://localhost:4001/api` | Base de la API, **incluye el sufijo `/api`**. Solo se lee en `apiClient.js`. |

Convención de Create React App: las variables públicas empiezan con `REACT_APP_`, se acceden con
`process.env.REACT_APP_*` y quedan incrustadas en el build (un cambio exige reconstruir).

## Archivos `.env` locales

No hay `.env.example` en este repo todavía. Ambos `.env` están en `.gitignore`; para levantar el
proyecto de cero hay que crearlos a mano con las variables de arriba (ver
[docs/runbooks/](./runbooks/)).

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
