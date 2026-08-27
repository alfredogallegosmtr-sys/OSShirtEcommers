import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";

function renderBreadcrumb(categories) {
  return render(
    <MemoryRouter>
      <Breadcrumb categories={categories} />
    </MemoryRouter>,
  );
}

test('happy: categoría con parentCategory poblada -> migas "Inicio > Padre > Hija", la última con aria-current="page" y las anteriores enlazadas', () => {
  renderBreadcrumb({
    _id: "child1",
    name: "Hija",
    parentCategory: { _id: "parent1", name: "Padre" },
  });

  expect(screen.getByRole("link", { name: /inicio/i })).toHaveAttribute("href", "/");
  const padreLink = screen.getByRole("link", { name: "Padre" });
  expect(padreLink).toHaveAttribute("href", "/category/parent1");

  const current = screen.getByText("Hija");
  expect(current).toHaveAttribute("aria-current", "page");
});

test("negativo: sin categorías (undefined) no renderiza nada", () => {
  const { container } = renderBreadcrumb(undefined);
  expect(container).toBeEmptyDOMElement();
});

test("negativo: categories como array vacío no renderiza nada", () => {
  const { container } = renderBreadcrumb([]);
  expect(container).toBeEmptyDOMElement();
});

test("negativo: parentCategory sin poblar (string, ObjectId crudo) corta la cadena ahí, sin miga sin nombre", () => {
  renderBreadcrumb({
    _id: "child1",
    name: "Hija",
    parentCategory: "60f7e1b2c1a2b3d4e5f6a7b8",
  });

  // Solo Inicio + Hija: la cadena se detiene al toparse con un parentCategory
  // que es un string en vez de un documento poblado.
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("Hija")).toBeInTheDocument();
});

test("happy array: recibiendo un array de categorías se usa la última como categoría actual", () => {
  renderBreadcrumb([
    { _id: "root1", name: "Ropa" },
    { _id: "child1", name: "Hija", parentCategory: { _id: "root1", name: "Ropa" } },
  ]);

  const current = screen.getByText("Hija");
  expect(current).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Ropa" })).toBeInTheDocument();
});
