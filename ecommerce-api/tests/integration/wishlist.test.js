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

describe("Wishlist integration (/api/wishlist)", () => {
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

      const getRes = await request(app).get("/api/wishlist");
      const postRes = await request(app).post("/api/wishlist").send({ productId: fakeId });
      const deleteRes = await request(app).delete(`/api/wishlist/${fakeId}`);

      for (const res of [getRes, postRes, deleteRes]) {
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

      const getRes = await request(app).get("/api/wishlist").set("Authorization", authHeader);
      const postRes = await request(app)
        .post("/api/wishlist")
        .set("Authorization", authHeader)
        .send({ productId: fakeId });
      const deleteRes = await request(app)
        .delete(`/api/wishlist/${fakeId}`)
        .set("Authorization", authHeader);

      for (const res of [getRes, postRes, deleteRes]) {
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: "Token inválido o expirado" });
      }
    });
  });

  describe("CRUD autorizado", () => {
    it("[happy] GET / primera vez → 200, products: []", async () => {
      const { token } = await createUserAndToken({ email: "wish1@test.com" });

      const res = await request(app).get("/api/wishlist").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.products).toEqual([]);
    });

    it("[happy] POST / con un producto real → 201, aparece en products (populado)", async () => {
      const { token } = await createUserAndToken({ email: "wish2@test.com" });
      const product = await createProduct();

      const res = await request(app)
        .post("/api/wishlist")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0]._id).toBe(product._id.toString());
      expect(res.body.products[0].name).toBe(product.name);
    });

    it("[happy] POST del mismo producto otra vez → sigue habiendo solo 1 entrada", async () => {
      const { token } = await createUserAndToken({ email: "wish3@test.com" });
      const product = await createProduct();

      await request(app)
        .post("/api/wishlist")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product._id.toString() });

      const res = await request(app)
        .post("/api/wishlist")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.products).toHaveLength(1);
    });

    it("[negativo] POST con productId no-ObjectId → 422", async () => {
      const { token } = await createUserAndToken({ email: "wish4@test.com" });

      const res = await request(app)
        .post("/api/wishlist")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: "no-es-un-objectid" });

      expect(res.status).toBe(422);
    });

    it("[happy] DELETE /:productId de un producto presente → 200, ya no aparece", async () => {
      const { token } = await createUserAndToken({ email: "wish5@test.com" });
      const product = await createProduct();

      await request(app)
        .post("/api/wishlist")
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: product._id.toString() });

      const res = await request(app)
        .delete(`/api/wishlist/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(0);
    });

    it("[happy] DELETE /:productId de un producto ausente → sigue respondiendo 200 (no-op)", async () => {
      const { token } = await createUserAndToken({ email: "wish6@test.com" });
      const product = await createProduct();

      const res = await request(app)
        .delete(`/api/wishlist/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.products).toEqual([]);
    });
  });
});
