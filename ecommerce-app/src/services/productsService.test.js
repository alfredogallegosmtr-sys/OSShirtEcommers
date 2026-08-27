import { rest } from "msw";
import { server } from "../mocks/server";
import {
  getAllProducts,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./productsService";

const url = (path) => `http://localhost:4001/api${path}`;

test("happy: getAllProducts devuelve {products} tal cual lo manda el backend", async () => {
  const products = [{ _id: "p1", name: "Camiseta" }];
  server.use(rest.get(url("/products"), (req, res, ctx) => res(ctx.status(200), ctx.json({ products }))));

  await expect(getAllProducts()).resolves.toEqual({ products });
});

test("happy: getProductById devuelve el producto", async () => {
  const product = { _id: "p1", name: "Camiseta" };
  server.use(rest.get(url("/products/p1"), (req, res, ctx) => res(ctx.status(200), ctx.json(product))));

  await expect(getProductById("p1")).resolves.toEqual(product);
});

test("negativo: producto inexistente (404) rechaza con kind NOT_FOUND", async () => {
  server.use(
    rest.get(url("/products/no-existe"), (req, res, ctx) =>
      res(ctx.status(404), ctx.json({ message: "not found" })),
    ),
  );

  await expect(getProductById("no-existe")).rejects.toMatchObject({ kind: "NOT_FOUND" });
});

test("happy: searchProducts envía los query params y devuelve {products,pagination}", async () => {
  let receivedParams;
  server.use(
    rest.get(url("/products/search"), (req, res, ctx) => {
      receivedParams = Object.fromEntries(req.url.searchParams.entries());
      return res(
        ctx.status(200),
        ctx.json({ products: [], pagination: { page: 1, limit: 10, totalResults: 0, totalPages: 0 } }),
      );
    }),
  );

  const result = await searchProducts({ q: "naruto", sort: "price", order: "asc" });

  expect(receivedParams).toEqual({ q: "naruto", sort: "price", order: "asc" });
  expect(result).toEqual({ products: [], pagination: { page: 1, limit: 10, totalResults: 0, totalPages: 0 } });
});

test("negativo: minPrice NaN no viaja en la query", async () => {
  let receivedParams;
  server.use(
    rest.get(url("/products/search"), (req, res, ctx) => {
      receivedParams = Object.fromEntries(req.url.searchParams.entries());
      return res(ctx.status(200), ctx.json({ products: [] }));
    }),
  );

  await searchProducts({ minPrice: NaN });

  expect(receivedParams.minPrice).toBeUndefined();
});

test("negativo: maxPrice null no viaja en la query", async () => {
  let receivedParams;
  server.use(
    rest.get(url("/products/search"), (req, res, ctx) => {
      receivedParams = Object.fromEntries(req.url.searchParams.entries());
      return res(ctx.status(200), ctx.json({ products: [] }));
    }),
  );

  await searchProducts({ maxPrice: null });

  expect(receivedParams.maxPrice).toBeUndefined();
});

test('negativo: inStock no booleano ("true" string) no viaja en la query', async () => {
  let receivedParams;
  server.use(
    rest.get(url("/products/search"), (req, res, ctx) => {
      receivedParams = Object.fromEntries(req.url.searchParams.entries());
      return res(ctx.status(200), ctx.json({ products: [] }));
    }),
  );

  await searchProducts({ inStock: "true" });

  expect(receivedParams.inStock).toBeUndefined();
});

test("negativo: sin filtros -> la petición no lleva ningún query param", async () => {
  let receivedParams;
  server.use(
    rest.get(url("/products/search"), (req, res, ctx) => {
      receivedParams = Object.fromEntries(req.url.searchParams.entries());
      return res(ctx.status(200), ctx.json({ products: [] }));
    }),
  );

  await searchProducts();

  expect(receivedParams).toEqual({});
});

test("happy admin CRUD: createProduct/updateProduct devuelven el producto; deleteProduct resuelve sin valor con 204", async () => {
  const created = { _id: "p1", name: "Nueva" };
  const updated = { _id: "p1", name: "Actualizada" };
  server.use(
    rest.post(url("/products"), (req, res, ctx) => res(ctx.status(201), ctx.json(created))),
    rest.put(url("/products/p1"), (req, res, ctx) => res(ctx.status(200), ctx.json(updated))),
    rest.delete(url("/products/p1"), (req, res, ctx) => res(ctx.status(204))),
  );

  await expect(createProduct({ name: "Nueva" })).resolves.toEqual(created);
  await expect(updateProduct("p1", { name: "Actualizada" })).resolves.toEqual(updated);
  await expect(deleteProduct("p1")).resolves.toBeUndefined();
});

test("negativo: sin rol admin (403) -> createProduct/updateProduct/deleteProduct rechazan con kind FORBIDDEN", async () => {
  server.use(
    rest.post(url("/products"), (req, res, ctx) => res(ctx.status(403), ctx.json({ message: "forbidden" }))),
    rest.put(url("/products/p1"), (req, res, ctx) => res(ctx.status(403), ctx.json({ message: "forbidden" }))),
    rest.delete(url("/products/p1"), (req, res, ctx) => res(ctx.status(403), ctx.json({ message: "forbidden" }))),
  );

  await expect(createProduct({})).rejects.toMatchObject({ kind: "FORBIDDEN" });
  await expect(updateProduct("p1", {})).rejects.toMatchObject({ kind: "FORBIDDEN" });
  await expect(deleteProduct("p1")).rejects.toMatchObject({ kind: "FORBIDDEN" });
});
