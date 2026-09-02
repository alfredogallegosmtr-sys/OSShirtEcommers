import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { readFile } from "fs/promises";
import app from "../../src/app.js";
import { CLIENT_LOG_FILE } from "../../src/utils/clientLog.js";
import { connectTestDB, closeTestDB } from "./helpers/db.js";

describe("Log integration (/api/logs)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("[happy] POST /client sin token (público) -> 204 y queda escrito en el archivo real", async () => {
    const marker = `log-${Date.now()}-${Math.random()}`;
    const res = await request(app).post("/api/logs/client").send({
      event: "api_error",
      kind: "SERVER_ERROR",
      status: 500,
      path: "/api/products",
      message: marker,
    });

    expect(res.status).toBe(204);

    const content = await readFile(CLIENT_LOG_FILE, "utf-8");
    const entry = content
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))
      .find((e) => e.message === marker);

    expect(entry).toBeDefined();
    expect(entry.event).toBe("api_error");
    expect(entry.kind).toBe("SERVER_ERROR");
    expect(entry.status).toBe(500);
    expect(entry.path).toBe("/api/products");
  });

  it("[negativo] sin 'event' -> 422", async () => {
    const res = await request(app).post("/api/logs/client").send({ message: "sin event" });

    expect(res.status).toBe(422);
  });

  it("[negativo] 'stack' más largo que el límite permitido -> 422", async () => {
    const res = await request(app)
      .post("/api/logs/client")
      .send({ event: "render_error", stack: "x".repeat(5000) });

    expect(res.status).toBe(422);
  });
});
