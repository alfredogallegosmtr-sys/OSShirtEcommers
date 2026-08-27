import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import ProfileCard from "./ProfileCard";

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

// HALLAZGO (no arreglado aquí, ver reporte): ProfileCard.jsx accede a
// `currentUser.role`/`.email`/etc. sin ningún guard cuando no recibe
// `userProp` (línea 16: `const role = currentUser.role || "guest"`, con
// `currentUser = userProp || contextUser`). `AuthContext` arranca con
// `user: null` en su primer render síncrono (se resuelve recién en un
// `useEffect`), así que montar `<ProfileCard/>` sin `userProp` en ese primer
// tick -aunque haya un token válido en localStorage- lanza
// `TypeError: Cannot read properties of null (reading 'role')`, confirmado
// corriendo este mismo test sin el guard de abajo. En la app real esto no se
// observa porque el único caller real (`Profile.jsx`) siempre pasa
// `userProp`, y la ruta `/profile` está detrás de `ProtectedRoute`, que
// también retorna `null` mientras `loading` es `true` y solo renderiza a sus
// hijos una vez que `AuthContext` ya resolvió `user` — este `AuthGate` imita
// exactamente esa misma guarda para probar el caso del plan ("sin userProp
// -> usa el contexto") tal como se usa en producción, sin tocar
// ProfileCard.jsx.
function AuthGate({ children }) {
  const { loading } = useAuth();
  if (loading) return null;
  return children;
}

function renderCard(userProp, { authenticated = false } = {}) {
  if (authenticated) {
    localStorage.setItem(
      "authToken",
      makeToken({ userId: "u1", name: "Ana Context", role: "customer", exp: 9999999999 }),
    );
  }
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route
            path="/profile"
            element={
              <AuthGate>
                <ProfileCard userProp={userProp} />
              </AuthGate>
            }
          />
          <Route path="/settings" element={<div>pantalla de configuración</div>} />
          <Route path="/orders" element={<div>pantalla de pedidos</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test('happy: con userProp del backend se ve nombre, email, insignia "customer", "Activo" y última conexión formateada', () => {
  const lastLogin = "2026-01-15T10:00:00.000Z";
  renderCard({
    name: "Ana Pérez",
    email: "ana@mail.com",
    role: "customer",
    isActive: true,
    last_login: lastLogin,
  });

  expect(screen.getByRole("heading", { name: "Ana Pérez" })).toBeInTheDocument();
  expect(screen.getByText("ana@mail.com")).toBeInTheDocument();
  expect(screen.getByText("customer")).toBeInTheDocument();
  expect(screen.getByText("Activo")).toBeInTheDocument();
  expect(screen.getByText(new Date(lastLogin).toLocaleString())).toBeInTheDocument();
});

test("negativo: sin userProp -> usa el usuario del AuthContext", () => {
  renderCard(undefined, { authenticated: true });

  expect(screen.getByRole("heading", { name: "Ana Context" })).toBeInTheDocument();
  expect(screen.getByText("customer")).toBeInTheDocument();
});

test('negativo: usuario sin role -> la insignia muestra "guest"', () => {
  renderCard({ name: "Sin Rol", email: "sr@mail.com" });

  expect(screen.getByText("guest")).toBeInTheDocument();
});

test('negativo: usuario sin last_login -> "No disponible" (no "Invalid Date")', () => {
  renderCard({ name: "Sin Login", email: "sl@mail.com", role: "customer" });

  expect(screen.getByText("No disponible")).toBeInTheDocument();
  expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument();
});

test('negativo: isActive false -> "Inactivo"', () => {
  renderCard({ name: "Inactivo User", email: "iu@mail.com", role: "customer", isActive: false });

  expect(screen.getByText("Inactivo")).toBeInTheDocument();
});

test('negativo: acciones según rol - admin ve "Ver todos los pedidos" y no "Ver mis pedidos"', () => {
  renderCard({ name: "Admin", email: "admin@mail.com", role: "admin" });

  expect(screen.getByRole("button", { name: "Ver todos los pedidos" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Ver mis pedidos" })).not.toBeInTheDocument();
});

test('negativo: acciones según rol - customer ve "Ver mis pedidos" y no la variante admin', () => {
  renderCard({ name: "Cliente", email: "cliente@mail.com", role: "customer" });

  expect(screen.getByRole("button", { name: "Ver mis pedidos" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Ver todos los pedidos" })).not.toBeInTheDocument();
});

test('happy navegación: "Editar Perfil" navega a /settings; "Ver mis pedidos" navega a /orders', async () => {
  renderCard({ name: "Cliente", email: "cliente@mail.com", role: "customer" });

  await userEvent.click(screen.getByRole("button", { name: "Editar Perfil" }));
  expect(await screen.findByText("pantalla de configuración")).toBeInTheDocument();
});

test('happy navegación: "Ver mis pedidos" navega a /orders', async () => {
  renderCard({ name: "Cliente", email: "cliente@mail.com", role: "customer" });

  await userEvent.click(screen.getByRole("button", { name: "Ver mis pedidos" }));
  expect(await screen.findByText("pantalla de pedidos")).toBeInTheDocument();
});
