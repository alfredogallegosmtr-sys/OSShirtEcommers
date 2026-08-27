import { rest } from "msw";
import { server } from "../mocks/server";
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "./paymentMethodService";

const url = (path) => `http://localhost:4001/api${path}`;

test("happy: CRUD contra /payment-methods devuelve response.data", async () => {
  const methods = [{ _id: "pm1", brand: "visa" }];
  const created = { _id: "pm2", brand: "mastercard" };
  const updated = { _id: "pm1", brand: "visa", isDefault: true };
  server.use(
    rest.get(url("/payment-methods"), (req, res, ctx) => res(ctx.status(200), ctx.json(methods))),
    rest.post(url("/payment-methods"), (req, res, ctx) => res(ctx.status(201), ctx.json(created))),
    rest.put(url("/payment-methods/pm1"), (req, res, ctx) => res(ctx.status(200), ctx.json(updated))),
    rest.delete(url("/payment-methods/pm1"), (req, res, ctx) => res(ctx.status(200), ctx.json({ ok: true }))),
  );

  await expect(getPaymentMethods()).resolves.toEqual(methods);
  await expect(createPaymentMethod({ brand: "mastercard" })).resolves.toEqual(created);
  await expect(updatePaymentMethod("pm1", { isDefault: true })).resolves.toEqual(updated);
  await expect(deletePaymentMethod("pm1")).resolves.toEqual({ ok: true });
});

test("negativo: datos de tarjeta prohibidos - createPaymentMethod({cardNumber,cvv}) contra 422 rechaza con kind VALIDATION", async () => {
  server.use(
    rest.post(url("/payment-methods"), (req, res, ctx) =>
      res(
        ctx.status(422),
        ctx.json({ errors: [{ path: "cardNumber", msg: "no se debe enviar el número completo" }] }),
      ),
    ),
  );

  await expect(
    createPaymentMethod({ cardNumber: "4111111111111111", cvv: "123" }),
  ).rejects.toMatchObject({ kind: "VALIDATION" });
});

test("negativo: método de otro usuario - PUT/DELETE con 404 rechazan con kind NOT_FOUND", async () => {
  server.use(
    rest.put(url("/payment-methods/otro-usuario"), (req, res, ctx) =>
      res(ctx.status(404), ctx.json({ message: "not found" })),
    ),
    rest.delete(url("/payment-methods/otro-usuario"), (req, res, ctx) =>
      res(ctx.status(404), ctx.json({ message: "not found" })),
    ),
  );

  await expect(updatePaymentMethod("otro-usuario", {})).rejects.toMatchObject({ kind: "NOT_FOUND" });
  await expect(deletePaymentMethod("otro-usuario")).rejects.toMatchObject({ kind: "NOT_FOUND" });
});
