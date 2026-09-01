import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { rest } from "msw";
import { server } from "../mocks/server";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import WishList from "./WishList";

const product = (overrides = {}) => ({
  _id: "p1",
  name: "Camiseta Naruto",
  price: 100,
  stock: 3,
  ...overrides,
});

function renderWishList() {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <WishList />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test('happy: productos en la wishlist -> título, "Tienes N productos guardados" y una tarjeta por producto', async () => {
  server.use(
    rest.get("http://localhost:4001/api/wishlist", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [product(), product({ _id: "p2", name: "Otra" })] })),
    ),
  );

  renderWishList();

  expect(await screen.findByRole("heading", { name: "Mi lista de favoritos" })).toBeInTheDocument();
  expect(screen.getByText("Tienes 2 productos guardados")).toBeInTheDocument();
  expect(screen.getByText("Camiseta Naruto")).toBeInTheDocument();
  expect(screen.getByText("Otra")).toBeInTheDocument();
});

test('happy quitar: "Quitar de favoritos" llama a DELETE /api/wishlist/:productId y el producto desaparece', async () => {
  server.use(
    rest.get("http://localhost:4001/api/wishlist", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [product()] })),
    ),
    rest.delete("http://localhost:4001/api/wishlist/p1", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [] })),
    ),
  );

  renderWishList();
  await screen.findByText("Camiseta Naruto");

  await userEvent.click(screen.getByRole("button", { name: /quitar de favoritos/i }));

  expect(await screen.findByText("Tu lista de favoritos está vacía")).toBeInTheDocument();
});

test('negativo: lista vacía -> "Tu lista de favoritos está vacía" + "Descubrir productos"', async () => {
  server.use(
    rest.get("http://localhost:4001/api/wishlist", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [] })),
    ),
  );

  renderWishList();

  expect(await screen.findByText("Tu lista de favoritos está vacía")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /descubrir productos/i })).toBeInTheDocument();
});

test('negativo: error de carga (500) -> "No se pudo cargar tu lista de favoritos."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/wishlist", (req, res, ctx) => res(ctx.status(500))),
  );

  renderWishList();

  expect(await screen.findByText("No se pudo cargar tu lista de favoritos.")).toBeInTheDocument();
});

test('negativo: error al quitar (DELETE 500) -> mensaje inline, la grilla de favoritos sigue visible', async () => {
  server.use(
    rest.get("http://localhost:4001/api/wishlist", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [product()] })),
    ),
    rest.delete("http://localhost:4001/api/wishlist/p1", (req, res, ctx) => res(ctx.status(500))),
  );

  renderWishList();
  await screen.findByText("Camiseta Naruto");

  await userEvent.click(screen.getByRole("button", { name: /quitar de favoritos/i }));

  expect(
    await screen.findByText("No se pudo quitar el producto de favoritos."),
  ).toBeInTheDocument();
  // La grilla no se reemplaza por el error: el producto sigue visible.
  expect(screen.getByText("Camiseta Naruto")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /quitar de favoritos/i })).toBeInTheDocument();
});

test('negativo: singular - un solo producto -> "Tienes 1 producto guardado"', async () => {
  server.use(
    rest.get("http://localhost:4001/api/wishlist", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [product()] })),
    ),
  );

  renderWishList();

  expect(await screen.findByText("Tienes 1 producto guardado")).toBeInTheDocument();
});
