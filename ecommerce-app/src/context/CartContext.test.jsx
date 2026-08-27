import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { server } from "../mocks/server";
import { AuthProvider } from "./AuthContext";
import { CartProvider, useCart } from "./CartContext";

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

const product = (overrides = {}) => ({
  _id: "p1",
  name: "Camiseta Naruto",
  price: 100,
  ...overrides,
});

function Consumer() {
  const { items, count, total, error, addItem, updateItem, removeItem, clearCart } = useCart();
  return (
    <div>
      <div data-testid="count">{count}</div>
      <div data-testid="total">{total}</div>
      <div data-testid="error">{error ?? ""}</div>
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            {it.product.name} x{it.quantity}
          </li>
        ))}
      </ul>
      <button onClick={() => addItem(product(), 1)}>add</button>
      <button onClick={() => addItem(product({ _id: "p2", name: "Otra", price: 50 }), 1)}>
        add-otro
      </button>
      {items[0] && (
        <>
          <button onClick={() => updateItem(items[0].id, 0)}>quitar-a-0</button>
          <button onClick={() => updateItem(items[0].id, 5)}>bump-a-5</button>
          <button onClick={() => removeItem(items[0].id)}>remove</button>
        </>
      )}
      <button onClick={clearCart}>clear</button>
    </div>
  );
}

function renderCart({ authenticated = false } = {}) {
  if (authenticated) {
    localStorage.setItem(
      "authToken",
      makeToken({ userId: "u1", name: "Ana", role: "customer", exp: 9999999999 }),
    );
  }
  return render(
    <AuthProvider>
      <CartProvider>
        <Consumer />
      </CartProvider>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test("happy invitado: addItem agrega el ítem, count/total reflejan cantidad*precio y persiste en localStorage['cart']", async () => {
  renderCart();

  await userEvent.click(screen.getByText("add"));

  expect(await screen.findByText("Camiseta Naruto x1")).toBeInTheDocument();
  expect(screen.getByTestId("count")).toHaveTextContent("1");
  expect(screen.getByTestId("total")).toHaveTextContent("100");
  expect(JSON.parse(localStorage.getItem("cart"))).toHaveLength(1);
});

test("negativo: localStorage['cart'] corrupto -> arranca con carrito vacío sin lanzar", () => {
  localStorage.setItem("cart", "{no-json");

  expect(() => renderCart()).not.toThrow();
  expect(screen.getByTestId("count")).toHaveTextContent("0");
});

test("negativo: ítem inválido en localStorage (sin product o price no numérico) se descarta al montar", () => {
  localStorage.setItem(
    "cart",
    JSON.stringify([
      { id: "bad1", quantity: 1 }, // sin product
      { id: "bad2", quantity: 1, product: { _id: "x", price: "100" } }, // price no numérico
      { id: "ok1", quantity: 2, product: { _id: "p1", name: "Valido", price: 10 } },
    ]),
  );

  renderCart();

  expect(screen.getByTestId("count")).toHaveTextContent("2");
  expect(screen.getByText("Valido x2")).toBeInTheDocument();
});

test("negativo: producto repetido -> addItem(p,1) dos veces sobre el mismo _id da un solo ítem con cantidad 2", async () => {
  renderCart();

  await userEvent.click(screen.getByText("add"));
  await screen.findByText("Camiseta Naruto x1");
  await userEvent.click(screen.getByText("add"));

  expect(await screen.findByText("Camiseta Naruto x2")).toBeInTheDocument();
  expect(screen.getByTestId("count")).toHaveTextContent("2");
});

test("negativo: invitado no depende del backend - con /api/cart respondiendo 500, el ítem agregado sigue visible", async () => {
  server.use(rest.post("http://localhost:4001/api/cart", (req, res, ctx) => res(ctx.status(500))));

  renderCart();
  await userEvent.click(screen.getByText("add"));

  expect(await screen.findByText("Camiseta Naruto x1")).toBeInTheDocument();
  expect(screen.getByTestId("error")).toHaveTextContent("");
});

test("negativo: rollback al agregar con sesión - POST /api/cart 500 quita el ítem y expone error SERVER_ERROR", async () => {
  server.use(
    rest.get("http://localhost:4001/api/cart", (req, res, ctx) => res(ctx.status(200), ctx.json({ items: [] }))),
    rest.post("http://localhost:4001/api/cart", (req, res, ctx) => res(ctx.status(500))),
  );

  renderCart({ authenticated: true });
  await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));

  await userEvent.click(screen.getByText("add"));

  await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("SERVER_ERROR"));
  expect(screen.queryByText("Camiseta Naruto x1")).not.toBeInTheDocument();
});

test("negativo: cantidad < 1 - updateItem(itemId, 0) elimina el ítem (delega en removeItem)", async () => {
  renderCart();
  await userEvent.click(screen.getByText("add"));
  await screen.findByText("Camiseta Naruto x1");

  await userEvent.click(screen.getByText("quitar-a-0"));

  expect(screen.queryByText("Camiseta Naruto x1")).not.toBeInTheDocument();
  expect(screen.getByTestId("count")).toHaveTextContent("0");
});

test("negativo: rollback al actualizar - PATCH /api/cart/:itemId 500 vuelve la cantidad al valor anterior", async () => {
  server.use(
    rest.get("http://localhost:4001/api/cart", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ items: [{ id: "srv1", quantity: 1, product: product() }] })),
    ),
    rest.patch("http://localhost:4001/api/cart/:itemId", (req, res, ctx) => res(ctx.status(500))),
  );

  renderCart({ authenticated: true });
  await screen.findByText("Camiseta Naruto x1");

  await userEvent.click(screen.getByText("bump-a-5"));

  await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("SERVER_ERROR"));
  expect(await screen.findByText("Camiseta Naruto x1")).toBeInTheDocument();
});

test("negativo: rollback al eliminar - DELETE /api/cart/:itemId 500 hace que el ítem reaparezca", async () => {
  server.use(
    rest.get("http://localhost:4001/api/cart", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ items: [{ id: "srv1", quantity: 1, product: product() }] })),
    ),
    rest.delete("http://localhost:4001/api/cart/:itemId", (req, res, ctx) => res(ctx.status(500))),
  );

  renderCart({ authenticated: true });
  await screen.findByText("Camiseta Naruto x1");

  await userEvent.click(screen.getByText("remove"));

  await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("SERVER_ERROR"));
  expect(await screen.findByText("Camiseta Naruto x1")).toBeInTheDocument();
});

test("negativo: rollback al vaciar - DELETE /api/cart 500 hace que los ítems reaparezcan", async () => {
  server.use(
    rest.get("http://localhost:4001/api/cart", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ items: [{ id: "srv1", quantity: 1, product: product() }] })),
    ),
    rest.delete("http://localhost:4001/api/cart", (req, res, ctx) => res(ctx.status(500))),
  );

  renderCart({ authenticated: true });
  await screen.findByText("Camiseta Naruto x1");

  await userEvent.click(screen.getByText("clear"));

  await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("SERVER_ERROR"));
  expect(await screen.findByText("Camiseta Naruto x1")).toBeInTheDocument();
});

test("happy sync al iniciar sesión: invitado con ítem A; al autenticarse, GET /api/cart trae B -> POST con A y queda A+B", async () => {
  localStorage.setItem(
    "cart",
    JSON.stringify([{ id: "a1", quantity: 1, product: product({ _id: "A", name: "Producto A", price: 20 }) }]),
  );

  let postBody;
  server.use(
    rest.get("http://localhost:4001/api/cart", (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({ items: [{ id: "b1", quantity: 1, product: product({ _id: "B", name: "Producto B", price: 30 }) }] }),
      ),
    ),
    rest.post("http://localhost:4001/api/cart", async (req, res, ctx) => {
      postBody = await req.json();
      return res(
        ctx.status(200),
        ctx.json({
          items: [
            { id: "b1", quantity: 1, product: product({ _id: "B", name: "Producto B", price: 30 }) },
            { id: "a1", quantity: 1, product: product({ _id: "A", name: "Producto A", price: 20 }) },
          ],
        }),
      );
    }),
  );

  renderCart({ authenticated: true });

  expect(await screen.findByText("Producto A x1")).toBeInTheDocument();
  expect(await screen.findByText("Producto B x1")).toBeInTheDocument();
  expect(postBody).toMatchObject({ productId: "A", quantity: 1 });
});

test("negativo: sync fallido - GET /api/cart 500 expone error SERVER_ERROR y la app no rompe", async () => {
  server.use(rest.get("http://localhost:4001/api/cart", (req, res, ctx) => res(ctx.status(500))));

  expect(() => renderCart({ authenticated: true })).not.toThrow();

  await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("SERVER_ERROR"));
});

test("negativo: useCart() fuera de <CartProvider> lanza el error esperado", () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  function Broken() {
    useCart();
    return null;
  }
  expect(() =>
    render(
      <AuthProvider>
        <Broken />
      </AuthProvider>,
    ),
  ).toThrow("useCart debe ser usado dentro de CartProvider");
  consoleError.mockRestore();
});
