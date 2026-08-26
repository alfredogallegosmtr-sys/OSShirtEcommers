# docs/threat-models

Modelos de amenaza STRIDE por módulo sensible. **Owner:** `security-reviewer`.

- Un archivo por módulo con superficie de ataque relevante (p. ej. `auth.md`, `payments.md`).
- Por amenaza (Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation): vector,
  severidad y control de mitigación.
- Prioridad inicial conocida en este repo: pagos (`PaymentMethod` guarda `cardNumber`/`cvv` en
  texto plano — ver `.claude/models.md`) y auth (no hay control por rol pese a que `User.role`
  existe; las rutas de escritura de `products`/`categories` están sin proteger).
