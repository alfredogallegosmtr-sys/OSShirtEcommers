# Despliegue en Render

> **Desplegado (2026-08-31).** El monorepo corre como **dos servicios independientes** en Render:
> backend (*Web Service*) y frontend (*Static Site*), cada uno con su propia carpeta como
> *Root Directory*. URLs reales:
>
> | | URL |
> | --- | --- |
> | Backend (Web Service) | https://osshirtecommerceproject.onrender.com |
> | Frontend (Static Site) | https://osshirtecommercefrontend.onrender.com |
>
> Verificado en vivo: el backend conecta a MongoDB Atlas real, responde `/api/products` con datos
> reales, `helmet` está activo (headers de seguridad presentes), las imágenes de producto cargan
> desde el propio backend (`ASSET_BASE_URL`), y CORS acepta el origen real del frontend.

El resto de esta guía sigue siendo válida como referencia reproducible (útil si se recrean los
servicios desde cero, o se documenta el proceso para otra persona).

Referencia de variables: [environment-variables.md](./environment-variables.md).

## Servicio backend — Web Service

| Campo | Valor |
| --- | --- |
| Tipo | Web Service |
| Root Directory | `ecommerce-api` |
| Build Command | `npm install --omit=dev` |
| Start Command | `npm start` |

`--omit=dev` es importante: sin él, Render instala también `artillery`/`vitest`/`eslint`/etc.
(nunca los usa `npm start`) y `npm audit` reporta vulnerabilidades de esas devDependencies (ej.
`artillery-plugin-publish-metrics` → `@opentelemetry/*`) que no tocan la app real. Con
`--omit=dev`, build más rápido y `npm audit` limpio.

Variables de entorno a configurar en Render:

```env
MONGO_URI=<cadena de conexión de MongoDB Atlas>
JWT_SECRET=<secreto>
JWT_REFRESH_SECRET=<secreto>
JWT_EXPIRES_IN=5h
JWT_REFRESH_EXPIRES_IN=7d
ASSET_BASE_URL=https://URL-DE-ESTE-SERVICIO
CORS_ALLOWED_ORIGINS=<URL real del Static Site del frontend>
ENABLE_DOCS=true
```

Notas:

- **`PORT` lo administra Render** — no hay que definirla; `server.js` ya usa
  `process.env.PORT || 4001`.
- `ENABLE_DOCS` es opcional — sin ella, `/api-docs` queda apagado en producción (`NODE_ENV=production`
  ya lo pone Render por defecto). Solo hace falta si se quiere Swagger navegable en el deploy real.
- `server.js` usa `app.listen(port, ...)` sin fijar host, lo cual funciona en Render (escucha en
  todas las interfaces por default en Node).
- `ASSET_BASE_URL` es necesaria en producción: si no se define, el seed construye las URLs de
  imágenes con `http://localhost:$PORT`, que no sirve fuera de tu máquina.
- **CORS ya tiene allowlist real** (`S-04`, `src/app.js`) vía `CORS_ALLOWED_ORIGINS` — hay que
  agregar ahí la URL real del frontend en Render antes de desplegar (ver
  [environment-variables.md](./environment-variables.md)), si no, el navegador bloqueará las
  peticiones del frontend desplegado. No hay validación que aborte el arranque si falta esta
  variable — sin definirla, cae al default de desarrollo (`http://localhost:3001`), lo que
  rompería CORS en producción de forma silenciosa, no con un error visible.

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
- **Rewrite rule para SPA, configurada en el dashboard (pestaña "Redirects/Rewrites" del
  servicio, no dentro de Settings):** Source `/*` → Destination `/index.html` → Action
  `Rewrite`. Necesaria para que las rutas de `react-router-dom` funcionen al recargar la página o
  entrar por link directo — un Static Site sirve archivos reales por default, así que sin esta
  regla, `GET /product/123` (recarga o link directo) da 404 en vez de dejar que `BrowserRouter`
  la resuelva del lado del cliente; solo `/` funciona porque coincide con `index.html` literal.
  **Render no lee un archivo `_redirects` estilo Netlify** (se probó primero con ese archivo en
  `public/`, no tuvo ningún efecto) — la regla vive solo en la configuración del servicio, no en
  el repo, y no se replica automáticamente si el servicio se recrea desde cero.

## Orden de despliegue sugerido

1. Desplegar el backend y anotar su URL (p. ej. `https://osshirts-api.onrender.com`).
2. Crear el frontend con `REACT_APP_API_URL=https://osshirts-api.onrender.com/api`.
3. Volver al backend y setear `ASSET_BASE_URL` a su propia URL, para que las imágenes de
   producto sembradas (`npm run seed`) apunten a la URL pública en vez de `localhost`.

## Despliegue automatizado

**Lo que hay hoy:** cada servicio en Render tiene **Auto-Deploy: On Commit** sobre la rama
`main` — cualquier push a `main` dispara un build+deploy real, directo desde Render, sin pasar
por GitHub Actions. Es lo que se usó para el primer despliegue real.

**Alternativa documentada pero no implementada** (la que originalmente planeaba `DEP-01`): gatear
el deploy detrás del CI, para que un push a `main` con tests rotos no llegue a desplegarse solo.
Si se quiere migrar a esto:

1. Agregar un job `deploy` al workflow ([.github/workflows/ci-cd.yml](../.github/workflows/ci-cd.yml),
   que ya corre lint + tests + cobertura + build + las 20 specs de Cypress) — `needs` de los jobs
   de build/test, `if: github.ref == 'refs/heads/main'`, `curl -fsS -X POST "$HOOK"` con el
   *Deploy Hook* de cada servicio.
2. En cada servicio de Render: *Settings → Deploy Hook* → copiar la URL.
3. En GitHub: *Settings → Secrets and variables → Actions* → crear
   `RENDER_DEPLOY_HOOK_API` y `RENDER_DEPLOY_HOOK_APP`.
4. En cada servicio de Render, desactivar **Auto-Deploy** (*Settings → Build & Deploy*) para que
   el gate de CI sea el único disparador real.

## URLs reales

| | Frontend | Backend |
| --- | --- | --- |
| Local | `http://localhost:3001` | `http://localhost:4001` (API en `/api`) |
| Render | https://osshirtecommercefrontend.onrender.com | https://osshirtecommerceproject.onrender.com |
