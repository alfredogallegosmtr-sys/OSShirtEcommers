import { rest } from "msw";
import { server } from "../mocks/server";
import { getWishlist, addToWishlist, removeFromWishlist } from "./wishlistService";

const url = (path) => `http://localhost:4001/api${path}`;

test("happy: getWishlist devuelve {products}; addToWishlist envía {productId}; removeFromWishlist pega a DELETE /api/wishlist/:productId", async () => {
  const products = [{ _id: "p1", name: "Camiseta" }];
  let addBody;
  server.use(
    rest.get(url("/wishlist"), (req, res, ctx) => res(ctx.status(200), ctx.json({ products }))),
    rest.post(url("/wishlist"), async (req, res, ctx) => {
      addBody = await req.json();
      return res(ctx.status(200), ctx.json({ products }));
    }),
    rest.delete(url("/wishlist/p1"), (req, res, ctx) => res(ctx.status(200), ctx.json({ products: [] }))),
  );

  await expect(getWishlist()).resolves.toEqual({ products });

  await addToWishlist("p1");
  expect(addBody).toEqual({ productId: "p1" });

  await expect(removeFromWishlist("p1")).resolves.toEqual({ products: [] });
});

test("negativo: sin sesión (401) -> getWishlist/addToWishlist/removeFromWishlist rechazan con kind UNAUTHORIZED", async () => {
  server.use(
    rest.get(url("/wishlist"), (req, res, ctx) => res(ctx.status(401), ctx.json({ message: "no auth" }))),
    rest.post(url("/wishlist"), (req, res, ctx) => res(ctx.status(401), ctx.json({ message: "no auth" }))),
    rest.delete(url("/wishlist/p1"), (req, res, ctx) => res(ctx.status(401), ctx.json({ message: "no auth" }))),
  );

  await expect(getWishlist()).rejects.toMatchObject({ kind: "UNAUTHORIZED" });
  await expect(addToWishlist("p1")).rejects.toMatchObject({ kind: "UNAUTHORIZED" });
  await expect(removeFromWishlist("p1")).rejects.toMatchObject({ kind: "UNAUTHORIZED" });
});
