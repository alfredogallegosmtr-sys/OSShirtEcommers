import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { rest } from "msw";
import { server } from "../../mocks/server";
import RegisterForm from "./RegisterForm";

function renderRegisterForm() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<div>pantalla de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillValidForm() {
  userEvent.type(screen.getByLabelText(/nombre completo/i), "Ana Pérez");
  userEvent.type(screen.getByLabelText(/^email/i), "ana@mail.com");
  userEvent.type(screen.getByLabelText(/^contraseña/i), "secreto1");
  userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "secreto1");
}

test("happy: formulario válido -> POST /api/auth/register 201 -> navega a /login con mensaje y email precargado", async () => {
  server.use(
    rest.post("http://localhost:4001/api/auth/register", (req, res, ctx) =>
      res(ctx.status(201), ctx.json({ id: "1", name: "Ana Pérez", email: "ana@mail.com" })),
    ),
  );

  renderRegisterForm();
  fillValidForm();

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(await screen.findByText("pantalla de login")).toBeInTheDocument();
});

test("negativo: nombre vacío -> 'El nombre es requerido' y no se emite la petición", async () => {
  let called = false;
  server.use(
    rest.post("http://localhost:4001/api/auth/register", (req, res, ctx) => {
      called = true;
      return res(ctx.status(201), ctx.json({}));
    }),
  );

  renderRegisterForm();
  userEvent.type(screen.getByLabelText(/^email/i), "ana@mail.com");
  userEvent.type(screen.getByLabelText(/^contraseña/i), "secreto1");
  userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "secreto1");

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(await screen.findByText("El nombre es requerido")).toBeInTheDocument();
  expect(called).toBe(false);
});

test('negativo: nombre de 1 caracter -> "El nombre debe de tener al menos dos caracteres"', async () => {
  renderRegisterForm();
  userEvent.type(screen.getByLabelText(/nombre completo/i), "A");
  userEvent.type(screen.getByLabelText(/^email/i), "ana@mail.com");
  userEvent.type(screen.getByLabelText(/^contraseña/i), "secreto1");
  userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "secreto1");

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(
    await screen.findByText("El nombre debe de tener al menos dos caracteres"),
  ).toBeInTheDocument();
});

test("negativo: email vacío -> 'El email es requerido'", async () => {
  renderRegisterForm();
  userEvent.type(screen.getByLabelText(/nombre completo/i), "Ana Pérez");
  userEvent.type(screen.getByLabelText(/^contraseña/i), "secreto1");
  userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "secreto1");

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(await screen.findByText("El email es requerido")).toBeInTheDocument();
});

test('negativo: formato de email inválido ("pepe@") -> "El email no tiene un formato válido"', async () => {
  renderRegisterForm();
  userEvent.type(screen.getByLabelText(/nombre completo/i), "Ana Pérez");
  userEvent.type(screen.getByLabelText(/^email/i), "pepe@");
  userEvent.type(screen.getByLabelText(/^contraseña/i), "secreto1");
  userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "secreto1");

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(
    await screen.findByText("El email no tiene un formato válido"),
  ).toBeInTheDocument();
});

test("negativo: password vacío -> 'El password es requerido'", async () => {
  renderRegisterForm();
  userEvent.type(screen.getByLabelText(/nombre completo/i), "Ana Pérez");
  userEvent.type(screen.getByLabelText(/^email/i), "ana@mail.com");

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(await screen.findByText("El password es requerido")).toBeInTheDocument();
});

test('negativo: password de 5 caracteres -> "El password debe de tener al menos 6 caracteres"', async () => {
  renderRegisterForm();
  userEvent.type(screen.getByLabelText(/nombre completo/i), "Ana Pérez");
  userEvent.type(screen.getByLabelText(/^email/i), "ana@mail.com");
  userEvent.type(screen.getByLabelText(/^contraseña/i), "12345");
  userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "12345");

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(
    await screen.findByText("El password debe de tener al menos 6 caracteres"),
  ).toBeInTheDocument();
});

test('negativo: confirmación distinta -> "Las contraseñas no coinciden"', async () => {
  renderRegisterForm();
  userEvent.type(screen.getByLabelText(/nombre completo/i), "Ana Pérez");
  userEvent.type(screen.getByLabelText(/^email/i), "ana@mail.com");
  userEvent.type(screen.getByLabelText(/^contraseña/i), "secreto1");
  userEvent.type(screen.getByLabelText(/confirmar contraseña/i), "otra-cosa");

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(await screen.findByText("Las contraseñas no coinciden")).toBeInTheDocument();
});

test('negativo: teléfono con formato inválido ("abc") -> "El teléfono no tiene un formato válido"; vacío no produce error', async () => {
  renderRegisterForm();
  fillValidForm();
  userEvent.type(screen.getByLabelText(/teléfono/i), "abc");

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(
    await screen.findByText("El teléfono no tiene un formato válido"),
  ).toBeInTheDocument();
});

test("negativo: al escribir en un campo con error, su mensaje desaparece", async () => {
  renderRegisterForm();

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));
  expect(await screen.findByText("El nombre es requerido")).toBeInTheDocument();

  userEvent.type(screen.getByLabelText(/nombre completo/i), "A");

  await waitFor(() =>
    expect(screen.queryByText("El nombre es requerido")).not.toBeInTheDocument(),
  );
});

test('negativo: email ya registrado -> 422 {message:"User already exist"} -> "Este email ya está registrado" en el campo email', async () => {
  server.use(
    rest.post("http://localhost:4001/api/auth/register", (req, res, ctx) =>
      res(ctx.status(422), ctx.json({ message: "User already exist" })),
    ),
  );

  renderRegisterForm();
  fillValidForm();

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(
    await screen.findByText("Este email ya está registrado"),
  ).toBeInTheDocument();
});

test("negativo: fallo de red -> se ve el mensaje de RegisterErrorMessage para NETWORK", async () => {
  server.use(
    rest.post("http://localhost:4001/api/auth/register", (req, res) => res.networkError("fail")),
  );

  renderRegisterForm();
  fillValidForm();

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  expect(
    await screen.findByText(
      "No pudimos conectar con el servidor. Revisa tu conexión a internet.",
    ),
  ).toBeInTheDocument();
});

test('negativo: durante el envío el botón se deshabilita y dice "Creando cuenta..."', async () => {
  server.use(
    rest.post("http://localhost:4001/api/auth/register", (req, res, ctx) =>
      res(ctx.delay(50), ctx.status(201), ctx.json({})),
    ),
  );

  renderRegisterForm();
  fillValidForm();

  await userEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

  const button = await screen.findByRole("button", { name: /creando cuenta/i });
  expect(button).toBeDisabled();
});
