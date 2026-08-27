import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import User from "../../src/models/User.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";

describe("Auth integration (/api/auth)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("POST /api/auth/register", () => {
    it("[happy] registra un usuario nuevo → 201 sin password en la respuesta", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Ana",
        email: "ana@test.com",
        password: "Secret123!",
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: "Ana",
        email: "ana@test.com",
        role: "customer",
      });
      expect(res.body.id).toBeDefined();
      expect(res.body.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/); // sin hash bcrypt en el body

      const stored = await User.findOne({ email: "ana@test.com" });
      expect(stored).not.toBeNull();
      expect(stored.password).not.toBe("Secret123!");
    });

    it("[negativo] email duplicado → 422 'User already exist'", async () => {
      await request(app).post("/api/auth/register").send({
        name: "Ana",
        email: "dup@test.com",
        password: "Secret123!",
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "Otro",
        email: "dup@test.com",
        password: "OtherPass1!",
      });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ message: "User already exist" });
    });

    it("[negativo] faltan campos requeridos → 422", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "sinpass@test.com",
      });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({
        message: "Nombre, email y password son requeridos",
      });
    });
  });

  describe("POST /api/auth/login", () => {
    it("[happy] credenciales válidas → 200 con token y refreshToken, sin password", async () => {
      await request(app).post("/api/auth/register").send({
        name: "Ana",
        email: "login@test.com",
        password: "Secret123!",
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "login@test.com",
        password: "Secret123!",
      });

      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe("string");
      expect(typeof res.body.refreshToken).toBe("string");
      expect(res.body.password).toBeUndefined();

      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({ name: "Ana", role: "customer" });
      expect(decoded.userId).toBeDefined();
    });

    it("[negativo] password incorrecto → 401", async () => {
      await request(app).post("/api/auth/register").send({
        name: "Ana",
        email: "wrongpass@test.com",
        password: "Secret123!",
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "wrongpass@test.com",
        password: "NopeNope1!",
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Credenciales inválidas" });
    });

    it("[negativo] email inexistente → 401", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "noexiste@test.com",
        password: "Whatever1!",
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Credenciales inválidas" });
    });
  });
});
