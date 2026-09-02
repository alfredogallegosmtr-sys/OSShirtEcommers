import path from "path";
import { appendLogEvent, LOG_DIR } from "./fileLog.js";

// Eventos reportados por el frontend (fallos de fetch clasificados, errores de render
// atrapados por ErrorBoundary) -- ver POST /api/logs/client. Archivo propio, separado
// de security.log: son diagnóstico general, no eventos de seguridad.
const LOG_FILE = path.join(LOG_DIR, "client.log");

export const logClientEvent = (event, details = {}) => appendLogEvent(LOG_FILE, event, details);

export const CLIENT_LOG_FILE = LOG_FILE;
