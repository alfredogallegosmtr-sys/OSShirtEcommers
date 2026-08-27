# Bugs, bloqueos y deuda técnica conocidos — testing

> Bugs de la aplicación en sí viven en `docs/backlog.md` (fuente de verdad). Este archivo es
> específico de la infraestructura y ejecución de pruebas.

## Bloqueos de entorno

### Cypress no puede ejecutarse en esta máquina de desarrollo (Windows)

`Cypress.exe` (reinstalado limpio, firma Authenticode válida, `resources/app` completo) falla su
propio smoke-test interno con `bad option: --smoke-test` (exit code 9) — un formato de error
atípico para un binario Electron, reproducido idéntico en Git Bash y PowerShell nativo. Se agotó
el diagnóstico seguro (reinstalación, `cypress verify`, verificación de firma, `Unblock-File`,
traza `DEBUG=cypress:cli` confirmando que el CLI arma y lanza el comando correcto) sin encontrar
causa raíz — es consistente con una restricción de seguridad/OS específica de esta máquina, no del
proyecto. No se intentó nada más invasivo (deshabilitar antivirus, cambiar políticas de Windows)
sin autorización explícita.

**Mitigación aplicada:** las 20 aserciones de las 3 specs se verificaron equivalentemente con
Playwright contra la app real (backend + frontend + MongoDB reales) — no es un sustituto de correr
Cypress, es evidencia de que la lógica y los selectores de las specs son correctos.

**Próximo paso:** confirmar el job `e2e` de `.github/workflows/ci-cd.yml` en un runner real de
GitHub Actions (Ubuntu), o correr `npm run test:e2e` en otra máquina de desarrollo.

### ~~Job `e2e` de CI nunca visto correr~~ — resuelto (2026-08-27)

Confirmado con una ejecución real: [run 33061741394](https://github.com/alfredogallegosmtr-sys/OSShirtEcommers/actions/runs/33061741394),
**las 20 specs de Cypress pasaron en verde** (`login.cy.js` 8/8, `register.cy.js` 6/6,
`checkout.cy.js` 6/6) en Ubuntu vía `cypress-io/github-action@v6`. El bloqueo de la máquina
Windows de desarrollo (arriba) sigue sin resolverse, pero ya no bloquea nada — CI es ahora el
runner real de referencia. En el camino de conseguir la primera corrida verde se encontraron y
corrigieron, en orden:
1. `PORT: 4001` (pensado solo para la API) vivía en el `env` a nivel de job y se filtraba al
   `npm start` del frontend, haciéndolo intentar levantar en el puerto equivocado.
2. Al frontend le faltaba `PORT: 3001` explícito — `ecommerce-app/.env` (que lo fija localmente)
   está en `.gitignore` y no existe en el checkout de CI, así que arrancaba en el default de
   `react-scripts` (3000) y `wait-on` nunca conectaba a :3001.
3. Dos selectores de `checkout.cy.js` sin anclar (`/envío/i`, `/total:/i`) matcheaban también
   "Dirección de envío" y "Subtotal:" respectivamente — `Found multiple elements`.
4. **`B-16`** (bug real de la app, no de CI): condición de carrera en `CartContext.updateItem` —
   ver `docs/backlog.md`.

## Deuda técnica de la suite

- **Sin `coverageThreshold`/`thresholds`** en ningún runner (ni `vitest.config.js` ni la config de
  Jest de CRA) — decisión deliberada, no un olvido: este proyecto no persigue un % global de
  cobertura (ver `strategy.md`). El job de CI corre `--coverage` solo para visibilidad, nada falla
  todavía por un número.
- **Sin lint en CI**: ningún `package.json` (`ecommerce-api` ni `ecommerce-app`) tiene script
  `lint`/`format:check` — agregar ESLint/Prettier con esos scripts es un paso previo no hecho
  todavía (`CI-01`, `docs/backlog.md`).
- **`jsdom` no implementa la Constraint Validation API**: las validaciones nativas de HTML5
  (`required`, `type="email"` bloqueando el submit) no se pueden probar en Jest/RTL — documentado
  explícitamente dentro de `PaymentForm.test.jsx`/`AddressForm.test.jsx`. Ese hueco lo cubren las
  specs de Cypress (`login.cy.js`, `register.cy.js`), que a su vez están bloqueadas por el punto
  de arriba — es un hueco real y consciente hasta que Cypress corra en algún entorno.
- **Sin `DELETE /api/orders`**: las órdenes creadas durante pruebas E2E/manuales contra un Mongo
  real se acumulan sin forma de limpiarlas — aceptado como limitación de diseño (no se pidió
  agregar ese endpoint solo para testing).
- **Exclude muerto en `vitest.config.js`**: `coverage.exclude` apunta a
  `src/config/db.config_practice.js`, archivo que no existe en el repo (el real es
  `src/config/db.conf.js`, ya incluido en cobertura). No rompe nada, es cosmético.
- **`vitest.config.js` usa `coverage.all: true`**: `src/seed/seed copy.js` (archivo real, nunca
  importado por nada) entra al denominador de cobertura y la deprime artificialmente. No se
  corrigió en esta pasada porque tocar el `exclude` es un cambio de configuración fuera del
  alcance pedido — queda anotado para cuando se revise `T-04`/cobertura de nuevo.
- ~~`requireAdmin`, y los 5 recursos backend sin integración~~ — **resuelto (2026-08-27)**: 51
  casos nuevos agregados (`address`, `paymentMethod`, `order`, `wishlist`, `user`,
  `requireAdmin`, login 422), `npm test` confirma 158/158 en verde. Ver
  [test-matrix.md](test-matrix.md).

## Bugs de aplicación relevantes para testing (detalle completo en `docs/backlog.md`)

- **B-15** (corregido): doble clic en "Confirmar y Pagar" podía crear dos órdenes — sin bandera de
  envío en curso. Test de regresión en `Checkout.test.jsx`.
- **B-13** (descripción corregida, código ya era correcto): la causa real del crash de
  `OrderConfirmation.jsx` es una navegación fresca sin `location.state` (URL directa/bookmark), no
  un F5 — un reload real preserva el estado vía History API.
- **B-16** (corregido, encontrado por `checkout.cy.js` corriendo de verdad en CI): dos cambios de
  cantidad rápidos sobre el mismo ítem del carrito (+/- en sucesión) podían dejar la cantidad en
  un valor obsoleto por una condición de carrera en `CartContext.updateItem` (la respuesta de la
  petición vieja llegaba después que la de la más reciente y pisaba el estado). Fix: contador de
  secuencia por ítem que descarta respuestas obsoletas. Test de regresión en `CartContext.test.jsx`
  (confirmado que falla sin el fix, revirtiéndolo temporalmente antes de commitear).
