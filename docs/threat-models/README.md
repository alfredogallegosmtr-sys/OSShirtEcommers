# docs/threat-models

Modelos de amenaza STRIDE por módulo sensible. **Owner:** `security-reviewer`.

- Un archivo por módulo con superficie de ataque relevante (p. ej. `auth.md`, `payments.md`).
- Por amenaza (Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation): vector,
  severidad y control de mitigación.
- Riesgos ya cerrados (2026-08-26): control por rol en `products`/`categories`
  (`requireAuth`+`requireAdmin`, `S-01`/`S-02`), almacenamiento de tarjeta (`PaymentMethod` ya
  no guarda `cardNumber`/`cvv`, solo `last4`/`brand` — ver `.claude/models.md`, `S-03`), y `cors()`
  con allowlist real vía `CORS_ALLOWED_ORIGINS` (default `http://localhost:3001` si no se define
  — ver `docs/environment-variables.md`, `S-04`). No queda ningún riesgo de `E4` sin cerrar.
