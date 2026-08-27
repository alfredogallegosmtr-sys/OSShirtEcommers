import { rest } from "msw";
import { server } from "../mocks/server";
import { getCart, addItem, updateQuantity, removeItem, clearCart } from "./cartService";

const url = (path) => `http://localhost:4001/api${path}`;

test("happy: getCart devuelve {items}", async () => {
  const items = [{ id: "i1", quantity: 1, product: { _id: "p1", price: 10 } }];
  server.use(rest.get(url("/cart"), (req, res, ctx) => res(ctx.status(200), ctx.json({ items }))));

  await expect(getCart()).resolves.toEqual({ items });
});

test("happy: addItem envía quantity:1 por defecto", async () => {
  let body;
  server.use(
    rest.post(url("/cart"), async (req, res, ctx) => {
      body = await req.json();
      return res(ctx.status(200), ctx.json({ items: [] }));
    }),
  );

  await addItem("p1");

  expect(body).toEqual({ productId: "p1", quantity: 1 });
});

test("happy: updateQuantity(itemId, 3) envía {quantity:3} a PATCH /api/cart/:itemId", async () => {
  let body;
  server.use(
    rest.patch(url("/cart/i1"), async (req, res, ctx) => {
      body = await req.json();
      return res(ctx.status(200), ctx.json({ items: [] }));
    }),
  );

  await updateQuantity("i1", 3);

  expect(body).toEqual({ quantity: 3 });
});

test("happy: removeItem y clearCart devuelven el carrito actualizado", async () => {
  const updatedAfterRemove = { items: [] };
  const updatedAfterClear = { items: [] };
  server.use(
    rest.delete(url("/cart/i1"), (req, res, ctx) => res(ctx.status(200), ctx.json(updatedAfterRemove))),
    rest.delete(url("/cart"), (req, res, ctx) => res(ctx.status(200), ctx.json(updatedAfterClear))),
  );

  await expect(removeItem("i1")).resolves.toEqual(updatedAfterRemove);
  await expect(clearCart()).resolves.toEqual(updatedAfterClear);
});

test("negativo: sin sesión (401) -> getCart/addItem/updateQuantity/removeItem/clearCart rechazan con kind UNAUTHORIZED", async () => {
  server.use(
    rest.get(url("/cart"), (req, res, ctx) => res(ctx.status(401), ctx.json({ message: "no auth" }))),
    rest.post(url("/cart"), (req, res, ctx) => res(ctx.status(401), ctx.json({ message: "no auth" }))),
    rest.patch(url("/cart/i1"), (req, res, ctx) => res(ctx.status(401), ctx.json({ message: "no auth" }))),
    rest.delete(url("/cart/i1"), (req, res, ctx) => res(ctx.status(401), ctx.json({ message: "no auth" }))),
    rest.delete(url("/cart"), (req, res, ctx) => res(ctx.status(401), ctx.json({ message: "no auth" }))),
  );

  await expect(getCart()).rejects.toMatchObject({ kind: "UNAUTHORIZED" });
  await expect(addItem("p1")).rejects.toMatchObject({ kind: "UNAUTHORIZED" });
  await expect(updateQuantity("i1", 2)).rejects.toMatchObject({ kind: "UNAUTHORIZED" });
  await expect(removeItem("i1")).rejects.toMatchObject({ kind: "UNAUTHORIZED" });
  await expect(clearCart()).rejects.toMatchObject({ kind: "UNAUTHORIZED" });
});

test("negativo: cantidad inválida - updateQuantity(itemId, 0) contra un handler 422 rechaza con kind VALIDATION", async () => {
  server.use(
    rest.patch(url("/cart/i1"), (req, res, ctx) =>
      res(ctx.status(422), ctx.json({ errors: [{ path: "quantity", msg: "inválida" }] })),
    ),
  );

  await expect(updateQuantity("i1", 0)).rejects.toMatchObject({ kind: "VALIDATION" });
});
