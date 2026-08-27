# Estrategia de pruebas — OSShirtEcommers

> Este documento es el índice de la estrategia integral. El detalle técnico de cada suite
> (dependencias, cómo correrlas, decisiones de diseño puntuales como MSW v1 o por qué no hay
> `cypress/fixtures/`) sigue viviendo en [docs/testing.md](../testing.md) — no se duplica aquí.
> Lo nuevo de esta carpeta es la vista **integral** que cruza los 4 niveles por escenario de
> negocio real: la matriz ([test-matrix.md](test-matrix.md)), los datos de prueba
> ([test-data.md](test-data.md)), los comandos ([running-tests.md](running-tests.md)) y los
> bloqueos conocidos ([known-issues.md](known-issues.md)).

## Objetivo

Que cada regla de negocio real del ecommerce (autenticación, catálogo, carrito, checkout, órdenes)
esté probada en el nivel que le corresponde, sin que la única red de seguridad de un flujo crítico
sea Cypress (frágil por naturaleza, y en este proyecto bloqueado en la máquina de desarrollo
actual — ver [known-issues.md](known-issues.md)).

## Pirámide de pruebas

```
        E2E (Cypress)               20 casos escritos, sin ejecutar en runner real
     ───────────────────
   Integración de API              47+ casos (Vitest + Supertest + mongodb-memory-server)
 ───────────────────────────
Unitario backend + frontend        60 backend + 302 frontend (Vitest / Jest+RTL)
```

Este proyecto no separa "integración de API" de "unitario backend" en dos runners distintos —
Vitest corre ambos con la misma herramienta (`mongodb-memory-server` da una base de datos real
sin necesidad de un servicio externo), así que la proporción real hoy es aproximadamente
**85% unitario+integración / 15% E2E**, más cargada hacia la base que la referencia 60/25/15.
Es una consecuencia correcta del stack, no una desviación a corregir.

### Responsabilidad de cada nivel

- **Unitario backend** (Vitest, sin red ni DB real): reglas de schema de Mongoose
  (`required`/`enum`/`min`), middlewares puros (`requireAuth`, `requireAdmin`, `validate`).
- **Integración de API** (Vitest + Supertest + `mongodb-memory-server`, DB real en memoria):
  cada endpoint real, cada rama HTTP (2xx/401/403/404/422), persistencia, aislamiento entre
  usuarios, efectos secundarios (vaciar carrito al crear orden, desmarcar `isDefault`, etc.).
- **Unitario + integración frontend** (Jest + RTL + MSW, sin red real): comportamiento visible de
  componentes/páginas/Context, siempre contra la API interceptada por MSW — nunca contra
  `fetch`/`axios` mockeados a mano.
- **E2E** (Cypress): solo los flujos completos desde la perspectiva del usuario donde importa que
  todas las capas reales trabajen juntas — registro, login, checkout de principio a fin. No
  duplica validaciones de campo ya cubiertas en RTL.

## Alcance

Cubre backend (`ecommerce-api`) y frontend (`ecommerce-app`) de este monorepo. Fuera de alcance:
pruebas de carga (`OBS-01`, trackeado en `docs/backlog.md`), pruebas de contrato con una librería
de esquemas nueva (ver la sección de contrato más abajo — se resolvió sin agregar dependencia).

## Contratos frontend-backend

El brief original de esta estrategia pedía evaluar si hace falta Zod/JSON Schema/OpenAPI para
detectar inconsistencias entre la API y React. Auditando el código real: **no se introduce una
dependencia nueva** porque el riesgo ya está cubierto de otra forma — los tests de integración
frontend (Tipo B en la auditoría, ej. `Checkout.test.jsx`) interceptan la respuesta real con MSW
y afirman sobre la forma exacta del payload que el frontend envía y espera recibir, y los tests de
integración backend afirman sobre la forma exacta de la respuesta real. Cuando ambos existen para
el mismo endpoint, cualquier cambio de contrato rompe al menos uno de los dos sin necesitar una
tercera herramienta.

| Endpoint | Consumidor frontend | Contrato validado | Riesgo |
|---|---|---|---|
| `POST /api/auth/register` | `authService.register` / `RegisterForm` | Sí (ambos lados) | Bajo |
| `POST /api/auth/login` | `authService.login` / `LoginForm` | Sí (ambos lados) | Bajo |
| `GET/POST/PUT/DELETE /api/cart` | `cartService` / `CartContext` | Sí (ambos lados) | Bajo |
| `GET /api/products*` | `productsService` | Sí (ambos lados) | Bajo |
| `GET/POST/PUT/DELETE /api/addresses` | `addressService` / `AddressForm`,`AddressList` | Sí (ambos lados, 2026-08-27) | Bajo |
| `GET/POST/PUT/DELETE /api/payment-methods` | `paymentMethodService` / `PaymentForm`,`PaymentList` | Sí (ambos lados, 2026-08-27) | Bajo |
| `GET/POST /api/orders` | `orderService` / `Checkout.jsx`,`Orders.jsx` | Sí (ambos lados, 2026-08-27) | Bajo |
| `GET/POST/DELETE /api/wishlist` | `wishlistService` / `WishList.jsx` | Sí (ambos lados, 2026-08-27) | Bajo |
| `GET/PUT /api/users/me*` | `userService` / `Profile.jsx`,`Setttings.jsx` | Sí (ambos lados, 2026-08-27) | Bajo |

## Criterios de aceptación

- Ningún flujo crítico (auth, carrito, checkout/órdenes) depende solo de Cypress para su
  cobertura real.
- Ningún test nuevo reemplaza o borra uno existente que ya validaba comportamiento real.
- Ningún hallazgo de comportamiento real distinto al esperado se oculta cambiando el test — se
  documenta en [known-issues.md](known-issues.md) o en `docs/backlog.md` como bug.
- La matriz ([test-matrix.md](test-matrix.md)) refleja el estado real verificado, no aspiracional.
