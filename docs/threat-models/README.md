# docs/threat-models

Modelos de amenaza STRIDE por módulo sensible. **Owner:** `security-reviewer`.

- Un archivo por módulo con superficie de ataque relevante (p. ej. `auth.md`, `payments.md`).
- Por amenaza (Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation): vector,
  severidad y control de mitigación.
- Riesgos ya cerrados (2026-08-26): control por rol en `products`/`categories`
  (`requireAuth`+`requireAdmin`, `S-01`/`S-02`) y almacenamiento de tarjeta (`PaymentMethod` ya
  no guarda `cardNumber`/`cvv`, solo `last4`/`brand` — ver `.claude/models.md`, `S-03`).
  `cors()` sin allowlist sigue siendo el riesgo de auth vigente (`S-04`).
