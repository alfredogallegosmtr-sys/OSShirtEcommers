import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, closeTestDB } from "./helpers/db.js";

describe("Security headers (S-09): helmet", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("[happy] respuesta de la API trae los headers de seguridad de helmet", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["content-security-policy"]).toContain("default-src 'self'");
  });

  it("[happy] /api-docs sigue sirviendo la UI real de Swagger (sin CSP bloqueando sus scripts/estilos inline)", async () => {
    const res = await request(app).get("/api-docs/").redirects(0);

    expect(res.status).toBe(200);
    expect(res.headers["content-security-policy"]).toBeUndefined();
    expect(res.text).toContain("swagger-ui");
  });
});
