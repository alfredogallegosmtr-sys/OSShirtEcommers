# Despliegue en Render

> Este proyecto **todavía no está desplegado**. Esta guía documenta cómo hacerlo cuando se
> necesite; nada de esto está configurado hoy.

El monorepo se desplegaría como **dos servicios independientes** en Render: el backend como
*Web Service* y el frontend como *Static Site*. Cada uno usa su propia carpeta como
*Root Directory*.

Referencia de variables: [environment-variables.md](./environment-variables.md).

## Servicio backend — Web Service

| Campo | Valor |
| --- | --- |
| Tipo | Web Service |
| Root Directory | `ecommerce-api` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Variables de entorno a configurar en Render:

```env
MONGO_URI=<cadena de conexión de MongoDB Atlas>
JWT_SECRET=<secreto>
JWT_REFRESH_SECRET=<secreto>
JWT_EXPIRES_IN=5h
JWT_REFRESH_EXPIRES_IN=7d
ASSET_BASE_URL=https://URL-DE-ESTE-SERVICIO
```

Notas:

- **`PORT` lo administra Render** — no hay que definirla; `server.js` ya usa
  `process.env.PORT || 4001`.
- `server.js` usa `app.listen(port, ...)` sin fijar host, lo cual funciona en Render (escucha en
  todas las interfaces por default en Node).
- `ASSET_BASE_URL` es necesaria en producción: si no se define, el seed construye las URLs de
  imágenes con `http://localhost:$PORT`, que no sirve fuera de tu máquina.
- **No hay validación de `NODE_ENV`/CORS que aborte el arranque** — a diferencia de otros
  proyectos de referencia, `server.js` usa `app.use(cors())` sin restricciones. Si se despliega
  a producción, conviene restringir el origen antes (ver `.claude/code-patterns.md`).

## Servicio frontend — Static Site

| Campo | Valor |
| --- | --- |
| Tipo | Static Site |
| Root Directory | `ecommerce-app` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `build` |

Variable de entorno a configurar en Render:

```env
REACT_APP_API_URL=https://URL-DEL-BACKEND/api
```

Notas:

- `REACT_APP_API_URL` **incluye el sufijo `/api`**.
- Las variables `REACT_APP_*` se **incrustan durante el build**. Si cambia la URL del backend hay
  que **reconstruir y redeployar** el frontend.

## Orden de despliegue sugerido

1. Desplegar el backend y anotar su URL (p. ej. `https://osshirts-api.onrender.com`).
2. Crear el frontend con `REACT_APP_API_URL=https://osshirts-api.onrender.com/api`.
3. Volver al backend y setear `ASSET_BASE_URL` a su propia URL, para que las imágenes de
   producto sembradas (`npm run seed`) apunten a la URL pública en vez de `localhost`.

## Despliegue automatizado (GitHub Actions)

**No configurado todavía.** El workflow actual ([.github/workflows/ci-cd.yml](../.github/workflows/ci-cd.yml))
es la versión reducida: solo `npm ci` + build, sin job de deploy. Cuando se quiera automatizar:

1. Agregar un job `deploy` al workflow (seguir el patrón de
   `2026-2-ReactFS/.github/workflows/ci-cd.yml`: `needs` de los jobs de build/test, `if: github.ref == 'refs/heads/main'`,
   `curl -fsS -X POST "$HOOK"` con el *Deploy Hook* de cada servicio).
2. En cada servicio de Render: *Settings → Deploy Hook* → copiar la URL.
3. En GitHub: *Settings → Secrets and variables → Actions* → crear
   `RENDER_DEPLOY_HOOK_API` y `RENDER_DEPLOY_HOOK_APP`.
4. En cada servicio de Render, desactivar **Auto-Deploy** (*Settings → Build & Deploy*) para que
   el gate de CI sea el único disparador real.

## Ejemplos de URLs

| | Frontend | Backend |
| --- | --- | --- |
| Local | `http://localhost:3001` | `http://localhost:4001` (API en `/api`) |
| Render | `https://osshirts.onrender.com` (ejemplo) | `https://osshirts-api.onrender.com` (ejemplo) |
