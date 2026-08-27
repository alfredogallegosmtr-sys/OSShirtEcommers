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

### Job `e2e` de CI nunca visto correr

El job fue diseñado y justificado línea por línea contra el código real (`seed.js`,
`cypress.config.js`, `db.conf.js`), pero no hay forma de disparar GitHub Actions desde este
entorno de trabajo — no se ha confirmado con una ejecución real. Ubuntu es un entorno distinto al
bloqueo de Windows de arriba, así que es razonable esperar que sí funcione ahí, pero es una
expectativa, no un hecho verificado.

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
