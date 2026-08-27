import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OrderConfirmation from "./OrderConfirmation";

const order = (overrides = {}) => ({
  _id: "o1",
  createdAt: "2026-01-15T10:00:00.000Z",
  subtotalPrice: 400,
  shippingCost: 0,
  totalPrice: 464,
  address: {
    address: "Calle 1",
    city: "CDMX",
    state: "CDMX",
    postalCode: "01000",
    country: "México",
  },
  products: [{ productId: { _id: "p1", name: "Camiseta Naruto" }, quantity: 2, price: 200 }],
  ...overrides,
});

function renderConfirmation(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/order-confirmation", state }]}>
      <Routes>
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/" element={<div>pantalla de inicio</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

test('happy: con state.order completo -> "¡Gracias por tu compra!", id, fecha, productos, totales y dirección', async () => {
  const { container } = renderConfirmation({ order: order() });

  expect(await screen.findByText("¡Gracias por tu compra!")).toBeInTheDocument();
  expect(screen.getByText("#o1")).toBeInTheDocument();
  expect(screen.getByText(/Camiseta Naruto x 2/)).toBeInTheDocument();
  expect(screen.getByText("$464.00")).toBeInTheDocument();
  expect(container.querySelector("address").textContent).toContain("Calle 1");
});

test('negativo: sin orden en el state -> redirige a / sin lanzar error (bug B-13, corregido)', async () => {
  expect(() => renderConfirmation(undefined)).not.toThrow();

  expect(await screen.findByText("pantalla de inicio")).toBeInTheDocument();
});

test('negativo: dirección incompleta ({}) -> "No disponible" / "Ciudad, estado y código postal no disponibles" / "País no especificado"', async () => {
  // Los tres textos son nodos de texto sueltos (separados por <br/>) dentro de
  // <address>, sin un elemento propio que envuelva a cada uno, así que se
  // verifica con el textContent completo de <address> en vez de getByText.
  const { container } = renderConfirmation({ order: order({ address: {} }) });

  await screen.findByText("¡Gracias por tu compra!");
  const addressText = container.querySelector("address").textContent;
  expect(addressText).toContain("No disponible");
  expect(addressText).toContain("Ciudad, estado y código postal no disponibles");
  expect(addressText).toContain("País no especificado");
});

test('negativo: sin createdAt -> "No disponible"', async () => {
  renderConfirmation({ order: order({ createdAt: undefined }) });

  await screen.findByText("¡Gracias por tu compra!");
  expect(screen.getByText("Fecha:").parentElement.textContent).toContain("No disponible");
});
