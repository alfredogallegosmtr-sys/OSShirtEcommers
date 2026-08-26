import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Address from "../../../src/models/Address.js";

// Sin controller ni router: este modelo hoy solo se usa desde src/seed/seed.js.
// validate() SIN conexión real a Mongo (no cubre `unique`, que este modelo no tiene de todas formas).

const validAddressData = () => ({
  user: new mongoose.Types.ObjectId().toString(),
  address: "Street 1 #123",
  city: "Aguascalientes",
  state: "Aguascalientes",
  postalCode: "20000",
  country: "Mexico",
  phone: "4491234500",
});

describe("Address model (schema validation, sin DB)", () => {
  it("[happy] documento con todos los campos requeridos → validate() no rechaza", async () => {
    const address = new Address(validAddressData());
    await expect(address.validate()).resolves.toBeUndefined();
  });

  it("[negativo] falta 'user' (required) → ValidationError", async () => {
    const data = validAddressData();
    delete data.user;
    const address = new Address(data);
    const error = await address.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.user.kind).toBe("required");
  });

  it("[negativo] falta 'address' (required) → ValidationError", async () => {
    const data = validAddressData();
    delete data.address;
    const address = new Address(data);
    const error = await address.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.address.kind).toBe("required");
  });

  it("[negativo] falta 'postalCode' (required) → ValidationError", async () => {
    const data = validAddressData();
    delete data.postalCode;
    const address = new Address(data);
    const error = await address.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.postalCode.kind).toBe("required");
  });

  it("[negativo] 'addressType' fuera del enum → ValidationError", async () => {
    const address = new Address({ ...validAddressData(), addressType: "vacation-home" });
    const error = await address.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.addressType.kind).toBe("enum");
  });

  it("[hallazgo real] 'postalCode' con 20 caracteres NO rechaza: min/max son no-ops en un campo String", async () => {
    const address = new Address({ ...validAddressData(), postalCode: "1".repeat(20) });
    await expect(address.validate()).resolves.toBeUndefined();
  });

  it("[caso] defaults del schema: isDefault=false, addressType='home'", () => {
    const address = new Address(validAddressData());
    expect(address.isDefault).toBe(false);
    expect(address.addressType).toBe("home");
  });
});
