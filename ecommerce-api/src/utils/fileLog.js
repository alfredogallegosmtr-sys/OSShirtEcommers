import { mkdir, appendFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const LOG_DIR = path.join(__dirname, "..", "..", "logs");

// Núcleo compartido: un evento = una línea JSON, append-only. securityLog.js y
// clientLog.js son wrappers delgados sobre esto, cada uno con su propio archivo.
// Un fallo al escribir (ej. permisos de disco) nunca lanza, solo se reporta a
// console.error, para no romper la respuesta HTTP real que disparó el log.
export const appendLogEvent = (filePath, event, details = {}) => {
  const line = `${JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...details,
  })}\n`;

  return mkdir(LOG_DIR, { recursive: true })
    .then(() => appendFile(filePath, line))
    .catch((err) => {
      console.error(`No se pudo escribir el log (${path.basename(filePath)})`, err);
    });
};
