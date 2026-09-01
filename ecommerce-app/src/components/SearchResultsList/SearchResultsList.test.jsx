import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { rest } from "msw";
import { server } from "../../mocks/server";
import { AuthProvider } from "../../context/AuthContext";
import { CartProvider } from "../../context/CartContext";
import SearchResultsList from "./SearchResultsList";

const product = (overrides = {}) => ({
  _id: "p1",
  name: "Camiseta Naruto",
  price: 100,
  stock: 3,
  ...overrides,
});

function renderSearch(initialEntry = "/search") {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <SearchResultsList />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test('happy con query: título Resultados para "naruto", conteo y lista de resultados', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/search", (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({
          products: [product()],
          pagination: { page: 1, limit: 30, totalResults: 7, totalPages: 1 },
        }),
      ),
    ),
  );

  renderSearch("/search?q=naruto");

  expect(await screen.findByRole("heading", { name: 'Resultados para "naruto"' })).toBeInTheDocument();
  expect(await screen.findByText("Camiseta Naruto")).toBeInTheDocument();
  expect(screen.getByText("Encontramos 7 productos")).toBeInTheDocument();
});

test('happy sin query: "Explora nuestro catálogo" y sin controles de ordenamiento', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/search", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [], pagination: { totalResults: 0 } })),
    ),
  );

  renderSearch("/search");

  expect(await screen.findByRole("heading", { name: "Explora nuestro catálogo" })).toBeInTheDocument();
  expect(screen.queryByText("Ordenar por: ")).not.toBeInTheDocument();
});

test("happy ordenamiento: cambiar el select a Precio y pulsar el botón de orden repite la búsqueda con sort=price y order alternado", async () => {
  const receivedQueries = [];
  server.use(
    rest.get("http://localhost:4001/api/products/search", (req, res, ctx) => {
      receivedQueries.push(Object.fromEntries(req.url.searchParams.entries()));
      return res(
        ctx.status(200),
        ctx.json({ products: [product()], pagination: { totalResults: 1 } }),
      );
    }),
  );

  renderSearch("/search?q=naruto");
  await screen.findByText("Camiseta Naruto");

  await userEvent.selectOptions(screen.getByRole("combobox"), "price");
  await screen.findByText("Camiseta Naruto");

  expect(screen.getByRole("button", { name: "Descendente" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Descendente" }));
  await screen.findByRole("button", { name: "Ascendente" });

  const last = receivedQueries[receivedQueries.length - 1];
  expect(last.sort).toBe("price");
  expect(last.order).toBe("asc");
});

test('negativo: sin coincidencias -> No encontramos coincidencias para "..." + enlace Ofertas destacadas', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/search", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [], pagination: { totalResults: 0 } })),
    ),
  );

  renderSearch("/search?q=inexistente");

  expect(
    await screen.findByText('No encontramos coincidencias para "inexistente"'),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /ofertas destacadas/i })).toBeInTheDocument();
});

test('negativo: error de red -> título honesto, sin culpar la conexión del usuario, con retry', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/search", (req, res) => res.networkError("fail")),
  );

  renderSearch("/search?q=naruto");

  expect(await screen.findByText("No pudimos cargar los resultados")).toBeInTheDocument();
  expect(
    screen.getByText(/Tu carrito y tu sesión no se vieron afectados/),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Intentar de nuevo" })).toBeInTheDocument();
});

test('negativo: 500 -> título honesto de fallo del servidor', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/search", (req, res, ctx) => res(ctx.status(500))),
  );

  renderSearch("/search?q=naruto");

  expect(await screen.findByText("No pudimos cargar los resultados")).toBeInTheDocument();
  expect(screen.getByText(/Algo salió mal de nuestro lado/)).toBeInTheDocument();
});

test('negativo: otro error (403) -> mensaje genérico, sin filtrar el kind', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/search", (req, res, ctx) => res(ctx.status(403))),
  );

  renderSearch("/search?q=naruto");

  expect(await screen.findByText("No pudimos cargar los resultados")).toBeInTheDocument();
  expect(screen.getByText(/Ocurrió un error inesperado/)).toBeInTheDocument();
  expect(screen.queryByText(/FORBIDDEN/)).not.toBeInTheDocument();
});

test('happy loading: durante la búsqueda se ve "Buscando productos..."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products/search", (req, res, ctx) =>
      res(ctx.delay(50), ctx.status(200), ctx.json({ products: [], pagination: { totalResults: 0 } })),
    ),
  );

  renderSearch("/search?q=naruto");

  expect(await screen.findByText("Buscando productos...")).toBeVisible();
  await screen.findByText('No encontramos coincidencias para "naruto"');
});
