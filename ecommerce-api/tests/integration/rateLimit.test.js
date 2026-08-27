import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";

// Archivo separado a propósito: express-rate-limit guarda su contador en memoria por el
// tiempo de vida del módulo (mismo `app` importado en todo el archivo). Vitest aísla el
// registro de módulos por archivo de test, así que este archivo arranca con el contador
// en 0 -- no se mezcla con las peticiones de login/register de auth.test.js.
describe("Rate limiting (S-05) — /api/auth", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("[negativo] más de 10 intentos de login en la ventana → 429", async () => {
    let lastRes;
    for (let i = 0; i < 11; i += 1) {
      lastRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "nadie@test.com", password: "incorrecta" });
    }

    expect(lastRes.status).toBe(429);
    expect(lastRes.body).toEqual({
      message: "Demasiados intentos, intenta de nuevo en unos minutos",
    });
  });

  it("[negativo] más de 10 intentos de registro en la ventana → 429 (limitador independiente del de login)", async () => {
    // Corre después del test de arriba, que ya agotó el limitador de LOGIN -- si ambos
    // compartieran contador, este test tripearía en la primera petición, no en la 11.
    let lastRes;
    for (let i = 0; i < 11; i += 1) {
      lastRes = await request(app)
        .post("/api/auth/register")
        .send({}); // 422 por campos faltantes en cada intento -- lo que importa es el conteo
    }

    expect(lastRes.status).toBe(429);
    expect(lastRes.body).toEqual({
      message: "Demasiados intentos, intenta de nuevo en unos minutos",
    });
  });
});
