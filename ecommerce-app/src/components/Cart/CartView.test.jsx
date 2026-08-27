import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../../context/AuthContext";
import { CartProvider } from "../../context/CartContext";
import CartView from "./CartView";

const product = (overrides = {}) => ({
  _id: "p1",
  name: "Camiseta Naruto",
  price: 99.9,
  ...overrides,
});

function renderCartView({ seedItems } = {}) {
  if (seedItems) {
    localStorage.setItem("cart", JSON.stringify(seedItems));
  }
  return render(
    <AuthProvider>
      <CartProvider>
        <CartView />
      </CartProvider>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test("happy: con ítems, cada línea muestra nombre, precio con dos decimales y el subtotal precio*cantidad", async () => {
  renderCartView({
    seedItems: [{ id: "a1", quantity: 3, product: product() }],
  });

  expect(await screen.findByText("Camiseta Naruto")).toBeInTheDocument();
  expect(screen.getByText("$99.90")).toBeInTheDocument();
  expect(screen.getByText("$299.70")).toBeInTheDocument();
});

test('happy incrementar: el botón "+" sube la cantidad y recalcula el subtotal de la línea', async () => {
  renderCartView({
    seedItems: [{ id: "a1", quantity: 1, product: product() }],
  });

  await screen.findByText("Camiseta Naruto");
  // El botón "+" es el segundo de los dos botones de cantidad (el primero es "-").
  const quantityButtons = screen.getAllByRole("button").filter((b) =>
    b.closest(".cart-item-quantity"),
  );
  await userEvent.click(quantityButtons[1]);

  expect(await screen.findByText("2")).toBeInTheDocument();
  expect(screen.getByText("$199.80")).toBeInTheDocument();
});

test("negativo: decrementar hasta 0 - con cantidad 1, pulsar '−' elimina la línea del carrito", async () => {
  renderCartView({
    seedItems: [{ id: "a1", quantity: 1, product: product() }],
  });

  await screen.findByText("Camiseta Naruto");
  const quantityButtons = screen.getAllByRole("button").filter((b) =>
    b.closest(".cart-item-quantity"),
  );
  await userEvent.click(quantityButtons[0]);

  expect(screen.queryByText("Camiseta Naruto")).not.toBeInTheDocument();
});

test('happy eliminar: el botón con title="Eliminar artículo" quita la línea', async () => {
  // B-14 (cerrado): Button.jsx ahora reenvía props extra vía {...rest}, así
  // que title="Eliminar artículo" sí llega al <button> real.
  renderCartView({
    seedItems: [{ id: "a1", quantity: 1, product: product() }],
  });

  await screen.findByText("Camiseta Naruto");
  const deleteButton = screen.getByTitle("Eliminar artículo");
  await userEvent.click(deleteButton);

  expect(screen.queryByText("Camiseta Naruto")).not.toBeInTheDocument();
});

test("negativo: carrito vacío -> encabezado '0 artículos' y ninguna línea renderizada", async () => {
  renderCartView();

  expect(await screen.findByText("0 artículos")).toBeInTheDocument();
  expect(screen.queryByText("Camiseta Naruto")).not.toBeInTheDocument();
});
