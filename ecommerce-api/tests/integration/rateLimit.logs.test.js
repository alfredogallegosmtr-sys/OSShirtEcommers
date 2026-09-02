import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, closeTestDB } from "./helpers/db.js";

// Archivo separado a propósito: express-rate-limit guarda su contador en memoria por el
// tiempo de vida del módulo (mismo `app` importado en todo el archivo). Vitest aísla el
// registro de módulos por archivo de test, así que este archivo arranca con el contador
// en 0 -- no se mezcla con las peticiones de log.test.js.
describe("Rate limiting — POST /api/logs/client", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("[negativo] más de 30 eventos en la ventana de 1 minuto → 429", async () => {
    let lastRes;
    for (let i = 0; i < 31; i += 1) {
      lastRes = await request(app).post("/api/logs/client").send({ event: "api_error" });
    }

    expect(lastRes.status).toBe(429);
    expect(lastRes.body).toEqual({
      message: "Demasiados eventos de log, intenta de nuevo más tarde",
    });
  });
});
