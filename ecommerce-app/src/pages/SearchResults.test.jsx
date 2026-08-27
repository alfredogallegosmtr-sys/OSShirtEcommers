import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { rest } from "msw";
import { server } from "../mocks/server";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import SearchResults from "./SearchResults";

afterEach(() => {
  localStorage.clear();
});

// Envoltorio sin lógica propia (ver TEST_PLAN.md): un único caso que confirma
// que SearchResultsList recibe/usa el query param `q` real de la URL. Las
// reglas de SearchResultsList ya están cubiertas en SearchResultsList.test.jsx.
test("happy: SearchResults monta SearchResultsList y usa el query param q de la URL", async () => {
  let receivedQuery;
  server.use(
    rest.get("http://localhost:4001/api/products/search", (req, res, ctx) => {
      receivedQuery = req.url.searchParams.get("q");
      return res(
        ctx.status(200),
        ctx.json({ products: [], pagination: { page: 1, limit: 30, totalResults: 0, totalPages: 0 } }),
      );
    }),
  );

  render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter initialEntries={["/search?q=naruto"]}>
          <Routes>
            <Route path="/search" element={<SearchResults />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );

  expect(
    await screen.findByRole("heading", { name: 'Resultados para "naruto"' }),
  ).toBeInTheDocument();
  expect(receivedQuery).toBe("naruto");
});
