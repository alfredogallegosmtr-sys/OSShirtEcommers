import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import { logClientEvent, CLIENT_LOG_FILE } from "../../../src/utils/clientLog.js";

// Escribe al archivo real (logs/ está en .gitignore) -- se prueba el comportamiento
// real de escritura, no una versión mockeada de fs. El archivo es un recurso
// compartido entre archivos de test que corren en paralelo, así que cada caso usa un
// marcador único (no asume "es la última línea") y nunca borra el archivo completo.
describe("logClientEvent (src/utils/clientLog.js)", () => {
  const findEntry = (content, marker) =>
    content
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))
      .find((entry) => entry.marker === marker);

  it("[happy] escribe una línea JSON real con timestamp, event y los detalles dados", async () => {
    const marker = `unit-${Date.now()}-${Math.random()}`;
    await logClientEvent("api_error", { kind: "SERVER_ERROR", status: 500, marker });

    const content = await readFile(CLIENT_LOG_FILE, "utf-8");
    const entry = findEntry(content, marker);

    expect(entry).toBeDefined();
    expect(entry.event).toBe("api_error");
    expect(entry.kind).toBe("SERVER_ERROR");
    expect(entry.status).toBe(500);
    expect(new Date(entry.timestamp).toString()).not.toBe("Invalid Date");
  });

  it("[happy] dos eventos seguidos quedan como líneas separadas (append, no overwrite)", async () => {
    const marker = `unit-append-${Date.now()}-${Math.random()}`;
    await logClientEvent("first_event", { marker });
    await logClientEvent("second_event", { marker });

    const content = await readFile(CLIENT_LOG_FILE, "utf-8");
    const events = content
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))
      .filter((entry) => entry.marker === marker)
      .map((entry) => entry.event);

    expect(events).toEqual(["first_event", "second_event"]);
  });
});
