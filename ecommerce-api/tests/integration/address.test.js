import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Address from "../../src/models/Address.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";
import { createUserAndToken, signToken } from "./helpers/auth.js";

const validPayload = () => ({
  address: "Calle Falsa 123",
  city: "Springfield",
  state: "SP",
  postalCode: "12345",
  country: "Argentina",
  phone: "5551234567",
});

describe("Address integration (/api/addresses)", () => {
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

      const getRes = await request(app).get("/api/addresses");
      const postRes = await request(app).post("/api/addresses").send(validPayload());
      const putRes = await request(app).put(`/api/addresses/${fakeId}`).send({ city: "X" });
      const deleteRes = await request(app).delete(`/api/addresses/${fakeId}`);

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

      const getRes = await request(app).get("/api/addresses").set("Authorization", authHeader);
      const postRes = await request(app)
        .post("/api/addresses")
        .set("Authorization", authHeader)
        .send(validPayload());
      const putRes = await request(app)
        .put(`/api/addresses/${fakeId}`)
        .set("Authorization", authHeader)
        .send({ city: "X" });
      const deleteRes = await request(app)
        .delete(`/api/addresses/${fakeId}`)
        .set("Authorization", authHeader);

      for (const res of [getRes, postRes, putRes, deleteRes]) {
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: "Token inválido o expirado" });
      }
    });
  });

  describe("CRUD autorizado", () => {
    it("[happy] POST / con body válido → 201, refleja los campos enviados", async () => {
      const { token } = await createUserAndToken({ email: "addr1@test.com" });
      const payload = validPayload();

      const res = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject(payload);
    });

    it("[negativo] POST sin 'address' (campo requerido) → 422", async () => {
      const { token } = await createUserAndToken({ email: "addr2@test.com" });
      const { address, ...payload } = validPayload();

      const res = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(422);
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it("[happy] isDefault:true en una segunda dirección desmarca la primera", async () => {
      const { token } = await createUserAndToken({ email: "addr3@test.com" });

      const first = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload(), isDefault: true });
      expect(first.body.isDefault).toBe(true);

      const second = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validPayload(), address: "Otra calle 456", isDefault: true });
      expect(second.body.isDefault).toBe(true);

      const listRes = await request(app)
        .get("/api/addresses")
        .set("Authorization", `Bearer ${token}`);

      const firstStored = listRes.body.find((a) => a._id === first.body._id);
      const secondStored = listRes.body.find((a) => a._id === second.body._id);
      expect(firstStored.isDefault).toBe(false);
      expect(secondStored.isDefault).toBe(true);
    });

    it("[negativo] PUT con id válido pero inexistente → 404", async () => {
      const { token } = await createUserAndToken({ email: "addr4@test.com" });
      const fakeId = "64b64b64b64b64b64b64b640";

      const res = await request(app)
        .put(`/api/addresses/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ city: "Nueva ciudad" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Dirección no encontrada" });
    });

    it("[negativo] PUT de una dirección de OTRO usuario → 404 (aislamiento)", async () => {
      const { token: tokenA } = await createUserAndToken({ email: "addrA@test.com" });
      const { token: tokenB } = await createUserAndToken({ email: "addrB@test.com" });

      const created = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${tokenA}`)
        .send(validPayload());

      const res = await request(app)
        .put(`/api/addresses/${created.body._id}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ city: "Hackeada" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Dirección no encontrada" });
    });

    it("[happy] DELETE /:id happy → 204, luego GET / ya no la incluye", async () => {
      const { token } = await createUserAndToken({ email: "addr5@test.com" });

      const created = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${token}`)
        .send(validPayload());

      const res = await request(app)
        .delete(`/api/addresses/${created.body._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(204);

      const listRes = await request(app)
        .get("/api/addresses")
        .set("Authorization", `Bearer ${token}`);
      expect(listRes.body.map((a) => a._id)).not.toContain(created.body._id);

      const stored = await Address.findById(created.body._id);
      expect(stored).toBeNull();
    });

    it("[negativo] DELETE de otro usuario → 404", async () => {
      const { token: tokenA } = await createUserAndToken({ email: "addrC@test.com" });
      const { token: tokenB } = await createUserAndToken({ email: "addrD@test.com" });

      const created = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${tokenA}`)
        .send(validPayload());

      const res = await request(app)
        .delete(`/api/addresses/${created.body._id}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Dirección no encontrada" });
    });
  });
});
