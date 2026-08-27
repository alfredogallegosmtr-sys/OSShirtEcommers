import { describe, it, expect, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB from "../../src/config/db.conf.js";

// Prueba `connectDB` (src/config/db.conf.js) en sus dos ramas reales, sin mockear Mongoose:
// - Happy path: se conecta de verdad a una instancia mongodb-memory-server (mismo mecanismo
//   que tests/integration/helpers/db.js), pero llamando a la función real bajo prueba
//   (`connectDB()`), no a `mongoose.connect` directo como hace el helper de los demás tests
//   de integración.
// - Negativo: se le da un connection string sintácticamente inválido para forzar que
//   `mongoose.connect` rechace casi al instante (fallo de parseo de URI, no timeout de red).
//   Lo único que se espía es `process.exit` (con `vi.spyOn`), y únicamente para evitar que el
//   proceso del test runner termine — es la técnica estándar e inevitable para probar código
//   que llama a `process.exit`, no un mock de Mongoose.
//
// Este archivo es dueño de su propia conexión global de Mongoose (singleton por módulo). Al
// igual que los demás archivos de tests/integration/*.test.js (que también conectan/cierran su
// propia instancia de mongodb-memory-server en el mismo objeto `mongoose` global), Vitest aísla
// el registro de módulos por archivo de test, así que no hay colisión entre archivos aunque
// corran en paralelo. Dentro de este archivo, cada test limpia su propio estado en `afterEach`.

describe("connectDB (src/config/db.conf.js)", () => {
  const originalMongoUri = process.env.MONGO_URI;
  let mongoServer;

  afterEach(async () => {
    vi.restoreAllMocks();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = undefined;
    }

    if (originalMongoUri === undefined) {
      delete process.env.MONGO_URI;
    } else {
      process.env.MONGO_URI = originalMongoUri;
    }
  });

  it("[happy] conecta a una DB real (mongodb-memory-server) sin mockear Mongoose", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();

    await expect(connectDB()).resolves.toBeUndefined();

    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it("[negativo] URI de Mongo inválida → connectDB llama a process.exit(1)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});

    process.env.MONGO_URI = "not-a-valid-mongo-uri";

    await expect(connectDB()).resolves.toBeUndefined();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mongoose.connection.readyState).not.toBe(1); // nunca llegó a conectar
  });
});
