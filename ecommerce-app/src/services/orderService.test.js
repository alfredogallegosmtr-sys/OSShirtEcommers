import { rest } from "msw";
import { server } from "../mocks/server";
import { getOrders, createOrder } from "./orderService";

const url = (path) => `http://localhost:4001/api${path}`;

test("happy: getOrders devuelve el array de órdenes", async () => {
  const orders = [{ _id: "o1", total: 100 }];
  server.use(rest.get(url("/orders"), (req, res, ctx) => res(ctx.status(200), ctx.json(orders))));

  await expect(getOrders()).resolves.toEqual(orders);
});

test("happy: createOrder envía exactamente {addressId, paymentMethodId}, nada de productos ni totales", async () => {
  let body;
  server.use(
    rest.post(url("/orders"), async (req, res, ctx) => {
      body = await req.json();
      return res(ctx.status(201), ctx.json({ _id: "o1" }));
    }),
  );

  await createOrder({ addressId: "a1", paymentMethodId: "pm1", total: 999, products: [{}] });

  expect(body).toEqual({ addressId: "a1", paymentMethodId: "pm1" });
});

test("negativo: datos no válidos (422, carrito vacío o ids ausentes) rechaza con kind VALIDATION", async () => {
  server.use(
    rest.post(url("/orders"), (req, res, ctx) =>
      res(ctx.status(422), ctx.json({ errors: [{ path: "addressId", msg: "requerido" }] })),
    ),
  );

  await expect(createOrder({ addressId: null, paymentMethodId: null })).rejects.toMatchObject({
    kind: "VALIDATION",
  });
});
