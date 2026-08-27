import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { rest } from "msw";
import { server } from "../../mocks/server";
import { AuthProvider } from "../../context/AuthContext";
import LoginForm from "./LoginForm";

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function renderLoginForm({ initialEntries = ["/login"] } = {}) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<div>pantalla de inicio</div>} />
          <Route path="/checkout" element={<div>pantalla de checkout</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
});

async function submitLogin(email, password) {
  userEvent.type(screen.getByLabelText(/email/i), email);
  userEvent.type(screen.getByLabelText(/contraseña/i), password);
  await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
}

test("happy: email y password correctos -> POST /api/auth/login 200 -> guarda sesión y navega a /", async () => {
  const token = makeToken({ userId: "u1", name: "Ana", role: "customer", exp: 9999999999 });
  server.use(
    rest.post("http://localhost:4001/api/auth/login", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ token, refreshToken: "r1" })),
    ),
  );

  renderLoginForm();
  await submitLogin("ana@mail.com", "secreto1");

  expect(await screen.findByText("pantalla de inicio")).toBeInTheDocument();
  expect(localStorage.getItem("authToken")).toBe(token);
});

test('happy redirect: con state.from = "/checkout" tras login se navega a /checkout, no a /', async () => {
  const token = makeToken({ userId: "u1", name: "Ana", role: "customer", exp: 9999999999 });
  server.use(
    rest.post("http://localhost:4001/api/auth/login", (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ token, refreshToken: "r1" })),
    ),
  );

  renderLoginForm({
    initialEntries: [{ pathname: "/login", state: { from: "/checkout" } }],
  });
  await submitLogin("ana@mail.com", "secreto1");

  expect(await screen.findByText("pantalla de checkout")).toBeInTheDocument();
});

test('happy justRegistered: con state {justRegistered:true, email} se ve el mensaje de éxito y el email precargado', async () => {
  renderLoginForm({
    initialEntries: [
      { pathname: "/login", state: { justRegistered: true, email: "a@b.com" } },
    ],
  });

  expect(
    await screen.findByText(
      "Cuenta creada exitosamente. Inicia sesión con tu email y contraseña",
    ),
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toHaveValue("a@b.com");
});

test('negativo: credenciales inválidas (401) -> "Email o contraseña incorrectos"', async () => {
  server.use(
    rest.post("http://localhost:4001/api/auth/login", (req, res, ctx) =>
      res(ctx.status(401), ctx.json({ message: "Credenciales inválidas" })),
    ),
  );

  renderLoginForm();
  await submitLogin("ana@mail.com", "mal-password");

  expect(
    await screen.findByText("Email o contraseña incorrectos"),
  ).toBeInTheDocument();
});

test('negativo: fallo de red -> "No pudimos conectar con el servidor. Revisa tu conexión a internet."', async () => {
  server.use(
    rest.post("http://localhost:4001/api/auth/login", (req, res) => res.networkError("fail")),
  );

  renderLoginForm();
  await submitLogin("ana@mail.com", "secreto1");

  expect(
    await screen.findByText(
      "No pudimos conectar con el servidor. Revisa tu conexión a internet.",
    ),
  ).toBeInTheDocument();
});

test('negativo: error del servidor (500) -> "Algo salió mal de nuestro lado. Intenta de nuevo en unos minutos."', async () => {
  server.use(
    rest.post("http://localhost:4001/api/auth/login", (req, res, ctx) =>
      res(ctx.status(500), ctx.json({ message: "boom" })),
    ),
  );

  renderLoginForm();
  await submitLogin("ana@mail.com", "secreto1");

  expect(
    await screen.findByText(
      "Algo salió mal de nuestro lado. Intenta de nuevo en unos minutos.",
    ),
  ).toBeInTheDocument();
});

test('negativo: durante la petición el botón está deshabilitado y dice "Iniciando sesión..."', async () => {
  const token = makeToken({ userId: "u1", name: "Ana", role: "customer", exp: 9999999999 });
  server.use(
    rest.post("http://localhost:4001/api/auth/login", (req, res, ctx) =>
      res(ctx.delay(50), ctx.status(200), ctx.json({ token, refreshToken: "y" })),
    ),
  );

  renderLoginForm();
  userEvent.type(screen.getByLabelText(/email/i), "ana@mail.com");
  userEvent.type(screen.getByLabelText(/contraseña/i), "secreto1");
  await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

  const button = await screen.findByRole("button", { name: /iniciando sesión/i });
  expect(button).toBeDisabled();

  // Dejamos que la petición termine para no arrastrar un update fuera de
  // act() al siguiente test.
  await screen.findByText("pantalla de inicio");
});
