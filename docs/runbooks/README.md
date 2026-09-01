# docs/runbooks

Procedimientos operativos reproducibles y notas de aprendizaje.

- Arranque local: backend en `:4001` (`cd ecommerce-api && npm start`, o `npm run dev` con
  nodemon), frontend en `:3001` (`cd ecommerce-app && npm start`, puerto fijado en su `.env`),
  seed (`cd ecommerce-api && npm run seed`), variables de entorno, troubleshooting común.
- [render-logs-diagnostico.md](./render-logs-diagnostico.md) — cómo leer los logs del backend en
  Render ante un fallo en producción: qué mirar primero, tabla síntoma→causa real de este
  proyecto, y un caso real ya vivido (no confundir un gate de `ENABLE_DOCS` con un deploy viejo).
- Notas de aprendizaje (`learning-coach`): qué falló, por qué, cómo se evita.
- Un archivo por procedimiento: `[tema].md`.
