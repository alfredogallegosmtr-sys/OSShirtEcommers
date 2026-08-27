import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function renderAt(path, { allowedRoles } = {}) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>pantalla de login</div>} />
          <Route
            path="/protegida"
            element={
              <ProtectedRoute allowedRoles={allowedRoles}>
                <div>contenido protegido</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test("happy: usuario autenticado sin allowedRoles -> se renderiza el contenido hijo", async () => {
  localStorage.setItem(
    "authToken",
    makeToken({ userId: "u1", name: "Ana", role: "customer", exp: 9999999999 }),
  );

  renderAt("/protegida");

  expect(await screen.findByText("contenido protegido")).toBeInTheDocument();
});

test("negativo: no autenticado -> redirige a /login (redirectTo por defecto) y no aparece el hijo", async () => {
  renderAt("/protegida");

  expect(await screen.findByText("pantalla de login")).toBeInTheDocument();
  expect(screen.queryByText("contenido protegido")).not.toBeInTheDocument();
});

test("negativo: rol no permitido -> muestra Acceso denegado y no el hijo", async () => {
  localStorage.setItem(
    "authToken",
    makeToken({ userId: "u1", name: "Ana", role: "customer", exp: 9999999999 }),
  );

  renderAt("/protegida", { allowedRoles: ["admin"] });

  expect(await screen.findByText("Acceso denegado")).toBeInTheDocument();
  expect(
    screen.getByText("No tienes permisos para acceder a esta página."),
  ).toBeInTheDocument();
  expect(screen.queryByText("contenido protegido")).not.toBeInTheDocument();
});

// NOTA (no automatizado): el caso "mientras el auth está cargando no se
// renderiza el hijo ni se redirige" no se pudo automatizar de forma fiable.
// `AuthContext`'s useEffect que resuelve `loading` es 100% síncrono
// (getToken/isTokenExpired/decodeToken no hacen I/O), y `@testing-library/
// react`'s `render()` envuelve el montaje inicial en `act()`, que flushea los
// efectos pendientes antes de devolver el control al test — para cuando la
// primera aserción corre, `loading` ya pasó a `false`. No hay una forma
// confiable (sin mockear el propio AuthContext, fuera del alcance de "solo
// interceptar con MSW") de observar ese estado intermedio con este stack.
