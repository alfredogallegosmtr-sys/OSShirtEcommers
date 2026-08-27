import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import Product from "../../src/models/Product.js";
import Category from "../../src/models/Category.js";
import User from "../../src/models/User.js";
import Cart from "../../src/models/Cart.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";

// Estas constraints son índices `unique` de MongoDB, no reglas de Mongoose `validate()`:
// solo se pueden probar contra una base real (aquí, mongodb-memory-server). Se espera
// un error de duplicado (código Mongo E11000), no un ValidationError de Mongoose.
describe("Unique constraints (requieren DB real)", () => {
  beforeAll(async () => {
    await connectTestDB();
    // Espera a que los índices (incluidos los `unique`) terminen de construirse antes
    // de ejercitar los duplicados; autoIndex corre async al compilar el modelo.
    await Promise.all([Product.init(), Category.init(), User.init(), Cart.init()]);
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it("Product.slug duplicado → Mongo rechaza con E11000", async () => {
    const category = await Category.create({
      name: "Cat",
      description: "desc",
      type: "anime",
      slug: "cat-unique-test",
    });

    await Product.create({
      name: "P1",
      price: 10,
      slug: "slug-duplicado",
      category: category._id,
    });

    await expect(
      Product.create({
        name: "P2",
        price: 20,
        slug: "slug-duplicado",
        category: category._id,
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("Category.slug duplicado → Mongo rechaza con E11000", async () => {
    await Category.create({
      name: "Cat1",
      description: "desc",
      type: "anime",
      slug: "slug-duplicado-cat",
    });

    await expect(
      Category.create({
        name: "Cat2",
        description: "desc",
        type: "manga-novelas",
        slug: "slug-duplicado-cat",
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("User.email duplicado → Mongo rechaza con E11000", async () => {
    await User.create({
      name: "User1",
      email: "duplicado@test.com",
      password: "hashed1",
    });

    await expect(
      User.create({
        name: "User2",
        email: "duplicado@test.com",
        password: "hashed2",
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("Cart.user duplicado (un carrito por usuario) → Mongo rechaza con E11000", async () => {
    const user = await User.create({
      name: "User1",
      email: "cartuser@test.com",
      password: "hashed1",
    });

    await Cart.create({ user: user._id, products: [] });

    await expect(Cart.create({ user: user._id, products: [] })).rejects.toMatchObject({
      code: 11000,
    });
  });
});
