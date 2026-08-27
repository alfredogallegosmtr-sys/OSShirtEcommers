# Spec: Cerrar los gaps reales de variables de entorno antes de desplegar a Render

## Metadata
- **Tipo:** infra
- **Complejidad:** S
- **Fecha:** 2026-08-27
- **Estado:** DRAFT

## Historia
Como desarrollador que va a desplegar `OSShirtEcommers` a Render, necesito que las variables de
entorno obligatorias tengan una plantilla (`.env.example`) y que el servidor falle de forma
visible si falta una variable crítica en producción, en vez de arrancar silenciosamente con un
default de desarrollo que rompe CORS o construye URLs de imágenes con `localhost`. También
necesito confirmar, antes de cualquier push a producción, que el frontend compila y funciona
sobre su propio build (no solo sobre el dev server) y que no queda `console.log` de debug real en
el código que se despliega.

## Contexto

Se auditó el monorepo completo buscando URLs hardcodeadas (`localhost`, `127.0.0.1`, `cors(`,
`baseURL`, `fetch(`, `axios`) como paso previo a cualquier cambio, siguiendo FASE 1 de
[SSDLC](../../.claude/skills/workflow/SSDLC.md). Resultado real, no supuesto:

**Ya está hecho (no se toca, no se reinventa):**
- `ecommerce-api/src/app.js` (`S-04`, cerrado 2026-08-26): CORS ya usa una allowlist real vía
  `CORS_ALLOWED_ORIGINS` (separada por comas, con `trim()`), no `origin: '*'`, sin credentials.
- `ecommerce-app/src/services/apiClient.js`: cliente HTTP ya centralizado (axios), ya lee
  `REACT_APP_API_URL` como variable de entorno — **ninguna** llamada a `fetch`/`axios` fuera de
  este archivo usa una URL hardcodeada en código de producción (confirmado por grep en todo
  `ecommerce-app/src/` — las únicas apariciones de `localhost:4001` son en archivos `.test.js(x)`,
  URLs de mocks de MSW, correctas e intencionalmente fijas).
- `ecommerce-api/server.js`: ya usa `process.env.PORT || 4001` y `app.listen(port, ...)` sin fijar
  host — Node escucha en todas las interfaces por default, correcto para Render sin cambios.
- No hay cookies, sesiones, WebSockets, Socket.IO, OAuth, webhooks ni links de verificación por
  email en este proyecto (JWT stateless en `localStorage`, sin pasarela de pago externa por
  diseño — `S-03` —, confirmado en múltiples auditorías de esta sesión) — las secciones 10 y 11
  de la referencia de este spec **no aplican**.
- No hay un `package.json` raíz ni workspaces — cada subproyecto se despliega como servicio
  independiente en Render (ya documentado en `docs/render-deployment.md`).
- `.gitignore` de ambos paquetes ya excluye `.env`/`.env.*` correctamente.
- `docs/environment-variables.md` y `docs/render-deployment.md` ya documentan variables,
  comandos de Render y orden de despliegue sugerido (una inexactitud sobre el estado de CORS se
  corrigió el 2026-08-27, fuera de este spec, por ser un fix de documentación existente).

**Gap real detectado (esto es lo que este spec cubre):**
1. No existe `ecommerce-api/.env.example` ni `ecommerce-app/.env.example`.
2. `ecommerce-api/server.js` no valida nada al arrancar: si falta `MONGO_URI`/`JWT_SECRET` en
   Render, el fallo aparece tarde y de forma indirecta (conexión a Mongo fallida o tokens
   firmados con `undefined`), no como un error claro al inicio.
3. `CORS_ALLOWED_ORIGINS` sin definir cae silenciosamente al default de desarrollo
   (`http://localhost:3001`) — en producción esto significa que el frontend real queda
   bloqueado por CORS sin ningún mensaje que lo explique.
4. `server.js:12` loguea `Server running on https://localhost:${port}` — dice `https` pero el
   servidor corre en HTTP plano (Render termina TLS en su proxy, la app nunca ve HTTPS
   directamente). Inexactitud menor, confunde en desarrollo local.
5. `console.log` de debug real en frontend (verificado con grep en todo `ecommerce-app/src/`,
   excluyendo tests — el backend no tiene ninguno real, solo logging intencional ya cubierto
   arriba en "Ya está hecho"):
   - `ecommerce-app/src/components/BannerCarousel/BannerCarousel.jsx:112` y `:124`
   - `ecommerce-app/src/context/ThemeContext.jsx:27`
6. No hay una verificación local del build de producción del frontend antes de desplegar — el
   error más común de un deploy es que algo funcione en `npm start` (dev) pero falle en
   `npm run build`, y detectarlo localmente toma 2 minutos vs. ~20 en Render.
7. `ecommerce-app/src/services/apiClient.js:6` cae en silencio a
   `http://localhost:4001/api` si falta `REACT_APP_API_URL`. Como CRA incrusta las variables
   `REACT_APP_*` **en tiempo de build**, un build de producción sin esa variable definida
   generaría un frontend que apunta a `localhost` para siempre, sin ningún error visible — hay
   que fallar el build, no degradar en silencio.
8. No existe ningún test (unitario ni de integración) que verifique el comportamiento real de
   CORS — que un origen de la allowlist pase y uno fuera de ella sea rechazado. Ya está
   trackeado como `SEC-001` en
   [docs/testing/test-matrix.md](../testing/test-matrix.md) (prioridad Media, estado Pendiente);
   este spec lo adopta como criterio de aceptación propio porque es exactamente el área que toca.

## Criterios de Aceptación
- [ ] CA-1: Existe `ecommerce-api/.env.example` con todas las variables de
      `docs/environment-variables.md`, comentadas, sin valores reales.
- [ ] CA-2: Existe `ecommerce-app/.env.example` con `PORT` y `REACT_APP_API_URL`, comentadas.
- [ ] CA-3: `server.js` valida al arrancar que `MONGO_URI`, `JWT_SECRET` y `JWT_REFRESH_SECRET`
      existan; si falta alguna, loguea un error claro (sin imprimir secrets) y termina el
      proceso antes de intentar conectar a Mongo — no un fallo indirecto más adelante.
- [ ] CA-4: En `NODE_ENV=production`, si `CORS_ALLOWED_ORIGINS` no está definida, el arranque
      falla explícitamente en vez de caer al default de `localhost:3001` (en desarrollo el
      default se mantiene, para no romper `npm run dev` sin `.env`).
- [ ] CA-5: `server.js:12` corrige el log a `http://localhost:${port}` (texto real, no HTTPS).
- [ ] CA-6: `npm test` (158 backend) y `npm test -- --watchAll=false` (303 frontend) siguen en
      verde después de los cambios.
- [ ] CA-7: Búsqueda final de `localhost`/`127.0.0.1`/URLs hardcodeadas en código de producción
      (no tests) confirma que no se introdujo ninguna nueva.
- [ ] CA-8: Se eliminan los 3 `console.log` de debug listados en Contexto (`BannerCarousel.jsx`
      x2, `ThemeContext.jsx`) — o se reemplazan por logging intencional si resulta que aportan
      valor real de diagnóstico, decisión a tomar durante la implementación, no antes.
- [ ] CA-9: `npm run build` (frontend) corre sin errores ni warnings críticos, y el resultado se
      prueba localmente sirviendo `build/` (ej. `npx serve build`) antes de cualquier push —
      confirmando que el flujo real de usuario (home, login, carrito, checkout) funciona sobre el
      build de producción, no solo sobre el dev server.
- [ ] CA-10: `apiClient.js` (o el proceso de build) falla explícitamente si
      `REACT_APP_API_URL` no está definida en un build de producción (`NODE_ENV=production`,
      que CRA fija automáticamente durante `npm run build`) — en desarrollo (`npm start`) el
      default a `localhost:4001` se mantiene, mismo criterio que CA-4 en el backend.
- [ ] CA-11 (`SEC-001`): existe al menos un test de integración real que confirma que un origen
      presente en `CORS_ALLOWED_ORIGINS` recibe la respuesta normalmente y uno fuera de la
      allowlist es rechazado por CORS — cierra `SEC-001` de
      [docs/testing/test-matrix.md](../testing/test-matrix.md).

## Consideraciones de Seguridad
- **Amenazas STRIDE identificadas:**
  - *Information Disclosure*: el mensaje de error de CA-3 no debe imprimir el valor de
    `JWT_SECRET`/`MONGO_URI`, solo el nombre de la variable faltante.
  - *Tampering*/*Elevation of Privilege*: no aplica directamente — este spec no cambia
    autenticación ni autorización, solo config de arranque.
  - *Denial of Service*: un `process.exit(1)` temprano por config faltante es el comportamiento
    deseado (fail fast), no un riesgo nuevo — ya es el patrón usado en `connectDB` (`db.conf.js`).
- **Controles de mitigación:** validar presencia de la variable, nunca su contenido, en los
  mensajes de log.
- **Inputs que requieren validación:** ninguno nuevo — no se agregan endpoints ni inputs de
  usuario, solo config de proceso leída una vez al arrancar.
- **Secrets involucrados:** `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MONGO_URI` (ya existentes,
  ya en `.gitignore`) — este spec no introduce secrets nuevos, solo valida su presencia.
- **Superficie de ataque afectada:** ninguna — cambios de arranque de proceso, no de runtime
  HTTP.

## Dependencias
- **Internas:** `ecommerce-api/server.js`, `ecommerce-api/src/app.js` (lectura de
  `CORS_ALLOWED_ORIGINS`, sin modificar su lógica de allowlist ya correcta),
  `ecommerce-app/src/services/apiClient.js` (CA-10), un nuevo test de integración para `SEC-001`
  (CA-11, probablemente en `tests/integration/` junto a los demás), `docs/environment-variables.md`,
  `docs/render-deployment.md`, `docs/testing/test-matrix.md` (actualizar `SEC-001` a Implementado
  al cerrar).
- **Externas:** ninguna — no se agrega ninguna dependencia nueva (ni siquiera un validador tipo
  Zod/Joi: el volumen de variables —3 obligatorias— no lo justifica; un chequeo manual explícito
  al inicio de `server.js` es suficiente y no introduce una librería nueva sin necesidad real).

## Decisiones de Diseño
- **No usar Zod/Joi/envalid para validar env vars.** Alternativa considerada y descartada: son 3
  variables obligatorias (`MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`), un `if` explícito al
  inicio de `server.js` es más simple, no agrega una dependencia, y sigue la convención del
  proyecto de no introducir herramientas nuevas sin necesidad real.
- **La validación de `CORS_ALLOWED_ORIGINS` solo es estricta en `NODE_ENV=production`.** En
  desarrollo, el default `http://localhost:3001` debe seguir funcionando sin exigir un `.env`
  completo — no romper `npm run dev` en máquinas nuevas.
- **No tocar `src/app.js`.** La lógica de CORS/allowlist ya es correcta (`S-04`); este spec solo
  agrega la validación de que la variable exista, en `server.js`, antes de que `app.js` la use.
- **Alternativa considerada para CA-3/CA-4: un módulo `src/config/env.js` dedicado**, en vez de
  un `if` inline en `server.js`. El repo de referencia del curso (`2026-2-ReactFS`) resuelve esto
  exactamente así — un módulo que centraliza la lectura/validación de env vars y además gatea si
  Swagger se expone según `NODE_ENV`. No se decide todavía cuál de las dos opciones usar (`if`
  inline vs. módulo dedicado) — queda para el momento de implementar, evaluando si para 3
  variables un módulo aparte se justifica o es sobre-ingeniería para el tamaño real de este
  proyecto.

## Riesgos y Deuda Técnica
- Si Render no permite ver logs de arranque antes de que el health check falle, el mensaje de
  error de CA-3/CA-4 podría no ser visible de inmediato — mitigable revisando los logs del
  servicio manualmente, no bloquea el spec.
- Este spec no cubre monitoreo/alertas si el proceso muere por config faltante — eso es
  `OBS-01`/`E9`, fuera de alcance aquí.

## Pendientes Abiertos y Gaps Detectados
_(se completa durante la implementación — FASE 6 — no aplica todavía: este spec está en DRAFT,
sin implementación iniciada, a la espera de confirmación explícita del usuario para arrancar
`E10`)._

## Matriz de cierre
_(se completa al cerrar — FASE 10 — no aplica todavía)._

## Resultados (se completa al cerrar)
_(no aplica todavía — spec en DRAFT)._
