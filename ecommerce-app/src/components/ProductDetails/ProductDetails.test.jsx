import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { rest } from "msw";
import { server } from "../../mocks/server";
import { AuthProvider } from "../../context/AuthContext";
import { CartProvider, useCart } from "../../context/CartContext";
import ProductDetails from "./ProductDetails";

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

const product = (overrides = {}) => ({
  _id: "p1",
  name: "Camiseta Naruto",
  description: "Descripción del producto",
  price: 250,
  stock: 5,
  category: { _id: "c1", name: "Anime" },
  ...overrides,
});

function CartCount() {
  const { count } = useCart();
  return <div data-testid="cart-count">{count}</div>;
}

function renderDetails({ authenticated = false } = {}) {
  if (authenticated) {
    localStorage.setItem(
      "authToken",
      makeToken({ userId: "u1", name: "Ana", role: "customer", exp: 9999999999 }),
    );
  }
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <CartCount />
          <ProductDetails productId="p1" />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test("happy: nombre, descripción, precio, badge En stock, unidades disponibles, breadcrumb y botón habilitado", async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res, ctx) =>
      res(ctx.status(200), ctx.json(product())),
    ),
  );

  renderDetails();

  expect(await screen.findByText("Camiseta Naruto")).toBeInTheDocument();
  expect(screen.getByText("Descripción del producto")).toBeInTheDocument();
  expect(screen.getByText("$250")).toBeInTheDocument();
  expect(screen.getByText("En stock")).toBeInTheDocument();
  expect(screen.getByText("5 unidades disponibles")).toBeInTheDocument();
  expect(screen.getAllByText("Anime").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: /agregar al carrito/i })).toBeEnabled();
});

test("negativo: stock 0 -> badge Agotado, sin línea de unidades y botón deshabilitado", async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res, ctx) =>
      res(ctx.status(200), ctx.json(product({ stock: 0 }))),
    ),
  );

  renderDetails();

  expect(await screen.findByText("Agotado")).toBeInTheDocument();
  expect(screen.queryByText(/unidades disponibles/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /agregar al carrito/i })).toBeDisabled();
});

test('negativo: 404 -> "Producto no encontrado" + enlace "Volver al catálogo"', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res, ctx) => res(ctx.status(404))),
  );

  renderDetails();

  expect(await screen.findByText("Producto no encontrado")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /volver al catálogo/i })).toBeInTheDocument();
});

test('negativo: error de red -> título honesto, sin culpar la conexión del usuario, con botón de retry', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res) => res.networkError("fail")),
  );

  renderDetails();

  expect(await screen.findByText("No pudimos cargar este producto")).toBeInTheDocument();
  expect(
    screen.getByText(/Tu carrito y tu sesión no se vieron afectados/),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Intentar de nuevo" })).toBeInTheDocument();
});

test('negativo: 500 -> título honesto de fallo del servidor', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res, ctx) => res(ctx.status(500))),
  );

  renderDetails();

  expect(await screen.findByText("No pudimos cargar este producto")).toBeInTheDocument();
  expect(screen.getByText(/Algo salió mal de nuestro lado/)).toBeInTheDocument();
});

test('negativo: error no clasificado (403 -> FORBIDDEN) -> mensaje genérico, sin filtrar el kind', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res, ctx) => res(ctx.status(403))),
  );

  renderDetails();

  expect(await screen.findByText("No pudimos cargar este producto")).toBeInTheDocument();
  expect(screen.getByText(/Ocurrió un error inesperado/)).toBeInTheDocument();
  expect(screen.queryByText(/FORBIDDEN/)).not.toBeInTheDocument();
});

test("negativo: invitado -> no aparece el botón de favoritos y no se llama a /api/wishlist", async () => {
  let wishlistCalled = false;
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res, ctx) =>
      res(ctx.status(200), ctx.json(product())),
    ),
    rest.get("http://localhost:4001/api/wishlist", (req, res, ctx) => {
      wishlistCalled = true;
      return res(ctx.status(200), ctx.json({ products: [] }));
    }),
  );

  renderDetails();

  await screen.findByText("Camiseta Naruto");
  expect(screen.queryByText(/favoritos/i)).not.toBeInTheDocument();
  expect(wishlistCalled).toBe(false);
});

test('happy favoritos: con sesión y producto ya en wishlist -> "♥ En favoritos"; al pulsar llama a DELETE y pasa a "♡ Agregar a favoritos"', async () => {
  let deleteCalled = false;
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res, ctx) =>
      res(ctx.status(200), ctx.json(product())),
    ),
    rest.get("http://localhost:4001/api/wishlist", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [{ _id: "p1" }] })),
    ),
    rest.delete("http://localhost:4001/api/wishlist/p1", (req, res, ctx) => {
      deleteCalled = true;
      return res(ctx.status(200), ctx.json({ products: [] }));
    }),
  );

  renderDetails({ authenticated: true });

  const favButton = await screen.findByRole("button", { name: "♥ En favoritos" });
  await userEvent.click(favButton);

  expect(await screen.findByRole("button", { name: "♡ Agregar a favoritos" })).toBeInTheDocument();
  expect(deleteCalled).toBe(true);
});

test("negativo: fallo de wishlist (POST 500) -> ningún error bloqueante, la ficha sigue usable", async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res, ctx) =>
      res(ctx.status(200), ctx.json(product())),
    ),
    rest.get("http://localhost:4001/api/wishlist", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [] })),
    ),
    rest.post("http://localhost:4001/api/wishlist", (req, res, ctx) => res(ctx.status(500))),
  );

  renderDetails({ authenticated: true });

  const favButton = await screen.findByRole("button", { name: "♡ Agregar a favoritos" });
  await userEvent.click(favButton);

  await waitFor(() => expect(favButton).toBeEnabled());
  expect(screen.getByText("Camiseta Naruto")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /agregar al carrito/i })).toBeEnabled();
});

test("happy agregar al carrito: click en Agregar al carrito refleja el ítem en el contador del carrito", async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res, ctx) =>
      res(ctx.status(200), ctx.json(product())),
    ),
  );

  renderDetails();
  await screen.findByText("Camiseta Naruto");

  expect(screen.getByTestId("cart-count")).toHaveTextContent("0");
  await userEvent.click(screen.getByRole("button", { name: /agregar al carrito/i }));
  expect(screen.getByTestId("cart-count")).toHaveTextContent("1");
});

test("regresión B-09: los mensajes de error se ven en pantalla como children de ErrorMessage", async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/p1", (req, res, ctx) => res(ctx.status(500))),
  );

  renderDetails();

  const heading = await screen.findByRole("heading", {
    name: "No pudimos cargar este producto",
  });
  expect(heading).toBeVisible();
});
