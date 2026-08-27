import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Category from "../../src/models/Category.js";
import Product from "../../src/models/Product.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";
import { createUserAndToken } from "./helpers/auth.js";

describe("Category integration (/api/categories)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("Lecturas públicas", () => {
    it("[happy] GET / lista categorías sin auth", async () => {
      await Category.create({
        name: "Anime",
        description: "desc",
        type: "anime",
        slug: "anime",
      });

      const res = await request(app).get("/api/categories");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("[happy] GET /:id sin auth", async () => {
      const category = await Category.create({
        name: "Anime",
        description: "desc",
        type: "anime",
        slug: "anime",
      });

      const res = await request(app).get(`/api/categories/${category._id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Anime");
    });
  });

  describe("Escritura: auth/admin", () => {
    const payload = {
      name: "Nueva",
      description: "desc nueva",
      type: "anime",
      slug: "nueva",
    };

    it("[negativo] POST sin token → 401", async () => {
      const res = await request(app).post("/api/categories").send(payload);
      expect(res.status).toBe(401);
    });

    it("[negativo] POST con rol customer → 403", async () => {
      const { token } = await createUserAndToken({ email: "cust@test.com", role: "customer" });

      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "Requiere rol de administrador" });
    });

    it("[happy] POST con rol admin → 201 crea la categoría", async () => {
      const { token } = await createUserAndToken({ email: "admin1@test.com", role: "admin" });

      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: "Nueva", description: "desc nueva" });

      const stored = await Category.findById(res.body._id);
      expect(stored).not.toBeNull();
    });

    it("[negativo] POST con slug duplicado → 422 manejado (mismo fix de B-10)", async () => {
      const { token } = await createUserAndToken({ email: "admin2@test.com", role: "admin" });

      const first = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);
      expect(first.status).toBe(201);

      const second = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...payload, name: "Otra" });

      expect(second.status).toBe(422);
      expect(second.body).toEqual({
        message: 'El valor de "slug" ya está en uso: "nueva"',
      });
    });

    it("[negativo] PUT sin token → 401", async () => {
      const category = await Category.create({
        name: "Anime",
        description: "desc",
        type: "anime",
        slug: "anime",
      });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .send({ name: "Editado" });

      expect(res.status).toBe(401);
    });

    it("[negativo] PUT con rol customer → 403", async () => {
      const category = await Category.create({
        name: "Anime",
        description: "desc",
        type: "anime",
        slug: "anime",
      });
      const { token } = await createUserAndToken({ email: "cust2@test.com", role: "customer" });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Editado" });

      expect(res.status).toBe(403);
    });

    it("[happy] PUT con rol admin → 200 actualiza", async () => {
      const category = await Category.create({
        name: "Anime",
        description: "desc",
        type: "anime",
        slug: "anime",
      });
      const { token } = await createUserAndToken({ email: "admin2@test.com", role: "admin" });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Editado" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Editado");
    });

    it("[negativo] DELETE sin token → 401", async () => {
      const category = await Category.create({
        name: "Anime",
        description: "desc",
        type: "anime",
        slug: "anime",
      });

      const res = await request(app).delete(`/api/categories/${category._id}`);
      expect(res.status).toBe(401);
    });

    it("[negativo] DELETE con rol customer → 403", async () => {
      const category = await Category.create({
        name: "Anime",
        description: "desc",
        type: "anime",
        slug: "anime",
      });
      const { token } = await createUserAndToken({ email: "cust3@test.com", role: "customer" });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("[happy] DELETE con rol admin → 204, hard delete real (no queda en la DB)", async () => {
      const category = await Category.create({
        name: "Anime",
        description: "desc",
        type: "anime",
        slug: "anime",
      });
      const { token } = await createUserAndToken({ email: "admin3@test.com", role: "admin" });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(204);

      const stored = await Category.findById(category._id);
      expect(stored).toBeNull();
    });
  });

  describe("GET /:id/products — recursión de un nivel", () => {
    it("[happy] incluye productos de la categoría y de sus subcategorías directas", async () => {
      const parent = await Category.create({
        name: "Padre",
        description: "desc",
        type: "anime",
        slug: "padre",
      });
      const child = await Category.create({
        name: "Hijo",
        description: "desc",
        type: "anime",
        slug: "hijo",
        parentCategory: parent._id,
      });
      const grandchild = await Category.create({
        name: "Nieto",
        description: "desc",
        type: "anime",
        slug: "nieto",
        parentCategory: child._id,
      });

      await Product.create({
        name: "Prod padre",
        price: 10,
        slug: "prod-padre",
        category: parent._id,
      });
      await Product.create({
        name: "Prod hijo",
        price: 20,
        slug: "prod-hijo",
        category: child._id,
      });
      await Product.create({
        name: "Prod nieto",
        price: 30,
        slug: "prod-nieto",
        category: grandchild._id,
      });

      const res = await request(app).get(`/api/categories/${parent._id}/products`);

      expect(res.status).toBe(200);
      const names = res.body.products.map((p) => p.name).sort();
      // Se espera un nivel de recursión: padre + hijo directo, NO nieto (dos niveles).
      expect(names).toEqual(["Prod hijo", "Prod padre"].sort());
      expect(names).not.toContain("Prod nieto");
    });
  });
});
