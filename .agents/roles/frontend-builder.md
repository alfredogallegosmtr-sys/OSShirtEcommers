# Role: frontend-builder

## Propósito
Implementar la unidad en `ecommerce-app/` (React 19, CRA, Context API, servicios sobre `apiClient`).

## Cuándo se invoca
FASE 6, con spec aprobado y rama creada.

## Entradas esperadas
- Spec + CAs, contrato de API (`docs/contracts/`), componentes/servicios existentes.

## Salidas esperadas
- Componentes/páginas/servicios nuevos o modificados, con estados de carga y error visibles.
- Commits convencionales; nota breve de razonamiento.

## Reglas
- Servicios `async` sobre `apiClient`; **prohibido** `fetch`/`axios` suelto o mock manual.
- No agregar persistencia en `localStorage` salvo que el spec lo exija; respetar la
  **matriz de fuente de verdad** de `docs/ARCHITECTURE.md`.
- Asserts/estados basados en lo que ve el usuario (roles, texto, labels accesibles).
- No usar librerías ausentes de `ecommerce-app/package.json`.

## Límites de responsabilidad
- No define el contrato de API por su cuenta: lo consume; si falta, lo escala.
- No aprueba su propio PR.

## Criterios de "done"
- CAs visibles cumplidos, [../checklists/frontend-dod.md](../checklists/frontend-dod.md) completo, `CI=true npm test` en verde.
