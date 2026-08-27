import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Category from "../../src/models/Category.js";
import Product from "../../src/models/Product.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";
import { createUserAndToken, signToken } from "./helpers/auth.js";

const createProduct = async (overrides = {}) => {
  const category = await Category.create({
    name: "Categoria",
    description: "desc",
    type: "anime",
    slug: `categoria-${Math.random().toString(36).slice(2)}`,
  });

  return Product.create({
    name: "Camiseta",
    price: 100,
    slug: `camiseta-${Math.random().toString(36).slice(2)}`,
    category: category._id,
    ...overrides,
  });
};

describe("Cart integration (/api/cart)", () => {
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

      const getRes = await request(app).get("/api/cart");
      const postRes = await request(app).post("/api/cart").send({ productId: fakeId });
      const patchRes = await request(app)
        .patch(`/api/cart/${fakeId}`)
        .send({ quantity: 2 });
      const deleteItemRes = await request(app).delete(`/api/cart/${fakeId}`);
      const clearRes = await request(app).delete("/api/cart");

      for (const res of [getRes, postRes, patchRes, deleteItemRes, clearRes]) {
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

      const getRes = await request(app).get("/api/cart").set("Authorization", authHeader);
      const postRes = await request(app)
        .post("/api/cart")
        .set("Authorization", authHeader)
        .send({ productId: fakeId });
      const patchRes = await request(app)
        .patch(`/api/cart/${fakeId}`)
        .set("Authorization", authHeader)
        .send({ quantity: 2 });
      const deleteItemRes = await request(app)
        .delete(`/api/cart/${fakeId}`)
        .set("Authorization", authHeader);
      const clearRes = await request(app).delete("/api/cart").set("Authorization", authHeader);

      for (const res of [getRes, postRes, patchRes, deleteItemRes, clearRes]) {
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: "Token inválido o expirado" });
      }
    });
  });

  describe("CRUD autorizado", () => {
    it("[happy] GET /api/cart crea/devuelve carrito vacío", async () => {
      const { token } = await createUserAndToken({ email: "cart1@test.com" });

      const res = await request(app).get("/api/cart").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ items: [], total: 0 });
    });

    it("[happy] POST agrega ítem y recalcula total", async () => {
      const { token } = await createUserAndToken({ email: "cart2@test.com" });
      const product = await createProduct({ price: 50 });

      const res = await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product._id.toString(), quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toMatchObject({ quantity: 2 });
      expect(res.body.items[0].product._id).toBe(product._id.toString());
      expect(res.body.total).toBe(100); // 50 * 2
    });

    it("[happy] POST del mismo producto suma cantidades y recalcula total", async () => {
      const { token } = await createUserAndToken({ email: "cart3@test.com" });
      const product = await createProduct({ price: 30 });

      await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product._id.toString(), quantity: 1 });

      const res = await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product._id.toString(), quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].quantity).toBe(3);
      expect(res.body.total).toBe(90); // 30 * 3
    });

    it("[happy] PATCH actualiza cantidad y recalcula total", async () => {
      const { token } = await createUserAndToken({ email: "cart4@test.com" });
      const product = await createProduct({ price: 20 });

      const addRes = await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product._id.toString(), quantity: 1 });
      const itemId = addRes.body.items[0].id;

      const res = await request(app)
        .patch(`/api/cart/${itemId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.items[0].quantity).toBe(5);
      expect(res.body.total).toBe(100); // 20 * 5
    });

    it("[happy] DELETE /:itemId quita el ítem y recalcula total a 0", async () => {
      const { token } = await createUserAndToken({ email: "cart5@test.com" });
      const product = await createProduct({ price: 40 });

      const addRes = await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product._id.toString(), quantity: 2 });
      const itemId = addRes.body.items[0].id;

      const res = await request(app)
        .delete(`/api/cart/${itemId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ items: [], total: 0 });
    });

    it("[happy] DELETE /api/cart vacía el carrito completo", async () => {
      const { token } = await createUserAndToken({ email: "cart6@test.com" });
      const product = await createProduct({ price: 10 });

      await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product._id.toString(), quantity: 3 });

      const res = await request(app).delete("/api/cart").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ items: [], total: 0 });

      const getRes = await request(app).get("/api/cart").set("Authorization", `Bearer ${token}`);
      expect(getRes.body).toEqual({ items: [], total: 0 });
    });
  });

  describe("Aislamiento cross-user", () => {
    it("[negativo] el usuario B no puede actualizar un itemId del carrito del usuario A → 404", async () => {
      const { token: tokenA } = await createUserAndToken({ email: "userA@test.com" });
      const { token: tokenB } = await createUserAndToken({ email: "userB@test.com" });
      const product = await createProduct({ price: 15 });

      const addRes = await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ productId: product._id.toString(), quantity: 1 });
      const itemId = addRes.body.items[0].id;

      const patchRes = await request(app)
        .patch(`/api/cart/${itemId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ quantity: 3 });

      expect(patchRes.status).toBe(404);
      expect(patchRes.body).toEqual({ message: "Item no encontrado" });

      const deleteRes = await request(app)
        .delete(`/api/cart/${itemId}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body).toEqual({ message: "Item no encontrado" });

      // El ítem de A sigue intacto.
      const getResA = await request(app).get("/api/cart").set("Authorization", `Bearer ${tokenA}`);
      expect(getResA.body.items).toHaveLength(1);
      expect(getResA.body.items[0].id).toBe(itemId);
    });
  });
});
