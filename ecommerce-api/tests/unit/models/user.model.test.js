import { describe, it, expect } from "vitest";
import User from "../../../src/models/User.js";

// validate() valida reglas de schema SIN conexión real a Mongo. No cubre `unique` (email):
// eso es una constraint de índice de Mongo, requiere DB real — fuera de alcance aquí.
// El hash de password NO ocurre en el modelo (no hay pre-save hook, confirmado por grep en
// todo src/): el controller de auth es responsable de hashear antes de llamar a User.create.

const validUserData = () => ({
  name: "Ana",
  email: "ana@test.com",
  password: "hashed-value",
});

describe("User model (schema validation, sin DB)", () => {
  it("[happy] documento con todos los campos requeridos → validate() no rechaza", async () => {
    const user = new User(validUserData());
    await expect(user.validate()).resolves.toBeUndefined();
  });

  it("[negativo] falta 'email' (required) → ValidationError", async () => {
    const data = validUserData();
    delete data.email;
    const user = new User(data);
    const error = await user.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.email.kind).toBe("required");
  });

  it("[negativo] falta 'password' (required) → ValidationError", async () => {
    const data = validUserData();
    delete data.password;
    const user = new User(data);
    const error = await user.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.password.kind).toBe("required");
  });

  it("[negativo] 'role' fuera del enum (\"customer\"/\"admin\") → ValidationError", async () => {
    const user = new User({ ...validUserData(), role: "superadmin" });
    const error = await user.validate().catch((e) => e);
    expect(error.name).toBe("ValidationError");
    expect(error.errors.role.kind).toBe("enum");
  });

  it("[caso] 'email' se normaliza a lowercase por el schema (lowercase:true)", () => {
    const user = new User({ ...validUserData(), email: "ANA@TEST.COM" });
    expect(user.email).toBe("ana@test.com");
  });

  it("[caso] 'role' es 'customer' por defecto si no se especifica", () => {
    const user = new User(validUserData());
    expect(user.role).toBe("customer");
  });
});
