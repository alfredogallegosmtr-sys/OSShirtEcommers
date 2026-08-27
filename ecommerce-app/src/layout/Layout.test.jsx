import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { rest } from "msw";
import { server } from "../mocks/server";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";
import Layout from "./Layout";

function renderLayout(children) {
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
            <Layout>{children}</Layout>
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>,
  );
}

test("happy: renderiza Header, los children y Footer en ese orden", async () => {
  renderLayout(<main data-testid="page-content">Contenido de la página</main>);

  // Header monta Navigation, que dispara getAllCategories() en un efecto.
  // Se espera a que "Cargando categorías..." desaparezca antes de afirmar el
  // orden del DOM, para no dejar el setState posterior a la promesa colgando
  // fuera de act() (advertencia de React, no falla el test, pero se evita).
  await waitFor(() => {
    expect(screen.queryAllByText("Cargando categorías...")).toHaveLength(0);
  });

  const layoutRoot = document.querySelector(".layout");
  const header = layoutRoot.querySelector("header.header");
  const content = screen.getByTestId("page-content");
  const footer = layoutRoot.querySelector("footer.footer");

  expect(header).toBeInTheDocument();
  expect(content).toBeInTheDocument();
  expect(footer).toBeInTheDocument();

  // Orden real en el DOM: Header -> children -> Footer.
  // eslint-disable-next-line no-bitwise
  expect(header.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  // eslint-disable-next-line no-bitwise
  expect(content.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
