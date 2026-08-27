import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import PaymentMethod from "../../src/models/PaymentMethod.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";
import { createUserAndToken, signToken } from "./helpers/auth.js";

const validPayload = () => ({
  type: "credit_card",
  last4: "1111",
  brand: "visa",
});

describe("PaymentMethod integration (/api/payment-methods)", () => {
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
      const fakeId = "64b64b64b64b64b64b64b64";

      const getRes = await request(app).get("/api/payment-methods");
      const postRes = await request(app).post("/api/payment-methods").send(validPayload());
      const putRes = await request(app)
        .put(`/api/payment-methods/${fakeId}`)
        .send({ brand: "mastercard" });
      const deleteRes = await request(app).delete(`/api/payment-methods/${fakeId}`);

      for (const res of [getRes, postRes, putRes, deleteRes]) {
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: "No autorizado" });
      }
    });

    it("[negativo] token inválido/expirado → 401 en cada ruta", async () => {
      const fakeId = "64b64b64b64b64b64b64b64";
      const expiredToken = signToken(
        { userId: fakeId, name: "X", role: "customer" },
        { expiresIn: -1 },
      );
      const authHeader = `Bearer ${expiredToken}`;

      const getRes = await request(app)
        .get("/api/payment-methods")
        .set("Authorization", authHeader);
      const postRes = await request(app)
        .post("/api/payment-methods")
        .set("Authorization", authHeader)
        .send(validPayload());
      const putRes = await request(app)
        .put(`/api/payment-methods/${fakeId}`)
        .set("Authorization", authHeader)
        .send({ brand: "mastercard" });
      const deleteRes = await request(app)
        .delete(`/api/payment-methods/${fakeId}`)
        .set("Authorization", authHeader);

      for (const res of [getRes, postRes, putRes, deleteRes]) {
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: "Token inválido o expirado" });
      }
    });
  });

  describe("Seguridad S-03: rechazo de cardNumber/cvv", () => {
    it("[negativo] POST con cardNumber en el body → 422", async () => {
      const { token } = await createUserAndToken({ email: "pm1@test.com" });

      const res = await request(app)
        .post("/api/payment-methods")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload(), cardNumber: "4111111111111111" });

      expect(res.status).toBe(422);
      const messages = res.body.errors.map((e) => e.msg);
      expect(messages).toContain(
        "No se acepta el número completo de tarjeta; enviar solo 'last4'",
      );
    });

    it("[negativo] POST con cvv en el body → 422", async () => {
      const { token } = await createUserAndToken({ email: "pm2@test.com" });

      const res = await request(app)
        .post("/api/payment-methods")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload(), cvv: "123" });

      expect(res.status).toBe(422);
    });
  });

  describe("Validación de type", () => {
    it("[negativo] POST sin type → 422", async () => {
      const { token } = await createUserAndToken({ email: "pm3@test.com" });
      const { type: _type, ...payload } = validPayload();

      const res = await request(app)
        .post("/api/payment-methods")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(422);
    });

    it("[negativo] POST con type fuera del enum → 422", async () => {
      const { token } = await createUserAndToken({ email: "pm4@test.com" });

      const res = await request(app)
        .post("/api/payment-methods")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload(), type: "crypto" });

      expect(res.status).toBe(422);
    });
  });

  describe("CRUD autorizado", () => {
    it("[happy] POST válido → 201 sin cardNumber ni cvv en la respuesta", async () => {
      const { token } = await createUserAndToken({ email: "pm5@test.com" });

      const res = await request(app)
        .post("/api/payment-methods")
        .set("Authorization", `Bearer ${token}`)
        .send(validPayload());

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ type: "credit_card", last4: "1111", brand: "visa" });
      expect(res.body.cardNumber).toBeUndefined();
      expect(res.body.cvv).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toMatch(/cardNumber|cvv/i);

      const stored = await PaymentMethod.findById(res.body._id).lean();
      expect(stored.cardNumber).toBeUndefined();
      expect(stored.cvv).toBeUndefined();
    });

    it("[happy] isDefault:true en un segundo método desmarca el primero", async () => {
      const { token } = await createUserAndToken({ email: "pm6@test.com" });

      const first = await request(app)
        .post("/api/payment-methods")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload(), isDefault: true });
      expect(first.body.isDefault).toBe(true);

      const second = await request(app)
        .post("/api/payment-methods")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "paypal", paypalEmail: "a@b.com", isDefault: true });
      expect(second.body.isDefault).toBe(true);

      const listRes = await request(app)
        .get("/api/payment-methods")
        .set("Authorization", `Bearer ${token}`);

      const firstStored = listRes.body.find((m) => m._id === first.body._id);
      const secondStored = listRes.body.find((m) => m._id === second.body._id);
      expect(firstStored.isDefault).toBe(false);
      expect(secondStored.isDefault).toBe(true);
    });

    it("[negativo] PUT de otro usuario → 404", async () => {
      const { token: tokenA } = await createUserAndToken({ email: "pmA@test.com" });
      const { token: tokenB } = await createUserAndToken({ email: "pmB@test.com" });

      const created = await request(app)
        .post("/api/payment-methods")
        .set("Authorization", `Bearer ${tokenA}`)
        .send(validPayload());

      const res = await request(app)
        .put(`/api/payment-methods/${created.body._id}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ brand: "mastercard" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Método de pago no encontrado" });
    });

    it("[happy] DELETE /:id happy → 204", async () => {
      const { token } = await createUserAndToken({ email: "pm7@test.com" });

      const created = await request(app)
        .post("/api/payment-methods")
        .set("Authorization", `Bearer ${token}`)
        .send(validPayload());

      const res = await request(app)
        .delete(`/api/payment-methods/${created.body._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(204);

      const stored = await PaymentMethod.findById(created.body._id);
      expect(stored).toBeNull();
    });
  });
});
