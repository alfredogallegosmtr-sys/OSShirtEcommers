import { render, screen } from "@testing-library/react";
import { rest } from "msw";
import { server } from "../../mocks/server";
import { ThemeProvider } from "../../context/ThemeContext";
import App from "./App";

// App.jsx crea su propio BrowserRouter (no acepta un router inyectado), así
// que la ruta inicial se controla escribiendo directamente en el History API
// del navegador antes de cada render — patrón estándar para probar
// componentes con un Router fijo.
function renderAppAt(path) {
  window.history.pushState({}, "", path);
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

// Header (montado en cada ruta vía Layout) siempre dispara GET /api/categories
// a través de Navigation, así que todos los tests necesitan este handler.
function mockCategories() {
  server.use(
    rest.get("http://localhost:4001/api/categories", (req, res, ctx) =>
      res(ctx.status(200), ctx.json([])),
    ),
  );
}

function mockProducts(products = []) {
  server.use(
    rest.get("http://localhost:4001/api/products", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ products })),
    ),
  );
}

function mockSearch(products = []) {
  server.use(
    rest.get("http://localhost:4001/api/products/search", (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({
          products,
          pagination: { page: 1, limit: 30, totalResults: products.length, totalPages: 1 },
        }),
      ),
    ),
  );
}

function mockProductById(product) {
  server.use(
    rest.get(`http://localhost:4001/api/products/${product._id}`, (req, res, ctx) =>
      res(ctx.status(200), ctx.json(product)),
    ),
  );
}

function mockCategoryProducts(category, products = []) {
  server.use(
    rest.get(`http://localhost:4001/api/categories/${category._id}/products`, (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ category, products })),
    ),
  );
}

beforeEach(() => {
  mockCategories();
});

afterEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
});

describe("rutas públicas: renderizan sin sesión", () => {
  test("/ (Home)", async () => {
    mockProducts([]);
    renderAppAt("/");
    expect(await screen.findByText("No hay productos en el catálogo.")).toBeInTheDocument();
    expect(screen.queryByText("Ruta no encontrada")).not.toBeInTheDocument();
  });

  test("/cart", async () => {
    renderAppAt("/cart");
    expect(await screen.findByText("Tu carrito está vacío")).toBeInTheDocument();
  });

  test("/login", async () => {
    renderAppAt("/login");
    expect(await screen.findByRole("heading", { name: "Iniciar Sesión" })).toBeInTheDocument();
  });

  test("/register", async () => {
    renderAppAt("/register");
    expect(await screen.findByRole("heading", { name: "Crear cuenta" })).toBeInTheDocument();
  });

  test("/search", async () => {
    mockSearch([]);
    renderAppAt("/search");
    expect(
      await screen.findByRole("heading", { name: "Explora nuestro catálogo" }),
    ).toBeInTheDocument();
  });

  test("/product/:productId", async () => {
    mockProductById({ _id: "p1", name: "Camiseta Naruto", price: 100, stock: 5 });
    renderAppAt("/product/p1");
    expect(await screen.findByRole("heading", { name: "Camiseta Naruto" })).toBeInTheDocument();
  });

  test("/category/:categoryId", async () => {
    mockCategoryProducts({ _id: "c1", name: "Naruto" }, []);
    renderAppAt("/category/c1");
    expect(await screen.findByRole("heading", { name: "Naruto" })).toBeInTheDocument();
  });

  test("/order-confirmation (sin state) redirige a / y Home renderiza", async () => {
    mockProducts([]);
    renderAppAt("/order-confirmation");
    expect(await screen.findByText("No hay productos en el catálogo.")).toBeInTheDocument();
  });
});

describe("rutas protegidas: sin sesión redirigen a /login", () => {
  test.each(["/checkout", "/wishlist", "/orders", "/settings"])("%s", async (path) => {
    renderAppAt(path);
    expect(await screen.findByRole("heading", { name: "Iniciar Sesión" })).toBeInTheDocument();
  });
});

test('negativo: /profile con rol no permitido -> "Acceso denegado"', async () => {
  localStorage.setItem(
    "authToken",
    makeToken({ userId: "u1", name: "Ana", role: "vendor", exp: 9999999999 }),
  );
  renderAppAt("/profile");

  expect(await screen.findByText("Acceso denegado")).toBeInTheDocument();
  expect(
    screen.getByText("No tienes permisos para acceder a esta página."),
  ).toBeInTheDocument();
});

test('negativo: ruta inexistente -> "Ruta no encontrada"', async () => {
  renderAppAt("/no-existe");

  expect(await screen.findByText("Ruta no encontrada")).toBeInTheDocument();
});
