import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";

function renderFooter(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Footer />
    </MemoryRouter>,
  );
}

test("happy: en / se renderiza el bloque principal del footer", () => {
  renderFooter("/");

  expect(screen.getByText("Síguenos")).toBeInTheDocument();
  expect(screen.getByText("Categorías")).toBeInTheDocument();
  expect(screen.getByText("Métodos de Pago")).toBeInTheDocument();
});

test("negativo: fuera del home ese bloque no se renderiza", () => {
  renderFooter("/cart");

  expect(screen.queryByText("Síguenos")).not.toBeInTheDocument();
  expect(screen.queryByText("Categorías")).not.toBeInTheDocument();
  expect(screen.queryByText("Métodos de Pago")).not.toBeInTheDocument();
  // El bloque legal del fondo (footer-bottom) sigue presente en cualquier ruta.
  expect(screen.getByText(/Todos los derechos/)).toBeInTheDocument();
});
