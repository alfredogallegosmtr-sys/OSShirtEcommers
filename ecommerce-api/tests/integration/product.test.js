import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Category from "../../src/models/Category.js";
import Product from "../../src/models/Product.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";
import { createUserAndToken } from "./helpers/auth.js";

const createCategory = async () =>
  Category.create({
    name: "Categoria",
    description: "desc",
    type: "anime",
    slug: `categoria-${Math.random().toString(36).slice(2)}`,
  });

describe("Product integration (/api/products)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("Escritura: auth/admin", () => {
    it("[negativo] POST sin token → 401", async () => {
      const category = await createCategory();
      const res = await request(app)
        .post("/api/products")
        .send({ name: "Camiseta", price: 100, slug: "camiseta-1", category: category._id });

      expect(res.status).toBe(401);
    });

    it("[negativo] POST con rol customer → 403", async () => {
      const category = await createCategory();
      const { token } = await createUserAndToken({ email: "cust@test.com", role: "customer" });

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Camiseta", price: 100, slug: "camiseta-1", category: category._id });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "Requiere rol de administrador" });
    });

    it("[happy] POST con rol admin → 201 crea el producto", async () => {
      const category = await createCategory();
      const { token } = await createUserAndToken({ email: "admin1@test.com", role: "admin" });

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Camiseta", price: 100, slug: "camiseta-1", category: category._id });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: "Camiseta", price: 100, slug: "camiseta-1" });
    });

    it("[negativo] PUT sin token → 401", async () => {
      const category = await createCategory();
      const product = await Product.create({
        name: "Camiseta",
        price: 100,
        slug: "camiseta-2",
        category: category._id,
      });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .send({ price: 200 });

      expect(res.status).toBe(401);
    });

    it("[negativo] PUT con rol customer → 403", async () => {
      const category = await createCategory();
      const product = await Product.create({
        name: "Camiseta",
        price: 100,
        slug: "camiseta-3",
        category: category._id,
      });
      const { token } = await createUserAndToken({ email: "cust2@test.com", role: "customer" });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ price: 200 });

      expect(res.status).toBe(403);
    });

    it("[happy] PUT con rol admin → 200 actualiza", async () => {
      const category = await createCategory();
      const product = await Product.create({
        name: "Camiseta",
        price: 100,
        slug: "camiseta-4",
        category: category._id,
      });
      const { token } = await createUserAndToken({ email: "admin2@test.com", role: "admin" });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ price: 200 });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(200);
    });

    it("[negativo] DELETE sin token → 401", async () => {
      const category = await createCategory();
      const product = await Product.create({
        name: "Camiseta",
        price: 100,
        slug: "camiseta-5",
        category: category._id,
      });

      const res = await request(app).delete(`/api/products/${product._id}`);
      expect(res.status).toBe(401);
    });

    it("[negativo] DELETE con rol customer → 403", async () => {
      const category = await createCategory();
      const product = await Product.create({
        name: "Camiseta",
        price: 100,
        slug: "camiseta-6",
        category: category._id,
      });
      const { token } = await createUserAndToken({ email: "cust3@test.com", role: "customer" });

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Soft delete", () => {
    it("[happy] DELETE con rol admin → 204, marca is_deleted:true sin borrar el documento", async () => {
      const category = await createCategory();
      const product = await Product.create({
        name: "Camiseta",
        price: 100,
        slug: "camiseta-7",
        category: category._id,
      });
      const { token } = await createUserAndToken({ email: "admin3@test.com", role: "admin" });

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(204);

      const stored = await Product.findById(product._id);
      expect(stored).not.toBeNull();
      expect(stored.is_deleted).toBe(true);
    });

    it("[negativo] un producto soft-deleted deja de aparecer en GET /api/products", async () => {
      const category = await createCategory();
      const product = await Product.create({
        name: "Camiseta",
        price: 100,
        slug: "camiseta-8",
        category: category._id,
        is_deleted: true,
      });

      const res = await request(app).get("/api/products");

      expect(res.status).toBe(200);
      const ids = res.body.products.map((p) => p._id);
      expect(ids).not.toContain(product._id.toString());
    });

    it("[negativo] GET /api/products/:id de un producto soft-deleted → 404", async () => {
      const category = await createCategory();
      const product = await Product.create({
        name: "Camiseta",
        price: 100,
        slug: "camiseta-9",
        category: category._id,
        is_deleted: true,
      });

      const res = await request(app).get(`/api/products/${product._id}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Producto no encontrado" });
    });
  });

  describe("Orden de rutas: /search no queda tapada por /:id", () => {
    it("[happy] GET /api/products/search es alcanzable y filtra por q", async () => {
      const category = await createCategory();
      await Product.create({
        name: "Camiseta Naruto",
        price: 100,
        slug: "camiseta-naruto",
        category: category._id,
      });
      await Product.create({
        name: "Camiseta One Piece",
        price: 100,
        slug: "camiseta-one-piece",
        category: category._id,
      });

      const res = await request(app).get("/api/products/search").query({ q: "Naruto" });

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].name).toBe("Camiseta Naruto");
      // Confirma que no fue interceptado por GET /:id (que respondería 422 porque
      // "search" no es un ObjectId válido).
    });
  });

  describe("Slug duplicado en creación", () => {
    it("[negativo] slug duplicado → 422 manejado (B-10, corregido en el error handler global)", async () => {
      const category = await createCategory();
      const { token } = await createUserAndToken({ email: "admin4@test.com", role: "admin" });

      const first = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Camiseta A", price: 100, slug: "camiseta-duplicada", category: category._id });
      expect(first.status).toBe(201);

      const second = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Camiseta B", price: 150, slug: "camiseta-duplicada", category: category._id });

      expect(second.status).toBe(422);
      expect(second.body).toEqual({
        message: 'El valor de "slug" ya está en uso: "camiseta-duplicada"',
      });
    });
  });
});
