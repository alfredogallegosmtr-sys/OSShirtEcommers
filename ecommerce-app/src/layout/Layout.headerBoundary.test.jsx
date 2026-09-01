import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";
import Layout from "./Layout";

// Header real reemplazado por uno que revienta al renderizar, para probar que
// el ErrorBoundary de Layout.jsx lo aísla sin afectar a Footer ni al contenido
// de la página (children).
jest.mock("./Header/Header", () => function ThrowingHeader() {
  throw new Error("boom en Header");
});

test("un error en Header no se lleva el contenido de la página ni el Footer", () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

  render(
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Layout>
              <main data-testid="page-content">Contenido de la página</main>
            </Layout>
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>,
  );

  expect(screen.getByText("Ocurrió un error al cargar esta página.")).toBeInTheDocument();
  expect(screen.getByTestId("page-content")).toBeInTheDocument();
  expect(document.querySelector("footer.footer")).toBeInTheDocument();

  consoleError.mockRestore();
});
