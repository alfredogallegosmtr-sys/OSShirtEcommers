# Diagnóstico de logs en Render

Procedimiento para diagnosticar un fallo en producción (backend en Render, Web Service) a partir
de sus logs, antes de tocar código. Ver también [render-deployment.md](../render-deployment.md)
(configuración real de los servicios) y la entrada `DEP-03` de [backlog.md](../backlog.md)
(rollback ya verificado en vivo, referenciado más abajo).

## Dónde mirar

Dashboard de Render → servicio del backend (Web Service) → pestaña **Logs**. Antes de abrir el
código, responder estas preguntas con evidencia real del log:

1. **¿El timestamp del primer error coincide con un deploy reciente, o con una hora específica sin
   deploy de por medio?** Si coincide con un deploy → sospechar del código/config de ese deploy. Si
   no → probable causa externa (Atlas, red, carga).
2. **¿El error aparece en cada request o solo en algunos?** Esporádico → puede ser transitorio (ver
   `OBS-02` en el backlog: el free tier de Render se duerme tras inactividad, y el primer request
   tras despertar puede fallar por timeout mientras el servicio arranca).
3. **¿El error ocurre antes de que el servidor arranque (no aparece el log `Server running on
   http://...` de `server.js`), o durante una request específica?** Antes de arrancar → variable de
   entorno faltante o un `import` roto. Durante una request → revisar el endpoint y el payload de
   esa request en el log.

## Tabla síntoma → causa (real, contra este backend)

| Síntoma en logs | Causa probable en este proyecto | Qué hacer |
| --- | --- | --- |
| `MongoServerSelectionError: ... timed out` | Atlas no alcanzable (red, cluster pausado, IP allowlist) | Revisar estado del cluster en Atlas; confirmar `0.0.0.0/0` o la IP de Render en Network Access |
| `MongoServerError: Authentication failed` | `MONGO_URI` mal copiada en el dashboard de Render (usuario/password/nombre de BD) — **la variable se llama `MONGO_URI`, no `MONGODB_URI`** (ver [environment-variables.md](../environment-variables.md)) | Corregir el valor en Render → Environment, re-deploy |
| `{"message":"Error interno del servidor"}` con 500 en la respuesta, sin más detalle | El error handler global (`src/app.js`) solo reconoce `ValidationError` de Mongoose (→422) y duplicado de índice `code: 11000` (→422); cualquier otro error (`TypeError`, bug real, etc.) cae al 500 genérico | Buscar el stack trace completo justo arriba de esa línea en el log — el mensaje de respuesta al cliente es genérico a propósito, pero el log del servidor sí tiene el error real |
| `ReferenceError: x is not defined` / `TypeError: ... is not a function` | Bug real de código | Reproducir localmente si es posible, fix en una rama, no hotfix directo en producción |
| `Cannot find module '...'` | Dependencia real usada en runtime pero declarada como `devDependency` (el Build Command de este proyecto es `npm install --omit=dev`, ver `DEP-02`) — o falta en `package.json` | Revisar si el paquete debería ser `dependency` en vez de `devDependency`, o si falta agregarlo |
| `/api-docs` da 404 en producción | **No es necesariamente un deploy viejo.** `NODE_ENV=production` (Render lo pone por defecto) apaga Swagger salvo `ENABLE_DOCS=true` explícito — comportamiento normal del código actual, no un síntoma de fallo | Antes de sospechar "deploy viejo", confirmar por otra vía que el código nuevo está corriendo (ver caso real abajo) |
| Todos los requests fallan con timeout tras un rato sin tráfico, luego funcionan normal | Free tier de Render se duerme tras inactividad (`OBS-02`, confirmado con Artillery: 40/40 fallos dormido, 40/40 éxitos despierto) | Esperar el primer request "de arranque" (varios segundos) antes de concluir que algo está roto |

## El diagnóstico más común

"Funciona en local pero no en producción" casi siempre es una variable de entorno distinta entre
`ecommerce-api/.env` y el panel de Render → Environment. Comparar ambas antes de tocar código.

## Caso real vivido en este proyecto: no confundir un gate de config con un deploy viejo

Durante el despliegue real (`DEP-01`), `/api-docs.json` devolvía 404 en producción y la primera
hipótesis fue "Render está sirviendo un deploy viejo, antes de que existiera Swagger". Esa
hipótesis era **incorrecta**: era el comportamiento normal del código actual bajo
`NODE_ENV=production` sin `ENABLE_DOCS=true` (ver tabla arriba). Se descartó comparando un header
que **no** depende de ese gate — `helmet` agrega headers de seguridad a cualquier respuesta,
gated o no —, confirmando que el código nuevo sí estaba corriendo. Lección: cuando un endpoint
específico responde distinto a lo esperado, probar primero un endpoint/header que no dependa de
esa misma condición, antes de asumir que todo el deploy está desactualizado.

## Si el diagnóstico apunta a una regresión real del último deploy

No hacer hotfix directo en producción. Flujo:

1. Rollback inmediato al deploy anterior (Render → Deploys → deploy previo → Rollback) — ya
   verificado en vivo que esto revierte solo código, nunca datos de Atlas (`DEP-03`).
2. Diagnosticar con los logs como referencia (esta guía).
3. Fix en una rama, con su propio PR.
4. Deploy del fix ya verificado, no del hotfix a ciegas.
