import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import WishList from "../../../src/models/WishList.js";

// Sin controller ni router: este modelo hoy no lo usa nada del código real (ni siquiera el seed).
// validate() SIN conexión real a Mongo.

describe("WishList model (schema validation, sin DB)", () => {
  it("[happy] documento válido (user + productos) → validate() no rechaza", async () => {
    const wishlist = new WishList({
      user: new mongoose.Types.ObjectId().toString(),
      products: [new mongoose.Types.ObjectId().toString()],
    });
    await expect(wishlist.validate()).resolves.toBeUndefined();
  });

  it("[negativo] falta 'user' (required) → ValidationError", async () => {
    const wishlist = new WishList({
      products: [new mongoose.Types.ObjectId().toString()],
    });
    const error = await wishlist.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.user.kind).toBe("required");
  });

  it("[caso] 'products' puede quedar como array vacío sin rechazar (required aplica por elemento, no al arreglo)", async () => {
    const wishlist = new WishList({
      user: new mongoose.Types.ObjectId().toString(),
      products: [],
    });
    await expect(wishlist.validate()).resolves.toBeUndefined();
  });

  it("[negativo] un elemento nulo dentro de 'products' (required por elemento) → ValidationError", async () => {
    const wishlist = new WishList({
      user: new mongoose.Types.ObjectId().toString(),
      products: [null],
    });
    const error = await wishlist.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors["products.0"].kind).toBe("required");
  });
});
