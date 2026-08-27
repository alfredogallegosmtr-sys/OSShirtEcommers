import { rest } from "msw";
import { server } from "../mocks/server";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategoryAndChildren,
} from "./categoryService";

const url = (path) => `http://localhost:4001/api${path}`;

test("happy: getAllCategories devuelve el array; getCategoryById devuelve la categoría", async () => {
  const categories = [{ _id: "c1", name: "Anime" }];
  const category = { _id: "c1", name: "Anime" };
  server.use(
    rest.get(url("/categories"), (req, res, ctx) => res(ctx.status(200), ctx.json(categories))),
    rest.get(url("/categories/c1"), (req, res, ctx) => res(ctx.status(200), ctx.json(category))),
  );

  await expect(getAllCategories()).resolves.toEqual(categories);
  await expect(getCategoryById("c1")).resolves.toEqual(category);
});

test("happy paginación por defecto: getProductsByCategoryAndChildren envía page=1 y limit=10 por defecto", async () => {
  let receivedParams;
  server.use(
    rest.get(url("/categories/c1/products"), (req, res, ctx) => {
      receivedParams = Object.fromEntries(req.url.searchParams.entries());
      return res(ctx.status(200), ctx.json({ category: {}, products: [] }));
    }),
  );

  await getProductsByCategoryAndChildren("c1");

  expect(receivedParams).toEqual({ page: "1", limit: "10" });
});

test("happy paginación: con {page:2, limit:50} envía esos valores", async () => {
  let receivedParams;
  server.use(
    rest.get(url("/categories/c1/products"), (req, res, ctx) => {
      receivedParams = Object.fromEntries(req.url.searchParams.entries());
      return res(ctx.status(200), ctx.json({ category: {}, products: [] }));
    }),
  );

  await getProductsByCategoryAndChildren("c1", { page: 2, limit: 50 });

  expect(receivedParams).toEqual({ page: "2", limit: "50" });
});

test("negativo: id inválido (422) en /categories/:id/products rechaza con kind VALIDATION", async () => {
  server.use(
    rest.get(url("/categories/bad-id/products"), (req, res, ctx) =>
      res(ctx.status(422), ctx.json({ errors: [{ path: "id", msg: "inválido" }] })),
    ),
  );

  await expect(getProductsByCategoryAndChildren("bad-id")).rejects.toMatchObject({
    kind: "VALIDATION",
  });
});

test("negativo: getCategoryById con 404 rechaza con kind NOT_FOUND", async () => {
  server.use(
    rest.get(url("/categories/no-existe"), (req, res, ctx) =>
      res(ctx.status(404), ctx.json({ message: "not found" })),
    ),
  );

  await expect(getCategoryById("no-existe")).rejects.toMatchObject({ kind: "NOT_FOUND" });
});

test("negativo: sin rol admin (403) -> createCategory/updateCategory/deleteCategory rechazan con kind FORBIDDEN", async () => {
  server.use(
    rest.post(url("/categories"), (req, res, ctx) => res(ctx.status(403), ctx.json({ message: "forbidden" }))),
    rest.put(url("/categories/c1"), (req, res, ctx) => res(ctx.status(403), ctx.json({ message: "forbidden" }))),
    rest.delete(url("/categories/c1"), (req, res, ctx) => res(ctx.status(403), ctx.json({ message: "forbidden" }))),
  );

  await expect(createCategory({})).rejects.toMatchObject({ kind: "FORBIDDEN" });
  await expect(updateCategory({}, "c1")).rejects.toMatchObject({ kind: "FORBIDDEN" });
  await expect(deleteCategory("c1")).rejects.toMatchObject({ kind: "FORBIDDEN" });
});
