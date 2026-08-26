# Validación de datos

A diferencia de otros proyectos de referencia de este curso, **OSShirtEcommers no usa
`express-validator`** como capa de validación declarativa, aunque el paquete está en
`package.json`. No asumir que existen archivos `*Validation` ni un middleware `validate`
genérico — no existen.

El patrón real (ver [code-patterns.md](code-patterns.md)) es validación manual e inline dentro
de cada controller:

- IDs de Mongo: `if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "..." })`.
- Campos requeridos en auth: chequeo manual de `name`/`email`/`password` → 422 si falta alguno.
- Duplicados (email en registro): query previa (`User.findOne({ email })`) → 422 si ya existe.
- Reglas de esquema (`required`, `enum`, `min`, `unique`, etc.) las aplica Mongoose al guardar;
  el error handler global de `server.js` traduce un `ValidationError` de Mongoose a
  `422 { message, errors }`.

Si una tarea necesita validación más estricta (rangos, formatos, sanitización), lo consistente
con el resto del código es agregarla como chequeo manual al inicio del controller, igual que el
resto — no introducir `express-validator` a mitad de un endpoint sin adaptarlo a todos.
