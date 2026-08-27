import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import { CartProvider } from "../../context/CartContext";
import ProductCard from "./ProductCard";

const product = (overrides = {}) => ({
  _id: "p1",
  name: "Camiseta Naruto",
  price: 100,
  stock: 5,
  description: "Una camiseta de Naruto",
  ...overrides,
});

function renderCard(props) {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <ProductCard {...props} />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test("happy: producto con stock -> nombre enlazado, precio, badge En stock y botón habilitado que suma al carrito", async () => {
  renderCard({ product: product() });

  const link = screen.getByText("Camiseta Naruto").closest("a");
  expect(link).toHaveAttribute("href", "/product/p1");
  expect(screen.getByText("$100")).toBeInTheDocument();
  expect(screen.getByText("En stock")).toBeInTheDocument();

  const addButton = screen.getByRole("button", { name: /agregar al carrito/i });
  expect(addButton).toBeEnabled();
  await userEvent.click(addButton);

  expect(JSON.parse(localStorage.getItem("cart"))).toHaveLength(1);
});

test("negativo: sin stock -> badge Agotado y botón deshabilitado (el click no altera el carrito)", async () => {
  renderCard({ product: product({ stock: 0 }) });

  expect(screen.getByText("Agotado")).toBeInTheDocument();
  const addButton = screen.getByRole("button", { name: /agregar al carrito/i });
  expect(addButton).toBeDisabled();

  await userEvent.click(addButton);
  expect(JSON.parse(localStorage.getItem("cart") || "[]")).toHaveLength(0);
});

test("negativo: descripción > 60 caracteres se muestra truncada con '...'", () => {
  const longDescription =
    "Esta es una descripción muy larga que definitivamente supera los sesenta caracteres de longitud";
  renderCard({ product: product({ description: longDescription }) });

  expect(
    screen.getByText(`${longDescription.substring(0, 60)}...`),
  ).toBeInTheDocument();
  expect(screen.queryByText(longDescription)).not.toBeInTheDocument();
});

test("negativo: producto sin description no renderiza el párrafo", () => {
  const p = product();
  delete p.description;
  renderCard({ product: p });

  expect(screen.queryByText(/Una camiseta de Naruto/)).not.toBeInTheDocument();
});

test("negativo: con discount aparece la insignia -N%; sin discount no aparece", () => {
  const { rerender } = renderCard({ product: product({ discount: 20 }) });
  expect(screen.getByText("-20%")).toBeInTheDocument();

  rerender(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <ProductCard product={product()} />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );
  expect(screen.queryByText(/^-\d+%$/)).not.toBeInTheDocument();
});

test("negativo: sin imageURL ni images usa el placeholder", () => {
  renderCard({ product: product() });
  const img = screen.getByAltText("Camiseta Naruto");
  expect(img).toHaveAttribute("src", "/img/products/placeholder.svg");
});

test("negativo: prop product ausente -> 'Producto no disponible' sin lanzar antes del guard", () => {
  expect(() => renderCard({})).not.toThrow();
  expect(screen.getByText("Producto no disponible")).toBeInTheDocument();
});
