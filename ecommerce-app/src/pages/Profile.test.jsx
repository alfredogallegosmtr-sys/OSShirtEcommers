import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { rest } from "msw";
import { server } from "../mocks/server";
import { AuthProvider } from "../context/AuthContext";
import Profile from "./Profile";

function renderProfile() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test("happy: GET /api/users/me 200 renderiza ProfileCard con los datos del backend", async () => {
  server.use(
    rest.get("http://localhost:4001/api/users/me", (req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({ name: "Ana Pérez", email: "ana@mail.com", role: "customer", isActive: true }),
      ),
    ),
  );

  renderProfile();

  expect(await screen.findByRole("heading", { name: "Ana Pérez" })).toBeInTheDocument();
  expect(screen.getByText("ana@mail.com")).toBeInTheDocument();
});

test('negativo: error de carga (500) -> "No se pudo cargar tu perfil." y no se renderiza la tarjeta', async () => {
  server.use(
    rest.get("http://localhost:4001/api/users/me", (req, res, ctx) => res(ctx.status(500))),
  );

  renderProfile();

  expect(await screen.findByText("No se pudo cargar tu perfil.")).toBeInTheDocument();
  expect(screen.queryByText("Acciones de la cuenta")).not.toBeInTheDocument();
});

test('happy loading: durante la carga se ve "Cargando tu perfil..."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/users/me", (req, res, ctx) =>
      res(ctx.delay(50), ctx.status(200), ctx.json({ name: "Ana", email: "ana@mail.com" })),
    ),
  );

  renderProfile();

  expect(await screen.findByText("Cargando tu perfil...")).toBeVisible();
  await screen.findByRole("heading", { name: "Ana" });
});
