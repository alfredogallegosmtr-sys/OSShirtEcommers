# Observabilidad de las pruebas de carga (Artillery → Grafana)

Stack **local** con Docker para ver **en vivo** las métricas de pruebas de carga de Artillery.
Adaptado del stack de observabilidad de otro proyecto del curso.

```
Artillery (plugin publish-metrics)  ──push──►  Pushgateway :9091
Prometheus :9090  ──scrape cada 5s──►  Pushgateway
Grafana :3050  ──consulta──►  Prometheus   (datasource ya provisionado)
```

> **OBS-01 cerrado (2026-08-27):** `artillery` y `artillery-plugin-publish-metrics` ya son
> devDependencies de `ecommerce-api`, el escenario real vive en
> `ecommerce-api/loadtest/catalog.yml` y corre con `npm run test:load`. Apunta a los endpoints
> públicos del catálogo (`/api/products`, `/api/products/search`, `/api/categories`,
> `/api/categories/:id/products`) y a uno autenticado (`GET /api/cart`, con login único en el
> hook `before` para no chocar con el rate limiting de `S-05`). Verificado en vivo: Artillery →
> Pushgateway → Prometheus, 16 series scrapeadas correctamente.

## Puertos

| Servicio    | URL                     | Nota                                      |
|-------------|-------------------------|--------------------------------------------|
| Grafana     | http://localhost:3050   | remapeado (3001 lo usa el frontend CRA)   |
| Prometheus  | http://localhost:9090   |                                            |
| Pushgateway | http://localhost:9091   |                                            |
| API eshop   | http://localhost:4001   | fuera de este stack; debe correr aparte   |

## Requisitos

- Docker Desktop.
- La API corriendo en `:4001` con datos sembrados:
  ```bash
  cd ../ecommerce-api
  npm run seed      # siembra categorías + productos
  npm start          # o `npm run dev` con nodemon
  ```

## Arranque del stack

```bash
cd observability
cp .env.example .env          # define el password de Grafana (no se commitea)
docker compose up -d
docker compose ps             # los 3 contenedores deben estar "running"
```

## Correr la prueba de carga

Con el stack de arriba corriendo y la API en `:4001` con datos sembrados:

```bash
cd ../ecommerce-api
npm run test:load             # ecommerce-api/loadtest/catalog.yml
```

- **Grafana**: http://localhost:3050 — login con `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`
  de tu `.env` (por defecto `admin` / `admin`). El datasource **Prometheus** ya viene
  configurado (Connections → Data sources).
- **Prometheus**: http://localhost:9090 — para consultar las series a mano.

> El password de Grafana **no está en el repo**: vive en `observability/.env`, que git ignora.
> `.env.example` solo trae valores de ejemplo.

## Limpiar el Pushgateway entre corridas

El Pushgateway **retiene** el último valor empujado hasta que se borra:

```bash
curl -X PUT http://localhost:9091/api/v1/admin/wipe
```

## Apagar

```bash
docker compose down           # detiene y borra los contenedores
docker compose down -v        # además borra el volumen de Grafana (reset total)
```
