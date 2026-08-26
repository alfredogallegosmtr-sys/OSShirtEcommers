# PR Checklist (lo marca el revisor, no el autor)

## Alcance
- [ ] El PR resuelve **un solo** pendiente (1=1=1=1)
- [ ] Corresponde a un spec aprobado y enlazado

## Calidad
- [ ] Convención del repo respetada (backend ESM / frontend servicios)
- [ ] Sin código muerto ni temporal sin marcar
- [ ] Tests presentes, con al menos un caso negativo por regla
- [ ] Sin tests tautológicos ni exceso de mocks

## Seguridad
- [ ] Sin secretos en el diff
- [ ] Auth/roles validados por token (si aplica)
- [ ] Datos sensibles tratados correctamente

## Anti-alucinación
- [ ] Archivos/rutas/libs/endpoints citados existen
- [ ] Sin contratos de API asumidos

## Gobernanza
- [ ] El autor no es el aprobador
- [ ] ADR presente si cambió arquitectura
- [ ] Spec/tests/docs actualizados según corresponda
