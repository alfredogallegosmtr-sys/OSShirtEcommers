import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

// Este archivo NO llama a connectTestDB a propósito: Vitest aísla el registro de
// módulos por archivo de test, así que mongoose.connection acá arranca genuinamente
// desconectado (readyState 0), sin necesidad de mockear nada -- es el estado real de
// una conexión que nunca se abrió, el mismo síntoma que un Atlas inalcanzable.
describe("GET /api/health (Mongo desconectado)", () => {
  it("[negativo] 503, status degraded, db.status down, db.readyState 0", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("degraded");
    expect(res.body.db).toEqual({ status: "down", readyState: 0 });
  });
});
