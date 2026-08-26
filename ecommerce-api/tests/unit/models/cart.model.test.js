import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Cart from "../../../src/models/Cart.js";

// validate() valida reglas de schema SIN conexión real a Mongo. No cubre `unique` (user):
// eso es una constraint de índice de Mongo, requiere DB real — fuera de alcance aquí.

const validCartData = () => ({
  user: new mongoose.Types.ObjectId().toString(),
  products: [
    { product: new mongoose.Types.ObjectId().toString(), quantity: 2 },
  ],
});

describe("Cart model (schema validation, sin DB)", () => {
  it("[happy] documento válido (user + producto con quantity>=1) → validate() no rechaza", async () => {
    const cart = new Cart(validCartData());
    await expect(cart.validate()).resolves.toBeUndefined();
  });

  it("[negativo] falta 'user' (required) → ValidationError", async () => {
    const data = validCartData();
    delete data.user;
    const cart = new Cart(data);
    const error = await cart.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.user.kind).toBe("required");
  });

  it("[negativo] 'products[].quantity' en 0 (min:1 violado) → ValidationError", async () => {
    const data = validCartData();
    data.products[0].quantity = 0;
    const cart = new Cart(data);
    const error = await cart.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors["products.0.quantity"].kind).toBe("min");
  });

  it("[caso límite] 'products[].quantity' en 1 (mínimo exacto permitido) → no rechaza", async () => {
    const data = validCartData();
    data.products[0].quantity = 1;
    const cart = new Cart(data);
    await expect(cart.validate()).resolves.toBeUndefined();
  });

  it("[negativo] item de 'products' sin 'product' (required) → ValidationError", async () => {
    const data = validCartData();
    delete data.products[0].product;
    const cart = new Cart(data);
    const error = await cart.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors["products.0.product"].kind).toBe("required");
  });

  it("[caso] 'total' es 0 por defecto", () => {
    const cart = new Cart({ user: new mongoose.Types.ObjectId().toString() });
    expect(cart.total).toBe(0);
  });
});
