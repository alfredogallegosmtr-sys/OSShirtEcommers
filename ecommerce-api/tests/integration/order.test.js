import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Category from "../../src/models/Category.js";
import Product from "../../src/models/Product.js";
import Cart from "../../src/models/Cart.js";
import Address from "../../src/models/Address.js";
import PaymentMethod from "../../src/models/PaymentMethod.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/db.js";
import { createUserAndToken } from "./helpers/auth.js";

const createProduct = async (overrides = {}) => {
  const category = await Category.create({
    name: "Categoria",
    description: "desc",
    type: "anime",
    slug: `categoria-${Math.random().toString(36).slice(2)}`,
  });

  return Product.create({
    name: "Camiseta",
    price: 100,
    slug: `camiseta-${Math.random().toString(36).slice(2)}`,
    category: category._id,
    ...overrides,
  });
};

const createAddress = async (token) =>
  request(app)
    .post("/api/addresses")
    .set("Authorization", `Bearer ${token}`)
    .send({
      address: "Calle Falsa 123",
      city: "Springfield",
      state: "SP",
      postalCode: "12345",
      country: "Argentina",
      phone: "5551234567",
    })
    .then((res) => res.body);

const createPaymentMethod = async (token) =>
  request(app)
    .post("/api/payment-methods")
    .set("Authorization", `Bearer ${token}`)
    .send({ type: "credit_card", last4: "1111", brand: "visa" })
    .then((res) => res.body);

const buildCart = async (userId, entries) =>
  Cart.create({
    user: userId,
    products: entries.map(({ product, quantity }) => ({ product: product._id, quantity })),
  });

describe("Order integration (/api/orders)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("requireAuth", () => {
    it("[negativo] POST sin token → 401", async () => {
      const res = await request(app).post("/api/orders").send({});
      expect(res.status).toBe(401);
    });
  });

  describe("Validación de body", () => {
    it("[negativo] POST sin addressId → 422", async () => {
      const { token } = await createUserAndToken({ email: "ord1@test.com" });
      const paymentMethod = await createPaymentMethod(token);

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ paymentMethodId: paymentMethod._id });

      expect(res.status).toBe(422);
    });

    it("[negativo] addressId no es un ObjectId válido → 422", async () => {
      const { token } = await createUserAndToken({ email: "ord2@test.com" });
      const paymentMethod = await createPaymentMethod(token);

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: "no-es-un-objectid", paymentMethodId: paymentMethod._id });

      expect(res.status).toBe(422);
    });
  });

  describe("Recursos no encontrados / aislamiento", () => {
    it("[negativo] addressId válido en formato pero inexistente → 404 'Dirección no encontrada'", async () => {
      const { token } = await createUserAndToken({ email: "ord3@test.com" });
      const paymentMethod = await createPaymentMethod(token);
      const fakeId = "64b64b64b64b64b64b64b640";

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: fakeId, paymentMethodId: paymentMethod._id });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Dirección no encontrada" });
    });

    it("[negativo] addressId de OTRO usuario → 404 (aislamiento)", async () => {
      const { token: tokenA } = await createUserAndToken({ email: "ordA@test.com" });
      const { token: tokenB } = await createUserAndToken({ email: "ordB@test.com" });
      const addressA = await createAddress(tokenA);
      const paymentMethodB = await createPaymentMethod(tokenB);

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ addressId: addressA._id, paymentMethodId: paymentMethodB._id });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Dirección no encontrada" });
    });

    it("[negativo] paymentMethodId inexistente → 404 'Método de pago no encontrado'", async () => {
      const { token } = await createUserAndToken({ email: "ord4@test.com" });
      const address = await createAddress(token);
      const fakeId = "64b64b64b64b64b64b64b640";

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: address._id, paymentMethodId: fakeId });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Método de pago no encontrado" });
    });
  });

  describe("Carrito vacío", () => {
    it("[negativo] sin carrito creado → 422 'El carrito está vacío'", async () => {
      const { token } = await createUserAndToken({ email: "ord5@test.com" });
      const address = await createAddress(token);
      const paymentMethod = await createPaymentMethod(token);

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: address._id, paymentMethodId: paymentMethod._id });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ message: "El carrito está vacío" });
    });

    it("[negativo] carrito con products: [] → 422 'El carrito está vacío'", async () => {
      const { user, token } = await createUserAndToken({ email: "ord6@test.com" });
      const address = await createAddress(token);
      const paymentMethod = await createPaymentMethod(token);
      await Cart.create({ user: user._id, products: [] });

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: address._id, paymentMethodId: paymentMethod._id });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ message: "El carrito está vacío" });
    });
  });

  describe("Cálculo de totales", () => {
    it("[happy] subtotal < 1000 → shippingCost 350, total = subtotal + 16% + 350", async () => {
      const { user, token } = await createUserAndToken({ email: "ord7@test.com" });
      const address = await createAddress(token);
      const paymentMethod = await createPaymentMethod(token);
      const product = await createProduct({ price: 500 });
      await buildCart(user._id, [{ product, quantity: 1 }]);

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: address._id, paymentMethodId: paymentMethod._id });

      expect(res.status).toBe(201);
      expect(res.body.subtotalPrice).toBe(500);
      expect(res.body.shippingCost).toBe(350);
      expect(res.body.totalPrice).toBe(500 + 500 * 0.16 + 350); // 930
    });

    it("[happy] subtotal >= 1000 → shippingCost 0, total sin envío", async () => {
      const { user, token } = await createUserAndToken({ email: "ord8@test.com" });
      const address = await createAddress(token);
      const paymentMethod = await createPaymentMethod(token);
      const product = await createProduct({ price: 1000 });
      await buildCart(user._id, [{ product, quantity: 1 }]);

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: address._id, paymentMethodId: paymentMethod._id });

      expect(res.status).toBe(201);
      expect(res.body.subtotalPrice).toBe(1000);
      expect(res.body.shippingCost).toBe(0);
      expect(res.body.totalPrice).toBe(1000 + 1000 * 0.16); // 1160
    });

    it("[happy] al crear la orden, el carrito queda vacío (GET /api/cart)", async () => {
      const { user, token } = await createUserAndToken({ email: "ord9@test.com" });
      const address = await createAddress(token);
      const paymentMethod = await createPaymentMethod(token);
      const product = await createProduct({ price: 500 });
      await buildCart(user._id, [{ product, quantity: 1 }]);

      const orderRes = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ addressId: address._id, paymentMethodId: paymentMethod._id });
      expect(orderRes.status).toBe(201);

      const cartRes = await request(app)
        .get("/api/cart")
        .set("Authorization", `Bearer ${token}`);
      expect(cartRes.body).toEqual({ items: [], total: 0 });
    });
  });

  describe("GET / aislamiento entre usuarios", () => {
    it("[negativo] un usuario solo ve sus propias órdenes", async () => {
      const { user: userA, token: tokenA } = await createUserAndToken({ email: "ordListA@test.com" });
      const { user: userB, token: tokenB } = await createUserAndToken({ email: "ordListB@test.com" });

      const addressA = await createAddress(tokenA);
      const paymentMethodA = await createPaymentMethod(tokenA);
      const productA = await createProduct({ price: 100 });
      await buildCart(userA._id, [{ product: productA, quantity: 1 }]);
      const orderAResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ addressId: addressA._id, paymentMethodId: paymentMethodA._id });
      expect(orderAResponse.status).toBe(201);

      const addressB = await createAddress(tokenB);
      const paymentMethodB = await createPaymentMethod(tokenB);
      const productB = await createProduct({ price: 200 });
      await buildCart(userB._id, [{ product: productB, quantity: 1 }]);
      const orderBResponse = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ addressId: addressB._id, paymentMethodId: paymentMethodB._id });
      expect(orderBResponse.status).toBe(201);

      const listA = await request(app).get("/api/orders").set("Authorization", `Bearer ${tokenA}`);
      const listB = await request(app).get("/api/orders").set("Authorization", `Bearer ${tokenB}`);

      expect(listA.body).toHaveLength(1);
      expect(listA.body[0]._id).toBe(orderAResponse.body._id);

      expect(listB.body).toHaveLength(1);
      expect(listB.body[0]._id).toBe(orderBResponse.body._id);
    });
  });
});
