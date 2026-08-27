import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { server } from "../mocks/server";
import { AuthProvider, useAuth } from "./AuthContext";

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function Consumer() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();

  if (loading) return <div>cargando</div>;

  return (
    <div>
      <div data-testid="status">
        {isAuthenticated ? `logueado:${user.name}:${user.role}` : "invitado"}
      </div>
      <button
        onClick={() =>
          login({ email: "a@b.com", password: "secreto" }).catch((err) => {
            window.__consumerLoginError = err;
          })
        }
      >
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

test("happy: authToken válido y vigente -> isAuthenticated true con userId/name/role del payload", async () => {
  const token = makeToken({ userId: "u1", name: "Rodrigo", role: "admin", exp: 9999999999 });
  localStorage.setItem("authToken", token);

  renderWithProvider();

  expect(await screen.findByTestId("status")).toHaveTextContent(
    "logueado:Rodrigo:admin",
  );
});

test("negativo: sin token en localStorage -> invitado tras terminar loading", async () => {
  renderWithProvider();

  expect(await screen.findByTestId("status")).toHaveTextContent("invitado");
});

test("negativo: token expirado -> se elimina de localStorage y queda como invitado", async () => {
  const token = makeToken({ userId: "u1", name: "Rodrigo", role: "admin", exp: 1 });
  localStorage.setItem("authToken", token);

  renderWithProvider();

  expect(await screen.findByTestId("status")).toHaveTextContent("invitado");
  expect(localStorage.getItem("authToken")).toBeNull();
});

test("negativo: token indecodificable ('basura') -> se limpia, no lanza y no queda en loading permanente", async () => {
  localStorage.setItem("authToken", "basura");

  renderWithProvider();

  expect(await screen.findByTestId("status")).toHaveTextContent("invitado");
});

test("happy login: POST /api/auth/login 200 guarda el token y expone el usuario decodificado", async () => {
  const token = makeToken({ userId: "u2", name: "Ana", role: "customer", exp: 9999999999 });
  server.use(
    rest.post("http://localhost:4001/api/auth/login", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ token, refreshToken: "refresh-1" })),
    ),
  );

  renderWithProvider();
  await screen.findByText("login");

  await userEvent.click(screen.getByText("login"));

  await waitFor(() => {
    if (window.__consumerLoginError) throw window.__consumerLoginError;
    expect(screen.getByTestId("status")).toHaveTextContent("logueado:Ana:customer");
  });
  expect(localStorage.getItem("authToken")).toBe(token);
  delete window.__consumerLoginError;
});

test("negativo: credenciales inválidas (401) -> login() rechaza con kind UNAUTHORIZED, sigue sin autenticar", async () => {
  server.use(
    rest.post("http://localhost:4001/api/auth/login", (req, res, ctx) =>
      res(ctx.status(401), ctx.json({ message: "Credenciales inválidas" })),
    ),
  );

  let TestComponent = function () {
    const { login, isAuthenticated } = useAuth();
    return (
      <div>
        <div data-testid="status">{isAuthenticated ? "logueado" : "invitado"}</div>
        <button
          onClick={async () => {
            try {
              await login({ email: "a@b.com", password: "mal" });
            } catch (err) {
              window.__loginError = err;
            }
          }}
        >
          login
        </button>
      </div>
    );
  };

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>,
  );
  await screen.findByText("login");

  await userEvent.click(screen.getByText("login"));

  await waitFor(() => expect(window.__loginError).toBeDefined());
  expect(window.__loginError.kind).toBe("UNAUTHORIZED");
  expect(screen.getByTestId("status")).toHaveTextContent("invitado");
  delete window.__loginError;
});

test("negativo: login 200 con token no decodificable -> lanza 'Token inválido del backend' y sigue como invitado", async () => {
  server.use(
    rest.post("http://localhost:4001/api/auth/login", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ token: "abc", refreshToken: "r" })),
    ),
  );

  function TestComponent() {
    const { login, isAuthenticated } = useAuth();
    return (
      <div>
        <div data-testid="status">{isAuthenticated ? "logueado" : "invitado"}</div>
        <button
          onClick={async () => {
            try {
              await login({ email: "a@b.com", password: "x" });
            } catch (err) {
              window.__loginError2 = err;
            }
          }}
        >
          login
        </button>
      </div>
    );
  }

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>,
  );
  await screen.findByText("login");
  await userEvent.click(screen.getByText("login"));

  await waitFor(() => expect(window.__loginError2).toBeDefined());
  expect(window.__loginError2.message).toBe("Token inválido del backend");
  expect(screen.getByTestId("status")).toHaveTextContent("invitado");
  delete window.__loginError2;
});

test("negativo: logout limpia authToken de localStorage y vuelve a invitado", async () => {
  const token = makeToken({ userId: "u1", name: "Rodrigo", role: "admin", exp: 9999999999 });
  localStorage.setItem("authToken", token);

  renderWithProvider();
  expect(await screen.findByTestId("status")).toHaveTextContent("logueado:Rodrigo:admin");

  await userEvent.click(screen.getByText("logout"));

  expect(screen.getByTestId("status")).toHaveTextContent("invitado");
  expect(localStorage.getItem("authToken")).toBeNull();
});

test("negativo: sesión cerrada en otra pestaña (StorageEvent authToken=null) -> pasa a invitado sin recargar", async () => {
  const token = makeToken({ userId: "u1", name: "Rodrigo", role: "admin", exp: 9999999999 });
  localStorage.setItem("authToken", token);

  renderWithProvider();
  expect(await screen.findByTestId("status")).toHaveTextContent("logueado:Rodrigo:admin");

  act(() => {
    window.dispatchEvent(
      new StorageEvent("storage", { key: "authToken", newValue: null }),
    );
  });

  expect(screen.getByTestId("status")).toHaveTextContent("invitado");
});

test("negativo: useAuth() fuera de <AuthProvider> lanza el error esperado", () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  function Broken() {
    useAuth();
    return null;
  }
  expect(() => render(<Broken />)).toThrow(
    "useAuth debe usarse dentro de <AuthProvider>",
  );
  consoleError.mockRestore();
});
