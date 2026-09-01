import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { rest } from "msw";
import { server } from "../mocks/server";
import Orders from "./Orders";

const order = (overrides = {}) => ({
  _id: "o1",
  status: "pending",
  totalPrice: 464,
  subtotalPrice: 400,
  shippingCost: 0,
  createdAt: "2026-01-15T10:00:00.000Z",
  address: {
    address: "Calle 1",
    city: "CDMX",
    state: "CDMX",
    postalCode: "01000",
    country: "México",
  },
  paymentMethod: { type: "credit_card", cardHolderName: "Ana", last4: "1234" },
  products: [{ productId: { _id: "p1", name: "Camiseta Naruto" }, quantity: 2, price: 200 }],
  ...overrides,
});

function renderOrders() {
  return render(
    <MemoryRouter>
      <Orders />
    </MemoryRouter>,
  );
}

test('happy: dos órdenes -> "Mis pedidos", "Tienes 2 pedidos en tu cuenta", la primera seleccionada con su detalle', async () => {
  server.use(
    rest.get("http://localhost:4001/api/orders", (req, res, ctx) =>
      res(ctx.status(200), ctx.json([order(), order({ _id: "o2", totalPrice: 116 })])),
    ),
  );

  renderOrders();

  expect(await screen.findByRole("heading", { name: "Mis pedidos" })).toBeInTheDocument();
  expect(screen.getByText("Tienes 2 pedidos en tu cuenta")).toBeInTheDocument();
  expect(screen.getByText("Pedido #o1")).toBeInTheDocument();
  expect(screen.getByText("Camiseta Naruto")).toBeInTheDocument();
  expect(screen.getByText("Calle 1")).toBeInTheDocument();
  expect(screen.getByText("Ana")).toBeInTheDocument();
});

test("happy selección: click en otra orden cambia el panel de detalle a esa orden", async () => {
  server.use(
    rest.get("http://localhost:4001/api/orders", (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json([
          order(),
          order({ _id: "o2", totalPrice: 116, paymentMethod: { type: "paypal", paypalEmail: "a@b.com" } }),
        ]),
      ),
    ),
  );

  renderOrders();
  await screen.findByText("Pedido #o1");

  await userEvent.click(screen.getByText("#o2"));

  expect(await screen.findByText("Pedido #o2")).toBeInTheDocument();
  expect(screen.getByText(/PayPal — a@b.com/)).toBeInTheDocument();
});

test('negativo: sin pedidos -> "No tienes pedidos todavía" + "Descubrir productos"', async () => {
  server.use(
    rest.get("http://localhost:4001/api/orders", (req, res, ctx) => res(ctx.status(200), ctx.json([]))),
  );

  renderOrders();

  expect(await screen.findByText("No tienes pedidos todavía")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /descubrir productos/i })).toBeInTheDocument();
});

test('negativo: error de carga (500) -> mensaje honesto, contexto de impacto y retry', async () => {
  server.use(
    rest.get("http://localhost:4001/api/orders", (req, res, ctx) => res(ctx.status(500))),
  );

  renderOrders();

  expect(await screen.findByText("No pudimos cargar tus pedidos")).toBeInTheDocument();
  expect(screen.getByText(/No se pudieron cargar tus pedidos\./)).toBeInTheDocument();
  expect(screen.getByText(/Tu carrito no se vio afectado/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Intentar de nuevo" })).toBeInTheDocument();
});

test('negativo: orden sin dirección -> "Sin dirección registrada."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/orders", (req, res, ctx) =>
      res(ctx.status(200), ctx.json([order({ address: null })])),
    ),
  );

  renderOrders();

  expect(await screen.findByText("Sin dirección registrada.")).toBeInTheDocument();
});

test('negativo: orden sin método de pago -> "Sin método de pago registrado."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/orders", (req, res, ctx) =>
      res(ctx.status(200), ctx.json([order({ paymentMethod: null })])),
    ),
  );

  renderOrders();

  expect(await screen.findByText("Sin método de pago registrado.")).toBeInTheDocument();
});

test('negativo: fecha ausente -> "Fecha desconocida"', async () => {
  server.use(
    rest.get("http://localhost:4001/api/orders", (req, res, ctx) =>
      res(ctx.status(200), ctx.json([order({ createdAt: undefined })])),
    ),
  );

  renderOrders();

  expect(await screen.findAllByText("Fecha desconocida")).not.toHaveLength(0);
});

test('negativo: envío gratis - shippingCost 0 -> la fila de envío dice "Gratis"', async () => {
  server.use(
    rest.get("http://localhost:4001/api/orders", (req, res, ctx) =>
      res(ctx.status(200), ctx.json([order({ shippingCost: 0 })])),
    ),
  );

  renderOrders();

  await screen.findByText("Pedido #o1");
  expect(screen.getByText("Gratis")).toBeInTheDocument();
});

test('happy loading: durante la carga se ve "Cargando tus pedidos..."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/orders", (req, res, ctx) =>
      res(ctx.delay(50), ctx.status(200), ctx.json([])),
    ),
  );

  renderOrders();

  expect(await screen.findByText("Cargando tus pedidos...")).toBeVisible();
  await screen.findByText("No tienes pedidos todavía");
});
