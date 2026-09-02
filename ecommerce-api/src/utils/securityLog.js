import path from "path";
import { appendLogEvent, LOG_DIR } from "./fileLog.js";

// S-07: antes no se registraba ningún evento de seguridad (401 de requireAuth, 403 de
// requireAdmin, login fallido) — un ataque pasaba invisible. Log a archivo plano, sin
// agregar una librería de logging nueva (mismo criterio que el resto del proyecto: no
// introducir una dependencia sin necesidad real). Nunca recibe el password ni el token
// completo, solo metadata (ip, ruta, email intentado).
//
// Los callers reales (requireAuth/requireAdmin/login) sí la esperan (await) antes de
// responder, para no correr una carrera entre "ya respondí" y "ya quedó escrito el
// evento" -- el escritor real (appendLogEvent, en fileLog.js) nunca lanza.
const LOG_FILE = path.join(LOG_DIR, "security.log");

export const logSecurityEvent = (event, details = {}) => appendLogEvent(LOG_FILE, event, details);

export const SECURITY_LOG_FILE = LOG_FILE;
