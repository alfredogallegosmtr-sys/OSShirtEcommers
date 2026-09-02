import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, closeTestDB } from "./helpers/db.js";

describe("GET /api/health (Mongo conectado)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("[happy] 200, status ok, db.status up, db.readyState 1", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toEqual({ status: "up", readyState: 1 });
    expect(typeof res.body.uptime).toBe("number");
    expect(new Date(res.body.timestamp).toString()).not.toBe("Invalid Date");
  });
});
