import { mkdir, appendFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "security.log");

// S-07: antes no se registraba ningún evento de seguridad (401 de requireAuth, 403 de
// requireAdmin, login fallido) — un ataque pasaba invisible. Log a archivo plano, sin
// agregar una librería de logging nueva (mismo criterio que el resto del proyecto: no
// introducir una dependencia sin necesidad real). Nunca recibe el password ni el token
// completo, solo metadata (ip, ruta, email intentado).
//
// Los callers reales (requireAuth/requireAdmin/login) sí la esperan (await) antes de
// responder, para no correr una carrera entre "ya respondí" y "ya quedó escrito el
// evento" -- pero un fallo al escribir el log (ej. permisos de disco) nunca lanza,
// solo se reporta a console.error, para no romper la respuesta HTTP real.
export const logSecurityEvent = (event, details = {}) => {
  const line = `${JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...details,
  })}\n`;

  return mkdir(LOG_DIR, { recursive: true })
    .then(() => appendFile(LOG_FILE, line))
    .catch((err) => {
      console.error("No se pudo escribir el log de seguridad", err);
    });
};

export const SECURITY_LOG_FILE = LOG_FILE;
