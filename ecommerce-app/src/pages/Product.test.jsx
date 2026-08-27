import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { rest } from "msw";
import { server } from "../mocks/server";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Product from "./Product";

afterEach(() => {
  localStorage.clear();
});

// Envoltorio sin lógica propia (ver TEST_PLAN.md): un único caso que confirma
// que pasa el productId de la URL a ProductDetails (visible en la petición
// real a la API). Las reglas de ProductDetails ya están cubiertas en
// ProductDetails.test.jsx.
test("happy: Product pasa el productId de la URL a ProductDetails", async () => {
  let receivedId;
  server.use(
    rest.get("http://localhost:4001/api/products/:id", (req, res, ctx) => {
      receivedId = req.params.id;
      return res(
        ctx.status(200),
        ctx.json({ _id: req.params.id, name: "Camiseta Naruto", price: 100, stock: 5 }),
      );
    }),
  );

  render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={["/product/abc123"]}>
          <Routes>
            <Route path="/product/:productId" element={<Product />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );

  expect(await screen.findByRole("heading", { name: "Camiseta Naruto" })).toBeInTheDocument();
  expect(receivedId).toBe("abc123");
});
