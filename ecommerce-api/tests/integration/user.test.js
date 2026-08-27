import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";
import { createUserAndToken, signToken } from "./helpers/auth.js";

describe("User integration (/api/users)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("requireAuth en todas las rutas", () => {
    it("[negativo] sin token → 401 en cada ruta", async () => {
      const getRes = await request(app).get("/api/users/me");
      const putRes = await request(app).put("/api/users/me").send({ name: "X" });
      const passwordRes = await request(app)
        .put("/api/users/me/password")
        .send({ currentPassword: "a", newPassword: "bbbbbb" });

      for (const res of [getRes, putRes, passwordRes]) {
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: "No autorizado" });
      }
    });

    it("[negativo] token inválido/expirado → 401 en cada ruta", async () => {
      const expiredToken = signToken(
        { userId: "64b64b64b64b64b64b64b64", name: "X", role: "customer" },
        { expiresIn: -1 },
      );
      const authHeader = `Bearer ${expiredToken}`;

      const getRes = await request(app).get("/api/users/me").set("Authorization", authHeader);
      const putRes = await request(app)
        .put("/api/users/me")
        .set("Authorization", authHeader)
        .send({ name: "X" });
      const passwordRes = await request(app)
        .put("/api/users/me/password")
        .set("Authorization", authHeader)
        .send({ currentPassword: "a", newPassword: "bbbbbb" });

      for (const res of [getRes, putRes, passwordRes]) {
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: "Token inválido o expirado" });
      }
    });
  });

  describe("GET /me", () => {
    it("[happy] devuelve el usuario sin el campo password", async () => {
      const { token } = await createUserAndToken({ email: "user1@test.com" });

      const res = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("user1@test.com");
      expect(res.body.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
    });
  });

  describe("PUT /me", () => {
    it("[happy] actualiza solo name → 200, email sin cambios", async () => {
      const { token } = await createUserAndToken({ email: "user2@test.com", name: "Original" });

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Actualizado" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Actualizado");
      expect(res.body.email).toBe("user2@test.com");
    });

    it("[negativo] email ya usado por otro usuario → 422 'User already exist'", async () => {
      await createUserAndToken({ email: "tomado@test.com" });
      const { token } = await createUserAndToken({ email: "user3@test.com" });

      const res = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "tomado@test.com" });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ message: "User already exist" });
    });
  });

  describe("PUT /me/password", () => {
    it("[negativo] currentPassword incorrecto → 401", async () => {
      const { token } = await createUserAndToken({
        email: "user4@test.com",
        password: "Secret123!",
      });

      const res = await request(app)
        .put("/api/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "Incorrecta1!", newPassword: "NuevaPass1!" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "La contraseña actual no es correcta" });
    });

    it("[negativo] newPassword de menos de 6 caracteres → 422", async () => {
      const { token } = await createUserAndToken({
        email: "user5@test.com",
        password: "Secret123!",
      });

      const res = await request(app)
        .put("/api/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "Secret123!", newPassword: "abc" });

      expect(res.status).toBe(422);
    });

    it("[happy] cambia la contraseña y permite login con la nueva", async () => {
      const { token } = await createUserAndToken({
        email: "user6@test.com",
        password: "Secret123!",
      });

      const res = await request(app)
        .put("/api/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "Secret123!", newPassword: "NuevaPass1!" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Contraseña actualizada" });

      const loginRes = await request(app).post("/api/auth/login").send({
        email: "user6@test.com",
        password: "NuevaPass1!",
      });

      expect(loginRes.status).toBe(200);
      expect(typeof loginRes.body.token).toBe("string");
    });
  });
});
