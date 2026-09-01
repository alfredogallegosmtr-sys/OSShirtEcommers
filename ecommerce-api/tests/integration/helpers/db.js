import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

// Variables de entorno de JWT necesarias por auth.controller.js / auth.middleware.js.
// app.js no llama a dotenv.config() (sin efectos secundarios), así que las fijamos
// nosotros antes de que cualquier request dispare código que lea process.env.
process.env.JWT_SECRET = process.env.JWT_SECRET || "integration-test-jwt-secret";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "integration-test-jwt-refresh-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

let mongoServer;

export const connectTestDB = async () => {
  // Replica set de 1 nodo, no standalone: order.controller.js usa transacciones
  // (session.withTransaction) en createOrder, y un MongoMemoryServer standalone
  // las rechaza ("Transaction numbers are only allowed on a replica set member").
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

export const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
};
