import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { rest } from "msw";
import { server } from "../../mocks/server";
import { AuthProvider } from "../../context/AuthContext";
import { CartProvider } from "../../context/CartContext";
import CategoryProducts from "./CategoryProducts";

const category = (overrides = {}) => ({
  _id: "c1",
  name: "Naruto",
  description: "Todo sobre Naruto",
  ...overrides,
});

const product = (overrides = {}) => ({
  _id: "p1",
  name: "Camiseta Naruto",
  price: 100,
  stock: 3,
  ...overrides,
});

function renderCategory(categoryId = "c1") {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <CategoryProducts categoryId={categoryId} />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test("happy: título, descripción, breadcrumb y una tarjeta por producto", async () => {
  server.use(
    rest.get("http://localhost:4001/api/categories/c1/products", (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({ category: category(), products: [product(), product({ _id: "p2", name: "Otra" })] }),
      ),
    ),
  );

  renderCategory();

  expect(await screen.findByRole("heading", { name: "Naruto" })).toBeInTheDocument();
  expect(screen.getByText("Todo sobre Naruto")).toBeInTheDocument();
  expect(screen.getByText("Camiseta Naruto")).toBeInTheDocument();
  expect(screen.getByText("Otra")).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: /navegación de categorías/i })).toBeInTheDocument();
});

test('happy título anidado: categoría con parentCategory poblada -> "Padre: Hija"', async () => {
  server.use(
    rest.get("http://localhost:4001/api/categories/c1/products", (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({
          category: category({ parentCategory: { _id: "root", name: "Ropa" } }),
          products: [product()],
        }),
      ),
    ),
  );

  renderCategory();

  expect(await screen.findByRole("heading", { name: "Ropa: Naruto" })).toBeInTheDocument();
});

test('negativo: error de carga (500) -> "Categoría no encontrada" + enlace al inicio', async () => {
  server.use(
    rest.get("http://localhost:4001/api/categories/c1/products", (req, res, ctx) => res(ctx.status(500))),
  );

  renderCategory();

  expect(await screen.findByText("Categoría no encontrada")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /inicio/i })).toBeInTheDocument();
});

test('negativo: 200 con category null -> "Categoría no encontrada" (no renderiza el grid vacío)', async () => {
  server.use(
    rest.get("http://localhost:4001/api/categories/c1/products", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ category: null, products: [] })),
    ),
  );

  renderCategory();

  expect(await screen.findByText("Categoría no encontrada")).toBeInTheDocument();
});

test('negativo: categoría sin productos -> "No se encontraron productos" / "No hay productos disponibles..."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/categories/c1/products", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ category: category(), products: [] })),
    ),
  );

  renderCategory();

  expect(await screen.findByText("No se encontraron productos")).toBeInTheDocument();
  expect(
    screen.getByText("No hay productos disponibles en esta categoría por el momento."),
  ).toBeInTheDocument();
});

test('regresión B-09: durante la carga se ve "Cargando categoría y productos..."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/categories/c1/products", (req, res, ctx) =>
      res(ctx.delay(50), ctx.status(200), ctx.json({ category: category(), products: [] })),
    ),
  );

  renderCategory();

  expect(await screen.findByText("Cargando categoría y productos...")).toBeVisible();
  await screen.findByText("No se encontraron productos");
});
