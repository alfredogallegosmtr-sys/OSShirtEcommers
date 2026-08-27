import { rest } from "msw";
import { server } from "../mocks/server";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "./addressService";

const url = (path) => `http://localhost:4001/api${path}`;

test("happy: getAddresses/createAddress/updateAddress/deleteAddress devuelven response.data y pegan a /addresses y /addresses/:id", async () => {
  const addresses = [{ _id: "a1", street: "Calle 1" }];
  const created = { _id: "a2", street: "Calle 2" };
  const updated = { _id: "a1", street: "Calle 1 actualizada" };
  server.use(
    rest.get(url("/addresses"), (req, res, ctx) => res(ctx.status(200), ctx.json(addresses))),
    rest.post(url("/addresses"), (req, res, ctx) => res(ctx.status(201), ctx.json(created))),
    rest.put(url("/addresses/a1"), (req, res, ctx) => res(ctx.status(200), ctx.json(updated))),
    rest.delete(url("/addresses/a1"), (req, res, ctx) => res(ctx.status(200), ctx.json({ ok: true }))),
  );

  await expect(getAddresses()).resolves.toEqual(addresses);
  await expect(createAddress({ street: "Calle 2" })).resolves.toEqual(created);
  await expect(updateAddress("a1", { street: "Calle 1 actualizada" })).resolves.toEqual(updated);
  await expect(deleteAddress("a1")).resolves.toEqual({ ok: true });
});

test("negativo: dirección de otro usuario - PUT/DELETE con 404 rechazan con kind NOT_FOUND", async () => {
  server.use(
    rest.put(url("/addresses/otro-usuario"), (req, res, ctx) =>
      res(ctx.status(404), ctx.json({ message: "not found" })),
    ),
    rest.delete(url("/addresses/otro-usuario"), (req, res, ctx) =>
      res(ctx.status(404), ctx.json({ message: "not found" })),
    ),
  );

  await expect(updateAddress("otro-usuario", {})).rejects.toMatchObject({ kind: "NOT_FOUND" });
  await expect(deleteAddress("otro-usuario")).rejects.toMatchObject({ kind: "NOT_FOUND" });
});
