// Fija el puerto del dev server en 3001 por defecto (evita chocar con otros
// proyectos del curso que usan 3000) sin depender de un archivo .env ni de
// una dependencia extra como cross-env -- funciona igual en Windows/Mac/Linux.
process.env.PORT = process.env.PORT || "3001";
require("react-scripts/scripts/start");
