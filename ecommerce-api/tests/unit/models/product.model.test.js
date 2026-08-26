import { describe, it, expect } from "vitest";
import Product from "../../../src/models/Product.js";

// validate() valida reglas de schema (required, type, enum) SIN conexión real a Mongo.
// No cubre `unique` (slug): eso es una constraint de índice de Mongo, no de Mongoose, y
// requiere una DB real (mongodb-memory-server) — fuera de alcance de un test unitario puro.

const validProductData = () => ({
  name: "Naruto Hidden Leaf Tee",
  price: 349,
  slug: "naruto-hidden-leaf-tee",
  category: "507f1f77bcf86cd799439011",
});

describe("Product model (schema validation, sin DB)", () => {
  it("[happy] documento con todos los campos requeridos → validate() no rechaza", async () => {
    const product = new Product(validProductData());
    await expect(product.validate()).resolves.toBeUndefined();
  });

  it("[negativo] falta 'name' (required) → ValidationError en el campo name", async () => {
    const data = validProductData();
    delete data.name;
    const product = new Product(data);
    const error = await product.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.name.kind).toBe("required");
  });

  it("[negativo] falta 'price' (required) → ValidationError en el campo price", async () => {
    const data = validProductData();
    delete data.price;
    const product = new Product(data);
    const error = await product.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.price.kind).toBe("required");
  });

  it("[negativo] falta 'slug' (required) → ValidationError en el campo slug", async () => {
    const data = validProductData();
    delete data.slug;
    const product = new Product(data);
    const error = await product.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.slug.kind).toBe("required");
  });

  it("[negativo] falta 'category' (required) → ValidationError en el campo category", async () => {
    const data = validProductData();
    delete data.category;
    const product = new Product(data);
    const error = await product.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.category.kind).toBe("required");
  });

  it("[negativo] 'sizes' con valor fuera del enum → ValidationError", async () => {
    const product = new Product({ ...validProductData(), sizes: ["XXXL"] });
    const error = await product.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors["sizes.0"].kind).toBe("enum");
  });

  it("[caso] defaults del schema se aplican: stock=0, is_active=true, is_deleted=false", () => {
    const product = new Product(validProductData());
    expect(product.stock).toBe(0);
    expect(product.is_active).toBe(true);
    expect(product.is_deleted).toBe(false);
  });
});
