import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { rest } from "msw";
import { server } from "../../mocks/server";
import { AuthProvider } from "../../context/AuthContext";
import { CartProvider } from "../../context/CartContext";
import { ThemeProvider } from "../../context/ThemeContext";
import Header from "./Header";

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function renderHeader({ authenticated = false, name = "Ana Pérez", cart } = {}) {
  if (authenticated) {
    localStorage.setItem(
      "authToken",
      makeToken({ userId: "u1", name, role: "customer", exp: 9999999999 }),
    );
  }
  if (cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  server.use(
    rest.get("http://localhost:4001/api/categories", (req, res, ctx) =>
      res(ctx.status(200), ctx.json([])),
    ),
  );
  return render(
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Header />
            <LocationProbe />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

test('happy búsqueda: escribir "naruto" y enviar -> navega a /search?q=naruto', async () => {
  renderHeader();

  // Nota: hay dos botones con aria-label="Buscar" (el submit del form de
  // escritorio y el trigger de búsqueda móvil), así que se envía el
  // formulario con Enter en vez de un getByRole ambiguo.
  const input = screen.getByPlaceholderText("Buscar productos...");
  await userEvent.type(input, "naruto{enter}");

  expect(await screen.findByTestId("location")).toHaveTextContent("/search?q=naruto");
});

test("negativo: búsqueda vacía -> navega a /search sin q", async () => {
  renderHeader();

  const input = screen.getByPlaceholderText("Buscar productos...");
  await userEvent.type(input, "{enter}");

  expect(await screen.findByTestId("location")).toHaveTextContent("/search");
  expect(screen.getByTestId("location")).not.toHaveTextContent("?q=");
});

test('negativo: invitado -> "Hola, Inicia sesión" y el menú ofrece Iniciar Sesión/Crear Cuenta (no Mis Pedidos ni Cerrar Sesión)', async () => {
  renderHeader();

  // El mismo texto aparece dos veces: en el saludo del Header y en el
  // saludo del drawer de Navigation (que Header monta siempre).
  expect((await screen.findAllByText("Hola, Inicia sesión")).length).toBeGreaterThan(0);

  await userEvent.click(screen.getByRole("button", { name: "Menú de usuario" }));

  expect(screen.getByRole("link", { name: /iniciar sesión/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /mis pedidos/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /cerrar sesión/i })).not.toBeInTheDocument();
});

test('happy autenticado: "Hola, <nombre>", iniciales y enlaces a Mi Cuenta/Mis Pedidos/Lista de Deseos/Configuración', async () => {
  renderHeader({ authenticated: true, name: "Ana Pérez" });

  expect(await screen.findByText("Hola, Ana Pérez")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Menú de usuario" }));

  expect(screen.getAllByText("AP").length).toBeGreaterThan(0);
  expect(screen.getByRole("link", { name: /mi cuenta/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /mis pedidos/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /lista de deseos/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /configuración/i })).toBeInTheDocument();
});

test('happy logout: "Cerrar Sesión" limpia la sesión, cierra el menú y navega a /', async () => {
  renderHeader({ authenticated: true });

  await userEvent.click(screen.getByRole("button", { name: "Menú de usuario" }));
  await userEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

  expect((await screen.findAllByText("Hola, Inicia sesión")).length).toBeGreaterThan(0);
  expect(localStorage.getItem("authToken")).toBeNull();
  expect(screen.queryByRole("button", { name: /cerrar sesión/i })).not.toBeInTheDocument();
  expect(screen.getByTestId("location")).toHaveTextContent("/");
});

test("happy contador del carrito: con 3 unidades muestra 3; con carrito vacío muestra 0", async () => {
  renderHeader({ cart: [{ id: "a1", quantity: 3, product: { _id: "p1", price: 10 } }] });

  const cartLink = await screen.findByRole("link", { name: /ver carrito de compras/i });
  expect(within(cartLink).getByText("3")).toBeInTheDocument();
});

test("negativo: carrito vacío muestra contador 0", async () => {
  renderHeader();

  const cartLink = await screen.findByRole("link", { name: /ver carrito de compras/i });
  expect(within(cartLink).getByText("0")).toBeInTheDocument();
});

test('happy tema: el botón "Cambiar tema" alterna data-theme en <html> y su aria-pressed', async () => {
  renderHeader();

  const themeButton = await screen.findByRole("button", { name: "Cambiar tema" });
  expect(document.documentElement).toHaveAttribute("data-theme", "light");
  expect(themeButton).toHaveAttribute("aria-pressed", "false");

  await userEvent.click(themeButton);

  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  expect(themeButton).toHaveAttribute("aria-pressed", "true");
});

test("negativo: cerrar con Escape - con el menú de usuario abierto, Escape lo cierra", async () => {
  renderHeader();

  await userEvent.click(screen.getByRole("button", { name: "Menú de usuario" }));
  expect(screen.getByRole("link", { name: /iniciar sesión/i })).toBeInTheDocument();

  await userEvent.keyboard("{Escape}");

  expect(screen.queryByRole("link", { name: /iniciar sesión/i })).not.toBeInTheDocument();
});
