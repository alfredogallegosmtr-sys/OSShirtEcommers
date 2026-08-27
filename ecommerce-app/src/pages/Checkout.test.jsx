import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { rest } from "msw";
import { server } from "../mocks/server";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Checkout from "./Checkout";
import OrderConfirmation from "./OrderConfirmation";

const addressFixture = (overrides = {}) => ({
  _id: "addr1",
  address: "Calle 1",
  city: "CDMX",
  state: "CDMX",
  postalCode: "01000",
  country: "México",
  phone: "5555555555",
  isDefault: true,
  ...overrides,
});

const paymentFixture = (overrides = {}) => ({
  _id: "pay1",
  type: "credit_card",
  cardHolderName: "Ana",
  last4: "1234",
  brand: "visa",
  expiryDate: "12/28",
  isDefault: true,
  ...overrides,
});

function seedCart(items) {
  localStorage.setItem("cart", JSON.stringify(items));
}

const cartItem = (overrides = {}) => ({
  id: "a1",
  quantity: 2,
  product: { _id: "p1", name: "Camiseta Naruto", price: 200 },
  ...overrides,
});

function mockDataOk({ addresses = [addressFixture()], payments = [paymentFixture()] } = {}) {
  server.use(
    rest.get("http://localhost:4001/api/addresses", (req, res, ctx) =>
      res(ctx.status(200), ctx.json(addresses)),
    ),
    rest.get("http://localhost:4001/api/payment-methods", (req, res, ctx) =>
      res(ctx.status(200), ctx.json(payments)),
    ),
  );
}

function renderCheckout() {
  return render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={["/checkout"]}>
          <Routes>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cart" element={<div>pantalla de carrito</div>} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test("happy: preselecciona isDefault, muestra subtotal/IVA/envío/total y Confirmar y Pagar habilitado", async () => {
  seedCart([cartItem()]);
  mockDataOk();

  renderCheckout();

  expect(await screen.findByRole("heading", { name: "Resumen de la Orden" })).toBeInTheDocument();
  expect(screen.getAllByText(/\$400.00/).length).toBeGreaterThan(0);
  expect(screen.getByText(/IVA \(16%\):/)).toBeInTheDocument();
  expect(screen.getByText(/\$64.00/)).toBeInTheDocument();
  expect(screen.getByText(/\$350.00/)).toBeInTheDocument();

  const payButton = screen.getByRole("button", { name: /confirmar y pagar/i });
  expect(payButton).toBeEnabled();
});

test("happy crear orden: click en Confirmar y Pagar -> POST /api/orders con addressId/paymentMethodId -> navega a /order-confirmation y el carrito queda vacío", async () => {
  seedCart([cartItem()]);
  mockDataOk();
  let receivedBody;
  server.use(
    rest.post("http://localhost:4001/api/orders", async (req, res, ctx) => {
      receivedBody = await req.json();
      return res(
        ctx.status(201),
        ctx.json({
          _id: "o1",
          createdAt: "2026-01-15T10:00:00.000Z",
          subtotalPrice: 400,
          shippingCost: 350,
          totalPrice: 814,
          address: addressFixture(),
          products: [{ productId: { _id: "p1", name: "Camiseta Naruto" }, quantity: 2, price: 200 }],
        }),
      );
    }),
  );

  renderCheckout();
  const payButton = await screen.findByRole("button", { name: /confirmar y pagar/i });
  await waitFor(() => expect(payButton).toBeEnabled());
  await userEvent.click(payButton);

  expect(await screen.findByText("¡Gracias por tu compra!")).toBeInTheDocument();
  expect(receivedBody).toEqual({ addressId: "addr1", paymentMethodId: "pay1" });
  expect(JSON.parse(localStorage.getItem("cart"))).toHaveLength(0);
});

test("negativo: doble clic en Confirmar y Pagar mientras la petición está en curso no crea dos órdenes (B-15)", async () => {
  seedCart([cartItem()]);
  mockDataOk();
  let requestCount = 0;
  server.use(
    rest.post("http://localhost:4001/api/orders", async (req, res, ctx) => {
      requestCount += 1;
      return res(
        ctx.delay(50),
        ctx.status(201),
        ctx.json({
          _id: "o1",
          createdAt: "2026-01-15T10:00:00.000Z",
          subtotalPrice: 400,
          shippingCost: 350,
          totalPrice: 814,
          address: addressFixture(),
          products: [{ productId: { _id: "p1", name: "Camiseta Naruto" }, quantity: 2, price: 200 }],
        }),
      );
    }),
  );

  renderCheckout();
  const payButton = await screen.findByRole("button", { name: /confirmar y pagar/i });
  await waitFor(() => expect(payButton).toBeEnabled());

  await userEvent.click(payButton);
  // El botón debe deshabilitarse de inmediato mientras la petición está en curso.
  expect(await screen.findByRole("button", { name: /procesando/i })).toBeDisabled();
  // Un segundo click mientras sigue deshabilitado no debe disparar una segunda petición.
  await userEvent.click(screen.getByRole("button", { name: /procesando/i }));

  await screen.findByText("¡Gracias por tu compra!");
  expect(requestCount).toBe(1);
});

test("negativo: carrito vacío -> redirige a /cart", async () => {
  mockDataOk();

  renderCheckout();

  expect(await screen.findByText("pantalla de carrito")).toBeInTheDocument();
});

test('negativo: fallo al cargar datos (GET /api/addresses 500) -> "No se pudo cargar direcciones o métodos de pago." y no se renderiza el formulario', async () => {
  seedCart([cartItem()]);
  server.use(
    rest.get("http://localhost:4001/api/addresses", (req, res, ctx) => res(ctx.status(500))),
    rest.get("http://localhost:4001/api/payment-methods", (req, res, ctx) =>
      res(ctx.status(200), ctx.json([paymentFixture()])),
    ),
  );

  renderCheckout();

  expect(
    await screen.findByText("No se pudo cargar direcciones o métodos de pago."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Resumen de la Orden" })).not.toBeInTheDocument();
});

test('negativo: sin dirección seleccionada (lista vacía) -> Confirmar y Pagar deshabilitado y la sección de dirección abierta', async () => {
  seedCart([cartItem()]);
  mockDataOk({ addresses: [] });

  renderCheckout();

  await screen.findByRole("heading", { name: "Resumen de la Orden" });
  const payButton = screen.getByRole("button", { name: /confirmar y pagar/i });
  expect(payButton).toBeDisabled();
  // B-14 (cerrado): Button.jsx ahora reenvía props extra vía {...rest}, así
  // que el title="Selecciona una dirección de envío" que le pasa
  // Checkout.jsx sí llega al <button> real.
  expect(payButton).toHaveAttribute("title", "Selecciona una dirección de envío");
  // La sección de dirección queda abierta (sin dirección seleccionada): se ve
  // el formulario/lista de direcciones, con el botón para agregar una nueva.
  expect(screen.getByRole("button", { name: /agregar nueva dirección/i })).toBeInTheDocument();
});

test('negativo: sin método de pago (lista vacía) -> Confirmar y Pagar deshabilitado', async () => {
  seedCart([cartItem()]);
  mockDataOk({ payments: [] });

  renderCheckout();

  await screen.findByRole("heading", { name: "Resumen de la Orden" });
  const payButton = screen.getByRole("button", { name: /confirmar y pagar/i });
  expect(payButton).toBeDisabled();
  expect(screen.getByRole("button", { name: /agregar nueva tarjeta/i })).toBeInTheDocument();
});

test('negativo: fallo al crear la orden (POST 500) -> "No se pudo completar la orden." y el carrito permanece intacto', async () => {
  seedCart([cartItem()]);
  mockDataOk();
  server.use(
    rest.post("http://localhost:4001/api/orders", (req, res, ctx) => res(ctx.status(500))),
  );

  renderCheckout();
  const payButton = await screen.findByRole("button", { name: /confirmar y pagar/i });
  await waitFor(() => expect(payButton).toBeEnabled());
  await userEvent.click(payButton);

  expect(await screen.findByText("No se pudo completar la orden.")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("cart"))).toHaveLength(1);
});

test('negativo: fallo al guardar dirección (POST /api/addresses 500) -> "No se pudo guardar la dirección."', async () => {
  seedCart([cartItem()]);
  mockDataOk();
  server.use(
    rest.post("http://localhost:4001/api/addresses", (req, res, ctx) => res(ctx.status(500))),
  );

  renderCheckout();
  await screen.findByRole("heading", { name: "Resumen de la Orden" });

  // Abrir la sección de dirección (colapsada porque ya hay una por defecto).
  // Ambas secciones (dirección y pago) tienen su propio botón "Cambiar"; la
  // de dirección es la primera en el DOM.
  await userEvent.click(screen.getAllByRole("button", { name: "Cambiar" })[0]);
  await userEvent.click(screen.getByRole("button", { name: /agregar nueva dirección/i }));

  await userEvent.type(screen.getByLabelText("Dirección"), "Calle 2");
  await userEvent.type(screen.getByLabelText("Ciudad"), "GDL");
  await userEvent.type(screen.getByLabelText("Estado"), "JAL");
  await userEvent.type(screen.getByLabelText("Código Postal"), "44100");
  await userEvent.type(screen.getByLabelText("País"), "México");
  await userEvent.type(screen.getByLabelText("Teléfono"), "3333333333");
  await userEvent.click(screen.getByRole("button", { name: /agregar dirección/i }));

  expect(await screen.findByText("No se pudo guardar la dirección.")).toBeInTheDocument();
});

test('negativo: fallo al eliminar dirección (DELETE /api/addresses/:id 500) -> "No se pudo eliminar la dirección."', async () => {
  seedCart([cartItem()]);
  mockDataOk();
  server.use(
    rest.delete("http://localhost:4001/api/addresses/addr1", (req, res, ctx) => res(ctx.status(500))),
  );

  renderCheckout();
  await screen.findByRole("heading", { name: "Resumen de la Orden" });

  await userEvent.click(screen.getAllByRole("button", { name: "Cambiar" })[0]);
  await userEvent.click(screen.getByRole("button", { name: /^eliminar$/i }));

  expect(await screen.findByText("No se pudo eliminar la dirección.")).toBeInTheDocument();
});

test('negativo: fallo al guardar pago (POST /api/payment-methods 500) -> "No se pudo guardar el método de pago."', async () => {
  seedCart([cartItem()]);
  mockDataOk();
  server.use(
    rest.post("http://localhost:4001/api/payment-methods", (req, res, ctx) => res(ctx.status(500))),
  );

  renderCheckout();
  await screen.findByRole("heading", { name: "Resumen de la Orden" });

  // Ambas secciones colapsadas usan el mismo texto de botón "Cambiar"; la de
  // pago es la segunda instancia.
  const changeButtons = screen.getAllByRole("button", { name: "Cambiar" });
  await userEvent.click(changeButtons[1]);
  await userEvent.click(screen.getByRole("button", { name: /agregar nueva tarjeta/i }));

  await userEvent.type(screen.getByLabelText(/número de tarjeta/i), "4111111111111111");
  await userEvent.type(screen.getByLabelText(/nombre del titular/i), "Ana");
  await userEvent.type(screen.getByLabelText(/fecha de expiración/i), "12/28");
  await userEvent.click(screen.getByRole("button", { name: /agregar método de pago/i }));

  expect(
    await screen.findByText("No se pudo guardar el método de pago."),
  ).toBeInTheDocument();
});

test('negativo: fallo al eliminar pago (DELETE /api/payment-methods/:id 500) -> "No se pudo eliminar el método de pago."', async () => {
  seedCart([cartItem()]);
  mockDataOk();
  server.use(
    rest.delete("http://localhost:4001/api/payment-methods/pay1", (req, res, ctx) =>
      res(ctx.status(500)),
    ),
  );

  renderCheckout();
  await screen.findByRole("heading", { name: "Resumen de la Orden" });

  const changeButtons = screen.getAllByRole("button", { name: "Cambiar" });
  await userEvent.click(changeButtons[1]);
  await userEvent.click(screen.getByRole("button", { name: /^eliminar$/i }));

  expect(
    await screen.findByText("No se pudo eliminar el método de pago."),
  ).toBeInTheDocument();
});

test('happy envío gratis: subtotal >= 1000 -> la línea de envío dice "Gratis" y el total = subtotal + IVA', async () => {
  seedCart([cartItem({ product: { _id: "p1", name: "Camiseta cara", price: 600 } })]);
  mockDataOk();

  renderCheckout();

  await screen.findByRole("heading", { name: "Resumen de la Orden" });
  expect(screen.getByText("Gratis")).toBeInTheDocument();
  // subtotal 1200 + IVA 192 + envío 0 = 1392
  expect(screen.getByText(/\$1,392.00/)).toBeInTheDocument();
});

test('negativo: envío con costo - subtotal < 1000 -> la línea de envío muestra $350.00 y entra en el total', async () => {
  seedCart([cartItem()]);
  mockDataOk();

  renderCheckout();

  await screen.findByRole("heading", { name: "Resumen de la Orden" });
  // subtotal 400 + IVA 64 + envío 350 = 814
  expect(screen.getByText(/\$814.00/)).toBeInTheDocument();
});

test("happy recarga tras guardar: tras guardar una dirección se vuelve a consultar GET /api/addresses y queda seleccionada la guardada", async () => {
  seedCart([cartItem()]);
  const newAddress = addressFixture({ _id: "addr2", address: "Calle Nueva", isDefault: true });
  let addressesCallCount = 0;
  server.use(
    rest.get("http://localhost:4001/api/addresses", (req, res, ctx) => {
      addressesCallCount += 1;
      const body = addressesCallCount === 1 ? [addressFixture({ isDefault: false })] : [newAddress];
      return res(ctx.status(200), ctx.json(body));
    }),
    rest.get("http://localhost:4001/api/payment-methods", (req, res, ctx) =>
      res(ctx.status(200), ctx.json([paymentFixture()])),
    ),
    rest.post("http://localhost:4001/api/addresses", (req, res, ctx) =>
      res(ctx.status(201), ctx.json(newAddress)),
    ),
  );

  renderCheckout();
  await screen.findByRole("heading", { name: "Resumen de la Orden" });

  // Aunque ninguna dirección de la primera carga tiene isDefault:true, sigue
  // habiendo una dirección (fallback a addrList[0]), así que la sección
  // arranca colapsada igual y hay que abrirla con "Cambiar" (primer botón).
  await userEvent.click(screen.getAllByRole("button", { name: "Cambiar" })[0]);
  await userEvent.click(screen.getByRole("button", { name: /agregar nueva dirección/i }));

  await userEvent.type(screen.getByLabelText("Dirección"), "Calle Nueva");
  await userEvent.type(screen.getByLabelText("Ciudad"), "GDL");
  await userEvent.type(screen.getByLabelText("Estado"), "JAL");
  await userEvent.type(screen.getByLabelText("Código Postal"), "44100");
  await userEvent.type(screen.getByLabelText("País"), "México");
  await userEvent.type(screen.getByLabelText("Teléfono"), "3333333333");
  await userEvent.click(screen.getByRole("button", { name: /agregar dirección/i }));

  expect((await screen.findAllByText("Calle Nueva")).length).toBeGreaterThan(0);
  expect(addressesCallCount).toBe(2);
});
