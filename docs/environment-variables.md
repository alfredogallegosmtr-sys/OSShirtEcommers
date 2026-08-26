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

No hay módulo de validación de entorno (a diferencia de otros proyectos de referencia con un
`config/env.js` que aborta el arranque si falta algo): las variables se leen donde se usan
(`dotenv.config()` al inicio de `server.js`).

CORS: `server.js` usa `app.use(cors())` **sin allowlist** — acepta cualquier origen. No hay
variable `CORS_ALLOWED_ORIGINS` todavía; si se necesita restringir, hay que agregarla.

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
