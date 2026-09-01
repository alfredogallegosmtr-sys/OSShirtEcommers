import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { rest } from "msw";
import { server } from "../mocks/server";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Home from "./Home";

const makeProduct = (i) => ({
  _id: `p${i}`,
  name: `Producto ${i}`,
  price: 100 + i,
  stock: 5,
});

function renderHome() {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test('happy: >=5 productos -> se ven las 5 secciones y el carrusel de banners', async () => {
  const products = Array.from({ length: 10 }, (_, i) => makeProduct(i + 1));
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products })),
    ),
  );

  renderHome();

  expect(await screen.findByRole("heading", { name: "Productos recomendados" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Ofertas del día" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Novedades" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Más vendidos" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Flash sale" })).toBeInTheDocument();
  expect(screen.getAllByLabelText("Producto anterior").length).toBeGreaterThan(0);
});

test('negativo: catálogo vacío -> "No hay productos en el catálogo." y ninguna sección', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products: [] })),
    ),
  );

  renderHome();

  expect(await screen.findByText("No hay productos en el catálogo.")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Productos recomendados" })).not.toBeInTheDocument();
});

test('negativo: error de red -> título honesto, sin culpar la conexión del usuario', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res) => res.networkError("fail")),
  );

  renderHome();

  expect(await screen.findByText("No pudimos cargar el catálogo")).toBeInTheDocument();
  expect(
    screen.getByText(/Tu carrito y tu sesión no se vieron afectados/),
  ).toBeInTheDocument();
});

test('negativo: 500 -> título honesto de fallo del servidor', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res, ctx) => res(ctx.status(500))),
  );

  renderHome();

  expect(await screen.findByText("No pudimos cargar el catálogo")).toBeInTheDocument();
  expect(screen.getByText(/Algo salió mal de nuestro lado/)).toBeInTheDocument();
});

test('negativo: otro error (403) -> mensaje genérico, sin filtrar el kind interno', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res, ctx) => res(ctx.status(403))),
  );

  renderHome();

  expect(await screen.findByText("No pudimos cargar el catálogo")).toBeInTheDocument();
  expect(screen.getByText(/Ocurrió un error inesperado/)).toBeInTheDocument();
  expect(screen.queryByText(/FORBIDDEN/)).not.toBeInTheDocument();
});

test('negativo: botón "Intentar de nuevo" recarga la página', async () => {
  const reload = jest.fn();
  Object.defineProperty(window, "location", { value: { reload }, writable: true });
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res, ctx) => res(ctx.status(500))),
  );

  renderHome();

  const retryButton = await screen.findByRole("button", { name: "Intentar de nuevo" });
  await userEvent.click(retryButton);

  expect(reload).toHaveBeenCalled();
});

test('happy loading: mientras responde el handler se ve "Cargando productos..."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res, ctx) =>
      res(ctx.delay(50), ctx.status(200), ctx.json({ products: [] })),
    ),
  );

  renderHome();

  expect(await screen.findByText("Cargando productos...")).toBeVisible();
  await screen.findByText("No hay productos en el catálogo.");
});
