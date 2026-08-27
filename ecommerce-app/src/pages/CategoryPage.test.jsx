import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { rest } from "msw";
import { server } from "../mocks/server";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import CategoryPage from "./CategoryPage";

afterEach(() => {
  localStorage.clear();
});

// Envoltorio sin lógica propia (ver TEST_PLAN.md): un único caso que confirma
// que pasa el categoryId de la URL a CategoryProducts (visible en la
// petición real a la API). Las reglas de CategoryProducts ya están cubiertas
// en CategoryProducts.test.jsx.
test("happy: CategoryPage pasa el categoryId de la URL a CategoryProducts", async () => {
  let receivedId;
  server.use(
    rest.get("http://localhost:4001/api/categories/:categoryId/products", (req, res, ctx) => {
      receivedId = req.params.categoryId;
      return res(
        ctx.status(200),
        ctx.json({ category: { _id: req.params.categoryId, name: "Naruto" }, products: [] }),
      );
    }),
  );

  render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={["/category/cat123"]}>
          <Routes>
            <Route path="/category/:categoryId" element={<CategoryPage />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );

  expect(await screen.findByRole("heading", { name: "Naruto" })).toBeInTheDocument();
  expect(receivedId).toBe("cat123");
});
