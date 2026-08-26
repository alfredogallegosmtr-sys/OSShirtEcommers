import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import PaymentMethod from "../../../src/models/PaymentMethod.js";

// Sin controller ni router: este modelo hoy solo se usa desde src/seed/seed.js.
// validate() SIN conexión real a Mongo.

const validPaymentData = () => ({
  user: new mongoose.Types.ObjectId().toString(),
  type: "credit_card",
});

describe("PaymentMethod model (schema validation, sin DB)", () => {
  it("[happy] documento con todos los campos requeridos → validate() no rechaza", async () => {
    const payment = new PaymentMethod(validPaymentData());
    await expect(payment.validate()).resolves.toBeUndefined();
  });

  it("[negativo] falta 'user' (required) → ValidationError", async () => {
    const data = validPaymentData();
    delete data.user;
    const payment = new PaymentMethod(data);
    const error = await payment.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.user.kind).toBe("required");
  });

  it("[negativo] falta 'type' (required) → ValidationError", async () => {
    const data = validPaymentData();
    delete data.type;
    const payment = new PaymentMethod(data);
    const error = await payment.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.type.kind).toBe("required");
  });

  it("[negativo] 'type' fuera del enum de 5 valores → ValidationError", async () => {
    const payment = new PaymentMethod({ ...validPaymentData(), type: "crypto" });
    const error = await payment.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.type.kind).toBe("enum");
  });

  it("[negativo] 'last4' con 5 caracteres → ValidationError (maxlength sí se aplica en String)", async () => {
    const payment = new PaymentMethod({ ...validPaymentData(), last4: "12345" });
    const error = await payment.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.last4).toBeDefined();
  });

  it("[decisión S-03] 'cardNumber'/'cvv' ya no son campos del schema: se descartan aunque se envíen", () => {
    const payment = new PaymentMethod({
      ...validPaymentData(),
      cardNumber: "4111111111111111",
      cvv: "123",
    });
    expect(payment.toObject().cardNumber).toBeUndefined();
    expect(payment.toObject().cvv).toBeUndefined();
  });

  it("[caso] defaults del schema: isDefault=false, isActive=true", () => {
    const payment = new PaymentMethod(validPaymentData());
    expect(payment.isDefault).toBe(false);
    expect(payment.isActive).toBe(true);
  });
});
