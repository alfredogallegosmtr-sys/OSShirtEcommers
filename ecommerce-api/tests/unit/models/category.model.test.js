import { describe, it, expect } from "vitest";
import Category from "../../../src/models/Category.js";

// validate() valida reglas de schema SIN conexión real a Mongo. No cubre `unique` (slug):
// eso es una constraint de índice de Mongo, requiere DB real — fuera de alcance aquí.

const validCategoryData = () => ({
  name: "Anime",
  description: "Camisetas de anime.",
  type: "anime",
  slug: "anime",
});

describe("Category model (schema validation, sin DB)", () => {
  it("[happy] documento con todos los campos requeridos → validate() no rechaza", async () => {
    const category = new Category(validCategoryData());
    await expect(category.validate()).resolves.toBeUndefined();
  });

  it("[negativo] falta 'description' (required) → ValidationError", async () => {
    const data = validCategoryData();
    delete data.description;
    const category = new Category(data);
    const error = await category.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.description.kind).toBe("required");
  });

  it("[negativo] falta 'type' (required) → ValidationError", async () => {
    const data = validCategoryData();
    delete data.type;
    const category = new Category(data);
    const error = await category.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.type.kind).toBe("required");
  });

  it("[negativo] 'type' con valor fuera del enum de 8 → ValidationError", async () => {
    const category = new Category({ ...validCategoryData(), type: "occidental" });
    const error = await category.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.type.kind).toBe("enum");
  });

  it("[negativo] falta 'slug' (required) → ValidationError", async () => {
    const data = validCategoryData();
    delete data.slug;
    const category = new Category(data);
    const error = await category.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.slug.kind).toBe("required");
  });

  it("[caso] 'parentCategory' es null por defecto (categoría raíz)", () => {
    const category = new Category(validCategoryData());
    expect(category.parentCategory).toBeNull();
  });
});
