import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { readFile } from "fs/promises";
import app from "../../src/app.js";
import User from "../../src/models/User.js";
import { SECURITY_LOG_FILE } from "../../src/utils/securityLog.js";
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

    it("[negativo] password de menos de 6 caracteres (S-06) → 422, y no crea el usuario", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Ana",
        email: "cortita@test.com",
        password: "abc12",
      });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({
        message: "La contraseña debe tener al menos 6 caracteres",
      });

      const stored = await User.findOne({ email: "cortita@test.com" });
      expect(stored).toBeNull();
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

    it("[negativo] sin password en el body → 422 'Email y password son requeridos'", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "sinpass-login@test.com",
      });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ message: "Email y password son requeridos" });
    });

    it("[negativo] login fallido (S-07) → queda un evento real 'login_failed' en el log de seguridad", async () => {
      // Email único por corrida: el archivo es un recurso compartido entre archivos de
      // test que corren en paralelo, así que se busca por este valor en todo el
      // archivo en vez de asumir "es la última línea".
      const uniqueEmail = `nadie-registrado-${Date.now()}-${Math.random()}@test.com`;

      const res = await request(app).post("/api/auth/login").send({
        email: uniqueEmail,
        password: "loquesea1",
      });
      expect(res.status).toBe(401);

      const content = await readFile(SECURITY_LOG_FILE, "utf-8");
      const entry = content
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line))
        .find((e) => e.email === uniqueEmail);

      expect(entry).toBeDefined();
      expect(entry.event).toBe("login_failed");
      expect(JSON.stringify(entry)).not.toMatch(/loquesea1/);
    });
  });
});
