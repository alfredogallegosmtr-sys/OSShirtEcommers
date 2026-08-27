import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider, useCart } from "../context/CartContext";
import Cart from "./Cart";

const product = (overrides = {}) => ({
  _id: "p1",
  name: "Camiseta Naruto",
  price: 100,
  ...overrides,
});

function AddToCartHelper() {
  const { addItem } = useCart();
  return <button onClick={() => addItem(product(), 1)}>seed-add</button>;
}

function renderCart({ seedItems } = {}) {
  if (seedItems) {
    localStorage.setItem("cart", JSON.stringify(seedItems));
  }
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={["/cart"]}>
          <Routes>
            <Route
              path="/cart"
              element={
                <>
                  <AddToCartHelper />
                  <Cart />
                </>
              }
            />
            <Route path="/" element={<div>pantalla de inicio</div>} />
            <Route path="/checkout" element={<div>pantalla de checkout</div>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test('happy: carrito con ítems -> encabezado, conteo "N artículos", total formateado y botón habilitado que navega a /checkout', async () => {
  renderCart({
    seedItems: [{ id: "a1", quantity: 2, product: product() }],
  });

  expect(await screen.findByRole("heading", { name: "Carrito de Compras" })).toBeInTheDocument();
  expect(screen.getAllByText("2 artículos").length).toBeGreaterThan(0);
  expect(screen.getAllByText("$200.00").length).toBeGreaterThan(0);

  const payButton = screen.getByRole("button", { name: /proceder al pago/i });
  expect(payButton).toBeEnabled();
  await userEvent.click(payButton);

  expect(await screen.findByText("pantalla de checkout")).toBeInTheDocument();
});

test('negativo: carrito vacío -> "Tu carrito está vacío" + Continuar Comprando navega a /, sin resumen ni botón de pago', async () => {
  renderCart();

  expect(await screen.findByText("Tu carrito está vacío")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /proceder al pago/i })).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /continuar comprando/i }));
  expect(await screen.findByText("pantalla de inicio")).toBeInTheDocument();
});

test('happy vaciar: "Vaciar carrito" deja el carrito vacío y muestra el estado vacío', async () => {
  renderCart({
    seedItems: [{ id: "a1", quantity: 1, product: product() }],
  });

  await screen.findByRole("heading", { name: "Carrito de Compras" });
  await userEvent.click(screen.getByRole("button", { name: /vaciar carrito/i }));

  expect(await screen.findByText("Tu carrito está vacío")).toBeInTheDocument();
});

test('negativo: singular/plural - un solo artículo -> "1 artículo" (no "1 artículos")', async () => {
  renderCart({
    seedItems: [{ id: "a1", quantity: 1, product: product() }],
  });

  await screen.findByRole("heading", { name: "Carrito de Compras" });
  expect(screen.getAllByText("1 artículo").length).toBeGreaterThan(0);
  expect(screen.queryByText("1 artículos")).not.toBeInTheDocument();
});
