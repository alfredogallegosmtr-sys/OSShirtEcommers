import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Order from "../../../src/models/Order.js";

// Sin controller ni router: este modelo hoy solo se usa desde src/seed/seed.js.
// validate() SIN conexión real a Mongo.

const validOrderData = () => ({
  user: new mongoose.Types.ObjectId().toString(),
  products: [
    {
      productId: new mongoose.Types.ObjectId().toString(),
      quantity: 1,
      price: 349,
    },
  ],
  address: new mongoose.Types.ObjectId().toString(),
  paymentMethod: new mongoose.Types.ObjectId().toString(),
  totalPrice: 349,
});

describe("Order model (schema validation, sin DB)", () => {
  it("[happy] documento con todos los campos requeridos → validate() no rechaza", async () => {
    const order = new Order(validOrderData());
    await expect(order.validate()).resolves.toBeUndefined();
  });

  it("[negativo] falta 'totalPrice' (required, sin default) → ValidationError", async () => {
    const data = validOrderData();
    delete data.totalPrice;
    const order = new Order(data);
    const error = await order.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.totalPrice.kind).toBe("required");
  });

  it("[negativo] falta 'address' (required) → ValidationError", async () => {
    const data = validOrderData();
    delete data.address;
    const order = new Order(data);
    const error = await order.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.address.kind).toBe("required");
  });

  it("[negativo] falta 'paymentMethod' (required) → ValidationError", async () => {
    const data = validOrderData();
    delete data.paymentMethod;
    const order = new Order(data);
    const error = await order.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.paymentMethod.kind).toBe("required");
  });

  it("[negativo] 'products[].quantity' en 0 (min:1 violado) → ValidationError", async () => {
    const data = validOrderData();
    data.products[0].quantity = 0;
    const order = new Order(data);
    const error = await order.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors["products.0.quantity"].kind).toBe("min");
  });

  it("[negativo] 'status' fuera del enum de 5 valores → ValidationError", async () => {
    const order = new Order({ ...validOrderData(), status: "returned" });
    const error = await order.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.status.kind).toBe("enum");
  });

  it("[caso] defaults del schema: subtotalPrice=0, shippingCost=0, status/paymentStatus='pending'", () => {
    const order = new Order(validOrderData());
    expect(order.subtotalPrice).toBe(0);
    expect(order.shippingCost).toBe(0);
    expect(order.status).toBe("pending");
    expect(order.paymentStatus).toBe("pending");
  });
});
