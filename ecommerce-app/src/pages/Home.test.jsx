import { render, screen } from "@testing-library/react";
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

test('negativo: error de red -> "No pudimos conectar. Revisa tu conexión a internet"', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res) => res.networkError("fail")),
  );

  renderHome();

  expect(
    await screen.findByText("No pudimos conectar. Revisa tu conexión a internet"),
  ).toBeInTheDocument();
});

test('negativo: 500 -> "Algo salió mal. Intenta mas tarde."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res, ctx) => res(ctx.status(500))),
  );

  renderHome();

  expect(await screen.findByText("Algo salió mal. Intenta mas tarde.")).toBeInTheDocument();
});

test('negativo: otro error (403) -> "Ocurrió un error inesperado." con el kind concatenado', async () => {
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res, ctx) => res(ctx.status(403))),
  );

  renderHome();

  expect(await screen.findByText("Ocurrió un error inesperado.FORBIDDEN")).toBeInTheDocument();
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
