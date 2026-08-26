# Definition of Done — Backend (ecommerce-api)

- [ ] CAs del spec cumplidos
- [ ] ESM con imports `.js`; controllers `async (req, res)` sin `try/catch` (Express 5 reenvía
      rechazos al error handler solo)
- [ ] Validación manual inline (`mongoose.isValidObjectId`, chequeos de campos requeridos);
      422/404 según corresponda — ver [.claude/validators.md](../../.claude/validators.md)
- [ ] `res.status().json()`; 204 en delete; 404 en no encontrado
- [ ] Rutas que requieren sesión usan `requireAuth`; `req.user.id` viene del token, nunca del body
- [ ] Sin secretos hardcodeados; `.env*` en `.gitignore`
- [ ] Contrato en `docs/contracts/` actualizado si cambió la API
- [ ] Endpoint probado manualmente (curl o cliente real) contra Mongo local; si el proyecto ya
      tiene tests configurados para ese módulo, la suite pasa
- [ ] Nota de razonamiento en el PR
